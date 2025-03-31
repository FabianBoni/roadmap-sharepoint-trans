import React from 'react';
import { ThemeProvider, createTheme, initializeIcons } from '@fluentui/react';

// Initialize Fluent UI icons once
if (typeof window !== 'undefined') {
  initializeIcons();
}

// Create a complete theme with all required properties
const theme = createTheme({
  palette: {
    themePrimary: '#3498db',
    themeLighterAlt: '#f5f9fd',
    themeLighter: '#d2e6f6',
    themeLight: '#adcfee',
    themeTertiary: '#63a2db',
    themeSecondary: '#4097df',
    themeDarkAlt: '#2f88c5',
    themeDark: '#2773a6',
    themeDarker: '#1d557b',
    neutralLighterAlt: '#202020',
    neutralLighter: '#1d1d1d',
    neutralLight: '#181818',
    neutralQuaternaryAlt: '#131313',
    neutralQuaternary: '#0f0f0f',
    neutralTertiaryAlt: '#0c0c0c',
    neutralTertiary: '#c8c8c8',
    neutralSecondary: '#d0d0d0',
    neutralPrimaryAlt: '#dadada',
    neutralPrimary: '#ffffff',
    neutralDark: '#f4f4f4',
    black: '#f8f8f8',
    white: '#121212',
  },
  fonts: {
    // Explicitly define fonts to prevent undefined errors
    medium: {
      fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, "Roboto", "Helvetica Neue", sans-serif',
      fontSize: '14px',
    },
    mediumPlus: {
      fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, "Roboto", "Helvetica Neue", sans-serif',
      fontSize: '16px',
    },
    large: {
      fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, "Roboto", "Helvetica Neue", sans-serif',
      fontSize: '18px',
    },
    xLarge: {
      fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, "Roboto", "Helvetica Neue", sans-serif',
      fontSize: '22px',
    },
    xxLarge: {
      fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, "Roboto", "Helvetica Neue", sans-serif',
      fontSize: '28px',
    },
  }
});

export const ThemeWrapper: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return (
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  );
};