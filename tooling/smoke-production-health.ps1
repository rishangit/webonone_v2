# GET each production /api/v1/health URL and fail if not HTTP 200 or body lacks status ok.
# Usage (from repo root):
#   powershell -ExecutionPolicy Bypass -File tooling/smoke-production-health.ps1
#
# Optional env:
#   SMOKE_HEALTH_URLS = comma-separated full URLs (overrides smoke-health-urls.json)
#   SMOKE_HEALTH_URL_FILTER = comma-separated URLs to intersect with the configured list
#     (used by selective deploy; ignored when SMOKE_HEALTH_URLS is set)
#   SMOKE_HEALTH_TIMEOUT_SEC = per-request timeout (default 60)
#   SMOKE_HEALTH_RETRIES = attempts per URL on failure (default 3)
#   SMOKE_HEALTH_RETRY_DELAY_SEC = sleep between attempts (default 15)

param(
    [int] $TimeoutSec = $(if ($env:SMOKE_HEALTH_TIMEOUT_SEC) { [int]$env:SMOKE_HEALTH_TIMEOUT_SEC } else { 60 }),
    [int] $Retries = $(if ($env:SMOKE_HEALTH_RETRIES) { [int]$env:SMOKE_HEALTH_RETRIES } else { 3 }),
    [int] $RetryDelaySec = $(if ($env:SMOKE_HEALTH_RETRY_DELAY_SEC) { [int]$env:SMOKE_HEALTH_RETRY_DELAY_SEC } else { 15 })
)

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

if ($env:SMOKE_HEALTH_URL_FILTER -and $env:SMOKE_HEALTH_URL_FILTER.Trim().Length -gt 0 -and -not $env:SMOKE_HEALTH_URLS) {
    $filterSet = @(
        $env:SMOKE_HEALTH_URL_FILTER -split ',' | ForEach-Object { $_.Trim().ToLowerInvariant() } | Where-Object { $_ }
    )
    $urls = @(
        $urls | Where-Object { $filterSet -contains $_.Trim().ToLowerInvariant() }
    )
    Write-Host "Applied SMOKE_HEALTH_URL_FILTER ($($urls.Count) URL(s))"
}

if ($urls.Count -eq 0) {
    Write-Error 'No health URLs configured.'
}

function Test-HealthUrl {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Url,
        [int] $RequestTimeoutSec
    )

    $response = Invoke-WebRequest -Uri $Url -Method Get -UseBasicParsing -TimeoutSec $RequestTimeoutSec
    if ($response.StatusCode -ne 200) {
        return @{ Ok = $false; Message = "HTTP $($response.StatusCode)" }
    }

    $body = $response.Content
    if ($body -notmatch '"status"\s*:\s*"ok"') {
        return @{ Ok = $false; Message = 'body does not contain "status":"ok"' ; Body = $body }
    }

    return @{ Ok = $true; Message = 'OK' }
}

$failed = $false
foreach ($url in $urls) {
    Write-Host "Checking $url"
    $lastError = $null
    $success = $false

    for ($attempt = 1; $attempt -le $Retries; $attempt++) {
        if ($attempt -gt 1) {
            Write-Host "  Retry $attempt of $Retries after ${RetryDelaySec}s..."
            Start-Sleep -Seconds $RetryDelaySec
        }

        try {
            $result = Test-HealthUrl -Url $url -RequestTimeoutSec $TimeoutSec
            if ($result.Ok) {
                Write-Host "OK $url"
                $success = $true
                break
            }

            $lastError = $result.Message
            if ($result.Body) {
                Write-Host $result.Body
            }
        } catch {
            $lastError = $_.Exception.Message
        }

        if (-not $success -and $attempt -lt $Retries) {
            Write-Host "  Attempt $attempt failed: $lastError"
        }
    }

    if (-not $success) {
        Write-Host "FAIL $url - $lastError"
        $failed = $true
    }
}

if ($failed) {
    Write-Error 'One or more health checks failed.'
}

Write-Host 'All health checks passed.'
