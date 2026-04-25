import { useEffect, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

import { useAuthStore } from './store/authStore';
import { useUIStore } from './store/uiStore';
import { getTheme } from './theme/theme';

import LoginPage from './pages/LoginPage';
import MainLayout from './components/layout/MainLayout';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'));
const BalancesPage = lazy(() => import('./pages/BalancesPage'));
const AccountsPage = lazy(() => import('./pages/AccountsPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const ImportExportPage = lazy(() => import('./pages/ImportExportPage'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  const listenAuthState = useAuthStore((s) => s.listenAuthState);
  const loadThemePreference = useUIStore((s) => s.loadThemePreference);
  const theme = useUIStore((s) => s.theme);

  useEffect(() => {
    const unsubscribe = listenAuthState();
    return unsubscribe;
  }, [listenAuthState]);

  useEffect(() => {
    loadThemePreference();
  }, [loadThemePreference]);

  const muiTheme = getTheme(theme);

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <HashRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/login"
            element={<PublicRoute><LoginPage /></PublicRoute>}
          />
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Suspense fallback={null}><DashboardPage /></Suspense>} />
            <Route path="/transactions" element={<Suspense fallback={null}><TransactionsPage /></Suspense>} />
            <Route path="/balances" element={<Suspense fallback={null}><BalancesPage /></Suspense>} />
            <Route path="/accounts" element={<Suspense fallback={null}><AccountsPage /></Suspense>} />
            <Route path="/categories" element={<Suspense fallback={null}><CategoriesPage /></Suspense>} />
            <Route path="/import-export" element={<Suspense fallback={null}><ImportExportPage /></Suspense>} />
          </Route>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default App;
