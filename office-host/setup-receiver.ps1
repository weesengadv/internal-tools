param([string]$InstallDir = 'C:\WeesengProductionTools')
$ErrorActionPreference = 'Stop'
if (-not (Get-NetIPAddress -AddressFamily IPv4 | Where-Object IPAddress -eq '192.168.0.234')) { throw 'Receiver setup is only for office PC 192.168.0.234.' }
$directory = Join-Path $InstallDir 'updater'
New-Item -ItemType Directory -Path $directory -Force | Out-Null
& icacls.exe $directory /inheritance:r /grant:r '*S-1-5-18:(OI)(CI)F' '*S-1-5-32-544:(OI)(CI)F' | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Could not protect the office receiver directory.' }
$sourceKey = [IO.File]::ReadAllText((Join-Path $PSScriptRoot 'publisher-public.pem'))
$keyFile = Join-Path $directory 'publisher-public.pem'
if ((Test-Path -LiteralPath $keyFile) -and [IO.File]::ReadAllText($keyFile) -ne $sourceKey) { throw 'This receiver belongs to a different publisher. Keep the original publishing key.' }
$task = 'Weeseng Production Tools Update Receiver'
if (Get-ScheduledTask -TaskName $task -ErrorAction SilentlyContinue) { Stop-ScheduledTask -TaskName $task; Start-Sleep -Seconds 1 }
$receiverNode = Join-Path $directory 'node.exe'
foreach ($process in Get-CimInstance Win32_Process) {
  if ($process.ExecutablePath -and $process.ExecutablePath.Equals($receiverNode, [StringComparison]::OrdinalIgnoreCase)) { Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue }
}
$pointer = Get-Content -LiteralPath (Join-Path $InstallDir 'current.json') -Raw | ConvertFrom-Json
Copy-Item -LiteralPath (Join-Path $InstallDir ('releases\' + $pointer.release + '\runtime\node.exe')) -Destination (Join-Path $directory 'node.exe') -Force
foreach ($name in @('install.ps1','host.ps1','apply-update.ps1','extract-update.ps1','receiver-host.ps1','publisher-public.pem','update-receiver.cjs','update-signing.cjs')) { Copy-Item -LiteralPath (Join-Path $PSScriptRoot $name) -Destination (Join-Path $directory $name) -Force }
$configFile = Join-Path $directory 'receiver-config.json'
if (-not (Test-Path -LiteralPath $configFile)) {
  $bytes = New-Object byte[] 32; $rng = [Security.Cryptography.RandomNumberGenerator]::Create(); $rng.GetBytes($bytes); $token = [Convert]::ToBase64String($bytes); $rng.GetBytes($bytes); $password = [Convert]::ToBase64String($bytes); $rng.Dispose()
  $cert = New-SelfSignedCertificate -DnsName '192.168.0.234' -CertStoreLocation 'Cert:\LocalMachine\My' -NotAfter (Get-Date).AddYears(5) -KeyExportPolicy Exportable -KeyAlgorithm RSA -KeyLength 3072
  $pfx = Join-Path $directory 'receiver.pfx'
  Export-PfxCertificate -Cert $cert -FilePath $pfx -Password (ConvertTo-SecureString $password -AsPlainText -Force) | Out-Null
  $hash = [Security.Cryptography.SHA256]::Create()
  try { $fingerprint = [BitConverter]::ToString($hash.ComputeHash($cert.RawData)).Replace('-','').ToLowerInvariant() } finally { $hash.Dispose() }
  @{installDir=$InstallDir;subnet='192.168.0.0/24';address='192.168.0.234';port=4175;token=$token;pfxFile=$pfx;pfxPassword=$password} | ConvertTo-Json | Set-Content -LiteralPath $configFile -Encoding UTF8
  $keyHash = & (Join-Path $directory 'node.exe') (Join-Path $directory 'update-signing.cjs') $keyFile
  if ($LASTEXITCODE -ne 0) { throw 'Publisher fingerprint failed.' }
  @{version=1;target='https://192.168.0.234:4175';certificateSha256=$fingerprint;token=$token;publisherKeySha256=$keyHash.Trim()} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $directory 'publisher-pairing.json') -Encoding UTF8
}
$action = New-ScheduledTaskAction -Execute powershell.exe -Argument ('-NoProfile -ExecutionPolicy Bypass -File "' + (Join-Path $directory 'receiver-host.ps1') + '"')
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName $task -Action $action -Trigger (New-ScheduledTaskTrigger -AtStartup) -Settings $settings -User SYSTEM -RunLevel Highest -Force | Out-Null
if (-not (Get-NetFirewallRule -Name 'Weeseng-Office-4175' -ErrorAction SilentlyContinue)) { New-NetFirewallRule -Name 'Weeseng-Office-4175' -DisplayName 'Weeseng authenticated office updater' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 4175 -LocalAddress '192.168.0.234' -RemoteAddress '192.168.0.0/24' -Profile Any | Out-Null }
Start-ScheduledTask -TaskName $task
Write-Host ('Copy this PRIVATE pairing file back to the publishing PC: ' + (Join-Path $directory 'publisher-pairing.json'))
