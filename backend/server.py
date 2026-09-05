from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends, Header
from fastapi.responses import StreamingResponse, RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import httpx
import stripe
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from urllib.parse import quote, urlparse
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Stripe configuration
stripe.api_key = os.environ.get('STRIPE_API_KEY', os.environ.get('STRIPE_SECRET_KEY', ''))
STRIPE_BLOSSOM_PRICE_ID = os.environ.get('STRIPE_BLOSSOM_PRICE_ID', '')
STRIPE_GROVE_PRICE_ID = os.environ.get('STRIPE_GROVE_PRICE_ID', '')
# Backwards-compat: legacy STRIPE_PREMIUM_PRICE_ID maps to Blossom
STRIPE_PREMIUM_PRICE_ID = os.environ.get('STRIPE_PREMIUM_PRICE_ID', STRIPE_BLOSSOM_PRICE_ID)
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', '')
PUBLIC_API_URL = os.environ.get('PUBLIC_API_URL', 'https://beautify-yourself.preview.emergentagent.com')

# Emergent Auth
EMERGENT_AUTH_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI()
app.state.limiter = limiter

api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ==================== INDEXES ====================
@app.on_event("startup")
async def create_indexes():
    try:
        await db.users.create_index("email", unique=True)
        await db.users.create_index("user_id", unique=True)
        await db.user_sessions.create_index("session_token", unique=True)
        await db.user_sessions.create_index("user_id")
        await db.user_sessions.create_index("expires_at", expireAfterSeconds=0)
        await db.stripe_events.create_index("event_id", unique=True)
        # Drop legacy ai_usage(user_id, date) unique index if it exists — new schema
        # uses (user_id, period_type, period_key) and the old index would treat all
        # new docs as date=null and cause DuplicateKeyError on the 2nd bucket insert.
        try:
            existing = await db.ai_usage.index_information()
            if "user_id_1_date_1" in existing:
                await db.ai_usage.drop_index("user_id_1_date_1")
                logger.info("Dropped legacy ai_usage index user_id_1_date_1")
        except Exception as ie:
            logger.warning(f"Legacy ai_usage index cleanup skipped: {ie}")
        await db.ai_usage.create_index([("user_id", 1), ("period_type", 1), ("period_key", 1)], unique=True)
        logger.info("MongoDB indexes created")
    except Exception as e:
        logger.warning(f"Index creation warning: {e}")


# ==================== MODELS ====================

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    email: str
    name: Optional[str] = None
    picture: Optional[str] = None
    is_admin: bool = False
    subscription_tier: str = "free"  # 'free' or 'premium'
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SessionCreate(BaseModel):
    session_token: str

# Content models with user_id
class MoodEntryCreate(BaseModel):
    mood: str
    color: str

class JournalEntryCreate(BaseModel):
    text: str

class LifeNoteCreate(BaseModel):
    text: str

class TaskCreate(BaseModel):
    text: str
    priority: str

class TaskUpdate(BaseModel):
    completed: Optional[bool] = None

class AffirmationCreate(BaseModel):
    text: str

class FeedbackCreate(BaseModel):
    text: str

class DeclutterStateUpdate(BaseModel):
    items: dict

class UserStatsUpdate(BaseModel):
    affirmation_streak: Optional[int] = None
    last_affirmation_date: Optional[str] = None

class AIResetRequest(BaseModel):
    mood: str

class AIAffirmationRequest(BaseModel):
    theme: Optional[str] = None  # e.g., "confidence", "healing", "abundance"

class AIModerationRequest(BaseModel):
    text: str

class CheckoutRequest(BaseModel):
    return_to: str
    tier: Optional[str] = "blossom"  # 'blossom' or 'grove'

class AdminUpdateUserRequest(BaseModel):
    is_admin: Optional[bool] = None
    subscription_tier: Optional[str] = None


# ==================== AUTH DEPENDENCY ====================

