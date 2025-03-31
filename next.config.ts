/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // If your app will be in a subfolder, set the base path accordingly
  basePath: '/sites/YourSite/SiteAssets/roadmap-app',
  // Disable image optimization
  images: {
    unoptimized: true,
  },
  // Important for SharePoint navigation
  trailingSlash: true,
  eslint: {
    // Warning: This disables ESLint completely during build
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig