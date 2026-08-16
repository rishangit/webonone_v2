#Requires -Version 5.1
<#
.SYNOPSIS
  Stage AI build output into this folder for IIS.
#>
param(
    [switch]$CleanOnly
)

$ErrorActionPreference = 'Stop'

$DeployDir = $PSScriptRoot
$KeepNames = @('web.config', 'stage-deploy.ps1', 'IIS.md')

function Clear-DeployGenerated {
    Get-ChildItem -Path $DeployDir -Force | ForEach-Object {
        if ($KeepNames -contains $_.Name) {
            return
        }
        Remove-Item -Path $_.FullName -Recurse -Force
    }
}

if ($CleanOnly) {
    Write-Host 'Cleaning ai\deploy (keeping web.config, stage-deploy.ps1, IIS.md) ...'
    Clear-DeployGenerated
    Write-Host 'Done.'
    exit 0
}

$AiRoot = Split-Path $DeployDir -Parent
$FrontendDist = Join-Path $AiRoot 'frontend\dist'
$BackendDist = Join-Path $AiRoot 'backend\dist'

if (-not (Test-Path $FrontendDist)) {
    throw "Frontend build not found at $FrontendDist. Run npm run build -w ai-root first."
}
if (-not (Test-Path $BackendDist)) {
    throw "Backend build not found at $BackendDist. Run npm run build -w ai-root first."
}

function Reset-StagedDirectory {
    param([string]$Path)
    if (Test-Path $Path) {
        Remove-Item $Path -Recurse -Force
    }
    New-Item -ItemType Directory -Path $Path -Force | Out-Null
}

Write-Host 'Staging AI for IIS in ai\deploy ...'

Reset-StagedDirectory -Path (Join-Path $DeployDir 'public')
Reset-StagedDirectory -Path (Join-Path $DeployDir 'dist')

$logsDir = Join-Path $DeployDir 'logs'
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
}

Copy-Item -Path (Join-Path $FrontendDist '*') -Destination (Join-Path $DeployDir 'public') -Recurse -Force
Copy-Item -Path (Join-Path $BackendDist '*') -Destination (Join-Path $DeployDir 'dist') -Recurse -Force

Write-Host ''
Write-Host 'Staging complete. IIS physical path:'
Write-Host "  $DeployDir"
