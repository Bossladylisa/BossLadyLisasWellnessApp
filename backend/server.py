from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

# Mood History
class MoodEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    mood: str
    color: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class MoodEntryCreate(BaseModel):
    mood: str
    color: str

# Journal Entry
class JournalEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    time: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class JournalEntryCreate(BaseModel):
    text: str

# Life Note
class LifeNote(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class LifeNoteCreate(BaseModel):
    text: str

# Task
class Task(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    priority: str
    completed: bool = False
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class TaskCreate(BaseModel):
    text: str
    priority: str

class TaskUpdate(BaseModel):
    completed: Optional[bool] = None

# Affirmation
class Affirmation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class AffirmationCreate(BaseModel):
    text: str

# Feedback
class Feedback(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    time: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class FeedbackCreate(BaseModel):
    text: str

# Declutter State
class DeclutterState(BaseModel):
    id: str = "declutter_state"
    items: dict
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class DeclutterStateUpdate(BaseModel):
    items: dict

# User Stats (for streak, etc.)
class UserStats(BaseModel):
    id: str = "user_stats"
    affirmation_streak: int = 0
    last_affirmation_date: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class UserStatsUpdate(BaseModel):
    affirmation_streak: Optional[int] = None
    last_affirmation_date: Optional[str] = None

# AI Request
class AIResetRequest(BaseModel):
    mood: str

# ==================== ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "Beautify Yourself & Beyond API"}

# ==================== MOOD HISTORY ====================

@api_router.post("/mood", response_model=MoodEntry)
async def create_mood_entry(input: MoodEntryCreate):
    mood_dict = input.dict()
    mood_obj = MoodEntry(**mood_dict)
    await db.mood_history.insert_one(mood_obj.dict())
    return mood_obj

@api_router.get("/mood", response_model=List[MoodEntry])
async def get_mood_history():
    moods = await db.mood_history.find().sort("timestamp", -1).limit(14).to_list(14)
    return [MoodEntry(**mood) for mood in moods]

# ==================== JOURNAL ====================

@api_router.post("/journal", response_model=JournalEntry)
async def create_journal_entry(input: JournalEntryCreate):
    time_str = datetime.now().strftime("%b %d, %Y, %I:%M %p")
    journal_dict = input.dict()
    journal_obj = JournalEntry(**journal_dict, time=time_str)
    await db.journal_entries.insert_one(journal_obj.dict())
    return journal_obj

@api_router.get("/journal", response_model=List[JournalEntry])
async def get_journal_entries():
    entries = await db.journal_entries.find().sort("timestamp", -1).to_list(1000)
    return [JournalEntry(**entry) for entry in entries]

@api_router.delete("/journal/{entry_id}")
async def delete_journal_entry(entry_id: str):
    result = await db.journal_entries.delete_one({"id": entry_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"message": "Entry deleted"}

# ==================== LIFE NOTES ====================

@api_router.post("/notes", response_model=LifeNote)
async def create_life_note(input: LifeNoteCreate):
    note_dict = input.dict()
    note_obj = LifeNote(**note_dict)
    await db.life_notes.insert_one(note_obj.dict())
    return note_obj

@api_router.get("/notes", response_model=List[LifeNote])
async def get_life_notes():
    notes = await db.life_notes.find().sort("timestamp", -1).to_list(1000)
    return [LifeNote(**note) for note in notes]

@api_router.delete("/notes/{note_id}")
async def delete_life_note(note_id: str):
    result = await db.life_notes.delete_one({"id": note_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"message": "Note deleted"}

# ==================== TASKS ====================

@api_router.post("/tasks", response_model=Task)
async def create_task(input: TaskCreate):
    task_dict = input.dict()
    task_obj = Task(**task_dict)
    await db.tasks.insert_one(task_obj.dict())
    return task_obj

@api_router.get("/tasks", response_model=List[Task])
async def get_tasks():
    tasks = await db.tasks.find().sort("timestamp", -1).to_list(1000)
    return [Task(**task) for task in tasks]

@api_router.patch("/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, input: TaskUpdate):
    update_data = {k: v for k, v in input.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.tasks.update_one({"id": task_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = await db.tasks.find_one({"id": task_id})
    return Task(**task)

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    result = await db.tasks.delete_one({"id": task_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted"}

# ==================== AFFIRMATIONS ====================

@api_router.post("/affirmations", response_model=Affirmation)
async def create_affirmation(input: AffirmationCreate):
    affirmation_dict = input.dict()
    affirmation_obj = Affirmation(**affirmation_dict)
    await db.affirmations.insert_one(affirmation_obj.dict())
    return affirmation_obj

@api_router.get("/affirmations", response_model=List[Affirmation])
async def get_affirmations():
    affirmations = await db.affirmations.find().sort("timestamp", -1).to_list(1000)
    return [Affirmation(**affirmation) for affirmation in affirmations]

@api_router.delete("/affirmations/{affirmation_id}")
async def delete_affirmation(affirmation_id: str):
    result = await db.affirmations.delete_one({"id": affirmation_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Affirmation not found")
    return {"message": "Affirmation deleted"}

# ==================== FEEDBACK ====================

@api_router.post("/feedback", response_model=Feedback)
async def create_feedback(input: FeedbackCreate):
    time_str = datetime.now().strftime("%b %d, %Y, %I:%M %p")
    feedback_dict = input.dict()
    feedback_obj = Feedback(**feedback_dict, time=time_str)
    await db.feedback.insert_one(feedback_obj.dict())
    return feedback_obj

@api_router.get("/feedback", response_model=List[Feedback])
async def get_feedback():
    feedback = await db.feedback.find().sort("timestamp", -1).to_list(1000)
    return [Feedback(**fb) for fb in feedback]

# ==================== DECLUTTER STATE ====================

@api_router.get("/declutter")
async def get_declutter_state():
    state = await db.declutter_state.find_one({"id": "declutter_state"})
    if not state:
        return {"items": {}}
    return {"items": state.get("items", {})}

@api_router.put("/declutter")
async def update_declutter_state(input: DeclutterStateUpdate):
    await db.declutter_state.update_one(
        {"id": "declutter_state"},
        {"$set": {"items": input.items, "timestamp": datetime.utcnow()}},
        upsert=True
    )
    return {"items": input.items}

# ==================== USER STATS ====================

@api_router.get("/stats")
async def get_user_stats():
    stats = await db.user_stats.find_one({"id": "user_stats"})
    if not stats:
        return {"affirmation_streak": 0, "last_affirmation_date": None}
    return {
        "affirmation_streak": stats.get("affirmation_streak", 0),
        "last_affirmation_date": stats.get("last_affirmation_date")
    }

@api_router.patch("/stats")
async def update_user_stats(input: UserStatsUpdate):
    update_data = {k: v for k, v in input.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    update_data["timestamp"] = datetime.utcnow()
    
    await db.user_stats.update_one(
        {"id": "user_stats"},
        {"$set": update_data},
        upsert=True
    )
    
    stats = await db.user_stats.find_one({"id": "user_stats"})
    return {
        "affirmation_streak": stats.get("affirmation_streak", 0),
        "last_affirmation_date": stats.get("last_affirmation_date")
    }

# ==================== AI RESET GENERATION ====================

@api_router.post("/ai/reset")
async def generate_ai_reset(input: AIResetRequest):
    """Generate personalized somatic reset guidance using Claude"""
    try:
        emergent_llm_key = os.getenv("EMERGENT_LLM_KEY")
        if not emergent_llm_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        # Initialize Claude chat
        chat = LlmChat(
            api_key=emergent_llm_key,
            session_id=f"reset_{uuid.uuid4()}",
            system_message="You are a warm somatic wellness and DBT therapist. Provide brief, flowing personalized guidance."
        ).with_model("anthropic", "claude-sonnet-4-6")
        
        prompt = f"""Write a brief, flowing personalized reset (under 100 words) for someone feeling {input.mood}. 
        Include one somatic body-based practice, one affirmation, and one grounding breath cue. 
        Warm, gentle tone. No bullet points — flowing prose. Gender-neutral and inclusive language."""
        
        user_message = UserMessage(text=prompt)
        
        async def event_generator():
            async for event in chat.stream_message(user_message):
                if isinstance(event, TextDelta):
                    yield f"data: {event.content}\n\n"
                elif isinstance(event, StreamDone):
                    yield "data: [DONE]\n\n"
                    break
        
        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
                "Connection": "keep-alive"
            }
        )
    except Exception as e:
        logger.error(f"AI generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

# Include the router in the main app
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
