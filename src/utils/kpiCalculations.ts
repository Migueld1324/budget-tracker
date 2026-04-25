import type { Transaction, Account, AccountBalance, TrendIndicator } from '../types';
import { isTDC } from './validators';

/**
 * Calculates total income: sum of amounts where type === 'Ingreso'.
 * Validates: Requirements 5.1
 */
export function calculateTotalIncome(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === 'Ingreso')
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Calculates total expenses: sum of amounts where type === 'Gasto'.
 * Validates: Requirements 5.2
 */
export function calculateTotalExpenses(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === 'Gasto')
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Calculates total egresos (real money outflow):
 * - Gastos from non-TDC accounts
 * - Transferencias from non-TDC to TDC accounts
 * Validates: Requirements 5.3
 */
export function calculateTotalEgresos(
  transactions: Transaction[],
  accounts: Account[],
): number {
  const accountMap = new Map(accounts.map((a) => [a.name, a]));

  let total = 0;

  for (const t of transactions) {
    if (t.type === 'Gasto' && t.source) {
      const sourceAccount = accountMap.get(t.source);
      // Only count as egreso if source is a known non-TDC account
      if (sourceAccount && !sourceAccount.isTDC) {
        total += t.amount;
      }
    } else if (t.type === 'Transferencia' && t.source && t.destination) {
      const sourceAccount = accountMap.get(t.source);
      const destAccount = accountMap.get(t.destination);
      // Transfer from known non-TDC to known TDC
      if (sourceAccount && !sourceAccount.isTDC && destAccount && destAccount.isTDC) {
        total += t.amount;
      }
    }
  }

  return total;
}

/**
 * Calculates balance: totalIncome - totalEgresos.
 * Validates: Requirements 5.4
 */
export function calculateBalance(totalIncome: number, totalEgresos: number): number {
  return totalIncome - totalEgresos;
}

/**
 * Groups Gasto transactions by category and sums their amounts.
 * Validates: Requirements 6.1
 */
export function calculateExpensesByCategory(
  transactions: Transaction[],
): Map<string, number> {
  const map = new Map<string, number>();

  for (const t of transactions) {
    if (t.type === 'Gasto') {
      map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
    }
  }

  return map;
}

/**
 * Calculates daily expense average: Total Expenses / number of distinct days with at least one Gasto.
 * Returns 0 if there are no Gasto transactions.
 * Validates: Requirements 6.2
 */
export function calculateDailyExpenseAverage(transactions: Transaction[]): number {
  const gastos = transactions.filter((t) => t.type === 'Gasto');

  if (gastos.length === 0) return 0;

  const distinctDays = new Set(gastos.map((t) => t.date));
  const totalExpenses = gastos.reduce((sum, t) => sum + t.amount, 0);

  return Math.round(totalExpenses / distinctDays.size);
}

/**
 * Returns the category with the highest total expense amount, or null if no Gasto transactions.
 * Validates: Requirements 6.3
 */
export function calculateTopExpenseCategory(transactions: Transaction[]): string | null {
  const byCategory = calculateExpensesByCategory(transactions);

  if (byCategory.size === 0) return null;

  let topCategory: string | null = null;
  let topAmount = -1;

  for (const [category, amount] of byCategory) {
    if (amount > topAmount) {
      topAmount = amount;
      topCategory = category;
    }
  }

  return topCategory;
}

/**
 * Calculates total TDC debt: sum of balances for all TDC accounts.
 * Balance per TDC account = initialBalance + income - expenses (using all transactions).
 * Validates: Requirements 6.4
 */
export function calculateTDCDebt(
  accounts: Account[],
  allTransactions: Transaction[],
): number {
  const tdcAccounts = accounts.filter((a) => a.isTDC);

  let totalDebt = 0;

  for (const account of tdcAccounts) {
    const bal = calculateAccountBalance(account, allTransactions);
    totalDebt += bal.balance;
  }

  return totalDebt;
}

/**
 * Calculates savings rate: (totalIncome - totalEgresos) / totalIncome * 100.
 * Returns null if totalIncome === 0.
 * Validates: Requirements 6.5, 6.6
 */
export function calculateSavingsRate(
  totalIncome: number,
  totalEgresos: number,
): number | null {
  if (totalIncome === 0) return null;
  return ((totalIncome - totalEgresos) / totalIncome) * 100;
}

/**
 * Computes the AccountBalance for a single account given all transactions.
 * Income = Ingresos where destination=account + Transferencias where destination=account
 * Expenses = Gastos where source=account + Transferencias where source=account
 * Balance = initialBalance + income - expenses
 * Validates: Requirements 7.2, 7.3, 7.4
 */
export function calculateAccountBalance(
  account: Account,
  allTransactions: Transaction[],
): AccountBalance {
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const t of allTransactions) {
    // Income: Ingresos where destination matches + Transferencias where destination matches
    if (
      (t.type === 'Ingreso' && t.destination === account.name) ||
      (t.type === 'Transferencia' && t.destination === account.name)
    ) {
      totalIncome += t.amount;
    }

    // Expenses: Gastos where source matches + Transferencias where source matches
    if (
      (t.type === 'Gasto' && t.source === account.name) ||
      (t.type === 'Transferencia' && t.source === account.name)
    ) {
      totalExpenses += t.amount;
    }
  }

  return {
    accountId: account.id,
    accountName: account.name,
    initialBalance: account.initialBalance,
    totalIncome,
    totalExpenses: totalExpenses === 0 ? 0 : -totalExpenses, // Stored as negative per AccountBalance type
    balance: account.initialBalance + totalIncome - totalExpenses,
  };
}

/**
 * Returns a trend indicator comparing current vs previous values.
 * Validates: Requirements 5.8, 6.7
 */
export function getTrendIndicator(current: number, previous: number): TrendIndicator {
  let direction: 'up' | 'down' | 'neutral';

  if (current > previous) {
    direction = 'up';
  } else if (current < previous) {
    direction = 'down';
  } else {
    direction = 'neutral';
  }

  return {
    direction,
    previousValue: previous,
  };
}
