# Auto-publish to GitHub Releases (requires GH_TOKEN environment variable)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

if (-not $env:GH_TOKEN) {
    Write-Error @"
GH_TOKEN is not set.

Create a token at: https://github.com/settings/tokens
  - Classic token with 'repo' scope, OR
  - Fine-grained token with Contents: Read and write

Then in PowerShell:
  `$env:GH_TOKEN = "ghp_your_token_here"
  npm run publish:github:auto
"@
}

Push-Location $root
try {
    & "$PSScriptRoot\sync-update-config.ps1"
    npm run build
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    npx --yes electron-builder --win nsis --config electron-builder.github.yml --publish always
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    Write-Host "Published to GitHub Releases." -ForegroundColor Green
}
finally {
    Pop-Location
}
