import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import type { AccountBalance } from '../../types/index';
import { formatMXN } from '../../utils/currency';

interface BalancesTableProps {
  balances: AccountBalance[];
}

export default function BalancesTable({ balances }: BalancesTableProps) {
  if (balances.length === 0) {
    return (
      <Typography variant="body1" sx={{ p: 2, textAlign: 'center' }}>
        No hay cuentas
      </Typography>
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
