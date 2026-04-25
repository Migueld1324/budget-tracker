import Box from '@mui/material/Box';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function MainLayout() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flex: 1,
          p: { xs: 1, sm: 2, md: 3 },
          // On small screens, add top padding so content doesn't overlap the fixed hamburger button
          pt: { xs: 7, md: 3 },
          overflow: 'auto',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
