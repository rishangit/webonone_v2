# Optional one-time setup on each IIS server (run as Administrator).
# Sets machine env vars so deploy scripts find paths without editing repo code.
#
# Adjust values for this server, then:
#   powershell -ExecutionPolicy Bypass -File .\deploy-paths.example.ps1

param(
    [string]$RepoRoot = 'C:\Projects',
    [string]$WacsPath = 'C:\Software\win-acme.v2.2.9.1701.x64.pluggable\wacs.exe'
)

$ErrorActionPreference = 'Stop'

[Environment]::SetEnvironmentVariable('WEBONONE_REPO_ROOT', $RepoRoot, 'Machine')
[Environment]::SetEnvironmentVariable('WACS_PATH', $WacsPath, 'Machine')

Write-Host "Set machine env:"
Write-Host "  WEBONONE_REPO_ROOT=$RepoRoot"
Write-Host "  WACS_PATH=$WacsPath"
Write-Host ''
Write-Host 'Open a new PowerShell window, then run scripts from design\deploy (any clone path works after git pull).'
