param([string]$InstallDir,[string]$Archive,[string]$JobFile,[string]$Release,[string]$ExpectedHash)
$ErrorActionPreference = 'Stop'
function Save-Job($status,$message) {
  $job = Get-Content -LiteralPath $JobFile -Raw | ConvertFrom-Json
  $job.status = $status; $job.error = $message; $job.updatedAt = [DateTime]::UtcNow.ToString('o')
  $job | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath ($JobFile + '.apply') -Encoding UTF8
  Move-Item -LiteralPath ($JobFile + '.apply') -Destination $JobFile -Force
}
try {
  Save-Job 'installing' $null
  $hash = [Security.Cryptography.SHA256]::Create(); $stream = [IO.File]::OpenRead($Archive)
  try { $actual = [BitConverter]::ToString($hash.ComputeHash($stream)).Replace('-','').ToLowerInvariant() } finally { $stream.Dispose(); $hash.Dispose() }
  if ($actual -ne $ExpectedHash) { throw 'Archive changed after upload verification.' }
  $destination = Join-Path $PSScriptRoot ('inbox\expanded-' + [Guid]::NewGuid().ToString())
  & (Join-Path $PSScriptRoot 'extract-update.ps1') -Archive $Archive -Destination $destination
  $manifest = Get-Content -LiteralPath (Join-Path $destination 'payload\manifest.json') -Raw | ConvertFrom-Json
  if ($manifest.release -ne $Release) { throw 'Signed release and package manifest differ.' }
  # Execute the trusted bootstrap installer, never scripts from the uploaded archive.
  $process = Start-Process powershell.exe -WindowStyle Hidden -Wait -PassThru -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',('"' + (Join-Path $PSScriptRoot 'install.ps1') + '"'),'-InstallDir',('"' + $InstallDir + '"'),'-PackageDir',('"' + $destination + '"'),'-Update','-Unattended')
  if ($process.ExitCode -ne 0) { throw 'Installation failed. The installer attempted to restore the previous release. See logs\setup.log.' }
  Save-Job 'succeeded' $null
} catch { Save-Job 'failed' $_.Exception.Message; exit 1 }
