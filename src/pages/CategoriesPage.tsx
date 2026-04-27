import { useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useAuthStore } from '../store/authStore';
import { useCategoryStore } from '../store/categoryStore';
import CategoryManager from '../components/categories/CategoryManager';
import type { TransactionType } from '../types';

export default function CategoriesPage() {
  const user = useAuthStore((s) => s.user);
  const categories = useCategoryStore((s) => s.categories);
  const loading = useCategoryStore((s) => s.loading);
  const error = useCategoryStore((s) => s.error);
  const fetchCategories = useCategoryStore((s) => s.fetchCategories);
  const addCategory = useCategoryStore((s) => s.addCategory);
  const deleteCategory = useCategoryStore((s) => s.deleteCategory);
  const updateCategory = useCategoryStore((s) => s.updateCategory);

  const userId = user?.uid ?? '';

  useEffect(() => {
    if (!userId) return;
    fetchCategories(userId);
  }, [userId, fetchCategories]);

  const handleAdd = useCallback(
    (type: TransactionType, name: string) => {
      if (!userId) return;
      addCategory(userId, type, name);
    },
    [userId, addCategory],
  );

  const handleDelete = useCallback(
    (type: TransactionType, name: string) => {
      if (!userId) return;
      deleteCategory(userId, type, name);
    },
    [userId, deleteCategory],
  );

  const handleUpdate = useCallback(
    (type: TransactionType, oldName: string, newName: string) => {
      if (!userId) return;
      updateCategory(userId, type, oldName, newName);
    },
    [userId, updateCategory],
  );

  if (loading && categories.Ingreso.length === 0 && categories.Gasto.length === 0 && categories.Transferencia.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 2 }}>
      <Typography variant="h5" sx={{ pl: { xs: 6, md: 0 } }}>Categorías</Typography>
      <CategoryManager
        categories={categories}
        onAdd={handleAdd}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
        error={error}
      />
    </Box>
  );
}
