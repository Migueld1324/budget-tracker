/**
 * CSV export utilities for transactions and account balances.
 *
 * Transaction CSV format: Período,Fecha,Tipo,Categoría,Origen,Destino,Monto,Descripción
 * Balances CSV format: Cuenta,Saldo Inicial,Ingresos,Gastos,Balance
 *
 * Amounts are formatted in Mexican format using formatMXN.
 * Output is UTF-8 encoded.
 */

import Papa from 'papaparse';
import { formatMXN } from './currency';
import type { Transaction, Account, AccountBalance } from '../types';

/**
 * Exports transactions to a CSV string.
 *
 * @param transactions - Array of transactions to export
 * @param accounts - Array of accounts (unused in current format, reserved for future use)
 * @returns CSV string with UTF-8 encoding
 */
export function exportTransactionsCSV(transactions: Transaction[], _accounts: Account[]): string {
  const rows = transactions.map(tx => [
    tx.period,
    tx.date,
    tx.type,
    tx.category,
    tx.source ?? '',
    tx.destination ?? '',
    formatMXN(tx.amount),
    tx.description,
  ]);

  return Papa.unparse({
    fields: ['Período', 'Fecha', 'Tipo', 'Categoría', 'Origen', 'Destino', 'Monto', 'Descripción'],
    data: rows,
  });
}

/**
 * Exports account balances to a CSV string.
 *
 * @param balances - Array of account balances to export
 * @returns CSV string with UTF-8 encoding
 */
export function exportBalancesCSV(balances: AccountBalance[]): string {
  const rows = balances.map(b => [
    b.accountName,
    formatMXN(b.initialBalance),
    formatMXN(b.totalIncome),
    formatMXN(b.totalExpenses),
    formatMXN(b.balance),
  ]);

  return Papa.unparse({
    fields: ['Cuenta', 'Saldo Inicial', 'Ingresos', 'Gastos', 'Balance'],
    data: rows,
  });
}
