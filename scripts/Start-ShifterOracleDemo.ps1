[CmdletBinding()]
param(
    [string]$OrgUnitId = $env:SHF_ORACLE_DEMO_ORG_UNIT_ID,
    [switch]$AllTestUnits,
    [string]$ClientLibDir = $env:SHF_ORACLE_CLIENT_LIB_DIR,
    [string]$TnsAdmin = $env:TNS_ADMIN,
    [ValidateRange(1, 65535)][int]$Port = 18083,
    [switch]$NonInteractive
)

# Dot-sourcing defines functions only, for isolated launcher checks.
function New-ShifterOracleDemoFailure {
    param([string]$Code)
    $failure = New-Object System.InvalidOperationException('Oracle demo stopped; use the safe status code.')
    $failure.Data['ShifterOracleDemoCode'] = $Code
    return $failure
}

function Format-ShifterOracleDemoFailure {
    param([System.Exception]$Exception)
    # Only locally assigned codes select constant text. Never inspect raw messages.
    $code = $Exception.Data['ShifterOracleDemoCode']
    $action = switch -CaseSensitive ($code) {
        'DEMO_UNIT_REQUIRED' {
            'Set SHF_ORACLE_DEMO_ORG_UNIT_ID in your launcher environment or supply -OrgUnitId; no unit prompt or connection attempted'
        }
        'DEMO_UNIT_INVALID' { 'Supply one exact authorized TEST team/unit code, 1-8 characters, without whitespace, wildcards or lists. Ask an authorized operator if unknown. No Oracle connection attempted.' }
        'DEMO_SCOPE_CONFLICT' { 'Use -AllTestUnits or an explicit -OrgUnitId, never both. No Oracle connection attempted.' }
        'DEMO_ENVIRONMENT_REJECTED' { 'Use a clean non-production TEST terminal with only approved Oracle inputs; application/native/writer settings, NODE_OPTIONS and unapproved target/account are rejected. No Oracle connection attempted.' }
        'DEMO_CLIENT_DIR_REQUIRED' { 'Supply the existing local absolute Oracle Client 19.3 bin directory. No Oracle connection attempted.' }
        'DEMO_TNS_REQUIRED' { 'Supply the existing local absolute TNS_ADMIN network/admin directory. No Oracle connection attempted.' }
        'DEMO_OCI_BINARY_MISSING' { 'The supplied Oracle Client directory must contain oci.dll. Nothing is installed or downloaded. No Oracle connection attempted.' }
        'DEMO_INPUT_SETUP_FAILED' { 'Oracle process input preparation failed. Check approved process inputs and secure input availability; no credential verification or Oracle connection attempted.' }
        'DEMO_NODE_STARTUP_FAILED' { 'Node host could not start or stopped with an error. See its sanitized status above, if available. This code alone does not establish an Oracle login failure; no fallback or automatic retry was performed.' }
        default {
            $code = 'DEMO_LAUNCHER_FAILED'
            'Launcher could not start or stopped with an error. Check approved TEST configuration. No fallback or automatic retry was performed.'
        }
    }
    return "Oracle demo [$code]: $action"
}

function Assert-ShifterOracleDemoEnvironment {
    $allowed = @('SHF_ORACLE_CONNECT_STRING', 'SHF_ORACLE_USER',
        'SHF_ORACLE_PASSWORD', 'SHF_ORACLE_CLIENT_LIB_DIR', 'SHF_APP_ENV',
        'SHF_ORACLE_DEMO_ORG_UNIT_ID')
    foreach ($entry in Get-ChildItem Env:) {
        if ($entry.Name.StartsWith('SHF_', [StringComparison]::OrdinalIgnoreCase) -and
            $entry.Name -cnotin $allowed) {
            throw (New-ShifterOracleDemoFailure 'DEMO_ENVIRONMENT_REJECTED')
        }
    }
    if (($env:NODE_ENV -and $env:NODE_ENV -cnotin @('development', 'test')) -or
        ($env:SHF_APP_ENV -and $env:SHF_APP_ENV -cne 'test') -or $env:NODE_OPTIONS) {
        throw (New-ShifterOracleDemoFailure 'DEMO_ENVIRONMENT_REJECTED')
    }
    if (($env:SHF_ORACLE_CONNECT_STRING -and
            $env:SHF_ORACLE_CONNECT_STRING.ToUpperInvariant() -cnotin @('CTIDBT_WFMT', 'CTIDBT_WFMT.WORLD')) -or
        ($env:SHF_ORACLE_USER -and $env:SHF_ORACLE_USER -notmatch '\Ashifter\z')) {
        throw (New-ShifterOracleDemoFailure 'DEMO_ENVIRONMENT_REJECTED')
    }
}

