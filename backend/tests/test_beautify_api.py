"""Backend API tests for Beautify Yourself & Beyond wellness app."""
import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://beautify-yourself.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# -------------------- Health --------------------
class TestHealth:
    def test_root(self, client):
        r = client.get(f"{API}/")
        assert r.status_code == 200
        assert "message" in r.json()


# -------------------- Mood --------------------
class TestMood:
    def test_create_and_list_mood(self, client):
        payload = {"mood": "TEST_calm", "color": "#78C5A0"}
        r = client.post(f"{API}/mood", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data["mood"] == payload["mood"]
        assert data["color"] == payload["color"]
        assert "id" in data

        r2 = client.get(f"{API}/mood")
        assert r2.status_code == 200
        ids = [m["id"] for m in r2.json()]
        assert data["id"] in ids


# -------------------- Journal --------------------
class TestJournal:
    entry_id = None

    def test_create_journal(self, client):
        r = client.post(f"{API}/journal", json={"text": "TEST_journal entry"})
        assert r.status_code == 200
        data = r.json()
        assert data["text"] == "TEST_journal entry"
        assert "time" in data
        assert "id" in data
        TestJournal.entry_id = data["id"]

    def test_get_journal(self, client):
        r = client.get(f"{API}/journal")
        assert r.status_code == 200
        assert any(e["id"] == TestJournal.entry_id for e in r.json())

    def test_delete_journal(self, client):
        r = client.delete(f"{API}/journal/{TestJournal.entry_id}")
        assert r.status_code == 200
        r2 = client.delete(f"{API}/journal/{TestJournal.entry_id}")
        assert r2.status_code == 404


# -------------------- Life Notes --------------------
class TestNotes:
    note_id = None

    def test_create_note(self, client):
        r = client.post(f"{API}/notes", json={"text": "TEST_note wisdom"})
        assert r.status_code == 200
        TestNotes.note_id = r.json()["id"]

    def test_get_notes(self, client):
        r = client.get(f"{API}/notes")
        assert r.status_code == 200
        assert any(n["id"] == TestNotes.note_id for n in r.json())

    def test_delete_note(self, client):
        r = client.delete(f"{API}/notes/{TestNotes.note_id}")
        assert r.status_code == 200


# -------------------- Tasks --------------------
class TestTasks:
    task_id = None

    def test_create_task(self, client):
        r = client.post(f"{API}/tasks", json={"text": "TEST_task", "priority": "high"})
        assert r.status_code == 200
        d = r.json()
        assert d["text"] == "TEST_task"
        assert d["priority"] == "high"
        assert d["completed"] is False
        TestTasks.task_id = d["id"]

    def test_update_task(self, client):
        r = client.patch(f"{API}/tasks/{TestTasks.task_id}", json={"completed": True})
        assert r.status_code == 200
        assert r.json()["completed"] is True

    def test_get_tasks(self, client):
        r = client.get(f"{API}/tasks")
        assert r.status_code == 200
        assert any(t["id"] == TestTasks.task_id and t["completed"] for t in r.json())

    def test_delete_task(self, client):
        r = client.delete(f"{API}/tasks/{TestTasks.task_id}")
        assert r.status_code == 200


# -------------------- Affirmations --------------------
class TestAffirmations:
    aff_id = None

    def test_create_affirmation(self, client):
        r = client.post(f"{API}/affirmations", json={"text": "TEST_I am enough"})
        assert r.status_code == 200
        TestAffirmations.aff_id = r.json()["id"]

    def test_get_affirmations(self, client):
        r = client.get(f"{API}/affirmations")
        assert r.status_code == 200
        assert any(a["id"] == TestAffirmations.aff_id for a in r.json())

    def test_delete_affirmation(self, client):
        r = client.delete(f"{API}/affirmations/{TestAffirmations.aff_id}")
        assert r.status_code == 200


# -------------------- Feedback --------------------
class TestFeedback:
    def test_create_and_get_feedback(self, client):
        r = client.post(f"{API}/feedback", json={"text": "TEST_feedback message"})
        assert r.status_code == 200
        fid = r.json()["id"]
        assert "time" in r.json()

        r2 = client.get(f"{API}/feedback")
        assert r2.status_code == 200
        assert any(f["id"] == fid for f in r2.json())


# -------------------- Declutter --------------------
class TestDeclutter:
    def test_get_default_declutter(self, client):
        r = client.get(f"{API}/declutter")
        assert r.status_code == 200
        assert "items" in r.json()

    def test_update_declutter(self, client):
        items = {"item1": True, "item2": False}
        r = client.put(f"{API}/declutter", json={"items": items})
        assert r.status_code == 200
        assert r.json()["items"] == items

        r2 = client.get(f"{API}/declutter")
        assert r2.json()["items"] == items


# -------------------- Stats --------------------
class TestStats:
    def test_get_stats(self, client):
        r = client.get(f"{API}/stats")
        assert r.status_code == 200
        d = r.json()
        assert "affirmation_streak" in d
        assert "last_affirmation_date" in d

    def test_update_stats(self, client):
        r = client.patch(f"{API}/stats", json={"affirmation_streak": 5, "last_affirmation_date": "2026-01-15"})
        assert r.status_code == 200
        assert r.json()["affirmation_streak"] == 5
        assert r.json()["last_affirmation_date"] == "2026-01-15"


# -------------------- AI Reset (SSE) --------------------
class TestAIReset:
    def test_ai_reset_stream(self, client):
        # Streaming SSE endpoint
        r = requests.post(f"{API}/ai/reset", json={"mood": "anxious"}, stream=True, timeout=60)
        assert r.status_code == 200
        assert "text/event-stream" in r.headers.get("content-type", "")

        chunks = []
        done = False
        for raw in r.iter_lines(decode_unicode=True):
            if raw is None:
                continue
            if raw.startswith("data:"):
                content = raw[5:].strip()
                if content == "[DONE]":
                    done = True
                    break
                chunks.append(content)
            if len(chunks) > 200:
                break

        assert done or len(chunks) > 0, "No content received from AI stream"
        joined = "".join(chunks)
        assert len(joined) > 20, f"AI response too short: {joined!r}"
