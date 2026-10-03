# Support feedback status → Cursor CLI listener / poller.
# Install: register a Windows Scheduled Task or run in a persistent session.
#
# Required env (same as tooling/support-feedback-mcp):
#   SUPPORT_API_BASE_URL
#   SUPPORT_FEEDBACK_AUTOMATION_API_KEY
#   FEEDBACK_FIX_TRIGGER_SECRET   (required for -Listen)
#
# Optional:
#   FEEDBACK_FIX_WORKSPACE          (default: repo root above tooling/)
#   FEEDBACK_FIX_POLL_INTERVAL_MS   (default: 120000)
#   FEEDBACK_FIX_AGENT_CMD          (default: agent.cmd on Windows)
#   FEEDBACK_FIX_LISTEN_PORT        (default: 4055)
#   FEEDBACK_FIX_TRIGGER_URL        (Support POSTs here; default http://127.0.0.1:4055/run)
#
# Listener (status-change pipe):  .\tooling\feedback-fix-watcher.ps1 -Listen
# Single poll cycle:              .\tooling\feedback-fix-watcher.ps1 -Once
# Targeted ticket:                .\tooling\feedback-fix-watcher.ps1 -Once -Ticket 0001

param(
  [switch]$Once,
  [switch]$Listen,
  [string]$Ticket
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$envPath = Join-Path $repoRoot 'support\backend\.env'
if (Test-Path $envPath) {
  Get-Content $envPath | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
    $pair = $_ -split '=', 2
    $name = $pair[0].Trim()
    $value = $pair[1].Trim()
    if ($name -in @(
        'SUPPORT_API_BASE_URL',
        'SUPPORT_FEEDBACK_AUTOMATION_API_KEY',
        'FEEDBACK_FIX_TRIGGER_URL',
        'FEEDBACK_FIX_TRIGGER_SECRET'
      )) {
      Set-Item -Path "Env:$name" -Value $value
    }
  }
}

if ($Listen) {
  if (-not $env:FEEDBACK_FIX_TRIGGER_SECRET) {
    Write-Error 'Set FEEDBACK_FIX_TRIGGER_SECRET (support/backend/.env or machine env).'
  }
} else {
  if (-not $env:SUPPORT_API_BASE_URL) {
    Write-Error 'Set SUPPORT_API_BASE_URL (support/backend/.env or machine env).'
  }
  if (-not $env:SUPPORT_FEEDBACK_AUTOMATION_API_KEY) {
    Write-Error 'Set SUPPORT_FEEDBACK_AUTOMATION_API_KEY (support/backend/.env or machine env).'
  }
}

Push-Location (Join-Path $repoRoot 'tooling\support-feedback-mcp')
npm run build --silent 2>$null
if ($LASTEXITCODE -ne 0) { npm run build }
Pop-Location

$nodeArgs = @('tooling/support-feedback-mcp/dist/watcher.js')
if ($Listen) { $nodeArgs += '--listen' }
if ($Once) { $nodeArgs += '--once' }
if ($Ticket) { $nodeArgs += @('--ticket', $Ticket) }

& node @nodeArgs
exit $LASTEXITCODE
