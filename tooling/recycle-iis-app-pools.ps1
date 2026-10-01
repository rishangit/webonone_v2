# Recycle IIS application pools after deploy.
# Usage (from repo root):
#   powershell -ExecutionPolicy Bypass -File tooling/recycle-iis-app-pools.ps1
#   powershell -ExecutionPolicy Bypass -File tooling/recycle-iis-app-pools.ps1 -SkipMissing
#
# Optional env: IIS_APP_POOLS_JSON = path to JSON with { "appPools": ["Identity", ...] }

param(
    [switch] $SkipMissing
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$defaultJson = Join-Path $scriptDir 'iis-app-pools.json'
$configPath = if ($env:IIS_APP_POOLS_JSON) { $env:IIS_APP_POOLS_JSON } else { $defaultJson }

if (-not (Test-Path -LiteralPath $configPath)) {
    Write-Error "App pool config not found: $configPath"
}

$config = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
$pools = @($config.appPools)
if ($pools.Count -eq 0) {
    Write-Error "No appPools listed in $configPath"
}

Import-Module WebAdministration -ErrorAction Stop

foreach ($name in $pools) {
    $poolPath = "IIS:\AppPools\$name"
    if (-not (Test-Path -LiteralPath $poolPath)) {
        $msg = "App pool not found: $name"
        if ($SkipMissing) {
            Write-Warning $msg
            continue
        }
        Write-Error $msg
    }
    Write-Host "Recycling app pool: $name"
    Restart-WebAppPool -Name $name
}

Write-Host "Done. Recycled $($pools.Count) configured pool(s)."
