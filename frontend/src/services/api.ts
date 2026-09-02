import { authFetch } from '../store/useAuth';

export const api = {
  // Mood
  getMoodHistory: async () => (await authFetch('/mood')).json(),
  createMoodEntry: async (mood: string, color: string) =>
    (await authFetch('/mood', { method: 'POST', body: JSON.stringify({ mood, color }) })).json(),

  // Journal
  getJournalEntries: async () => (await authFetch('/journal')).json(),
  createJournalEntry: async (text: string) =>
    (await authFetch('/journal', { method: 'POST', body: JSON.stringify({ text }) })).json(),
  deleteJournalEntry: async (id: string) => {
    await authFetch(`/journal/${id}`, { method: 'DELETE' });
  },

  // Notes
  getLifeNotes: async () => (await authFetch('/notes')).json(),
  createLifeNote: async (text: string) =>
    (await authFetch('/notes', { method: 'POST', body: JSON.stringify({ text }) })).json(),
  deleteLifeNote: async (id: string) => {
    await authFetch(`/notes/${id}`, { method: 'DELETE' });
  },

  // Tasks (Premium)
  getTasks: async () => (await authFetch('/tasks')).json(),
  createTask: async (text: string, priority: string) =>
    (await authFetch('/tasks', { method: 'POST', body: JSON.stringify({ text, priority }) })).json(),
  updateTask: async (id: string, completed: boolean) =>
    (await authFetch(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ completed }) })).json(),
  deleteTask: async (id: string) => {
    await authFetch(`/tasks/${id}`, { method: 'DELETE' });
  },

  // Affirmations (Premium)
  getAffirmations: async () => (await authFetch('/affirmations')).json(),
  createAffirmation: async (text: string) =>
    (await authFetch('/affirmations', { method: 'POST', body: JSON.stringify({ text }) })).json(),
  deleteAffirmation: async (id: string) => {
    await authFetch(`/affirmations/${id}`, { method: 'DELETE' });
  },

  // Feedback
  getFeedback: async () => (await authFetch('/feedback')).json(),
  createFeedback: async (text: string) =>
    (await authFetch('/feedback', { method: 'POST', body: JSON.stringify({ text }) })).json(),

  // Declutter (Premium)
  getDeclutterState: async () => (await authFetch('/declutter')).json(),
  updateDeclutterState: async (items: Record<string, boolean>) =>
    (await authFetch('/declutter', { method: 'PUT', body: JSON.stringify({ items }) })).json(),

  // Stats (Premium)
  getUserStats: async () => (await authFetch('/stats')).json(),
  updateUserStats: async (affirmation_streak: number, last_affirmation_date: string) =>
    (await authFetch('/stats', {
      method: 'PATCH',
      body: JSON.stringify({ affirmation_streak, last_affirmation_date }),
    })).json(),

  // AI (Claude Sonnet 5 · Free 3/day, Premium unlimited)
  generateAIReset: async (mood: string) =>
    await authFetch('/ai/reset', { method: 'POST', body: JSON.stringify({ mood }) }),
  getAIUsage: async () => (await authFetch('/ai/usage')).json(),
  generateJournalInsights: async () =>
    (await authFetch('/ai/journal-insights', { method: 'POST', body: JSON.stringify({}) })).json(),
  generateAIAffirmation: async (theme?: string) =>
    (await authFetch('/ai/affirmation', {
      method: 'POST',
      body: JSON.stringify({ theme: theme || null }),
    })).json(),
  moderateText: async (text: string) =>
    (await authFetch('/ai/moderate', { method: 'POST', body: JSON.stringify({ text }) })).json(),

  // Subscription
  getSubscription: async () => (await authFetch('/me/subscription')).json(),
  createCheckout: async (returnTo: string) =>
    (await authFetch('/stripe/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ return_to: returnTo }),
    })).json(),
};
