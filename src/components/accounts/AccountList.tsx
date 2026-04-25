import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import type { Account } from '../../types';
import { formatMXN } from '../../utils/currency';

export interface AccountListProps {
  accounts: Account[];
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
  error: string | null;
}

export default function AccountList({ accounts, onEdit, onDelete, error }: AccountListProps) {
  if (accounts.length === 0 && !error) {
    return <Typography color="text.secondary">No hay cuentas</Typography>;
  }

  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <List>
        {accounts.map((account) => (
          <ListItem
            key={account.id}
            secondaryAction={
              <Stack direction="row" spacing={1}>
                <IconButton edge="end" aria-label="editar" onClick={() => onEdit(account)}>
                  <Edit />
                </IconButton>
                <IconButton edge="end" aria-label="eliminar" onClick={() => onDelete(account.id)}>
                  <Delete />
                </IconButton>
              </Stack>
            }
          >
            <ListItemText
              primary={account.name}
              secondary={`Saldo inicial: ${formatMXN(account.initialBalance)}`}
            />
          </ListItem>
        ))}
      </List>
    </>
  );
}
