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
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import MoreVert from '@mui/icons-material/MoreVert';
import type { CategoryLists, TransactionType } from '../../types';

export interface CategoryManagerProps {
  categories: CategoryLists;
  onAdd: (type: TransactionType, name: string) => void;
  onDelete: (type: TransactionType, name: string) => void;
  onUpdate: (type: TransactionType, oldName: string, newName: string) => void;
  error: string | null;
}

const SECTIONS: { type: TransactionType; label: string }[] = [
  { type: 'Ingreso', label: 'Ingreso' },
  { type: 'Gasto', label: 'Gasto' },
  { type: 'Transferencia', label: 'Transferencia' },
];

export default function CategoryManager({ categories, onAdd, onDelete, onUpdate, error }: CategoryManagerProps) {
  const [newNames, setNewNames] = useState<Record<TransactionType, string>>({
    Ingreso: '',
    Gasto: '',
    Transferencia: '',
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeCategory, setActiveCategory] = useState<{ type: TransactionType; name: string } | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editedCategory, setEditedCategory] = useState<{ type: TransactionType; oldName: string } | null>(null);
  const [editedName, setEditedName] = useState('');

  const openActionsMenu = (event: React.MouseEvent<HTMLElement>, type: TransactionType, name: string) => {
    setAnchorEl(event.currentTarget);
    setActiveCategory({ type, name });
  };

  const closeActionsMenu = () => {
    setAnchorEl(null);
    setActiveCategory(null);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeCategory) {
      onDelete(activeCategory.type, activeCategory.name);
    }
    closeActionsMenu();
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeCategory) {
      setEditedCategory({ type: activeCategory.type, oldName: activeCategory.name });
      setEditedName(activeCategory.name);
      setEditDialogOpen(true);
      closeActionsMenu();
    }
  };

  const handleEditSave = () => {
    const newName = editedName.trim();
    if (!newName || !editedCategory) {
      setEditDialogOpen(false);
      return;
    }
    if (newName !== editedCategory.oldName) {
      onUpdate(editedCategory.type, editedCategory.oldName, newName);
    }
    setEditDialogOpen(false);
    setEditedName('');
    setEditedCategory(null);
  };

  const handleEditCancel = () => {
    setEditDialogOpen(false);
    setEditedName('');
    setEditedCategory(null);
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
                      <MenuItem onClick={handleEditClick}>Editar</MenuItem>
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

      <Dialog open={editDialogOpen} onClose={handleEditCancel}>
        <DialogTitle>Editar Categoría</DialogTitle>
        <DialogContent sx={{ minWidth: '400px' }}>
          <TextField
            autoFocus
            fullWidth
            label="Nombre de la categoría"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleEditSave();
              if (e.key === 'Escape') handleEditCancel();
            }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditCancel}>Cancelar</Button>
          <Button onClick={handleEditSave} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
