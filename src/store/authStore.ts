import { create } from 'zustand';
import type { User } from 'firebase/auth';
import type { Unsubscribe } from 'firebase/auth';
import {
  signIn,
  signUp,
  signOut,
  onAuthStateChanged,
} from '../services/authService';

interface AuthStore {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  listenAuthState: () => Unsubscribe;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const credential = await signIn(email, password);
      set({ user: credential.user, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error al iniciar sesión',
        loading: false,
      });
    }
  },

  register: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const credential = await signUp(email, password);
      set({ user: credential.user, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error al registrarse',
        loading: false,
      });
    }
  },

  logout: async () => {
    set({ loading: true, error: null });
    try {
      await signOut();
      set({ user: null, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error al cerrar sesión',
        loading: false,
      });
    }
  },

  listenAuthState: () => {
    return onAuthStateChanged((user) => {
      set({ user, loading: false });
    });
  },
}));