async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """Extract user from Bearer token; raise 401 if invalid."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.replace("Bearer ", "").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")

    # Normalize expires_at to timezone-aware
    expires_at = session.get("expires_at")
    if expires_at:
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=401, detail="Session expired")

    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    """Require user to be admin."""
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


async def require_premium(user: dict = Depends(get_current_user)) -> dict:
    """Require user to have blossom or grove subscription (or admin)."""
    tier = _normalized_tier(user)
    if tier not in {"blossom", "grove"} and not user.get("is_admin"):
        raise HTTPException(status_code=402, detail="Premium subscription required")
    return user


async def require_grove(user: dict = Depends(get_current_user)) -> dict:
    """Require Sacred Grove tier (or admin)."""
    tier = _normalized_tier(user)
    if tier != "grove" and not user.get("is_admin"):
        raise HTTPException(status_code=402, detail="Sacred Grove tier required")
    return user


# ==================== TIER + AI QUOTA HELPERS ====================
#
# 🌱 Sanctuary Seed  (free)    → Welcome Week: 7 days unlimited AI
#                                  After: 3 AI/week (resets Monday 00:00 UTC)
# 🌸 Blossom Circle ($4.99)    → 30 AI/month (resets 1st of month UTC)
# 🦋 Sacred Grove   ($14.99)   → Unlimited AI
# 👑 Admin                      → Unlimited AI

FREE_WEEKLY_AI_LIMIT = 3
BLOSSOM_MONTHLY_AI_LIMIT = 30
WELCOME_WEEK_DAYS = 7

def _normalized_tier(user: dict) -> str:
    """Return one of: free, blossom, grove. Migrate legacy 'premium' → 'blossom'."""
    t = (user.get("subscription_tier") or "free").lower()
    if t == "premium":
        return "blossom"
    if t in {"free", "blossom", "grove"}:
        return t
    return "free"

def _is_in_welcome_week(user: dict) -> bool:
    """True if user is still within their 7-day Welcome Week."""
    start = user.get("welcome_week_start")
    if not start:
        return False
    if isinstance(start, str):
        try:
            start = datetime.fromisoformat(start)
        except Exception:
            return False
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    return datetime.now(timezone.utc) < start + timedelta(days=WELCOME_WEEK_DAYS)

def _welcome_week_days_left(user: dict) -> Optional[int]:
    """Number of full days remaining in Welcome Week, or None if not active."""
    start = user.get("welcome_week_start")
    if not start:
        return None
    if isinstance(start, str):
        try:
            start = datetime.fromisoformat(start)
        except Exception:
            return None
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    end = start + timedelta(days=WELCOME_WEEK_DAYS)
    now = datetime.now(timezone.utc)
    if now >= end:
        return 0
    delta = end - now
    return max(0, delta.days + (1 if delta.seconds > 0 else 0))

def _current_week_key() -> str:
    """ISO week key like '2026-W23' for weekly quota buckets."""
    now = datetime.now(timezone.utc)
    year, week, _ = now.isocalendar()
    return f"{year}-W{week:02d}"

def _current_month_key() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m")

async def _get_weekly_ai_usage(user_id: str) -> int:
    doc = await db.ai_usage.find_one(
        {"user_id": user_id, "period_type": "week", "period_key": _current_week_key()},
        {"_id": 0, "count": 1},
    )
    return int(doc.get("count", 0)) if doc else 0

async def _get_monthly_ai_usage(user_id: str) -> int:
    doc = await db.ai_usage.find_one(
        {"user_id": user_id, "period_type": "month", "period_key": _current_month_key()},
        {"_id": 0, "count": 1},
    )
    return int(doc.get("count", 0)) if doc else 0

async def _increment_ai_usage_all_buckets(user_id: str) -> None:
    """Increment both weekly and monthly usage counters."""
    now = datetime.now(timezone.utc)
    for period_type, period_key in [("week", _current_week_key()), ("month", _current_month_key())]:
        await db.ai_usage.update_one(
            {"user_id": user_id, "period_type": period_type, "period_key": period_key},
            {"$inc": {"count": 1}, "$set": {"updated_at": now}},
            upsert=True,
        )

async def _quota_state(user: dict) -> dict:
    """
    Compute the caller's current AI quota state without incrementing.
    Returns:
      {
        tier: 'free'|'blossom'|'grove',
        unlimited: bool,
        welcome_week_active: bool,
        welcome_week_days_left: int|None,
        used_this_week: int|None,
        weekly_limit: int|None,
        weekly_remaining: int|None,
        used_this_month: int|None,
        monthly_limit: int|None,
        monthly_remaining: int|None,
        reason: str,   # human readable current-state reason
      }
    """
    tier = _normalized_tier(user)
    is_admin = bool(user.get("is_admin"))
    in_welcome = _is_in_welcome_week(user)
    days_left = _welcome_week_days_left(user) if in_welcome else None
    unlimited = is_admin or tier == "grove" or in_welcome

    state = {
        "tier": tier,
        "is_admin": is_admin,
        "unlimited": unlimited,
        "welcome_week_active": in_welcome,
        "welcome_week_days_left": days_left,
        "used_this_week": None,
        "weekly_limit": None,
        "weekly_remaining": None,
        "used_this_month": None,
        "monthly_limit": None,
        "monthly_remaining": None,
        "reason": "",
    }

    if unlimited:
        if is_admin:
            state["reason"] = "Admin · unlimited"
        elif in_welcome:
            state["reason"] = f"Welcome Week · {days_left} day(s) left of unlimited AI"
        else:
            state["reason"] = "Sacred Grove · unlimited"
        return state

    if tier == "free":
        used_w = await _get_weekly_ai_usage(user["user_id"])
        state["used_this_week"] = used_w
        state["weekly_limit"] = FREE_WEEKLY_AI_LIMIT
        state["weekly_remaining"] = max(0, FREE_WEEKLY_AI_LIMIT - used_w)
        state["reason"] = f"Sanctuary Seed · {state['weekly_remaining']}/{FREE_WEEKLY_AI_LIMIT} AI this week"
    elif tier == "blossom":
        used_m = await _get_monthly_ai_usage(user["user_id"])
        state["used_this_month"] = used_m
        state["monthly_limit"] = BLOSSOM_MONTHLY_AI_LIMIT
        state["monthly_remaining"] = max(0, BLOSSOM_MONTHLY_AI_LIMIT - used_m)
        state["reason"] = f"Blossom Circle · {state['monthly_remaining']}/{BLOSSOM_MONTHLY_AI_LIMIT} AI this month"
    return state

async def enforce_ai_quota(user: dict = Depends(get_current_user)) -> dict:
    """
    Enforce and increment AI quota per the tier rules above.
    Raises 429 if the caller has no allowance left.
    """
    state = await _quota_state(user)
    if not state["unlimited"]:
        if state["tier"] == "free" and (state["weekly_remaining"] or 0) <= 0:
            raise HTTPException(
                status_code=429,
                detail=(
                    f"You've used your {FREE_WEEKLY_AI_LIMIT} weekly AI resets. "
                    f"Refills Monday, or upgrade to keep flowing."
                ),
            )
        if state["tier"] == "blossom" and (state["monthly_remaining"] or 0) <= 0:
            raise HTTPException(
                status_code=429,
                detail=(
                    f"You've used all {BLOSSOM_MONTHLY_AI_LIMIT} of this month's Blossom Circle AI responses. "
                    f"Upgrade to Sacred Grove for unlimited."
                ),
            )
    await _increment_ai_usage_all_buckets(user["user_id"])
    return user


async def _run_claude(system_message: str, prompt: str, session_prefix: str, user_id: str) -> str:
    """Non-streaming Claude Sonnet 5 call. Returns full text response."""
    emergent_llm_key = os.getenv("EMERGENT_LLM_KEY")
    if not emergent_llm_key:
        raise HTTPException(status_code=500, detail="AI service not configured")

    chat = LlmChat(
        api_key=emergent_llm_key,
        session_id=f"{session_prefix}_{user_id}_{uuid.uuid4().hex[:8]}",
        system_message=system_message,
    ).with_model("anthropic", "claude-sonnet-5")

    full_text = ""
    try:
        async for event in chat.stream_message(UserMessage(text=prompt)):
            if isinstance(event, TextDelta):
                full_text += event.content
            elif isinstance(event, StreamDone):
                break
    except Exception as e:
        logger.error(f"Claude call failed: {e}")
        raise HTTPException(status_code=500, detail="AI generation failed")
    return full_text.strip()


# ==================== AUTH ROUTES ====================

@api_router.post("/auth/session")
async def create_session(payload: SessionCreate):
    """Exchange session_token from Emergent OAuth for a stored session."""
    async with httpx.AsyncClient() as http_client:
        try:
            resp = await http_client.get(
                EMERGENT_AUTH_URL,
                headers={"X-Session-ID": payload.session_token},
                timeout=15.0,
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session token")
            data = resp.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"Auth service error: {e}")

    email = data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="No email in auth response")

    # Upsert user
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    now = datetime.now(timezone.utc)

    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"email": email},
            {"$set": {
                "name": data.get("name") or existing.get("name"),
                "picture": data.get("picture") or existing.get("picture"),
            }},
        )
    else:
        # First user becomes admin
        user_count = await db.users.count_documents({})
        is_first_user = user_count == 0

        user_id = f"user_{uuid.uuid4().hex[:12]}"
        new_user = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "email": email,
            "name": data.get("name"),
            "picture": data.get("picture"),
            "is_admin": is_first_user,  # First user is super-admin
            "subscription_tier": "grove" if is_first_user else "free",
            "created_at": now,
        }
        await db.users.insert_one(new_user)
        logger.info(f"Created new user {email} (admin={is_first_user})")

    # Create session
    session_data = {
        "id": str(uuid.uuid4()),
        "session_token": data.get("session_token") or payload.session_token,
        "user_id": user_id,
        "expires_at": now + timedelta(days=7),
        "created_at": now,
    }
    await db.user_sessions.insert_one(session_data)

    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {
        "session_token": session_data["session_token"],
        "user": user,
    }


@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user


@api_router.post("/auth/logout")
async def logout(authorization: Optional[str] = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "").strip()
        await db.user_sessions.delete_one({"session_token": token})
    return {"success": True}


# ==================== ROOT ====================

@api_router.get("/")
async def root():
    return {"message": "Beautify Yourself & Beyond API"}


# ==================== MOOD (user-scoped) ====================

@api_router.post("/mood")
async def create_mood_entry(input: MoodEntryCreate, user: dict = Depends(get_current_user)):
    mood_obj = {
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "mood": input.mood,
        "color": input.color,
        "timestamp": datetime.now(timezone.utc),
    }
    await db.mood_history.insert_one(mood_obj)
    return {k: v for k, v in mood_obj.items() if k != "_id"}

@api_router.get("/mood")
async def get_mood_history(user: dict = Depends(get_current_user)):
    moods = await db.mood_history.find({"user_id": user["user_id"]}, {"_id": 0}).sort("timestamp", -1).limit(14).to_list(14)
    return moods


# ==================== JOURNAL (user-scoped) ====================

@api_router.post("/journal")
async def create_journal_entry(input: JournalEntryCreate, user: dict = Depends(get_current_user)):
    time_str = datetime.now().strftime("%b %d, %Y, %I:%M %p")
    entry = {
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "text": input.text,
        "time": time_str,
        "timestamp": datetime.now(timezone.utc),
    }
    await db.journal_entries.insert_one(entry)
    return {k: v for k, v in entry.items() if k != "_id"}

@api_router.get("/journal")
async def get_journal_entries(user: dict = Depends(get_current_user)):
    entries = await db.journal_entries.find({"user_id": user["user_id"]}, {"_id": 0}).sort("timestamp", -1).to_list(1000)
    return entries

@api_router.delete("/journal/{entry_id}")
async def delete_journal_entry(entry_id: str, user: dict = Depends(get_current_user)):
    result = await db.journal_entries.delete_one({"id": entry_id, "user_id": user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"message": "Entry deleted"}


# ==================== LIFE NOTES (user-scoped) ====================

@api_router.post("/notes")
async def create_life_note(input: LifeNoteCreate, user: dict = Depends(get_current_user)):
    note = {
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "text": input.text,
        "timestamp": datetime.now(timezone.utc),
    }
    await db.life_notes.insert_one(note)
    return {k: v for k, v in note.items() if k != "_id"}

@api_router.get("/notes")
async def get_life_notes(user: dict = Depends(get_current_user)):
    notes = await db.life_notes.find({"user_id": user["user_id"]}, {"_id": 0}).sort("timestamp", -1).to_list(1000)
    return notes

@api_router.delete("/notes/{note_id}")
async def delete_life_note(note_id: str, user: dict = Depends(get_current_user)):
    result = await db.life_notes.delete_one({"id": note_id, "user_id": user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"message": "Note deleted"}


# ==================== TASKS (user-scoped, PREMIUM) ====================

@api_router.post("/tasks")
async def create_task(input: TaskCreate, user: dict = Depends(require_premium)):
    task = {
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "text": input.text,
        "priority": input.priority,
        "completed": False,
        "timestamp": datetime.now(timezone.utc),
    }
    await db.tasks.insert_one(task)
    return {k: v for k, v in task.items() if k != "_id"}

@api_router.get("/tasks")
async def get_tasks(user: dict = Depends(require_premium)):
    tasks = await db.tasks.find({"user_id": user["user_id"]}, {"_id": 0}).sort("timestamp", -1).to_list(1000)
    return tasks

@api_router.patch("/tasks/{task_id}")
async def update_task(task_id: str, input: TaskUpdate, user: dict = Depends(require_premium)):
    update_data = {k: v for k, v in input.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data")

    result = await db.tasks.update_one(
        {"id": task_id, "user_id": user["user_id"]},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    task = await db.tasks.find_one({"id": task_id, "user_id": user["user_id"]}, {"_id": 0})
    return task

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, user: dict = Depends(require_premium)):
    result = await db.tasks.delete_one({"id": task_id, "user_id": user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted"}


# ==================== AFFIRMATIONS (user-scoped, PREMIUM) ====================

@api_router.post("/affirmations")
async def create_affirmation(input: AffirmationCreate, user: dict = Depends(require_premium)):
    affirmation = {
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "text": input.text,
        "timestamp": datetime.now(timezone.utc),
    }
    await db.affirmations.insert_one(affirmation)
    return {k: v for k, v in affirmation.items() if k != "_id"}

@api_router.get("/affirmations")
async def get_affirmations(user: dict = Depends(require_premium)):
    affirmations = await db.affirmations.find({"user_id": user["user_id"]}, {"_id": 0}).sort("timestamp", -1).to_list(1000)
    return affirmations

@api_router.delete("/affirmations/{affirmation_id}")
async def delete_affirmation(affirmation_id: str, user: dict = Depends(require_premium)):
    result = await db.affirmations.delete_one({"id": affirmation_id, "user_id": user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Affirmation not found")
    return {"message": "Affirmation deleted"}


# ==================== FEEDBACK (user-scoped) ====================

@api_router.post("/feedback")
async def create_feedback(input: FeedbackCreate, user: dict = Depends(get_current_user)):
    time_str = datetime.now().strftime("%b %d, %Y, %I:%M %p")
    feedback_obj = {
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "user_email": user.get("email"),
        "text": input.text,
        "time": time_str,
        "timestamp": datetime.now(timezone.utc),
    }
    await db.feedback.insert_one(feedback_obj)
    return {k: v for k, v in feedback_obj.items() if k != "_id"}

@api_router.get("/feedback")
async def get_feedback(user: dict = Depends(get_current_user)):
    # Users see their own feedback
    feedback = await db.feedback.find({"user_id": user["user_id"]}, {"_id": 0}).sort("timestamp", -1).to_list(1000)
    return feedback


# ==================== DECLUTTER (user-scoped, PREMIUM) ====================

@api_router.get("/declutter")
async def get_declutter_state(user: dict = Depends(require_premium)):
    state = await db.declutter_state.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not state:
        return {"items": {}}
    return {"items": state.get("items", {})}

@api_router.put("/declutter")
async def update_declutter_state(input: DeclutterStateUpdate, user: dict = Depends(require_premium)):
    await db.declutter_state.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"items": input.items, "timestamp": datetime.now(timezone.utc)}},
        upsert=True
    )
    return {"items": input.items}


# ==================== USER STATS (user-scoped, PREMIUM) ====================

@api_router.get("/stats")
async def get_user_stats(user: dict = Depends(require_premium)):
    stats = await db.user_stats.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not stats:
        return {"affirmation_streak": 0, "last_affirmation_date": None}
    return {
        "affirmation_streak": stats.get("affirmation_streak", 0),
        "last_affirmation_date": stats.get("last_affirmation_date"),
    }

@api_router.patch("/stats")
async def update_user_stats(input: UserStatsUpdate, user: dict = Depends(require_premium)):
    update_data = {k: v for k, v in input.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data")

    update_data["timestamp"] = datetime.now(timezone.utc)

    await db.user_stats.update_one(
        {"user_id": user["user_id"]},
        {"$set": update_data},
        upsert=True
    )
    stats = await db.user_stats.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return {
        "affirmation_streak": stats.get("affirmation_streak", 0),
        "last_affirmation_date": stats.get("last_affirmation_date"),
    }


# ==================== AI (Claude Sonnet 5 · Free 3/day, Premium unlimited) ====================

@api_router.get("/ai/usage")
async def get_ai_usage(user: dict = Depends(get_current_user)):
    """Return the caller's current AI quota state (tier, welcome week, weekly/monthly usage)."""
    return await _quota_state(user)


