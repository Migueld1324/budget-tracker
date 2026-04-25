/**
 * Feature: budget-tracker, Property 23: Aislamiento de datos por usuario
 * Validates: Requirements 10.4
 *
 * Verifies that all data operations include the authenticated user's userId,
 * ensuring that a user cannot access another user's data.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAccountStore } from '../store/accountStore';
import { useCategoryStore } from '../store/categoryStore';
import { useTransactionStore } from '../store/transactionStore';
import * as accountService from '../services/accountService';
import * as categoryService from '../services/categoryService';
import * as transactionService from '../services/transactionService';

vi.mock('../services/accountService');
vi.mock('../services/categoryService');
vi.mock('../services/transactionService');

const TEST_USER_ID = 'user-abc-123';

describe('Property 23: Aislamiento de datos por usuario', () => {
  beforeEach(() => {
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
    useTransactionStore.setState({
      transactions: [],
      allTransactions: [],
      loading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  describe('accountStore passes userId to all service calls', () => {
    it('fetchAccounts passes userId to getAll', async () => {
      vi.mocked(accountService.getAll).mockResolvedValue([]);

      await useAccountStore.getState().fetchAccounts(TEST_USER_ID);

      expect(accountService.getAll).toHaveBeenCalledWith(TEST_USER_ID);
    });

    it('addAccount passes userId to create and getAll', async () => {
      vi.mocked(accountService.create).mockResolvedValue('new-id');
      vi.mocked(accountService.getAll).mockResolvedValue([]);

      await useAccountStore.getState().addAccount(TEST_USER_ID, {
        name: 'BBVA',
        initialBalance: 50000,
      });

      expect(accountService.create).toHaveBeenCalledWith(
        TEST_USER_ID,
        expect.objectContaining({ name: 'BBVA' })
      );
      expect(accountService.getAll).toHaveBeenCalledWith(TEST_USER_ID);
    });

    it('updateAccount passes userId to update and getAll', async () => {
      vi.mocked(accountService.update).mockResolvedValue(undefined);
      vi.mocked(accountService.getAll).mockResolvedValue([]);

      await useAccountStore.getState().updateAccount(TEST_USER_ID, 'acc-1', {
        name: 'BBVA Updated',
      });

      expect(accountService.update).toHaveBeenCalledWith(
        TEST_USER_ID,
        'acc-1',
        expect.objectContaining({ name: 'BBVA Updated' })
      );
      expect(accountService.getAll).toHaveBeenCalledWith(TEST_USER_ID);
    });

    it('deleteAccount passes userId to hasTransactions, remove, and getAll', async () => {
      const mockAccount = {
        id: 'acc-1',
        userId: TEST_USER_ID,
        name: 'Efectivo',
        initialBalance: 0,
        isTDC: false,
        createdAt: { seconds: 0, nanoseconds: 0 },
      };
      useAccountStore.setState({ accounts: [mockAccount] as any });

      vi.mocked(accountService.hasTransactions).mockResolvedValue(false);
      vi.mocked(accountService.remove).mockResolvedValue(undefined);
      vi.mocked(accountService.getAll).mockResolvedValue([]);

      await useAccountStore.getState().deleteAccount(TEST_USER_ID, 'acc-1');

      expect(accountService.hasTransactions).toHaveBeenCalledWith(
        TEST_USER_ID,
        'Efectivo'
      );
      expect(accountService.remove).toHaveBeenCalledWith(TEST_USER_ID, 'acc-1');
      expect(accountService.getAll).toHaveBeenCalledWith(TEST_USER_ID);
    });
  });

  describe('categoryStore passes userId to all service calls', () => {
    it('fetchCategories passes userId to getAll', async () => {
      vi.mocked(categoryService.getAll).mockResolvedValue({
        Ingreso: [],
        Gasto: [],
        Transferencia: [],
      });

      await useCategoryStore.getState().fetchCategories(TEST_USER_ID);

      expect(categoryService.getAll).toHaveBeenCalledWith(TEST_USER_ID);
    });

    it('addCategory passes userId to addCategory and getAll', async () => {
      vi.mocked(categoryService.addCategory).mockResolvedValue(undefined);
      vi.mocked(categoryService.getAll).mockResolvedValue({
        Ingreso: [],
        Gasto: ['Comida'],
        Transferencia: [],
      });

      await useCategoryStore.getState().addCategory(TEST_USER_ID, 'Gasto', 'Comida');

      expect(categoryService.addCategory).toHaveBeenCalledWith(
        TEST_USER_ID,
        'Gasto',
        'Comida'
      );
      expect(categoryService.getAll).toHaveBeenCalledWith(TEST_USER_ID);
    });

    it('deleteCategory passes userId to hasTransactions, deleteCategory, and getAll', async () => {
      vi.mocked(categoryService.hasTransactions).mockResolvedValue(false);
      vi.mocked(categoryService.deleteCategory).mockResolvedValue(undefined);
      vi.mocked(categoryService.getAll).mockResolvedValue({
        Ingreso: [],
        Gasto: [],
        Transferencia: [],
      });

      await useCategoryStore.getState().deleteCategory(TEST_USER_ID, 'Gasto', 'Comida');

      expect(categoryService.hasTransactions).toHaveBeenCalledWith(
        TEST_USER_ID,
        'Gasto',
        'Comida'
      );
      expect(categoryService.deleteCategory).toHaveBeenCalledWith(
        TEST_USER_ID,
        'Gasto',
        'Comida'
      );
      expect(categoryService.getAll).toHaveBeenCalledWith(TEST_USER_ID);
    });
  });

  describe('transactionStore passes userId to all service calls', () => {
    it('fetchByPeriod passes userId to getByPeriod', async () => {
      vi.mocked(transactionService.getByPeriod).mockResolvedValue([]);

      await useTransactionStore.getState().fetchByPeriod(TEST_USER_ID, 'abr-2026');

      expect(transactionService.getByPeriod).toHaveBeenCalledWith(
        TEST_USER_ID,
        'abr-2026'
      );
    });

    it('fetchAll passes userId to getAll', async () => {
      vi.mocked(transactionService.getAll).mockResolvedValue([]);

      await useTransactionStore.getState().fetchAll(TEST_USER_ID);

      expect(transactionService.getAll).toHaveBeenCalledWith(TEST_USER_ID);
    });

    it('addTransaction passes userId to create, getByPeriod, and getAll', async () => {
      vi.mocked(transactionService.create).mockResolvedValue('txn-1');
      vi.mocked(transactionService.getByPeriod).mockResolvedValue([]);
      vi.mocked(transactionService.getAll).mockResolvedValue([]);

      const txnData = {
        date: '2026-04-15',
        type: 'Gasto' as const,
        category: 'Comida',
        source: 'BBVA',
        destination: null,
        amount: 15000,
        description: 'Almuerzo',
      };

      await useTransactionStore.getState().addTransaction(
        TEST_USER_ID,
        txnData,
        'abr-2026'
      );

      expect(transactionService.create).toHaveBeenCalledWith(
        TEST_USER_ID,
        txnData
      );
      expect(transactionService.getByPeriod).toHaveBeenCalledWith(
        TEST_USER_ID,
        'abr-2026'
      );
      expect(transactionService.getAll).toHaveBeenCalledWith(TEST_USER_ID);
    });

    it('updateTransaction passes userId to update, getByPeriod, and getAll', async () => {
      vi.mocked(transactionService.update).mockResolvedValue(undefined);
      vi.mocked(transactionService.getByPeriod).mockResolvedValue([]);
      vi.mocked(transactionService.getAll).mockResolvedValue([]);

      await useTransactionStore.getState().updateTransaction(
        TEST_USER_ID,
        'txn-1',
        { amount: 20000 },
        'abr-2026'
      );

      expect(transactionService.update).toHaveBeenCalledWith(
        TEST_USER_ID,
        'txn-1',
        { amount: 20000 }
      );
      expect(transactionService.getByPeriod).toHaveBeenCalledWith(
        TEST_USER_ID,
        'abr-2026'
      );
      expect(transactionService.getAll).toHaveBeenCalledWith(TEST_USER_ID);
    });

    it('deleteTransaction passes userId to remove, getByPeriod, and getAll', async () => {
      vi.mocked(transactionService.remove).mockResolvedValue(undefined);
      vi.mocked(transactionService.getByPeriod).mockResolvedValue([]);
      vi.mocked(transactionService.getAll).mockResolvedValue([]);

      await useTransactionStore.getState().deleteTransaction(
        TEST_USER_ID,
        'txn-1',
        'abr-2026'
      );

      expect(transactionService.remove).toHaveBeenCalledWith(
        TEST_USER_ID,
        'txn-1'
      );
      expect(transactionService.getByPeriod).toHaveBeenCalledWith(
        TEST_USER_ID,
        'abr-2026'
      );
      expect(transactionService.getAll).toHaveBeenCalledWith(TEST_USER_ID);
    });
  });
});
