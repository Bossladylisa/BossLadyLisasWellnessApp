const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

export const api = {
  // Mood
  getMoodHistory: async () => {
    const res = await fetch(`${API_BASE}/mood`);
    return res.json();
  },
  createMoodEntry: async (mood: string, color: string) => {
    const res = await fetch(`${API_BASE}/mood`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mood, color }),
    });
    return res.json();
  },

  // Journal
  getJournalEntries: async () => {
    const res = await fetch(`${API_BASE}/journal`);
    return res.json();
  },
  createJournalEntry: async (text: string) => {
    const res = await fetch(`${API_BASE}/journal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return res.json();
  },
  deleteJournalEntry: async (id: string) => {
    await fetch(`${API_BASE}/journal/${id}`, { method: 'DELETE' });
  },

  // Notes
  getLifeNotes: async () => {
    const res = await fetch(`${API_BASE}/notes`);
    return res.json();
  },
  createLifeNote: async (text: string) => {
    const res = await fetch(`${API_BASE}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return res.json();
  },
  deleteLifeNote: async (id: string) => {
    await fetch(`${API_BASE}/notes/${id}`, { method: 'DELETE' });
  },

  // Tasks
  getTasks: async () => {
    const res = await fetch(`${API_BASE}/tasks`);
    return res.json();
  },
  createTask: async (text: string, priority: string) => {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, priority }),
    });
    return res.json();
  },
  updateTask: async (id: string, completed: boolean) => {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    });
    return res.json();
  },
  deleteTask: async (id: string) => {
    await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
  },

  // Affirmations
  getAffirmations: async () => {
    const res = await fetch(`${API_BASE}/affirmations`);
    return res.json();
  },
  createAffirmation: async (text: string) => {
    const res = await fetch(`${API_BASE}/affirmations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return res.json();
  },
  deleteAffirmation: async (id: string) => {
    await fetch(`${API_BASE}/affirmations/${id}`, { method: 'DELETE' });
  },

  // Feedback
  getFeedback: async () => {
    const res = await fetch(`${API_BASE}/feedback`);
    return res.json();
  },
  createFeedback: async (text: string) => {
    const res = await fetch(`${API_BASE}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return res.json();
  },

  // Declutter
  getDeclutterState: async () => {
    const res = await fetch(`${API_BASE}/declutter`);
    return res.json();
  },
  updateDeclutterState: async (items: Record<string, boolean>) => {
    const res = await fetch(`${API_BASE}/declutter`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    return res.json();
  },

  // Stats
  getUserStats: async () => {
    const res = await fetch(`${API_BASE}/stats`);
    return res.json();
  },
  updateUserStats: async (affirmation_streak: number, last_affirmation_date: string) => {
    const res = await fetch(`${API_BASE}/stats`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ affirmation_streak, last_affirmation_date }),
    });
    return res.json();
  },

  // AI
  generateAIReset: async (mood: string) => {
    const res = await fetch(`${API_BASE}/ai/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mood }),
    });
    return res;
  },
};
