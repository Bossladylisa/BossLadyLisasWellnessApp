"""
Backend tests for the 3-tier subscription model:
 - 🌱 Sanctuary Seed (free)  : 3 AI/week, opt-in Welcome Week (7 days unlimited)
 - 🌸 Blossom Circle ($4.99) : 30 AI/month
 - 🦋 Sacred Grove ($14.99)  : Unlimited AI
 - 👑 Admin                    : Unlimited AI

Covers:
- GET  /api/ai/usage new quota_state shape (per tier + welcome week + admin)
- POST /api/user/start-welcome-week (opt-in, 409 on second call)
- Welcome Week grants unlimited across /ai/reset, /ai/affirmation, /ai/journal-insights
- Free tier weekly cap (4th call -> 429 with 'weekly AI resets')
- Blossom tier monthly cap (31st call -> 429 with 'Blossom Circle AI responses')
- Legacy tier 'premium' normalizes to 'blossom' (via admin PATCH & _quota_state)
- POST /api/stripe/create-checkout-session for tier='blossom'|'grove'|'invalid'
  + 409 when already on same/higher tier
- PATCH /api/admin/users/{user_id} tier validation + normalization
- GET /api/admin/stats returns blossom_users / grove_users / premium_users
- GET /api/me/subscription shape
- POST /api/ai/moderate never counts against quota

Auth is seeded directly into MongoDB (mirrors /api/auth/session writes) since
Emergent Google OAuth cannot be completed from a headless test.
"""
import os
import uuid
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

FREE_WEEKLY_AI_LIMIT = 3
BLOSSOM_MONTHLY_AI_LIMIT = 30
WELCOME_WEEK_DAYS = 7
TEST_PREFIX = "TEST_TIER_"

STRIPE_BLOSSOM_PRICE_ID = "price_1UB49uBhLl2Bwlr68yluQLHw"
STRIPE_GROVE_PRICE_ID = "price_1UB49uBhLl2Bwlr6slk3Sn7T"
RETURN_TO = "https://beautify-yourself.preview.emergentagent.com/upgrade"


# ---- shared mongo client ----
@pytest.fixture(scope="module")
def mongo():
    c = MongoClient(MONGO_URL)
    yield c[DB_NAME]
    c.close()


def _seed_user_and_session(db, *, is_admin: bool = False, tier: str = "free",
                           welcome_week_start=None) -> tuple[str, str]:
    """Insert a synthetic user + session. Returns (user_id, session_token)."""
    user_id = f"user_{TEST_PREFIX}{uuid.uuid4().hex[:8]}"
    email = f"{TEST_PREFIX}{uuid.uuid4().hex[:6]}@example.com"
    session_token = f"tok_{TEST_PREFIX}{uuid.uuid4().hex}"
    now = datetime.now(timezone.utc)

    user_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "email": email,
        "name": "Test Tier User",
        "picture": None,
        "is_admin": is_admin,
        "subscription_tier": tier,
        "created_at": now,
    }
    if welcome_week_start is not None:
        user_doc["welcome_week_start"] = welcome_week_start
    db.users.insert_one(user_doc)
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


