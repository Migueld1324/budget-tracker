import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import ReactECharts from 'echarts-for-react';
import { formatMXN } from '../../utils/currency';

interface BalanceItem { name: string; balance: number }

function fmtAxis(v: number) {
  const n = Math.round(v / 100);
  const a = Math.abs(n);
  return (n < 0 ? '-' : '') + (a >= 1000 ? '$' + (a / 1000).toFixed(0) + 'K' : '$' + a.toLocaleString('es-MX'));
}

export default function AccountBalanceChart({ data }: { data: BalanceItem[] }) {
  const theme = useTheme();
  const txtC = theme.palette.text.primary;

  if (data.length === 0) return <Typography color="text.secondary">Sin cuentas</Typography>;

  const opts = {
    animation: true,
    animationDuration: 300,
    backgroundColor: 'transparent',
    textStyle: { color: txtC },
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: theme.palette.background.paper,
      borderColor: theme.palette.divider,
      textStyle: { color: txtC },
      formatter: (p: any) => { const d = Array.isArray(p) ? p[0] : p; return `${d.name}: ${formatMXN(d.value)}`; },
    },
    xAxis: { type: 'value' as const, axisLabel: { formatter: fmtAxis, color: txtC, fontSize: 11 } },
    yAxis: { type: 'category' as const, data: data.map(a => a.name), axisLabel: { color: txtC, fontSize: 12 } },
    series: [{
      type: 'bar' as const,
      data: data.map(a => ({
        value: a.balance,
        itemStyle: {
          color: '#1976d2',
          borderRadius: a.balance >= 0 ? [0, 4, 4, 0] : [4, 0, 0, 4],
        },
      })),
    }],
    grid: { left: 80, right: 10, top: 5, bottom: 5 },
  };

  return <ReactECharts option={opts} style={{ height: Math.max(data.length * 40 + 20, 150) }} opts={{ renderer: 'canvas' }} />;
}
