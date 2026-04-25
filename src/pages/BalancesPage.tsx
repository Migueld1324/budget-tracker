import { useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useAuthStore } from '../store/authStore';
import { useTransactionStore } from '../store/transactionStore';
import { useAccountStore } from '../store/accountStore';
import BalancesTable from '../components/balances/BalancesTable';
import { calculateAccountBalance } from '../utils/kpiCalculations';
import type { AccountBalance } from '../types';

export default function BalancesPage() {
  const user = useAuthStore((s) => s.user);
  const allTransactions = useTransactionStore((s) => s.allTransactions);
  const txLoading = useTransactionStore((s) => s.loading);
  const fetchAll = useTransactionStore((s) => s.fetchAll);
  const accounts = useAccountStore((s) => s.accounts);
  const accLoading = useAccountStore((s) => s.loading);
  const fetchAccounts = useAccountStore((s) => s.fetchAccounts);
  const userId = user?.uid ?? '';

  useEffect(() => {
    if (!userId) return;
    fetchAll(userId);
    fetchAccounts(userId);
  }, [userId, fetchAll, fetchAccounts]);

  const balances: AccountBalance[] = useMemo(
    () => accounts.map((acc) => calculateAccountBalance(acc, allTransactions)),
    [accounts, allTransactions],
  );

  if ((txLoading || accLoading) && accounts.length === 0) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" sx={{ pl: { xs: 6, md: 0 } }}>Balances por Cuenta</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ pl: { xs: 6, md: 0 } }}>
        Balances históricos acumulados — independientes del período seleccionado
      </Typography>
      <BalancesTable balances={balances} />
    </Box>
  );
}