@api_router.post("/user/start-welcome-week")
async def start_welcome_week(user: dict = Depends(get_current_user)):
    """
    Opt-in activation of Welcome Week (7 days unlimited AI).
    Can only be activated once per account.
    """
    if user.get("welcome_week_start"):
        raise HTTPException(status_code=409, detail="Welcome Week has already been started for this account.")
    now = datetime.now(timezone.utc)
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"welcome_week_start": now}},
    )
    updated = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    state = await _quota_state(updated)
    return {"user": updated, "quota": state}


@api_router.post("/ai/reset")
@limiter.limit("30/hour")
async def generate_ai_reset(request: Request, input: AIResetRequest, user: dict = Depends(enforce_ai_quota)):
    """Streaming Claude Sonnet 5 somatic reset. Free 3/day, Premium unlimited."""
    emergent_llm_key = os.getenv("EMERGENT_LLM_KEY")
    if not emergent_llm_key:
        raise HTTPException(status_code=500, detail="AI service not configured")

    chat = LlmChat(
        api_key=emergent_llm_key,
        session_id=f"reset_{user['user_id']}_{uuid.uuid4().hex[:8]}",
        system_message="You are a warm somatic wellness and DBT therapist. Provide brief, flowing personalized guidance."
    ).with_model("anthropic", "claude-sonnet-5")

    prompt = (
        f"Write a brief, flowing personalized reset (under 100 words) for someone feeling {input.mood}. "
        "Include one somatic body-based practice, one affirmation, and one grounding breath cue. "
        "Warm, gentle tone. No bullet points — flowing prose. Gender-neutral and inclusive language."
    )

    async def event_generator():
        try:
            async for event in chat.stream_message(UserMessage(text=prompt)):
                if isinstance(event, TextDelta):
                    yield f"data: {event.content}\n\n"
                elif isinstance(event, StreamDone):
                    yield "data: [DONE]\n\n"
                    break
        except Exception as e:
            logger.error(f"AI streaming error: {e}")
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"}
    )


