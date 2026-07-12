# Build OLITECHHUB with Netlify as the update source
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Push-Location $root
try {
    & "$PSScriptRoot\sync-update-config.ps1"

    Write-Host "Building installer (Netlify update channel)..." -ForegroundColor Cyan
    npm run build
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    npx --yes electron-builder --win nsis --config electron-builder.netlify.yml
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    $config = Get-Content (Join-Path $root "updates.host.json") -Raw | ConvertFrom-Json
    Write-Host ""
    Write-Host "Build done. Next deploy to Netlify:" -ForegroundColor Green
    Write-Host "  npm run publish:netlify"
    Write-Host ""
    Write-Host "Update URL baked into installer:" -ForegroundColor Yellow
    Write-Host "  $($config.netlifySiteUrl.TrimEnd('/'))/latest.yml"
}
finally {
    Pop-Location
}
