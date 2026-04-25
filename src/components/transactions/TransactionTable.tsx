import { useState, useMemo } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Collapse from '@mui/material/Collapse';
import Button from '@mui/material/Button';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import { darken } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import { formatMXN } from '../../utils/currency';
import type { Transaction, CategoryLists, TransactionInput } from '../../types';

export interface TransactionTableProps {
  transactions: Transaction[];
  categories: CategoryLists;
  onEdit: (id: string, data: Partial<TransactionInput>) => void;
  onDelete: (id: string) => void;
  filtersOpen: boolean;
  onFiltersOpenChange: (open: boolean) => void;
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** Convert ISO (YYYY-MM-DD) to DD/MM/YYYY for filter display */
function formatDateFilter(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** Convert DD/MM/YYYY to ISO (YYYY-MM-DD) for filter storage */
function parseDateFilter(display: string): string {
  if (!display) return '';
  const clean = display.replace(/[^\d/]/g, '');
  const parts = clean.split('/');
  if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return '';
}

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  Ingreso: { bg: '#e8f5e9', text: '#2e7d32' },
  Gasto: { bg: '#ffebee', text: '#c62828' },
  Transferencia: { bg: '#e3f2fd', text: '#1565c0' },
};

const ACCOUNT_COLORS: Record<string, string> = {
  // Configure account-specific colors here.
  // Key must match the account name used in transactions.
  'BBVA TDC': '#3c78d8',
  'BB TDC': '#8d6fc3',
  BBVA: '#a4c2f4',
  BanBajio: '#c0ade3',
  Efectivo: '#63d297',
  Vales: '#ea9999',
  Ahorro: '#3949ab',
  BONDDIA: '#cfe2f3',
  CETES: '#cfe2f3',
  FIBRAS: '#f1c232',
  BONOS: '#cfe2f3',
  ETFs: '#ff6d01',
};

const DEFAULT_ACCOUNT_COLOR = '#455a64';
const LIGHT_MODE_DARKEN_AMOUNT = 0.35;

function getAccountColor(accountName: string, isLightMode: boolean): string {
  const baseColor = ACCOUNT_COLORS[accountName] ?? DEFAULT_ACCOUNT_COLOR;
  return isLightMode ? darken(baseColor, LIGHT_MODE_DARKEN_AMOUNT) : baseColor;
}

interface Filters {
  dateFrom: string;
  dateTo: string;
  type: string;
  category: string;
  source: string;
  destination: string;
}

const emptyFilters: Filters = { dateFrom: '', dateTo: '', type: '', category: '', source: '', destination: '' };

export default function TransactionTable({ transactions, onEdit, onDelete, filtersOpen, onFiltersOpenChange }: TransactionTableProps) {
  const theme = useTheme();
  const isLightMode = theme.palette.mode === 'light';
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const rowsPerPage = 15;

  // Get unique values for filter dropdowns
  const allCategories = useMemo(() => [...new Set(transactions.map(t => t.category))].sort(), [transactions]);
  const allSources = useMemo(() => [...new Set(transactions.map(t => t.source).filter(Boolean) as string[])].sort(), [transactions]);
  const allDests = useMemo(() => [...new Set(transactions.map(t => t.destination).filter(Boolean) as string[])].sort(), [transactions]);
  // Apply filters
  const filtered = useMemo(() => {
    let result = [...transactions];
    if (filters.dateFrom) result = result.filter(t => t.date >= filters.dateFrom);
    if (filters.dateTo) result = result.filter(t => t.date <= filters.dateTo);
    if (filters.type) result = result.filter(t => t.type === filters.type);
    if (filters.category) result = result.filter(t => t.category === filters.category);
    if (filters.source) result = result.filter(t => t.source === filters.source);
    if (filters.destination) result = result.filter(t => t.destination === filters.destination);
    // Sort by date desc, then createdAt desc
    result.sort((a, b) => {
      const d = b.date.localeCompare(a.date);
      if (d !== 0) return d;
      return (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0);
    });
    return result;
  }, [transactions, filters]);

  const paged = filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  const updateFilter = (key: keyof Filters, value: string) => { setFilters(f => ({ ...f, [key]: value })); setPage(0); };

  return (
    <Box>

      {/* Filters */}
      <Collapse in={filtersOpen}>
        <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'flex-end' }}>
            <TextField label="Desde" size="small" placeholder="DD/MM/AAAA" value={filters.dateFrom ? formatDateFilter(filters.dateFrom) : ''} onChange={e => updateFilter('dateFrom', parseDateFilter(e.target.value))} slotProps={{ inputLabel: { shrink: !!filters.dateFrom || undefined } }} sx={{ flex: '1 1 150px', minWidth: 150 }} />
            <TextField label="Hasta" size="small" placeholder="DD/MM/AAAA" value={filters.dateTo ? formatDateFilter(filters.dateTo) : ''} onChange={e => updateFilter('dateTo', parseDateFilter(e.target.value))} slotProps={{ inputLabel: { shrink: !!filters.dateTo || undefined } }} sx={{ flex: '1 1 150px', minWidth: 150 }} />
            <FormControl size="small" sx={{ flex: '1 1 150px', minWidth: 150 }}>
              <InputLabel>Tipo</InputLabel>
              <Select value={filters.type} label="Tipo" onChange={e => updateFilter('type', e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="Ingreso">Ingreso</MenuItem>
                <MenuItem value="Gasto">Gasto</MenuItem>
                <MenuItem value="Transferencia">Transferencia</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ flex: '1 1 150px', minWidth: 150 }}>
              <InputLabel>Categoría</InputLabel>
              <Select value={filters.category} label="Categoría" onChange={e => updateFilter('category', e.target.value)}>
                <MenuItem value="">Todas</MenuItem>
                {allCategories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ flex: '1 1 150px', minWidth: 150 }}>
              <InputLabel>Origen</InputLabel>
              <Select value={filters.source} label="Origen" onChange={e => updateFilter('source', e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                {allSources.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ flex: '1 1 150px', minWidth: 150 }}>
              <InputLabel>Destino</InputLabel>
              <Select value={filters.destination} label="Destino" onChange={e => updateFilter('destination', e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                {allDests.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </Select>
            </FormControl>
            <Button size="small" variant="outlined" sx={{}} onClick={() => { setFilters(emptyFilters); setPage(0); }}>Limpiar</Button>
            <Button size="small" variant="contained" sx={{}} onClick={() => onFiltersOpenChange(false)}>Aplicar</Button>
          </Box>
        </Paper>
      </Collapse>

      {/* Table */}
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
            {paged.length === 0 ? (
              <TableRow><TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>No hay transacciones</TableCell></TableRow>
            ) : paged.map(txn => {
              const tc = TYPE_COLORS[txn.type] || { bg: '#f5f5f5', text: '#333' };
              return (
                <TableRow key={txn.id} hover>
                  <TableCell>{formatDate(txn.date)}</TableCell>
                  <TableCell><Typography variant="body2" sx={{ color: tc.text, fontWeight: 600, fontSize: 13 }}>{txn.type}</Typography></TableCell>
                  <TableCell>{txn.category}</TableCell>
                  <TableCell>{txn.source ? <Typography variant="body2" sx={{ color: getAccountColor(txn.source, isLightMode), fontWeight: 500 }}>{txn.source}</Typography> : '—'}</TableCell>
                  <TableCell>{txn.destination ? <Typography variant="body2" sx={{ color: getAccountColor(txn.destination, isLightMode), fontWeight: 500 }}>{txn.destination}</Typography> : '—'}</TableCell>
                  <TableCell align="right">{formatMXN(txn.amount)}</TableCell>
                  <TableCell>{txn.description}</TableCell>
                  <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                    <IconButton size="small" aria-label="editar" onClick={() => onEdit(txn.id, { date: txn.date, type: txn.type, category: txn.category, source: txn.source, destination: txn.destination, amount: txn.amount, description: txn.description })}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" aria-label="eliminar" onClick={() => onDelete(txn.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={filtered.length}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[15]}
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
      />
    </Box>
  );
}
