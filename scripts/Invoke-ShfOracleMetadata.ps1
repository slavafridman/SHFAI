param(
    [Parameter(Mandatory = $true)]
    [string]$ConnectString,
    [string]$UserName = 'SHIFTER',
    [ValidateSet('thin', 'thick')]
    [string]$Mode = 'thin',
    [string]$ClientLibDir,
    [string]$ConfigDir,
    [switch]$UseEnvironmentPassword,
    [switch]$ConnectivityOnly
)

$ErrorActionPreference = 'Stop'
if ($Mode -eq 'thick' -and ([string]::IsNullOrWhiteSpace($ClientLibDir) -or -not [IO.Path]::IsPathRooted($ClientLibDir))) {
    throw 'Thick mode requires an explicitly supplied absolute ClientLibDir.'
}
if ($Mode -eq 'thin' -and -not [string]::IsNullOrWhiteSpace($ClientLibDir)) {
    throw 'ClientLibDir requires explicit Thick mode.'
}
$root = Split-Path $PSScriptRoot -Parent
$check = Join-Path $root 'apps\api\dist\oracle\check.js'
if (-not (Test-Path -LiteralPath $check -PathType Leaf)) {
    throw 'Build the API before running the approved Oracle diagnostic.'
}

$prompt = 'Approved Oracle connectivity and three-table column metadata only'
if ($ConnectivityOnly) {
    $prompt = 'Approved Oracle connectivity only; no metadata or business data'
}
$credential = $null
if ($UseEnvironmentPassword) {
    if ([string]::IsNullOrEmpty($env:ORACLE_PASSWORD)) {
        throw 'ORACLE_PASSWORD is required in the process environment. No Oracle check performed.'
    }
} else {
    $credential = Get-Credential -UserName $UserName -Message $prompt
    if ($null -eq $credential) {
        throw 'Credential prompt cancelled. No Oracle check performed.'
    }
}

$names = @('ORACLE_USER', 'ORACLE_PASSWORD', 'ORACLE_CONNECT_STRING', 'ORACLE_READ_ONLY', 'ORACLE_ENABLED',
    'ORACLE_MODE', 'ORACLE_CLIENT_LIB_DIR', 'ORACLE_CONFIG_DIR')
$previous = @{}
foreach ($name in $names) {
    $previous[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
}

try {
    if ($UseEnvironmentPassword) {
        $env:ORACLE_USER = $UserName
    } else {
        $env:ORACLE_USER = $credential.UserName
        $env:ORACLE_PASSWORD = $credential.GetNetworkCredential().Password
    }
    $env:ORACLE_CONNECT_STRING = $ConnectString
    $env:ORACLE_READ_ONLY = 'true'
    $env:ORACLE_ENABLED = 'true'
    $env:ORACLE_MODE = $Mode
    [Environment]::SetEnvironmentVariable('ORACLE_CLIENT_LIB_DIR', $ClientLibDir, 'Process')
    if (-not [string]::IsNullOrWhiteSpace($ConfigDir)) {
        $env:ORACLE_CONFIG_DIR = $ConfigDir
    }
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
