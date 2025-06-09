/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',          // For static export to SharePoint
  images: {
    unoptimized: true,       // Required for static export
  },
  trailingSlash: true,       // Makes SharePoint paths work better
  basePath: process.env.NODE_ENV === 'production' 
    ? '/JSD/Digital/roadmapapp' // Adjusted to your SharePoint path
    : '',
}

module.exports = nextConfig