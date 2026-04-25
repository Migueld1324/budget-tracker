import { useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import { useTheme } from '@mui/material/styles';
import ReactECharts from 'echarts-for-react';
import { useAuthStore } from '../store/authStore';
import { useTransactionStore } from '../store/transactionStore';
import { useAccountStore } from '../store/accountStore';
import { useUIStore } from '../store/uiStore';
import PeriodSelector from '../components/common/PeriodSelector';
import KPIPanel from '../components/kpis/KPIPanel';
import {
  calculateTotalIncome, calculateTotalExpenses, calculateTotalEgresos,
  calculateBalance, calculateExpensesByCategory, calculateDailyExpenseAverage,
  calculateTopExpenseCategory, calculateTDCDebt, calculateSavingsRate, calculateAccountBalance,
} from '../utils/kpiCalculations';
import { getPreviousPeriod, isTransactionInPeriod } from '../utils/periodUtils';
import { formatMXN } from '../utils/currency';
import type { KPIValues, Transaction, Account } from '../types';

const PIE_COLORS = {
  light: ['#001391', '#573b95', '#f72717', '#0c6dff', '#8b6fc0', '#3a7f5a', '#ec407a', '#9ccc65', '#7e57c2', '#ff7043'],
  dark:  ['#4d5fff', '#7b5fbf', '#f72717', '#4d9fff', '#b49bdf', '#5aaf82', '#ec407a', '#9ccc65', '#7e57c2', '#ff7043'],
};

function buildKPIs(txns: Transaction[], accounts: Account[], allTxns: Transaction[]): KPIValues {
  const totalIncome = calculateTotalIncome(txns);
  const totalExpenses = calculateTotalExpenses(txns);
  const totalEgresos = calculateTotalEgresos(txns, accounts);
  return {
    totalIncome, totalExpenses, totalEgresos,
    balance: calculateBalance(totalIncome, totalExpenses),
    expensesByCategory: calculateExpensesByCategory(txns),
    dailyExpenseAverage: calculateDailyExpenseAverage(txns),
    topExpenseCategory: calculateTopExpenseCategory(txns),
    tdcDebt: calculateTDCDebt(accounts, allTxns),
    savingsRate: calculateSavingsRate(totalIncome, totalEgresos),
  };
}

function buildDailyFlow(transactions: Transaction[]) {
  const incMap = new Map<string, number>();
  const expMap = new Map<string, number>();
  const dates = new Set<string>();
  for (const t of transactions) {
    if (t.type === 'Transferencia') continue;
    dates.add(t.date);
    if (t.type === 'Ingreso') incMap.set(t.date, (incMap.get(t.date) ?? 0) + t.amount);
    else expMap.set(t.date, (expMap.get(t.date) ?? 0) + t.amount);
  }
  const sorted = Array.from(dates).sort();
  let cum = 0;
  const raw = sorted.map(d => {
    const inc = incMap.get(d) ?? 0;
    const exp = expMap.get(d) ?? 0;
    cum += inc - exp;
    return { day: d.slice(5), income: inc, expense: -exp, balance: cum };
  });
  // Trend
  const n = raw.length;
  if (n === 0) return [];
  let sx = 0, sy = 0, sxy = 0, sx2 = 0;
  for (let i = 0; i < n; i++) { sx += i; sy += raw[i].balance; sxy += i * raw[i].balance; sx2 += i * i; }
  const d = n * sx2 - sx * sx;
  const slope = d ? (n * sxy - sx * sy) / d : 0;
  const intercept = (sy - slope * sx) / n;
  return raw.map((p, i) => ({ ...p, trend: Math.round(intercept + slope * i) }));
}

function buildAccountFlow(account: Account, txns: Transaction[]) {
  const acctTxs = txns
    .filter(t => (t.source != null && t.source === account.name) || (t.destination != null && t.destination === account.name))
    .sort((a, b) => a.date.localeCompare(b.date) || ((a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0)));
  if (acctTxs.length === 0) return [];
  let cum = 0;
  const raw = acctTxs.map((t, i) => {
    let amt = 0;
    if (t.destination === account.name) amt += t.amount;
    if (t.source === account.name) amt -= t.amount;
    cum += amt;
    return { day: `${t.date.slice(5)} #${i + 1}`, amount: amt, balance: cum };
  });
  const n = raw.length;
  let sx = 0, sy = 0, sxy = 0, sx2 = 0;
  for (let i = 0; i < n; i++) { sx += i; sy += raw[i].balance; sxy += i * raw[i].balance; sx2 += i * i; }
  const d = n * sx2 - sx * sx;
  const slope = d ? (n * sxy - sx * sy) / d : 0;
  const intercept = (sy - slope * sx) / n;
  return raw.map((p, i) => ({ ...p, trend: Math.round(intercept + slope * i) }));
}

function fmtAxis(v: number) {
  const n = Math.round(v / 100);
  const a = Math.abs(n);
  return (n < 0 ? '-' : '') + (a >= 1000 ? '$' + (a / 1000).toFixed(0) + 'K' : '$' + a.toLocaleString('es-MX'));
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
  const accLoading = useAccountStore((s) => s.loading);
  const theme = useTheme();
  const mode = theme.palette.mode;
  const userId = user?.uid ?? '';
  const colors = PIE_COLORS[mode];
  const greenC = '#66bb6a';
  const greenLineC = mode === 'dark' ? '#66bb6a' : '#388e3c';
  const redC = '#ef5350';
  const redLineC = mode === 'dark' ? '#ef5350' : '#d32f2f';
  const trendC = mode === 'dark' ? '#ff9800' : '#e65100';

  // Pick a trend color that contrasts with the bar color
  function getTrendColor(barColor: string): string {
    // Same logic for both modes
    // Map bar colors to contrasting trend colors
    // blue/green bars → red trend, red bars → blue trend, purple bars → orange trend
    const r = parseInt(barColor.slice(1, 3), 16);
    const g = parseInt(barColor.slice(3, 5), 16);
    const b = parseInt(barColor.slice(5, 7), 16);
    // Determine dominant hue
    if (r > 200 && g < 100) return '#1565c0'; // red → blue
    if (b > 150 && r < 100) return '#d32f2f'; // blue → red
    if (g > 100 && r < 100 && b < 100) return '#d32f2f'; // green → red
    if (r > 50 && b > 100 && r < 150) return '#e65100'; // purple → orange
    return '#d32f2f'; // default red
  }
  const txtC = theme.palette.text.primary;
  const bgC = theme.palette.background.paper;

  useEffect(() => { if (userId) fetchByPeriod(userId, selectedPeriod); }, [userId, selectedPeriod, fetchByPeriod]);
  useEffect(() => { if (userId) { fetchAll(userId); fetchAccounts(userId); } }, [userId, fetchAll, fetchAccounts]);

  const cur = useMemo(() => buildKPIs(transactions, accounts, allTransactions), [transactions, accounts, allTransactions]);
  const prev = useMemo(() => {
    const p = allTransactions.filter(t => isTransactionInPeriod(t, getPreviousPeriod(selectedPeriod)));
    return p.length === 0 ? null : buildKPIs(p, accounts, allTransactions);
  }, [selectedPeriod, allTransactions, accounts]);

  const pieData = useMemo(() => Array.from(cur.expensesByCategory.entries()).map(([n, v]) => ({ name: n, value: v })).sort((a, b) => b.value - a.value), [cur.expensesByCategory]);
  const dailyData = useMemo(() => buildDailyFlow(transactions), [transactions]);
  const accountBalances = useMemo(() => accounts.filter(a => allTransactions.filter(t => t.source === a.name || t.destination === a.name).length >= 2).map(a => ({ name: a.name, balance: calculateAccountBalance(a, allTransactions).balance })).sort((a, b) => b.balance - a.balance), [accounts, allTransactions]);
  const accountHistories = useMemo(() => accounts.filter(a => transactions.some(t => t.source === a.name || t.destination === a.name)).map(a => ({ account: a, data: buildAccountFlow(a, transactions) })).filter(h => h.data.length > 1), [accounts, transactions]);

  const isInitialLoad = (txLoading || accLoading) && (transactions.length === 0 || accounts.length === 0 || allTransactions.length === 0);
  if (isInitialLoad) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  // Common ECharts options
  const baseOpts = { animation: true, animationDuration: 300, backgroundColor: 'transparent', textStyle: { color: txtC } };
  const gridOpts = { left: 70, right: 10, top: 10, bottom: 10, containLabel: false };
  const tooltipOpts = { trigger: 'axis' as const, backgroundColor: bgC, borderColor: theme.palette.divider, textStyle: { color: txtC }, formatter: (params: any) => { const items = Array.isArray(params) ? params : [params]; return items.map((p: any) => `<span style="color:${p.color}">\u25CF</span> ${p.seriesName}: ${formatMXN(p.value)}`).join('<br/>'); } };

  // Thermometer
  const base = cur.totalIncome > 0 ? cur.totalIncome : 1;
  const expPct = Math.min((cur.totalExpenses / base) * 100, 100);
  const remPct = 100 - expPct;
  const thermOpts = { ...baseOpts, tooltip: { ...tooltipOpts, trigger: 'item' as const, formatter: (p: any) => `${p.seriesName}: ${formatMXN(p.data.amt)}` }, xAxis: { type: 'value' as const, max: 100, show: false }, yAxis: { type: 'category' as const, data: [''], show: false }, series: [{ name: 'Gastos', type: 'bar' as const, stack: 'total', data: [{ value: expPct, amt: cur.totalExpenses }], itemStyle: { color: redC, borderRadius: [4, 0, 0, 4] } }, { name: 'Disponible', type: 'bar' as const, stack: 'total', data: [{ value: remPct, amt: cur.totalIncome - cur.totalExpenses }], itemStyle: { color: greenC, borderRadius: [0, 4, 4, 0] } }], grid: { left: 0, right: 0, top: 0, bottom: 0 } };

  // Pie
  const pieOpts = { ...baseOpts, tooltip: { ...tooltipOpts, trigger: 'item' as const, formatter: (p: any) => `${p.name}: ${formatMXN(p.value)} (${p.percent}%)` }, series: [{ type: 'pie' as const, radius: '75%', data: pieData.map((d, i) => ({ ...d, itemStyle: { color: colors[i % colors.length] } })), label: { color: txtC, fontSize: 11 } }] };

  // Balance bar
  const balOpts = { ...baseOpts, tooltip: { ...tooltipOpts, trigger: 'axis' as const, formatter: (p: any) => { const d = Array.isArray(p) ? p[0] : p; return `${d.name}: ${formatMXN(d.value)}`; } }, xAxis: { type: 'value' as const, axisLabel: { formatter: fmtAxis, color: txtC, fontSize: 11 } }, yAxis: { type: 'category' as const, data: accountBalances.map(a => a.name), axisLabel: { color: txtC, fontSize: 12 } }, series: [{ type: 'bar' as const, data: accountBalances.map(a => ({ value: a.balance, itemStyle: { color: mode === 'dark' ? '#42a5f5' : '#1976d2', borderRadius: a.balance >= 0 ? [0, 4, 4, 0] : [4, 0, 0, 4] } })) }], grid: { left: 80, right: 10, top: 5, bottom: 5 } };

  // Daily flow
  const dailyOpts = dailyData.length > 0 ? { ...baseOpts, tooltip: tooltipOpts, xAxis: { type: 'category' as const, data: dailyData.map(d => d.day), show: false }, yAxis: { type: 'value' as const, axisLabel: { formatter: fmtAxis, color: txtC }, splitLine: { lineStyle: { color: theme.palette.divider } } }, series: [
    { name: 'Balance', type: 'bar' as const, data: dailyData.map(d => d.balance), itemStyle: { color: mode === 'dark' ? '#90caf9' : '#90caf9', borderRadius: [4, 4, 0, 0] } },
    { name: 'Ingresos', type: 'line' as const, data: dailyData.map(d => d.income), lineStyle: { color: greenLineC, width: 2 }, itemStyle: { color: greenLineC }, symbol: 'circle', symbolSize: 6, areaStyle: { color: greenLineC, opacity: 0.15 } },
    { name: 'Gastos', type: 'line' as const, data: dailyData.map(d => d.expense), lineStyle: { color: redLineC, width: 2 }, itemStyle: { color: redLineC }, symbol: 'circle', symbolSize: 6, areaStyle: { color: redLineC, opacity: 0.15 } },
    { name: 'Tendencia', type: 'line' as const, data: dailyData.map(d => d.trend), lineStyle: { color: trendC, width: 2.5 }, itemStyle: { color: trendC }, symbol: 'none' },
  ], grid: gridOpts } : null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, animation: 'fadeIn 0.3s ease', '@keyframes fadeIn': { from: { opacity: 0 }, to: { opacity: 1 } } }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', pl: { xs: 6, md: 0 } }}>
        <PeriodSelector />
      </Box>

      <KPIPanel currentPeriodKPIs={cur} previousPeriodKPIs={prev} />

      <Paper sx={{ p: 2, minWidth: 0, overflow: 'hidden' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>Ingresos vs Gastos</Typography>
        <ReactECharts option={thermOpts} style={{ height: 40 }} opts={{ renderer: 'canvas' }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: redC }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Gastos: {expPct.toFixed(2)}%</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: greenC }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Disponible: {remPct.toFixed(2)}%</Typography>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <Paper sx={{ p: 2, minWidth: 0, overflow: 'hidden' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>Gasto por Categoría</Typography>
          {pieData.length > 0 ? <ReactECharts option={pieOpts} style={{ height: 350 }} opts={{ renderer: 'canvas' }} /> : <Typography color="text.secondary">Sin gastos</Typography>}
        </Paper>
        <Paper sx={{ p: 2, minWidth: 0, overflow: 'hidden' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>Balance por Cuenta</Typography>
          {accountBalances.length > 0 ? <ReactECharts option={balOpts} style={{ height: 350 }} opts={{ renderer: 'canvas' }} /> : <Typography color="text.secondary">Sin cuentas</Typography>}
        </Paper>
      </Box>

      {dailyOpts && (
        <Paper sx={{ p: 2, minWidth: 0, overflow: 'hidden' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>Flujo Diario</Typography>
          <ReactECharts option={dailyOpts} style={{ height: 250 }} opts={{ renderer: 'canvas' }} />
        </Paper>
      )}

      {accountHistories.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Flujo por Cuenta</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            {accountHistories.map(({ account, data }, idx) => {
              const color = colors[idx % colors.length];
              const opts = { ...baseOpts, tooltip: tooltipOpts, xAxis: { type: 'category' as const, data: data.map(d => d.day), show: false }, yAxis: { type: 'value' as const, axisLabel: { formatter: fmtAxis, color: txtC }, splitLine: { lineStyle: { color: theme.palette.divider } } }, series: [
                { name: 'Balance', type: 'bar' as const, data: data.map(d => d.balance), itemStyle: { color, borderRadius: [4, 4, 0, 0] } },
                { name: 'Transacción', type: 'line' as const, data: data.map(d => d.amount), lineStyle: { color: '#c6b353', width: 2 }, itemStyle: { color: '#c6b353' }, symbol: 'circle', symbolSize: 6, areaStyle: { color: '#c6b353', opacity: 0.3 } },
                { name: 'Tendencia', type: 'line' as const, data: data.map(d => d.trend), lineStyle: { color: getTrendColor(color), width: 2.5 }, itemStyle: { color: getTrendColor(color) }, symbol: 'none' },
              ], grid: gridOpts };
              return (
                <Paper key={account.id} sx={{ p: 2, minWidth: 0, overflow: 'hidden' }}>
                  <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>{account.name}</Typography>
                  <ReactECharts option={opts} style={{ height: 220 }} opts={{ renderer: 'canvas' }} />
                </Paper>
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
}
