import type { GetServerSideProps } from 'next';

/**
 * Pages without data requirements still render per request so _document can
 * issue a unique CSP nonce. Keeping this page-local avoids _app.getInitialProps,
 * which opts every route out of Next.js page-level optimization.
 */
export const forceServerSideRendering: GetServerSideProps = async () => ({ props: {} });
