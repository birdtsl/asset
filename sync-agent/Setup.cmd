@echo off
cd /d "%~dp0"
echo Starting TSL Smart Asset Sync installer...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Install.ps1"
if errorlevel 1 (
  echo.
  echo Install failed. Press any key to close.
  pause >nul
)
