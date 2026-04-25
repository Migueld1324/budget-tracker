import { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Add from '@mui/icons-material/Add';

import { useAuthStore } from '../store/authStore';
import { useTransactionStore } from '../store/transactionStore';
import { useAccountStore } from '../store/accountStore';
import { useCategoryStore } from '../store/categoryStore';
import { useUIStore } from '../store/uiStore';

import TransactionTable from '../components/transactions/TransactionTable';
import TransactionForm from '../components/transactions/TransactionForm';
import PeriodSelector, { periodToDisplay } from '../components/common/PeriodSelector';
import type { TransactionInput } from '../types';

interface DialogState {
  open: boolean;
  editId: string | null;
  initialValues?: Partial<TransactionInput>;
}

export default function TransactionsPage() {
  const user = useAuthStore((s) => s.user);
  const selectedPeriod = useUIStore((s) => s.selectedPeriod);
  const transactions = useTransactionStore((s) => s.transactions);
  const txLoading = useTransactionStore((s) => s.loading);
  const fetchByPeriod = useTransactionStore((s) => s.fetchByPeriod);
  const fetchAll = useTransactionStore((s) => s.fetchAll);
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const updateTransaction = useTransactionStore((s) => s.updateTransaction);
  const deleteTransaction = useTransactionStore((s) => s.deleteTransaction);
  const accounts = useAccountStore((s) => s.accounts);
  const fetchAccounts = useAccountStore((s) => s.fetchAccounts);
  const categories = useCategoryStore((s) => s.categories);
  const fetchCategories = useCategoryStore((s) => s.fetchCategories);

  const [dialog, setDialog] = useState<DialogState>({ open: false, editId: null });
  const userId = user?.uid ?? '';

  useEffect(() => {
    if (!userId) return;
    fetchByPeriod(userId, selectedPeriod);
  }, [userId, selectedPeriod, fetchByPeriod]);

  useEffect(() => {
    if (!userId) return;
    fetchAccounts(userId);
    fetchCategories(userId);
    fetchAll(userId);
  }, [userId, fetchAccounts, fetchCategories, fetchAll]);

  const openAddDialog = useCallback(() => setDialog({ open: true, editId: null }), []);
  const openEditDialog = useCallback((id: string, data: Partial<TransactionInput>) => {
    setDialog({ open: true, editId: id, initialValues: data });
  }, []);
  const closeDialog = useCallback(() => setDialog({ open: false, editId: null }), []);

  const handleSubmit = useCallback(async (data: TransactionInput) => {
    if (!userId) return;
    if (dialog.editId) {
      await updateTransaction(userId, dialog.editId, data, selectedPeriod);
    } else {
      await addTransaction(userId, data, selectedPeriod);
    }
    closeDialog();
  }, [userId, dialog.editId, selectedPeriod, addTransaction, updateTransaction, closeDialog]);

  const handleDelete = useCallback(async (id: string) => {
    if (!userId) return;
    await deleteTransaction(userId, id, selectedPeriod);
  }, [userId, selectedPeriod, deleteTransaction]);

  if (txLoading && transactions.length === 0) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>Transacciones — {periodToDisplay(selectedPeriod)}</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <PeriodSelector />
          <Button variant="contained" startIcon={<Add />} onClick={openAddDialog}>Agregar</Button>
        </Box>
      </Box>
      <TransactionTable
        transactions={transactions}
        accounts={accounts}
        categories={categories}
        onEdit={openEditDialog}
        onDelete={handleDelete}
      />
      <Dialog open={dialog.open} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{dialog.editId ? 'Editar Transacción' : 'Nueva Transacción'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TransactionForm
              accounts={accounts}
              categories={categories}
              initialValues={dialog.initialValues}
              onSubmit={handleSubmit}
              onCancel={closeDialog}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
