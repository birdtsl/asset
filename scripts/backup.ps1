# TSL Smart Asset — MariaDB + storage backup
# Usage: powershell -ExecutionPolicy Bypass -File scripts/backup.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Load-DotEnv {
  $envFile = Join-Path $Root ".env"
  if (-not (Test-Path $envFile)) { throw ".env not found" }
  Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
    $parts = $_.Split('=', 2)
    if ($parts.Length -eq 2) {
      $key = $parts[0].Trim()
      $val = $parts[1].Trim().Trim('"')
      [Environment]::SetEnvironmentVariable($key, $val, "Process")
    }
  }
}

Load-DotEnv

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupRoot = Join-Path $Root "storage\backups"
New-Item -ItemType Directory -Force -Path $backupRoot | Out-Null
$outDir = Join-Path $backupRoot $stamp
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$url = [Uri]$env:DATABASE_URL
$db = $url.AbsolutePath.TrimStart('/')
$user = [Uri]::UnescapeDataString($url.UserInfo.Split(':')[0])
$pass = [Uri]::UnescapeDataString($url.UserInfo.Split(':')[1])
$hostName = $url.Host
$port = if ($url.Port -gt 0) { $url.Port } else { 3306 }

$sqlFile = Join-Path $outDir "tsl_asset.sql"
$mysqldump = Get-Command mysqldump -ErrorAction SilentlyContinue

if (-not $mysqldump) {
  Write-Warning "mysqldump not found in PATH — skipping SQL dump"
} else {
  $env:MYSQL_PWD = $pass
  & mysqldump `
    --host=$hostName `
    --port=$port `
    --user=$user `
    --single-transaction `
    --routines `
    --triggers `
    --default-character-set=utf8mb4 `
    $db | Set-Content -Path $sqlFile -Encoding UTF8
  Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
  Write-Host "SQL backup: $sqlFile"
}

$storageSrc = Join-Path $Root ($env:STORAGE_ROOT -replace '^\./', '' -replace '^\.\\', '')
if (-not $storageSrc) { $storageSrc = Join-Path $Root "storage" }
$storageDest = Join-Path $outDir "storage"
if (Test-Path $storageSrc) {
  Copy-Item -Path $storageSrc -Destination $storageDest -Recurse -Force -Exclude "backups"
  Write-Host "Storage copied: $storageDest"
}

$meta = @{
  createdAt = (Get-Date).ToString("o")
  database = $db
  host = $hostName
  app = "tsl-smart-asset"
} | ConvertTo-Json
Set-Content -Path (Join-Path $outDir "manifest.json") -Value $meta -Encoding UTF8

Write-Host "Backup complete: $outDir"
Write-Host "NOTE: Never drop the live database. Restore only into a staging DB first."
