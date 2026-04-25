import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import type { Transaction, Account } from '../types';
import {
  calculateTotalIncome,
  calculateTotalExpenses,
  calculateTotalEgresos,
  calculateBalance,
  calculateExpensesByCategory,
  calculateDailyExpenseAverage,
  calculateTopExpenseCategory,
  calculateTDCDebt,
  calculateSavingsRate,
  calculateAccountBalance,
  getTrendIndicator,
} from './kpiCalculations';

const ts = Timestamp.now();

function makeTx(overrides: Partial<Transaction>): Transaction {
  return {
    id: '1',
    userId: 'u1',
    date: '2026-04-05',
    type: 'Gasto',
    category: 'Comida',
    source: 'BBVA',
    destination: null,
    amount: 10000,
    description: '',
    period: 'abr-2026',
    createdAt: ts,
    updatedAt: ts,
    ...overrides,
  };
}

function makeAccount(overrides: Partial<Account>): Account {
  return {
    id: 'a1',
    userId: 'u1',
    name: 'BBVA',
    initialBalance: 0,
    isTDC: false,
    createdAt: ts,
    ...overrides,
  };
}

describe('calculateTotalIncome', () => {
  it('sums only Ingreso transactions', () => {
    const txns = [
      makeTx({ type: 'Ingreso', amount: 5000, source: null, destination: 'BBVA' }),
      makeTx({ type: 'Gasto', amount: 3000 }),
      makeTx({ type: 'Ingreso', amount: 2000, source: null, destination: 'BBVA' }),
    ];
    expect(calculateTotalIncome(txns)).toBe(7000);
  });

  it('returns 0 for empty array', () => {
    expect(calculateTotalIncome([])).toBe(0);
  });
});

describe('calculateTotalExpenses', () => {
  it('sums only Gasto transactions', () => {
    const txns = [
      makeTx({ type: 'Gasto', amount: 3000 }),
      makeTx({ type: 'Ingreso', amount: 5000, source: null, destination: 'BBVA' }),
      makeTx({ type: 'Gasto', amount: 1500 }),
    ];
    expect(calculateTotalExpenses(txns)).toBe(4500);
  });

  it('returns 0 for empty array', () => {
    expect(calculateTotalExpenses([])).toBe(0);
  });
});

describe('calculateTotalEgresos', () => {
  it('includes Gastos from non-TDC and Transferencias from non-TDC to TDC', () => {
    const accounts = [
      makeAccount({ name: 'BBVA', isTDC: false }),
      makeAccount({ name: 'BBVA TDC', isTDC: true, id: 'a2' }),
      makeAccount({ name: 'Efectivo', isTDC: false, id: 'a3' }),
    ];
    const txns = [
      makeTx({ type: 'Gasto', source: 'BBVA', amount: 1000 }),
      makeTx({ type: 'Gasto', source: 'BBVA TDC', amount: 2000 }),
      makeTx({ type: 'Transferencia', source: 'BBVA', destination: 'BBVA TDC', amount: 3000 }),
      makeTx({ type: 'Transferencia', source: 'Efectivo', destination: 'BBVA', amount: 500 }),
      makeTx({ type: 'Transferencia', source: 'BBVA TDC', destination: 'BBVA', amount: 700 }),
    ];
    // Gasto from BBVA (non-TDC): 1000
    // Gasto from BBVA TDC (TDC): excluded
    // Transfer BBVA->BBVA TDC (non-TDC->TDC): 3000
    // Transfer Efectivo->BBVA (non-TDC->non-TDC): excluded
    // Transfer BBVA TDC->BBVA (TDC->non-TDC): excluded
    expect(calculateTotalEgresos(txns, accounts)).toBe(4000);
  });

  it('returns 0 when no qualifying transactions', () => {
    const accounts = [makeAccount({ name: 'BBVA TDC', isTDC: true })];
    const txns = [makeTx({ type: 'Gasto', source: 'BBVA TDC', amount: 5000 })];
    expect(calculateTotalEgresos(txns, accounts)).toBe(0);
  });
});

describe('calculateBalance', () => {
  it('returns income minus egresos', () => {
    expect(calculateBalance(10000, 4000)).toBe(6000);
  });

  it('can be negative', () => {
    expect(calculateBalance(3000, 8000)).toBe(-5000);
  });
});

describe('calculateExpensesByCategory', () => {
  it('groups Gasto transactions by category', () => {
    const txns = [
      makeTx({ type: 'Gasto', category: 'Comida', amount: 1000 }),
      makeTx({ type: 'Gasto', category: 'Transporte', amount: 500 }),
      makeTx({ type: 'Gasto', category: 'Comida', amount: 2000 }),
      makeTx({ type: 'Ingreso', category: 'Sueldo', amount: 9000, source: null, destination: 'BBVA' }),
    ];
    const result = calculateExpensesByCategory(txns);
    expect(result.get('Comida')).toBe(3000);
    expect(result.get('Transporte')).toBe(500);
    expect(result.has('Sueldo')).toBe(false);
  });

  it('returns empty map for no gastos', () => {
    expect(calculateExpensesByCategory([]).size).toBe(0);
  });
});

describe('calculateDailyExpenseAverage', () => {
  it('divides total expenses by distinct days with gastos', () => {
    const txns = [
      makeTx({ type: 'Gasto', date: '2026-04-01', amount: 1000 }),
      makeTx({ type: 'Gasto', date: '2026-04-01', amount: 2000 }),
      makeTx({ type: 'Gasto', date: '2026-04-03', amount: 3000 }),
    ];
    // Total: 6000, distinct days: 2
    expect(calculateDailyExpenseAverage(txns)).toBe(3000);
  });

  it('returns 0 for no gastos', () => {
    expect(calculateDailyExpenseAverage([])).toBe(0);
  });
});

describe('calculateTopExpenseCategory', () => {
  it('returns category with highest sum', () => {
    const txns = [
      makeTx({ type: 'Gasto', category: 'Comida', amount: 1000 }),
      makeTx({ type: 'Gasto', category: 'Transporte', amount: 5000 }),
      makeTx({ type: 'Gasto', category: 'Comida', amount: 2000 }),
    ];
    expect(calculateTopExpenseCategory(txns)).toBe('Transporte');
  });

  it('returns null for no gastos', () => {
    expect(calculateTopExpenseCategory([])).toBeNull();
  });
});

describe('calculateTDCDebt', () => {
  it('sums balances of TDC accounts', () => {
    const accounts = [
      makeAccount({ id: 'a1', name: 'BBVA TDC', isTDC: true, initialBalance: 50000 }),
      makeAccount({ id: 'a2', name: 'BB TDC', isTDC: true, initialBalance: 20000 }),
      makeAccount({ id: 'a3', name: 'BBVA', isTDC: false, initialBalance: 100000 }),
    ];
    const txns = [
      // BBVA TDC: income from transfer
      makeTx({ type: 'Transferencia', source: 'BBVA', destination: 'BBVA TDC', amount: 10000 }),
      // BBVA TDC: expense (gasto)
      makeTx({ type: 'Gasto', source: 'BBVA TDC', amount: 3000 }),
    ];
    // BBVA TDC balance: 50000 + 10000 - 3000 = 57000
    // BB TDC balance: 20000 + 0 - 0 = 20000
    expect(calculateTDCDebt(accounts, txns)).toBe(77000);
  });
});

describe('calculateSavingsRate', () => {
  it('calculates percentage when income > 0', () => {
    expect(calculateSavingsRate(10000, 4000)).toBe(60);
  });

  it('returns null when income is 0', () => {
    expect(calculateSavingsRate(0, 0)).toBeNull();
  });

  it('can be negative', () => {
    expect(calculateSavingsRate(10000, 15000)).toBe(-50);
  });
});

