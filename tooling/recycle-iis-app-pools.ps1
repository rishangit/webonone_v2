# Stop, start, or recycle IIS application pools.
# Usage (from repo root):
#   powershell -ExecutionPolicy Bypass -File tooling/recycle-iis-app-pools.ps1
#   powershell -ExecutionPolicy Bypass -File tooling/recycle-iis-app-pools.ps1 -Action Stop -SkipMissing
#   powershell -ExecutionPolicy Bypass -File tooling/recycle-iis-app-pools.ps1 -Action Start -SkipMissing
#
# Optional env: IIS_APP_POOLS_JSON = path to JSON with { "appPools": ["Identity", ...] }
#
# Stop before npm ci on a live IIS host: Node loads native DLLs from repo
# node_modules (e.g. sharp/libvips). Windows cannot unlink a loaded DLL.

param(
    [ValidateSet('Recycle', 'Stop', 'Start')]
    [string] $Action = 'Recycle',
    [switch] $SkipMissing,
    [int] $WaitSeconds = 120
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

function Get-AppPoolState([string] $Name) {
    [string](Get-Item -LiteralPath "IIS:\AppPools\$Name").State
}

function Wait-AppPoolState([string] $Name, [string] $Desired) {
    $deadline = (Get-Date).AddSeconds($WaitSeconds)
    do {
        $state = Get-AppPoolState $Name
        if ($state -eq $Desired) {
            return
        }
        Start-Sleep -Seconds 1
    } while ((Get-Date) -lt $deadline)
    Write-Error "App pool $Name did not reach $Desired (state=$(Get-AppPoolState $Name))"
}

$done = 0
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

    $state = Get-AppPoolState $name
    Write-Host "$Action app pool: $name (state=$state)"

    switch ($Action) {
        'Stop' {
            if ($state -ne 'Stopped') {
                Stop-WebAppPool -Name $name
            }
            Wait-AppPoolState $name 'Stopped'
        }
        'Start' {
            if ($state -ne 'Started') {
                Start-WebAppPool -Name $name
            }
            Wait-AppPoolState $name 'Started'
        }
        'Recycle' {
            if ($state -eq 'Stopped') {
                Start-WebAppPool -Name $name
                Wait-AppPoolState $name 'Started'
            } else {
                Restart-WebAppPool -Name $name
            }
        }
    }
    $done += 1
}

Write-Host "Done. $Action $done configured pool(s)."
