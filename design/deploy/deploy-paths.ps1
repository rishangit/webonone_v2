#Requires -Version 5.1
<#
.SYNOPSIS
  Resolve repo-root and win-acme (wacs.exe) paths on any IIS server.

.DESCRIPTION
  Scripts in design\deploy dot-source this file. Override discovery with optional
  machine env vars (set once per server in System Environment Variables):

    WEBONONE_REPO_ROOT  — git clone root (parent of design\)
    WACS_PATH           — full path to wacs.exe

  Scripts always use $DeployDir = folder containing this file (portable in git).
#>

function Get-WebOnOneRepoRoot {
    if ($env:WEBONONE_REPO_ROOT) {
        $root = $env:WEBONONE_REPO_ROOT.TrimEnd('\')
        if (-not (Test-Path $root)) {
            throw "WEBONONE_REPO_ROOT is set but not found: $root"
        }
        return (Resolve-Path $root).Path
    }

    $deployDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
    return (Resolve-Path (Join-Path $deployDir '..\..')).Path
}

function Find-WacsExecutable {
    param([string]$ExplicitPath = '')

    if ($ExplicitPath) {
        if (-not (Test-Path $ExplicitPath)) {
            throw "wacs.exe not found at -WacsPath: $ExplicitPath"
        }
        return (Resolve-Path $ExplicitPath).Path
    }

    if ($env:WACS_PATH) {
        if (-not (Test-Path $env:WACS_PATH)) {
            throw "WACS_PATH is set but not found: $($env:WACS_PATH)"
        }
        return (Resolve-Path $env:WACS_PATH).Path
    }

    $command = Get-Command wacs.exe -ErrorAction SilentlyContinue
    if ($command) {
        return $command.Source
    }

    $searchRoots = @(
        $env:ProgramFiles,
        ${env:ProgramFiles(x86)},
        'C:\Software',
        'C:\Tools',
        'C:\ProgramData\win-acme'
    ) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -Unique

    foreach ($root in $searchRoots) {
        $found = Get-ChildItem -Path $root -Filter 'wacs.exe' -Recurse -ErrorAction SilentlyContinue -Depth 4 |
            Sort-Object LastWriteTime -Descending |
            Select-Object -First 1
        if ($found) {
            return $found.FullName
        }
    }

    throw @(
        'win-acme (wacs.exe) was not found.',
        'Install win-acme on this server, add wacs.exe to PATH, or set machine env WACS_PATH.',
        'Example: WACS_PATH=C:\Software\win-acme.v2.2.9.1701.x64.pluggable\wacs.exe'
    ) -join ' '
}

$DeployDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
$RepoRoot = Get-WebOnOneRepoRoot
