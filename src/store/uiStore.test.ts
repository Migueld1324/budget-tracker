import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useUIStore } from './uiStore';

// Feature: budget-tracker, Property 24: Round-trip de persistencia de tema
// **Validates: Requirements 14.3, 14.4**

describe('Property 24: Round-trip de persistencia de tema', () => {
  beforeEach(() => {
    // Reset store state
    useUIStore.setState({ theme: 'light' });
    // Clear localStorage
    localStorage.clear();
    // Reset matchMedia mock
    vi.restoreAllMocks();
  });

  function mockMatchMedia(prefersDark: boolean) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: prefersDark && query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  }

  it('toggleTheme saves new theme to localStorage', () => {
    // Start at 'light'
    useUIStore.getState().toggleTheme();
    expect(localStorage.getItem('theme')).toBe('dark');

    useUIStore.getState().toggleTheme();
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('loadThemePreference reads theme from localStorage', () => {
    localStorage.setItem('theme', 'dark');
    mockMatchMedia(false);

    useUIStore.getState().loadThemePreference();
    expect(useUIStore.getState().theme).toBe('dark');

    localStorage.setItem('theme', 'light');
    useUIStore.getState().loadThemePreference();
    expect(useUIStore.getState().theme).toBe('light');
  });

  it('round-trip: toggle → load → theme matches', () => {
    mockMatchMedia(false);

    // Toggle to dark
    useUIStore.getState().toggleTheme();
    const themeAfterToggle = useUIStore.getState().theme;
    expect(themeAfterToggle).toBe('dark');

    // Reset store state (simulate app reload)
    useUIStore.setState({ theme: 'light' });

    // Load from localStorage
    useUIStore.getState().loadThemePreference();
    expect(useUIStore.getState().theme).toBe(themeAfterToggle);
  });

  it('round-trip: toggle twice → load → theme matches', () => {
    mockMatchMedia(false);

    // Toggle light → dark → light
    useUIStore.getState().toggleTheme();
    useUIStore.getState().toggleTheme();
    const themeAfterToggles = useUIStore.getState().theme;
    expect(themeAfterToggles).toBe('light');

    // Simulate reload
    useUIStore.setState({ theme: 'dark' });

    useUIStore.getState().loadThemePreference();
    expect(useUIStore.getState().theme).toBe(themeAfterToggles);
  });

  it('falls back to system preference when no stored theme', () => {
    mockMatchMedia(true);

    useUIStore.getState().loadThemePreference();
    expect(useUIStore.getState().theme).toBe('dark');
  });

  it('falls back to light when system prefers light and no stored theme', () => {
    mockMatchMedia(false);

    useUIStore.getState().loadThemePreference();
    expect(useUIStore.getState().theme).toBe('light');
  });

  it('ignores invalid localStorage values and falls back to system preference', () => {
    localStorage.setItem('theme', 'invalid-value');
    mockMatchMedia(true);

    useUIStore.getState().loadThemePreference();
    expect(useUIStore.getState().theme).toBe('dark');
  });
});