def _auth(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def _reset_quota(mongo, user_id):
    mongo.ai_usage.delete_many({"user_id": user_id})


# ============================================================
# GET /api/ai/usage shape per tier
# ============================================================
class TestAIUsageShape:
    def test_free_no_welcome_week(self, mongo):
        uid, tok = _seed_user_and_session(mongo, tier="free")
        try:
            _reset_quota(mongo, uid)
            r = requests.get(f"{API}/ai/usage", headers=_auth(tok))
            assert r.status_code == 200, r.text
            d = r.json()
            # Required new keys present
            for k in ("tier", "is_admin", "unlimited", "welcome_week_active",
                      "welcome_week_days_left", "used_this_week", "weekly_limit",
                      "weekly_remaining", "used_this_month", "monthly_limit",
                      "monthly_remaining", "reason"):
                assert k in d, f"missing key {k} in {d}"
            assert d["tier"] == "free"
            assert d["unlimited"] is False
            assert d["welcome_week_active"] is False
            assert d["welcome_week_days_left"] is None
            assert d["weekly_limit"] == FREE_WEEKLY_AI_LIMIT
            assert d["used_this_week"] == 0
            assert d["weekly_remaining"] == FREE_WEEKLY_AI_LIMIT
            assert d["monthly_limit"] is None
            assert d["is_admin"] is False
        finally:
            _cleanup_user(mongo, uid)

    def test_blossom_tier(self, mongo):
        uid, tok = _seed_user_and_session(mongo, tier="blossom")
        try:
            _reset_quota(mongo, uid)
            r = requests.get(f"{API}/ai/usage", headers=_auth(tok))
            assert r.status_code == 200
            d = r.json()
            assert d["tier"] == "blossom"
            assert d["unlimited"] is False
            assert d["monthly_limit"] == BLOSSOM_MONTHLY_AI_LIMIT
            assert d["used_this_month"] == 0
            assert d["monthly_remaining"] == BLOSSOM_MONTHLY_AI_LIMIT
            assert d["weekly_limit"] is None
            assert d["welcome_week_active"] is False
        finally:
            _cleanup_user(mongo, uid)

    def test_grove_tier_unlimited(self, mongo):
        uid, tok = _seed_user_and_session(mongo, tier="grove")
        try:
            r = requests.get(f"{API}/ai/usage", headers=_auth(tok))
            assert r.status_code == 200
            d = r.json()
            assert d["tier"] == "grove"
            assert d["unlimited"] is True
            assert d["welcome_week_active"] is False
            assert d["weekly_limit"] is None
            assert d["monthly_limit"] is None
        finally:
            _cleanup_user(mongo, uid)

    def test_admin_unlimited_regardless_of_tier(self, mongo):
        uid, tok = _seed_user_and_session(mongo, is_admin=True, tier="free")
        try:
            r = requests.get(f"{API}/ai/usage", headers=_auth(tok))
            assert r.status_code == 200
            d = r.json()
            assert d["is_admin"] is True
            assert d["unlimited"] is True
        finally:
            _cleanup_user(mongo, uid)

    def test_legacy_premium_normalizes_to_blossom(self, mongo):
        """Legacy 'premium' tier should appear as 'blossom' in the usage state."""
        uid, tok = _seed_user_and_session(mongo, tier="premium")
        try:
            r = requests.get(f"{API}/ai/usage", headers=_auth(tok))
            assert r.status_code == 200
            d = r.json()
            assert d["tier"] == "blossom", f"legacy premium should normalize to blossom, got {d['tier']}"
            assert d["monthly_limit"] == BLOSSOM_MONTHLY_AI_LIMIT
        finally:
            _cleanup_user(mongo, uid)


# ============================================================
# POST /api/user/start-welcome-week (opt-in, once)
# ============================================================
class TestWelcomeWeek:
    def test_start_welcome_week_and_second_call_409(self, mongo):
        uid, tok = _seed_user_and_session(mongo, tier="free")
        try:
            # Before opt-in: not active
            r0 = requests.get(f"{API}/ai/usage", headers=_auth(tok))
            assert r0.status_code == 200
            assert r0.json()["welcome_week_active"] is False

            # First call succeeds
            r1 = requests.post(f"{API}/user/start-welcome-week", headers=_auth(tok))
            assert r1.status_code == 200, r1.text
            body = r1.json()
            assert "user" in body and "quota" in body
            assert body["quota"]["welcome_week_active"] is True
            # 7 days left (allow 6 or 7 depending on rounding)
            days_left = body["quota"]["welcome_week_days_left"]
            assert days_left in (6, 7), f"expected ~7 days left, got {days_left}"
            assert body["quota"]["unlimited"] is True

            # Verify /ai/usage now reports unlimited during welcome week
            r2 = requests.get(f"{API}/ai/usage", headers=_auth(tok))
            d = r2.json()
            assert d["welcome_week_active"] is True
            assert d["unlimited"] is True
            assert d["welcome_week_days_left"] in (6, 7)

            # Second call -> 409
            r3 = requests.post(f"{API}/user/start-welcome-week", headers=_auth(tok))
            assert r3.status_code == 409, r3.text
        finally:
            _cleanup_user(mongo, uid)

    def test_during_welcome_week_ai_calls_unlimited_and_not_counted(self, mongo):
        """During Welcome Week, /ai/affirmation, /ai/reset, /ai/journal-insights
        all succeed without hitting the weekly cap."""
        now = datetime.now(timezone.utc)
        uid, tok = _seed_user_and_session(
            mongo, tier="free", welcome_week_start=now - timedelta(days=1),
        )
        headers = _auth(tok)
        try:
            _reset_quota(mongo, uid)

            # Make 4 affirmation calls (more than free weekly limit)
            for i in range(4):
                r = requests.post(f"{API}/ai/affirmation", headers=headers,
                                  json={"theme": f"ww-{i}"}, timeout=60)
                assert r.status_code == 200, f"ww call #{i+1} failed: {r.status_code} {r.text}"

            # Usage should still report unlimited/welcome_week_active
            d = requests.get(f"{API}/ai/usage", headers=headers).json()
            assert d["unlimited"] is True
            assert d["welcome_week_active"] is True

            # /ai/reset streams successfully
            with requests.post(f"{API}/ai/reset", headers=headers,
                               json={"mood": "tired"}, stream=True, timeout=90) as rr:
                assert rr.status_code == 200
                for _ in rr.iter_lines():
                    pass

            # /ai/journal-insights - needs data first
            requests.post(f"{API}/journal", headers=headers, json={"text": "welcome week seed entry"})
            ri = requests.post(f"{API}/ai/journal-insights", headers=headers, timeout=90)
            assert ri.status_code == 200, ri.text
        finally:
            _cleanup_user(mongo, uid)


# ============================================================
# Free tier weekly cap (4th call -> 429)
# ============================================================
class TestFreeWeeklyCap:
    def test_free_4th_call_is_429_with_weekly_message(self, mongo):
        # Free user with NO welcome week set
        uid, tok = _seed_user_and_session(mongo, tier="free")
        headers = _auth(tok)
        try:
            _reset_quota(mongo, uid)
            for i in range(FREE_WEEKLY_AI_LIMIT):
                r = requests.post(f"{API}/ai/affirmation", headers=headers,
                                  json={"theme": f"w-{i}"}, timeout=60)
                assert r.status_code == 200, f"call #{i+1} failed: {r.status_code} {r.text}"

            usage = requests.get(f"{API}/ai/usage", headers=headers).json()
            assert usage["used_this_week"] == FREE_WEEKLY_AI_LIMIT
            assert usage["weekly_remaining"] == 0

            # 4th call -> 429
            r4 = requests.post(f"{API}/ai/affirmation", headers=headers,
                               json={"theme": "over"}, timeout=30)
            assert r4.status_code == 429, r4.text
            detail = r4.json().get("detail", "")
            assert "weekly AI resets" in detail, f"unexpected detail: {detail}"

            # Also test with /ai/reset
            r_reset = requests.post(f"{API}/ai/reset", headers=headers,
                                    json={"mood": "anxious"}, timeout=30)
            assert r_reset.status_code == 429

            # Moderation still works (safety gate)
            rm = requests.post(f"{API}/ai/moderate", headers=headers,
                               json={"text": "still ok"}, timeout=60)
            assert rm.status_code == 200
        finally:
            _cleanup_user(mongo, uid)


# ============================================================
# Blossom tier monthly cap (31st call -> 429)
# ============================================================
class TestBlossomMonthlyCap:
    def test_blossom_31st_call_is_429(self, mongo):
        """Pre-seed 30 ai_usage counters, then make one more call -> 429."""
        uid, tok = _seed_user_and_session(mongo, tier="blossom")
        headers = _auth(tok)
        try:
            _reset_quota(mongo, uid)
            # Pre-fill counter directly for both week & month buckets.
            # The enforce_ai_quota only checks 'monthly_remaining' for blossom.
            now = datetime.now(timezone.utc)
            year, week, _ = now.isocalendar()
            week_key = f"{year}-W{week:02d}"
            month_key = now.strftime("%Y-%m")
            mongo.ai_usage.insert_one({
                "user_id": uid, "period_type": "month",
                "period_key": month_key, "count": BLOSSOM_MONTHLY_AI_LIMIT,
                "updated_at": now,
            })
            mongo.ai_usage.insert_one({
                "user_id": uid, "period_type": "week",
                "period_key": week_key, "count": BLOSSOM_MONTHLY_AI_LIMIT,
                "updated_at": now,
            })

            # Verify /ai/usage sees the pre-seeded 30
            usage = requests.get(f"{API}/ai/usage", headers=headers).json()
            assert usage["used_this_month"] == BLOSSOM_MONTHLY_AI_LIMIT
            assert usage["monthly_remaining"] == 0

            # 31st call -> 429 with 'Blossom Circle AI responses'
            r = requests.post(f"{API}/ai/affirmation", headers=headers,
                              json={"theme": "over"}, timeout=30)
            assert r.status_code == 429, r.text
            detail = r.json().get("detail", "")
            assert "Blossom Circle AI responses" in detail, f"unexpected detail: {detail}"
        finally:
            _cleanup_user(mongo, uid)

    def test_blossom_30th_call_succeeds(self, mongo):
        """Pre-seed 29 usage counter, one more call should succeed (=30th, still allowed)."""
        uid, tok = _seed_user_and_session(mongo, tier="blossom")
        headers = _auth(tok)
        try:
            _reset_quota(mongo, uid)
            now = datetime.now(timezone.utc)
            month_key = now.strftime("%Y-%m")
            mongo.ai_usage.insert_one({
                "user_id": uid, "period_type": "month",
                "period_key": month_key,
                "count": BLOSSOM_MONTHLY_AI_LIMIT - 1,  # 29
                "updated_at": now,
            })

            r = requests.post(f"{API}/ai/affirmation", headers=headers,
                              json={"theme": "last one"}, timeout=60)
            assert r.status_code == 200, f"30th call should succeed: {r.status_code} {r.text}"

            usage = requests.get(f"{API}/ai/usage", headers=headers).json()
            assert usage["used_this_month"] == BLOSSOM_MONTHLY_AI_LIMIT
            assert usage["monthly_remaining"] == 0
        finally:
            _cleanup_user(mongo, uid)


# ============================================================
# POST /api/stripe/create-checkout-session
# ============================================================
class TestStripeCheckout:
    def test_free_user_can_checkout_blossom(self, mongo):
        uid, tok = _seed_user_and_session(mongo, tier="free")
        try:
            r = requests.post(
                f"{API}/stripe/create-checkout-session",
                headers=_auth(tok),
                json={"tier": "blossom", "return_to": RETURN_TO},
                timeout=30,
            )
            assert r.status_code == 200, r.text
            body = r.json()
            assert body.get("tier") == "blossom"
            assert body.get("checkout_url", "").startswith("https://checkout.stripe.com/"), body
        finally:
            _cleanup_user(mongo, uid)

    def test_free_user_can_checkout_grove(self, mongo):
        uid, tok = _seed_user_and_session(mongo, tier="free")
        try:
            r = requests.post(
                f"{API}/stripe/create-checkout-session",
                headers=_auth(tok),
                json={"tier": "grove", "return_to": RETURN_TO},
                timeout=30,
            )
            assert r.status_code == 200, r.text
            body = r.json()
            assert body.get("tier") == "grove"
            assert body.get("checkout_url", "").startswith("https://checkout.stripe.com/"), body
        finally:
            _cleanup_user(mongo, uid)

    def test_blossom_user_checkout_blossom_409(self, mongo):
        uid, tok = _seed_user_and_session(mongo, tier="blossom")
        try:
            r = requests.post(
                f"{API}/stripe/create-checkout-session",
                headers=_auth(tok),
                json={"tier": "blossom", "return_to": RETURN_TO},
                timeout=30,
            )
            assert r.status_code == 409, r.text
        finally:
            _cleanup_user(mongo, uid)

    def test_grove_user_checkout_grove_409(self, mongo):
        uid, tok = _seed_user_and_session(mongo, tier="grove")
        try:
            r = requests.post(
                f"{API}/stripe/create-checkout-session",
                headers=_auth(tok),
                json={"tier": "grove", "return_to": RETURN_TO},
                timeout=30,
            )
            assert r.status_code == 409, r.text
        finally:
            _cleanup_user(mongo, uid)

    def test_blossom_user_can_upgrade_to_grove(self, mongo):
        uid, tok = _seed_user_and_session(mongo, tier="blossom")
        try:
            r = requests.post(
                f"{API}/stripe/create-checkout-session",
                headers=_auth(tok),
                json={"tier": "grove", "return_to": RETURN_TO},
                timeout=30,
            )
            assert r.status_code == 200, r.text
            assert r.json().get("tier") == "grove"
        finally:
            _cleanup_user(mongo, uid)

    def test_invalid_tier_400(self, mongo):
        uid, tok = _seed_user_and_session(mongo, tier="free")
        try:
            r = requests.post(
                f"{API}/stripe/create-checkout-session",
                headers=_auth(tok),
                json={"tier": "invalid", "return_to": RETURN_TO},
                timeout=30,
            )
            assert r.status_code == 400, r.text
        finally:
            _cleanup_user(mongo, uid)

    def test_no_auth_401(self):
        r = requests.post(
            f"{API}/stripe/create-checkout-session",
            json={"tier": "blossom", "return_to": RETURN_TO},
            timeout=15,
        )
        assert r.status_code == 401


# ============================================================
# PATCH /api/admin/users/{user_id} tier validation
# ============================================================
class TestAdminUpdateTier:
    def test_admin_can_set_grove(self, mongo):
        admin_uid, admin_tok = _seed_user_and_session(mongo, is_admin=True, tier="grove")
        target_uid, _ = _seed_user_and_session(mongo, tier="free")
        try:
            r = requests.patch(
                f"{API}/admin/users/{target_uid}",
                headers=_auth(admin_tok),
                json={"subscription_tier": "grove"},
                timeout=15,
            )
            assert r.status_code == 200, r.text
            assert r.json()["subscription_tier"] == "grove"
        finally:
            _cleanup_user(mongo, admin_uid)
            _cleanup_user(mongo, target_uid)

    def test_admin_invalid_tier_400(self, mongo):
        admin_uid, admin_tok = _seed_user_and_session(mongo, is_admin=True, tier="grove")
        target_uid, _ = _seed_user_and_session(mongo, tier="free")
        try:
            r = requests.patch(
                f"{API}/admin/users/{target_uid}",
                headers=_auth(admin_tok),
                json={"subscription_tier": "invalid"},
                timeout=15,
            )
            assert r.status_code == 400, r.text
        finally:
            _cleanup_user(mongo, admin_uid)
            _cleanup_user(mongo, target_uid)

    def test_admin_premium_normalizes_to_blossom(self, mongo):
        admin_uid, admin_tok = _seed_user_and_session(mongo, is_admin=True, tier="grove")
        target_uid, _ = _seed_user_and_session(mongo, tier="free")
        try:
            r = requests.patch(
                f"{API}/admin/users/{target_uid}",
                headers=_auth(admin_tok),
                json={"subscription_tier": "premium"},
                timeout=15,
            )
            assert r.status_code == 200, r.text
            assert r.json()["subscription_tier"] == "blossom", (
                f"'premium' must be normalized to 'blossom', got {r.json()['subscription_tier']}"
            )
        finally:
            _cleanup_user(mongo, admin_uid)
            _cleanup_user(mongo, target_uid)


# ============================================================
# GET /api/admin/stats
# ============================================================
class TestAdminStats:
    def test_stats_has_new_tier_keys(self, mongo):
        admin_uid, admin_tok = _seed_user_and_session(mongo, is_admin=True, tier="grove")
        try:
            r = requests.get(f"{API}/admin/stats", headers=_auth(admin_tok), timeout=15)
            assert r.status_code == 200, r.text
            d = r.json()
            for k in ("blossom_users", "grove_users", "premium_users",
                      "users", "admins"):
                assert k in d, f"missing key {k}"
            assert isinstance(d["blossom_users"], int)
            assert isinstance(d["grove_users"], int)
            assert d["grove_users"] >= 1  # this admin has grove tier
        finally:
            _cleanup_user(mongo, admin_uid)


# ============================================================
# GET /api/me/subscription
# ============================================================
class TestMeSubscription:
    def test_me_subscription_shape_free(self, mongo):
        uid, tok = _seed_user_and_session(mongo, tier="free")
        try:
            r = requests.get(f"{API}/me/subscription", headers=_auth(tok), timeout=15)
            assert r.status_code == 200, r.text
            d = r.json()
            for k in ("subscription_tier", "is_admin", "welcome_week_active",
                      "welcome_week_days_left"):
                assert k in d, f"missing {k}"
            assert d["subscription_tier"] == "free"
            assert d["is_admin"] is False
            assert d["welcome_week_active"] is False
            assert d["welcome_week_days_left"] is None
        finally:
            _cleanup_user(mongo, uid)

    def test_me_subscription_legacy_premium_normalized(self, mongo):
        uid, tok = _seed_user_and_session(mongo, tier="premium")
        try:
            r = requests.get(f"{API}/me/subscription", headers=_auth(tok), timeout=15)
            assert r.status_code == 200
            assert r.json()["subscription_tier"] == "blossom"
        finally:
            _cleanup_user(mongo, uid)


# ============================================================
# /api/ai/moderate never counted against quota
# ============================================================
class TestModerationNotCounted:
    def test_moderate_does_not_bump_weekly_or_monthly(self, mongo):
        uid, tok = _seed_user_and_session(mongo, tier="free")
        headers = _auth(tok)
        try:
            _reset_quota(mongo, uid)
            r = requests.post(f"{API}/ai/moderate", headers=headers,
                              json={"text": "Feeling okay today, thanks."},
                              timeout=60)
            assert r.status_code == 200, r.text
            body = r.json()
            assert "safe" in body and "severity" in body and "categories" in body

            usage = requests.get(f"{API}/ai/usage", headers=headers).json()
            assert usage["used_this_week"] == 0, "moderation must not consume weekly quota"
            assert (usage.get("used_this_month") or 0) == 0, "moderation must not consume monthly quota"
        finally:
            _cleanup_user(mongo, uid)


# ============================================================
# Auth: no bearer -> 401 on new endpoints
# ============================================================
class TestNoAuth:
    def test_start_welcome_week_401(self):
        assert requests.post(f"{API}/user/start-welcome-week").status_code == 401

    def test_me_subscription_401(self):
        assert requests.get(f"{API}/me/subscription").status_code == 401

    def test_usage_401(self):
        assert requests.get(f"{API}/ai/usage").status_code == 401
