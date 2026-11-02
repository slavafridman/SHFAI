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

function Get-ShifterOracleDemoHostAction {
    param([string]$Code)
    # Finite source-observed host registry, NOT a DEMO_* prefix trust rule.
    switch -CaseSensitive ($Code) {
        'DEMO_TEST_ASSETS_REQUIRED' { 'Build verified TEST assets: powershell.exe -NoProfile -File scripts\Build-Shifter.ps1 -Profile test -Validation. No automatic build or retry was performed.' }
        'DEMO_SCOPE_TOO_LARGE' { 'TEST team scope exceeds the approved 1000-team read-only capacity. No partial scope or retry is permitted.' }
        'DEMO_SCOPE_INVALID' { 'TEST team scope failed source validation. Ask the authorized data owner to review it; no broader or partial grant was made.' }
        'DEMO_PORT_UNAVAILABLE' { 'The requested local port is unavailable. Select an authorized free -Port; do not terminate an unknown listener.' }
        'DEMO_STARTUP_FAILED' { 'Node host startup failed. Use only the diagnostic code, if present, for authorized investigation; no fallback or automatic retry was performed.' }
        'DEMO_CONFIGURATION_REJECTED' { 'Node rejected the isolated TEST configuration. Review approved process inputs; do not relax production or authentication guards.' }
        'DEMO_ORACLE_INPUTS_REQUIRED' { 'Node requires the approved Oracle process inputs. Review secure input preparation; no credential verification is implied.' }
        'DEMO_ORACLE_INPUTS_REJECTED' { 'Node rejected Oracle process inputs. Review approved account and local directory inputs; do not bypass validation.' }
        'DEMO_ORACLE_DIRECTORIES_REQUIRED' { 'Node requires existing approved local Oracle client and TNS directories. Review those inputs; nothing was installed.' }
        'DEMO_ARGUMENTS_REJECTED' { 'Node rejected launcher arguments. Use the documented single-unit or explicit all-team invocation.' }
        'DEMO_SCOPE_PENDING' { 'Node scope is not established. Use the documented launcher; no scope grant was made.' }
        'DEMO_LISTENER_FAILED' { 'Node could not establish its local listener. Review the local runtime; no readiness is claimed.' }
        'DEMO_STARTUP_ABORTED' { 'Node startup was cancelled. No readiness is claimed; no automatic retry was performed.' }
        'DEMO_DATABASE_UNAVAILABLE' { 'Node reported database unavailability. Request authorized investigation using only the diagnostic code, if present; no automatic retry was performed.' }
        'DEMO_POOL_ALREADY_TRANSFERRED' { 'Node rejected pool ownership transfer. Request runtime investigation; no additional pool or retry was created.' }
        'DEMO_WRITES_FORBIDDEN' { 'Node rejected a write request. This demonstration remains read-only; do not bypass the guard.' }
        'DEMO_NODE_RUNTIME_ERROR' { 'Node exited with an error without a recognized host status. RuntimeDiagnosticRequired: check node --version and the approved runtime/dependency compatibility. Raw native diagnostics were withheld; no automatic retry was performed.' }
    }
}

function ConvertTo-ShifterOracleDemoScopeDiagnostic {
    param($Value)
    # Accept only the complete private shape, never stringify arbitrary objects.
    if ($null -eq $Value -or ($Value -isnot [System.Collections.IDictionary] -and
        $Value -isnot [pscustomobject])) { return $null }
    $keys = if ($Value -is [System.Collections.IDictionary]) { @($Value.Keys) } else {
        @($Value.PSObject.Properties | ForEach-Object { $_.Name })
    }
    if ((($keys | Sort-Object -CaseSensitive) -join ',') -cne
        'discoveredCount,reason,stage,validatedCount') { return $null }
    $stage = $null; $reason = $null
    foreach ($candidate in @('discovery', 'hierarchy', 'snapshot')) {
        if ($Value.stage -is [string] -and $Value.stage -ceq $candidate) { $stage = $candidate }
    }
    foreach ($candidate in @('EMPTY_SCOPE', 'INVALID_ROW_SHAPE', 'INVALID_TEAM_CODE', 'INVALID_TEAM_TYPE',
        'MISSING_OR_INVALID_PARENT', 'SELF_PARENT', 'DUPLICATE_TEAM', 'HIERARCHY_CARDINALITY',
        'TEAM_LABEL_INVALID', 'PARENT_NOT_G01', 'PARENT_LABEL_INVALID', 'PARENT_LABEL_CONFLICT',
        'FOREIGN_OR_MISSING_TEAM', 'PARENT_CHANGED', 'UNCLASSIFIED_SOURCE_FAILURE')) {
        if ($Value.reason -is [string] -and $Value.reason -ceq $candidate) { $reason = $candidate }
    }
    if (-not $stage -or -not $reason) { return $null }
    foreach ($count in @($Value.discoveredCount, $Value.validatedCount)) {
        if (($count -isnot [int] -and $count -isnot [long] -and $count -isnot [double] -and
            $count -isnot [decimal]) -or [double]::IsNaN([double]$count) -or
            [double]::IsInfinity([double]$count) -or $count -lt 0 -or $count -gt 1000 -or
            [Math]::Truncate([double]$count) -ne $count) { return $null }
    }
    if ($Value.validatedCount -gt $Value.discoveredCount) { return $null }
    return @{ stage = $stage; reason = $reason; discoveredCount = [int]$Value.discoveredCount;
        validatedCount = [int]$Value.validatedCount }
}