@api_router.post("/ai/journal-insights")
@limiter.limit("10/hour")
async def generate_journal_insights(request: Request, user: dict = Depends(get_current_user)):
    """Claude Sonnet 5 summary of user's last 7 days of journal entries + mood tracking.
    Applies daily quota only after we confirm there is data to analyze."""
    since = datetime.now(timezone.utc) - timedelta(days=7)
    entries = await db.journal_entries.find(
        {"user_id": user["user_id"], "timestamp": {"$gte": since}},
        {"_id": 0, "text": 1, "time": 1}
    ).sort("timestamp", -1).to_list(30)
    moods = await db.mood_history.find(
        {"user_id": user["user_id"], "timestamp": {"$gte": since}},
        {"_id": 0, "mood": 1}
    ).sort("timestamp", -1).to_list(30)

    if not entries and not moods:
        raise HTTPException(status_code=400, detail="Not enough journal or mood data yet. Write a few entries first.")

    # Now that we have data, enforce/increment quota
    state = await _quota_state(user)
    if not state["unlimited"]:
        if state["tier"] == "free" and (state["weekly_remaining"] or 0) <= 0:
            raise HTTPException(status_code=429, detail=f"You've used your {FREE_WEEKLY_AI_LIMIT} weekly AI resets. Refills Monday, or upgrade to keep flowing.")
        if state["tier"] == "blossom" and (state["monthly_remaining"] or 0) <= 0:
            raise HTTPException(status_code=429, detail=f"You've used all {BLOSSOM_MONTHLY_AI_LIMIT} of this month's Blossom Circle AI responses. Upgrade to Sacred Grove for unlimited.")
    await _increment_ai_usage_all_buckets(user["user_id"])

    entries_txt = "\n\n".join([f"[{e.get('time','')}] {e.get('text','')}" for e in entries]) or "(no journal entries)"
    moods_txt = ", ".join([m.get("mood","") for m in moods]) or "(no mood tracking)"

    system = (
        "You are a compassionate wellness reflection guide. You gently identify emotional themes, "
        "growth signals, and helpful patterns in someone's private journal. Never diagnose. Warm, poetic, non-judgmental."
    )
    prompt = (
        "Analyze the following week of journal entries and mood tracking. "
        "Return exactly 4 short paragraphs, each 1-2 sentences:\n"
        "1) Emotional Theme — the through-line of the week.\n"
        "2) Growth Signal — a positive shift or strength you noticed.\n"
        "3) Gentle Invitation — one soft self-care suggestion.\n"
        "4) Grounding Affirmation — a single affirming sentence in italics.\n\n"
        f"Recent moods (newest first): {moods_txt}\n\nJournal entries:\n{entries_txt}"
    )

    text = await _run_claude(system, prompt, "insights", user["user_id"])
    return {"insights": text, "entries_count": len(entries), "moods_count": len(moods)}


