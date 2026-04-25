/**
 * Feature: budget-tracker, Property 28: Adición de categorías
 * Validates: Requirements 2.2
 *
 * Para cualquier nombre válido y tipo, agregar la categoría resulta en que la lista la contenga.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { useCategoryStore } from './categoryStore';
import * as categoryService from '../services/categoryService';
import type { TransactionType, CategoryLists } from '../types';

vi.mock('../services/categoryService');

const USER_ID = 'test-user-add-cat';

const TYPES: TransactionType[] = ['Ingreso', 'Gasto', 'Transferencia'];

describe('Property 28: Adición de categorías', () => {
  beforeEach(() => {
    useCategoryStore.setState({
      categories: { Ingreso: [], Gasto: [], Transferencia: [] },
      loading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  it.each(TYPES)(
    'after addCategory with type "%s", the store categories list contains the new name',
    async (type) => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
          async (name) => {
            // Reset store before each run
            useCategoryStore.setState({
              categories: { Ingreso: [], Gasto: [], Transferencia: [] },
              loading: false,
              error: null,
            });
            vi.clearAllMocks();

            // Mock addCategoryService to resolve successfully
            vi.mocked(categoryService.addCategory).mockResolvedValue(undefined);

            // Mock getAll to return categories that include the new one
            const updatedCategories: CategoryLists = {
              Ingreso: [],
              Gasto: [],
              Transferencia: [],
            };
            updatedCategories[type] = [name];
            vi.mocked(categoryService.getAll).mockResolvedValue(updatedCategories);

            // Call addCategory on the store
            await useCategoryStore.getState().addCategory(USER_ID, type, name);

            // Verify the store state contains the new category
            const state = useCategoryStore.getState();
            expect(state.categories[type]).toContain(name);
            expect(state.error).toBeNull();
            expect(state.loading).toBe(false);

            // Verify service was called correctly
            expect(categoryService.addCategory).toHaveBeenCalledWith(USER_ID, type, name);
            expect(categoryService.getAll).toHaveBeenCalledWith(USER_ID);
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});
