import { useState } from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CategoryIcon from '@mui/icons-material/Category';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate, useLocation } from 'react-router-dom';
import ThemeToggle from '../common/ThemeToggle';
import { useAuthStore } from '../../store/authStore';

const COLLAPSED_WIDTH = 64;
const EXPANDED_WIDTH = 220;

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { label: 'Transacciones', path: '/transactions', icon: <ReceiptLongIcon /> },
  { label: 'Balances', path: '/balances', icon: <AccountBalanceIcon /> },
  { label: 'Cuentas', path: '/accounts', icon: <AccountBalanceWalletIcon /> },
  { label: 'Categorías', path: '/categories', icon: <CategoryIcon /> },
  { label: 'Importar/Exportar', path: '/import-export', icon: <ImportExportIcon /> },
];

export default function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((s) => s.logout);
  const width = expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width,
          transition: 'width 0.2s ease',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          borderRight: 1,
          borderColor: 'divider',
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: expanded ? 'flex-end' : 'center', p: 1 }}>
        <IconButton onClick={() => setExpanded(!expanded)} aria-label={expanded ? 'Colapsar menú' : 'Expandir menú'}>
          {expanded ? <MenuOpenIcon /> : <MenuIcon />}
        </IconButton>
      </Box>

      <Divider />

      <List sx={{ flex: 1, pt: 1 }}>
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          const button = (
            <ListItemButton
              key={item.path}
              selected={active}
              onClick={() => navigate(item.path)}
              sx={{
                minHeight: 48,
                justifyContent: expanded ? 'initial' : 'center',
                px: expanded ? 2 : 'auto',
                borderRadius: 1,
                mx: 0.5,
                mb: 0.5,
              }}
            >
              <ListItemIcon sx={{ minWidth: 0, mr: expanded ? 2 : 0, justifyContent: 'center', color: active ? 'primary.main' : 'text.secondary' }}>
                {item.icon}
              </ListItemIcon>
              {expanded && <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 600 : 400 }} />}
            </ListItemButton>
          );

          return expanded ? button : (
            <Tooltip key={item.path} title={item.label} placement="right">
              {button}
            </Tooltip>
          );
        })}
      </List>

      <Divider />

      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 1, gap: 0.5 }}>
        <ThemeToggle />
        <Tooltip title="Cerrar sesión" placement="right">
          <IconButton onClick={logout} aria-label="Cerrar sesión">
            <LogoutIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Drawer>
  );
}

export { COLLAPSED_WIDTH, EXPANDED_WIDTH };
