#!/bin/bash

# SharePoint Deployment Script for Next.js Static Export
# This script prepares the build for SharePoint deployment

echo "Building Next.js app for SharePoint..."
npm run build

echo "Post-processing for SharePoint..."

# Navigate to the out directory
cd out

# Create a .htaccess file for proper MIME types (if Apache is used)
cat > .htaccess << 'EOF'
# Enable MIME type detection
AddType application/javascript .js
AddType text/css .css
AddType application/json .json
AddType image/svg+xml .svg
AddType image/png .png
AddType image/jpeg .jpg .jpeg
AddType image/gif .gif
AddType image/x-icon .ico

# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/x-icon "access plus 1 year"
</IfModule>
EOF

# Create a web.config for IIS (SharePoint uses IIS)
cat > web.config << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <staticContent>
      <mimeMap fileExtension=".js" mimeType="application/javascript" />
      <mimeMap fileExtension=".css" mimeType="text/css" />
      <mimeMap fileExtension=".json" mimeType="application/json" />
      <mimeMap fileExtension=".svg" mimeType="image/svg+xml" />
    </staticContent>
    <httpCompression>
      <dynamicTypes>
        <add mimeType="application/javascript" enabled="true" />
        <add mimeType="text/css" enabled="true" />
      </dynamicTypes>
    </httpCompression>
  </system.webServer>
</configuration>
EOF

echo "SharePoint deployment files prepared!"
echo "Upload the contents of the 'out' directory to your SharePoint document library."