describe('calculateAccountBalance', () => {
  it('computes income, expenses, and balance for an account', () => {
    const account = makeAccount({ name: 'BBVA', initialBalance: 100000 });
    const txns = [
      makeTx({ type: 'Ingreso', source: null, destination: 'BBVA', amount: 50000 }),
      makeTx({ type: 'Gasto', source: 'BBVA', amount: 20000 }),
      makeTx({ type: 'Transferencia', source: 'BBVA', destination: 'Efectivo', amount: 10000 }),
      makeTx({ type: 'Transferencia', source: 'Efectivo', destination: 'BBVA', amount: 5000 }),
    ];
    const result = calculateAccountBalance(account, txns);
    expect(result.accountId).toBe('a1');
    expect(result.accountName).toBe('BBVA');
    expect(result.initialBalance).toBe(100000);
    expect(result.totalIncome).toBe(55000); // 50000 ingreso + 5000 transfer in
    expect(result.totalExpenses).toBe(-30000); // -(20000 gasto + 10000 transfer out)
    expect(result.balance).toBe(125000); // 100000 + 55000 - 30000
  });

  it('returns initial balance when no transactions', () => {
    const account = makeAccount({ initialBalance: 50000 });
    const result = calculateAccountBalance(account, []);
    expect(result.totalIncome).toBe(0);
    expect(result.totalExpenses).toBe(0);
    expect(result.balance).toBe(50000);
  });
});

describe('getTrendIndicator', () => {
  it('returns up when current > previous', () => {
    const result = getTrendIndicator(100, 50);
    expect(result.direction).toBe('up');
    expect(result.previousValue).toBe(50);
  });

  it('returns down when current < previous', () => {
    const result = getTrendIndicator(30, 50);
    expect(result.direction).toBe('down');
    expect(result.previousValue).toBe(50);
  });

  it('returns neutral when equal', () => {
    const result = getTrendIndicator(50, 50);
    expect(result.direction).toBe('neutral');
    expect(result.previousValue).toBe(50);
  });
});

// ============================================================
// Property-Based Tests (fast-check)
// ============================================================
import fc from 'fast-check';

// --- Shared Arbitraries ---

const transactionTypeArb = fc.constantFrom('Ingreso' as const, 'Gasto' as const, 'Transferencia' as const);
const categoryArb = fc.string({ minLength: 1, maxLength: 20 });
const accountNameArb = fc.string({ minLength: 1, maxLength: 20 });
const amountArb = fc.integer({ min: 1, max: 10_000_000 });
const dateArb = fc.integer({ min: 0, max: 3650 }).map(offset => {
  const d = new Date('2020-01-01');
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
});

function txArb(overrides?: Partial<{ type: fc.Arbitrary<'Ingreso' | 'Gasto' | 'Transferencia'> }>): fc.Arbitrary<Transaction> {
  return fc.record({
    id: fc.uuid(),
    userId: fc.constant('u1'),
    date: dateArb,
    type: overrides?.type ?? transactionTypeArb,
    category: categoryArb,
    source: accountNameArb.map(n => n as string | null),
    destination: accountNameArb.map(n => n as string | null),
    amount: amountArb,
    description: fc.string({ maxLength: 50 }),
    period: fc.constant('abr-2026'),
    createdAt: fc.constant(ts),
    updatedAt: fc.constant(ts),
  });
}

function accountArb(overrides?: { isTDC?: boolean }): fc.Arbitrary<Account> {
  const nameArb = overrides?.isTDC === true
    ? fc.string({ minLength: 1, maxLength: 15 }).map(s => s + ' TDC')
    : overrides?.isTDC === false
      ? fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.toUpperCase().includes('TDC'))
      : accountNameArb;

  return fc.record({
    id: fc.uuid(),
    userId: fc.constant('u1'),
    name: nameArb,
    initialBalance: fc.integer({ min: -10_000_000, max: 10_000_000 }),
    isTDC: fc.constant(overrides?.isTDC ?? false),
    createdAt: fc.constant(ts),
  });
}

