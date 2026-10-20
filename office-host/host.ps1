$ErrorActionPreference = 'Stop'
$installDir = $PSScriptRoot
$pointer = Get-Content -LiteralPath (Join-Path $installDir 'current.json') -Raw | ConvertFrom-Json
if ($pointer.release -notmatch '^[A-Za-z0-9][A-Za-z0-9._-]*$') { throw 'Invalid active release.' }
$releaseDir = Join-Path (Join-Path $installDir 'releases') $pointer.release
$config = Get-Content -LiteralPath (Join-Path $installDir 'office-host.json') -Raw | ConvertFrom-Json
$env:HOST = $config.address
$env:PORT = [string]$config.port
$env:WEESENG_OFFICE_ADDRESS = $config.address
$env:WEESENG_OFFICE_SUBNET = $config.subnet
$env:WEESENG_APP_ROOT = Join-Path $releaseDir 'app'
$env:WEESENG_CONFIG_DIR = Join-Path $installDir 'settings'
$env:WEESENG_WORD_TOOLS_ROOT = Join-Path $releaseDir 'app\tools\word-tools'
$env:WEESENG_WORD_TOOLS_PYTHON = Join-Path $releaseDir 'runtime\python\python.exe'
$env:WEESENG_RELEASE_ID = $pointer.release
$env:PYTHONNOUSERSITE = '1'
$env:PYTHONDONTWRITEBYTECODE = '1'
Remove-Item Env:PYTHONHOME -ErrorAction SilentlyContinue
Remove-Item Env:PYTHONPATH -ErrorAction SilentlyContinue
Set-Location -LiteralPath $env:WEESENG_APP_ROOT
& (Join-Path $releaseDir 'runtime\node.exe') 'server.js' *>> (Join-Path $installDir 'logs\server.log')
exit $LASTEXITCODE
