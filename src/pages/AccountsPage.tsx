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
import { useAccountStore } from '../store/accountStore';
import AccountList from '../components/accounts/AccountList';
import AccountForm from '../components/accounts/AccountForm';
import type { Account, AccountInput } from '../types';

interface DialogState {
  open: boolean;
  editAccount: Account | null;
}

export default function AccountsPage() {
  const user = useAuthStore((s) => s.user);
  const accounts = useAccountStore((s) => s.accounts);
  const loading = useAccountStore((s) => s.loading);
  const error = useAccountStore((s) => s.error);
  const fetchAccounts = useAccountStore((s) => s.fetchAccounts);
  const addAccount = useAccountStore((s) => s.addAccount);
  const updateAccount = useAccountStore((s) => s.updateAccount);
  const deleteAccount = useAccountStore((s) => s.deleteAccount);

  const [dialog, setDialog] = useState<DialogState>({ open: false, editAccount: null });

  const userId = user?.uid ?? '';

  useEffect(() => {
    if (!userId) return;
    fetchAccounts(userId);
  }, [userId, fetchAccounts]);

  const openAddDialog = useCallback(() => {
    setDialog({ open: true, editAccount: null });
  }, []);

  const openEditDialog = useCallback((account: Account) => {
    setDialog({ open: true, editAccount: account });
  }, []);

  const closeDialog = useCallback(() => {
    setDialog({ open: false, editAccount: null });
  }, []);

  const handleSubmit = useCallback(
    async (data: AccountInput) => {
      if (!userId) return;
      if (dialog.editAccount) {
        await updateAccount(userId, dialog.editAccount.id, data);
      } else {
        await addAccount(userId, data);
      }
      closeDialog();
    },
    [userId, dialog.editAccount, addAccount, updateAccount, closeDialog],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!userId) return;
      await deleteAccount(userId, id);
    },
    [userId, deleteAccount],
  );

  if (loading && accounts.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ pl: { xs: 6, md: 0 } }}>Cuentas</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openAddDialog}>
          Agregar Cuenta
        </Button>
      </Box>

      <AccountList
        accounts={accounts}
        onEdit={openEditDialog}
        onDelete={handleDelete}
        error={error}
      />

      <Dialog open={dialog.open} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialog.editAccount ? 'Editar Cuenta' : 'Nueva Cuenta'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <AccountForm
              initialValues={
                dialog.editAccount
                  ? { name: dialog.editAccount.name, initialBalance: dialog.editAccount.initialBalance }
                  : undefined
              }
              onSubmit={handleSubmit}
              onCancel={closeDialog}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
