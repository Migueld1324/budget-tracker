import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  transactionInputSchema,
  ingresoSchema,
  gastoSchema,
  transferenciaSchema,
  isTDC,
} from './validators';

describe('isTDC', () => {
  it('returns true when name contains TDC uppercase', () => {
    expect(isTDC('BBVA TDC')).toBe(true);
  });

  it('returns true when name contains tdc lowercase', () => {
    expect(isTDC('bbva tdc')).toBe(true);
  });

  it('returns true when name contains TDC mixed case', () => {
    expect(isTDC('Bbva Tdc')).toBe(true);
  });

  it('returns false when name does not contain TDC', () => {
    expect(isTDC('BBVA')).toBe(false);
    expect(isTDC('Efectivo')).toBe(false);
  });

  it('returns true when name is exactly TDC', () => {
    expect(isTDC('TDC')).toBe(true);
  });
});

describe('transactionInputSchema', () => {
  describe('Ingreso', () => {
    const validIngreso = {
      date: '2026-04-05',
      type: 'Ingreso' as const,
      category: 'Sueldo',
      source: null,
      destination: 'BBVA',
      amount: 50000,
      description: 'Pago quincenal',
    };

    it('accepts a valid Ingreso', () => {
      const result = transactionInputSchema.safeParse(validIngreso);
      expect(result.success).toBe(true);
    });

    it('rejects Ingreso with non-null source', () => {
      const result = transactionInputSchema.safeParse({
        ...validIngreso,
        source: 'BBVA',
      });
      expect(result.success).toBe(false);
    });

    it('rejects Ingreso with empty destination', () => {
      const result = transactionInputSchema.safeParse({
        ...validIngreso,
        destination: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects Ingreso with null destination', () => {
      const result = ingresoSchema.safeParse({
        ...validIngreso,
        destination: null,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Gasto', () => {
    const validGasto = {
      date: '2026-04-05',
      type: 'Gasto' as const,
      category: 'Comida',
      source: 'BBVA',
      destination: null,
      amount: 15000,
      description: 'Almuerzo',
    };

    it('accepts a valid Gasto', () => {
      const result = transactionInputSchema.safeParse(validGasto);
      expect(result.success).toBe(true);
    });

    it('rejects Gasto with non-null destination', () => {
      const result = transactionInputSchema.safeParse({
        ...validGasto,
        destination: 'Efectivo',
      });
      expect(result.success).toBe(false);
    });

    it('rejects Gasto with empty source', () => {
      const result = transactionInputSchema.safeParse({
        ...validGasto,
        source: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects Gasto with null source', () => {
      const result = gastoSchema.safeParse({
        ...validGasto,
        source: null,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Transferencia', () => {
    const validTransferencia = {
      date: '2026-04-05',
      type: 'Transferencia' as const,
      category: 'Deuda',
      source: 'BBVA',
      destination: 'BBVA TDC',
      amount: 10000,
      description: 'Pago tarjeta',
    };

    it('accepts a valid Transferencia', () => {
      const result = transactionInputSchema.safeParse(validTransferencia);
      expect(result.success).toBe(true);
    });

    it('rejects Transferencia with same source and destination', () => {
      const result = transferenciaSchema.safeParse({
        ...validTransferencia,
        destination: 'BBVA',
      });
      expect(result.success).toBe(false);
    });

    it('rejects Transferencia with null source', () => {
      const result = transactionInputSchema.safeParse({
        ...validTransferencia,
        source: null,
      });
      expect(result.success).toBe(false);
    });

    it('rejects Transferencia with null destination', () => {
      const result = transactionInputSchema.safeParse({
        ...validTransferencia,
        destination: null,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Common validations', () => {
    it('rejects amount of 0', () => {
      const result = transactionInputSchema.safeParse({
        date: '2026-04-05',
        type: 'Gasto',
        category: 'Comida',
        source: 'BBVA',
        destination: null,
        amount: 0,
        description: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects negative amount', () => {
      const result = transactionInputSchema.safeParse({
        date: '2026-04-05',
        type: 'Gasto',
        category: 'Comida',
        source: 'BBVA',
        destination: null,
        amount: -100,
        description: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid date', () => {
      const result = transactionInputSchema.safeParse({
        date: 'not-a-date',
        type: 'Gasto',
        category: 'Comida',
        source: 'BBVA',
        destination: null,
        amount: 100,
        description: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty category', () => {
      const result = transactionInputSchema.safeParse({
        date: '2026-04-05',
        type: 'Gasto',
        category: '',
        source: 'BBVA',
        destination: null,
        amount: 100,
        description: '',
      });
      expect(result.success).toBe(false);
    });

    it('allows empty description', () => {
      const result = transactionInputSchema.safeParse({
        date: '2026-04-05',
        type: 'Gasto',
        category: 'Comida',
        source: 'BBVA',
        destination: null,
        amount: 100,
        description: '',
      });
      expect(result.success).toBe(true);
    });

    it('rejects non-integer amount', () => {
      const result = transactionInputSchema.safeParse({
        date: '2026-04-05',
        type: 'Gasto',
        category: 'Comida',
        source: 'BBVA',
        destination: null,
        amount: 100.5,
        description: '',
      });
      expect(result.success).toBe(false);
    });
  });
});

// Feature: budget-tracker, Property 1: Clasificación TDC por nombre
// **Validates: Requirements 1.2**
describe('Property 1: Clasificación TDC por nombre', () => {
  it('isTDC returns true if and only if name.toUpperCase() contains "TDC"', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 100 }),
        (name) => {
          const expected = name.toUpperCase().includes('TDC');
          expect(isTDC(name)).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });
});


// Feature: budget-tracker, Property 3: Campos habilitados según tipo de transacción
// **Validates: Requirements 3.3, 3.4, 3.5, 4.1**
describe('Property 3: Campos habilitados según tipo de transacción', () => {
  const validDate = '2026-04-05';
  const categoryArb = fc.string({ minLength: 1, maxLength: 30 });
  const accountArb = fc.string({ minLength: 1, maxLength: 30 });
  const amountArb = fc.integer({ min: 1, max: 10_000_000 });
  const descArb = fc.string({ maxLength: 50 });

  it('Ingreso: valid when destination is set and source is null', () => {
    fc.assert(
      fc.property(
        categoryArb,
        accountArb,
        amountArb,
        descArb,
        (category, destination, amount, description) => {
          const input = {
            date: validDate,
            type: 'Ingreso' as const,
            category,
            source: null,
            destination,
            amount,
            description,
          };
          const result = ingresoSchema.safeParse(input);
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Ingreso: rejects when source is non-null', () => {
    fc.assert(
      fc.property(
        categoryArb,
        accountArb,
        accountArb,
        amountArb,
        descArb,
        (category, destination, source, amount, description) => {
          const input = {
            date: validDate,
            type: 'Ingreso' as const,
            category,
            source,
            destination,
            amount,
            description,
          };
          const result = ingresoSchema.safeParse(input);
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Gasto: valid when source is set and destination is null', () => {
    fc.assert(
      fc.property(
        categoryArb,
        accountArb,
        amountArb,
        descArb,
        (category, source, amount, description) => {
          const input = {
            date: validDate,
            type: 'Gasto' as const,
            category,
            source,
            destination: null,
            amount,
            description,
          };
          const result = gastoSchema.safeParse(input);
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Gasto: rejects when destination is non-null', () => {
    fc.assert(
      fc.property(
        categoryArb,
        accountArb,
        accountArb,
        amountArb,
        descArb,
        (category, source, destination, amount, description) => {
          const input = {
            date: validDate,
            type: 'Gasto' as const,
            category,
            source,
            destination,
            amount,
            description,
          };
          const result = gastoSchema.safeParse(input);
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Transferencia: valid when both source and destination are set and different', () => {
    fc.assert(
      fc.property(
        categoryArb,
        accountArb,
        accountArb,
        amountArb,
        descArb,
        (category, source, destSuffix, amount, description) => {
          // Ensure source ≠ destination by appending a distinguishing suffix
          const destination = source === destSuffix ? destSuffix + '_X' : destSuffix;
          const input = {
            date: validDate,
            type: 'Transferencia' as const,
            category,
            source,
            destination,
            amount,
            description,
          };
          const result = transferenciaSchema.safeParse(input);
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Transferencia: rejects when source equals destination', () => {
    fc.assert(
      fc.property(
        categoryArb,
        accountArb,
        amountArb,
        descArb,
        (category, account, amount, description) => {
          const input = {
            date: validDate,
            type: 'Transferencia' as const,
            category,
            source: account,
            destination: account,
            amount,
            description,
          };
          const result = transferenciaSchema.safeParse(input);
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});



// Feature: budget-tracker, Property 4: Validación de transacciones rechaza datos inválidos
// **Validates: Requirements 3.7, 3.8, 3.9**
describe('Property 4: Validación de transacciones rechaza datos inválidos', () => {
  const transactionTypeArb = fc.constantFrom('Ingreso' as const, 'Gasto' as const, 'Transferencia' as const);
  const validDate = '2026-04-05';
  const categoryArb = fc.string({ minLength: 1, maxLength: 30 });
  const accountArb = fc.string({ minLength: 1, maxLength: 30 });
  const descArb = fc.string({ maxLength: 50 });

  /** Helper: build a valid base input for a given type */
  function buildValidInput(
    type: 'Ingreso' | 'Gasto' | 'Transferencia',
    overrides: Record<string, unknown> = {},
  ) {
    const base: Record<string, unknown> = {
      date: validDate,
      type,
      category: 'Cat',
      amount: 100,
      description: '',
    };
    if (type === 'Ingreso') {
      base.source = null;
      base.destination = 'BBVA';
    } else if (type === 'Gasto') {
      base.source = 'BBVA';
      base.destination = null;
    } else {
      base.source = 'BBVA';
      base.destination = 'Efectivo';
    }
    return { ...base, ...overrides };
  }

  it('rejects any transaction with amount ≤ 0', () => {
    const nonPositiveAmountArb = fc.oneof(
      fc.integer({ min: -10_000_000, max: 0 }),
      fc.double({ min: -10_000, max: 0, noNaN: true }),
    );

    fc.assert(
      fc.property(
        transactionTypeArb,
        nonPositiveAmountArb,
        (type, amount) => {
          const input = buildValidInput(type, { amount });
          const result = transactionInputSchema.safeParse(input);
          expect(result.success).toBe(false);
          if (!result.success) {
            const paths = result.error.issues.map((i) => i.path.join('.'));
            expect(paths).toContain('amount');
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('rejects any transaction with an invalid date string', () => {
    // Generate strings that are NOT valid ISO dates
    const invalidDateArb = fc.oneof(
      fc.constant('not-a-date'),
      fc.constant('2026-13-01'),   // month 13
      fc.constant('2026-00-15'),   // month 0
      fc.constant('2026-04-32'),   // day 32
      fc.constant('abcd-ef-gh'),
      fc.constant(''),
      // Random strings unlikely to be valid dates
      fc.string({ minLength: 1, maxLength: 20 }).filter((s) => isNaN(new Date(s).getTime())),
    );

    fc.assert(
      fc.property(
        transactionTypeArb,
        invalidDateArb,
        (type, date) => {
          const input = buildValidInput(type, { date });
          const result = transactionInputSchema.safeParse(input);
          expect(result.success).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('rejects any transaction with empty category', () => {
    fc.assert(
      fc.property(
        transactionTypeArb,
        fc.integer({ min: 1, max: 10_000_000 }),
        descArb,
        (type, amount, description) => {
          const input = buildValidInput(type, { category: '', amount, description });
          const result = transactionInputSchema.safeParse(input);
          expect(result.success).toBe(false);
          if (!result.success) {
            const paths = result.error.issues.map((i) => i.path.join('.'));
            expect(paths).toContain('category');
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('rejects Ingreso with empty destination', () => {
    fc.assert(
      fc.property(
        categoryArb,
        fc.integer({ min: 1, max: 10_000_000 }),
        descArb,
        (category, amount, description) => {
          const input = {
            date: validDate,
            type: 'Ingreso' as const,
            category,
            source: null,
            destination: '',
            amount,
            description,
          };
          const result = transactionInputSchema.safeParse(input);
          expect(result.success).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('rejects Gasto with empty source', () => {
    fc.assert(
      fc.property(
        categoryArb,
        fc.integer({ min: 1, max: 10_000_000 }),
        descArb,
        (category, amount, description) => {
          const input = {
            date: validDate,
            type: 'Gasto' as const,
            category,
            source: '',
            destination: null,
            amount,
            description,
          };
          const result = transactionInputSchema.safeParse(input);
          expect(result.success).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('rejects Transferencia with empty source or destination', () => {
    const emptyFieldArb = fc.constantFrom('source', 'destination') as fc.Arbitrary<'source' | 'destination'>;

    fc.assert(
      fc.property(
        emptyFieldArb,
        categoryArb,
        accountArb,
        fc.integer({ min: 1, max: 10_000_000 }),
        descArb,
        (emptyField, category, account, amount, description) => {
          const input = {
            date: validDate,
            type: 'Transferencia' as const,
            category,
            source: emptyField === 'source' ? '' : account,
            destination: emptyField === 'destination' ? '' : account,
            amount,
            description,
          };
          const result = transactionInputSchema.safeParse(input);
          expect(result.success).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });
});
