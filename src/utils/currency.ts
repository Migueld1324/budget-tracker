/**
 * Utilidades de formato y parseo de moneda en pesos mexicanos.
 *
 * Formato mexicano: "$X.XXX,XX"
 *   - "$" prefijo
 *   - "." separador de miles
 *   - "," separador decimal
 *   - Siempre 2 decimales
 *
 * Los montos se almacenan internamente en centavos (enteros).
 *   formatMXN(123456) → "$1.234,56"
 *   parseMXN("$1.234,56") → 123456
 */

/**
 * Convierte un monto en centavos a formato de pesos mexicanos.
 * @param centavos - Monto en centavos (entero). Puede ser negativo.
 * @returns String en formato "$X.XXX,XX" (o "-$X.XXX,XX" para negativos)
 */
export function formatMXN(centavos: number): string {
  const isNegative = centavos < 0;
  const absCentavos = Math.abs(centavos);

  const pesos = Math.floor(absCentavos / 100);
  const cents = absCentavos % 100;

  // Formatear parte entera con separador de miles (punto)
  const pesosStr = pesos.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  // Formatear centavos con padding a 2 dígitos
  const centsStr = cents.toString().padStart(2, '0');

  const prefix = isNegative ? '-$' : '$';
  return `${prefix}${pesosStr},${centsStr}`;
}

/**
 * Convierte un string en formato de pesos mexicanos a centavos.
 * @param formatted - String en formato "$X.XXX,XX" o "-$X.XXX,XX"
 * @returns Monto en centavos (entero)
 */
export function parseMXN(formatted: string): number {
  // Detectar signo negativo
  const isNegative = formatted.startsWith('-');

  // Remover prefijo "$" y signo negativo
  const cleaned = formatted.replace(/^-?\$/, '');

  // Separar parte entera y decimal por la coma
  const [integerPart, decimalPart] = cleaned.split(',');

  // Remover separadores de miles (puntos) de la parte entera
  const pesos = parseInt(integerPart.replace(/\./g, ''), 10) || 0;
  const cents = parseInt(decimalPart || '0', 10);

  const result = pesos * 100 + cents;
  return isNegative ? -result : result;
}
