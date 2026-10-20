# Exercise the real deployment script with Windows system commands replaced by
# in-process fakes. No task, firewall, browser, network or process is modified.
$ErrorActionPreference = 'Stop'
$workspace = Split-Path -Parent $PSScriptRoot
$testDir = Join-Path $workspace ('output\office-install-qa-' + [guid]::NewGuid().ToString('N'))
$package = Join-Path $testDir 'package'
New-Item -ItemType Directory -Path (Join-Path $package 'office') -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $workspace 'office-host\install.ps1') -Destination (Join-Path $package 'office\install.ps1')
Copy-Item -LiteralPath (Join-Path $workspace 'office-host\host.ps1') -Destination (Join-Path $package 'office\host.ps1')
function Make-Release($folder, $id) {
  $files = @()
  foreach ($relative in @('app/server.js', 'runtime/node.exe', 'runtime/python/python.exe', 'app/tools/word-tools/backend/main.py', 'app/tools/word-tools/dist/client/index.html', 'app/signage-config.example.json')) {
    $file = Join-Path $folder $relative
    New-Item -ItemType Directory -Path (Split-Path -Parent $file) -Force | Out-Null
    [IO.File]::WriteAllText($file, $(if ($relative.EndsWith('.json')) { '{}' } else { 'test fixture only' }))
    $hasher = [Security.Cryptography.SHA256]::Create()
    $hash = [BitConverter]::ToString($hasher.ComputeHash([IO.File]::ReadAllBytes($file))).Replace('-', '')
    $hasher.Dispose()
    $files += @{ path = $relative; sha256 = $hash }
  }
  @{ release = $id; arch = 'win-x64'; files = $files } | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $folder 'manifest.json') -Encoding UTF8
}
function Assert($condition, $message) { if (-not $condition) { throw $message } }

function Get-NetIPAddress { [pscustomobject]@{ IPAddress = '192.168.0.234' } }
function Get-ScheduledTask { if ($global:officeQaState.task) { [pscustomobject]@{ State = 'Ready' } } }
function Export-ScheduledTask { '<Task>previous task</Task>' }
function Stop-ScheduledTask { $global:officeQaState.running = $false }
function Start-ScheduledTask { $global:officeQaState.running = $true }
function Disable-ScheduledTask { $global:officeQaState.running = $false }
function New-ScheduledTaskAction { @{} }
function New-ScheduledTaskTrigger { @{} }
function New-ScheduledTaskSettingsSet { @{} }
function Register-ScheduledTask {
  if ($global:officeQaState.failRegister -gt 0) { $global:officeQaState.failRegister--; throw 'Injected task registration failure' }
  $global:officeQaState.task = $true
}
function Get-NetFirewallRule { if ($global:officeQaState.firewall) { [pscustomobject]@{ Name = 'fake office rule' } } }
function New-NetFirewallRule { $global:officeQaState.firewall = $true }
function Enable-NetFirewallRule { $global:officeQaState.firewall = $true }
function Disable-NetFirewallRule { $global:officeQaState.firewall = $false }
function Remove-NetFirewallRule { throw 'A working firewall rule must never be removed during updates.' }
function Get-CimInstance { [pscustomobject]@{ ExecutablePath = (Join-Path $global:officeQaState.installDir 'updater\node.exe'); ProcessId = 999999 } }
function Stop-Process { throw 'No real process may be stopped in this test.' }
function Start-Process { [pscustomobject]@{ ExitCode = 0 } }
function Start-Transcript {}
function Stop-Transcript {}
function Invoke-RestMethod {
  param($Uri, $TimeoutSec, $Method)
  Assert $global:officeQaState.running 'Health check attempted against a stopped fake service'
  if ($Uri.EndsWith('/api/health') -and -not $Uri.Contains('/word-tools/')) {
    $pointer = Get-Content -LiteralPath (Join-Path $global:officeQaState.installDir 'current.json') -Raw | ConvertFrom-Json
    return @{ ok = $true; release = $pointer.release }
  }
  if ($Uri.EndsWith('/start')) { return @{ url = '/word-tools/' } }
  return @{ ok = $true; local = $true }
}

