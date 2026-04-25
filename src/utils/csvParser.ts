/**
 * CSV parsing utilities for importing transactions and accounts.
 *
 * Supports the user's spreadsheet export format:
 * - Transactions: rows with extra header rows, dates as DD/MM/YYYY, "Transacción" as type
 * - Accounts (Balance General): rows with extra header rows, leading empty column
 *
 * Also supports the app's own export format (clean headers, ISO dates).
 *
 * Amounts are expected in Mexican format: "$X.XXX,XX"
 */

import Papa from 'papaparse';
import { parseMXN } from './currency';
import type {
  TransactionInput,
  TransactionType,
  AccountInput,
  CSVParseResult,
  CSVRowError,
} from '../types';

const VALID_TRANSACTION_TYPES: TransactionType[] = ['Ingreso', 'Gasto', 'Transferencia'];

/**
 * Validates that a string looks like a Mexican-format amount.
 */
function isValidMXNFormat(value: string): boolean {
  return /^-?\$\d{1,3}(\.\d{3})*,\d{2}$/.test(value);
}

function tryParseMXN(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!isValidMXNFormat(trimmed)) return null;
  try {
    const result = parseMXN(trimmed);
    if (isNaN(result)) return null;
    return result;
  } catch {
    return null;
  }
}

/**
 * Converts DD/MM/YYYY to YYYY-MM-DD. Also accepts YYYY-MM-DD as-is.
 */
function normalizeDate(dateStr: string): string | null {
  // Already ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return isValidISODate(dateStr) ? dateStr : null;
  }
  // DD/MM/YYYY format
  const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const iso = `${yyyy}-${mm}-${dd}`;
  return isValidISODate(iso) ? iso : null;
}

function isValidISODate(dateStr: string): boolean {
  const date = new Date(dateStr + 'T00:00:00');
  if (isNaN(date.getTime())) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  return date.getFullYear() === y && date.getMonth() + 1 === m && date.getDate() === d;
}

/**
 * Maps "Transacción" to "Transferencia" for compatibility with the user's spreadsheet.
 */
function normalizeType(tipo: string): string {
  if (tipo === 'Transacción') return 'Transferencia';
  return tipo;
}

/**
 * Finds the header row index by looking for a row that contains "FECHA" and "TIPO".
 * Returns -1 if not found.
 */
function findTransactionHeaderRow(rows: string[][]): number {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const cleaned = rows[i].map(c => c.trim().toUpperCase());
    if (cleaned.includes('FECHA') && cleaned.includes('TIPO')) {
      return i;
    }
  }
  return -1;
}

/**
 * Finds the column offset — some spreadsheets have an empty first column or a period column.
 * Returns the index of the FECHA column within the header row.
 */
function findColumnOffset(headerRow: string[]): number {
  for (let i = 0; i < headerRow.length; i++) {
    if (headerRow[i].trim().toUpperCase() === 'FECHA') return i;
  }
  return 0;
}

/**
 * Finds the header row for accounts/balances CSV by looking for "CUENTA".
 */
function findAccountHeaderRow(rows: string[][]): number {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const cleaned = rows[i].map(c => c.trim().toUpperCase());
    if (cleaned.includes('CUENTA') && cleaned.some(c => c.includes('SALDO') || c.includes('INICIAL'))) {
      return i;
    }
  }
  return -1;
}