@api_router.post("/ai/affirmation")
@limiter.limit("30/hour")
async def generate_ai_affirmation(request: Request, input: AIAffirmationRequest, user: dict = Depends(enforce_ai_quota)):
    """Claude Sonnet 5 personalized affirmation."""
    system = (
        "You craft powerful, embodied, first-person affirmations. "
        "One sentence. 12-24 words. Present tense. Warm and inclusive. No quotes or hashtags."
    )
    theme = (input.theme or "").strip() or "self-love and personal power"
    prompt = f"Write one affirmation for the theme: {theme}. Return only the affirmation, nothing else."
    text = await _run_claude(system, prompt, "affirmation", user["user_id"])
    # Sanitize: strip surrounding quotes if any
    text = text.strip().strip('"').strip("'").strip()
    return {"affirmation": text, "theme": theme}


@api_router.post("/ai/moderate")
async def moderate_text(input: AIModerationRequest, user: dict = Depends(get_current_user)):
    """
    Claude Sonnet 5 content moderation. Used by Community posts.
    Not counted against daily AI quota — this is a safety gate.
    Returns { safe, severity, reason, categories }.
    """
    if not input.text or len(input.text.strip()) < 2:
        return {"safe": True, "severity": "none", "reason": "Empty", "categories": []}

    system = (
        "You are a strict but fair content moderator for a wellness community app. "
        "Detect self-harm/suicide encouragement, harassment, hate speech, sexual content, threats, or explicit profanity. "
        "Mental-health struggles, sadness, or venting are SAFE. Encouraging harm is UNSAFE. "
        'Respond ONLY as compact JSON: {"safe": bool, "severity": "none"|"low"|"medium"|"high", '
        '"reason": short string, "categories": [strings]}. No prose.'
    )
    prompt = f"Moderate this post:\n\n{input.text}"
    raw = await _run_claude(system, prompt, "moderate", user["user_id"])

    import json, re
    result = {"safe": True, "severity": "none", "reason": "", "categories": []}
    try:
        # Extract first JSON block
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            parsed = json.loads(match.group(0))
            result["safe"] = bool(parsed.get("safe", True))
            result["severity"] = str(parsed.get("severity", "none"))
            result["reason"] = str(parsed.get("reason", ""))[:200]
            cats = parsed.get("categories") or []
            if isinstance(cats, list):
                result["categories"] = [str(c)[:40] for c in cats][:6]
    except Exception as e:
        logger.warning(f"Moderation JSON parse failed: {e} raw={raw[:120]}")
    return result


