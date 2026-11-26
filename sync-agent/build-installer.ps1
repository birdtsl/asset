#Requires -Version 5.1
<#
.SYNOPSIS
  Bundle sync agent into a Windows install zip (portable Node + launcher exe)
#>
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

Write-Host "=== Build TSL Asset Sync Installer ===" -ForegroundColor Cyan

if (-not (Test-Path (Join-Path $Root "node_modules\xlsx"))) {
  Write-Host "npm install..."
  npm install
  if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
}

Write-Host "ติดตั้ง esbuild..."
npm install --no-save esbuild
if ($LASTEXITCODE -ne 0) { throw "esbuild install failed" }

$Dist = Join-Path $Root "dist"
$Release = Join-Path $Root "release"
New-Item -ItemType Directory -Force -Path $Dist | Out-Null
New-Item -ItemType Directory -Force -Path $Release | Out-Null

Write-Host "1) Bundle JS..."
$OutJs = Join-Path $Dist "sync.cjs"
npx --yes esbuild ./sync.mjs --bundle --platform=node --target=node18 --format=cjs --outfile=$OutJs
if ($LASTEXITCODE -ne 0 -or -not (Test-Path $OutJs)) {
  throw "esbuild failed — ไม่พบ dist/sync.cjs"
}

Write-Host "2) Stage package..."
$Stage = Join-Path $Dist "package"
if (Test-Path $Stage) { Remove-Item $Stage -Recurse -Force }
$RuntimeDir = Join-Path $Stage "runtime"
$AppDir = Join-Path $Stage "app"
New-Item -ItemType Directory -Force -Path $RuntimeDir | Out-Null
New-Item -ItemType Directory -Force -Path $AppDir | Out-Null

$NodeExe = (Get-Command node -ErrorAction Stop).Source
Copy-Item $NodeExe (Join-Path $RuntimeDir "node.exe") -Force
Copy-Item $OutJs (Join-Path $AppDir "sync.cjs") -Force

Write-Host "3) Compile launcher exe..."
$LauncherSrc = @"
using System;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Windows.Forms;

public class Program {
  [STAThread]
  public static int Main(string[] args) {
    string baseDir = AppDomain.CurrentDomain.BaseDirectory;
    string node = Path.Combine(baseDir, "runtime", "node.exe");
    string script = Path.Combine(baseDir, "app", "sync.cjs");
    string config = Path.Combine(baseDir, "config.json");
    if (!File.Exists(config)) {
      MessageBox.Show(
        "ยังไม่ได้ติดตั้งหรือยังไม่มี config.json\n\nให้ดับเบิลคลิก Setup.cmd เพื่อติดตั้งก่อน\n(อย่าใช้ไฟล์นี้เป็นตัวติดตั้ง)",
        "TSL Asset Sync",
        MessageBoxButtons.OK,
        MessageBoxIcon.Information);
      return 1;
    }
    if (!File.Exists(node)) {
      MessageBox.Show("ไม่พบ runtime\\node.exe", "TSL Asset Sync", MessageBoxButtons.OK, MessageBoxIcon.Error);
      return 2;
    }
    if (!File.Exists(script)) {
      MessageBox.Show("ไม่พบ app\\sync.cjs", "TSL Asset Sync", MessageBoxButtons.OK, MessageBoxIcon.Error);
      return 2;
    }
    var arg = new StringBuilder();
    arg.Append('"').Append(script).Append('"');
    foreach (var a in args) {
      arg.Append(' ');
      if (a.IndexOf(' ') >= 0) arg.Append('"').Append(a).Append('"');
      else arg.Append(a);
    }
    var psi = new ProcessStartInfo();
    psi.FileName = node;
    psi.Arguments = arg.ToString();
    psi.WorkingDirectory = baseDir;
    psi.UseShellExecute = false;
    using (var p = Process.Start(psi)) {
      if (p == null) return 3;
      p.WaitForExit();
      return p.ExitCode;
    }
  }
}
"@

