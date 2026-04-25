import { useState } from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreVert from '@mui/icons-material/MoreVert';
import type { Account } from '../../types';
import { formatMXN } from '../../utils/currency';

export interface AccountListProps {
  accounts: Account[];
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
  error: string | null;
}

export default function AccountList({ accounts, onEdit, onDelete, error }: AccountListProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);

  const openActionsMenu = (event: React.MouseEvent<HTMLElement>, accountId: string) => {
    setAnchorEl(event.currentTarget);
    setActiveAccountId(accountId);
  };

  const closeActionsMenu = () => {
    setAnchorEl(null);
    setActiveAccountId(null);
  };

  const handleEdit = (account: Account) => {
    onEdit(account);
    closeActionsMenu();
  };

  const handleDelete = (id: string) => {
    onDelete(id);
    closeActionsMenu();
  };

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
      <List disablePadding sx={{ border: '1px solid', borderColor: 'divider' }}>
        {accounts.map((account) => (
          <ListItem
            key={account.id}
            sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
            secondaryAction={
              <>
                <IconButton
                  edge="end"
                  aria-label="opciones"
                  onClick={(e) => openActionsMenu(e, account.id)}
                >
                  <MoreVert />
                </IconButton>
                <Menu
                  anchorEl={activeAccountId === account.id ? anchorEl : null}
                  open={activeAccountId === account.id && Boolean(anchorEl)}
                  onClose={closeActionsMenu}
                >
                  <MenuItem onClick={() => handleEdit(account)}>Editar</MenuItem>
                  <MenuItem onClick={() => handleDelete(account.id)}>Eliminar</MenuItem>
                </Menu>
              </>
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
