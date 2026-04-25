import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import { formatMXN } from '../../utils/currency';
import type { Transaction, Account, CategoryLists, TransactionInput } from '../../types';

export interface TransactionTableProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: CategoryLists;
  onEdit: (id: string, data: Partial<TransactionInput>) => void;
  onDelete: (id: string) => void;
}

/**
 * Groups transactions by their `period` field, preserving insertion order.
 */
function groupByPeriod(transactions: Transaction[]): Map<string, Transaction[]> {
  const groups = new Map<string, Transaction[]>();
  for (const txn of transactions) {
    const group = groups.get(txn.period);
    if (group) {
      group.push(txn);
    } else {
      groups.set(txn.period, [txn]);
    }
  }
  return groups;
}

const COLUMN_COUNT = 8;

export default function TransactionTable({
  transactions,
  onEdit,
  onDelete,
}: TransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
        No hay transacciones
      </Typography>
    );
  }

  const grouped = groupByPeriod(transactions);

  return (
    <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Fecha</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell>Categoría</TableCell>
            <TableCell>Origen</TableCell>
            <TableCell>Destino</TableCell>
            <TableCell align="right">Monto</TableCell>
            <TableCell>Descripción</TableCell>
            <TableCell align="center">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from(grouped.entries()).map(([period, txns]) => (
            <TransactionGroup
              key={period}
              period={period}
              transactions={txns}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

interface TransactionGroupProps {
  period: string;
  transactions: Transaction[];
  onEdit: (id: string, data: Partial<TransactionInput>) => void;
  onDelete: (id: string) => void;
}

function TransactionGroup({ period, transactions, onEdit, onDelete }: TransactionGroupProps) {
  return (
    <>
      <TableRow>
        <TableCell
          colSpan={COLUMN_COUNT}
          sx={{ bgcolor: 'action.hover', fontWeight: 'bold' }}
        >
          {period}
        </TableCell>
      </TableRow>
      {transactions.map((txn) => (
        <TableRow key={txn.id} hover>
          <TableCell>{txn.date}</TableCell>
          <TableCell>{txn.type}</TableCell>
          <TableCell>{txn.category}</TableCell>
          <TableCell>{txn.source ?? '—'}</TableCell>
          <TableCell>{txn.destination ?? '—'}</TableCell>
          <TableCell align="right">{formatMXN(txn.amount)}</TableCell>
          <TableCell>{txn.description}</TableCell>
          <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
            <IconButton
              size="small"
              aria-label="editar"
              onClick={() =>
                onEdit(txn.id, {
                  date: txn.date,
                  type: txn.type,
                  category: txn.category,
                  source: txn.source,
                  destination: txn.destination,
                  amount: txn.amount,
                  description: txn.description,
                })
              }
            >
              <Edit fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              aria-label="eliminar"
              onClick={() => onDelete(txn.id)}
            >
              <Delete fontSize="small" />
            </IconButton>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
