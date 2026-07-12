# Build OLITECHHUB with GitHub Releases as the update source
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Push-Location $root
try {
    & "$PSScriptRoot\sync-update-config.ps1"

    Write-Host "Building installer (GitHub update channel)..." -ForegroundColor Cyan
    npm run build
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    npx --yes electron-builder --win nsis --config electron-builder.github.yml
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    Write-Host ""
    Write-Host "Build done. Files in release/:" -ForegroundColor Green
    Get-ChildItem (Join-Path $root "release") -File |
        Where-Object { $_.Extension -in ".yml", ".exe", ".blockmap" } |
        ForEach-Object { Write-Host "  $($_.Name)" }

    Write-Host ""
    Write-Host "Next — publish to GitHub:" -ForegroundColor Yellow
    Write-Host "  Manual:  npm run publish:github:manual"
    Write-Host "  Auto:    set GH_TOKEN=your_token && npm run publish:github:auto"
}
finally {
    Pop-Location
}
