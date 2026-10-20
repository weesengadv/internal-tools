param(
  [string]$InstallDir = 'C:\WeesengProductionTools',
  [switch]$Update,
  [switch]$Rollback,
  [switch]$ValidateOnly,
  [string]$PackageDir,
  [switch]$Unattended
)
$ErrorActionPreference = 'Stop'
if (-not $PackageDir) { $PackageDir = Split-Path -Parent $PSScriptRoot }
$taskName = 'Weeseng Production Tools Office'
$targetAddress = '192.168.0.234'
$targetSubnet = '192.168.0.0/24'
$targetPort = 4174

function Write-JsonAtomic($file, $value) {
  $temporary = $file + '.new'
  $value | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $temporary -Encoding UTF8
  Move-Item -LiteralPath $temporary -Destination $file -Force
}
function Check-Release($folder) {
  Write-Host "Checking release files in $folder. Please wait..."
  $manifestFile = Join-Path $folder 'manifest.json'
  $manifest = Get-Content -LiteralPath $manifestFile -Raw | ConvertFrom-Json
  if ($manifest.release -notmatch '^[A-Za-z0-9][A-Za-z0-9._-]*$' -or $manifest.arch -ne 'win-x64') { throw 'Invalid Windows release manifest.' }
  $listed = @{}
  $checkedCount = 0
  foreach ($item in $manifest.files) {
    $checkedCount++
    if ($checkedCount % 500 -eq 0) { Write-Host "Checked $checkedCount / $(@($manifest.files).Count) files..." }
    if ($item.path -match '(^|[\\/])\.\.([\\/]|$)' -or [IO.Path]::IsPathRooted($item.path)) { throw 'Unsafe release path.' }
    $file = Join-Path $folder $item.path
    if (-not (Test-Path -LiteralPath $file -PathType Leaf)) { throw "Release file missing: $($item.path)" }
    if ((Get-Item -LiteralPath $file).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Links are not allowed in releases.' }
    $hasher = [Security.Cryptography.SHA256]::Create()
    $stream = [IO.File]::OpenRead($file)
    try { $actualHash = [BitConverter]::ToString($hasher.ComputeHash($stream)).Replace('-', '') }
    finally { $stream.Dispose(); $hasher.Dispose() }
    if ($actualHash -ne $item.sha256) { throw "Release file damaged: $($item.path)" }
    if ($listed.ContainsKey($item.path)) { throw 'Duplicate release file.' }
    $listed[$item.path] = $true
  }
  foreach ($entry in Get-ChildItem -LiteralPath $folder -Recurse -Force) {
    if ($entry.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Links are not allowed in releases.' }
    if (-not $entry.PSIsContainer -and $entry.FullName -ne $manifestFile) {
      $relative = $entry.FullName.Substring($folder.Length + 1).Replace('\', '/')
      if (-not $listed.ContainsKey($relative)) { throw "Unlisted release file: $relative" }
    }
  }
  foreach ($required in @('app/server.js', 'runtime/node.exe', 'runtime/python/python.exe', 'app/tools/word-tools/backend/main.py', 'app/tools/word-tools/dist/client/index.html')) {
    if ($required -notin @($manifest.files | ForEach-Object { $_.path })) { throw "Required runtime file is absent: $required" }
  }
  return $manifest
}
function Check-Running($releaseId) {
  $url = "http://${targetAddress}:$targetPort/"
  $deadline = (Get-Date).AddSeconds(75)
  do {
    try {
      $health = Invoke-RestMethod -Uri ($url + 'api/health') -TimeoutSec 3
      if ($health.ok -and $health.release -eq $releaseId) {
        $started = Invoke-RestMethod -Uri ($url + 'api/word-tools/start') -Method Post -TimeoutSec 45
        $geometry = Invoke-RestMethod -Uri ($url + 'word-tools/api/health') -TimeoutSec 5
        if ($geometry.ok -and $geometry.local) { return }
      }
    } catch {}
    Start-Sleep -Milliseconds 500
  } while ((Get-Date) -lt $deadline)
  throw 'The new release did not pass its web and geometry startup checks.'
}
function Stop-Office {
  $task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
  if ($task) {
    Stop-ScheduledTask -TaskName $taskName
    # The host controller is a PowerShell task with Node/Python descendants.
    # Stop only executables under our installation, never other office software.
    $ownedRoot = [IO.Path]::GetFullPath((Join-Path $InstallDir 'releases')).TrimEnd('\') + '\'
    foreach ($process in Get-CimInstance Win32_Process) {
      if ($process.ExecutablePath -and $process.ExecutablePath.StartsWith($ownedRoot, [StringComparison]::OrdinalIgnoreCase)) {
        Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
      }
    }
    Start-Sleep -Milliseconds 700
  }
}

if ($ValidateOnly) {
  $checked = Check-Release (Join-Path $packageDir 'payload')
  Write-Host "Package verified: $($checked.release)"
  exit 0
}

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
  if ($Unattended) { throw 'The office receiver must run as administrator or SYSTEM.' }
  $arguments = '-NoProfile -ExecutionPolicy Bypass -File "' + $PSCommandPath + '" -InstallDir "' + $InstallDir + '"'
  if ($Update) { $arguments += ' -Update' }
  if ($Rollback) { $arguments += ' -Rollback' }
  Write-Host 'Approve the administrator prompt. Setup progress appears in the new window.'
  $elevated = Start-Process powershell.exe -Verb RunAs -ArgumentList $arguments -WindowStyle Normal -Wait -PassThru
  if ($elevated.ExitCode -ne 0) { throw 'Setup failed. Read the setup log in C:\WeesengProductionTools\logs or run the script as administrator to see the error.' }
  Write-Host "Ready: http://${targetAddress}:$targetPort/"
  exit 0
}

if (-not [Environment]::Is64BitOperatingSystem) { throw 'This package requires 64-bit Windows.' }
if (-not (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object IPAddress -eq $targetAddress)) {
  throw "Run this package on the office PC with address $targetAddress. No network changes were made."
}
$InstallDir = [IO.Path]::GetFullPath($InstallDir)
if ($InstallDir.TrimEnd('\') -eq [IO.Path]::GetPathRoot($InstallDir).TrimEnd('\') -or $InstallDir.StartsWith('\\')) { throw 'Use a dedicated local installation folder.' }
foreach ($directory in @($InstallDir, (Join-Path $InstallDir 'releases'), (Join-Path $InstallDir 'logs'), (Join-Path $InstallDir 'settings'))) {
  New-Item -ItemType Directory -Path $directory -Force | Out-Null
}
Start-Transcript -Path (Join-Path $InstallDir 'logs\setup.log') -Append | Out-Null
$mutex = New-Object Threading.Mutex($false, 'Global\WeesengProductionToolsUpdate')
if (-not $mutex.WaitOne(0)) { throw 'Another installation or update is running.' }
try {
  Write-Host 'Office installation started. Checking and copying bundled runtimes can take several minutes.'
  $pointerFile = Join-Path $InstallDir 'current.json'
  $oldPointer = $null
  if (Test-Path -LiteralPath $pointerFile) { $oldPointer = Get-Content -LiteralPath $pointerFile -Raw | ConvertFrom-Json }
  if (($Update -or $Rollback) -and -not $oldPointer) { throw 'Install the office host first.' }
  if ($Rollback) {
    if (-not $oldPointer.previous -or $oldPointer.previous -notmatch '^[A-Za-z0-9][A-Za-z0-9._-]*$') { throw 'No previous release is available.' }
    $newRelease = $oldPointer.previous
    $null = Check-Release (Join-Path (Join-Path $InstallDir 'releases') $newRelease)
  } else {
    $source = Join-Path $packageDir 'payload'
    $manifest = Check-Release $source
    $newRelease = $manifest.release
    $destination = Join-Path (Join-Path $InstallDir 'releases') $newRelease
    if (Test-Path -LiteralPath $destination) {
      try { $null = Check-Release $destination }
      catch {
        if ($oldPointer -and $oldPointer.release -eq $newRelease) { throw 'The active release is damaged. Restore a working package or roll back before updating.' }
        $quarantine = Join-Path (Join-Path $InstallDir 'releases') ('incomplete-' + [guid]::NewGuid().ToString('N'))
        # Both paths are fixed children of the dedicated releases directory.
        Move-Item -LiteralPath $destination -Destination $quarantine
      }
    }
    if (-not (Test-Path -LiteralPath $destination)) {
      # Copy and verify before interrupting the working release.
      $staging = Join-Path (Join-Path $InstallDir 'releases') ('staging-' + [guid]::NewGuid().ToString('N'))
      Write-Host 'Copying application and runtimes. Please keep this window open...'
      New-Item -ItemType Directory -Path $staging | Out-Null
      Get-ChildItem -LiteralPath $source -Force | Copy-Item -Destination $staging -Recurse
      $null = Check-Release $staging
      Move-Item -LiteralPath $staging -Destination $destination
    }
    $settingsFile = Join-Path $InstallDir 'settings\signage-config.json'
    if (-not (Test-Path -LiteralPath $settingsFile)) {
      Copy-Item -LiteralPath (Join-Path $destination 'app\signage-config.example.json') -Destination $settingsFile
    }
  }
  if ($oldPointer -and $oldPointer.release -eq $newRelease) {
    try {
      Check-Running $newRelease
      if (-not $Unattended -and (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'setup-receiver.ps1'))) { & (Join-Path $PSScriptRoot 'setup-receiver.ps1') -InstallDir $InstallDir }
      Write-Host 'This release is already installed and healthy.'; exit 0
    }
    catch { Write-Host 'Repairing the installed release.' }
  }
  if ($oldPointer) {
    $backup = Join-Path $InstallDir ('settings-backup-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
    Copy-Item -LiteralPath (Join-Path $InstallDir 'settings') -Destination $backup -Recurse
  }
  $controllerFile = Join-Path $InstallDir 'host.ps1'
  $oldController = $null
  if (Test-Path -LiteralPath $controllerFile) { $oldController = [IO.File]::ReadAllText($controllerFile) }
  $oldTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
  $oldTaskXml = $null
  if ($oldTask) { $oldTaskXml = Export-ScheduledTask -TaskName $taskName }
  try {
  Stop-Office
  if (-not $Rollback) { Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'host.ps1') -Destination $controllerFile -Force }
  Write-JsonAtomic (Join-Path $InstallDir 'office-host.json') @{ address = $targetAddress; subnet = $targetSubnet; port = $targetPort }
  $previousRelease = ''
  if ($oldPointer) { $previousRelease = $(if ($oldPointer.release -eq $newRelease) { $oldPointer.previous } else { $oldPointer.release }) }
  Write-JsonAtomic $pointerFile @{ release = $newRelease; previous = $previousRelease }
  $action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument ('-NoProfile -ExecutionPolicy Bypass -File "' + (Join-Path $InstallDir 'host.ps1') + '"') -WorkingDirectory $InstallDir
  $trigger = New-ScheduledTaskTrigger -AtStartup
  $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
  Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -User 'SYSTEM' -RunLevel Highest -Force | Out-Null
  # The address and subnet are fixed across releases; never delete a working rule during updates.
  if (Get-NetFirewallRule -Name 'Weeseng-Office-4174' -ErrorAction SilentlyContinue) {
    Enable-NetFirewallRule -Name 'Weeseng-Office-4174' | Out-Null
  } else {
    New-NetFirewallRule -Name 'Weeseng-Office-4174' -DisplayName 'Weeseng Production Tools - office subnet only' -Direction Inbound -Action Allow -Protocol TCP -LocalPort $targetPort -LocalAddress $targetAddress -RemoteAddress $targetSubnet -Profile Any | Out-Null
  }
  Start-ScheduledTask -TaskName $taskName
  Write-Host 'Starting the office website and checking 3D tools...'
  Check-Running $newRelease
  }
  catch {
    $deploymentError = $_.Exception.Message
    Stop-Office
    if ($oldPointer) {
      Write-JsonAtomic $pointerFile $oldPointer
      if ($null -ne $oldController) { [IO.File]::WriteAllText($controllerFile, $oldController) }
      if ($oldTaskXml) { Register-ScheduledTask -TaskName $taskName -Xml $oldTaskXml -Force | Out-Null }
      Start-ScheduledTask -TaskName $taskName
      Check-Running $oldPointer.release
      throw "The new release failed ($deploymentError). The previous release was restored; staff can continue using it."
    }
    if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) { Disable-ScheduledTask -TaskName $taskName | Out-Null }
    Get-NetFirewallRule -Name 'Weeseng-Office-4174' -ErrorAction SilentlyContinue | Disable-NetFirewallRule
    if (Test-Path -LiteralPath $pointerFile) { Remove-Item -LiteralPath $pointerFile -Force }
    throw "First installation failed ($deploymentError). Service and firewall rule were disabled; see logs."
  }
  Write-Host "Ready: http://${targetAddress}:$targetPort/"
  if (-not $Unattended) {
    if (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'setup-receiver.ps1')) { & (Join-Path $PSScriptRoot 'setup-receiver.ps1') -InstallDir $InstallDir }
    Start-Process "http://${targetAddress}:$targetPort/"
  }
} finally {
  $mutex.ReleaseMutex(); $mutex.Dispose()
  Stop-Transcript | Out-Null
}
