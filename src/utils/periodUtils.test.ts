import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  getCurrentPeriod,
  getPreviousPeriod,
  parsePeriod,
  formatPeriod,
  isTransactionInPeriod,
} from './periodUtils';
import type { Transaction } from '../types';
import { Timestamp } from 'firebase/firestore';

const makeTransaction = (period: string): Transaction => ({
  id: '1',
  userId: 'u1',
  date: '2026-04-05',
  type: 'Gasto',
  category: 'Comida',
  source: 'BBVA',
  destination: null,
  amount: 10000,
  description: 'Test',
  period,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
});

describe('periodUtils', () => {
  describe('getCurrentPeriod', () => {
    it('returns a string in mmm-yyyy format', () => {
      const period = getCurrentPeriod();
      expect(period).toMatch(/^[a-z]{3}-\d{4}$/);
    });
  });

  describe('parsePeriod', () => {
    it('parses "abr-2026" to month 4, year 2026', () => {
      expect(parsePeriod('abr-2026')).toEqual({ month: 4, year: 2026 });
    });

    it('parses "ene-2025" to month 1, year 2025', () => {
      expect(parsePeriod('ene-2025')).toEqual({ month: 1, year: 2025 });
    });

    it('parses "dic-2024" to month 12, year 2024', () => {
      expect(parsePeriod('dic-2024')).toEqual({ month: 12, year: 2024 });
    });
  });

  describe('formatPeriod', () => {
    it('formats month 4, year 2026 to "abr-2026"', () => {
      expect(formatPeriod(4, 2026)).toBe('abr-2026');
    });

    it('formats month 1, year 2025 to "ene-2025"', () => {
      expect(formatPeriod(1, 2025)).toBe('ene-2025');
    });

    it('formats month 12, year 2024 to "dic-2024"', () => {
      expect(formatPeriod(12, 2024)).toBe('dic-2024');
    });

    it('formats all 12 months correctly', () => {
      const expected = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      for (let m = 1; m <= 12; m++) {
        expect(formatPeriod(m, 2026)).toBe(`${expected[m - 1]}-2026`);
      }
    });
  });

  describe('getPreviousPeriod', () => {
    it('returns the previous month in the same year', () => {
      expect(getPreviousPeriod('abr-2026')).toBe('mar-2026');
    });

    it('wraps from January to December of previous year', () => {
      expect(getPreviousPeriod('ene-2026')).toBe('dic-2025');
    });

    it('handles mid-year correctly', () => {
      expect(getPreviousPeriod('jul-2026')).toBe('jun-2026');
    });
  });

  describe('isTransactionInPeriod', () => {
    it('returns true when transaction period matches', () => {
      const txn = makeTransaction('abr-2026');
      expect(isTransactionInPeriod(txn, 'abr-2026')).toBe(true);
    });

    it('returns false when transaction period does not match', () => {
      const txn = makeTransaction('abr-2026');
      expect(isTransactionInPeriod(txn, 'mar-2026')).toBe(false);
    });
  });

  describe('parsePeriod + formatPeriod round-trip', () => {
    it('round-trips correctly for all months', () => {
      const periods = [
        'ene-2025', 'feb-2025', 'mar-2025', 'abr-2025', 'may-2025', 'jun-2025',
        'jul-2025', 'ago-2025', 'sep-2025', 'oct-2025', 'nov-2025', 'dic-2025',
      ];
      for (const period of periods) {
        const { month, year } = parsePeriod(period);
        expect(formatPeriod(month, year)).toBe(period);
      }
    });
  });
});