export function parseTransactionsCSV(content: string): CSVParseResult<TransactionInput> {
  const data: TransactionInput[] = [];
  const errors: CSVRowError[] = [];

  const parsed = Papa.parse<string[]>(content, {
    header: false,
    skipEmptyLines: true,
  });

  if (parsed.data.length === 0) {
    errors.push({ row: 1, message: 'El archivo está vacío' });
    return { data, errors };
  }

  // Find the header row dynamically
  const headerIdx = findTransactionHeaderRow(parsed.data);
  if (headerIdx === -1) {
    errors.push({ row: 1, message: 'No se encontraron las columnas FECHA y TIPO en el archivo' });
    return { data, errors };
  }

  const headerRow = parsed.data[headerIdx];
  const colOffset = findColumnOffset(headerRow);

  // Map column names to indices relative to colOffset
  const headers = headerRow.slice(colOffset).map(c => c.trim().toUpperCase());
  const fechaIdx = colOffset + headers.indexOf('FECHA');
  const tipoIdx = colOffset + headers.indexOf('TIPO');
  const catIdx = colOffset + headers.indexOf('CATEGORÍA');
  const origenIdx = colOffset + headers.indexOf('ORIGEN');
  const destinoIdx = colOffset + headers.indexOf('DESTINO');
  const montoIdx = colOffset + headers.indexOf('MONTO');
  const descIdx = colOffset + headers.indexOf('DESCRIPCIÓN');

  // Process data rows after header
  for (let i = headerIdx + 1; i < parsed.data.length; i++) {
    const row = parsed.data[i];
    const rowNumber = i + 1;
    const rowErrors: string[] = [];

    // Skip rows that are mostly empty
    const nonEmpty = row.filter(c => c.trim()).length;
    if (nonEmpty < 3) continue;

    const fecha = (row[fechaIdx] || '').trim();
    const tipoRaw = (row[tipoIdx] || '').trim();
    const tipo = normalizeType(tipoRaw);
    const categoria = (row[catIdx] || '').trim();
    const origen = (row[origenIdx] || '').trim();
    const destino = (row[destinoIdx] || '').trim();
    const monto = (row[montoIdx] || '').trim();
    const descripcion = (row[descIdx] || '').trim();

    // Validate Fecha
    const normalizedDate = normalizeDate(fecha);
    if (!fecha) {
      rowErrors.push('Fecha es obligatoria');
    } else if (!normalizedDate) {
      rowErrors.push(`Fecha no es válida: "${fecha}"`);
    }

    // Validate Tipo
    if (!tipo) {
      rowErrors.push('Tipo es obligatorio');
    } else if (!VALID_TRANSACTION_TYPES.includes(tipo as TransactionType)) {
      rowErrors.push(`Tipo inválido: "${tipoRaw}". Debe ser Ingreso, Gasto, Transferencia o Transacción`);
    }

    // Validate Categoría
    if (!categoria) {
      rowErrors.push('Categoría es obligatoria');
    }

    // Validate Origen/Destino based on type (relaxed: Transferencia can have only destino)
    const validType = VALID_TRANSACTION_TYPES.includes(tipo as TransactionType);
    if (validType) {
      if (tipo === 'Gasto' && !origen) {
        rowErrors.push('Origen es obligatorio para Gasto');
      }
      if (tipo === 'Ingreso' && !destino) {
        rowErrors.push('Destino es obligatorio para Ingreso');
      }
      if (tipo === 'Transferencia' && !origen && !destino) {
        rowErrors.push('Origen o Destino es obligatorio para Transferencia');
      }
    }

    // Validate Monto
    if (!monto) {
      rowErrors.push('Monto es obligatorio');
    } else {
      const parsedAmount = tryParseMXN(monto);
      if (parsedAmount === null) {
        rowErrors.push(`Monto no tiene formato válido: "${monto}"`);
      } else if (parsedAmount <= 0) {
        rowErrors.push('Monto debe ser mayor a cero');
      }
    }

    if (rowErrors.length > 0) {
      errors.push({ row: rowNumber, message: rowErrors.join('; ') });
      continue;
    }

    const parsedAmount = tryParseMXN(monto)!;
    const txType = tipo as TransactionType;

    data.push({
      date: normalizedDate!,
      type: txType,
      category: categoria,
      source: txType === 'Ingreso' ? null : origen || null,
      destination: txType === 'Gasto' ? null : destino || null,
      amount: parsedAmount,
      description: descripcion || '',
    });
  }

  return { data, errors };
}

export function parseAccountsCSV(content: string): CSVParseResult<AccountInput> {
  const data: AccountInput[] = [];
  const errors: CSVRowError[] = [];

  const parsed = Papa.parse<string[]>(content, {
    header: false,
    skipEmptyLines: true,
  });

  if (parsed.data.length === 0) {
    errors.push({ row: 1, message: 'El archivo está vacío' });
    return { data, errors };
  }

  // Find the header row dynamically
  const headerIdx = findAccountHeaderRow(parsed.data);
  if (headerIdx === -1) {
    errors.push({ row: 1, message: 'No se encontraron las columnas CUENTA y SALDO INICIAL en el archivo' });
    return { data, errors };
  }

  const headerRow = parsed.data[headerIdx];
  // Find CUENTA column
  let cuentaIdx = -1;
  let saldoIdx = -1;
  for (let i = 0; i < headerRow.length; i++) {
    const col = headerRow[i].trim().toUpperCase();
    if (col === 'CUENTA') cuentaIdx = i;
    if (col.includes('SALDO') && col.includes('INICIAL')) saldoIdx = i;
  }

  if (cuentaIdx === -1 || saldoIdx === -1) {
    errors.push({ row: headerIdx + 1, message: 'No se encontraron las columnas CUENTA y SALDO INICIAL' });
    return { data, errors };
  }

  for (let i = headerIdx + 1; i < parsed.data.length; i++) {
    const row = parsed.data[i];
    const rowNumber = i + 1;
    const rowErrors: string[] = [];

    const cuenta = (row[cuentaIdx] || '').trim();
    const saldoInicial = (row[saldoIdx] || '').trim();

    // Skip mostly empty rows
    if (!cuenta && !saldoInicial) continue;

    if (!cuenta) {
      rowErrors.push('Cuenta es obligatoria');
    }

    if (!saldoInicial) {
      rowErrors.push('Saldo Inicial es obligatorio');
    } else {
      const parsedBalance = tryParseMXN(saldoInicial);
      if (parsedBalance === null) {
        rowErrors.push(`Saldo Inicial no tiene formato válido: "${saldoInicial}"`);
      }
    }

    if (rowErrors.length > 0) {
      errors.push({ row: rowNumber, message: rowErrors.join('; ') });
      continue;
    }

    data.push({
      name: cuenta,
      initialBalance: tryParseMXN(saldoInicial)!,
    });
  }

  return { data, errors };
}