$LauncherOut = Join-Path $Stage "TSL-Asset-Sync.exe"
try {
  Add-Type -TypeDefinition $LauncherSrc `
    -ReferencedAssemblies System.Windows.Forms,System.Drawing `
    -OutputAssembly $LauncherOut `
    -OutputType WindowsApplication `
    -Language CSharp
} catch {
  Write-Host "Compile exe ไม่สำเร็จ ($($_.Exception.Message)) — ลอง ConsoleApplication..." -ForegroundColor Yellow
  try {
    Add-Type -TypeDefinition $LauncherSrc `
      -ReferencedAssemblies System.Windows.Forms,System.Drawing `
      -OutputAssembly $LauncherOut `
      -OutputType ConsoleApplication `
      -Language CSharp
  } catch {
    Write-Host "Compile exe ไม่สำเร็จ ($($_.Exception.Message)) — ใช้ .cmd แทน" -ForegroundColor Yellow
    @"
@echo off
setlocal
set APPDIR=%~dp0
"%APPDIR%runtime\node.exe" "%APPDIR%app\sync.cjs" %*
"@ | Set-Content -Path (Join-Path $Stage "TSL-Asset-Sync.cmd") -Encoding ASCII
  }
}

Copy-Item (Join-Path $Root "Install.ps1") $Stage -Force
# Setup.cmd must be ASCII + CRLF — Thai/UTF-8/LF-only breaks cmd.exe parsing
$SetupCmd = (@(
  '@echo off',
  'cd /d "%~dp0"',
  'echo Starting TSL Smart Asset Sync installer...',
  'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Install.ps1"',
  'if errorlevel 1 (',
  '  echo.',
  '  echo Install failed. Press any key to close.',
  '  pause >nul',
  ')'
) -join "`r`n") + "`r`n"
[System.IO.File]::WriteAllText(
  (Join-Path $Stage "Setup.cmd"),
  $SetupCmd,
  [System.Text.UTF8Encoding]::new($false)
)
[System.IO.File]::WriteAllText(
  (Join-Path $Root "Setup.cmd"),
  $SetupCmd,
  [System.Text.UTF8Encoding]::new($false)
)
Copy-Item (Join-Path $Root "Uninstall.ps1") $Stage -Force
Copy-Item (Join-Path $Root "config.example.json") $Stage -Force
Copy-Item (Join-Path $Root "README.md") (Join-Path $Stage "README.txt") -Force

@"
TSL Smart Asset Sync — วิธีติดตั้ง
================================

1. ดับเบิลคลิกไฟล์ Setup.cmd
   (จะมีหน้าต่างให้กรอก URL / API key / เลือกไฟล์ Excel)

2. ติดตั้งที่ %LOCALAPPDATA%\TSL-Asset-Sync
   พร้อม Task Scheduler อัตโนมัติ

หมายเหตุ: อย่าดับเบิลคลิก TSL-Asset-Sync.exe เพื่อติดตั้ง
ไฟล์นั้นเป็นตัวรัน sync หลังติดตั้งแล้วเท่านั้น

ถอนการติดตั้ง: รัน Uninstall.ps1
ไม่ต้องติดตั้ง Node.js บนเครื่อง client
"@ | Set-Content -Path (Join-Path $Stage "ติดตั้ง.txt") -Encoding UTF8

$Version = "1.0.0"
$ZipName = "TSL-Asset-Sync-$Version-Setup.zip"
$ZipPath = Join-Path $Release $ZipName
if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }

Compress-Archive -Path (Join-Path $Stage "*") -DestinationPath $ZipPath -Force

# Convenience copy of launcher if present
$Exe = Join-Path $Stage "TSL-Asset-Sync.exe"
if (Test-Path $Exe) {
  Copy-Item $Exe (Join-Path $Release "TSL-Asset-Sync.exe") -Force
}

Write-Host ""
Write-Host "สำเร็จ" -ForegroundColor Green
Write-Host "  ZIP: $ZipPath"
Get-ChildItem $Stage | Select-Object Name, Length | Format-Table -AutoSize
Write-Host "แจกจ่ายไฟล์ ZIP ให้เครื่อง client แล้วรัน Install.ps1"
