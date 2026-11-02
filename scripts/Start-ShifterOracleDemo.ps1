[CmdletBinding()]
param(
    [string]$OrgUnitId,
    [string]$ClientLibDir = $env:SHF_ORACLE_CLIENT_LIB_DIR,
    [string]$TnsAdmin = $env:TNS_ADMIN,
    [ValidateRange(1, 65535)][int]$Port = 18083,
    [switch]$NonInteractive
)

# Dot-sourcing defines functions only, for isolated launcher checks.
function Assert-ShifterOracleDemoEnvironment {
    $allowed = @('SHF_ORACLE_CONNECT_STRING', 'SHF_ORACLE_USER',
        'SHF_ORACLE_PASSWORD', 'SHF_ORACLE_CLIENT_LIB_DIR', 'SHF_APP_ENV')
    foreach ($entry in Get-ChildItem Env:) {
        if ($entry.Name.StartsWith('SHF_', [StringComparison]::OrdinalIgnoreCase) -and
            $entry.Name -cnotin $allowed) {
            throw 'Read-only demo rejects existing application, fixture, native or writer configuration. Use a clean TEST terminal.'
        }
    }
    if (($env:NODE_ENV -and $env:NODE_ENV -cnotin @('development', 'test')) -or
        ($env:SHF_APP_ENV -and $env:SHF_APP_ENV -cne 'test') -or $env:NODE_OPTIONS) {
        throw 'Read-only demo requires a non-production TEST terminal without NODE_OPTIONS.'
    }
    if (($env:SHF_ORACLE_CONNECT_STRING -and
            $env:SHF_ORACLE_CONNECT_STRING.ToUpperInvariant() -cnotin @('CTIDBT_WFMT', 'CTIDBT_WFMT.WORLD')) -or
        ($env:SHF_ORACLE_USER -and $env:SHF_ORACLE_USER -notmatch '\Ashifter\z')) {
        throw 'Only the approved SHIFTER TEST alias/account is accepted.'
    }
}

function Invoke-ShifterOracleDemoNode {
    param([string]$EntryPoint, [string]$Unit, [int]$ListenPort)
    # Native foreground child: inherits process-only credentials, never argv/file.
    & node $EntryPoint --test-read-only --org-unit $Unit --port $ListenPort
    if ($LASTEXITCODE -ne 0) { throw 'Oracle TEST demonstration stopped or startup failed. See the sanitized status above.' }
}

function Start-ShifterOracleDemo {
    [CmdletBinding()]
    param(
        [string]$OrgUnitId,
        [string]$ClientLibDir = $env:SHF_ORACLE_CLIENT_LIB_DIR,
        [string]$TnsAdmin = $env:TNS_ADMIN,
        [ValidateRange(1, 65535)][int]$Port = 18083,
        [switch]$NonInteractive
    )
    $ErrorActionPreference = 'Stop'
    Assert-ShifterOracleDemoEnvironment
    if (-not $OrgUnitId) {
        if ($NonInteractive) { throw 'An explicitly authorized exact TEST organizational unit code is required.' }
        # ASCII source is intentional for Windows PowerShell 5.1 UTF-8-without-BOM.
        # Hebrew is generated, not dependent on the terminal's script decoding.
        $hebrew = -join (@(0x05E7,0x05D5,0x05D3,0x20,0x05D9,0x05D7,0x05D9,0x05D3,0x05D4) |
            ForEach-Object { [char]$_ })
        $OrgUnitId = Read-Host -Prompt "$hebrew / Authorized TEST unit code (not employee ID/password; no default; exact read scope only)"
    }
    if ([string]::IsNullOrWhiteSpace($OrgUnitId) -or $OrgUnitId.Length -gt 8 -or
        $OrgUnitId -match '[\s\p{Cc}*%?\\/,;]' -or $OrgUnitId -cin @('-1', 'null')) {
        throw 'Supply one exact authorized TEST unit code, 1-8 characters; no wildcard/list/default.'
    }
    if (-not $ClientLibDir) {
        if ($NonInteractive) { throw 'Oracle Client 19.3 bin directory is required.' }
        $ClientLibDir = Read-Host -Prompt 'Existing Oracle Client 19.3 bin directory containing oci.dll (local absolute path)'
    }
    if (-not $TnsAdmin) {
        if ($NonInteractive) { throw 'TNS_ADMIN directory is required.' }
        $TnsAdmin = Read-Host -Prompt 'Existing TNS_ADMIN network/admin directory (local absolute path)'
    }
    if (-not (Test-Path -LiteralPath (Join-Path $ClientLibDir 'oci.dll') -PathType Leaf)) {
        throw 'Existing Oracle Client directory must contain oci.dll. No client is installed/downloaded by this launcher.'
    }
    $keys = @('SHF_ORACLE_CONNECT_STRING', 'SHF_ORACLE_USER', 'SHF_ORACLE_PASSWORD',
        'SHF_ORACLE_CLIENT_LIB_DIR', 'TNS_ADMIN', 'NODE_ENV', 'SHF_APP_ENV')
    $previous = @{}
    foreach ($key in $keys) { $previous[$key] = [Environment]::GetEnvironmentVariable($key, 'Process') }
    try {
        . (Join-Path $PSScriptRoot 'Set-ShifterOracleEnvironment.ps1')
        $alias = if ($env:SHF_ORACLE_CONNECT_STRING) { $env:SHF_ORACLE_CONNECT_STRING } else { 'CTIDBT_WFMT' }
        Set-ShifterOracleEnvironment -Profile test -ConnectString $alias -ClientLibDir $ClientLibDir `
            -TnsAdmin $TnsAdmin -NonInteractive:$NonInteractive
        $env:NODE_ENV = 'test'
        $env:SHF_APP_ENV = 'test'
        Write-Output 'Starting Oracle TEST READ-ONLY demonstration. Selected exact unit is your authorization attestation, not independent DB identity proof.'
        Write-Output 'Synthetic Administrator is not a real user login. All commands/writes are disabled. Keep this terminal open; Ctrl+C stops the host.'
        $entry = Join-Path (Split-Path $PSScriptRoot -Parent) 'backend/fixture-slice/oracle-demo-host.mts'
        Invoke-ShifterOracleDemoNode -EntryPoint $entry -Unit $OrgUnitId -ListenPort $Port
    } finally {
        foreach ($key in $keys) { [Environment]::SetEnvironmentVariable($key, $previous[$key], 'Process') }
        $previous.Clear()
    }
}

if ($MyInvocation.InvocationName -ne '.') {
    try {
        Start-ShifterOracleDemo -OrgUnitId $OrgUnitId -ClientLibDir $ClientLibDir `
            -TnsAdmin $TnsAdmin -Port $Port -NonInteractive:$NonInteractive
    } catch {
        # Do not echo arbitrary exception messages/paths/driver diagnostics.
        Write-Error 'Oracle TEST read-only demo could not start or stopped with an error. Check exact unit, process Oracle inputs, existing Client19.3/TNS paths, TEST browser assets and free port18083. No fallback or automatic retry was performed.'
        exit 1
    }
}
