import { createTheme, type Theme } from '@mui/material/styles';

/**
 * Returns a MUI theme configured for the given mode.
 *
 * Primary color based on #09297A (deep navy blue).
 * - Light and dark palettes with WCAG AA contrast (≥ 4.5:1 text-on-background)
 * - Base font size 16px for mobile readability (Req 13.6)
 * - Interactive elements with 44×44px minimum touch targets (Req 13.5)
 */
export function getTheme(mode: 'light' | 'dark'): Theme {
  return createTheme({
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            primary: { main: '#09297A' },
            secondary: { main: '#5C6BC0' },
            background: { default: '#F5F6FA', paper: '#ffffff' },
            text: { primary: '#1A1A2E', secondary: '#3D3D5C' },
            error: { main: '#c62828' },
            warning: { main: '#e65100' },
            success: { main: '#2e7d32' },
          }
        : {
            primary: { main: '#7B9CFF' },
            secondary: { main: '#9FA8DA' },
            background: { default: '#0A0E1A', paper: '#111827' },
            text: { primary: '#E8EAF6', secondary: '#9FA8DA' },
            error: { main: '#ef9a9a' },
            warning: { main: '#ffb74d' },
            success: { main: '#81c784' },
          }),
    },

    typography: {
      fontSize: 16,
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
    },

    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            minHeight: 44,
            minWidth: 44,
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            minHeight: 44,
            minWidth: 44,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiInputBase-root': {
              minHeight: 44,
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          select: {
            minHeight: 44,
            display: 'flex',
            alignItems: 'center',
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            minHeight: 44,
          },
        },
      },
    },
  });
}
