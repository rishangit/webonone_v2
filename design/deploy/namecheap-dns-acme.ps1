#Requires -Version 5.1
<#
.SYNOPSIS
  win-acme DNS validation helper for Namecheap (manual TXT or optional API).

.DESCRIPTION
  Called by win-acme with:
    create {Identifier} {RecordName} {Token}
    delete {Identifier} {RecordName} {Token}

  Without Namecheap API env vars, prints the TXT record to add in Namecheap
  Advanced DNS and polls public DNS until Let's Encrypt can validate.

  Optional env (for automated renewals):
    NAMECHEAP_API_USER, NAMECHEAP_API_KEY, NAMECHEAP_CLIENT_IP
#>
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidateSet('create', 'delete')]
    [string]$Action,

    [Parameter(Mandatory = $true, Position = 1)]
    [string]$Identifier,

    [Parameter(Mandatory = $true, Position = 2)]
    [string]$RecordName,

    [Parameter(Mandatory = $true, Position = 3)]
    [string]$Token
)

$ErrorActionPreference = 'Stop'

function Get-NamecheapTxtHost {
    param([string]$Fqdn)
    $suffix = '.webonone.com'
    if (-not $Fqdn.EndsWith($suffix, [StringComparison]::OrdinalIgnoreCase)) {
        return $Fqdn.TrimEnd('.')
    }
    return $Fqdn.Substring(0, $Fqdn.Length - $suffix.Length)
}

function Test-AcmeTxtRecord {
    param(
        [string]$Fqdn,
        [string]$Expected
    )
    $servers = @('8.8.8.8', '1.1.1.1', 'dns1.registrar-servers.com')
    foreach ($server in $servers) {
        try {
            $answers = Resolve-DnsName -Name $Fqdn -Type TXT -Server $server -ErrorAction Stop
            foreach ($answer in @($answers)) {
                foreach ($value in @($answer.Strings)) {
                    if ($value -eq $Expected) {
                        Write-Host "TXT visible via $server"
                        return $true
                    }
                }
            }
        } catch {
            continue
        }
    }
    return $false
}

$txtHost = Get-NamecheapTxtHost -Fqdn $RecordName

if ($Action -eq 'delete') {
    Write-Host "ACME validation complete. You may remove this Namecheap TXT record if you added it manually:"
    Write-Host "  Host: $txtHost"
    Write-Host "  Value: $Token"
    exit 0
}

Write-Host ''
Write-Host '=== Namecheap DNS TXT (Let''s Encrypt validation) ==='
Write-Host "Domain zone: webonone.com"
Write-Host "Type:        TXT Record"
Write-Host "Host:        $txtHost"
Write-Host "Value:       $Token"
Write-Host ''
Write-Host 'Advanced DNS -> Add New Record -> TXT -> save, then wait for propagation.'
Write-Host 'Polling public DNS (up to 30 minutes)...'
Write-Host ''

$deadline = (Get-Date).AddMinutes(30)
while ((Get-Date) -lt $deadline) {
    if (Test-AcmeTxtRecord -Fqdn $RecordName -Expected $Token) {
        Write-Host "TXT record visible at $RecordName"
        exit 0
    }
    Start-Sleep -Seconds 20
}

Write-Host "Timed out waiting for TXT record at $RecordName"
exit 1
