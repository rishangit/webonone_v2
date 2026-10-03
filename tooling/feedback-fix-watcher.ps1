# Runs the Support feedback queue watcher (poll + Cursor CLI agent).
# Install: register a Windows Scheduled Task or run in a persistent session.
#
# Required env (same as tooling/support-feedback-mcp):
#   SUPPORT_API_BASE_URL
#   SUPPORT_FEEDBACK_AUTOMATION_API_KEY
#
# Optional:
#   FEEDBACK_FIX_WORKSPACE          (default: repo root above tooling/)
#   FEEDBACK_FIX_POLL_INTERVAL_MS   (default: 120000)
#   FEEDBACK_FIX_AGENT_CMD          (default: agent.cmd on Windows)
#
# One-shot (dry run poll):  .\tooling\feedback-fix-watcher.ps1 -Once

param(
  [switch]$Once
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
    if ($name -in @('SUPPORT_API_BASE_URL', 'SUPPORT_FEEDBACK_AUTOMATION_API_KEY')) {
      Set-Item -Path "Env:$name" -Value $value
    }
  }
}

if (-not $env:SUPPORT_API_BASE_URL) {
  Write-Error 'Set SUPPORT_API_BASE_URL (support/backend/.env or machine env).'
}
if (-not $env:SUPPORT_FEEDBACK_AUTOMATION_API_KEY) {
  Write-Error 'Set SUPPORT_FEEDBACK_AUTOMATION_API_KEY (support/backend/.env or machine env).'
}

Push-Location (Join-Path $repoRoot 'tooling\support-feedback-mcp')
npm run build --silent 2>$null
if ($LASTEXITCODE -ne 0) { npm run build }
Pop-Location

$nodeArgs = @('tooling/support-feedback-mcp/dist/watcher.js')
if ($Once) { $nodeArgs += '--once' }

& node @nodeArgs
exit $LASTEXITCODE
