# Sync updates.host.json -> electron-builder publish configs
param(
    [string]$ConfigPath = (Join-Path $PSScriptRoot "..\updates.host.json")
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$config = Get-Content $ConfigPath -Raw | ConvertFrom-Json

$owner = $config.githubOwner
$repo = $config.githubRepo
$netlifyUrl = $config.netlifySiteUrl.TrimEnd("/")

if ($owner -eq "YOUR_GITHUB_USERNAME") {
    Write-Warning "Edit updates.host.json and set githubOwner to your GitHub username."
}
if ($netlifyUrl -like "*YOUR-SITE-NAME*") {
    Write-Warning "Edit updates.host.json and set netlifySiteUrl after creating your Netlify site."
}

# GitHub config
$githubYml = Join-Path $root "electron-builder.github.yml"
(Get-Content $githubYml -Raw) `
    -replace "owner: YOUR_GITHUB_USERNAME", "owner: $owner" `
    -replace "repo: olitechdesktop", "repo: $repo" |
    Set-Content $githubYml -NoNewline

# Netlify config
$netlifyYml = Join-Path $root "electron-builder.netlify.yml"
(Get-Content $netlifyYml -Raw) `
    -replace "https://YOUR-SITE-NAME.netlify.app", $netlifyUrl |
    Set-Content $netlifyYml -NoNewline

# package.json repository field (must keep trailing comma before "scripts")
$pkgPath = Join-Path $root "package.json"
$pkgRaw = Get-Content $pkgPath -Raw
$repoBlock = @"
  "repository": {
    "type": "git",
    "url": "https://github.com/$owner/$repo.git"
  },
"@
if ($pkgRaw -match '"repository"\s*:') {
    $pkgRaw = $pkgRaw -replace '(?s)"repository"\s*:\s*\{[^}]+\},?', $repoBlock
} else {
    $pkgRaw = $pkgRaw -replace '("private"\s*:\s*true,)', "`$1`n$repoBlock"
}
Set-Content $pkgPath $pkgRaw.TrimEnd() -NoNewline

try {
    Get-Content $pkgPath -Raw | ConvertFrom-Json | Out-Null
} catch {
    Write-Error "package.json is invalid JSON after sync - fix manually before continuing."
}

Write-Host "Synced update host config:" -ForegroundColor Green
Write-Host "  GitHub:  github.com/$owner/$repo"
Write-Host ('  Netlify: ' + $netlifyUrl)
