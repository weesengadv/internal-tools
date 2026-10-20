param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $projectDir
$nodeCommand = Get-Command node -ErrorAction Stop
$port = 4174
$url = "http://127.0.0.1:$port/"
$listeners = @(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
if ($listeners | Where-Object { $_.LocalAddress -notin @('127.0.0.1', '::1') }) {
  throw "Port $port is used by a network-facing server. Close it before starting local testing."
}

if (-not $listeners.Count) {
  $logDir = Join-Path $projectDir 'logs'
  New-Item -ItemType Directory -Path $logDir -Force | Out-Null
  $settings = @{
    HOST = '127.0.0.1'
    PORT = "$port"
    WEESENG_APP_ROOT = $projectDir
    WEESENG_CONFIG_DIR = $projectDir
    WEESENG_WORD_TOOLS_ROOT = (Join-Path $projectDir 'tools\word-tools')
  }
  $previous = @{}
  try {
    foreach ($name in $settings.Keys) {
      $previous[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
      [Environment]::SetEnvironmentVariable($name, $settings[$name], 'Process')
    }
    $serviceProcess = Start-Process -FilePath $nodeCommand.Source -ArgumentList 'server.js' `
      -WorkingDirectory $projectDir -WindowStyle Hidden -PassThru `
      -RedirectStandardOutput (Join-Path $logDir 'local-server.log') `
      -RedirectStandardError (Join-Path $logDir 'local-server.err.log')
  } finally {
    foreach ($name in $previous.Keys) {
      [Environment]::SetEnvironmentVariable($name, $previous[$name], 'Process')
    }
  }
  $deadline = (Get-Date).AddSeconds(15)
  do {
    if ($serviceProcess.HasExited) { throw "Production Tools could not start. Check logs\local-server.err.log." }
    try {
      $page = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2
      break
    } catch {
      if ((Get-Date) -ge $deadline) { throw "Production Tools did not start at $url. Check logs\local-server.err.log." }
      Start-Sleep -Milliseconds 200
    }
  } while ($true)
}

try {
  $workbench = Invoke-RestMethod -Uri ($url + 'api/word-tools/start') -Method Post -TimeoutSec 90
  $address = New-Object System.Uri([Uri]$url, [string]$workbench.url)
  if ($address.Scheme -ne 'http' -or $address.Host -ne '127.0.0.1') { throw 'Invalid local workbench address.' }
  $health = Invoke-RestMethod -Uri ($address.AbsoluteUri + 'api/health') -TimeoutSec 5
  if (-not $health.ok -or -not $health.local) { throw 'Geometry service is not ready.' }
} catch {
  throw "Local setup check failed: $($_.Exception.Message). Close any older server on port $port and run this launcher again."
}

if (-not $NoBrowser) { Start-Process $url }
Write-Host "Production Tools is ready for local testing at $url"
Write-Host '3D word tools geometry service is ready. Access is limited to this computer.'
