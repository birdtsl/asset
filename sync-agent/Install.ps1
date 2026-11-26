#Requires -Version 5.1
<#
.SYNOPSIS
  Install TSL Asset Sync Agent — GUI prompts (works when launched from Explorer)
#>
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Windows.Forms | Out-Null
Add-Type -AssemblyName System.Drawing | Out-Null
[System.Windows.Forms.Application]::EnableVisualStyles()

function Show-Error([string]$Message) {
  [System.Windows.Forms.MessageBox]::Show(
    $Message,
    "TSL Asset Sync — ข้อผิดพลาด",
    [System.Windows.Forms.MessageBoxButtons]::OK,
    [System.Windows.Forms.MessageBoxIcon]::Error
  ) | Out-Null
}

function Show-Info([string]$Message) {
  [System.Windows.Forms.MessageBox]::Show(
    $Message,
    "TSL Asset Sync",
    [System.Windows.Forms.MessageBoxButtons]::OK,
    [System.Windows.Forms.MessageBoxIcon]::Information
  ) | Out-Null
}

function Select-ExcelFile([string]$Title) {
  $dlg = New-Object System.Windows.Forms.OpenFileDialog
  $dlg.Title = $Title
  $dlg.Filter = "Excel (*.xlsm;*.xlsx;*.xls)|*.xlsm;*.xlsx;*.xls|All files (*.*)|*.*"
  $dlg.Multiselect = $false
  if ($dlg.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
    return $dlg.FileName
  }
  return ""
}

function Read-InstallDefaults([string]$RootDir) {
  $path = Join-Path $RootDir "install-defaults.json"
  if (-not (Test-Path $path)) { return $null }
  try {
    return Get-Content -LiteralPath $path -Raw -Encoding UTF8 | ConvertFrom-Json
  } catch {
    return $null
  }
}