function Format-ShifterOracleDemoFailure {
    param([System.Exception]$Exception)
    # Only locally assigned codes select constant text. Never inspect raw messages.
    $code = $Exception.Data['ShifterOracleDemoCode']
    $hostAction = Get-ShifterOracleDemoHostAction $code
    if ($hostAction) {
        if ($code -ceq 'DEMO_SCOPE_INVALID') {
            # Validate again at the rendering boundary, including directly supplied failures.
            $scope = ConvertTo-ShifterOracleDemoScopeDiagnostic $Exception.Data['ShifterOracleDemoScopeDiagnostic']
            if ($scope) {
                $stageLabel = switch -CaseSensitive ($scope.stage) {
                    'discovery' { 'Discovery' }; 'hierarchy' { 'Hierarchy' }; 'snapshot' { 'Snapshot' }
                }
                return "Oracle demo [DEMO_SCOPE_INVALID]: $stageLabel validation failed [$($scope.reason)]; discovered teams=$($scope.discoveredCount); validated teams=$($scope.validatedCount); no partial scope."
            }
            if ($Exception.Data.Contains('ShifterOracleDemoScopeDiagnostic') -or
                $Exception.Data['ShifterOracleDemoScopeDiagnosticInvalid']) {
                return "Oracle demo [DEMO_SCOPE_INVALID]: $hostAction RuntimeDiagnosticRequired: scope diagnostic withheld."
            }
        }
        $diagnostic = $Exception.Data['ShifterOracleDemoOracleCode']
        if ($diagnostic -is [string] -and $diagnostic -cmatch '\A(?:ORA-[0-9]{5}|NJS-[0-9]{3}|DPI-[0-9]{4})\z') {
            return "Oracle demo [$code]: $hostAction Diagnostic: $diagnostic."
        }
        return "Oracle demo [$code]: $hostAction"
    }
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
        'DEMO_CLIENT_AMBIGUOUS' { 'Multiple compatible local Oracle homes found; supply -ClientLibDir and -TnsAdmin explicitly. No Oracle connection attempted.' }
        'DEMO_CLIENT_DISCOVERY_FAILED' { 'Local Oracle metadata discovery was unavailable; supply -ClientLibDir and -TnsAdmin explicitly. No Oracle connection attempted.' }
        'DEMO_INPUT_SETUP_FAILED' { 'Oracle process input preparation failed. Check approved process inputs and secure input availability; no credential verification or Oracle connection attempted.' }
        'DEMO_NODE_STARTUP_FAILED' { 'Node host could not start or stopped with an error. See its sanitized status above, if available. This code alone does not establish an Oracle login failure; no fallback or automatic retry was performed.' }
        default {
            $code = 'DEMO_LAUNCHER_FAILED'
            'Launcher could not start or stopped with an error. Check approved TEST configuration. No fallback or automatic retry was performed.'
        }
    }
    return "Oracle demo [$code]: $action"
}

function Test-ShifterOracleDemoDirectory {
    param([string]$Path)
    try {
        return (-not [string]::IsNullOrWhiteSpace($Path) -and $Path.Length -le 4096 -and
            $Path -ceq $Path.Trim() -and $Path -match '\A[A-Za-z]:[\\/]' -and
            (Test-Path -LiteralPath $Path -PathType Container -ErrorAction Stop))
    } catch { return $false }
}

