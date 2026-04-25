import { create } from 'zustand';
import type { Transaction, TransactionInput } from '../types';
import {
  getByPeriod,
  getAll,
  create as createTransaction,
  update,
  remove,
} from '../services/transactionService';

interface TransactionStore {
  transactions: Transaction[];      // filtered by period
  allTransactions: Transaction[];   // all transactions for balance calculations
  loading: boolean;
  error: string | null;
  fetchByPeriod: (userId: string, period: string) => Promise<void>;
  fetchAll: (userId: string) => Promise<void>;
  addTransaction: (userId: string, data: TransactionInput, currentPeriod: string) => Promise<void>;
  updateTransaction: (userId: string, id: string, data: Partial<TransactionInput>, currentPeriod: string) => Promise<void>;
  deleteTransaction: (userId: string, id: string, currentPeriod: string) => Promise<void>;
}

export const useTransactionStore = create<TransactionStore>((set) => ({
  transactions: [],
  allTransactions: [],
  loading: false,
  error: null,

  fetchByPeriod: async (userId, period) => {
    set({ loading: true, error: null });
    try {
      const transactions = await getByPeriod(userId, period);
      set({ transactions, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error al cargar transacciones',
        loading: false,
      });
    }
  },

  fetchAll: async (userId) => {
    set({ loading: true, error: null });
    try {
      const allTransactions = await getAll(userId);
      set({ allTransactions, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error al cargar todas las transacciones',
        loading: false,
      });
    }
  },

  addTransaction: async (userId, data, currentPeriod) => {
    set({ loading: true, error: null });
    try {
      await createTransaction(userId, data);
      const [transactions, allTransactions] = await Promise.all([
        getByPeriod(userId, currentPeriod),
        getAll(userId),
      ]);
      set({ transactions, allTransactions, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error al crear transacción',
        loading: false,
      });
    }
  },

  updateTransaction: async (userId, id, data, currentPeriod) => {
    set({ loading: true, error: null });
    try {
      await update(userId, id, data);
      const [transactions, allTransactions] = await Promise.all([
        getByPeriod(userId, currentPeriod),
        getAll(userId),
      ]);
      set({ transactions, allTransactions, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error al actualizar transacción',
        loading: false,
      });
    }
  },

  deleteTransaction: async (userId, id, currentPeriod) => {
    set({ loading: true, error: null });
    try {
      await remove(userId, id);
      const [transactions, allTransactions] = await Promise.all([
        getByPeriod(userId, currentPeriod),
        getAll(userId),
      ]);
      set({ transactions, allTransactions, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error al eliminar transacción',
        loading: false,
      });
    }
  },
}));
