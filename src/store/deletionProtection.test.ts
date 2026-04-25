/**
 * Feature: budget-tracker, Property 21: Protección contra eliminación de entidades con transacciones
 * Validates: Requirements 1.5, 2.4
 *
 * Verifies that accounts and categories with associated transactions cannot be deleted.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAccountStore } from './accountStore';
import { useCategoryStore } from './categoryStore';
import * as accountService from '../services/accountService';
import * as categoryService from '../services/categoryService';

vi.mock('../services/accountService');
vi.mock('../services/categoryService');

const USER_ID = 'test-user-123';

describe('Property 21: Protección contra eliminación de entidades con transacciones', () => {
  beforeEach(() => {
    // Reset Zustand stores
    useAccountStore.setState({
      accounts: [],
      loading: false,
      error: null,
    });
    useCategoryStore.setState({
      categories: { Ingreso: [], Gasto: [], Transferencia: [] },
      loading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  describe('Account deletion protection', () => {
    const mockAccount = {
      id: 'acc-1',
      userId: USER_ID,
      name: 'BBVA',
      initialBalance: 100000,
      isTDC: false,
      createdAt: { seconds: 0, nanoseconds: 0 },
    };

    beforeEach(() => {
      // Populate accounts in the store
      useAccountStore.setState({ accounts: [mockAccount] as any });
    });

    it('should reject deletion when account has transactions', async () => {
      vi.mocked(accountService.hasTransactions).mockResolvedValue(true);

      await useAccountStore.getState().deleteAccount(USER_ID, 'acc-1');

      const state = useAccountStore.getState();
      expect(state.error).toBe(
        'No se puede eliminar: la cuenta tiene transacciones asociadas'
      );
      expect(accountService.remove).not.toHaveBeenCalled();
    });

    it('should allow deletion when account has no transactions', async () => {
      vi.mocked(accountService.hasTransactions).mockResolvedValue(false);
      vi.mocked(accountService.remove).mockResolvedValue(undefined);
      vi.mocked(accountService.getAll).mockResolvedValue([]);

      await useAccountStore.getState().deleteAccount(USER_ID, 'acc-1');

      const state = useAccountStore.getState();
      expect(state.error).toBeNull();
      expect(accountService.remove).toHaveBeenCalledWith(USER_ID, 'acc-1');
    });

    it('should not call hasTransactions if account does not exist', async () => {
      await useAccountStore.getState().deleteAccount(USER_ID, 'non-existent');

      const state = useAccountStore.getState();
      expect(state.error).toBe('Cuenta no encontrada');
      expect(accountService.hasTransactions).not.toHaveBeenCalled();
      expect(accountService.remove).not.toHaveBeenCalled();
    });
  });

  describe('Category deletion protection', () => {
    it('should reject deletion when category has transactions', async () => {
      vi.mocked(categoryService.hasTransactions).mockResolvedValue(true);

      await useCategoryStore.getState().deleteCategory(USER_ID, 'Gasto', 'Comida');

      const state = useCategoryStore.getState();
      expect(state.error).toBe(
        'No se puede eliminar: la categoría tiene transacciones asociadas'
      );
      expect(categoryService.deleteCategory).not.toHaveBeenCalled();
    });

    it('should allow deletion when category has no transactions', async () => {
      vi.mocked(categoryService.hasTransactions).mockResolvedValue(false);
      vi.mocked(categoryService.deleteCategory).mockResolvedValue(undefined);
      vi.mocked(categoryService.getAll).mockResolvedValue({
        Ingreso: [],
        Gasto: [],
        Transferencia: [],
      });

      await useCategoryStore.getState().deleteCategory(USER_ID, 'Gasto', 'Comida');

      const state = useCategoryStore.getState();
      expect(state.error).toBeNull();
      expect(categoryService.deleteCategory).toHaveBeenCalledWith(
        USER_ID,
        'Gasto',
        'Comida'
      );
    });
  });
});
