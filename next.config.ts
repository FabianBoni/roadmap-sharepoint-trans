/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',          // For static export to SharePoint
  images: {
    unoptimized: true,       // Required for static export
  },
  trailingSlash: true,       // Makes SharePoint paths work better
  // Temporarily remove basePath and assetPrefix to troubleshoot
  // basePath: process.env.NODE_ENV === 'production' 
  //   ? '/JSD/Digital/roadmapapp' 
  //   : '/JSD/QMServices/Roadmap/roadmapapp',
  // assetPrefix: process.env.NODE_ENV === 'production' 
  //   ? '/JSD/Digital/roadmapapp' 
  //   : '/JSD/QMServices/Roadmap/roadmapapp',
}

module.exports = nextConfig