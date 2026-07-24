import { randomBytes } from 'crypto';
import Document, {
  Html,
  Head,
  Main,
  NextScript,
  type DocumentContext,
  type DocumentInitialProps,
} from 'next/document';
import { DEFAULT_COLOR_MODE, getColorModeInitScript } from '@/utils/colorMode';

type RoadmapDocumentProps = DocumentInitialProps & { nonce: string };

const buildContentSecurityPolicy = (nonce: string): string => {
  const developmentScriptAllowance = process.env.NODE_ENV === 'production' ? '' : " 'unsafe-eval'";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${developmentScriptAllowance}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self' https://login.microsoftonline.com",
    ...(process.env.NODE_ENV === 'production' ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
};

class RoadmapDocument extends Document<RoadmapDocumentProps> {
  static async getInitialProps(ctx: DocumentContext): Promise<RoadmapDocumentProps> {
    const initialProps = await Document.getInitialProps(ctx);
    const nonce = randomBytes(18).toString('base64');
    ctx.res?.setHeader('Content-Security-Policy', buildContentSecurityPolicy(nonce));
    return { ...initialProps, nonce };
  }

  render() {
    const { nonce } = this.props;
    return (
      <Html lang="de" data-color-mode={DEFAULT_COLOR_MODE}>
        <Head nonce={nonce}>
          <meta charSet="utf-8" />
          <script nonce={nonce} dangerouslySetInnerHTML={{ __html: getColorModeInitScript() }} />
        </Head>
        <body>
          <Main />
          <NextScript nonce={nonce} />
        </body>
      </Html>
    );
  }
}

export default RoadmapDocument;
