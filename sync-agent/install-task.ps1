# Register Windows Task Scheduler job for TSL Asset sync agent
# Run in elevated PowerShell from this folder:
#   .\install-task.ps1

$ErrorActionPreference = "Stop"
$AgentDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$NodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $NodeCmd) {
  throw "ไม่พบ node ใน PATH — ติดตั้ง Node.js LTS ก่อน"
}
$Node = $NodeCmd.Source

if (-not (Test-Path (Join-Path $AgentDir "config.json"))) {
  throw "สร้าง config.json จาก config.example.json ก่อน"
}

$TaskName = "TSL-SmartAsset-Sync"
$Action = New-ScheduledTaskAction `
  -Execute $Node `
  -Argument "sync.mjs --once" `
  -WorkingDirectory $AgentDir

$Trigger = @(
  (New-ScheduledTaskTrigger -AtLogOn),
  (New-ScheduledTaskTrigger -Once -At (Get-Date).Date -RepetitionInterval (New-TimeSpan -Minutes 15) -RepetitionDuration (New-TimeSpan -Days 3650))
)

$Settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -StartWhenAvailable `
  -MultipleInstances IgnoreNew

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $Action `
  -Trigger $Trigger `
  -Settings $Settings `
  -Description "Sync Excel chek sheet deltas to TSL Smart Asset" `
  -Force | Out-Null

Write-Host "ลงทะเบียน Task '$TaskName' แล้ว (ทุก 15 นาที + ตอน login)"
Write-Host "ทดสอบ: schtasks /Run /TN $TaskName"
