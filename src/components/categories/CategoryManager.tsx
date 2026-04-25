import { useState } from 'react';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreVert from '@mui/icons-material/MoreVert';
import type { CategoryLists, TransactionType } from '../../types';

export interface CategoryManagerProps {
  categories: CategoryLists;
  onAdd: (type: TransactionType, name: string) => void;
  onDelete: (type: TransactionType, name: string) => void;
  error: string | null;
}

const SECTIONS: { type: TransactionType; label: string }[] = [
  { type: 'Ingreso', label: 'Ingreso' },
  { type: 'Gasto', label: 'Gasto' },
  { type: 'Transferencia', label: 'Transferencia' },
];

export default function CategoryManager({ categories, onAdd, onDelete, error }: CategoryManagerProps) {
  const [newNames, setNewNames] = useState<Record<TransactionType, string>>({
    Ingreso: '',
    Gasto: '',
    Transferencia: '',
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeCategory, setActiveCategory] = useState<{ type: TransactionType; name: string } | null>(null);

  const openActionsMenu = (event: React.MouseEvent<HTMLElement>, type: TransactionType, name: string) => {
    setAnchorEl(event.currentTarget);
    setActiveCategory({ type, name });
  };

  const closeActionsMenu = () => {
    setAnchorEl(null);
    setActiveCategory(null);
  };

  const handleDeleteClick = () => {
    if (activeCategory) {
      onDelete(activeCategory.type, activeCategory.name);
    }
    closeActionsMenu();
  };

  const handleAdd = (type: TransactionType) => {
    const name = newNames[type].trim();
    if (!name) return;
    onAdd(type, name);
    setNewNames((prev) => ({ ...prev, [type]: '' }));
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {SECTIONS.map(({ type, label }, index) => (
        <Box key={type}>
          {index > 0 && <Divider sx={{ my: 2 }} />}
          <Typography variant="h6" gutterBottom>
            {label}
          </Typography>

          <List dense disablePadding sx={{ border: '1px solid', borderColor: 'divider' }}>
            {categories[type].map((name) => (
              <ListItem
                key={name}
                sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
                secondaryAction={
                  <>
                    <IconButton
                      edge="end"
                      aria-label="opciones"
                      onClick={(e) => openActionsMenu(e, type, name)}
                    >
                      <MoreVert />
                    </IconButton>
                    <Menu
                      anchorEl={activeCategory?.type === type && activeCategory?.name === name ? anchorEl : null}
                      open={activeCategory?.type === type && activeCategory?.name === name && Boolean(anchorEl)}
                      onClose={closeActionsMenu}
                    >
                      <MenuItem onClick={handleDeleteClick}>Eliminar</MenuItem>
                    </Menu>
                  </>
                }
              >
                <ListItemText primary={name} />
              </ListItem>
            ))}
          </List>

          {categories[type].length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Sin categorías
            </Typography>
          )}

          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', pt: 2 }}>
            <TextField
              size="small"
              placeholder="Nueva categoría"
              value={newNames[type]}
              onChange={(e) => setNewNames((prev) => ({ ...prev, [type]: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd(type);
              }}
            />
            <Button variant="contained" size="small" onClick={() => handleAdd(type)}>
              Agregar
            </Button>
          </Stack>
        </Box>
      ))}
    </Box>
  );
}
