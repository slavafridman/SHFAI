param(
    [Parameter(Mandatory = $true)]
    [string]$ConnectString,
    [string]$UserName = 'SHIFTER',
    [switch]$ConnectivityOnly
)

$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$check = Join-Path $root 'apps\api\dist\oracle\check.js'
if (-not (Test-Path -LiteralPath $check -PathType Leaf)) {
    throw 'Build the API before running the approved Oracle diagnostic.'
}

$prompt = 'Approved Oracle connectivity and three-table column metadata only'
if ($ConnectivityOnly) {
    $prompt = 'Approved Oracle connectivity only; no metadata or business data'
}
$credential = Get-Credential -UserName $UserName -Message $prompt
if ($null -eq $credential) {
    throw 'Credential prompt cancelled. No Oracle check performed.'
}

$names = @('ORACLE_USER', 'ORACLE_PASSWORD', 'ORACLE_CONNECT_STRING', 'ORACLE_READ_ONLY', 'ORACLE_ENABLED')
$previous = @{}
foreach ($name in $names) {
    $previous[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
}

try {
    $env:ORACLE_USER = $credential.UserName
    $env:ORACLE_PASSWORD = $credential.GetNetworkCredential().Password
    $env:ORACLE_CONNECT_STRING = $ConnectString
    $env:ORACLE_READ_ONLY = 'true'
    $env:ORACLE_ENABLED = 'true'
    if ($ConnectivityOnly) {
        & node $check
    } else {
        & node $check '--metadata'
    }
    if ($LASTEXITCODE -ne 0) {
        throw 'Approved Oracle diagnostic failed. Review the redacted error code; no automatic retry is performed.'
    }
} finally {
    foreach ($name in $names) {
        [Environment]::SetEnvironmentVariable($name, $previous[$name], 'Process')
    }
    $previous.Clear()
    Remove-Variable credential
}
