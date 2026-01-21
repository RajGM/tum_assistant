'use client';

import { ReactNode, useMemo, createContext, useContext, useState, useCallback } from 'react';
import { ThemeProvider as MUIThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { alpha } from '@mui/material/styles';

// Minimals-inspired color palette
const GREY = {
  0: '#FFFFFF',
  100: '#F9FAFB',
  200: '#F4F6F8',
  300: '#DFE3E8',
  400: '#C4CDD5',
  500: '#919EAB',
  600: '#637381',
  700: '#454F5B',
  800: '#1C252E',
  900: '#141A21',
};

const PRIMARY = {
  lighter: '#C8FAD6',
  light: '#5BE49B',
  main: '#00A76F',
  dark: '#007867',
  darker: '#004B50',
  contrastText: '#FFFFFF',
};

const SECONDARY = {
  lighter: '#EFD6FF',
  light: '#C684FF',
  main: '#8E33FF',
  dark: '#5119B7',
  darker: '#27097A',
  contrastText: '#FFFFFF',
};

const INFO = {
  lighter: '#CAFDF5',
  light: '#61F3F3',
  main: '#00B8D9',
  dark: '#006C9C',
  darker: '#003768',
  contrastText: '#FFFFFF',
};

const SUCCESS = {
  lighter: '#D3FCD2',
  light: '#77ED8B',
  main: '#22C55E',
  dark: '#118D57',
  darker: '#065E49',
  contrastText: '#ffffff',
};

const WARNING = {
  lighter: '#FFF5CC',
  light: '#FFD666',
  main: '#FFAB00',
  dark: '#B76E00',
  darker: '#7A4100',
  contrastText: GREY[800],
};

const ERROR = {
  lighter: '#FFE9D5',
  light: '#FFAC82',
  main: '#FF5630',
  dark: '#B71D18',
  darker: '#7A0916',
  contrastText: '#FFFFFF',
};

// Color mode context
interface ColorModeContextType {
  mode: 'light' | 'dark';
  toggleColorMode: () => void;
}

const ColorModeContext = createContext<ColorModeContextType>({
  mode: 'light',
  toggleColorMode: () => {},
});

export const useColorMode = () => useContext(ColorModeContext);

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'light' | 'dark'>('dark');

  const toggleColorMode = useCallback(() => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  }, []);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: PRIMARY,
          secondary: SECONDARY,
          info: INFO,
          success: SUCCESS,
          warning: WARNING,
          error: ERROR,
          grey: GREY,
          text: {
            primary: mode === 'light' ? GREY[800] : GREY[0],
            secondary: mode === 'light' ? GREY[600] : GREY[500],
            disabled: mode === 'light' ? GREY[500] : GREY[600],
          },
          background: {
            paper: mode === 'light' ? '#FFFFFF' : GREY[800],
            default: mode === 'light' ? GREY[100] : GREY[900],
          },
          action: {
            hover: alpha(GREY[500], 0.08),
            selected: alpha(GREY[500], 0.16),
            disabled: alpha(GREY[500], 0.8),
            disabledBackground: alpha(GREY[500], 0.24),
            focus: alpha(GREY[500], 0.24),
          },
          divider: alpha(GREY[500], 0.2),
        },
        typography: {
          fontFamily: '"Public Sans", sans-serif',
          h1: {
            fontWeight: 700,
            lineHeight: 1.25,
            fontSize: '2.5rem',
          },
          h2: {
            fontWeight: 700,
            lineHeight: 1.33,
            fontSize: '2rem',
          },
          h3: {
            fontWeight: 700,
            lineHeight: 1.5,
            fontSize: '1.5rem',
          },
          h4: {
            fontWeight: 700,
            lineHeight: 1.5,
            fontSize: '1.25rem',
          },
          h5: {
            fontWeight: 600,
            lineHeight: 1.5,
            fontSize: '1.125rem',
          },
          h6: {
            fontWeight: 600,
            lineHeight: 1.5,
            fontSize: '1rem',
          },
          subtitle1: {
            fontWeight: 600,
            lineHeight: 1.5,
            fontSize: '1rem',
          },
          subtitle2: {
            fontWeight: 600,
            lineHeight: 1.57,
            fontSize: '0.875rem',
          },
          body1: {
            lineHeight: 1.5,
            fontSize: '1rem',
          },
          body2: {
            lineHeight: 1.57,
            fontSize: '0.875rem',
          },
          caption: {
            lineHeight: 1.5,
            fontSize: '0.75rem',
          },
          overline: {
            fontWeight: 700,
            lineHeight: 1.5,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
          },
          button: {
            fontWeight: 700,
            lineHeight: 1.71,
            fontSize: '0.875rem',
            textTransform: 'unset',
          },
        },
        shape: {
          borderRadius: 8,
        },
        shadows: [
          'none',
          `0 1px 2px 0 ${alpha(GREY[500], 0.16)}`,
          `0 1px 2px 0 ${alpha(GREY[500], 0.16)}`,
          `0 1px 2px 0 ${alpha(GREY[500], 0.16)}`,
          `0 4px 8px 0 ${alpha(GREY[500], 0.16)}`,
          `0 8px 16px 0 ${alpha(GREY[500], 0.16)}`,
          `0 12px 24px -4px ${alpha(GREY[500], 0.16)}`,
          `0 16px 32px -4px ${alpha(GREY[500], 0.16)}`,
          `0 20px 40px -4px ${alpha(GREY[500], 0.16)}`,
          `0 24px 48px 0 ${alpha(GREY[500], 0.16)}`,
          `0 24px 48px 0 ${alpha(GREY[500], 0.16)}`,
          `0 24px 48px 0 ${alpha(GREY[500], 0.16)}`,
          `0 24px 48px 0 ${alpha(GREY[500], 0.16)}`,
          `0 24px 48px 0 ${alpha(GREY[500], 0.16)}`,
          `0 24px 48px 0 ${alpha(GREY[500], 0.16)}`,
          `0 24px 48px 0 ${alpha(GREY[500], 0.16)}`,
          `0 24px 48px 0 ${alpha(GREY[500], 0.16)}`,
          `0 24px 48px 0 ${alpha(GREY[500], 0.16)}`,
          `0 24px 48px 0 ${alpha(GREY[500], 0.16)}`,
          `0 24px 48px 0 ${alpha(GREY[500], 0.16)}`,
          `0 24px 48px 0 ${alpha(GREY[500], 0.16)}`,
          `0 24px 48px 0 ${alpha(GREY[500], 0.16)}`,
          `0 24px 48px 0 ${alpha(GREY[500], 0.16)}`,
          `0 24px 48px 0 ${alpha(GREY[500], 0.16)}`,
          `-24px 24px 72px -8px ${alpha(GREY[500], 0.24)}`,
        ],
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              '*': {
                boxSizing: 'border-box',
              },
              html: {
                margin: 0,
                padding: 0,
                width: '100%',
                height: '100%',
                WebkitOverflowScrolling: 'touch',
              },
              body: {
                margin: 0,
                padding: 0,
                width: '100%',
                height: '100%',
              },
              '#__next': {
                width: '100%',
                height: '100%',
              },
              '::-webkit-scrollbar': {
                width: '8px',
                height: '8px',
              },
              '::-webkit-scrollbar-thumb': {
                backgroundColor: alpha(GREY[600], 0.48),
                borderRadius: '4px',
              },
              '::-webkit-scrollbar-track': {
                backgroundColor: 'transparent',
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                boxShadow: `0 0 2px 0 ${alpha(GREY[500], 0.2)}, 0 12px 24px -4px ${alpha(GREY[500], 0.12)}`,
                borderRadius: 16,
                position: 'relative',
                zIndex: 0,
              },
            },
          },
          MuiCardHeader: {
            styleOverrides: {
              root: {
                padding: '24px 24px 0',
              },
            },
          },
          MuiCardContent: {
            styleOverrides: {
              root: {
                padding: 24,
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                textTransform: 'none',
                fontWeight: 700,
              },
              sizeLarge: {
                height: 48,
              },
              containedPrimary: {
                boxShadow: `0 8px 16px 0 ${alpha(PRIMARY.main, 0.24)}`,
                '&:hover': {
                  boxShadow: 'none',
                },
              },
              containedSecondary: {
                boxShadow: `0 8px 16px 0 ${alpha(SECONDARY.main, 0.24)}`,
                '&:hover': {
                  boxShadow: 'none',
                },
              },
              containedInherit: {
                boxShadow: `0 8px 16px 0 ${alpha(GREY[500], 0.24)}`,
                '&:hover': {
                  boxShadow: 'none',
                },
              },
            },
          },
          MuiIconButton: {
            styleOverrides: {
              root: {
                '&:hover': {
                  backgroundColor: alpha(GREY[500], 0.08),
                },
              },
            },
          },
          MuiOutlinedInput: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha(GREY[500], 0.2),
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: GREY[500],
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderWidth: 1,
                },
              },
            },
          },
          MuiInputBase: {
            styleOverrides: {
              root: {
                '&.Mui-disabled': {
                  '& svg': {
                    color: GREY[500],
                  },
                },
              },
              input: {
                '&::placeholder': {
                  opacity: 1,
                  color: GREY[500],
                },
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                fontWeight: 500,
              },
            },
          },
          MuiAvatar: {
            styleOverrides: {
              root: {
                fontWeight: 600,
              },
              colorDefault: {
                color: GREY[0],
                backgroundColor: GREY[500],
              },
            },
          },
          MuiTooltip: {
            styleOverrides: {
              tooltip: {
                backgroundColor: GREY[800],
                borderRadius: 6,
              },
              arrow: {
                color: GREY[800],
              },
            },
          },
          MuiLink: {
            styleOverrides: {
              root: {
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              },
            },
          },
        },
      }),
    [mode]
  );

  const contextValue = useMemo(
    () => ({ mode, toggleColorMode }),
    [mode, toggleColorMode]
  );

  return (
    <ColorModeContext.Provider value={contextValue}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ColorModeContext.Provider>
  );
}