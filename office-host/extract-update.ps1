param([Parameter(Mandatory=$true)][string]$Archive, [Parameter(Mandatory=$true)][string]$Destination)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression
if (Test-Path -LiteralPath $Destination) { throw 'Extraction requires a new directory.' }
$root = [IO.Path]::GetFullPath($Destination).TrimEnd('\') + '\'
$zip = [IO.Compression.ZipFile]::OpenRead($Archive)
try {
  $seen = @{}; [long]$total = 0
  if ($zip.Entries.Count -gt 25000) { throw 'Too many package entries.' }
  foreach ($entry in $zip.Entries) {
    $name = $entry.FullName.Replace('\','/')
    if ($name -notlike 'payload/*') { continue }
    $relative = $name.Substring(8)
    if (-not $relative) { continue }
    if ($relative -match '(^|/)\.{1,2}(/|$)|[:\x00-\x1f]|(^/)|[. ](/|$)' -or $relative -match '(^|/)(CON|PRN|AUX|NUL|COM[0-9]|LPT[0-9])(\.|/|$)') { throw 'Unsafe archive path.' }
    $target = [IO.Path]::GetFullPath((Join-Path $Destination $name))
    if (-not $target.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -or $seen.ContainsKey($target)) { throw 'Duplicate or escaping archive path.' }
    $seen[$target] = $true
    if (($entry.ExternalAttributes -shr 16 -band 0xF000) -eq 0xA000) { throw 'Archive links are forbidden.' }
    $total += $entry.Length
    if ($total -gt 3GB -or $entry.Length -gt 512MB) { throw 'Expanded package is too large.' }
  }
  New-Item -ItemType Directory -Path $Destination | Out-Null
  foreach ($entry in $zip.Entries) {
    $name = $entry.FullName.Replace('\','/')
    if ($name -notlike 'payload/*' -or $name -eq 'payload/') { continue }
    $target = [IO.Path]::GetFullPath((Join-Path $Destination $name))
    if ($name.EndsWith('/')) { New-Item -ItemType Directory -Path $target -Force | Out-Null; continue }
    New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
    [IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $target, $false)
  }
} finally { $zip.Dispose() }
