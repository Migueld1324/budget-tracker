import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import type { Account, CategoryLists, TransactionInput, TransactionType } from '../../types';

export interface TransactionFormProps {
  accounts: Account[];
  categories: CategoryLists;
  initialValues?: Partial<TransactionInput>;
  onSubmit: (data: TransactionInput) => void;
  onCancel: () => void;
}

const TRANSACTION_TYPES: TransactionType[] = ['Ingreso', 'Gasto', 'Transferencia'];

/**
 * Form-level schema that works with pesos (not centavos).
 * The amount is validated as a positive number here; conversion to centavos happens on submit.
 * Source/destination are validated as strings; we set them to null based on type before submitting.
 */
const formSchema = z
  .object({
    date: z.string().min(1, 'La fecha es obligatoria').refine(
      (val) => !isNaN(new Date(val).getTime()),
      { message: 'Ingrese una fecha válida' },
    ),
    type: z.enum(['Ingreso', 'Gasto', 'Transferencia'], {
      message: 'Seleccione un tipo',
    }),
    category: z.string().min(1, 'La categoría es obligatoria'),
    source: z.string(),
    destination: z.string(),
    amount: z.number().gt(0, 'El monto debe ser un número mayor a cero'),
    description: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'Gasto' || data.type === 'Transferencia') {
      if (!data.source) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La cuenta origen es obligatoria',
          path: ['source'],
        });
      }
    }
    if (data.type === 'Ingreso' || data.type === 'Transferencia') {
      if (!data.destination) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La cuenta destino es obligatoria',
          path: ['destination'],
        });
      }
    }
    if (data.type === 'Transferencia' && data.source && data.destination && data.source === data.destination) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Las cuentas de origen y destino deben ser diferentes',
        path: ['destination'],
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

function centavosToPesos(centavos: number): number {
  return centavos / 100;
}

function pesosToCentavos(pesos: number): number {
  return Math.round(pesos * 100);
}

export default function TransactionForm({
  accounts,
  categories,
  initialValues,
  onSubmit,
  onCancel,
}: TransactionFormProps) {
  const defaultType = initialValues?.type ?? 'Gasto';

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: initialValues?.date ?? new Date().toISOString().slice(0, 10),
      type: defaultType,
      category: initialValues?.category ?? '',
      source: initialValues?.source ?? '',
      destination: initialValues?.destination ?? '',
      amount: initialValues?.amount != null ? centavosToPesos(initialValues.amount) : ('' as unknown as number),
      description: initialValues?.description ?? '',
    },
  });

  const selectedType = watch('type');

  const isSourceEnabled = selectedType === 'Gasto' || selectedType === 'Transferencia';
  const isDestinationEnabled = selectedType === 'Ingreso' || selectedType === 'Transferencia';

  // Reset disabled fields and category when type changes
  useEffect(() => {
    if (!isSourceEnabled) {
      setValue('source', '');
    }
    if (!isDestinationEnabled) {
      setValue('destination', '');
    }
    // Reset category since categories differ per type
    setValue('category', '');
  }, [selectedType, isSourceEnabled, isDestinationEnabled, setValue]);

  const filteredCategories = categories[selectedType] ?? [];

  const handleFormSubmit = (data: FormValues) => {
    const transactionInput: TransactionInput = {
      date: data.date,
      type: data.type,
      category: data.category,
      source: isSourceEnabled ? data.source : null,
      destination: isDestinationEnabled ? data.destination : null,
      amount: pesosToCentavos(data.amount),
      description: data.description,
    };
    onSubmit(transactionInput);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(handleFormSubmit)}
      noValidate
      sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 300 }}
    >
      {/* Date */}
      <Controller
        name="date"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Fecha"
            type="date"
            error={!!errors.date}
            helperText={errors.date?.message}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
        )}
      />

      {/* Type */}
      <Controller
        name="type"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth error={!!errors.type}>
            <InputLabel id="type-label">Tipo</InputLabel>
            <Select {...field} labelId="type-label" label="Tipo">
              {TRANSACTION_TYPES.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </Select>
            {errors.type && <FormHelperText>{errors.type.message}</FormHelperText>}
          </FormControl>
        )}
      />

      {/* Category */}
      <Controller
        name="category"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth error={!!errors.category}>
            <InputLabel id="category-label">Categoría</InputLabel>
            <Select {...field} labelId="category-label" label="Categoría">
              {filteredCategories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
            {errors.category && <FormHelperText>{errors.category.message}</FormHelperText>}
          </FormControl>
        )}
      />

      {/* Source */}
      <Controller
        name="source"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth error={!!errors.source} disabled={!isSourceEnabled}>
            <InputLabel id="source-label">Origen</InputLabel>
            <Select {...field} labelId="source-label" label="Origen">
              {accounts.map((acc) => (
                <MenuItem key={acc.id} value={acc.name}>
                  {acc.name}
                </MenuItem>
              ))}
            </Select>
            {errors.source && <FormHelperText>{errors.source.message}</FormHelperText>}
          </FormControl>
        )}
      />

      {/* Destination */}
      <Controller
        name="destination"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth error={!!errors.destination} disabled={!isDestinationEnabled}>
            <InputLabel id="destination-label">Destino</InputLabel>
            <Select {...field} labelId="destination-label" label="Destino">
              {accounts.map((acc) => (
                <MenuItem key={acc.id} value={acc.name}>
                  {acc.name}
                </MenuItem>
              ))}
            </Select>
            {errors.destination && <FormHelperText>{errors.destination.message}</FormHelperText>}
          </FormControl>
        )}
      />

      {/* Amount */}
      <Controller
        name="amount"
        control={control}
        render={({ field: { onChange, value, ...rest } }) => (
          <TextField
            {...rest}
            value={value === 0 ? '' : value}
            onChange={(e) => {
              const num = e.target.value === '' ? 0 : Number(e.target.value);
              onChange(num);
            }}
            label="Monto ($)"
            type="number"
            error={!!errors.amount}
            helperText={errors.amount?.message as string}
            slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
            fullWidth
          />
        )}
      />

      {/* Description */}
      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Descripción"
            multiline
            minRows={2}
            error={!!errors.description}
            helperText={errors.description?.message}
            fullWidth
          />
        )}
      />

      {/* Actions */}
      <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={onCancel} type="button">
          Cancelar
        </Button>
        <Button variant="contained" type="submit">
          Guardar
        </Button>
      </Stack>
    </Box>
  );
}
