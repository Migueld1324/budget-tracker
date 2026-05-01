import { useEffect, useRef, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Add from '@mui/icons-material/Add';
import FilterList from '@mui/icons-material/FilterList';

import { useAuthStore } from '../store/authStore';
import { useTransactionStore } from '../store/transactionStore';
import { useAccountStore } from '../store/accountStore';
import { useCategoryStore } from '../store/categoryStore';
import { useUIStore } from '../store/uiStore';

import TransactionTable from '../components/transactions/TransactionTable';
import TransactionForm from '../components/transactions/TransactionForm';
import PeriodSelector from '../components/common/PeriodSelector';
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
  const allTransactions = useTransactionStore((s) => s.allTransactions);
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [actionsWrapped, setActionsWrapped] = useState(false);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const actionsRef = useRef<HTMLDivElement | null>(null);
  const userId = user?.uid ?? '';

  useEffect(() => {
    if (!userId) return;
    // Only fetch if store is empty for this period
    fetchByPeriod(userId, selectedPeriod);
  }, [userId, selectedPeriod, fetchByPeriod]);

  useEffect(() => {
    if (!userId) return;
    if (accounts.length === 0) fetchAccounts(userId);
    if (!categories.Ingreso.length && !categories.Gasto.length) fetchCategories(userId);
    if (allTransactions.length === 0) fetchAll(userId);
  }, [userId]);

  useEffect(() => {
    const checkWrap = () => {
      if (!titleRef.current || !actionsRef.current) return;
      setActionsWrapped(actionsRef.current.offsetTop > titleRef.current.offsetTop + 1);
    };

    checkWrap();

    const observer = new ResizeObserver(() => checkWrap());
    if (titleRef.current) observer.observe(titleRef.current);
    if (actionsRef.current) observer.observe(actionsRef.current);

    window.addEventListener('resize', checkWrap);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', checkWrap);
    };
  }, []);

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

  const isLoading = txLoading;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {isLoading && <LinearProgress sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1200, height: 3 }} />}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Typography ref={titleRef} variant="h5" sx={{ fontWeight: 600, pl: { xs: 6, md: 0 } }}>Transacciones</Typography>
        <Box
          ref={actionsRef}
          sx={{
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            ml: 'auto',
            mr: actionsWrapped ? 'auto' : 0,
          }}
        >
          <PeriodSelector />
          <Button variant="contained" size="small" startIcon={<Add />} onClick={openAddDialog} sx={{}}>Agregar</Button>
          <Button size="small" startIcon={<FilterList />} onClick={() => setFiltersOpen(!filtersOpen)} sx={{}}>Filtros</Button>
        </Box>
      </Box>
      <TransactionTable
        transactions={transactions}
        categories={categories}
        onEdit={openEditDialog}
        onDelete={handleDelete}
        filtersOpen={filtersOpen}
        onFiltersOpenChange={setFiltersOpen}
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
