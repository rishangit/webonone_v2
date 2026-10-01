# One-time, elevated: let the GitHub Actions runner (NETWORK SERVICE) manage IIS.
# Usage (Administrator PowerShell):
#   powershell -ExecutionPolicy Bypass -File tooling\enable-actions-runner-iis.ps1
#
# The deploy workflow cannot do this. NETWORK SERVICE cannot read
# inetsrv\config\redirection.config until it is in Administrators (or you
# change the runner service Log on to an admin account).

#Requires -RunAsAdministrator

$ErrorActionPreference = 'Stop'

$networkServiceSid = 'S-1-5-20'
$networkServiceName = 'NT AUTHORITY\NETWORK SERVICE'

Write-Host '=== Actions runner IIS enablement ==='
Write-Host "Windows identity: $([System.Security.Principal.WindowsIdentity]::GetCurrent().Name)"

$already = @(Get-LocalGroupMember -Group 'Administrators' -ErrorAction Stop | Where-Object {
    $_.SID.Value -eq $networkServiceSid -or $_.Name -like '*NETWORK SERVICE*'
})
if ($already.Count -gt 0) {
    Write-Host "NETWORK SERVICE is already in Administrators ($($already[0].Name))"
} else {
    Add-LocalGroupMember -Group 'Administrators' -Member $networkServiceSid
    Write-Host 'Added NETWORK SERVICE (S-1-5-20) to local Administrators'
}

$configDir = Join-Path $env:windir 'System32\inetsrv\config'
if (Test-Path -LiteralPath $configDir) {
    icacls $configDir /grant "${networkServiceName}:(OI)(CI)M" | Out-Host
    foreach ($file in @('redirection.config', 'applicationHost.config', 'administration.config')) {
        $path = Join-Path $configDir $file
        if (Test-Path -LiteralPath $path) {
            icacls $path /grant "${networkServiceName}:M" | Out-Host
        }
    }
} else {
    Write-Warning "IIS config dir not found: $configDir"
}

$runners = @(Get-CimInstance Win32_Service | Where-Object { $_.Name -like 'actions.runner*' })
if ($runners.Count -eq 0) {
    Write-Warning 'No Windows service named actions.runner* found. Restart the runner from C:\actions-runner if it is not installed as a service.'
} else {
    foreach ($svc in $runners) {
        Write-Host "Runner service: $($svc.Name) StartName=$($svc.StartName) State=$($svc.State)"
        Restart-Service -Name $svc.Name -Force
        Write-Host "Restarted $($svc.Name)"
    }
}

Write-Host ''
Write-Host 'Verify NETWORK SERVICE is in Administrators:'
Get-LocalGroupMember -Group 'Administrators' | Where-Object {
    $_.SID.Value -eq $networkServiceSid -or $_.Name -like '*NETWORK SERVICE*'
} | Format-Table Name, SID, ObjectClass -AutoSize | Out-Host

Write-Host 'Done. Re-run Deploy staging. The job identity will still be NETWORK SERVICE, but appcmd should work after this restart.'
