import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Brightness4 from '@mui/icons-material/Brightness4';
import Brightness7 from '@mui/icons-material/Brightness7';
import { useUIStore } from '../../store/uiStore';

export default function ThemeToggle() {
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);

  return (
    <Tooltip title={theme === 'light' ? 'Tema oscuro' : 'Tema claro'}>
      <IconButton color="inherit" onClick={toggleTheme} aria-label="Alternar tema">
        {theme === 'light' ? <Brightness4 /> : <Brightness7 />}
      </IconButton>
    </Tooltip>
  );
}
