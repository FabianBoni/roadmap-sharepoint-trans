import type { AppProps } from 'next/app';
import { ThemeWrapper } from '../components/ThemeWrapper';
import './globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeWrapper>
      <Component {...pageProps} />
    </ThemeWrapper>
  );
}

export default MyApp;
