import { create } from 'zustand';
import type { CategoryLists, TransactionType } from '../types';
import {
  getAll,
  addCategory as addCategoryService,
  deleteCategory as deleteCategoryService,
  updateCategory as updateCategoryService,
  hasTransactions,
} from '../services/categoryService';
import { getAll as getAllTransactions } from '../services/transactionService';

interface CategoryStore {
  categories: CategoryLists;
  loading: boolean;
  error: string | null;
  fetchCategories: (userId: string) => Promise<void>;
  addCategory: (userId: string, type: TransactionType, name: string) => Promise<void>;
  deleteCategory: (userId: string, type: TransactionType, name: string) => Promise<void>;
  updateCategory: (userId: string, type: TransactionType, oldName: string, newName: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryStore>((set) => ({
  categories: { Ingreso: [], Gasto: [], Transferencia: [] },
  loading: false,
  error: null,

  fetchCategories: async (userId) => {
    set({ loading: true, error: null });
    try {
      const categories = await getAll(userId);
      set({ categories, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error al cargar categorías',
        loading: false,
      });
    }
  },

  addCategory: async (userId, type, name) => {
    set({ loading: true, error: null });
    try {
      await addCategoryService(userId, type, name);
      const categories = await getAll(userId);
      set({ categories, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error al agregar categoría',
        loading: false,
      });
    }
  },

  deleteCategory: async (userId, type, name) => {
    set({ loading: true, error: null });
    try {
      const hasTxns = await hasTransactions(userId, type, name);
      if (hasTxns) {
        set({
          error: 'No se puede eliminar: la categoría tiene transacciones asociadas',
          loading: false,
        });
        return;
      }
      await deleteCategoryService(userId, type, name);
      const categories = await getAll(userId);
      set({ categories, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error al eliminar categoría',
        loading: false,
      });
    }
  },

  updateCategory: async (userId, type, oldName, newName) => {
    set({ loading: true, error: null });
    try {
      await updateCategoryService(userId, type, oldName, newName);
      const [categories, allTransactions] = await Promise.all([
        getAll(userId),
        getAllTransactions(userId),
      ]);
      
      // Update the transaction store as well
      const { useTransactionStore } = await import('./transactionStore');
      useTransactionStore.setState({ allTransactions });
      
      set({ categories, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error al actualizar categoría',
        loading: false,
      });
    }
  },
}));
