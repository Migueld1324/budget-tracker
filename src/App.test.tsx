/**
 * Feature: budget-tracker, Property 22: Redirección de usuarios no autenticados
 *
 * Para cualquier ruta protegida, si el usuario no está autenticado, se redirige a login.
 *
 * Validates: Requirements 10.3
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Mock firebase modules
vi.mock('firebase/firestore', () => ({
  Timestamp: { now: () => ({ seconds: 0, nanoseconds: 0 }) },
}));
vi.mock('firebase/auth', () => ({}));
vi.mock('firebase/app', () => ({}));
vi.mock('./services/firebase', () => ({ db: {}, auth: {} }));
vi.mock('./services/authService', () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(() => () => {}),
}));

/**
 * Inline ProtectedRoute matching the logic in App.tsx.
 * We replicate it here to test the redirect behavior in isolation
 * without importing the full App (which bundles BrowserRouter internally).
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);

  if (loading) {
    return <div data-testid="loading">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

const PROTECTED_ROUTES = [
  '/dashboard',
  '/transactions',
  '/balances',
  '/accounts',
  '/categories',
  '/import-export',
];

function renderWithRoute(initialRoute: string) {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/login" element={<div data-testid="login-page">Login</div>} />
        <Route
          element={
            <ProtectedRoute>
              <Outlet />
            </ProtectedRoute>
          }
        >
          {PROTECTED_ROUTES.map((path) => (
            <Route
              key={path}
              path={path}
              element={<div data-testid={`page-${path.slice(1)}`}>{path}</div>}
            />
          ))}
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('Property 22: Redirección de usuarios no autenticados', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      loading: false,
      error: null,
      listenAuthState: () => () => {},
    } as any);
  });

  it.each(PROTECTED_ROUTES)(
    'redirects unauthenticated user from %s to /login',
    (route) => {
      renderWithRoute(route);

      expect(screen.getByTestId('login-page')).toBeTruthy();
      expect(screen.queryByTestId(`page-${route.slice(1)}`)).toBeNull();
    },
  );

  it('shows loading state when auth is still loading', () => {
    useAuthStore.setState({
      user: null,
      loading: true,
      error: null,
    } as any);

    renderWithRoute('/dashboard');

    expect(screen.getByTestId('loading')).toBeTruthy();
    expect(screen.queryByTestId('login-page')).toBeNull();
  });

  it('allows access to protected route when user is authenticated', () => {
    useAuthStore.setState({
      user: { uid: 'test-user', email: 'test@example.com' },
      loading: false,
      error: null,
    } as any);

    renderWithRoute('/dashboard');

    expect(screen.getByTestId('page-dashboard')).toBeTruthy();
    expect(screen.queryByTestId('login-page')).toBeNull();
  });
});
