# SharePoint Deployment Script for Next.js Static Export
# This script prepares the build for SharePoint deployment

Write-Host "Building Next.js app for SharePoint..." -ForegroundColor Green
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Post-processing for SharePoint..." -ForegroundColor Green

# Navigate to the out directory
Set-Location out

# Create a web.config for IIS (SharePoint uses IIS)
$webConfig = @"
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <staticContent>
      <remove fileExtension=".js" />
      <remove fileExtension=".css" />
      <remove fileExtension=".json" />
      <remove fileExtension=".svg" />
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
    <defaultDocument>
      <files>
        <clear />
        <add value="index.html" />
      </files>
    </defaultDocument>
  </system.webServer>
</configuration>
"@

$webConfig | Out-File -FilePath "web.config" -Encoding UTF8

Write-Host "SharePoint deployment files prepared!" -ForegroundColor Green
Write-Host "Files are ready in the 'out' directory." -ForegroundColor Yellow
Write-Host "Upload the contents of the 'out' directory to your SharePoint document library." -ForegroundColor Yellow

# Go back to the root directory
Set-Location ..
