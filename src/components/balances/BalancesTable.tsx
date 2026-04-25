import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { AccountBalance } from '../../types/index';
import { formatMXN } from '../../utils/currency';

interface BalancesTableProps {
  balances: AccountBalance[];
}

export default function BalancesTable({ balances }: BalancesTableProps) {
  const theme = useTheme();
  const isCompactView = useMediaQuery(theme.breakpoints.down('md'));

  if (balances.length === 0) {
    return (
      <Typography variant="body1" sx={{ p: 2, textAlign: 'center' }}>
        No hay cuentas
      </Typography>
    );
  }

  if (isCompactView) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {balances.map((row) => (
          <Paper key={row.accountId} variant="outlined" sx={{ p: 1.5 }}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {row.accountName}
              </Typography>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(96px, auto) 1fr',
                  columnGap: 1,
                  rowGap: 0.75,
                  alignItems: 'start',
                }}
              >
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Saldo Inicial</Typography>
                <Typography variant="body2" sx={{ textAlign: 'right' }}>{formatMXN(row.initialBalance)}</Typography>

                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Ingresos</Typography>
                <Typography variant="body2" sx={{ textAlign: 'right' }}>{formatMXN(row.totalIncome)}</Typography>

                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Gastos</Typography>
                <Typography variant="body2" sx={{ textAlign: 'right' }}>{formatMXN(row.totalExpenses)}</Typography>

                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Balance</Typography>
                <Typography variant="body2" sx={{ textAlign: 'right', fontWeight: 700 }}>{formatMXN(row.balance)}</Typography>
              </Box>
            </Stack>
          </Paper>
        ))}
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Cuenta</TableCell>
            <TableCell align="right">Saldo Inicial</TableCell>
            <TableCell align="right">Ingresos</TableCell>
            <TableCell align="right">Gastos</TableCell>
            <TableCell align="right">Balance</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {balances.map((row) => (
            <TableRow key={row.accountId}>
              <TableCell>{row.accountName}</TableCell>
              <TableCell align="right">{formatMXN(row.initialBalance)}</TableCell>
              <TableCell align="right">{formatMXN(row.totalIncome)}</TableCell>
              <TableCell align="right">{formatMXN(row.totalExpenses)}</TableCell>
              <TableCell align="right">{formatMXN(row.balance)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
