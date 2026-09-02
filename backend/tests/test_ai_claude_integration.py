"""
Backend tests for the new Claude Sonnet 5 AI integration + free-tier daily quota.

Covers:
- GET  /api/ai/usage
- POST /api/ai/reset (SSE streaming, quota-gated)
- POST /api/ai/journal-insights (quota-gated, 400 when no data)
- POST /api/ai/affirmation (quota-gated)
- POST /api/ai/moderate (NOT quota-gated)
- Free-tier daily quota (3/day) exhaustion -> 429
- Premium/admin unlimited
- Auth 401 for all AI endpoints

Auth strategy: because the app uses Emergent Google OAuth we can't complete a real
session from a headless test, so we seed users + session tokens directly into the
same MongoDB the backend reads from (mirrors the /api/auth/session insert).
"""
import os
import uuid
import json
import pytest
import requests
from datetime import datetime, timezone, timedelta
from pymongo import MongoClient

# ---- config ----
BASE_URL = (
    os.environ.get("EXPO_PUBLIC_BACKEND_URL")
    or os.environ.get("EXPO_BACKEND_URL")
    or "https://beautify-yourself.preview.emergentagent.com"
).rstrip("/")
API = f"{BASE_URL}/api"

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")

FREE_DAILY_AI_LIMIT = 3
TEST_PREFIX = "TEST_AI_"


# ---- shared mongo client ----
@pytest.fixture(scope="module")
def mongo():
    c = MongoClient(MONGO_URL)
    yield c[DB_NAME]
    c.close()


def _seed_user_and_session(db, *, is_admin: bool, tier: str) -> tuple[str, str]:
    """Insert a synthetic user + session directly. Returns (user_id, session_token)."""
    user_id = f"user_{TEST_PREFIX}{uuid.uuid4().hex[:8]}"
    email = f"{TEST_PREFIX}{uuid.uuid4().hex[:6]}@example.com"
    session_token = f"tok_{TEST_PREFIX}{uuid.uuid4().hex}"
    now = datetime.now(timezone.utc)

    db.users.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "email": email,
        "name": "Test User",
        "picture": None,
        "is_admin": is_admin,
        "subscription_tier": tier,
        "created_at": now,
    })
    db.user_sessions.insert_one({
        "id": str(uuid.uuid4()),
        "session_token": session_token,
        "user_id": user_id,
        "expires_at": now + timedelta(days=1),
        "created_at": now,
    })
    return user_id, session_token


def _cleanup_user(db, user_id: str):
    db.user_sessions.delete_many({"user_id": user_id})
    db.users.delete_many({"user_id": user_id})
    db.ai_usage.delete_many({"user_id": user_id})
    db.journal_entries.delete_many({"user_id": user_id})
    db.mood_history.delete_many({"user_id": user_id})


@pytest.fixture(scope="module")
def free_user(mongo):
    uid, tok = _seed_user_and_session(mongo, is_admin=False, tier="free")
    yield {"user_id": uid, "token": tok}
    _cleanup_user(mongo, uid)


@pytest.fixture(scope="module")
def premium_user(mongo):
    uid, tok = _seed_user_and_session(mongo, is_admin=False, tier="premium")
    yield {"user_id": uid, "token": tok}
    _cleanup_user(mongo, uid)


@pytest.fixture(scope="module")
def admin_user(mongo):
    uid, tok = _seed_user_and_session(mongo, is_admin=True, tier="free")
    yield {"user_id": uid, "token": tok}
    _cleanup_user(mongo, uid)


