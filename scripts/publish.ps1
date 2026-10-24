# Publish this bundle to a GitHub repository.
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\scripts\publish.ps1 `
#     -RepoUrl "https://github.com/<you>/dsh-conversation-cleaner.git" `
#     -Name "Your Name" -Email "you@example.com"
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$RepoUrl,
  [string]$Name,
  [string]$Email,
  [string]$Branch = 'main',
  [string]$Message = 'release: v1.1.0 - conversation manager (no auto-continue)'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Test-Path (Join-Path $root '.git'))) {
  throw "Not a git repository: $root"
}
if ($RepoUrl -notmatch '^(https://|git@)') {
  throw "RepoUrl must start with https:// or git@ (got: $RepoUrl)"
}

if (-not $Name) { $Name = Read-Host 'git user.name' }
if (-not $Email) { $Email = Read-Host 'git user.email' }
git config user.name $Name
git config user.email $Email

# Refuse to publish obvious secrets or dependencies.
$tracked = git ls-files
$suspicious = $tracked | Where-Object { $_ -match 'node_modules|\.env($|\.)|\.pem$|\.log$' }
if ($suspicious) {
  throw "Refusing to publish suspicious files: $($suspicious -join ', ')"
}

# Refuse very large files by accident.
$large = Get-ChildItem -File -Recurse | Where-Object {
  $_.FullName -notmatch '\\\.git\\' -and $_.Length -gt 10MB
}
if ($large) {
  throw "Refusing to publish files over 10 MB: $($large.FullName -join ', ')"
}

git add -A
$pending = git status --porcelain
if ($pending) {
  git commit -m $Message
} else {
  Write-Host 'Nothing to commit.'
}

git rev-parse --verify HEAD | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw 'Commit failed; no HEAD to push.'
}

$remotes = @(git remote)
if ($remotes -contains 'origin') {
  git remote set-url origin $RepoUrl
} else {
  git remote add origin $RepoUrl
}

git branch -M $Branch
git push -u origin $Branch

Write-Host ''
Write-Host "Pushed to $RepoUrl (branch: $Branch)"
Write-Host 'Next: check GitHub Actions, add description/topics, then tag a release.'
