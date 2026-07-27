import { create } from 'zustand';

interface AppState {
  selectedMood: { label: string; emoji: string; color: string } | null;
  setSelectedMood: (mood: { label: string; emoji: string; color: string } | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedMood: null,
  setSelectedMood: (mood) => set({ selectedMood: mood }),
}));