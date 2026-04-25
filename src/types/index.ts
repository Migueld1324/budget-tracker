import { Timestamp } from 'firebase/firestore';

// --- Transaction Types ---

export type TransactionType = 'Ingreso' | 'Gasto' | 'Transferencia';

export interface Transaction {
  id: string;
  userId: string;
  date: string;               // ISO 8601: "2026-04-05"
  type: TransactionType;
  category: string;
  source: string | null;      // cuenta origen (null para Ingreso)
  destination: string | null;  // cuenta destino (null para Gasto)
  amount: number;             // siempre positivo, en centavos
  description: string;
  period: string;             // "abr-2026" — campo derivado
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TransactionInput {
  date: string;
  type: TransactionType;
  category: string;
  source: string | null;
  destination: string | null;
  amount: number;
  description: string;
}

// --- Account Types ---

export interface Account {
  id: string;
  userId: string;
  name: string;
  initialBalance: number;  // en centavos
  isTDC: boolean;          // derivado: name.toUpperCase().includes('TDC')
  createdAt: Timestamp;
}

export interface AccountInput {
  name: string;
  initialBalance: number;
}

// --- Category Types ---

export interface CategoryLists {
  Ingreso: string[];
  Gasto: string[];
  Transferencia: string[];
}

// --- Balance Types ---

export interface AccountBalance {
  accountId: string;
  accountName: string;
  initialBalance: number;
  totalIncome: number;      // Ingresos + Transferencias entrantes
  totalExpenses: number;    // Gastos + Transferencias salientes (valor negativo)
  balance: number;          // initialBalance + totalIncome + totalExpenses
}

// --- KPI Types ---

export interface KPIValues {
  totalIncome: number;
  totalExpenses: number;
  totalEgresos: number;
  balance: number;
  expensesByCategory: Map<string, number>;
  dailyExpenseAverage: number;
  topExpenseCategory: string | null;
  tdcDebt: number;
  savingsRate: number | null;  // null cuando ingresos = 0
}

export interface TrendIndicator {
  direction: 'up' | 'down' | 'neutral';
  previousValue: number | null;
}

// --- CSV Types ---

export interface CSVParseResult<T> {
  data: T[];
  errors: CSVRowError[];
}

export interface CSVRowError {
  row: number;
  message: string;
}

// --- Async State ---

export interface AsyncState {
  loading: boolean;
  error: string | null;
}
