import { useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import { useTheme } from '@mui/material/styles';
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

import { useAuthStore } from '../store/authStore';
import { useTransactionStore } from '../store/transactionStore';
import { useAccountStore } from '../store/accountStore';
import { useUIStore } from '../store/uiStore';

import PeriodSelector from '../components/common/PeriodSelector';
import KPIPanel from '../components/kpis/KPIPanel';
import {
  calculateTotalIncome, calculateTotalExpenses, calculateTotalEgresos,
  calculateBalance, calculateExpensesByCategory, calculateDailyExpenseAverage,
  calculateTopExpenseCategory, calculateTDCDebt, calculateSavingsRate,
} from '../utils/kpiCalculations';
import { getPreviousPeriod, isTransactionInPeriod } from '../utils/periodUtils';
import { formatMXN } from '../utils/currency';
import type { KPIValues, Transaction } from '../types';

const COLORS = ['#09297A', '#5C6BC0', '#c62828', '#e65100', '#2e7d32', '#00838f', '#4527a0', '#bf360c', '#1b5e20', '#880e4f'];

function buildKPIs(
  transactions: Transaction[],
  accounts: Parameters<typeof calculateTotalEgresos>[1],
  allTransactions: Transaction[],
): KPIValues {
  const totalIncome = calculateTotalIncome(transactions);
  const totalExpenses = calculateTotalExpenses(transactions);
  const totalEgresos = calculateTotalEgresos(transactions, accounts);
  const balance = calculateBalance(totalIncome, totalEgresos);
  const expensesByCategory = calculateExpensesByCategory(transactions);
  const dailyExpenseAverage = calculateDailyExpenseAverage(transactions);
  const topExpenseCategory = calculateTopExpenseCategory(transactions);
  const tdcDebt = calculateTDCDebt(accounts, allTransactions);
  const savingsRate = calculateSavingsRate(totalIncome, totalEgresos);
  return { totalIncome, totalExpenses, totalEgresos, balance, expensesByCategory, dailyExpenseAverage, topExpenseCategory, tdcDebt, savingsRate };
}

function buildDailyExpenses(transactions: Transaction[]): { day: string; total: number }[] {
  const map = new Map<string, number>();
  for (const t of transactions) {
    if (t.type === 'Gasto') {
      map.set(t.date, (map.get(t.date) ?? 0) + t.amount);
    }
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, total]) => ({ day: day.slice(5), total }));
}

function CustomTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <Paper sx={{ p: 1 }}>
      <Typography variant="body2">{label}</Typography>
      <Typography variant="body2" color="primary">{formatMXN(payload[0].value)}</Typography>
    </Paper>
  );
}

function PieTooltipContent({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <Paper sx={{ p: 1 }}>
      <Typography variant="body2">{payload[0].name}</Typography>
      <Typography variant="body2" color="primary">{formatMXN(payload[0].value)}</Typography>
    </Paper>
  );
}

function ThermometerChart({ income, expenses }: { income: number; expenses: number }) {
  const theme = useTheme();
  const max = Math.max(income, expenses, 1);
  const incomePercent = (income / max) * 100;
  const expensesPercent = (expenses / max) * 100;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>Ingresos</Typography>
          <Typography variant="body2" sx={{ fontWeight: 700 }} color="success.main">{formatMXN(income)}</Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={incomePercent}
          sx={{
            height: 24, borderRadius: 12,
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            '& .MuiLinearProgress-bar': { borderRadius: 12, bgcolor: 'success.main' },
          }}
        />
      </Box>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>Gastos</Typography>
          <Typography variant="body2" sx={{ fontWeight: 700 }} color="error.main">{formatMXN(expenses)}</Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={expensesPercent}
          sx={{
            height: 24, borderRadius: 12,
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            '& .MuiLinearProgress-bar': { borderRadius: 12, bgcolor: 'error.main' },
          }}
        />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>Diferencia</Typography>
        <Typography variant="body2" sx={{ fontWeight: 700 }} color={income >= expenses ? 'success.main' : 'error.main'}>
          {income >= expenses ? '+' : ''}{formatMXN(income - expenses)}
        </Typography>
      </Box>
    </Box>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const selectedPeriod = useUIStore((s) => s.selectedPeriod);
  const transactions = useTransactionStore((s) => s.transactions);
  const allTransactions = useTransactionStore((s) => s.allTransactions);
  const txLoading = useTransactionStore((s) => s.loading);
  const fetchByPeriod = useTransactionStore((s) => s.fetchByPeriod);
  const fetchAll = useTransactionStore((s) => s.fetchAll);
  const accounts = useAccountStore((s) => s.accounts);
  const fetchAccounts = useAccountStore((s) => s.fetchAccounts);
  const theme = useTheme();
  const userId = user?.uid ?? '';

  useEffect(() => {
    if (!userId) return;
    fetchByPeriod(userId, selectedPeriod);
  }, [userId, selectedPeriod, fetchByPeriod]);

  useEffect(() => {
    if (!userId) return;
    fetchAll(userId);
    fetchAccounts(userId);
  }, [userId, fetchAll, fetchAccounts]);

  const currentKPIs = useMemo(() => buildKPIs(transactions, accounts, allTransactions), [transactions, accounts, allTransactions]);
  const previousKPIs = useMemo(() => {
    const prev = allTransactions.filter((t) => isTransactionInPeriod(t, getPreviousPeriod(selectedPeriod)));
    if (prev.length === 0) return null;
    return buildKPIs(prev, accounts, allTransactions);
  }, [selectedPeriod, allTransactions, accounts]);

  const pieData = useMemo(() => {
    return Array.from(currentKPIs.expensesByCategory.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [currentKPIs.expensesByCategory]);

  const dailyData = useMemo(() => buildDailyExpenses(transactions), [transactions]);

  if (txLoading && transactions.length === 0) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  }

  const textColor = theme.palette.text.primary;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
        <PeriodSelector />
      </Box>

      <KPIPanel currentPeriodKPIs={currentKPIs} previousPeriodKPIs={previousKPIs} />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>Ingresos vs Gastos</Typography>
          <ThermometerChart income={currentKPIs.totalIncome} expenses={currentKPIs.totalExpenses} />
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>Gasto por Categoría</Typography>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <ReTooltip content={<PieTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          ) : <Typography color="text.secondary">Sin gastos en este período</Typography>}
        </Paper>
      </Box>

      {dailyData.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>Gasto Diario</Typography>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fill: textColor, fontSize: 12 }} />
              <YAxis tickFormatter={(v) => formatMXN(v)} tick={{ fill: textColor }} width={100} />
              <ReTooltip content={<CustomTooltipContent />} />
              <Bar dataKey="total" fill={theme.palette.secondary.main} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      )}
    </Box>
  );
}
