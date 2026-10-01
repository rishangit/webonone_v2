# GET each production /api/v1/health URL and fail if not HTTP 200 or body lacks status ok.
# Usage (from repo root):
#   powershell -ExecutionPolicy Bypass -File tooling/smoke-production-health.ps1
#
# Optional env: SMOKE_HEALTH_URLS = comma-separated full URLs (overrides smoke-health-urls.json)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$defaultJson = Join-Path $scriptDir 'smoke-health-urls.json'

if ($env:SMOKE_HEALTH_URLS) {
    $urls = @(
        $env:SMOKE_HEALTH_URLS -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ }
    )
} else {
    if (-not (Test-Path -LiteralPath $defaultJson)) {
        Write-Error "Health URL config not found: $defaultJson"
    }
    $config = Get-Content -LiteralPath $defaultJson -Raw | ConvertFrom-Json
    $urls = @($config.healthUrls)
}

if ($urls.Count -eq 0) {
    Write-Error 'No health URLs configured.'
}

$failed = $false
foreach ($url in $urls) {
    Write-Host "Checking $url"
    try {
        $response = Invoke-WebRequest -Uri $url -Method Get -UseBasicParsing -TimeoutSec 60
    } catch {
        Write-Host "FAIL $url - $($_.Exception.Message)"
        $failed = $true
        continue
    }

    if ($response.StatusCode -ne 200) {
        Write-Host "FAIL $url - HTTP $($response.StatusCode)"
        $failed = $true
        continue
    }

    $body = $response.Content
    if ($body -notmatch '"status"\s*:\s*"ok"') {
        Write-Host "FAIL $url - body does not contain `"status`":`"ok`""
        Write-Host $body
        $failed = $true
        continue
    }

    Write-Host "OK $url"
}

if ($failed) {
    Write-Error 'One or more health checks failed.'
}

Write-Host 'All health checks passed.'
