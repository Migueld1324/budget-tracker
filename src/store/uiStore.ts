import { create } from 'zustand';
import { getCurrentPeriod } from '../utils/periodUtils';

const THEME_STORAGE_KEY = 'theme';

interface UIStore {
  selectedPeriod: string;
  theme: 'light' | 'dark';
  setPeriod: (period: string) => void;
  toggleTheme: () => void;
  loadThemePreference: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  selectedPeriod: getCurrentPeriod(),
  theme: 'light',

  setPeriod: (period) => {
    set({ selectedPeriod: period });
  },

  toggleTheme: () => {
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      return { theme: newTheme };
    });
  },

  loadThemePreference: () => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      set({ theme: stored });
      return;
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    set({ theme: prefersDark ? 'dark' : 'light' });
  },
}));