# ==================== STRIPE ====================

def validate_return_to(value: str) -> str:
    """Prevent open redirects."""
    parsed = urlparse(value)
    allowed_schemes = {"exp", "exps", "myapp", "com.emergent.beautifyyourself.kms11o"}
    allowed_hosts = {"beautify-yourself.preview.emergentagent.com", "localhost:8081", "localhost:19006"}

    if parsed.scheme in allowed_schemes:
        return value
    if parsed.scheme in {"http", "https"} and parsed.netloc in allowed_hosts:
        return value
    # Also allow the preview URL without strict host match for development
    if parsed.scheme in {"http", "https"} and "emergentagent.com" in parsed.netloc:
        return value
    raise HTTPException(status_code=400, detail="Invalid return URL")


@api_router.post("/stripe/create-checkout-session")
async def create_checkout_session(body: CheckoutRequest, user: dict = Depends(get_current_user)):
    return_to = validate_return_to(body.return_to)

    # Resolve tier + price
    requested_tier = (body.tier or "blossom").lower()
    if requested_tier == "premium":
        requested_tier = "blossom"  # backwards-compat
    if requested_tier not in {"blossom", "grove"}:
        raise HTTPException(status_code=400, detail="Invalid tier. Must be 'blossom' or 'grove'.")

    current_tier = _normalized_tier(user)
    if current_tier == "grove":
        raise HTTPException(status_code=409, detail="You already have Sacred Grove — the highest tier.")
    if current_tier == "blossom" and requested_tier == "blossom":
        raise HTTPException(status_code=409, detail="You're already on Blossom Circle. Upgrade to Sacred Grove for unlimited AI.")

    price_id = STRIPE_GROVE_PRICE_ID if requested_tier == "grove" else STRIPE_BLOSSOM_PRICE_ID
    if not stripe.api_key or not price_id or price_id.startswith("price_premium_placeholder"):
        raise HTTPException(status_code=500, detail="Stripe not configured. Contact support.")

    customer_id = user.get("stripe_customer_id")
    customer_args = {"customer": customer_id} if customer_id else {"customer_email": user.get("email")}
    customer_args = {k: v for k, v in customer_args.items() if v}

    success_bridge = (
        f"{PUBLIC_API_URL}/api/stripe/checkout-success"
        f"?return_to={quote(return_to, safe='')}"
        f"&session_id={{CHECKOUT_SESSION_ID}}"
    )
    cancel_bridge = (
        f"{PUBLIC_API_URL}/api/stripe/checkout-cancel"
        f"?return_to={quote(return_to, safe='')}"
    )

    try:
        session = stripe.checkout.Session.create(
            **customer_args,
            mode="subscription",
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=success_bridge,
            cancel_url=cancel_bridge,
            client_reference_id=user["user_id"],
            metadata={"user_id": user["user_id"], "tier": requested_tier},
            subscription_data={"metadata": {"user_id": user["user_id"], "tier": requested_tier}},
        )
    except Exception as e:
        logger.error(f"Stripe checkout error: {e}")
        raise HTTPException(status_code=500, detail=f"Stripe error: {str(e)}")

    if session.customer:
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": {"stripe_customer_id": session.customer}}
        )

    return {"checkout_url": session.url, "tier": requested_tier}