def _auth(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def _reset_quota(mongo, user_id):
    mongo.ai_usage.delete_many({"user_id": user_id})


# ============ NO-AUTH: every AI endpoint must return 401 ============
class TestAINoAuth:
    def test_usage_401(self):
        assert requests.get(f"{API}/ai/usage").status_code == 401

    def test_reset_401(self):
        assert requests.post(f"{API}/ai/reset", json={"mood": "sad"}).status_code == 401

    def test_journal_insights_401(self):
        assert requests.post(f"{API}/ai/journal-insights").status_code == 401

    def test_affirmation_401(self):
        assert requests.post(f"{API}/ai/affirmation", json={}).status_code == 401

    def test_moderate_401(self):
        assert requests.post(f"{API}/ai/moderate", json={"text": "hello"}).status_code == 401


# ============ GET /api/ai/usage ============
class TestAIUsage:
    def test_free_user_usage_shape(self, free_user, mongo):
        _reset_quota(mongo, free_user["user_id"])
        r = requests.get(f"{API}/ai/usage", headers=_auth(free_user["token"]))
        assert r.status_code == 200
        data = r.json()
        assert data["used_today"] == 0
        assert data["daily_limit"] == FREE_DAILY_AI_LIMIT
        assert data["unlimited"] is False
        assert data["remaining"] == FREE_DAILY_AI_LIMIT

    def test_premium_user_unlimited_shape(self, premium_user):
        r = requests.get(f"{API}/ai/usage", headers=_auth(premium_user["token"]))
        assert r.status_code == 200
        data = r.json()
        assert data["unlimited"] is True
        assert data["daily_limit"] is None
        assert data["remaining"] is None
        assert isinstance(data["used_today"], int)

    def test_admin_user_unlimited(self, admin_user):
        r = requests.get(f"{API}/ai/usage", headers=_auth(admin_user["token"]))
        assert r.status_code == 200
        assert r.json()["unlimited"] is True


# ============ POST /api/ai/moderate (safety gate, NOT counted) ============
class TestAIModerate:
    def test_moderate_safe_short_circuit(self, free_user, mongo):
        _reset_quota(mongo, free_user["user_id"])
        r = requests.post(f"{API}/ai/moderate", headers=_auth(free_user["token"]), json={"text": ""})
        assert r.status_code == 200
        assert r.json()["safe"] is True
        # empty short-circuit shouldn't consume quota
        usage = requests.get(f"{API}/ai/usage", headers=_auth(free_user["token"])).json()
        assert usage["used_today"] == 0

    def test_moderate_actual_call_not_counted(self, free_user, mongo):
        _reset_quota(mongo, free_user["user_id"])
        r = requests.post(
            f"{API}/ai/moderate",
            headers=_auth(free_user["token"]),
            json={"text": "Today I feel a bit down but hopeful."},
            timeout=60,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert "safe" in body and "severity" in body and "categories" in body
        assert isinstance(body["categories"], list)
        # Moderation must NOT increment ai_usage counter
        used = mongo.ai_usage.find_one({"user_id": free_user["user_id"]})
        assert used is None or int(used.get("count", 0)) == 0, "Moderation should not consume quota"


# ============ POST /api/ai/affirmation (quota-gated) ============
class TestAIAffirmation:
    def test_affirmation_default_theme(self, premium_user):
        r = requests.post(
            f"{API}/ai/affirmation",
            headers=_auth(premium_user["token"]),
            json={},
            timeout=60,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert isinstance(body.get("affirmation"), str) and len(body["affirmation"]) > 0
        assert body.get("theme")  # non-empty default

    def test_affirmation_with_theme(self, premium_user):
        r = requests.post(
            f"{API}/ai/affirmation",
            headers=_auth(premium_user["token"]),
            json={"theme": "confidence"},
            timeout=60,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["theme"] == "confidence"
        assert body["affirmation"] and not body["affirmation"].startswith('"')


# ============ POST /api/ai/journal-insights (quota-gated, 400 if empty) ============
class TestAIJournalInsights:
    def test_insights_400_when_no_data(self, free_user, mongo):
        _reset_quota(mongo, free_user["user_id"])
        # ensure no journal/mood
        mongo.journal_entries.delete_many({"user_id": free_user["user_id"]})
        mongo.mood_history.delete_many({"user_id": free_user["user_id"]})
        r = requests.post(f"{API}/ai/journal-insights", headers=_auth(free_user["token"]), timeout=30)
        assert r.status_code == 400, r.text
        assert "journal" in r.json().get("detail", "").lower()

    def test_insights_with_seeded_journal(self, premium_user, mongo):
        # seed via API to mimic real flow
        for text in ["Today felt heavy but I noticed sunlight.", "Ran for 10 mins, felt lighter after."]:
            rr = requests.post(f"{API}/journal", headers=_auth(premium_user["token"]), json={"text": text})
            assert rr.status_code == 200
        rr = requests.post(f"{API}/mood", headers=_auth(premium_user["token"]), json={"mood": "hopeful", "color": "#ffd"})
        assert rr.status_code == 200

        r = requests.post(f"{API}/ai/journal-insights", headers=_auth(premium_user["token"]), timeout=90)
        assert r.status_code == 200, r.text
        body = r.json()
        assert isinstance(body.get("insights"), str) and len(body["insights"]) > 20
        assert body["entries_count"] >= 2
        assert body["moods_count"] >= 1


# ============ POST /api/ai/reset (SSE streaming, quota-gated) ============
class TestAIReset:
    def test_reset_streams_data(self, premium_user):
        with requests.post(
            f"{API}/ai/reset",
            headers=_auth(premium_user["token"]),
            json={"mood": "anxious"},
            stream=True,
            timeout=90,
        ) as r:
            assert r.status_code == 200, r.text
            ctype = r.headers.get("content-type", "")
            assert "text/event-stream" in ctype, f"Expected SSE, got {ctype}"
            saw_data = False
            saw_done = False
            for raw in r.iter_lines(decode_unicode=True):
                if not raw:
                    continue
                if raw.startswith("data:"):
                    payload = raw[5:].strip()
                    if payload == "[DONE]":
                        saw_done = True
                        break
                    if payload:
                        saw_data = True
            assert saw_data, "No SSE data chunks received"
            assert saw_done, "SSE stream never emitted [DONE]"


# ============ Daily quota logic: free user hits 429 on 4th call ============
class TestQuotaEnforcement:
    def test_free_user_4th_call_is_429(self, mongo):
        # dedicated user so we don't leak state
        uid, tok = _seed_user_and_session(mongo, is_admin=False, tier="free")
        headers = _auth(tok)
        try:
            # call 1,2,3 -> 200 on affirmation (cheapest quota-gated endpoint)
            for i in range(FREE_DAILY_AI_LIMIT):
                r = requests.post(f"{API}/ai/affirmation", headers=headers, json={"theme": f"day-{i}"}, timeout=60)
                assert r.status_code == 200, f"call #{i+1} unexpectedly failed: {r.status_code} {r.text}"

            # usage should now be at the cap
            usage = requests.get(f"{API}/ai/usage", headers=headers).json()
            assert usage["used_today"] == FREE_DAILY_AI_LIMIT
            assert usage["remaining"] == 0

            # 4th call -> 429
            r = requests.post(f"{API}/ai/affirmation", headers=headers, json={}, timeout=30)
            assert r.status_code == 429, f"Expected 429, got {r.status_code}: {r.text}"
            detail = r.json().get("detail", "")
            assert "Daily free AI limit reached" in detail, f"Unexpected detail: {detail}"

            # 429 must NOT increment counter (still 3)
            usage2 = requests.get(f"{API}/ai/usage", headers=headers).json()
            assert usage2["used_today"] == FREE_DAILY_AI_LIMIT, "Quota should not increment on 429"

            # And a different quota-gated endpoint also 429s
            r2 = requests.post(f"{API}/ai/journal-insights", headers=headers, timeout=30)
            assert r2.status_code == 429

            # But /ai/moderate (safety gate) should still work
            rm = requests.post(f"{API}/ai/moderate", headers=headers, json={"text": "just checking"}, timeout=60)
            assert rm.status_code == 200, "Moderation must still work even when quota exhausted"
        finally:
            _cleanup_user(mongo, uid)

    def test_premium_user_beyond_free_limit(self, mongo):
        """Premium user should NOT be blocked after FREE_DAILY_AI_LIMIT calls."""
        uid, tok = _seed_user_and_session(mongo, is_admin=False, tier="premium")
        headers = _auth(tok)
        try:
            # Fire 4 affirmation calls (one more than free limit) - all must succeed
            for i in range(FREE_DAILY_AI_LIMIT + 1):
                r = requests.post(f"{API}/ai/affirmation", headers=headers, json={"theme": f"p-{i}"}, timeout=60)
                assert r.status_code == 200, f"Premium call #{i+1} blocked: {r.status_code} {r.text}"
            usage = requests.get(f"{API}/ai/usage", headers=headers).json()
            assert usage["unlimited"] is True
        finally:
            _cleanup_user(mongo, uid)


# ============ Usage counter increments across ALL quota-gated endpoints ============
class TestQuotaIncrementsAcrossEndpoints:
    def test_reset_affirmation_insights_all_count(self, mongo):
        uid, tok = _seed_user_and_session(mongo, is_admin=False, tier="premium")  # premium so no cap
        headers = _auth(tok)
        try:
            # baseline
            base = requests.get(f"{API}/ai/usage", headers=headers).json()["used_today"]

            # 1) affirmation
            r = requests.post(f"{API}/ai/affirmation", headers=headers, json={"theme": "grace"}, timeout=60)
            assert r.status_code == 200

            # 2) journal-insights (needs data)
            requests.post(f"{API}/journal", headers=headers, json={"text": "seed for insights"})
            r = requests.post(f"{API}/ai/journal-insights", headers=headers, timeout=90)
            assert r.status_code == 200

            # 3) reset (consume SSE quickly)
            with requests.post(f"{API}/ai/reset", headers=headers, json={"mood": "tired"}, stream=True, timeout=90) as rr:
                assert rr.status_code == 200
                for _ in rr.iter_lines():
                    pass

            after = requests.get(f"{API}/ai/usage", headers=headers).json()["used_today"]
            assert after - base == 3, f"Expected +3 quota units, got {after - base}"

            # 4) moderate should NOT bump
            requests.post(f"{API}/ai/moderate", headers=headers, json={"text": "hi there"}, timeout=60)
            after2 = requests.get(f"{API}/ai/usage", headers=headers).json()["used_today"]
            assert after2 == after, "Moderate must not count toward quota"
        finally:
            _cleanup_user(mongo, uid)
