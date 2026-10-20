$ErrorActionPreference = 'Stop'
& (Join-Path $PSScriptRoot 'node.exe') (Join-Path $PSScriptRoot 'update-receiver.cjs') *>> (Join-Path $PSScriptRoot 'receiver.log')
exit $LASTEXITCODE
