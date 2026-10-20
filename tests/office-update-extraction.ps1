$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression
$root = Split-Path -Parent $PSScriptRoot
$fixture = Join-Path $root ('output\extract-qa-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $fixture | Out-Null
function Make-Zip($file,$names) {
  $zip = [IO.Compression.ZipFile]::Open($file,[IO.Compression.ZipArchiveMode]::Create)
  try { foreach ($name in $names) { $entry = $zip.CreateEntry($name); $writer = New-Object IO.StreamWriter($entry.Open()); $writer.Write('fixture'); $writer.Dispose() } } finally { $zip.Dispose() }
}
foreach ($bad in @('payload/../outside.txt','payload/C:outside.txt','payload/foo./bad.txt','payload/NUL.txt')) {
  $id = [guid]::NewGuid().ToString('N'); $file = Join-Path $fixture ($id + '.zip')
  Make-Zip $file @($bad)
  $rejected = $false
  try { & (Join-Path $root 'office-host\extract-update.ps1') -Archive $file -Destination (Join-Path $fixture $id) } catch { $rejected = $true }
  if (-not $rejected) { throw "Unsafe path accepted: $bad" }
}
$file = Join-Path $fixture 'valid.zip'
Make-Zip $file @('payload/app/server.js','office/install.ps1','SETUP_OFFICE.bat')
$dest = Join-Path $fixture 'valid'
& (Join-Path $root 'office-host\extract-update.ps1') -Archive $file -Destination $dest
if (-not (Test-Path -LiteralPath (Join-Path $dest 'payload/app/server.js'))) { throw 'Payload missing.' }
if (Test-Path -LiteralPath (Join-Path $dest 'office/install.ps1')) { throw 'Uploaded installer must never be extracted.' }
Write-Host 'PASS: unsafe ZIP paths rejected; only payload extracted, uploaded installer excluded.'
