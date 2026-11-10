# Capture Vercel production runtime logs into logs\vercel\ while this PC is on.
#   .\scripts\tail-vercel-logs.ps1           # keep polling until Ctrl+C
#   .\scripts\tail-vercel-logs.ps1 --once    # one poll (for Task Scheduler)
# Needs VERCEL_TOKEN (see docs\logging.md). Options are environment variables
# documented at the top of scripts\tail-vercel-logs.js.

$ErrorActionPreference = 'Stop'

if (-not $env:VERCEL_TOKEN) {
    $env:VERCEL_TOKEN = [Environment]::GetEnvironmentVariable('VERCEL_TOKEN', 'User')
}
if (-not $env:VERCEL_TOKEN) {
    Write-Host 'VERCEL_TOKEN is not set. Create a token at https://vercel.com/account/tokens, then run:' -ForegroundColor Red
    Write-Host '  $t = Read-Host "Vercel token"; [Environment]::SetEnvironmentVariable("VERCEL_TOKEN", $t, "User")'
    exit 2
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host 'Node.js is not on PATH. Install Node 20+ from https://nodejs.org/' -ForegroundColor Red
    exit 2
}

Set-Location (Split-Path -Parent $PSScriptRoot)
& node scripts/tail-vercel-logs.js @args
exit $LASTEXITCODE
