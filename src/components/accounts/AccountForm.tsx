import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import type { AccountInput } from '../../types';

export interface AccountFormProps {
  initialValues?: Partial<AccountInput>;
  onSubmit: (data: AccountInput) => void;
  onCancel: () => void;
}

const accountSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  initialBalance: z.number({ message: 'Ingrese un monto válido' }),
});

type FormValues = z.infer<typeof accountSchema>;

function centavosToPesos(centavos: number): number {
  return centavos / 100;
}

function pesosToCentavos(pesos: number): number {
  return Math.round(pesos * 100);
}

export default function AccountForm({ initialValues, onSubmit, onCancel }: AccountFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: initialValues?.name ?? '',
      initialBalance:
        initialValues?.initialBalance != null
          ? centavosToPesos(initialValues.initialBalance)
          : ('' as unknown as number),
    },
  });

  const handleFormSubmit = (data: FormValues) => {
    onSubmit({
      name: data.name.trim(),
      initialBalance: pesosToCentavos(data.initialBalance),
    });
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(handleFormSubmit)}
      noValidate
      sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 300 }}
    >
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Nombre de la cuenta"
            error={!!errors.name}
            helperText={errors.name?.message}
            fullWidth
          />
        )}
      />

      <Controller
        name="initialBalance"
        control={control}
        render={({ field: { onChange, value, ...rest } }) => (
          <TextField
            {...rest}
            value={value === 0 ? '' : value}
            onChange={(e) => {
              const num = e.target.value === '' ? 0 : Number(e.target.value);
              onChange(num);
            }}
            label="Saldo inicial ($)"
            type="number"
            error={!!errors.initialBalance}
            helperText={errors.initialBalance?.message}
            slotProps={{ htmlInput: { step: '0.01' } }}
            fullWidth
          />
        )}
      />

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