function Show-InstallForm([object]$Defaults) {
  $form = New-Object System.Windows.Forms.Form
  $form.Text = "ติดตั้ง TSL Smart Asset Sync"
  $form.Size = New-Object System.Drawing.Size(640, 490)
  $form.StartPosition = "CenterScreen"
  $form.FormBorderStyle = "FixedDialog"
  $form.MaximizeBox = $false
  $form.MinimizeBox = $false
  $form.TopMost = $true

  $defaultServer = if ($Defaults -and $Defaults.serverUrl) { [string]$Defaults.serverUrl } else { "http://192.168.1.252:3000" }
  $defaultKey = if ($Defaults -and $Defaults.apiKey) { [string]$Defaults.apiKey } else { "" }
  $defaultDevice = if ($Defaults -and $Defaults.deviceId) { [string]$Defaults.deviceId } else { $env:COMPUTERNAME }
  $defaultInterval = if ($Defaults -and $Defaults.intervalMinutes) { [string]$Defaults.intervalMinutes } else { "15" }

  $y = 16
  if ($Defaults -and $Defaults.apiKey) {
    $hint = New-Object System.Windows.Forms.Label
    $hint.Text = "ตรวจพบ install-defaults.json — กรอก URL และ API key ให้แล้ว (แก้ได้)"
    $hint.ForeColor = [System.Drawing.Color]::DarkGreen
    $hint.Location = New-Object System.Drawing.Point(20, $y)
    $hint.AutoSize = $true
    $form.Controls.Add($hint) | Out-Null
    $y += 28
  }

  function Add-Label([string]$text, [int]$top) {
    $l = New-Object System.Windows.Forms.Label
    $l.Text = $text
    $l.Location = New-Object System.Drawing.Point(20, $top)
    $l.AutoSize = $true
    $form.Controls.Add($l) | Out-Null
  }
  function Add-TextBox([string]$default, [int]$top, [bool]$password = $false) {
    $t = New-Object System.Windows.Forms.TextBox
    $t.Location = New-Object System.Drawing.Point(20, $top)
    $t.Size = New-Object System.Drawing.Size(580, 28)
    $t.Text = $default
    if ($password) { $t.UseSystemPasswordChar = $true }
    $form.Controls.Add($t) | Out-Null
    return $t
  }

  Add-Label "URL เซิร์ฟเวอร์ (เช่น http://192.168.1.252:3000)" $y
  $y += 22
  $tbServer = Add-TextBox $defaultServer $y
  $tbServer.Name = "tbServer"
  $y += 40

  Add-Label "SYNC_AGENT_API_KEY" $y
  $y += 22
  $tbKey = Add-TextBox $defaultKey $y $true
  $tbKey.Name = "tbKey"
  $y += 40

  Add-Label "ชื่อเครื่อง / deviceId" $y
  $y += 22
  $tbDevice = Add-TextBox $defaultDevice $y
  $y += 40

  Add-Label "ไฟล์ Excel ครุภัณฑ์ปกติ (.xlsm)" $y
  $y += 22
  $tbNormal = Add-TextBox "" $y
  $tbNormal.Name = "tbNormal"
  $tbNormal.Size = New-Object System.Drawing.Size(480, 28)
  $btnNormal = New-Object System.Windows.Forms.Button
  $btnNormal.Text = "เลือก..."
  $btnNormal.Location = New-Object System.Drawing.Point(510, ($y - 2))
  $btnNormal.Size = New-Object System.Drawing.Size(90, 28)
  $btnNormal.Add_Click({
    $p = Select-ExcelFile "เลือกไฟล์ครุภัณฑ์ปกติ"
    if ($p) { $this.FindForm().Controls["tbNormal"].Text = $p }
  })
  $form.Controls.Add($btnNormal) | Out-Null
  $y += 40

  Add-Label "ไฟล์ Excel ต่ำกว่าเกณฑ์ (.xlsm) — ว่างได้" $y
  $y += 22
  $tbLow = Add-TextBox "" $y
  $tbLow.Name = "tbLow"
  $tbLow.Size = New-Object System.Drawing.Size(480, 28)
  $btnLow = New-Object System.Windows.Forms.Button
  $btnLow.Text = "เลือก..."
  $btnLow.Location = New-Object System.Drawing.Point(510, ($y - 2))
  $btnLow.Size = New-Object System.Drawing.Size(90, 28)
  $btnLow.Add_Click({
    $p = Select-ExcelFile "เลือกไฟล์ครุภัณฑ์ต่ำกว่าเกณฑ์"
    if ($p) { $this.FindForm().Controls["tbLow"].Text = $p }
  })
  $form.Controls.Add($btnLow) | Out-Null
  $y += 40

  Add-Label "รอบ sync ทุกกี่นาที (ขั้นต่ำ 5)" $y
  $y += 22
  $tbInterval = Add-TextBox $defaultInterval $y
  $tbInterval.Size = New-Object System.Drawing.Size(80, 28)
  $y += 45

  $btnTest = New-Object System.Windows.Forms.Button
  $btnTest.Text = "ทดสอบการเชื่อมต่อ"
  $btnTest.Location = New-Object System.Drawing.Point(20, $y)
  $btnTest.Size = New-Object System.Drawing.Size(160, 34)
  $btnTest.Add_Click({
    $f = $this.FindForm()
    $server = ($f.Controls["tbServer"].Text).Trim().TrimEnd("/")
    $key = ($f.Controls["tbKey"].Text).Trim()
    if ([string]::IsNullOrWhiteSpace($server) -or [string]::IsNullOrWhiteSpace($key)) {
      [System.Windows.Forms.MessageBox]::Show(
        "กรอก URL เซิร์ฟเวอร์ และ API key ก่อน",
        "ทดสอบการเชื่อมต่อ",
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Warning
      ) | Out-Null
      return
    }
    try {
      $uri = "$server/api/sync/assets"
      Invoke-RestMethod -Uri $uri -Headers @{ "X-Sync-Key" = $key } -Method Get -TimeoutSec 20 | Out-Null
      [System.Windows.Forms.MessageBox]::Show(
        "เชื่อมต่อสำเร็จ`n$uri",
        "ทดสอบการเชื่อมต่อ",
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Information
      ) | Out-Null
    } catch {
      [System.Windows.Forms.MessageBox]::Show(
        "เชื่อมต่อไม่สำเร็จ`n$($_.Exception.Message)",
        "ทดสอบการเชื่อมต่อ",
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Error
      ) | Out-Null
    }
  })
  $form.Controls.Add($btnTest) | Out-Null

  $btnOk = New-Object System.Windows.Forms.Button
  $btnOk.Text = "ติดตั้ง"
  $btnOk.Location = New-Object System.Drawing.Point(390, $y)
  $btnOk.Size = New-Object System.Drawing.Size(110, 34)
  $btnOk.DialogResult = [System.Windows.Forms.DialogResult]::OK
  $form.AcceptButton = $btnOk
  $form.Controls.Add($btnOk) | Out-Null

  $btnCancel = New-Object System.Windows.Forms.Button
  $btnCancel.Text = "ยกเลิก"
  $btnCancel.Location = New-Object System.Drawing.Point(510, $y)
  $btnCancel.Size = New-Object System.Drawing.Size(90, 34)
  $btnCancel.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
  $form.CancelButton = $btnCancel
  $form.Controls.Add($btnCancel) | Out-Null

  $result = $form.ShowDialog()
  if ($result -ne [System.Windows.Forms.DialogResult]::OK) {
    return $null
  }

  return [pscustomobject]@{
    ServerUrl  = $tbServer.Text.Trim()
    ApiKey     = $tbKey.Text.Trim()
    DeviceId   = $tbDevice.Text.Trim()
    NormalPath = $tbNormal.Text.Trim().Trim('"')
    LowPath    = $tbLow.Text.Trim().Trim('"')
    Interval   = $tbInterval.Text.Trim()
  }
}

