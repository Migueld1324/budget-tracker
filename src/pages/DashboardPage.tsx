import { useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import { useTheme } from '@mui/material/styles';
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer,
  Bar, XAxis, YAxis, CartesianGrid, ComposedChart, Line, BarChart,
} from 'recharts';

import { useAuthStore } from '../store/authStore';
import { useTransactionStore } from '../store/transactionStore';
import { useAccountStore } from '../store/accountStore';
import { useUIStore } from '../store/uiStore';

import PeriodSelector from '../components/common/PeriodSelector';
import KPIPanel from '../components/kpis/KPIPanel';
import AccountBalanceChart from '../components/charts/AccountBalanceChart';
import {
  calculateTotalIncome, calculateTotalExpenses, calculateTotalEgresos,
  calculateBalance, calculateExpensesByCategory, calculateDailyExpenseAverage,
  calculateTopExpenseCategory, calculateTDCDebt, calculateSavingsRate, calculateAccountBalance,
} from '../utils/kpiCalculations';
import { getPreviousPeriod, isTransactionInPeriod } from '../utils/periodUtils';
import { formatMXN } from '../utils/currency';
import type { KPIValues, Transaction, Account } from '../types';

const PIE_COLORS = {
  light: ['#09297A', '#5C6BC0', '#c62828', '#e65100', '#2e7d32', '#00838f', '#4527a0', '#bf360c', '#1b5e20', '#880e4f'],
  dark:  ['#7B9CFF', '#9FA8DA', '#ef9a9a', '#ffb74d', '#81c784', '#80DEEA', '#B39DDB', '#FFAB91', '#A5D6A7', '#F48FB1'],
};

function buildKPIs(
  transactions: Transaction[],
  accounts: Parameters<typeof calculateTotalEgresos>[1],
  allTransactions: Transaction[],
): KPIValues {
  const totalIncome = calculateTotalIncome(transactions);
  const totalExpenses = calculateTotalExpenses(transactions);
  const totalEgresos = calculateTotalEgresos(transactions, accounts);
  const balance = calculateBalance(totalIncome, totalExpenses);
  const expensesByCategory = calculateExpensesByCategory(transactions);
  const dailyExpenseAverage = calculateDailyExpenseAverage(transactions);
  const topExpenseCategory = calculateTopExpenseCategory(transactions);
  const tdcDebt = calculateTDCDebt(accounts, allTransactions);
  const savingsRate = calculateSavingsRate(totalIncome, totalEgresos);
  return { totalIncome, totalExpenses, totalEgresos, balance, expensesByCategory, dailyExpenseAverage, topExpenseCategory, tdcDebt, savingsRate };
}

function buildDailyFlow(transactions: Transaction[]): { day: string; income: number; expense: number; periodBalance: number; trend: number }[] {
  const incomeMap = new Map<string, number>();
  const expenseMap = new Map<string, number>();
  const dates = new Set<string>();
  for (const t of transactions) {
    if (t.type === 'Transferencia') continue;
    dates.add(t.date);
    if (t.type === 'Ingreso') {
      incomeMap.set(t.date, (incomeMap.get(t.date) ?? 0) + t.amount);
    } else {
      expenseMap.set(t.date, (expenseMap.get(t.date) ?? 0) + t.amount);
    }
  }
  const sortedDates = Array.from(dates).sort();
  if (sortedDates.length === 0) return [];

  let cum = 0;
  const raw = sortedDates.map(d => {
    const inc = incomeMap.get(d) ?? 0;
    const exp = expenseMap.get(d) ?? 0;
    cum += inc - exp;
    return { day: d.slice(5), income: inc, expense: -exp, periodBalance: cum };
  });

  const n = raw.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i; sumY += raw[i].periodBalance; sumXY += i * raw[i].periodBalance; sumX2 += i * i;
  }
  const denom = n * sumX2 - sumX * sumX;
  const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
  const intercept = (sumY - slope * sumX) / n;

  return raw.map((p, i) => ({ ...p, trend: intercept + slope * i }));
}

