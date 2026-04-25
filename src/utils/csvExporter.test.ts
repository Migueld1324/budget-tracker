import { describe, it, expect } from 'vitest';
import { exportTransactionsCSV, exportBalancesCSV } from './csvExporter';
import { parseTransactionsCSV } from './csvParser';
import { formatMXN } from './currency';
import type { Transaction, Account, AccountBalance } from '../types';
import { Timestamp } from 'firebase/firestore';

const ts = Timestamp.now();

const sampleAccounts: Account[] = [
  { id: 'a1', userId: 'u1', name: 'BBVA', initialBalance: 100000, isTDC: false, createdAt: ts },
  { id: 'a2', userId: 'u1', name: 'Efectivo', initialBalance: 50000, isTDC: false, createdAt: ts },
];

const sampleTransactions: Transaction[] = [
  {
    id: 't1', userId: 'u1', date: '2026-04-05', type: 'Ingreso', category: 'Sueldo',
    source: null, destination: 'BBVA', amount: 2500000, description: 'Pago quincenal',
    period: 'abr-2026', createdAt: ts, updatedAt: ts,
  },
  {
    id: 't2', userId: 'u1', date: '2026-04-10', type: 'Gasto', category: 'Comida',
    source: 'Efectivo', destination: null, amount: 35050, description: 'Restaurante',
    period: 'abr-2026', createdAt: ts, updatedAt: ts,
  },
  {
    id: 't3', userId: 'u1', date: '2026-04-12', type: 'Transferencia', category: 'Deuda',
    source: 'BBVA', destination: 'Efectivo', amount: 100000, description: 'Retiro ATM',
    period: 'abr-2026', createdAt: ts, updatedAt: ts,
  },
];

describe('exportTransactionsCSV', () => {
  it('should produce correct CSV headers', () => {
    const csv = exportTransactionsCSV([], sampleAccounts);
    expect(csv.trim()).toBe('Período,Fecha,Tipo,Categoría,Origen,Destino,Monto,Descripción');
  });

  it('should format transactions with correct columns', () => {
    const csv = exportTransactionsCSV(sampleTransactions, sampleAccounts);
    const lines = csv.split('\r\n');

    expect(lines[0]).toBe('Período,Fecha,Tipo,Categoría,Origen,Destino,Monto,Descripción');
    expect(lines[1]).toBe('abr-2026,2026-04-05,Ingreso,Sueldo,,BBVA,"$25.000,00",Pago quincenal');
    expect(lines[2]).toBe('abr-2026,2026-04-10,Gasto,Comida,Efectivo,,"$350,50",Restaurante');
    expect(lines[3]).toBe('abr-2026,2026-04-12,Transferencia,Deuda,BBVA,Efectivo,"$1.000,00",Retiro ATM');
  });

  it('should use empty string for null source/destination', () => {
    const csv = exportTransactionsCSV([sampleTransactions[0]], sampleAccounts);
    const lines = csv.split('\r\n');
    // Ingreso has null source → empty string
    expect(lines[1]).toContain('Ingreso,Sueldo,,BBVA');
  });

  it('should format amounts with formatMXN', () => {
    const csv = exportTransactionsCSV(sampleTransactions, sampleAccounts);
    expect(csv).toContain('$25.000,00');
    expect(csv).toContain('$350,50');
    expect(csv).toContain('$1.000,00');
  });

  it('should produce CSV that can be re-imported (round-trip)', () => {
    const csv = exportTransactionsCSV(sampleTransactions, sampleAccounts);
    const result = parseTransactionsCSV(csv);

    expect(result.errors).toHaveLength(0);
    expect(result.data).toHaveLength(3);

    expect(result.data[0].type).toBe('Ingreso');
    expect(result.data[0].amount).toBe(2500000);
    expect(result.data[0].source).toBeNull();
    expect(result.data[0].destination).toBe('BBVA');

    expect(result.data[1].type).toBe('Gasto');
    expect(result.data[1].amount).toBe(35050);
    expect(result.data[1].source).toBe('Efectivo');
    expect(result.data[1].destination).toBeNull();

    expect(result.data[2].type).toBe('Transferencia');
    expect(result.data[2].amount).toBe(100000);
    expect(result.data[2].source).toBe('BBVA');
    expect(result.data[2].destination).toBe('Efectivo');
  });
});

describe('exportBalancesCSV', () => {
  const sampleBalances: AccountBalance[] = [
    {
      accountId: 'a1', accountName: 'BBVA',
      initialBalance: 100000, totalIncome: 2500000, totalExpenses: -100000, balance: 2500000,
    },
    {
      accountId: 'a2', accountName: 'Efectivo',
      initialBalance: 50000, totalIncome: 100000, totalExpenses: -35050, balance: 114950,
    },
  ];

  it('should produce correct CSV headers', () => {
    const csv = exportBalancesCSV([]);
    expect(csv.trim()).toBe('Cuenta,Saldo Inicial,Ingresos,Gastos,Balance');
  });

  it('should format balances with correct columns', () => {
    const csv = exportBalancesCSV(sampleBalances);
    const lines = csv.split('\r\n');

    expect(lines[0]).toBe('Cuenta,Saldo Inicial,Ingresos,Gastos,Balance');
    expect(lines[1]).toBe('BBVA,"$1.000,00","$25.000,00","-$1.000,00","$25.000,00"');
    expect(lines[2]).toBe('Efectivo,"$500,00","$1.000,00","-$350,50","$1.149,50"');
  });

  it('should show expenses as negative values (already stored as negative)', () => {
    const csv = exportBalancesCSV(sampleBalances);
    expect(csv).toContain('-$1.000,00');
    expect(csv).toContain('-$350,50');
  });
});