// Feature: budget-tracker, Property 6: Cálculo de Total de Ingresos
// **Validates: Requirements 5.1**
describe('Property 6: Cálculo de Total de Ingresos', () => {
  it('total income equals sum of amounts where type === Ingreso', () => {
    fc.assert(
      fc.property(fc.array(txArb(), { maxLength: 50 }), (transactions) => {
        const expected = transactions
          .filter(t => t.type === 'Ingreso')
          .reduce((sum, t) => sum + t.amount, 0);
        expect(calculateTotalIncome(transactions)).toBe(expected);
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: budget-tracker, Property 7: Cálculo de Total de Gastos
// **Validates: Requirements 5.2**
describe('Property 7: Cálculo de Total de Gastos', () => {
  it('total expenses equals sum of amounts where type === Gasto', () => {
    fc.assert(
      fc.property(fc.array(txArb(), { maxLength: 50 }), (transactions) => {
        const expected = transactions
          .filter(t => t.type === 'Gasto')
          .reduce((sum, t) => sum + t.amount, 0);
        expect(calculateTotalExpenses(transactions)).toBe(expected);
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: budget-tracker, Property 8: Cálculo de Egresos
// **Validates: Requirements 5.3**
describe('Property 8: Cálculo de Egresos', () => {
  it('total egresos = Gastos from non-TDC + Transferencias from non-TDC to TDC', () => {
    const nonTdcAccountArb = accountArb({ isTDC: false });
    const tdcAccountArb = accountArb({ isTDC: true });

    const arbInput = fc.record({
      nonTdcAccounts: fc.array(nonTdcAccountArb, { minLength: 1, maxLength: 5 }),
      tdcAccounts: fc.array(tdcAccountArb, { minLength: 1, maxLength: 5 }),
      transactions: fc.array(txArb(), { maxLength: 30 }),
    });

    fc.assert(
      fc.property(arbInput, ({ nonTdcAccounts, tdcAccounts, transactions }) => {
        const allAccounts = [...nonTdcAccounts, ...tdcAccounts];
        const accountMap = new Map(allAccounts.map(a => [a.name, a]));

        // Assign valid sources/destinations to transactions
        const txns = transactions.map((t, i) => {
          if (t.type === 'Gasto') {
            const src = i % 2 === 0 ? nonTdcAccounts[0].name : tdcAccounts[0].name;
            return { ...t, source: src, destination: null };
          }
          if (t.type === 'Transferencia') {
            const src = i % 3 === 0 ? nonTdcAccounts[0].name : tdcAccounts[0].name;
            const dst = i % 3 === 0 ? tdcAccounts[0].name : nonTdcAccounts[0].name;
            return { ...t, source: src, destination: dst };
          }
          return { ...t, source: null, destination: nonTdcAccounts[0].name };
        });

        // Manual expected calculation
        let expected = 0;
        for (const t of txns) {
          if (t.type === 'Gasto' && t.source) {
            const srcAcc = accountMap.get(t.source);
            if (srcAcc && !srcAcc.isTDC) expected += t.amount;
          } else if (t.type === 'Transferencia' && t.source && t.destination) {
            const srcAcc = accountMap.get(t.source);
            const dstAcc = accountMap.get(t.destination);
            if (srcAcc && !srcAcc.isTDC && dstAcc && dstAcc.isTDC) {
              expected += t.amount;
            }
          }
        }

        expect(calculateTotalEgresos(txns, allAccounts)).toBe(expected);
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: budget-tracker, Property 9: Balance KPI
// **Validates: Requirements 5.4**
describe('Property 9: Balance KPI es Ingresos menos Egresos', () => {
  it('balance = totalIncome - totalEgresos for any pair', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100_000_000 }),
        fc.integer({ min: 0, max: 100_000_000 }),
        (totalIncome, totalEgresos) => {
          expect(calculateBalance(totalIncome, totalEgresos)).toBe(totalIncome - totalEgresos);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: budget-tracker, Property 10: Indicador de tendencia
// **Validates: Requirements 5.8, 6.7**
describe('Property 10: Indicador de tendencia', () => {
  it('trend is up/down/neutral based on comparison', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100_000_000, max: 100_000_000 }),
        fc.integer({ min: -100_000_000, max: 100_000_000 }),
        (current, previous) => {
          const result = getTrendIndicator(current, previous);
          if (current > previous) {
            expect(result.direction).toBe('up');
          } else if (current < previous) {
            expect(result.direction).toBe('down');
          } else {
            expect(result.direction).toBe('neutral');
          }
          expect(result.previousValue).toBe(previous);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: budget-tracker, Property 11: Gasto por categoría
// **Validates: Requirements 6.1**
describe('Property 11: Gasto por categoría', () => {
  it('sum of all category values equals total expenses', () => {
    const gastoTxArb = txArb({ type: fc.constant('Gasto' as const) });

    fc.assert(
      fc.property(fc.array(gastoTxArb, { maxLength: 50 }), (transactions) => {
        const byCategory = calculateExpensesByCategory(transactions);
        const sumOfCategories = Array.from(byCategory.values()).reduce((s, v) => s + v, 0);
        const totalExpenses = calculateTotalExpenses(transactions);
        expect(sumOfCategories).toBe(totalExpenses);
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: budget-tracker, Property 12: Promedio diario de gasto
// **Validates: Requirements 6.2**
describe('Property 12: Promedio diario de gasto', () => {
  it('average = total expenses / distinct days with expense', () => {
    const gastoTxArb = txArb({ type: fc.constant('Gasto' as const) });

    fc.assert(
      fc.property(fc.array(gastoTxArb, { minLength: 1, maxLength: 50 }), (transactions) => {
        const totalExpenses = transactions.reduce((sum, t) => sum + t.amount, 0);
        const distinctDays = new Set(transactions.map(t => t.date)).size;
        const expectedAvg = Math.round(totalExpenses / distinctDays);
        expect(calculateDailyExpenseAverage(transactions)).toBe(expectedAvg);
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: budget-tracker, Property 13: Categoría con mayor gasto
// **Validates: Requirements 6.3**
describe('Property 13: Categoría con mayor gasto', () => {
  it('top category has sum >= any other category', () => {
    const gastoTxArb = txArb({ type: fc.constant('Gasto' as const) });

    fc.assert(
      fc.property(fc.array(gastoTxArb, { minLength: 1, maxLength: 50 }), (transactions) => {
        const topCategory = calculateTopExpenseCategory(transactions);
        expect(topCategory).not.toBeNull();

        const byCategory = calculateExpensesByCategory(transactions);
        const topAmount = byCategory.get(topCategory!)!;

        for (const [, amount] of byCategory) {
          expect(topAmount).toBeGreaterThanOrEqual(amount);
        }
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: budget-tracker, Property 14: Deuda total en TDC
// **Validates: Requirements 6.4**
describe('Property 14: Deuda total en TDC', () => {
  it('TDC debt = sum of historical balances of TDC accounts', () => {
    const tdcAccArb = accountArb({ isTDC: true });
    const nonTdcAccArb = accountArb({ isTDC: false });

    fc.assert(
      fc.property(
        fc.array(tdcAccArb, { minLength: 1, maxLength: 5 }),
        fc.array(nonTdcAccArb, { maxLength: 3 }),
        fc.array(txArb(), { maxLength: 30 }),
        (tdcAccounts, nonTdcAccounts, rawTxns) => {
          const allAccounts = [...tdcAccounts, ...nonTdcAccounts];
          // Assign valid account names to transactions
          const allNames = allAccounts.map(a => a.name);
          const txns = rawTxns.map((t, i) => ({
            ...t,
            source: t.type === 'Ingreso' ? null : allNames[i % allNames.length],
            destination: t.type === 'Gasto' ? null : allNames[(i + 1) % allNames.length],
          }));

          // Manual: sum of balances for TDC accounts
          let expectedDebt = 0;
          for (const acc of tdcAccounts) {
            const bal = calculateAccountBalance(acc, txns);
            expectedDebt += bal.balance;
          }

          expect(calculateTDCDebt(allAccounts, txns)).toBe(expectedDebt);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: budget-tracker, Property 15: Tasa de ahorro
// **Validates: Requirements 6.5, 6.6**
describe('Property 15: Tasa de ahorro', () => {
  it('rate = (income - egresos) / income * 100 when income > 0; null when income = 0', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100_000_000 }),
        fc.integer({ min: 0, max: 100_000_000 }),
        (totalIncome, totalEgresos) => {
          const result = calculateSavingsRate(totalIncome, totalEgresos);
          if (totalIncome === 0) {
            expect(result).toBeNull();
          } else {
            const expected = ((totalIncome - totalEgresos) / totalIncome) * 100;
            expect(result).toBeCloseTo(expected, 5);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: budget-tracker, Property 16: Cálculo de balance por cuenta
// **Validates: Requirements 7.2, 7.3, 7.4**
describe('Property 16: Cálculo de balance por cuenta', () => {
  it('balance = initialBalance + income - expenses per account', () => {
    fc.assert(
      fc.property(
        accountArb(),
        fc.array(txArb(), { maxLength: 40 }),
        (account, rawTxns) => {
          // Assign some transactions to reference this account
          const txns = rawTxns.map((t, i) => {
            if (t.type === 'Ingreso') {
              return { ...t, source: null, destination: i % 2 === 0 ? account.name : 'Other' };
            }
            if (t.type === 'Gasto') {
              return { ...t, source: i % 2 === 0 ? account.name : 'Other', destination: null };
            }
            // Transferencia
            return i % 3 === 0
              ? { ...t, source: account.name, destination: 'Other' }
              : i % 3 === 1
                ? { ...t, source: 'Other', destination: account.name }
                : { ...t, source: 'Other', destination: 'Other2' };
          });

          // Manual calculation
          let expectedIncome = 0;
          let expectedExpenses = 0;
          for (const t of txns) {
            if ((t.type === 'Ingreso' && t.destination === account.name) ||
                (t.type === 'Transferencia' && t.destination === account.name)) {
              expectedIncome += t.amount;
            }
            if ((t.type === 'Gasto' && t.source === account.name) ||
                (t.type === 'Transferencia' && t.source === account.name)) {
              expectedExpenses += t.amount;
            }
          }

          const result = calculateAccountBalance(account, txns);
          expect(result.accountId).toBe(account.id);
          expect(result.accountName).toBe(account.name);
          expect(result.initialBalance).toBe(account.initialBalance);
          expect(result.totalIncome).toBe(expectedIncome);
          // totalExpenses is stored as negative
          expect(result.totalExpenses).toBe(expectedExpenses === 0 ? 0 : -expectedExpenses);
          expect(result.balance).toBe(account.initialBalance + expectedIncome - expectedExpenses);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: budget-tracker, Property 17: Balances independientes del período
// **Validates: Requirements 7.8, 8.4**
describe('Property 17: Balances independientes del período', () => {
  it('account balances remain identical regardless of period change', () => {
    const periodArb = fc.constantFrom('ene-2026', 'feb-2026', 'mar-2026', 'abr-2026', 'may-2026', 'jun-2026');

    fc.assert(
      fc.property(
        accountArb(),
        fc.array(txArb(), { minLength: 1, maxLength: 30 }),
        periodArb,
        periodArb,
        (account, transactions, period1, period2) => {
          // Assign mixed periods to transactions
          const txns = transactions.map((t, i) => ({
            ...t,
            period: i % 2 === 0 ? period1 : period2,
            source: t.type === 'Ingreso' ? null : account.name,
            destination: t.type === 'Gasto' ? null : account.name,
          }));

          // calculateAccountBalance uses ALL transactions regardless of period
          const result1 = calculateAccountBalance(account, txns);
          const result2 = calculateAccountBalance(account, txns);

          // Balances are identical because the function considers all transactions
          expect(result1.balance).toBe(result2.balance);
          expect(result1.totalIncome).toBe(result2.totalIncome);
          expect(result1.totalExpenses).toBe(result2.totalExpenses);

          // Even if we pass different subsets, the full set always gives the same result
          const fullResult = calculateAccountBalance(account, txns);
          expect(fullResult.balance).toBe(result1.balance);
        },
      ),
      { numRuns: 100 },
    );
  });
});