@api_router.get("/stripe/checkout-success")
async def checkout_success(return_to: str, session_id: str = ""):
    return RedirectResponse(validate_return_to(return_to), status_code=303)


@api_router.get("/stripe/checkout-cancel")
async def checkout_cancel(return_to: str):
    return RedirectResponse(validate_return_to(return_to), status_code=303)


@api_router.get("/me/subscription")
async def subscription_status(user: dict = Depends(get_current_user)):
    tier = _normalized_tier(user)
    return {
        "subscription_tier": tier,
        "is_admin": user.get("is_admin", False),
        "welcome_week_active": _is_in_welcome_week(user),
        "welcome_week_days_left": _welcome_week_days_left(user) if _is_in_welcome_week(user) else None,
    }


@api_router.post("/stripe/webhook")
async def stripe_webhook(request: Request, stripe_signature: Optional[str] = Header(None, alias="stripe-signature")):
    payload = await request.body()
    if not stripe_signature or not STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=400, detail="Missing signature or webhook secret")

    try:
        event = stripe.Webhook.construct_event(payload, stripe_signature, STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.error.SignatureVerificationError):
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Deduplicate
    try:
        await db.stripe_events.insert_one({"event_id": event["id"], "received_at": datetime.now(timezone.utc)})
    except Exception:
        return {"received": True, "duplicate": True}

    event_type = event["type"]
    obj = event["data"]["object"]

    if event_type in {"customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"}:
        metadata = obj.get("metadata") or {}
        user_id = metadata.get("user_id")
        if user_id:
            price = obj.get("items", {}).get("data", [{}])[0].get("price")
            price_id = price.get("id") if isinstance(price, dict) else price

            # Determine tier from price_id
            new_tier = "free"
            if event_type != "customer.subscription.deleted" and obj.get("status") in {"active", "trialing"}:
                if price_id == STRIPE_GROVE_PRICE_ID:
                    new_tier = "grove"
                elif price_id == STRIPE_BLOSSOM_PRICE_ID:
                    new_tier = "blossom"

            await db.users.update_one(
                {"user_id": user_id},
                {"$set": {
                    "subscription_tier": new_tier,
                    "stripe_subscription_id": obj.get("id"),
                    "stripe_customer_id": obj.get("customer"),
                }},
            )

    return {"received": True}