// --- Property-Based Tests ---
import * as fc from 'fast-check';

/**
 * Feature: budget-tracker, Property 19: Round-trip de CSV de transacciones
 * **Validates: Requirements 11.1, 11.7, 12.1**
 *
 * For any valid set of transactions, export to CSV and import produces equivalent data.
 */

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** Generator for simple alphanumeric names (no commas, no quotes, no leading/trailing spaces) */
const safeNameArb = fc.stringMatching(/^[A-Za-z0-9]+( [A-Za-z0-9]+)*$/)
  .filter(s => s.length >= 1 && s.length <= 20);

/** Generator for a valid period like "abr-2026" */
const periodArb = fc.tuple(
  fc.constantFrom(...MONTHS),
  fc.integer({ min: 2020, max: 2030 }),
).map(([m, y]) => `${m}-${y}`);

/** Generator for a valid ISO date */
const isoDateArb = fc.tuple(
  fc.integer({ min: 2020, max: 2030 }),
  fc.integer({ min: 1, max: 12 }),
  fc.integer({ min: 1, max: 28 }),
).map(([y, m, d]) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);

/** Generator for a valid Ingreso transaction */
function ingresoArb(accounts: string[]) {
  return fc.record({
    date: isoDateArb,
    category: safeNameArb,
    destination: fc.constantFrom(...accounts),
    amount: fc.integer({ min: 1, max: 10_000_000 }),
    description: safeNameArb,
    period: periodArb,
  }).map(r => ({
    id: 'id',
    userId: 'u1',
    date: r.date,
    type: 'Ingreso' as const,
    category: r.category,
    source: null,
    destination: r.destination,
    amount: r.amount,
    description: r.description,
    period: r.period,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  }));
}

/** Generator for a valid Gasto transaction */
function gastoArb(accounts: string[]) {
  return fc.record({
    date: isoDateArb,
    category: safeNameArb,
    source: fc.constantFrom(...accounts),
    amount: fc.integer({ min: 1, max: 10_000_000 }),
    description: safeNameArb,
    period: periodArb,
  }).map(r => ({
    id: 'id',
    userId: 'u1',
    date: r.date,
    type: 'Gasto' as const,
    category: r.category,
    source: r.source,
    destination: null,
    amount: r.amount,
    description: r.description,
    period: r.period,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  }));
}

/** Generator for a valid Transferencia transaction (source ≠ destination) */
function transferenciaArb(accounts: string[]) {
  return fc.record({
    date: isoDateArb,
    category: safeNameArb,
    srcIdx: fc.integer({ min: 0, max: accounts.length - 1 }),
    amount: fc.integer({ min: 1, max: 10_000_000 }),
    description: safeNameArb,
    period: periodArb,
  }).filter(r => accounts.length >= 2)
    .chain(r => {
      const remaining = accounts.filter((_, i) => i !== r.srcIdx);
      return fc.constantFrom(...remaining).map(dest => ({
        ...r,
        source: accounts[r.srcIdx],
        destination: dest,
      }));
    })
    .map(r => ({
      id: 'id',
      userId: 'u1',
      date: r.date,
      type: 'Transferencia' as const,
      category: r.category,
      source: r.source,
      destination: r.destination,
      amount: r.amount,
      description: r.description,
      period: r.period,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }));
}

/** Generator for a list of unique account names (at least 2 for Transferencia) */
const accountNamesArb = fc.uniqueArray(safeNameArb, { minLength: 2, maxLength: 5, comparator: 'IsStrictlyEqual' });

/** Generator for a mixed list of valid transactions */
function transactionsArb(accounts: string[]): fc.Arbitrary<Transaction[]> {
  const txArb = fc.oneof(
    ingresoArb(accounts),
    gastoArb(accounts),
    transferenciaArb(accounts),
  );
  return fc.array(txArb, { minLength: 1, maxLength: 15 });
}

