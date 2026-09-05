#Requires -Version 5.1
<#
.SYNOPSIS
  Issue a Let's Encrypt wildcard cert for *.staging.webonone.com and bind HTTPS in IIS.

.DESCRIPTION
  Paths are resolved automatically:
  - Scripts live next to this file ($PSScriptRoot) — no repo path in git.
  - wacs.exe: -WacsPath param, then env WACS_PATH, then PATH, then common install folders.

  Optional machine env (set once per server): WEBONONE_REPO_ROOT, WACS_PATH
  See deploy-paths.example.ps1

.EXAMPLE
  cd <any-clone>\design\deploy
  .\issue-staging-company-site-cert.ps1
#>
param(
    [string]$SiteName = 'staging-webonone.design',
    [string]$WildcardHost = '*.staging.webonone.com',
    [string]$EmailAddress = 'noreply@webonone.com',
    [string]$WacsPath = '',
    [string]$FriendlyName = 'staging-company-sites-wildcard'
)

$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'deploy-paths.ps1')

$dnsScript = Join-Path $DeployDir 'namecheap-dns-acme.ps1'
$bindingScript = Join-Path $DeployDir 'configure-company-site-bindings.ps1'
$WacsPath = Find-WacsExecutable -ExplicitPath $WacsPath

if (-not (Test-Path $dnsScript)) {
    throw "Missing $dnsScript"
}

Write-Host "Repo root:  $RepoRoot"
Write-Host "Deploy dir: $DeployDir"
Write-Host "win-acme:   $WacsPath"
Write-Host ''
Write-Host "Issuing wildcard certificate for $WildcardHost ..."
Write-Host 'When prompted below, add the TXT record in Namecheap Advanced DNS.'
Write-Host ''

& $WacsPath `
    --source manual `
    --host $WildcardHost `
    --validation script `
    --validationmode dns-01 `
    --dnscreatescript $dnsScript `
    --dnscreatescriptarguments 'create {Identifier} {RecordName} {Token}' `
    --dnsdeletescript $dnsScript `
    --dnsdeletescriptarguments 'delete {Identifier} {RecordName} {Token}' `
    --store certificatestore `
    --certificatestore WebHosting `
    --accepttos `
    --emailaddress $EmailAddress `
    --friendlyname $FriendlyName `
    --nocache

if ($LASTEXITCODE -ne 0) {
    throw "win-acme failed with exit code $LASTEXITCODE"
}

$cert = Get-ChildItem Cert:\LocalMachine\WebHosting |
    Where-Object { $_.DnsNameList.Unicode -contains $WildcardHost } |
    Sort-Object NotAfter -Descending |
    Select-Object -First 1

if (-not $cert) {
    throw "Certificate for $WildcardHost was not found in WebHosting store after issuance."
}

Write-Host ''
Write-Host "Certificate issued: $($cert.Subject)"
Write-Host "Thumbprint: $($cert.Thumbprint)"
Write-Host ''

& $bindingScript -SiteName $SiteName -WildcardHost $WildcardHost -CertThumbprint $cert.Thumbprint

Write-Host ''
Write-Host "HTTPS ready: https://medi-clinic.staging.webonone.com/"
Write-Host 'Renewals use the same DNS script via the win-acme scheduled task.'