# ==================== ADMIN (role-based, no password) ====================

@api_router.get("/admin/stats")
async def get_admin_stats(admin: dict = Depends(require_admin)):
    return {
        "users": await db.users.count_documents({}),
        "premium_users": await db.users.count_documents({"subscription_tier": {"$in": ["blossom", "grove", "premium"]}}),
        "blossom_users": await db.users.count_documents({"subscription_tier": {"$in": ["blossom", "premium"]}}),
        "grove_users": await db.users.count_documents({"subscription_tier": "grove"}),
        "admins": await db.users.count_documents({"is_admin": True}),
        "journal_entries": await db.journal_entries.count_documents({}),
        "life_notes": await db.life_notes.count_documents({}),
        "tasks": await db.tasks.count_documents({}),
        "affirmations": await db.affirmations.count_documents({}),
        "feedback": await db.feedback.count_documents({}),
        "mood_entries": await db.mood_history.count_documents({}),
    }

@api_router.get("/admin/users")
async def list_users(admin: dict = Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return users

@api_router.patch("/admin/users/{user_id}")
async def update_user(user_id: str, input: AdminUpdateUserRequest, admin: dict = Depends(require_admin)):
    update_data = {k: v for k, v in input.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data")

    # Normalize tier values (accept 'premium' as legacy alias for 'blossom')
    if "subscription_tier" in update_data:
        tier = update_data["subscription_tier"].lower()
        if tier == "premium":
            tier = "blossom"
        if tier not in {"free", "blossom", "grove"}:
            raise HTTPException(status_code=400, detail="Invalid tier. Must be free, blossom, or grove.")
        update_data["subscription_tier"] = tier

    # Prevent an admin from demoting themselves if they are the last admin
    if input.is_admin is False:
        target = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        if target and target.get("is_admin"):
            admin_count = await db.users.count_documents({"is_admin": True})
            if admin_count <= 1:
                raise HTTPException(status_code=400, detail="Cannot remove the last admin")

    result = await db.users.update_one({"user_id": user_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user

@api_router.get("/admin/feedback")
async def get_all_feedback_admin(admin: dict = Depends(require_admin)):
    feedback = await db.feedback.find({}, {"_id": 0}).sort("timestamp", -1).to_list(1000)
    return feedback

@api_router.delete("/admin/moderate/{content_type}/{item_id}")
async def moderate_content(content_type: str, item_id: str, admin: dict = Depends(require_admin), reason: str = "Admin removal"):
    collection_map = {
        "feedback": db.feedback,
        "journal": db.journal_entries,
        "notes": db.life_notes,
        "affirmations": db.affirmations,
        "tasks": db.tasks,
    }
    if content_type not in collection_map:
        raise HTTPException(status_code=400, detail=f"Unknown content type: {content_type}")

    await db.moderation_log.insert_one({
        "id": str(uuid.uuid4()),
        "admin_user_id": admin["user_id"],
        "admin_email": admin.get("email"),
        "content_type": content_type,
        "item_id": item_id,
        "reason": reason,
        "timestamp": datetime.now(timezone.utc),
    })

    result = await collection_map[content_type].delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")

    return {"success": True, "message": f"Item removed from {content_type}"}

@api_router.get("/admin/moderation-log")
async def get_moderation_log(admin: dict = Depends(require_admin)):
    log = await db.moderation_log.find({}, {"_id": 0}).sort("timestamp", -1).to_list(100)
    return log


# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
