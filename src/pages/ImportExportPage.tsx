import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import CSVImport from '../components/import-export/CSVImport';
import CSVExport from '../components/import-export/CSVExport';
import { exportTransactionsCSV, exportBalancesCSV } from '../utils/csvExporter';
import { calculateAccountBalance } from '../utils/kpiCalculations';
import { useAuthStore } from '../store/authStore';
import { useTransactionStore } from '../store/transactionStore';
import { useAccountStore } from '../store/accountStore';
import { useUIStore } from '../store/uiStore';
import type { TransactionInput, AccountInput } from '../types';

function downloadCSV(csvContent: string, filename: string) {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function ImportExportPage() {
  const user = useAuthStore((s) => s.user);
  const transactions = useTransactionStore((s) => s.transactions);
  const allTransactions = useTransactionStore((s) => s.allTransactions);
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const fetchByPeriod = useTransactionStore((s) => s.fetchByPeriod);
  const fetchAll = useTransactionStore((s) => s.fetchAll);
  const accounts = useAccountStore((s) => s.accounts);
  const addAccount = useAccountStore((s) => s.addAccount);
  const fetchAccounts = useAccountStore((s) => s.fetchAccounts);
  const selectedPeriod = useUIStore((s) => s.selectedPeriod);

  const handleImportTransactions = async (data: TransactionInput[]) => {
    if (!user) return;
    for (const txn of data) {
      await addTransaction(user.uid, txn, selectedPeriod);
    }
    await fetchByPeriod(user.uid, selectedPeriod);
    await fetchAll(user.uid);
  };

  const handleImportAccounts = async (data: AccountInput[]) => {
    if (!user) return;
    for (const account of data) {
      await addAccount(user.uid, account);
    }
    await fetchAccounts(user.uid);
  };

  const handleExportTransactions = () => {
    const csv = exportTransactionsCSV(transactions, accounts);
    downloadCSV(csv, `transacciones-${selectedPeriod}.csv`);
  };

  const handleExportBalances = () => {
    const balances = accounts.map((account) =>
      calculateAccountBalance(account, allTransactions),
    );
    const csv = exportBalancesCSV(balances);
    downloadCSV(csv, 'balances.csv');
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Importar / Exportar
      </Typography>

      <CSVImport
        onImportTransactions={handleImportTransactions}
        onImportAccounts={handleImportAccounts}
      />

      <Divider sx={{ my: 4 }} />

      <CSVExport
        onExportTransactions={handleExportTransactions}
        onExportBalances={handleExportBalances}
      />
    </Box>
  );
}
