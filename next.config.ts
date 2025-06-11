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
    : '/JSD/QMServices/Roadmap/roadmapapp', // Development Asset URLs
}

module.exports = nextConfig