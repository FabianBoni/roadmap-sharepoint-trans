import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    // Determine the base path based on environment
    const basePath = process.env.NODE_ENV === 'production' 
      ? '/JSD/Digital/roadmapapp' 
      : '/JSD/QMServices/Roadmap/roadmapapp';

    return (
      <Html>
        <Head>
          {/* Fallback Tailwind CSS from CDN */}
          <link
            href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"
            rel="stylesheet"
          />
          <link rel="icon" href={`${basePath}/favicon.ico`} sizes="any" />
          {/* SharePoint specific meta tags */}
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;