/** Build daily running balance for an account within the selected period */
/** Build per-transaction flow data for an account in the selected period */
function buildAccountFlow(
  account: Account,
  periodTransactions: Transaction[],
): { day: string; amount: number; periodBalance: number; trend: number }[] {
  const acctTxs = periodTransactions
    .filter(t => {
      const srcMatch = t.source != null && t.source === account.name;
      const dstMatch = t.destination != null && t.destination === account.name;
      return srcMatch || dstMatch;
    })
    .sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date);
      if (dateCmp !== 0) return dateCmp;
      const aTime = a.createdAt?.seconds ?? 0;
      const bTime = b.createdAt?.seconds ?? 0;
      return aTime - bTime;
    });

  if (acctTxs.length === 0) return [];

  const raw: { day: string; amount: number; periodBalance: number }[] = [];
  let cumulative = 0;
  for (let i = 0; i < acctTxs.length; i++) {
    const t = acctTxs[i];
    let amount = 0;
    if (t.destination === account.name) amount += t.amount;
    if (t.source === account.name) amount -= t.amount;
    cumulative += amount;
    const dateStr = t.date.slice(5);
    raw.push({ day: `${dateStr} #${i + 1}`, amount, periodBalance: cumulative });
  }

  // Linear regression on periodBalance for trend line
  const n = raw.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i; sumY += raw[i].periodBalance; sumXY += i * raw[i].periodBalance; sumX2 += i * i;
  }
  const denom = n * sumX2 - sumX * sumX;
  const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
  const intercept = (sumY - slope * sumX) / n;

  return raw.map((p, i) => ({ ...p, trend: intercept + slope * i }));
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

function FlowTooltipContent({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const balEntry = payload.find((p: any) => p.dataKey === 'periodBalance');
  const amtEntry = payload.find((p: any) => p.dataKey === 'amount');
  return (
    <Paper sx={{ p: 1 }}>
      {amtEntry && (
        <Typography variant="body2" sx={{ color: amtEntry.stroke || amtEntry.fill }}>
          Transacción: {formatMXN(amtEntry.value)}
        </Typography>
      )}
      {balEntry && (
        <Typography variant="body2" sx={{ color: balEntry.fill }}>
          Balance: {formatMXN(balEntry.value)}
        </Typography>
      )}
    </Paper>
  );
}

function DailyFlowTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const bal = payload.find((p: any) => p.dataKey === 'periodBalance');
  const inc = payload.find((p: any) => p.dataKey === 'income');
  const exp = payload.find((p: any) => p.dataKey === 'expense');
  return (
    <Paper sx={{ p: 1 }}>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>{label}</Typography>
      {inc && inc.value > 0 && (
        <Typography variant="body2" sx={{ color: inc.stroke }}>
          Ingresos: {formatMXN(inc.value)}
        </Typography>
      )}
      {exp && exp.value !== 0 && (
        <Typography variant="body2" sx={{ color: exp.stroke }}>
          Gastos: {formatMXN(Math.abs(exp.value))}
        </Typography>
      )}
      {bal && (
        <Typography variant="body2" sx={{ color: bal.fill }}>
          Balance: {formatMXN(bal.value)}
        </Typography>
      )}
    </Paper>
  );
}




