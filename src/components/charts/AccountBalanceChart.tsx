import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { formatMXN } from '../../utils/currency';

interface BalanceItem { name: string; balance: number }

function BalanceTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <Paper sx={{ p: 1 }}>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>{payload[0].payload.name}</Typography>
      <Typography variant="body2" color="primary">{formatMXN(payload[0].value)}</Typography>
    </Paper>
  );
}

export default function AccountBalanceChart({ data }: { data: BalanceItem[] }) {
  const theme = useTheme();
  const textColor = theme.palette.text.primary;

  if (data.length === 0) return <Typography color="text.secondary">Sin cuentas</Typography>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(v) => {
            const n = Math.round(v / 100);
            const a = Math.abs(n);
            return (n < 0 ? '-' : '') + (a >= 1000 ? '$' + (a / 1000).toFixed(0) + 'K' : '$' + a.toLocaleString('es-MX'));
          }}
          tick={{ fill: textColor, fontSize: 11 }}
        />
        <YAxis type="category" dataKey="name" tick={{ fill: textColor, fontSize: 12 }} width={80} />
        <Tooltip content={<BalanceTooltip />} cursor={{ fill: 'transparent' }} />
        <ReferenceLine x={0} stroke={theme.palette.divider} strokeWidth={2} />
        <Bar dataKey="balance" fill={theme.palette.primary.main} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
