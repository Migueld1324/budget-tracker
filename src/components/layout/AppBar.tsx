import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate, useLocation } from 'react-router-dom';
import PeriodSelector from '../common/PeriodSelector';
import ThemeToggle from '../common/ThemeToggle';
import { useAuthStore } from '../../store/authStore';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Transacciones', path: '/transactions' },
  { label: 'Balances', path: '/balances' },
  { label: 'Cuentas', path: '/accounts' },
  { label: 'Categorías', path: '/categories' },
  { label: 'Importar/Exportar', path: '/import-export' },
];

export default function AppBar() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <MuiAppBar position="static">
      <Toolbar sx={{ gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="h6" component="div" sx={{ mr: 2 }}>
          Budget Tracker
        </Typography>

        <Box sx={{ display: 'flex', gap: 0.5, mr: 'auto', flexWrap: 'wrap' }}>
          {NAV_ITEMS.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              size="small"
              onClick={() => navigate(item.path)}
              sx={{
                textTransform: 'none',
                fontWeight: location.pathname === item.path ? 700 : 400,
                borderBottom: location.pathname === item.path ? '2px solid white' : 'none',
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        <PeriodSelector />
        <ThemeToggle />

        <Tooltip title="Cerrar sesión">
          <IconButton color="inherit" onClick={logout} aria-label="Cerrar sesión">
            <LogoutIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </MuiAppBar>
  );
}
