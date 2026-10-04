# Stop, start, or recycle IIS application pools via appcmd.exe
# (avoids WebAdministration IIS: drive, which errors on redirection.config).
#
# Usage (from repo root):
#   powershell -ExecutionPolicy Bypass -File tooling/recycle-iis-app-pools.ps1
#   powershell -ExecutionPolicy Bypass -File tooling/recycle-iis-app-pools.ps1 -Action Stop -SkipMissing
#   powershell -ExecutionPolicy Bypass -File tooling/recycle-iis-app-pools.ps1 -Action Start -SkipMissing
#
# Optional env:
#   IIS_APP_POOLS_JSON = path to JSON with { "appPools": ["Identity", ...] }
#   IIS_APP_POOLS = comma-separated pool names (overrides JSON when set)
#
# Stop before npm ci on a live IIS host: Node loads native DLLs from repo
# node_modules (e.g. sharp/libvips). Windows cannot unlink a loaded DLL.
#
# appcmd requires a local Administrators account. NETWORK SERVICE cannot
# read C:\Windows\System32\inetsrv\config\redirection.config.

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

if ($env:IIS_APP_POOLS -and $env:IIS_APP_POOLS.Trim().Length -gt 0) {
    $pools = @(
        $env:IIS_APP_POOLS -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ }
    )
    Write-Host "Using IIS_APP_POOLS override ($($pools.Count) pool(s))"
} else {
    if (-not (Test-Path -LiteralPath $configPath)) {
        Write-Error "App pool config not found: $configPath"
    }

    $config = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
    $pools = @($config.appPools)
}

if ($pools.Count -eq 0) {
    Write-Error "No appPools listed (IIS_APP_POOLS empty or missing from $configPath)"
}

$appCmd = Join-Path $env:windir 'System32\inetsrv\appcmd.exe'
$sysNative = Join-Path $env:windir 'Sysnative\inetsrv\appcmd.exe'
if (-not (Test-Path -LiteralPath $appCmd) -and (Test-Path -LiteralPath $sysNative)) {
    $appCmd = $sysNative
}
if (-not (Test-Path -LiteralPath $appCmd)) {
    Write-Error "IIS appcmd.exe not found (expected $appCmd). Install IIS Management Tools."
}

function Get-IisPermissionHelp {
    $who = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
    return "IIS appcmd failed as '$who'. NETWORK SERVICE cannot read inetsrv\config\redirection.config. Set the GitHub Actions runner Windows service Log on to a local Administrators account, then restart the service. See tooling/CICD.md"
}

function Invoke-AppCmd {
    param(
        [Parameter(Mandatory = $true)]
        [string[]] $AppCmdArgs,
        [switch] $AllowFail
    )
    $output = & $appCmd @AppCmdArgs 2>&1
    $code = $LASTEXITCODE
    $text = (($output | ForEach-Object { "$_" }) -join "`n").Trim()
    if ($code -ne 0 -and -not $AllowFail) {
        if ($text -match 'insufficient permissions' -or $text -match 'Not enough privilege' -or $text -match 'Access is denied') {
            Write-Error "$(Get-IisPermissionHelp) Detail: $text"
        }
        Write-Error "appcmd $($AppCmdArgs -join ' ') failed (exit $code): $text"
    }
    return @{ Code = $code; Text = $text }
}

$probe = Invoke-AppCmd -AppCmdArgs @('list', 'apppool') -AllowFail
if ($probe.Code -ne 0) {
    if ($probe.Text -match 'insufficient permissions' -or $probe.Text -match 'Not enough privilege' -or $probe.Text -match 'Access is denied' -or $probe.Text -match 'redirection.config') {
        Write-Error "$(Get-IisPermissionHelp) Detail: $($probe.Text)"
    }
    Write-Error "appcmd list apppool failed (exit $($probe.Code)): $($probe.Text)"
}

function Get-AppPoolState([string] $Name) {
    $result = Invoke-AppCmd -AppCmdArgs @('list', 'apppool', "/name:$Name", '/text:state')
    return $result.Text.Trim()
}

function Test-AppPoolExists([string] $Name) {
    $result = Invoke-AppCmd -AppCmdArgs @('list', 'apppool', "/name:$Name") -AllowFail
    return ($result.Code -eq 0)
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
    if (-not (Test-AppPoolExists $name)) {
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
                Invoke-AppCmd -AppCmdArgs @('stop', 'apppool', "/apppool.name:$name") | Out-Null
            }
            Wait-AppPoolState $name 'Stopped'
        }
        'Start' {
            if ($state -ne 'Started') {
                Invoke-AppCmd -AppCmdArgs @('start', 'apppool', "/apppool.name:$name") | Out-Null
            }
            Wait-AppPoolState $name 'Started'
        }
        'Recycle' {
            if ($state -eq 'Stopped') {
                Invoke-AppCmd -AppCmdArgs @('start', 'apppool', "/apppool.name:$name") | Out-Null
                Wait-AppPoolState $name 'Started'
            } else {
                Invoke-AppCmd -AppCmdArgs @('recycle', 'apppool', "/apppool.name:$name") | Out-Null
            }
        }
    }
    $done += 1
}

Write-Host "Done. $Action $done configured pool(s)."