function Get-ShifterOracleDemoRegisteredHomes {
    # One known installation key, explicitly in the 64-bit view. Never enumerate
    # registry values, profiles or credential stores; never expand registry text.
    $base = $null
    $key = $null
    try {
        $base = [Microsoft.Win32.RegistryKey]::OpenBaseKey(
            [Microsoft.Win32.RegistryHive]::LocalMachine, [Microsoft.Win32.RegistryView]::Registry64)
        $key = $base.OpenSubKey('SOFTWARE\Oracle\KEY_OraClient19Home1', $false)
        if ($null -ne $key) {
            $options = [Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames
            [pscustomobject]@{
                OracleHome = $key.GetValue('ORACLE_HOME', $null, $options)
                TnsAdmin = $key.GetValue('TNS_ADMIN', $null, $options)
            }
        }
    } finally {
        if ($null -ne $key) { $key.Dispose() }
        if ($null -ne $base) { $base.Dispose() }
    }
}

function Get-ShifterOracleDemoStandardHome {
    # Bounded current-account candidate only; no recursive search or other users.
    $drive = $env:SystemDrive
    $user = [Environment]::UserName
    if ($drive -match '\A[A-Za-z]:\z' -and $user -notin @('.', '..') -and
        $user -match '\A[^\\/:*?"<>|]+\z') {
        return "$drive\app\client\$user\product\19.0.0\client_1"
    }
}

function Get-ShifterOracleDemoOciVersion {
    param([string]$Path)
    $version = [Diagnostics.FileVersionInfo]::GetVersionInfo($Path)
    return (($version.FileMajorPart -eq 19 -and $version.FileMinorPart -eq 3) -or
        ($version.ProductMajorPart -eq 19 -and $version.ProductMinorPart -eq 3))
}

function Get-ShifterOracleDemoOciMetadata {
    param([string]$Path)
    $stream = $null
    $reader = $null
    try {
        # Inspect bounded PE metadata only. Never load/execute the driver.
        $stream = [IO.File]::Open($Path, [IO.FileMode]::Open, [IO.FileAccess]::Read, [IO.FileShare]::ReadWrite)
        $reader = New-Object IO.BinaryReader($stream)
        if ($stream.Length -lt 64 -or $reader.ReadUInt16() -ne 0x5A4D) { return }
        $stream.Position = 0x3C
        $offset = $reader.ReadInt32()
        if ($offset -lt 64 -or $offset -gt 1048576 -or $offset -gt ($stream.Length - 6)) { return }
        $stream.Position = $offset
        if ($reader.ReadUInt32() -ne 0x4550) { return }
        $x64 = $reader.ReadUInt16() -eq 0x8664
        [pscustomobject]@{ Version19_3 = (Get-ShifterOracleDemoOciVersion $Path); X64 = $x64 }
    } catch { return } finally {
        if ($null -ne $reader) { $reader.Dispose() }
        if ($null -ne $stream) { $stream.Dispose() }
    }
}

function Get-ShifterOracleDemoHomeCandidate {
    param([string]$OracleHome, [string]$RegisteredTns)
    if (-not (Test-ShifterOracleDemoDirectory $OracleHome)) { return }
    $root = $OracleHome.TrimEnd('\', '/')
    # ORACLE_HOME can name a home root or its BIN directory.
    $bin = Join-Path $root 'bin'
    if ([IO.Path]::GetFileName($root) -ieq 'bin') {
        $bin = $root
        $root = Split-Path $root -Parent
    }
    if (-not (Test-ShifterOracleDemoDirectory $bin)) { return }
    $oci = Join-Path $bin 'oci.dll'
    if (-not (Test-Path -LiteralPath $oci -PathType Leaf -ErrorAction Stop)) { return }
    $metadata = Get-ShifterOracleDemoOciMetadata $oci
    if ($null -eq $metadata -or -not $metadata.Version19_3 -or -not $metadata.X64) { return }
    $admin = if ($RegisteredTns) { $RegisteredTns } else { Join-Path $root 'network\admin' }
    [pscustomobject]@{ ClientLibDir = $bin; TnsAdmin = $admin }
}

function Resolve-ShifterOracleDemoPaths {
    [CmdletBinding()]
    param(
        [string]$ClientLibDir = $env:SHF_ORACLE_CLIENT_LIB_DIR,
        [string]$TnsAdmin = $env:TNS_ADMIN
    )
    # Explicitly bound empty values fail; never silently replace invalid input.
    $clientSpecified = $PSBoundParameters.ContainsKey('ClientLibDir') -or
        $null -ne [Environment]::GetEnvironmentVariable('SHF_ORACLE_CLIENT_LIB_DIR', 'Process')
    $tnsSpecified = $PSBoundParameters.ContainsKey('TnsAdmin') -or
        $null -ne [Environment]::GetEnvironmentVariable('TNS_ADMIN', 'Process')
    if ($clientSpecified) {
        if (-not (Test-ShifterOracleDemoDirectory $ClientLibDir)) {
            throw (New-ShifterOracleDemoFailure 'DEMO_CLIENT_DIR_REQUIRED')
        }
        $hasOci = $false
        try {
            $hasOci = Test-Path -LiteralPath (Join-Path $ClientLibDir 'oci.dll') -PathType Leaf -ErrorAction Stop
        } catch { $hasOci = $false }
        if (-not $hasOci) {
            throw (New-ShifterOracleDemoFailure 'DEMO_OCI_BINARY_MISSING')
        }
    }
    if ($tnsSpecified -and -not (Test-ShifterOracleDemoDirectory $TnsAdmin)) {
        throw (New-ShifterOracleDemoFailure 'DEMO_TNS_REQUIRED')
    }
    $source = 'explicit/process'
    if (-not $clientSpecified -or -not $tnsSpecified) {
        try {
            $candidate = Get-ShifterOracleDemoHomeCandidate -OracleHome $env:ORACLE_HOME
            $source = 'ORACLE_HOME'
            if ($null -eq $candidate) {
                $candidates = @()
                foreach ($registered in @(Get-ShifterOracleDemoRegisteredHomes)) {
                    $found = Get-ShifterOracleDemoHomeCandidate -OracleHome $registered.OracleHome -RegisteredTns $registered.TnsAdmin
                    if ($null -ne $found) {
                        $found | Add-Member -NotePropertyName Source -NotePropertyValue 'registry64'
                        $candidates += $found
                    }
                }
                $standard = Get-ShifterOracleDemoHomeCandidate -OracleHome (Get-ShifterOracleDemoStandardHome)
                if ($null -ne $standard -and
                    $standard.ClientLibDir -notin @($candidates | ForEach-Object { $_.ClientLibDir })) {
                    $standard | Add-Member -NotePropertyName Source -NotePropertyValue 'current-account-standard'
                    $candidates += $standard
                }
                $candidates = @($candidates | Sort-Object -Property ClientLibDir -Unique)
                if ($candidates.Count -gt 1) { throw (New-ShifterOracleDemoFailure 'DEMO_CLIENT_AMBIGUOUS') }
                if ($candidates.Count -eq 1) {
                    $candidate = $candidates[0]
                    $source = $candidate.Source
                }
            }
            if ($null -ne $candidate) {
                if (-not $clientSpecified) { $ClientLibDir = $candidate.ClientLibDir }
                if (-not $tnsSpecified) {
                    $TnsAdmin = $candidate.TnsAdmin
                    if (-not (Test-ShifterOracleDemoDirectory $TnsAdmin) -or
                        -not (Test-Path -LiteralPath (Join-Path $TnsAdmin 'tnsnames.ora') -PathType Leaf)) {
                        throw (New-ShifterOracleDemoFailure 'DEMO_TNS_REQUIRED')
                    }
                }
            }
        } catch {
            if ($_.Exception.Data['ShifterOracleDemoCode'] -cin @('DEMO_CLIENT_AMBIGUOUS', 'DEMO_TNS_REQUIRED')) { throw }
            throw (New-ShifterOracleDemoFailure 'DEMO_CLIENT_DISCOVERY_FAILED')
        }
    }
    if (-not $ClientLibDir) { throw (New-ShifterOracleDemoFailure 'DEMO_CLIENT_DIR_REQUIRED') }
    if (-not $TnsAdmin) { throw (New-ShifterOracleDemoFailure 'DEMO_TNS_REQUIRED') }
    [pscustomobject]@{ ClientLibDir = $ClientLibDir; TnsAdmin = $TnsAdmin; Source = $source }
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
    $preference = $ErrorActionPreference
    $status = @{ Code = $null; OracleCode = $null; ScopeDiagnostic = $null; ScopeDiagnosticInvalid = $false }
    # Process merged output as it arrives, not after host shutdown. Never echo
    # arbitrary native text (warnings, stacks and driver messages may hold secrets).
    $safeOutput = {
        $text = [string]$_
        foreach ($line in ($text -split '\r?\n')) {
            try {
                $json = ConvertFrom-Json -InputObject $line -ErrorAction Stop
                if ($json -isnot [pscustomobject] -or
                    @($json.PSObject.Properties.Name | Where-Object { $_ -cnotin @('code', 'oracleCode', 'scopeDiagnostic') }).Count) {
                    continue
                }
                $codeProperty = $json.PSObject.Properties['code']
                if ($null -ne $codeProperty -and $codeProperty.Value -is [string] -and
                    (Get-ShifterOracleDemoHostAction $codeProperty.Value) -and -not $status.Code) {
                    $status.Code = $codeProperty.Value
                    $oracleProperty = $json.PSObject.Properties['oracleCode']
                    if ($null -ne $oracleProperty -and $oracleProperty.Value -is [string] -and
                        $oracleProperty.Value -cmatch '\A(?:ORA-[0-9]{5}|NJS-[0-9]{3}|DPI-[0-9]{4})\z') {
                        $status.OracleCode = $oracleProperty.Value
                    }
                    $scopeProperty = $json.PSObject.Properties['scopeDiagnostic']
                    if ($null -ne $scopeProperty) {
                        if ($status.Code -ceq 'DEMO_SCOPE_INVALID') {
                            $status.ScopeDiagnosticInvalid = $true
                            $status.ScopeDiagnostic = ConvertTo-ShifterOracleDemoScopeDiagnostic $scopeProperty.Value
                            $status.ScopeDiagnosticInvalid = -not [bool]$status.ScopeDiagnostic
                        }
                    }
                }
            } catch { } # Non-JSON native diagnostics are deliberately withheld.
            if ($line -ceq "Oracle TEST read-only demo: http://127.0.0.1:$ListenPort" -or
                $line -ceq "Status: http://127.0.0.1:$ListenPort/demo-status" -or
                $line -ceq 'Synthetic Administrator; exact operator-attested read scope; all writes disabled.' -or
                $line -ceq 'Connection accepted; server identity NOT independently certified; NOT release-ready. Ctrl+C to stop.') {
                Write-Output $line
            }
        }
    }
    try {
        # PS5.1 turns native stderr into ErrorRecords. Stop would abort before
        # LASTEXITCODE, even on exit 0. Continue is local to this invocation only.
        $ErrorActionPreference = 'Continue'
        if ($AllTestUnits) {
            & node $EntryPoint --test-read-only --all-test-units --port $ListenPort 2>&1 | ForEach-Object $safeOutput
        } else {
            & node $EntryPoint --test-read-only --org-unit $Unit --port $ListenPort 2>&1 | ForEach-Object $safeOutput
        }
        $exitCode = $LASTEXITCODE
    } catch {
        throw (New-ShifterOracleDemoFailure 'DEMO_NODE_STARTUP_FAILED')
    } finally {
        $ErrorActionPreference = $preference
    }
    if ($exitCode -ne 0) {
        $code = if ($status.Code) { $status.Code } else { 'DEMO_NODE_RUNTIME_ERROR' }
        $failure = New-ShifterOracleDemoFailure $code
        if ($status.OracleCode) { $failure.Data['ShifterOracleDemoOracleCode'] = $status.OracleCode }
        if ($status.ScopeDiagnostic) { $failure.Data['ShifterOracleDemoScopeDiagnostic'] = $status.ScopeDiagnostic }
        if ($status.ScopeDiagnosticInvalid) { $failure.Data['ShifterOracleDemoScopeDiagnosticInvalid'] = $true }
        throw $failure
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
    $pathInputs = @{}
    if ($PSBoundParameters.ContainsKey('ClientLibDir')) { $pathInputs.ClientLibDir = $ClientLibDir }
    if ($PSBoundParameters.ContainsKey('TnsAdmin')) { $pathInputs.TnsAdmin = $TnsAdmin }
    $paths = Resolve-ShifterOracleDemoPaths @pathInputs
    $ClientLibDir = $paths.ClientLibDir
    $TnsAdmin = $paths.TnsAdmin
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
            Write-Output 'Reading all TEST teams (at most1000 read-only capacity); no writes. Not full database or DBA access.'
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
            if (Get-ShifterOracleDemoHostAction $_.Exception.Data['ShifterOracleDemoCode']) { throw }
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
