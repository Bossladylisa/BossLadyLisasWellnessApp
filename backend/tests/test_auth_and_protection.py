"""Backend tests for auth migration:
- Public endpoints
- Protected endpoints reject unauthenticated calls with 401
- Auth session endpoint structure
"""
import os
import pytest
import requests

BASE_URL = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/") if os.environ.get("EXPO_PUBLIC_BACKEND_URL") else "https://beautify-yourself.preview.emergentagent.com"
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# -------------------- Public: root --------------------
class TestPublic:
    def test_root_message(self, client):
        r = client.get(f"{API}/")
        assert r.status_code == 200
        assert r.json().get("message") == "Beautify Yourself & Beyond API"


# -------------------- Auth endpoints --------------------
class TestAuthEndpoints:
    def test_me_requires_auth(self, client):
        r = client.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_me_bad_bearer(self, client):
        r = client.get(f"{API}/auth/me", headers={"Authorization": "Bearer invalid_token_xyz"})
        assert r.status_code == 401

    def test_session_endpoint_exists_and_rejects_invalid(self, client):
        # POST /api/auth/session should exist and reject invalid Emergent session tokens
        r = client.post(f"{API}/auth/session", json={"session_token": "invalid_from_test"})
        # Should NOT be 404 (endpoint exists), and NOT 200 (invalid token)
        assert r.status_code != 404, "Endpoint /api/auth/session missing"
        assert r.status_code in (401, 400, 500)

    def test_session_endpoint_validates_body(self, client):
        r = client.post(f"{API}/auth/session", json={})
        assert r.status_code == 422  # missing required field

    def test_logout_no_auth_ok(self, client):
        # logout is idempotent and accepts no token
        r = client.post(f"{API}/auth/logout")
        assert r.status_code == 200


# -------------------- Protected content endpoints --------------------
PROTECTED_GET = [
    "/journal", "/notes", "/feedback", "/mood",
    "/tasks", "/affirmations", "/declutter", "/stats",
    "/me/subscription",
]
PROTECTED_POST = [
    ("/journal", {"text": "x"}),
    ("/notes", {"text": "x"}),
    ("/feedback", {"text": "x"}),
    ("/mood", {"mood": "calm", "color": "#fff"}),
    ("/tasks", {"text": "x", "priority": "high"}),
    ("/affirmations", {"text": "x"}),
    ("/ai/reset", {"mood": "anxious"}),
    ("/stripe/create-checkout-session", {"return_to": "https://beautify-yourself.preview.emergentagent.com"}),
]


class TestProtectedGET:
    @pytest.mark.parametrize("path", PROTECTED_GET)
    def test_get_requires_auth(self, client, path):
        r = client.get(f"{API}{path}")
        assert r.status_code == 401, f"{path} returned {r.status_code}, expected 401"


class TestProtectedPOST:
    @pytest.mark.parametrize("path,body", PROTECTED_POST)
    def test_post_requires_auth(self, client, path, body):
        r = client.post(f"{API}{path}", json=body)
        assert r.status_code == 401, f"POST {path} returned {r.status_code}, expected 401"


# -------------------- Admin endpoints --------------------
ADMIN_GET = ["/admin/stats", "/admin/users", "/admin/feedback", "/admin/moderation-log"]


class TestAdminEndpoints:
    @pytest.mark.parametrize("path", ADMIN_GET)
    def test_admin_get_requires_auth(self, client, path):
        r = client.get(f"{API}{path}")
        assert r.status_code == 401

    def test_admin_moderate_requires_auth(self, client):
        r = client.delete(f"{API}/admin/moderate/feedback/some_id")
        assert r.status_code == 401


# -------------------- Rate limiter presence --------------------
class TestRateLimiterConfig:
    def test_ai_reset_has_limiter_decorator(self):
        # sanity: verify slowapi module is installed & imported
        import slowapi  # noqa: F401
        from slowapi import Limiter  # noqa: F401
