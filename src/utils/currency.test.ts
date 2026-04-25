import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { formatMXN, parseMXN } from './currency';

describe('formatMXN', () => {
  it('formats zero centavos', () => {
    expect(formatMXN(0)).toBe('$0,00');
  });

  it('formats small amounts (less than 1 peso)', () => {
    expect(formatMXN(1)).toBe('$0,01');
    expect(formatMXN(50)).toBe('$0,50');
    expect(formatMXN(99)).toBe('$0,99');
  });

  it('formats exact pesos (no centavos)', () => {
    expect(formatMXN(100)).toBe('$1,00');
    expect(formatMXN(1000)).toBe('$10,00');
  });

  it('formats amounts with thousands separator', () => {
    expect(formatMXN(123456)).toBe('$1.234,56');
    expect(formatMXN(100000)).toBe('$1.000,00');
    expect(formatMXN(1000000)).toBe('$10.000,00');
    expect(formatMXN(123456789)).toBe('$1.234.567,89');
  });

  it('formats negative amounts', () => {
    expect(formatMXN(-123456)).toBe('-$1.234,56');
    expect(formatMXN(-50)).toBe('-$0,50');
  });
});

describe('parseMXN', () => {
  it('parses zero', () => {
    expect(parseMXN('$0,00')).toBe(0);
  });

  it('parses small amounts', () => {
    expect(parseMXN('$0,01')).toBe(1);
    expect(parseMXN('$0,50')).toBe(50);
    expect(parseMXN('$0,99')).toBe(99);
  });

  it('parses amounts with thousands separator', () => {
    expect(parseMXN('$1.234,56')).toBe(123456);
    expect(parseMXN('$1.000,00')).toBe(100000);
    expect(parseMXN('$1.234.567,89')).toBe(123456789);
  });

  it('parses negative amounts', () => {
    expect(parseMXN('-$1.234,56')).toBe(-123456);
    expect(parseMXN('-$0,50')).toBe(-50);
  });
});

describe('round-trip', () => {
  it('parseMXN(formatMXN(n)) === n for various values', () => {
    const values = [0, 1, 50, 99, 100, 123456, 100000, 1000000, 123456789];
    for (const n of values) {
      expect(parseMXN(formatMXN(n))).toBe(n);
    }
  });

  it('round-trip works for negative values', () => {
    const values = [-1, -50, -123456, -100000];
    for (const n of values) {
      expect(parseMXN(formatMXN(n))).toBe(n);
    }
  });
});

// Feature: budget-tracker, Property 2: Round-trip de formato de pesos mexicanos
// **Validates: Requirements 5.6, 7.7, 11.6, 12.3**
describe('Property 2: Round-trip de formato de pesos mexicanos', () => {
  it('parseMXN(formatMXN(n)) === n for any valid centavo amount', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 999_999_999 }),
        (centavos) => {
          expect(parseMXN(formatMXN(centavos))).toBe(centavos);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('parseMXN(formatMXN(n)) === n for negative centavo amounts', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -999_999_999, max: -1 }),
        (centavos) => {
          expect(parseMXN(formatMXN(centavos))).toBe(centavos);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('formatMXN(parseMXN(s)) === s for any valid formatted string', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 999_999_999 }),
        (centavos) => {
          const formatted = formatMXN(centavos);
          expect(formatMXN(parseMXN(formatted))).toBe(formatted);
        }
      ),
      { numRuns: 100 }
    );
  });
});