Make-Release (Join-Path $package 'payload') 'new-release'
$hostDir = Join-Path $testDir 'host'
Make-Release (Join-Path $hostDir 'releases\old-release') 'old-release'
New-Item -ItemType Directory -Path (Join-Path $hostDir 'settings') -Force | Out-Null
'{"release":"old-release","previous":""}' | Set-Content -LiteralPath (Join-Path $hostDir 'current.json')
'old controller' | Set-Content -LiteralPath (Join-Path $hostDir 'host.ps1')
[IO.File]::WriteAllText((Join-Path $hostDir 'settings\signage-config.json'), '{"apiKey":"host-only-test-key"}')
$oldController = [IO.File]::ReadAllText((Join-Path $hostDir 'host.ps1'))
$global:officeQaState = @{ task = $true; running = $true; firewall = $true; failRegister = 1; installDir = $hostDir }
New-Item -ItemType Directory -Path (Join-Path $hostDir 'releases\new-release') -Force | Out-Null
[IO.File]::WriteAllText((Join-Path $hostDir 'releases\new-release\interrupted-copy.txt'), 'partial release')
try { & (Join-Path $package 'office\install.ps1') -InstallDir $hostDir -Update; throw 'Expected update failure.' }
catch { Assert ($_.Exception.Message -match 'previous release was restored') $_.Exception.Message }
$pointer = Get-Content -LiteralPath (Join-Path $hostDir 'current.json') -Raw | ConvertFrom-Json
Assert ($pointer.release -eq 'old-release') 'Rollback did not restore the pointer.'
Assert ([IO.File]::ReadAllText((Join-Path $hostDir 'host.ps1')) -eq $oldController) 'Rollback did not restore the controller.'
Assert ($global:officeQaState.running -and $global:officeQaState.firewall) 'Rollback did not preserve staff access.'
Assert ([IO.File]::ReadAllText((Join-Path $hostDir 'settings\signage-config.json')) -match 'host-only-test-key') 'Host settings were overwritten.'
Write-Host 'PASS: task-registration failure restores old pointer/controller/task and preserves firewall/settings.'
Write-Host 'PASS: incomplete inactive release repaired; separate update receiver was not stopped.'

$newHost = Join-Path $testDir 'fresh-host'
$global:officeQaState = @{ task = $false; running = $false; firewall = $false; failRegister = 1; installDir = $newHost }
try { & (Join-Path $package 'office\install.ps1') -InstallDir $newHost; throw 'Expected first-install failure.' }
catch { Assert ($_.Exception.Message -match 'First installation failed') $_.Exception.Message }
Assert (-not (Test-Path -LiteralPath (Join-Path $newHost 'current.json'))) 'Failed first installation retained a misleading active pointer.'
& (Join-Path $package 'office\install.ps1') -InstallDir $newHost
Assert ($global:officeQaState.running -and $global:officeQaState.firewall) 'Retry did not recover the installation.'
Assert ((Get-Content -LiteralPath (Join-Path $newHost 'current.json') -Raw | ConvertFrom-Json).release -eq 'new-release') 'Retry did not activate the new release.'
Write-Host 'PASS: a failed first installation can be retried successfully.'

# Successful update and explicit rollback preserve the private settings as well.
$global:officeQaState = @{ task = $true; running = $true; firewall = $true; failRegister = 0; installDir = $hostDir }
& (Join-Path $package 'office\install.ps1') -InstallDir $hostDir -Update
$active = Get-Content -LiteralPath (Join-Path $hostDir 'current.json') -Raw | ConvertFrom-Json
Assert ($active.release -eq 'new-release' -and $active.previous -eq 'old-release') 'Successful update did not preserve its predecessor.'
& (Join-Path $package 'office\install.ps1') -InstallDir $hostDir -Rollback
$active = Get-Content -LiteralPath (Join-Path $hostDir 'current.json') -Raw | ConvertFrom-Json
Assert ($active.release -eq 'old-release') 'Manual rollback did not restore the old release.'
Assert ([IO.File]::ReadAllText((Join-Path $hostDir 'settings\signage-config.json')) -match 'host-only-test-key') 'Update/rollback changed private settings.'
Write-Host 'PASS: successful update and manual rollback retain settings and staff access.'