// Feature: budget-tracker, Property 18: Filtrado de transacciones por período
// **Validates: Requirements 8.2**
describe('Property 18: Filtrado de transacciones por período', () => {
  const spanishMonths = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  const periodArb = fc.tuple(
    fc.integer({ min: 0, max: 11 }),
    fc.integer({ min: 2020, max: 2030 })
  ).map(([monthIdx, year]) => `${spanishMonths[monthIdx]}-${year}`);

  it('filtering returns exactly the transactions whose period matches the selected period', () => {
    fc.assert(
      fc.property(
        periodArb,
        periodArb,
        fc.integer({ min: 0, max: 10 }),
        fc.integer({ min: 0, max: 10 }),
        (targetPeriod, otherPeriod, matchCount, nonMatchCount) => {
          // Ensure otherPeriod differs from targetPeriod for non-matching txns
          const effectiveOtherPeriod = otherPeriod === targetPeriod
            ? `${spanishMonths[(spanishMonths.indexOf(otherPeriod.split('-')[0]) + 1) % 12]}-${otherPeriod.split('-')[1]}`
            : otherPeriod;

          const matchingTxns: Transaction[] = Array.from({ length: matchCount }, (_, i) => ({
            id: `match-${i}`,
            userId: 'user1',
            date: '2026-04-05',
            type: 'Gasto' as const,
            category: 'Comida',
            source: 'BBVA',
            destination: null,
            amount: 10000,
            description: 'matching',
            period: targetPeriod,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          }));

          const nonMatchingTxns: Transaction[] = Array.from({ length: nonMatchCount }, (_, i) => ({
            id: `nomatch-${i}`,
            userId: 'user1',
            date: '2026-04-05',
            type: 'Ingreso' as const,
            category: 'Sueldo',
            source: null,
            destination: 'BBVA',
            amount: 50000,
            description: 'non-matching',
            period: effectiveOtherPeriod,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          }));

          const allTransactions = [...matchingTxns, ...nonMatchingTxns];
          const filtered = allTransactions.filter(txn => isTransactionInPeriod(txn, targetPeriod));

          // Filtered count must equal the number of matching transactions
          expect(filtered.length).toBe(matchCount);

          // Every filtered transaction must have the target period
          for (const txn of filtered) {
            expect(txn.period).toBe(targetPeriod);
          }

          // Every transaction NOT in filtered must NOT have the target period
          const excluded = allTransactions.filter(txn => !isTransactionInPeriod(txn, targetPeriod));
          for (const txn of excluded) {
            expect(txn.period).not.toBe(targetPeriod);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('filtering with randomly assigned periods returns correct partitions', () => {
    fc.assert(
      fc.property(
        periodArb,
        fc.array(periodArb, { minLength: 0, maxLength: 20 }),
        (targetPeriod, txnPeriods) => {
          const transactions: Transaction[] = txnPeriods.map((period, i) => ({
            id: `txn-${i}`,
            userId: 'user1',
            date: '2026-04-05',
            type: 'Gasto' as const,
            category: 'Comida',
            source: 'BBVA',
            destination: null,
            amount: 10000,
            description: `txn ${i}`,
            period,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          }));

          const filtered = transactions.filter(txn => isTransactionInPeriod(txn, targetPeriod));
          const expectedCount = txnPeriods.filter(p => p === targetPeriod).length;

          // Count must match
          expect(filtered.length).toBe(expectedCount);

          // All filtered must have matching period
          for (const txn of filtered) {
            expect(txn.period).toBe(targetPeriod);
          }

          // Filtered + excluded = all transactions
          const excluded = transactions.filter(txn => !isTransactionInPeriod(txn, targetPeriod));
          expect(filtered.length + excluded.length).toBe(transactions.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});


// Feature: budget-tracker, Property 26: Agrupación de transacciones por período
// **Validates: Requirements 3.12**
describe('Property 26: Agrupación de transacciones por período', () => {
  const spanishMonths = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  const periodArb = fc.tuple(
    fc.integer({ min: 0, max: 11 }),
    fc.integer({ min: 2020, max: 2030 })
  ).map(([monthIdx, year]) => `${spanishMonths[monthIdx]}-${year}`);

  const makeTransactionWithPeriod = (period: string, index: number): Transaction => ({
    id: `txn-${index}`,
    userId: 'user1',
    date: '2026-04-05',
    type: 'Gasto',
    category: 'Comida',
    source: 'BBVA',
    destination: null,
    amount: 10000,
    description: `txn ${index}`,
    period,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  function groupByPeriod(transactions: Transaction[]): Map<string, Transaction[]> {
    return transactions.reduce((groups, txn) => {
      const existing = groups.get(txn.period) || [];
      existing.push(txn);
      groups.set(txn.period, existing);
      return groups;
    }, new Map<string, Transaction[]>());
  }

  it('each group only contains transactions whose period matches the group key, and the union of all groups contains all original transactions', () => {
    fc.assert(
      fc.property(
        fc.array(periodArb, { minLength: 0, maxLength: 30 }),
        (periods) => {
          const transactions: Transaction[] = periods.map((period, i) =>
            makeTransactionWithPeriod(period, i)
          );

          const groups = groupByPeriod(transactions);

          // Property 1: Each group only contains transactions whose period matches the group key
          for (const [groupKey, groupTxns] of groups) {
            for (const txn of groupTxns) {
              expect(txn.period).toBe(groupKey);
            }
          }

          // Property 2: The union of all groups contains all original transactions (no lost)
          const totalInGroups = Array.from(groups.values()).reduce(
            (sum, groupTxns) => sum + groupTxns.length,
            0
          );
          expect(totalInGroups).toBe(transactions.length);

          // Property 3: Every original transaction appears in exactly one group
          const allGroupedIds = new Set<string>();
          for (const groupTxns of groups.values()) {
            for (const txn of groupTxns) {
              expect(allGroupedIds.has(txn.id)).toBe(false); // no duplicates
              allGroupedIds.add(txn.id);
            }
          }
          expect(allGroupedIds.size).toBe(transactions.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
