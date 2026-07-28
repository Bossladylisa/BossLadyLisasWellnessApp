import { create } from 'zustand';
import { THEMES, Theme, ThemeKey } from '../constants/themes';
import { storage } from '../utils/storage';

const THEME_STORAGE_KEY = 'byb-theme-key';

interface ThemeStore {
  themeKey: ThemeKey;
  setTheme: (key: ThemeKey) => Promise<void>;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  themeKey: 'sunset',
  setTheme: async (key: ThemeKey) => {
    set({ themeKey: key });
    await storage.setItem(THEME_STORAGE_KEY, key);
  },
  loadTheme: async () => {
    const savedKey = await storage.getItem(THEME_STORAGE_KEY, 'sunset' as string);
    if (savedKey && savedKey in THEMES) {
      set({ themeKey: savedKey as ThemeKey });
    }
  },
}));

export const useTheme = (): Theme => {
  const themeKey = useThemeStore((s) => s.themeKey);
  return THEMES[themeKey];
};