describe('Property 19: Round-trip CSV de transacciones', () => {
  it('export → import produces equivalent TransactionInput data', () => {
    fc.assert(
      fc.property(
        accountNamesArb.chain(names => {
          const accts: Account[] = names.map((n, i) => ({
            id: `a${i}`,
            userId: 'u1',
            name: n,
            initialBalance: 0,
            isTDC: n.toUpperCase().includes('TDC'),
            createdAt: Timestamp.now(),
          }));
          return transactionsArb(names).map(txs => ({ accounts: accts, transactions: txs }));
        }),
        ({ accounts, transactions }) => {
          // Export to CSV
          const csv = exportTransactionsCSV(transactions, accounts);

          // Import back
          const result = parseTransactionsCSV(csv);

          // No errors
          expect(result.errors).toHaveLength(0);

          // Same number of transactions
          expect(result.data).toHaveLength(transactions.length);

          // Compare TransactionInput fields
          for (let i = 0; i < transactions.length; i++) {
            const original = transactions[i];
            const imported = result.data[i];

            expect(imported.date).toBe(original.date);
            expect(imported.type).toBe(original.type);
            expect(imported.category).toBe(original.category);
            expect(imported.source).toBe(original.source);
            expect(imported.destination).toBe(original.destination);
            expect(imported.amount).toBe(original.amount);
            expect(imported.description).toBe(original.description);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * Feature: budget-tracker, Property 20: Validación de CSV reporta errores con número de fila
 * **Validates: Requirements 11.3, 11.4**
 *
 * For any CSV with invalid rows, the parser imports valid ones and reports errors with row numbers.
 */

const validHeader = 'Período,Fecha,Tipo,Categoría,Origen,Destino,Monto,Descripción';

/** Generator for a valid CSV data row */
const validRowArb = fc.record({
  period: periodArb,
  date: isoDateArb,
  category: safeNameArb,
  account: safeNameArb,
  amount: fc.integer({ min: 1, max: 10_000_000 }),
  description: safeNameArb,
}).map(r => {
  const formatted = formatMXN(r.amount);
  return `${r.period},${r.date},Gasto,${r.category},${r.account},,"${formatted}",${r.description}`;
});

/** Generators for different kinds of invalid rows */
const invalidDateRowArb = fc.record({
  period: periodArb,
  category: safeNameArb,
  account: safeNameArb,
  amount: fc.integer({ min: 1, max: 10_000_000 }),
}).map(r => ({
  row: `${r.period},not-a-date,Gasto,${r.category},${r.account},,"${formatMXN(r.amount)}",desc`,
  reason: 'invalid date',
}));

const invalidTypeRowArb = fc.record({
  period: periodArb,
  date: isoDateArb,
  category: safeNameArb,
  account: safeNameArb,
  amount: fc.integer({ min: 1, max: 10_000_000 }),
}).map(r => ({
  row: `${r.period},${r.date},Invalido,${r.category},${r.account},,"${formatMXN(r.amount)}",desc`,
  reason: 'invalid type',
}));

const missingAmountRowArb = fc.record({
  period: periodArb,
  date: isoDateArb,
  category: safeNameArb,
  account: safeNameArb,
}).map(r => ({
  row: `${r.period},${r.date},Gasto,${r.category},${r.account},,,desc`,
  reason: 'missing amount',
}));

const invalidAmountRowArb = fc.record({
  period: periodArb,
  date: isoDateArb,
  category: safeNameArb,
  account: safeNameArb,
}).map(r => ({
  row: `${r.period},${r.date},Gasto,${r.category},${r.account},,abc123,desc`,
  reason: 'invalid amount format',
}));

const invalidRowArb = fc.oneof(
  invalidDateRowArb,
  invalidTypeRowArb,
  invalidAmountRowArb,
  missingAmountRowArb,
);

describe('Property 20: Validación de CSV reporta errores con número de fila', () => {
  it('imports valid rows and reports errors with correct row numbers', () => {
    fc.assert(
      fc.property(
        fc.array(validRowArb, { minLength: 0, maxLength: 5 }),
        fc.array(invalidRowArb, { minLength: 1, maxLength: 5 }),
        fc.func(fc.boolean()),
        (validRows, invalidRows, interleaveDecider) => {
          // Interleave valid and invalid rows deterministically
          const rows: { csv: string; isValid: boolean }[] = [];
          let vi = 0;
          let ii = 0;

          while (vi < validRows.length || ii < invalidRows.length) {
            if (vi < validRows.length && (ii >= invalidRows.length || interleaveDecider(vi + ii))) {
              rows.push({ csv: validRows[vi], isValid: true });
              vi++;
            } else if (ii < invalidRows.length) {
              rows.push({ csv: invalidRows[ii].row, isValid: false });
              ii++;
            }
          }

          const csvContent = [validHeader, ...rows.map(r => r.csv)].join('\n');
          const result = parseTransactionsCSV(csvContent);

          // Valid rows should be imported
          expect(result.data).toHaveLength(validRows.length);

          // Invalid rows should produce errors
          expect(result.errors).toHaveLength(invalidRows.length);

          // Each error should have a row number >= 2 (row 1 is header)
          for (const error of result.errors) {
            expect(error.row).toBeGreaterThanOrEqual(2);
            expect(error.message).toBeTruthy();
          }

          // Error row numbers should correspond to the actual positions of invalid rows
          const expectedErrorRows = rows
            .map((r, idx) => ({ isValid: r.isValid, rowNum: idx + 2 })) // +2: 1-indexed + header
            .filter(r => !r.isValid)
            .map(r => r.rowNum);

          const actualErrorRows = result.errors.map(e => e.row);
          expect(actualErrorRows).toEqual(expectedErrorRows);
        },
      ),
      { numRuns: 100 },
    );
  });
});

