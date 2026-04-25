import { create } from 'zustand';
import type { Account, AccountInput } from '../types';
import {
  getAll,
  create as createAccount,
  update,
  remove,
  hasTransactions,
} from '../services/accountService';

interface AccountStore {
  accounts: Account[];
  loading: boolean;
  error: string | null;
  fetchAccounts: (userId: string) => Promise<void>;
  addAccount: (userId: string, data: AccountInput) => Promise<void>;
  updateAccount: (userId: string, id: string, data: Partial<AccountInput>) => Promise<void>;
  deleteAccount: (userId: string, id: string) => Promise<void>;
}

export const useAccountStore = create<AccountStore>((set, get) => ({
  accounts: [],
  loading: false,
  error: null,

  fetchAccounts: async (userId) => {
    set({ loading: true, error: null });
    try {
      const accounts = await getAll(userId);
      set({ accounts, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error al cargar cuentas',
        loading: false,
      });
    }
  },

  addAccount: async (userId, data) => {
    set({ loading: true, error: null });
    try {
      const existing = get().accounts.find(
        (a) => a.name.toLowerCase() === data.name.toLowerCase()
      );
      if (existing) {
        set({
          error: 'Ya existe una cuenta con ese nombre',
          loading: false,
        });
        return;
      }
      await createAccount(userId, data);
      const accounts = await getAll(userId);
      set({ accounts, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error al crear cuenta',
        loading: false,
      });
    }
  },

  updateAccount: async (userId, id, data) => {
    set({ loading: true, error: null });
    try {
      await update(userId, id, data);
      const accounts = await getAll(userId);
      set({ accounts, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error al actualizar cuenta',
        loading: false,
      });
    }
  },

  deleteAccount: async (userId, id) => {
    set({ loading: true, error: null });
    try {
      const account = get().accounts.find((a) => a.id === id);
      if (!account) {
        set({ error: 'Cuenta no encontrada', loading: false });
        return;
      }
      const hasTxns = await hasTransactions(userId, account.name);
      if (hasTxns) {
        set({
          error: 'No se puede eliminar: la cuenta tiene transacciones asociadas',
          loading: false,
        });
        return;
      }
      await remove(userId, id);
      const accounts = await getAll(userId);
      set({ accounts, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error al eliminar cuenta',
        loading: false,
      });
    }
  },
}));
