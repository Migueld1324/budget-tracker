/**
 * Utilidades para manejo de períodos (mes-año).
 *
 * Formato de período: "mmm-yyyy" donde mmm es el nombre abreviado
 * del mes en español (ene, feb, mar, abr, may, jun, jul, ago, sep, oct, nov, dic).
 *
 * Ejemplos: "abr-2026", "ene-2025", "dic-2024"
 */

import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Transaction } from '../types';

/**
 * Retorna el período actual basado en la fecha del sistema.
 * @returns Período en formato "mmm-yyyy" (ej. "abr-2026")
 */
export function getCurrentPeriod(): string {
  const now = new Date();
  return format(now, 'MMM-yyyy', { locale: es });
}

/**
 * Retorna el período inmediatamente anterior al período dado.
 * @param period - Período en formato "mmm-yyyy"
 * @returns Período anterior en formato "mmm-yyyy" (ej. "abr-2026" → "mar-2026")
 */
export function getPreviousPeriod(period: string): string {
  const { month, year } = parsePeriod(period);
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  return formatPeriod(prevMonth, prevYear);
}

/**
 * Parsea un período en formato "mmm-yyyy" a mes y año numéricos.
 * @param period - Período en formato "mmm-yyyy"
 * @returns Objeto con month (1-12) y year
 */
export function parsePeriod(period: string): { month: number; year: number } {
  const [monthStr, yearStr] = period.split('-');
  const date = parse(monthStr, 'MMM', new Date(), { locale: es });
  const month = date.getMonth() + 1; // getMonth() es 0-indexed
  const year = parseInt(yearStr, 10);
  return { month, year };
}

/**
 * Formatea un mes y año numéricos al formato de período "mmm-yyyy".
 * @param month - Mes (1-12)
 * @param year - Año
 * @returns Período en formato "mmm-yyyy"
 */
export function formatPeriod(month: number, year: number): string {
  const date = new Date(year, month - 1, 1);
  return format(date, 'MMM-yyyy', { locale: es });
}

/**
 * Verifica si una transacción pertenece a un período dado.
 * @param transaction - La transacción a verificar
 * @param period - Período en formato "mmm-yyyy"
 * @returns true si el campo period de la transacción coincide con el período dado
 */
export function isTransactionInPeriod(transaction: Transaction, period: string): boolean {
  return transaction.period === period;
}
