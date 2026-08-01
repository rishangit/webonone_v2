#Requires -Version 5.1
<#
.SYNOPSIS
  Stage Website build output into this folder for IIS.

.DESCRIPTION
  Copies frontend dist and backend dist into website/deploy so IIS physical path
  can point directly at website\deploy.

  Runtime config: website\backend\.env
  Runtime dependencies: repo root node_modules (from npm install at repo root)
  Preserves web.config and IIS.md. Run via: npm run deploy -w website-root

  Use -CleanOnly to remove generated output and leave only committed deploy files.
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
    Write-Host 'Cleaning website\deploy (keeping web.config, stage-deploy.ps1, IIS.md) ...'
    Clear-DeployGenerated
    Write-Host 'Done.'
    exit 0
}

$WebsiteRoot = Split-Path $DeployDir -Parent
$FrontendDist = Join-Path $WebsiteRoot 'frontend\dist'
$BackendDist = Join-Path $WebsiteRoot 'backend\dist'

if (-not (Test-Path $FrontendDist)) {
    throw "Frontend build not found at $FrontendDist. Run npm run build -w website-root first."
}
if (-not (Test-Path $BackendDist)) {
    throw "Backend build not found at $BackendDist. Run npm run build -w website-root first."
}

function Reset-StagedDirectory {
    param([string]$Path)
    if (Test-Path $Path) {
        Remove-Item $Path -Recurse -Force
    }
    New-Item -ItemType Directory -Path $Path -Force | Out-Null
}

Write-Host 'Staging Website for IIS in website\deploy ...'

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
Write-Host ''
Write-Host 'Folder contents:'
Write-Host '  web.config, stage-deploy.ps1, IIS.md'
Write-Host '  public\   frontend build'
Write-Host '  dist\     backend build'
Write-Host '  logs\     Node stdout/stderr (created empty; IIS writes at runtime)'
Write-Host ''
Write-Host 'Runtime env: website\backend\.env'
Write-Host 'Runtime deps: repo root node_modules (npm install at repo root)'