function Invoke-ShifterOracleDemoNode {
    param([string]$EntryPoint, [string]$Unit, [int]$ListenPort, [switch]$AllTestUnits)
    # Native foreground child: inherits process-only credentials, never argv/file.
    try {
        if ($AllTestUnits) {
            & node $EntryPoint --test-read-only --all-test-units --port $ListenPort
        } else {
            & node $EntryPoint --test-read-only --org-unit $Unit --port $ListenPort
        }
        if ($LASTEXITCODE -ne 0) { throw (New-ShifterOracleDemoFailure 'DEMO_NODE_STARTUP_FAILED') }
    } catch {
        throw (New-ShifterOracleDemoFailure 'DEMO_NODE_STARTUP_FAILED')
    }
}

function Start-ShifterOracleDemo {
    [CmdletBinding()]
    param(
        [string]$OrgUnitId = $env:SHF_ORACLE_DEMO_ORG_UNIT_ID,
        [switch]$AllTestUnits,
        [string]$ClientLibDir = $env:SHF_ORACLE_CLIENT_LIB_DIR,
        [string]$TnsAdmin = $env:TNS_ADMIN,
        [ValidateRange(1, 65535)][int]$Port = 18083,
        [switch]$NonInteractive
    )
    $ErrorActionPreference = 'Stop'
    Assert-ShifterOracleDemoEnvironment
    if ($AllTestUnits -and $PSBoundParameters.ContainsKey('OrgUnitId')) {
        throw (New-ShifterOracleDemoFailure 'DEMO_SCOPE_CONFLICT')
    }
    if ($AllTestUnits) { $OrgUnitId = $null } # Ignore only the launcher ENV default, not explicit parameters.
    # Call-time process default only; an explicitly bound value (even empty) wins.
    if (-not $AllTestUnits -and [string]::IsNullOrWhiteSpace($OrgUnitId)) {
        throw (New-ShifterOracleDemoFailure 'DEMO_UNIT_REQUIRED')
    }
    if (-not $AllTestUnits -and ($OrgUnitId.Length -gt 8 -or
        $OrgUnitId -match '[\s\p{Cc}*%?\\/,;]' -or $OrgUnitId -cin @('-1', 'null'))) {
        throw (New-ShifterOracleDemoFailure 'DEMO_UNIT_INVALID')
    }
    if (-not $ClientLibDir) {
        if ($NonInteractive) { throw (New-ShifterOracleDemoFailure 'DEMO_CLIENT_DIR_REQUIRED') }
        $ClientLibDir = Read-Host -Prompt 'Existing Oracle Client 19.3 bin directory containing oci.dll (local absolute path)'
    }
    if (-not $TnsAdmin) {
        if ($NonInteractive) { throw (New-ShifterOracleDemoFailure 'DEMO_TNS_REQUIRED') }
        $TnsAdmin = Read-Host -Prompt 'Existing TNS_ADMIN network/admin directory (local absolute path)'
    }
    foreach ($inputDirectory in @(
        @($ClientLibDir, 'DEMO_CLIENT_DIR_REQUIRED'), @($TnsAdmin, 'DEMO_TNS_REQUIRED')
    )) {
        $valid = $false
        try {
            $path = $inputDirectory[0]
            $valid = -not [string]::IsNullOrWhiteSpace($path) -and $path.Length -le 4096 -and
                $path -ceq $path.Trim() -and $path -match '\A[A-Za-z]:[\\/]' -and
                (Test-Path -LiteralPath $path -PathType Container -ErrorAction Stop)
        } catch { $valid = $false }
        if (-not $valid) { throw (New-ShifterOracleDemoFailure $inputDirectory[1]) }
    }
    $hasOci = $false
    try { $hasOci = Test-Path -LiteralPath (Join-Path $ClientLibDir 'oci.dll') -PathType Leaf -ErrorAction Stop } catch { $hasOci = $false }
    if (-not $hasOci) {
        throw (New-ShifterOracleDemoFailure 'DEMO_OCI_BINARY_MISSING')
    }
    $keys = @('SHF_ORACLE_CONNECT_STRING', 'SHF_ORACLE_USER', 'SHF_ORACLE_PASSWORD',
        'SHF_ORACLE_CLIENT_LIB_DIR', 'TNS_ADMIN', 'NODE_ENV', 'SHF_APP_ENV')
    $previous = @{}
    foreach ($key in $keys) { $previous[$key] = [Environment]::GetEnvironmentVariable($key, 'Process') }
    try {
        . (Join-Path $PSScriptRoot 'Set-ShifterOracleEnvironment.ps1')
        $alias = if ($env:SHF_ORACLE_CONNECT_STRING) { $env:SHF_ORACLE_CONNECT_STRING } else { 'CTIDBT_WFMT' }
        try {
            Set-ShifterOracleEnvironment -Profile test -ConnectString $alias -ClientLibDir $ClientLibDir `
                -TnsAdmin $TnsAdmin -NonInteractive:$NonInteractive
        } catch {
            throw (New-ShifterOracleDemoFailure 'DEMO_INPUT_SETUP_FAILED')
        }
        $env:NODE_ENV = 'test'
        $env:SHF_APP_ENV = 'test'
        if ($AllTestUnits) {
            Write-Output 'Reading all TEST teams (at most100 current contract); no writes. Not full database or DBA access.'
        } else {
            Write-Output 'Starting Oracle TEST READ-ONLY demonstration. Selected exact unit is your authorization attestation, not independent DB identity proof.'
        }
        Write-Output 'Synthetic Administrator is not a real user login. All commands/writes are disabled. Keep this terminal open; Ctrl+C stops the host.'
        $entry = Join-Path (Split-Path $PSScriptRoot -Parent) 'backend/fixture-slice/oracle-demo-host.mts'
        # Launcher-only input is not part of Node's strict environment contract.
        # Preserve its exact parent value, including when an explicit unit overrides it.
        $launcherUnit = [Environment]::GetEnvironmentVariable('SHF_ORACLE_DEMO_ORG_UNIT_ID', 'Process')
        try {
            [Environment]::SetEnvironmentVariable('SHF_ORACLE_DEMO_ORG_UNIT_ID', $null, 'Process')
            Invoke-ShifterOracleDemoNode -EntryPoint $entry -Unit $OrgUnitId -ListenPort $Port -AllTestUnits:$AllTestUnits
        } catch {
            throw (New-ShifterOracleDemoFailure 'DEMO_NODE_STARTUP_FAILED')
        } finally {
            [Environment]::SetEnvironmentVariable('SHF_ORACLE_DEMO_ORG_UNIT_ID', $launcherUnit, 'Process')
        }
    } finally {
        foreach ($key in $keys) { [Environment]::SetEnvironmentVariable($key, $previous[$key], 'Process') }
        $previous.Clear()
    }
}

if ($MyInvocation.InvocationName -ne '.') {
    try {
        Start-ShifterOracleDemo @PSBoundParameters
    } catch {
        # Do not echo arbitrary exception messages/paths/driver diagnostics.
        [Console]::Error.WriteLine((Format-ShifterOracleDemoFailure $_.Exception))
        exit 1
    }
}
