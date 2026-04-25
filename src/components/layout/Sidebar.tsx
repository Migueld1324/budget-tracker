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
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CategoryIcon from '@mui/icons-material/Category';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import LogoutIcon from '@mui/icons-material/Logout';
import Brightness4 from '@mui/icons-material/Brightness4';
import Brightness7 from '@mui/icons-material/Brightness7';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';

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

function NavItem({ item, expanded, onNavigate }: { item: typeof NAV_ITEMS[0]; expanded: boolean; onNavigate: (p: string) => void }) {
  const location = useLocation();
  const active = location.pathname === item.path;
  const btn = (
    <ListItemButton
      selected={active}
      onClick={() => onNavigate(item.path)}
      sx={{ minHeight: 48, justifyContent: expanded ? 'initial' : 'center', px: expanded ? 2 : 'auto', borderRadius: 1, mx: 0.5, mb: 0.5 }}
    >
      <ListItemIcon sx={{ minWidth: 0, mr: expanded ? 2 : 0, justifyContent: 'center', color: active ? 'primary.main' : 'text.secondary' }}>
        {item.icon}
      </ListItemIcon>
      {expanded && <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontSize: 14, fontWeight: active ? 600 : 400 } } }} />}
    </ListItemButton>
  );
  return expanded ? btn : <Tooltip title={item.label} placement="right">{btn}</Tooltip>;
}

function BottomActions({ expanded }: { expanded: boolean }) {
  const themeMode = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const logout = useAuthStore((s) => s.logout);
  const themeIcon = themeMode === 'light' ? <Brightness4 /> : <Brightness7 />;
  const themeLabel = themeMode === 'light' ? 'Tema oscuro' : 'Tema claro';

  const item = (icon: React.ReactNode, label: string, onClick: () => void) => {
    const btn = (
      <ListItemButton
        onClick={onClick}
        sx={{ minHeight: 48, justifyContent: expanded ? 'initial' : 'center', px: expanded ? 2 : 'auto', borderRadius: 1, mx: 0.5, mb: 0.5 }}
      >
        <ListItemIcon sx={{ minWidth: 0, mr: expanded ? 2 : 0, justifyContent: 'center', color: 'text.secondary' }}>
          {icon}
        </ListItemIcon>
        {expanded && <ListItemText primary={label} slotProps={{ primary: { sx: { fontSize: 14 } } }} />}
      </ListItemButton>
    );
    return expanded ? btn : <Tooltip title={label} placement="right">{btn}</Tooltip>;
  };

  return (
    <List sx={{ py: 1 }}>
      {item(themeIcon, themeLabel, toggleTheme)}
      {item(<LogoutIcon />, 'Cerrar sesión', logout)}
    </List>
  );
}

function DrawerContent({ expanded, onNavigate, onClose }: { expanded: boolean; onNavigate: (p: string) => void; onClose: () => void }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: expanded ? 'flex-end' : 'center', p: 1 }}>
        <IconButton onClick={onClose} aria-label={expanded ? 'Colapsar menú' : 'Expandir menú'}>
          {expanded ? <MenuOpenIcon /> : <MenuIcon />}
        </IconButton>
      </Box>
      <Divider />
      <List sx={{ flex: 1, pt: 1 }}>
        {NAV_ITEMS.map((item) => <NavItem key={item.path} item={item} expanded={expanded} onNavigate={onNavigate} />)}
      </List>
      <Divider />
      <BottomActions expanded={expanded} />
    </Box>
  );
}

export default function Sidebar() {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));
  const [expanded, setExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isSmall) setMobileOpen(false);
  };

  if (isSmall) {
    return (
      <>
        {/* Hamburger — only visible when drawer is closed */}
        {!mobileOpen && (
          <IconButton
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
            sx={{ position: 'fixed', top: 8, left: 8, zIndex: (t) => t.zIndex.drawer + 1 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{ '& .MuiDrawer-paper': { width: EXPANDED_WIDTH } }}
          ModalProps={{ keepMounted: true }}
        >
          {/* On mobile overlay: show close button instead of hamburger */}
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
              <IconButton onClick={() => setMobileOpen(false)} aria-label="Cerrar menú">
                <MenuOpenIcon />
              </IconButton>
            </Box>
            <Divider />
            <List sx={{ flex: 1, pt: 1 }}>
              {NAV_ITEMS.map((item) => <NavItem key={item.path} item={item} expanded onNavigate={handleNavigate} />)}
            </List>
            <Divider />
            <BottomActions expanded />
          </Box>
        </Drawer>
      </>
    );
  }

  const width = expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH;
  return (
    <Drawer
      variant="permanent"
      sx={{
        width, flexShrink: 0,
        '& .MuiDrawer-paper': { width, transition: 'width 0.2s ease', overflowX: 'hidden', display: 'flex', flexDirection: 'column', borderRight: 1, borderColor: 'divider' },
      }}
    >
      <DrawerContent expanded={expanded} onNavigate={handleNavigate} onClose={() => setExpanded(!expanded)} />
    </Drawer>
  );
}

export { COLLAPSED_WIDTH, EXPANDED_WIDTH };