function ThermometerChart({ income, expenses }: { income: number; expenses: number }) {
  const theme = useTheme();
  const base = income > 0 ? income : 1;
  const expensePct = Math.min((expenses / base) * 100, 100);
  const remainPct = 100 - expensePct;
  const greenColor = theme.palette.mode === 'dark' ? '#81c784' : '#2e7d32';
  const redColor = theme.palette.mode === 'dark' ? '#ef9a9a' : '#c62828';
  const data = [{ name: 'Flujo', gastos: expensePct, disponible: remainPct, gastosAmt: expenses, disponibleAmt: income - expenses }];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <ResponsiveContainer width="100%" height={50}>
        <BarChart data={data} layout="vertical" stackOffset="expand" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" hide />
          <ReTooltip content={<ThermTooltip />} cursor={{ fill: 'transparent' }} />
          <Bar dataKey="gastos" stackId="a" fill={redColor} radius={[4, 0, 0, 4]} />
          <Bar dataKey="disponible" stackId="a" fill={greenColor} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: redColor }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>Gastos: {expensePct.toFixed(2)}%</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: greenColor }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>Disponible: {remainPct.toFixed(2)}%</Typography>
        </Box>
      </Box>
    </Box>
  );
}
function ThermTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <Paper sx={{ p: 1 }}>
      <Typography variant="body2" sx={{ color: payload[0]?.fill }}>Gastos: {formatMXN(d.gastosAmt)}</Typography>
      <Typography variant="body2" sx={{ color: payload[1]?.fill }}>Disponible: {formatMXN(d.disponibleAmt)}</Typography>
    </Paper>
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

  const dailyData = useMemo(() => buildDailyFlow(transactions), [transactions]);

  // Account total balances (initial + all historical transactions)
  const accountBalances = useMemo(() => {
    return accounts
      .filter(acc => allTransactions.filter(t => t.source === acc.name || t.destination === acc.name).length >= 2)
      .map(acc => {
        const bal = calculateAccountBalance(acc, allTransactions);
        return { name: acc.name, balance: bal.balance };
      }).sort((a, b) => b.balance - a.balance);
  }, [accounts, allTransactions]);

  // Build history for accounts with transactions in the selected period
  const accountHistories = useMemo(() => {
    const activeAccounts = accounts.filter(acc =>
      transactions.some(t => t.source === acc.name || t.destination === acc.name)
    );
    return activeAccounts
      .map(acc => ({ account: acc, data: buildAccountFlow(acc, transactions) }))
      .filter(h => h.data.length > 1);
  }, [accounts, transactions]);

  if (txLoading && transactions.length === 0) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  }

  const textColor = theme.palette.text.primary;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', pl: { xs: 6, md: 0 } }}>
        <PeriodSelector />
      </Box>

      <KPIPanel currentPeriodKPIs={currentKPIs} previousPeriodKPIs={previousKPIs} />

      {/* Ingresos vs Gastos - full width */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>Ingresos vs Gastos</Typography>
        <ThermometerChart income={currentKPIs.totalIncome} expenses={currentKPIs.totalExpenses} />
      </Paper>

      {/* Pie chart + Account balances side by side */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>Gasto por Categoría</Typography>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="75%" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[theme.palette.mode][i % PIE_COLORS[theme.palette.mode].length]} />)}
                </Pie>
                <ReTooltip content={<PieTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          ) : <Typography color="text.secondary">Sin gastos en este período</Typography>}
        </Paper>

        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>Balance por Cuenta</Typography>
          <Box sx={{ flex: 1, minHeight: 0 }}>
            <AccountBalanceChart data={accountBalances} />
          </Box>
        </Paper>
      </Box>

      {dailyData.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>Flujo Diario</Typography>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={false} height={10} />
              <YAxis tickFormatter={(v) => { const n = Math.round(v / 100); const a = Math.abs(n); return (n < 0 ? '-' : '') + (a >= 1000 ? '$' + (a/1000).toFixed(0) + 'K' : '$' + a.toLocaleString('es-MX')); }} tick={{ fill: textColor }} width={70} />
              <ReTooltip content={<DailyFlowTooltip />} />
              <Bar dataKey="periodBalance" name="Balance" fill={theme.palette.secondary.main} radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="income" name="Ingresos" stroke={theme.palette.mode === 'dark' ? '#81c784' : '#2e7d32'} strokeWidth={2} dot={{ r: 4, fill: theme.palette.mode === 'dark' ? '#81c784' : '#2e7d32' }} />
              <Line type="monotone" dataKey="expense" name="Gastos" stroke={theme.palette.mode === 'dark' ? '#ef9a9a' : '#c62828'} strokeWidth={2} dot={{ r: 4, fill: theme.palette.mode === 'dark' ? '#ef9a9a' : '#c62828' }} />
              <Line type="monotone" dataKey="trend" name="Tendencia" stroke={theme.palette.mode === 'dark' ? '#ce93d8' : '#7b1fa2'} strokeWidth={2.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* Account transaction flow charts */}
      {accountHistories.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Flujo por Cuenta</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            {accountHistories.map(({ account, data }, idx) => {
              const color = PIE_COLORS[theme.palette.mode][idx % PIE_COLORS[theme.palette.mode].length];
              const amtColor = theme.palette.mode === 'dark' ? '#ffb74d' : '#e65100';
              return (
                <Paper key={account.id} sx={{ p: 2 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>{account.name}</Typography>
                  <ResponsiveContainer width="100%" height={220}>
                    <ComposedChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" tick={false} height={10} />
                      <YAxis tickFormatter={(v) => { const n = Math.round(v / 100); const a = Math.abs(n); return (n < 0 ? '-' : '') + (a >= 1000 ? '$' + (a/1000).toFixed(0) + 'K' : '$' + a.toLocaleString('es-MX')); }} tick={{ fill: textColor }} width={70} />
                      <ReTooltip content={<FlowTooltipContent />} />
                      <Bar dataKey="periodBalance" name="Balance período" fill={color} radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="amount" name="Transacción" stroke={amtColor} strokeWidth={2} dot={{ r: 4, fill: amtColor }} />
                      <Line type="monotone" dataKey="trend" name="Tendencia" stroke={theme.palette.mode === 'dark' ? '#ce93d8' : '#7b1fa2'} strokeWidth={2.5} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </Paper>
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
}
