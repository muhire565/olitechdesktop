# Deploy release/ folder to Netlify (uses npx — no global install needed)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$releaseDir = Join-Path $root "release"

if (-not (Test-Path (Join-Path $releaseDir "latest.yml"))) {
    Write-Error "latest.yml not found. Run first: npm run release:netlify"
}

Push-Location $root
try {
    Write-Host "Deploying release/ to Netlify..." -ForegroundColor Cyan
    Write-Host "First time? Netlify CLI will ask you to log in and link a site." -ForegroundColor DarkGray
    npx --yes netlify-cli deploy --prod --dir=release
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    $config = Get-Content (Join-Path $root "updates.host.json") -Raw | ConvertFrom-Json
    $url = $config.netlifySiteUrl.TrimEnd("/")

    Write-Host ""
    Write-Host "Deployed. Verify these URLs in your browser:" -ForegroundColor Green
    Write-Host "  $url/latest.yml"
    Write-Host "  (installer .exe link is inside latest.yml)"
}
finally {
    Pop-Location
}
