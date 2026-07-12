# Build OLITECHHUB installer and list files to upload for auto-update.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Push-Location $root
try {
    Write-Host "Building OLITECHHUB release..." -ForegroundColor Cyan
    npm run release
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    $releaseDir = Join-Path $root "release"
    Write-Host ""
    Write-Host "Build complete. Upload these files for auto-update:" -ForegroundColor Green
    Get-ChildItem $releaseDir -File |
        Where-Object { $_.Extension -in ".yml", ".exe", ".blockmap" } |
        ForEach-Object { Write-Host "  $($_.Name)" }

    Write-Host ""
    Write-Host "Upload to: https://releases.olitechhub.com/desktop/" -ForegroundColor Yellow
    Write-Host "See scripts/RELEASE.txt for the full workflow." -ForegroundColor DarkGray
}
finally {
    Pop-Location
}
