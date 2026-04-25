import { z } from 'zod';

/**
 * Returns true if the account name contains "TDC" (case-insensitive).
 * Used to classify credit card accounts.
 */
export function isTDC(name: string): boolean {
  return name.toUpperCase().includes('TDC');
}

// --- Base field schemas ---

const dateSchema = z.string().refine(
  (val) => {
    const d = new Date(val);
    return !isNaN(d.getTime());
  },
  { message: 'Ingrese una fecha válida' }
);

const amountSchema = z.number().int().gt(0, 'El monto debe ser un número mayor a cero');

const categorySchema = z.string().min(1, 'La categoría es obligatoria');

const descriptionSchema = z.string();

// --- Type-specific schemas ---

const ingresoSchema = z.object({
  date: dateSchema,
  type: z.literal('Ingreso'),
  category: categorySchema,
  source: z.null({ message: 'Ingreso no debe tener cuenta origen' }),
  destination: z.string().min(1, 'La cuenta destino es obligatoria'),
  amount: amountSchema,
  description: descriptionSchema,
});

const gastoSchema = z.object({
  date: dateSchema,
  type: z.literal('Gasto'),
  category: categorySchema,
  source: z.string().min(1, 'La cuenta origen es obligatoria'),
  destination: z.null({ message: 'Gasto no debe tener cuenta destino' }),
  amount: amountSchema,
  description: descriptionSchema,
});

const transferenciaSchema = z
  .object({
    date: dateSchema,
    type: z.literal('Transferencia'),
    category: categorySchema,
    source: z.string().min(1, 'La cuenta origen es obligatoria'),
    destination: z.string().min(1, 'La cuenta destino es obligatoria'),
    amount: amountSchema,
    description: descriptionSchema,
  })
  .refine((data) => data.source !== data.destination, {
    message: 'Las cuentas de origen y destino deben ser diferentes',
    path: ['destination'],
  });

// --- Discriminated union schema ---

export const transactionInputSchema = z.discriminatedUnion('type', [
  ingresoSchema,
  gastoSchema,
  transferenciaSchema,
]);

// Re-export individual schemas for direct use
export { ingresoSchema, gastoSchema, transferenciaSchema };
