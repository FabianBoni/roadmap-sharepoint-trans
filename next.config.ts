/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',          // For static export to SharePoint
  images: {
    unoptimized: true,       // Required for static export
  },
  trailingSlash: true,       // Makes SharePoint paths work better
  basePath: process.env.NEXT_PUBLIC_DEPLOYMENT_ENV === 'production' 
    ? '/JSD/Digital/roadmapapp'           // Production URL
    : '/JSD/QMServices/Roadmap/roadmapapp', // Development URL
  assetPrefix: process.env.NEXT_PUBLIC_DEPLOYMENT_ENV === 'production' 
    ? '/JSD/Digital/roadmapapp'           // Production Asset URLs
    : '/JSD/QMServices/Roadmap/roadmapapp', // Development Asset URLs  // For static export, we need to pre-generate all possible project pages
  exportPathMap: async function (
    defaultPathMap: any,
    { dev, dir, outDir, distDir, buildId }: any
  ) {
    const pathMap = { ...defaultPathMap };
    
    // Remove admin dynamic routes but keep project routes for fallback behavior
    Object.keys(pathMap).forEach((path) => {
      if (path.includes('[') && path.includes(']') && path.includes('/admin/')) {
        delete pathMap[path];
      }
    });
    
    return pathMap;
  },
}

module.exports = nextConfig