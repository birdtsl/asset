#Requires -Version 5.1
$ErrorActionPreference = "Stop"
$InstallDir = Join-Path $env:LOCALAPPDATA "TSL-Asset-Sync"
$TaskName = "TSL-SmartAsset-Sync"

Write-Host "=== TSL Smart Asset Sync — Uninstall ===" -ForegroundColor Cyan

Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
Write-Host "ลบ Task Scheduler: $TaskName"

if (Test-Path $InstallDir) {
  Remove-Item $InstallDir -Recurse -Force
  Write-Host "ลบโฟลเดอร์: $InstallDir"
} else {
  Write-Host "ไม่พบโฟลเดอร์ติดตั้ง"
}

Write-Host "ถอนการติดตั้งเสร็จแล้ว" -ForegroundColor Green
