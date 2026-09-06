#Requires -Version 5.1
<#
.SYNOPSIS
  Add IIS bindings so the Design site serves company websites on {slug}.{parent}.

.DESCRIPTION
  Keeps the existing design.webonone.com (or staging-design) admin binding and adds a
  wildcard host for public company sites.

  Production default:  *.live.webonone.com on site webonone.design
  Staging:             *.staging.webonone.com on site staging-webonone.design

  Requires matching DNS and (for HTTPS) a TLS cert for the wildcard host.

.PARAMETER SiteName
  IIS site name. Default: webonone.design

.PARAMETER WildcardHost
  Wildcard host header. Default: *.live.webonone.com

.PARAMETER CertThumbprint
  Optional TLS cert thumbprint (WebHosting store). When omitted, only HTTP is added.

.EXAMPLE
  .\configure-company-site-bindings.ps1

.EXAMPLE
  .\configure-company-site-bindings.ps1 -CertThumbprint 17CED8FD8AB23C6918698043883416B2B9323D44

.EXAMPLE
  .\configure-company-site-bindings.ps1 -SiteName staging-webonone.design -WildcardHost '*.staging.webonone.com'
#>
param(
    [string]$SiteName = 'webonone.design',
    [string]$WildcardHost = '*.live.webonone.com',
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

$companySiteHost = $WildcardHost.TrimStart('*.')

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
    Write-Host "Issue a cert for $WildcardHost (Let's Encrypt DNS-01), then re-run:"
    Write-Host "  .\configure-company-site-bindings.ps1 -SiteName $SiteName -WildcardHost '$WildcardHost' -CertThumbprint <thumbprint>"
    if ($WildcardHost -eq '*.live.webonone.com') {
        Write-Host '  Or: .\issue-live-company-site-cert.ps1'
    }
}

Write-Host ''
Write-Host 'Also required outside IIS:'
Write-Host "  1. DNS: $WildcardHost -> this server IP"
Write-Host "  2. production.env: COMPANY_SITE_HOST=$companySiteHost"
Write-Host '  3. npm run env:apply && npm run deploy:design && npm run deploy:webonone'
Write-Host '     (also deploy:identity if ALLOWED_REDIRECT_URIS changed)'
Write-Host ''
Write-Host 'Current bindings:'
Get-WebBinding -Name $SiteName | ForEach-Object {
    Write-Host "  $($_.protocol) $($_.bindingInformation)"
}
