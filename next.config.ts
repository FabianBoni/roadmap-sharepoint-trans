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
    : '/JSD/QMServices/Roadmap/roadmapapp', // Development Asset URLs  // Exclude dynamic routes from static generation
  exportPathMap: async function (
    defaultPathMap: any,
    { dev, dir, outDir, distDir, buildId }: any
  ) {
    // Remove dynamic routes from the path map for static export
    const pathMap = { ...defaultPathMap };
    
    // Remove any dynamic routes that would cause build issues
    Object.keys(pathMap).forEach((path) => {
      if (path.includes('[') && path.includes(']')) {
        delete pathMap[path];
      }
    });
    
    return pathMap;
  },
}

module.exports = nextConfig