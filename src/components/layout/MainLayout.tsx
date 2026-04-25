import Box from '@mui/material/Box';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function MainLayout() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{ flex: 1, p: { xs: 1, sm: 2, md: 3 }, pt: { xs: 7, md: 3 }, overflow: 'auto', minWidth: 0, maxWidth: '100%' }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