try {
  $Root = Split-Path -Parent $MyInvocation.MyCommand.Path
  if (-not $Root) { $Root = Get-Location | Select-Object -ExpandProperty Path }

  $InstallDir = Join-Path $env:LOCALAPPDATA "TSL-Asset-Sync"
  $TaskName = "TSL-SmartAsset-Sync"

  $ExeSrc = Join-Path $Root "TSL-Asset-Sync.exe"
  $CmdSrc = Join-Path $Root "TSL-Asset-Sync.cmd"
  $HasExe = Test-Path $ExeSrc
  $HasCmd = Test-Path $CmdSrc
  $HasRuntime = Test-Path (Join-Path $Root "runtime\node.exe")
  $HasApp = Test-Path (Join-Path $Root "app\sync.cjs")
  $HasBundle = $HasRuntime -and $HasApp

  if (-not $HasExe -and -not $HasCmd -and -not $HasBundle) {
    $NodeCmd = Get-Command node -ErrorAction SilentlyContinue
    if (-not $NodeCmd) {
      Show-Error "ไม่พบแพ็กเกจติดตั้ง (runtime/app หรือ TSL-Asset-Sync.exe)`nกรุณาแตกไฟล์ ZIP ให้ครบแล้วรัน Setup.cmd ใหม่"
      exit 1
    }
  }

  $defaults = Read-InstallDefaults $Root
  $input = Show-InstallForm $defaults
  if (-not $input) {
    Show-Info "ยกเลิกการติดตั้ง"
    exit 0
  }

  if ([string]::IsNullOrWhiteSpace($input.ServerUrl)) {
    Show-Error "ต้องระบุ URL เซิร์ฟเวอร์"
    exit 1
  }
  if ([string]::IsNullOrWhiteSpace($input.ApiKey)) {
    Show-Error "ต้องระบุ API key"
    exit 1
  }
  if ([string]::IsNullOrWhiteSpace($input.DeviceId)) {
    $input.DeviceId = $env:COMPUTERNAME
  }
  if ([string]::IsNullOrWhiteSpace($input.NormalPath) -and [string]::IsNullOrWhiteSpace($input.LowPath)) {
    Show-Error "ต้องเลือกไฟล์ Excel อย่างน้อย 1 ไฟล์"
    exit 1
  }

  $Minutes = 15
  if ($input.Interval -match '^\d+$') { $Minutes = [int]$input.Interval }
  if ($Minutes -lt 5) { $Minutes = 5 }

  New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null

  if ($HasBundle -or $HasExe -or $HasCmd) {
    if ($HasBundle) {
      Copy-Item (Join-Path $Root "runtime") (Join-Path $InstallDir "runtime") -Recurse -Force
      Copy-Item (Join-Path $Root "app") (Join-Path $InstallDir "app") -Recurse -Force
    }
    if ($HasExe) {
      Copy-Item $ExeSrc (Join-Path $InstallDir "TSL-Asset-Sync.exe") -Force
      $RunExe = Join-Path $InstallDir "TSL-Asset-Sync.exe"
      $ActionExecute = $RunExe
      $ActionArgs = "--once"
    } elseif ($HasCmd) {
      Copy-Item $CmdSrc (Join-Path $InstallDir "TSL-Asset-Sync.cmd") -Force
      $RunExe = Join-Path $InstallDir "TSL-Asset-Sync.cmd"
      $ActionExecute = "cmd.exe"
      $ActionArgs = "/c `"$RunExe`" --once"
    } else {
      $RunExe = Join-Path $InstallDir "runtime\node.exe"
      $ActionExecute = $RunExe
      $ActionArgs = "`"$(Join-Path $InstallDir 'app\sync.cjs')`" --once"
    }
  } else {
    Copy-Item (Join-Path $Root "sync.mjs") $InstallDir -Force
    Copy-Item (Join-Path $Root "lib") (Join-Path $InstallDir "lib") -Recurse -Force
    if (Test-Path (Join-Path $Root "node_modules")) {
      Copy-Item (Join-Path $Root "node_modules") (Join-Path $InstallDir "node_modules") -Recurse -Force
    }
    if (Test-Path (Join-Path $Root "package.json")) {
      Copy-Item (Join-Path $Root "package.json") $InstallDir -Force
    }
    $ActionExecute = (Get-Command node).Source
    $ActionArgs = "sync.mjs --once"
    $RunExe = $ActionExecute
  }

  $Sources = @()
  if (-not [string]::IsNullOrWhiteSpace($input.NormalPath)) {
    $Sources += @{ path = $input.NormalPath; assetClass = "NORMAL" }
  }
  if (-not [string]::IsNullOrWhiteSpace($input.LowPath)) {
    $Sources += @{ path = $input.LowPath; assetClass = "LOW_VALUE" }
  }

  $config = @{
    serverUrl = $input.ServerUrl.TrimEnd("/")
    apiKey    = $input.ApiKey
    deviceId  = $input.DeviceId
    stateFile = "./.sync-state.json"
    batchSize = 200
    sources   = $Sources
  }
  $config | ConvertTo-Json -Depth 6 | Set-Content -Path (Join-Path $InstallDir "config.json") -Encoding UTF8

  $Action = New-ScheduledTaskAction -Execute $ActionExecute -Argument $ActionArgs -WorkingDirectory $InstallDir
  $TriggerLogon = New-ScheduledTaskTrigger -AtLogOn
  $TriggerRepeat = New-ScheduledTaskTrigger -Once -At (Get-Date).Date `
    -RepetitionInterval (New-TimeSpan -Minutes $Minutes) `
    -RepetitionDuration (New-TimeSpan -Days 3650)
  $Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -MultipleInstances IgnoreNew

  Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $Action `
    -Trigger @($TriggerLogon, $TriggerRepeat) `
    -Settings $Settings `
    -Description "TSL Smart Asset — sync Excel chek sheet" `
    -Force | Out-Null

  Show-Info @"
ติดตั้งเสร็จแล้ว

โฟลเดอร์: $InstallDir
Task: $TaskName (ทุก $Minutes นาที)

ทดสอบ:
$RunExe --ping
"@
}
catch {
  Show-Error $_.Exception.Message
  exit 1
}
