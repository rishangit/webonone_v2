#Requires -Version 5.1
<#
.SYNOPSIS
  Add IIS bindings so the Design site serves company websites on {slug}.staging.webonone.com.

.DESCRIPTION
  Keeps the existing staging-design.webonone.com admin binding and adds a wildcard host
  for public company sites. Requires DNS *.staging.webonone.com and a matching TLS cert.

.PARAMETER SiteName
  IIS site name. Default: staging-webonone.design

.PARAMETER WildcardHost
  Wildcard host header. Default: *.staging.webonone.com

.PARAMETER CertThumbprint
  Optional TLS cert thumbprint (WebHosting store). When omitted, only HTTP is added.

.EXAMPLE
  .\configure-company-site-bindings.ps1

.EXAMPLE
  .\configure-company-site-bindings.ps1 -CertThumbprint 17CED8FD8AB23C6918698043883416B2B9323D44
#>
param(
    [string]$SiteName = 'staging-webonone.design',
    [string]$WildcardHost = '*.staging.webonone.com',
    [string]$CertThumbprint = ''
)

$ErrorActionPreference = 'Stop'
Import-Module WebAdministration

function Test-SiteBinding {
    param(
        [string]$Protocol,
        [string]$HostHeader
    )
    return Get-WebBinding -Name $SiteName -Protocol $Protocol |
        Where-Object { $_.bindingInformation -eq "*:80:$HostHeader" -or $_.bindingInformation -eq "*:443:$HostHeader" }
}

if (-not (Get-Website -Name $SiteName -ErrorAction SilentlyContinue)) {
    throw "IIS site '$SiteName' was not found."
}

Write-Host "Configuring company-site bindings on '$SiteName' for host '$WildcardHost' ..."

if (-not (Test-SiteBinding -Protocol 'http' -HostHeader $WildcardHost)) {
    New-WebBinding -Name $SiteName -Protocol 'http' -Port 80 -HostHeader $WildcardHost | Out-Null
    Write-Host 'Added HTTP binding.'
} else {
    Write-Host 'HTTP binding already exists.'
}

if ($CertThumbprint) {
    $cert = Get-ChildItem "Cert:\LocalMachine\WebHosting\$CertThumbprint" -ErrorAction SilentlyContinue
    if (-not $cert) {
        throw "Certificate $CertThumbprint was not found in LocalMachine\WebHosting."
    }

    if (-not (Test-SiteBinding -Protocol 'https' -HostHeader $WildcardHost)) {
        New-WebBinding -Name $SiteName -Protocol 'https' -Port 443 -HostHeader $WildcardHost -SslFlags 1 | Out-Null
        Write-Host 'Added HTTPS binding.'
    } else {
        Write-Host 'HTTPS binding already exists.'
    }

    $binding = Get-WebBinding -Name $SiteName -Protocol 'https' |
        Where-Object { $_.bindingInformation -eq "*:443:$WildcardHost" }
    $binding.AddSslCertificate($CertThumbprint, 'WebHosting')
    Write-Host "Attached certificate: $($cert.Subject)"
} else {
    Write-Host ''
    Write-Host 'HTTPS binding skipped (no -CertThumbprint).'
    Write-Host 'Issue a cert for *.staging.webonone.com (Let''s Encrypt DNS-01), then re-run:'
    Write-Host "  .\configure-company-site-bindings.ps1 -CertThumbprint <thumbprint>"
}

Write-Host ''
Write-Host 'Also required outside IIS:'
Write-Host '  1. DNS: *.staging.webonone.com -> this server IP'
Write-Host '  2. production.env: COMPANY_SITE_HOST=staging.webonone.com'
Write-Host '  3. npm run env:apply && npm run deploy:design && npm run deploy:webonone'
Write-Host ''
Write-Host 'Current bindings:'
Get-WebBinding -Name $SiteName | ForEach-Object {
    Write-Host "  $($_.protocol) $($_.bindingInformation)"
}
