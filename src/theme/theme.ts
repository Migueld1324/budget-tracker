import { createTheme, type Theme } from '@mui/material/styles';

const FIELD_HEIGHT = 36;

export function getTheme(mode: 'light' | 'dark'): Theme {
  const iconColor = mode === 'light' ? '#3D3D5C' : '#9FA8DA';

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
      fontFamily: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'].join(','),
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: { height: FIELD_HEIGHT, minWidth: 36, textTransform: 'none' as const },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: { minHeight: 36, minWidth: 36 },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: { height: FIELD_HEIGHT },
          input: { padding: '6px 12px', height: 'auto' },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            height: FIELD_HEIGHT,
            '& .MuiSvgIcon-root': { color: iconColor },
            '& input[type="date"]::-webkit-calendar-picker-indicator': {
              filter: mode === 'dark' ? 'invert(1) brightness(0.8)' : 'none',
              opacity: 0.6,
              cursor: 'pointer',
            },
          },
          input: { padding: '6px 12px' },
          notchedOutline: {},
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: { transform: 'translate(12px, 5px) scale(1)' },
          shrink: { transform: 'translate(14px, -9px) scale(0.75)' },
          sizeSmall: { transform: 'translate(12px, 5px) scale(1)' },
        },
      },
      MuiSelect: {
        styleOverrides: {
          select: {
            height: FIELD_HEIGHT,
            minHeight: 'unset',
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
          },
          icon: { color: iconColor },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: { minHeight: 36 },
        },
      },
    },
  });
}
