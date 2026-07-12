# Upload release/ files to a new GitHub Release (manual — no gh CLI required)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$config = Get-Content (Join-Path $root "updates.host.json") -Raw | ConvertFrom-Json
$pkg = Get-Content (Join-Path $root "package.json") -Raw | ConvertFrom-Json

$owner = $config.githubOwner
$repo = $config.githubRepo
$version = $pkg.version
$tag = "v$version"
$releaseDir = Join-Path $root "release"

if ($owner -eq "YOUR_GITHUB_USERNAME") {
    Write-Error "Edit updates.host.json first — set githubOwner and githubRepo."
}

$files = Get-ChildItem $releaseDir -File |
    Where-Object { $_.Extension -in ".yml", ".exe", ".blockmap" }

if (-not $files) {
    Write-Error "No release files found. Run: npm run release:github"
}

$repoUrl = "https://github.com/$owner/$repo"
$newReleaseUrl = "$repoUrl/releases/new?tag=$tag&title=OLITECHHUB%20$tag"

Write-Host ""
Write-Host "=== GitHub Release upload (manual) ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Open this URL in your browser:" -ForegroundColor Yellow
Write-Host "   $newReleaseUrl"
Write-Host ""
Write-Host "2. Set tag to: $tag" -ForegroundColor Yellow
Write-Host "   Set title to: OLITECHHUB $tag"
Write-Host ""
Write-Host "3. Drag these files into the release assets:" -ForegroundColor Yellow
foreach ($f in $files) {
    Write-Host "   $($f.FullName)"
}
Write-Host ""
Write-Host "4. Click Publish release" -ForegroundColor Yellow
Write-Host ""
Write-Host "5. Installed apps will detect the update automatically." -ForegroundColor Green
Write-Host ""

Start-Process $newReleaseUrl
