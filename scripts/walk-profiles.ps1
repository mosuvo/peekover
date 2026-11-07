# scripts/walk-profiles.ps1 - open a browser in a FRESH, throwaway profile with the built Peekover, for the 8.1 walk.
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\walk-profiles.ps1 -Browser chrome   [-Keep]
#   ... -Browser edge | brave | firefox | firefox-signed -Xpi <path-to-signed.xpi> | list
#
# Profiles live under D:\Dev\peekover-walk-profiles\<browser>\ and are deleted and recreated on every run unless -Keep
# is given (use -Keep for the "restart the browser" checks). Your normal profiles are never touched: every browser is
# started with its own profile folder, as a separate instance.
#
# Measured 2026-11-07 on this machine (8.1 prep): Chrome 156 IGNORES --load-extension (removed from branded Chrome in
# 137), so Chrome needs "Load unpacked" by hand; Edge 157 and Brave 157 load it from the command line. Opera and Vivaldi
# are not installed here. A --load-extension (unpacked) install starts with "Allow access to file URLs" ON in Chromium;
# a store install starts OFF.

param(
  [ValidateSet('chrome', 'edge', 'brave', 'firefox', 'firefox-signed', 'list')]
  [string]$Browser = 'list',
  [switch]$Keep,
  [string]$Xpi = ''
)

$repo = Split-Path -Parent $PSScriptRoot
$chromeExt = Join-Path $repo '.output\chrome-mv3'
$firefoxManifest = Join-Path $repo '.output\firefox-mv3\manifest.json'
$profiles = 'D:\Dev\peekover-walk-profiles'
$exe = @{
  chrome  = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
  edge    = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
  brave   = 'C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe'
  firefox = 'C:\Program Files\Mozilla Firefox\firefox.exe'
}

if ($Browser -eq 'list') {
  foreach ($k in 'chrome', 'edge', 'brave', 'firefox') {
    $state = if (Test-Path $exe[$k]) { (Get-Item $exe[$k]).VersionInfo.ProductVersion } else { 'not installed' }
    "{0,-8} {1}" -f $k, $state
  }
  'Opera / Vivaldi: not installed on this machine (8.1 prep, 2026-11-07).'
  return
}

if (-not (Test-Path (Join-Path $chromeExt 'manifest.json'))) { throw "Build first: pnpm build; pnpm exec wxt build -b firefox" }
$key = if ($Browser -eq 'firefox-signed') { 'firefox' } else { $Browser }
if (-not (Test-Path $exe[$key])) { throw "$Browser is not installed at $($exe[$key])" }

$dir = Join-Path $profiles $Browser
if (-not $Keep -and (Test-Path $dir)) { Remove-Item -Recurse -Force $dir }
New-Item -ItemType Directory -Force $dir | Out-Null

switch ($Browser) {
  'chrome' {
    Start-Process $exe.chrome -ArgumentList "--user-data-dir=`"$dir`"", '--no-first-run', '--no-default-browser-check', 'chrome://extensions/'
    "Chrome (fresh profile $dir):"
    "  1. Turn on Developer mode (top right of chrome://extensions)."
    "  2. Load unpacked -> $chromeExt"
    "  (Chrome 137+ ignores --load-extension, so this one step is by hand.)"
  }
  'edge' {
    Start-Process $exe.edge -ArgumentList "--user-data-dir=`"$dir`"", '--no-first-run', '--no-default-browser-check', "--load-extension=`"$chromeExt`"", 'edge://extensions/'
    "Edge (fresh profile $dir): Peekover is loaded unpacked; the setup guide opens on its own."
  }
  'brave' {
    Start-Process $exe.brave -ArgumentList "--user-data-dir=`"$dir`"", '--no-first-run', '--no-default-browser-check', "--load-extension=`"$chromeExt`"", 'brave://extensions/'
    "Brave (fresh profile $dir): Peekover is loaded unpacked; the setup guide opens on its own."
  }
  'firefox' {
    Start-Process $exe.firefox -ArgumentList '-no-remote', '-profile', "`"$dir`"", 'about:debugging#/runtime/this-firefox'
    "Firefox (fresh profile $dir):"
    "  Load Temporary Add-on... -> $firefoxManifest"
    "  Limits: removed when Firefox closes (no restart / update / guide-once-across-restarts checks);"
    "  install-time permission prompts are skipped; it is not the signed package users get."
  }
  'firefox-signed' {
    if (-not $Xpi -or -not (Test-Path $Xpi)) { throw 'Give the AMO-signed file: -Xpi <path>.xpi' }
    Start-Process $exe.firefox -ArgumentList '-no-remote', '-profile', "`"$dir`"", "`"$Xpi`""
    "Firefox (fresh profile $dir): opening the signed .xpi - accept the install prompt."
    "  It survives restarts: re-run with -Keep to reopen the same profile."
  }
}
