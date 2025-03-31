import { JSX, useEffect } from 'react';
import { initializeIcons } from '@fluentui/react/lib/Icons';
import type { AppProps } from 'next/app';
import './globals.css';

// Define a type for the window with our custom property
interface CustomWindow extends Window {
  __fluentUIIconsInitialized?: boolean;
}

function MyApp({ Component, pageProps }: AppProps): JSX.Element {
  useEffect(() => {
    // Only initialize icons once on the client side
    if (typeof window !== 'undefined') {
      const customWindow = window as CustomWindow;
      if (!customWindow.__fluentUIIconsInitialized) {
        initializeIcons();
        customWindow.__fluentUIIconsInitialized = true;
      }
    }
  }, []);
  
  return <Component {...pageProps} />;
}

export default MyApp;