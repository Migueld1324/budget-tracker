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
import Delete from '@mui/icons-material/Delete';
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

          <List dense>
            {categories[type].map((name) => (
              <ListItem
                key={name}
                secondaryAction={
                  <IconButton edge="end" aria-label="eliminar" onClick={() => onDelete(type, name)}>
                    <Delete />
                  </IconButton>
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

          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
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
