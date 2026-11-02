[CmdletBinding()]
param()
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$script:passed = 0
function Assert-Demo([bool]$Condition, [string]$Label) {
    if (-not $Condition) { throw "FAIL $Label" }
    $script:passed++
    Write-Host "PASS $Label"
}
$launcher = Join-Path $PSScriptRoot 'Start-ShifterOracleDemo.ps1'
foreach ($file in @($launcher, $PSCommandPath)) {
    $tokens = $null; $errors = $null
    [void][Management.Automation.Language.Parser]::ParseFile($file, [ref]$tokens, [ref]$errors)
    Assert-Demo ($errors.Count -eq 0) 'Windows PowerShell parser accepts script'
}
$keys = @('SHF_ORACLE_CONNECT_STRING', 'SHF_ORACLE_USER', 'SHF_ORACLE_PASSWORD',
    'SHF_ORACLE_CLIENT_LIB_DIR', 'TNS_ADMIN', 'NODE_ENV', 'SHF_APP_ENV', 'NODE_OPTIONS',
    'SHF_NATIVE_EXIT_CONFIG', 'SHF_ORACLE_CONFIG', 'SHF_TEST_ORACLE_STAGE_WRITE_ENABLED',
    'SHF_ORACLE_DEMO_ORG_UNIT_ID', 'ORACLE_HOME')
$original = @{}
foreach ($key in $keys) { $original[$key] = [Environment]::GetEnvironmentVariable($key, 'Process') }
$directory = Join-Path $PSScriptRoot (".shf-oracle-demo-launcher-" + [Guid]::NewGuid().ToString('N'))
$script:invocations = 0
$script:failNode = $false
$script:expectedUnit = 'DEMO'
$script:expectedAll = $false
$script:prompts = New-Object 'System.Collections.Generic.List[string]'
$script:answers = New-Object 'System.Collections.Generic.Queue[string]'
$script:homes = @()
$script:standardHome = $null
$script:registryDenied = $false
$script:metadataCalls = 0
$script:expectedClient = $directory
$script:expectedTns = $directory
function Get-DemoSnapshot {
    $snapshot = @{}
    foreach ($key in $keys) { $snapshot[$key] = [Environment]::GetEnvironmentVariable($key, 'Process') }
    return $snapshot
}
function Assert-DemoSnapshot($before) {
    $same = $true
    foreach ($key in $keys) {
        if ([Environment]::GetEnvironmentVariable($key, 'Process') -cne $before[$key]) { $same = $false }
    }
    Assert-Demo $same 'launcher restores every owned process key'
}
function Reset-DemoSynthetic {
    foreach ($key in $keys) { [Environment]::SetEnvironmentVariable($key, $null, 'Process') }
    $env:SHF_ORACLE_CONNECT_STRING = 'CTIDBT_WFMT.WORLD'
    $env:SHF_ORACLE_USER = 'shifter'
    $env:SHF_ORACLE_PASSWORD = 'isolated-synthetic-password'
    $env:SHF_ORACLE_CLIENT_LIB_DIR = $directory
    $env:TNS_ADMIN = $directory
    $script:failNode = $false
    $script:expectedUnit = 'DEMO'
    $script:expectedAll = $false
    $script:answers.Clear()
    $script:prompts.Clear()
    $script:homes = @()
    $script:standardHome = $null
    $script:registryDenied = $false
    $script:metadataCalls = 0
    $script:expectedClient = $directory
    $script:expectedTns = $directory
}
function Assert-DemoRejected($action, [string]$Code) {
    $before = Get-DemoSnapshot
    $calls = $script:invocations
    $caught = $false
    $output = @()
    try { $output = @(& $action) } catch {
        $caught = $true
        if ($Code) { Assert-Demo ($_.Exception.Data['ShifterOracleDemoCode'] -ceq $Code) 'typed safe rejection code' }
        $output += Format-ShifterOracleDemoFailure $_.Exception
    }
    Assert-Demo $caught 'invalid demo input fails explicitly'
    Assert-Demo ($script:invocations -eq $calls) 'rejection happens before Node/pool/HTTP'
    Assert-DemoSnapshot $before
    Assert-Demo (-not (($output -join "`n") -match 'isolated-synthetic-password|isolated-secure-input|RAW_EXCEPTION_SENTINEL|private-path' -or
        ($output -join "`n") -match [regex]::Escape($directory))) 'rejected input, personal path and exception never echoed'
}
try {
    New-Item -ItemType Directory -Path $directory | Out-Null
    # Empty isolated test sentinel, NOT a real client or DLL execution.
    New-Item -ItemType File -Path (Join-Path $directory 'oci.dll') | Out-Null
    $before = Get-DemoSnapshot
    $calls = $script:invocations
    . $launcher
    $nodeInvoker = ${function:Invoke-ShifterOracleDemoNode}
    $metadataReader = ${function:Get-ShifterOracleDemoOciMetadata}
    Assert-DemoSnapshot $before
    Assert-Demo ($script:invocations -eq $calls -and $script:prompts.Count -eq 0) 'dot-source defines functions without launching or prompting'
    # Isolated discovery seams: never inspect the operator's registry or client.
    function Get-ShifterOracleDemoRegisteredHomes {
        if ($script:registryDenied) { throw 'RAW_EXCEPTION_SENTINEL private-path isolated-synthetic-password' }
        return $script:homes
    }
    function Get-ShifterOracleDemoStandardHome { return $script:standardHome }
    function Get-ShifterOracleDemoOciMetadata {
        param([string]$Path)
        $script:metadataCalls++
        return [pscustomobject]@{
            Version19_3 = ($Path -notmatch 'badversion|old10')
            X64 = ($Path -notmatch 'x86|old10')
        }
    }
    function Invoke-ShifterOracleDemoNode {
        param([string]$EntryPoint, [string]$Unit, [int]$ListenPort, [switch]$AllTestUnits)
        $script:invocations++
        Assert-Demo ([bool]$AllTestUnits -eq $script:expectedAll) 'all mode forwarded only on explicit switch'
        if ($AllTestUnits) {
            Assert-Demo ([string]::IsNullOrEmpty($Unit)) 'all mode ignores unit ENV without mixing permissions'
        } else {
            Assert-Demo ($Unit -ceq $script:expectedUnit) 'only operator supplied exact scope forwarded'
        }
        Assert-Demo ($ListenPort -eq 18083) 'default host port18083 forwarded'
        Assert-Demo ($EntryPoint.EndsWith('backend\fixture-slice\oracle-demo-host.mts') -or
            $EntryPoint.EndsWith('backend/fixture-slice/oracle-demo-host.mts')) 'source host used instead of stale backend payload'
        Assert-Demo ($env:NODE_ENV -ceq 'test' -and $env:SHF_APP_ENV -ceq 'test') 'explicit isolated TEST profile'
        Assert-Demo ($env:SHF_ORACLE_USER -ceq 'shifter' -and $env:SHF_ORACLE_CONNECT_STRING -ceq 'CTIDBT_WFMT.WORLD') 'approved account and alias only'
        Assert-Demo ($env:SHF_ORACLE_PASSWORD -cin @('isolated-synthetic-password', 'isolated-secure-input')) 'synthetic secret only in process environment'
        Assert-Demo ($env:SHF_ORACLE_CLIENT_LIB_DIR -ceq $script:expectedClient -and
            $env:TNS_ADMIN -ceq $script:expectedTns) 'only resolved paths reach child process'
        Assert-Demo (-not $env:SHF_ORACLE_CONFIG -and -not $env:SHF_NATIVE_EXIT_CONFIG) 'no inherited native or arbitrary application configuration'
        Assert-Demo ($null -eq [Environment]::GetEnvironmentVariable('SHF_ORACLE_DEMO_ORG_UNIT_ID', 'Process')) 'launcher-only unit key never reaches Node'
        if ($script:failNode) { throw 'RAW_EXCEPTION_SENTINEL isolated-synthetic-password' }
    }
    function Read-Host {
        param($Prompt, [switch]$AsSecureString, $ErrorAction)
        if (-not $AsSecureString -or [string]$Prompt -match '(?i)unit|org.?unit' -or
            [string]$Prompt -match ([string][char]0x05D9 + [char]0x05D7 + [char]0x05D9 + [char]0x05D3 + [char]0x05D4)) {
            throw 'Path and unit prompts are forbidden'
        }
        $script:prompts.Add([string]$Prompt)
        if ($AsSecureString) { return (ConvertTo-SecureString 'isolated-secure-input' -AsPlainText -Force) }
        if ($script:answers.Count -eq 0) { throw 'Unexpected isolated prompt' }
        return $script:answers.Dequeue()
    }
    $oracleHome = Join-Path $directory 'home19'
    $bin = Join-Path $oracleHome 'bin'
    $admin = Join-Path $oracleHome 'network\admin'
    New-Item -ItemType Directory -Path $bin, $admin | Out-Null
    New-Item -ItemType File -Path (Join-Path $bin 'oci.dll'), (Join-Path $admin 'tnsnames.ora') | Out-Null
    Reset-DemoSynthetic
    $env:SHF_ORACLE_CLIENT_LIB_DIR = $null
    $env:TNS_ADMIN = $null
    $script:homes = @([pscustomobject]@{ OracleHome = $oracleHome; TnsAdmin = $null })
    $script:expectedAll = $true
    $script:expectedClient = $bin
    $script:expectedTns = $admin
    $before = Get-DemoSnapshot
    $output = @(Start-ShifterOracleDemo -AllTestUnits)
    Assert-DemoSnapshot $before
    Assert-Demo ($script:prompts.Count -eq 0) 'registered compatible home resolves both paths without any prompt'
    Assert-Demo ($script:metadataCalls -gt 0) 'automatic client requires binary metadata validation'
    Assert-Demo (-not (($output -join "`n") -match [regex]::Escape($directory))) 'automatic status never prints personal paths'
    # Real PE reader, synthetic binary and fake version metadata: no installed DLL.
    function Get-ShifterOracleDemoOciVersion { param([string]$Path) return $script:fakeVersion }
    $pe = Join-Path $directory 'synthetic-pe.dll'
    $bytes = New-Object byte[] 160
    $bytes[0] = 0x4D; $bytes[1] = 0x5A; $bytes[60] = 128
    $bytes[128] = 0x50; $bytes[129] = 0x45
    $bytes[132] = 0x64; $bytes[133] = 0x86
    [IO.File]::WriteAllBytes($pe, $bytes)
    $script:fakeVersion = $true
    $metadata = & $metadataReader $pe
    Assert-Demo ($metadata.X64 -and $metadata.Version19_3) 'PE AMD64 header and fake 19.3 version accepted without DLL execution'
    $script:fakeVersion = $false
    Assert-Demo (-not (& $metadataReader $pe).Version19_3) 'incorrect version metadata not accepted as 19.3'
    $bytes[132] = 0x4C; $bytes[133] = 0x01
    [IO.File]::WriteAllBytes($pe, $bytes)
    Assert-Demo (-not (& $metadataReader $pe).X64) 'PE x86 header rejected as x64'
    $bytes[60] = 255
    [IO.File]::WriteAllBytes($pe, $bytes)
    Assert-Demo ($null -eq (& $metadataReader $pe)) 'out of bounds PE offset rejected safely'
    Assert-Demo ($null -eq (& $metadataReader (Join-Path $directory 'oci.dll'))) 'empty explicit sentinel is not an automatic compatible client'
    $otherHome = Join-Path $directory 'other19'
    foreach ($fixtureHome in @($otherHome, (Join-Path $directory 'badversion'), (Join-Path $directory 'x86'), (Join-Path $directory 'old10'))) {
        New-Item -ItemType Directory -Path (Join-Path $fixtureHome 'bin'), (Join-Path $fixtureHome 'network\admin') | Out-Null
        New-Item -ItemType File -Path (Join-Path $fixtureHome 'bin\oci.dll'), (Join-Path $fixtureHome 'network\admin\tnsnames.ora') | Out-Null
    }
    foreach ($oracleInput in @($oracleHome, $bin)) {
        Reset-DemoSynthetic
        $env:SHF_ORACLE_CLIENT_LIB_DIR = $null
        $env:TNS_ADMIN = $null
        $env:ORACLE_HOME = $oracleInput
        $script:registryDenied = $true
        $paths = Resolve-ShifterOracleDemoPaths
        Assert-Demo ($paths.ClientLibDir -ceq $bin -and $paths.TnsAdmin -ceq $admin -and
            $paths.Source -ceq 'ORACLE_HOME') 'compatible process ORACLE_HOME root or BIN wins before registry'
    }
    Reset-DemoSynthetic
    $script:registryDenied = $true
    $env:ORACLE_HOME = $oracleHome
    $paths = Resolve-ShifterOracleDemoPaths
    Assert-Demo ($paths.ClientLibDir -ceq $directory -and $paths.TnsAdmin -ceq $directory -and
        $script:metadataCalls -eq 0) 'explicit process paths win without automatic metadata or registry access'
    $env:SHF_ORACLE_CLIENT_LIB_DIR = 'invalid-relative'
    $env:TNS_ADMIN = '\\synthetic\share'
    Start-ShifterOracleDemo -OrgUnitId DEMO -ClientLibDir $directory -TnsAdmin $directory -NonInteractive | Out-Null
    foreach ($bad in @('', 'relative', '\\synthetic\share', ' C:\invalid', 'Z:\absent-shf-fixture')) {
        Reset-DemoSynthetic
        $env:ORACLE_HOME = $oracleHome
        Assert-DemoRejected { Start-ShifterOracleDemo -AllTestUnits -ClientLibDir $bad } 'DEMO_CLIENT_DIR_REQUIRED'
        Assert-DemoRejected { Start-ShifterOracleDemo -AllTestUnits -TnsAdmin $bad } 'DEMO_TNS_REQUIRED'
        if ($bad) {
            $env:SHF_ORACLE_CLIENT_LIB_DIR = $bad
            Assert-DemoRejected { Start-ShifterOracleDemo -AllTestUnits } 'DEMO_CLIENT_DIR_REQUIRED'
            $env:SHF_ORACLE_CLIENT_LIB_DIR = $directory
            $env:TNS_ADMIN = $bad
            Assert-DemoRejected { Start-ShifterOracleDemo -AllTestUnits } 'DEMO_TNS_REQUIRED'
        }
        Assert-Demo ($script:prompts.Count -eq 0 -and $script:metadataCalls -eq 0) 'invalid specified input never falls back or asks for paths'
    }
    foreach ($bad in @('relative', '\\synthetic\share', (Join-Path $directory 'old10'),
        (Join-Path $directory 'x86'), (Join-Path $directory 'badversion'))) {
        Reset-DemoSynthetic
        $env:SHF_ORACLE_CLIENT_LIB_DIR = $null
        $env:TNS_ADMIN = $null
        $env:ORACLE_HOME = $bad
        $env:SHF_ORACLE_PASSWORD = $null
        Assert-DemoRejected { Start-ShifterOracleDemo -AllTestUnits } 'DEMO_CLIENT_DIR_REQUIRED'
        Assert-Demo ($script:prompts.Count -eq 0) 'invalid or incompatible automatic home fails before password prompt'
    }
    Reset-DemoSynthetic
    $env:SHF_ORACLE_CLIENT_LIB_DIR = $null
    $env:TNS_ADMIN = $null
    $script:homes = @([pscustomobject]@{ OracleHome = $oracleHome; TnsAdmin = $null })
    $script:standardHome = $oracleHome
    $paths = Resolve-ShifterOracleDemoPaths
    Assert-Demo ($paths.ClientLibDir -ceq $bin -and $paths.Source -ceq 'registry64') 'same standard and registered home deduplicated, registry priority retained'
    $script:standardHome = $otherHome
    Assert-DemoRejected { Start-ShifterOracleDemo -AllTestUnits } 'DEMO_CLIENT_AMBIGUOUS'
    $script:homes = @()
    $paths = Resolve-ShifterOracleDemoPaths
    Assert-Demo ($paths.ClientLibDir -ceq (Join-Path $otherHome 'bin') -and
        $paths.Source -ceq 'current-account-standard') 'only current-account bounded standard candidate can resolve alone'
    $script:registryDenied = $true
    Assert-DemoRejected { Start-ShifterOracleDemo -AllTestUnits } 'DEMO_CLIENT_DISCOVERY_FAILED'
    foreach ($bad in @('relative', '\\synthetic\share', (Join-Path $directory 'old10'),
        (Join-Path $directory 'x86'), (Join-Path $directory 'badversion'))) {
        Reset-DemoSynthetic
        $env:SHF_ORACLE_CLIENT_LIB_DIR = $null
        $env:TNS_ADMIN = $null
        $script:homes = @([pscustomobject]@{ OracleHome = $bad; TnsAdmin = $null })
        Assert-DemoRejected { Start-ShifterOracleDemo -AllTestUnits -NonInteractive } 'DEMO_CLIENT_DIR_REQUIRED'
    }
    Reset-DemoSynthetic
    $env:SHF_ORACLE_CLIENT_LIB_DIR = $null
    $env:TNS_ADMIN = $null
    $script:homes = @(
        [pscustomobject]@{ OracleHome = $oracleHome; TnsAdmin = $null },
        [pscustomobject]@{ OracleHome = $otherHome; TnsAdmin = $null })
    Assert-DemoRejected { Start-ShifterOracleDemo -AllTestUnits } 'DEMO_CLIENT_AMBIGUOUS'
    $script:homes = @([pscustomobject]@{ OracleHome = $oracleHome; TnsAdmin = $directory })
    Assert-DemoRejected { Start-ShifterOracleDemo -AllTestUnits } 'DEMO_TNS_REQUIRED'
    $script:homes = @([pscustomobject]@{ OracleHome = $oracleHome; TnsAdmin = $admin })
    $paths = Resolve-ShifterOracleDemoPaths
    Assert-Demo ($paths.TnsAdmin -ceq $admin) 'narrow registry TNS_ADMIN value used only with existing tnsnames filename'
    $env:SHF_ORACLE_PASSWORD = $null
    Assert-DemoRejected { Start-ShifterOracleDemo -AllTestUnits -NonInteractive } 'DEMO_INPUT_SETUP_FAILED'
    Assert-Demo ($script:prompts.Count -eq 0) 'automatic noninteractive missing password fails without any prompt'
    Reset-DemoSynthetic
    $env:SHF_ORACLE_CLIENT_LIB_DIR = $null
    $env:TNS_ADMIN = $null
    $env:ORACLE_HOME = $oracleHome
    Remove-Item -LiteralPath (Join-Path $admin 'tnsnames.ora')
    Assert-DemoRejected { Start-ShifterOracleDemo -AllTestUnits } 'DEMO_TNS_REQUIRED'
    Assert-Demo ($script:prompts.Count -eq 0) 'automatic TNS requires filename presence without reading contents'
    # Explicit TNS retains original directory-only contract.
    $script:expectedAll = $true
    $script:expectedClient = $bin
    Start-ShifterOracleDemo -AllTestUnits -TnsAdmin $directory -NonInteractive | Out-Null
    New-Item -ItemType File -Path (Join-Path $admin 'tnsnames.ora') | Out-Null
    foreach ($failure in @($false, $true)) {
        Reset-DemoSynthetic
        $env:SHF_ORACLE_CLIENT_LIB_DIR = $null
        $env:TNS_ADMIN = $null
        $env:ORACLE_HOME = $oracleHome
        $script:expectedAll = $true
        $script:expectedClient = $bin
        $script:expectedTns = $admin
        $script:failNode = $failure
        $before = Get-DemoSnapshot
        $caught = $false
        try { Start-ShifterOracleDemo -AllTestUnits | Out-Null } catch { $caught = $true }
        Assert-Demo ($caught -eq $failure) 'automatic all mode preserves foreground success and failure behavior'
        Assert-DemoSnapshot $before
        Assert-Demo ($script:prompts.Count -eq 0) 'automatic configured all mode has zero prompts'
    }
    foreach ($environmentUnit in @($null, 'OTHER', '*', '   ')) {
        foreach ($failure in @($false, $true)) {
            Reset-DemoSynthetic
            [Environment]::SetEnvironmentVariable('SHF_ORACLE_DEMO_ORG_UNIT_ID', $environmentUnit, 'Process')
            $script:expectedAll = $true
            $script:failNode = $failure
            $before = Get-DemoSnapshot
            $calls = $script:invocations
            $caught = $false
            $output = @()
            try { $output = @(Start-ShifterOracleDemo -AllTestUnits -NonInteractive) } catch {
                $caught = $true
                $output += Format-ShifterOracleDemoFailure $_.Exception
            }
            Assert-Demo ($caught -eq $failure) 'all mode propagates startup failure without fallback'
            Assert-Demo ($script:invocations -eq $calls + 1) 'all mode starts one foreground child'
            Assert-DemoSnapshot $before
            Assert-Demo ($script:prompts.Count -eq 0) 'configured all mode never prompts for any input'
            Assert-Demo (-not (($output -join "`n") -match 'isolated-synthetic-password|RAW_EXCEPTION_SENTINEL|OTHER')) 'all output contains no credentials, arbitrary error or unit'
        }
    }
    foreach ($explicitUnit in @('', 'DEMO', '*')) {
        Reset-DemoSynthetic
        Assert-DemoRejected { Start-ShifterOracleDemo -AllTestUnits -OrgUnitId $explicitUnit -NonInteractive } 'DEMO_SCOPE_CONFLICT'
    }
    foreach ($case in @(
        @('NODE_ENV', 'production'), @('SHF_APP_ENV', 'production'),
        @('SHF_NATIVE_EXIT_CONFIG', '{}'), @('SHF_ORACLE_CONFIG', '{}'),
        @('SHF_TEST_ORACLE_STAGE_WRITE_ENABLED', 'false'), @('NODE_OPTIONS', '--import=unapproved')
    )) {
        Reset-DemoSynthetic
        [Environment]::SetEnvironmentVariable($case[0], $case[1], 'Process')
        Assert-DemoRejected { Start-ShifterOracleDemo -AllTestUnits -NonInteractive } 'DEMO_ENVIRONMENT_REJECTED'
    }
    Reset-DemoSynthetic
    [Environment]::SetEnvironmentVariable('SHF_ORACLE_PASSWORD', $null, 'Process')
    [Environment]::SetEnvironmentVariable('SHF_ORACLE_CLIENT_LIB_DIR', $null, 'Process')
    [Environment]::SetEnvironmentVariable('TNS_ADMIN', $null, 'Process')
    Assert-DemoRejected { Start-ShifterOracleDemo } 'DEMO_UNIT_REQUIRED'
    Assert-Demo ($script:prompts.Count -eq 0) 'missing unit fails before any client, TNS or password prompt'
    $safe = Format-ShifterOracleDemoFailure (New-ShifterOracleDemoFailure 'DEMO_UNIT_REQUIRED')
    Assert-Demo ($safe -ceq 'Oracle demo [DEMO_UNIT_REQUIRED]: Set SHF_ORACLE_DEMO_ORG_UNIT_ID in your launcher environment or supply -OrgUnitId; no unit prompt or connection attempted') 'missing unit uses fixed safe instruction'
    foreach ($blank in @('', '   ')) {
        Reset-DemoSynthetic
        $env:SHF_ORACLE_DEMO_ORG_UNIT_ID = 'UNIT'
        Assert-DemoRejected { Start-ShifterOracleDemo -OrgUnitId $blank } 'DEMO_UNIT_REQUIRED'
        Assert-Demo ($script:prompts.Count -eq 0) 'explicit blank CLI unit does not fall through to environment'
        Assert-DemoRejected { Start-ShifterOracleDemo -OrgUnitId $blank -NonInteractive } 'DEMO_UNIT_REQUIRED'
        Assert-Demo ($script:prompts.Count -eq 0) 'noninteractive blank unit never prompts'
    }
    Reset-DemoSynthetic
    Assert-DemoRejected { Start-ShifterOracleDemo -NonInteractive } 'DEMO_UNIT_REQUIRED'
    Assert-Demo ($script:prompts.Count -eq 0) 'noninteractive missing unit never prompts'
    foreach ($valid in @('UNIT', 'deMo', '12345678')) {
        Reset-DemoSynthetic
        $env:SHF_ORACLE_DEMO_ORG_UNIT_ID = $valid
        $script:expectedUnit = $valid
        $before = Get-DemoSnapshot
        $calls = $script:invocations
        $output = @(Start-ShifterOracleDemo)
        Assert-DemoSnapshot $before
        Assert-Demo ($script:invocations -eq $calls + 1 -and $script:prompts.Count -eq 0) 'call-time environment scope launches once without unit prompt'
        Assert-Demo (-not (($output -join "`n") -match 'isolated-synthetic-password|isolated-secure-input')) 'environment launch output never echoes synthetic secret'
    }
    foreach ($environmentUnit in @('OTHER', '*', '   ')) {
        Reset-DemoSynthetic
        $env:SHF_ORACLE_DEMO_ORG_UNIT_ID = $environmentUnit
        $script:expectedUnit = 'Unit2'
        $before = Get-DemoSnapshot
        Start-ShifterOracleDemo -OrgUnitId Unit2 -NonInteractive | Out-Null
        Assert-DemoSnapshot $before
        Assert-Demo ($script:prompts.Count -eq 0) 'explicit parameter takes priority even over malformed environment scope'
    }
    foreach ($bad in @('', '   ', '*', '%', 'A?', 'A,B', 'A/B', "A`tB", ' space', 'null', '-1', 'too-long-code')) {
        Reset-DemoSynthetic
        [Environment]::SetEnvironmentVariable('SHF_ORACLE_DEMO_ORG_UNIT_ID', $bad, 'Process')
        $code = if ([string]::IsNullOrWhiteSpace($bad)) { 'DEMO_UNIT_REQUIRED' } else { 'DEMO_UNIT_INVALID' }
        Assert-DemoRejected { Start-ShifterOracleDemo } $code
        Assert-DemoRejected { Start-ShifterOracleDemo -NonInteractive } $code
        Assert-Demo ($script:prompts.Count -eq 0) 'invalid environment scope never prompts or retries'
    }
    foreach ($valid in @('deMo', '12345678')) {
        Reset-DemoSynthetic
        $script:expectedUnit = $valid
        $before = Get-DemoSnapshot
        Start-ShifterOracleDemo -OrgUnitId $valid -NonInteractive | Out-Null
        Assert-DemoSnapshot $before
        Assert-Demo ($script:prompts.Count -eq 0) 'exact case and numeric unit accepted without credential prompts'
    }
    foreach ($bad in @("A`tB", 'A*', 'RAW_EXCEPTION_SENTINEL', 'isolated-synthetic-password')) {
        Reset-DemoSynthetic
        Assert-DemoRejected { Start-ShifterOracleDemo -OrgUnitId $bad -NonInteractive } 'DEMO_UNIT_INVALID'
    }
    Reset-DemoSynthetic
    $env:SHF_NATIVE_EXIT_CONFIG = 'RAW_EXCEPTION_SENTINEL'
    Assert-DemoRejected { Start-ShifterOracleDemo -OrgUnitId DEMO -NonInteractive } 'DEMO_ENVIRONMENT_REJECTED'
    Reset-DemoSynthetic
    Assert-DemoRejected { Start-ShifterOracleDemo -OrgUnitId DEMO -ClientLibDir '' -NonInteractive } 'DEMO_CLIENT_DIR_REQUIRED'
    Assert-DemoRejected { Start-ShifterOracleDemo -OrgUnitId DEMO -TnsAdmin '' -NonInteractive } 'DEMO_TNS_REQUIRED'
    Assert-DemoRejected { Start-ShifterOracleDemo -OrgUnitId DEMO -ClientLibDir $PSScriptRoot -NonInteractive } 'DEMO_OCI_BINARY_MISSING'
    Assert-DemoRejected { Start-ShifterOracleDemo -OrgUnitId DEMO -TnsAdmin 'RAW_EXCEPTION_SENTINEL' -NonInteractive } 'DEMO_TNS_REQUIRED'
    Reset-DemoSynthetic
    $env:SHF_ORACLE_DEMO_ORG_UNIT_ID = 'UNIT'
    $script:failNode = $true
    $before = Get-DemoSnapshot
    $script:expectedUnit = 'UNIT'
    try { Start-ShifterOracleDemo -NonInteractive | Out-Null } catch {
        Assert-Demo ($_.Exception.Data['ShifterOracleDemoCode'] -ceq 'DEMO_NODE_STARTUP_FAILED') 'Node failure classified without interpreting raw exception'
        $safe = Format-ShifterOracleDemoFailure $_.Exception
        Assert-Demo ($safe -match '^Oracle demo \[DEMO_NODE_STARTUP_FAILED\]:' -and
            $safe -notmatch 'RAW_EXCEPTION_SENTINEL|isolated-synthetic-password') 'Node failure keeps safe constant and no false DB diagnosis'
    }
    Assert-DemoSnapshot $before
    $raw = New-Object System.Exception('RAW_EXCEPTION_SENTINEL isolated-synthetic-password')
    $raw.Data['ShifterOracleDemoCode'] = 'RAW_EXCEPTION_SENTINEL'
    $safe = Format-ShifterOracleDemoFailure $raw
    Assert-Demo ($safe -ceq 'Oracle demo [DEMO_LAUNCHER_FAILED]: Launcher could not start or stopped with an error. Check approved TEST configuration. No fallback or automatic retry was performed.') 'unknown exception and untrusted code use only fixed fallback'
    # Actual top-level invocation in a clean child, without Node or real inputs.
    foreach ($unitArgument in @('', ' -NonInteractive', ' -OrgUnitId RAW_EXCEPTION_SENTINEL')) {
        $info = New-Object System.Diagnostics.ProcessStartInfo
        $info.FileName = (Join-Path $PSHOME 'powershell.exe')
        $info.Arguments = '-NoProfile -File "' + $launcher + '"' + $unitArgument
        $info.UseShellExecute = $false
        $info.RedirectStandardOutput = $true
        $info.RedirectStandardError = $true
        foreach ($name in @($info.EnvironmentVariables.Keys)) {
            if ($name.StartsWith('SHF_', [StringComparison]::OrdinalIgnoreCase) -or $name -cin @('NODE_ENV', 'NODE_OPTIONS', 'TNS_ADMIN')) {
                $info.EnvironmentVariables.Remove($name)
            }
        }
        $info.EnvironmentVariables['SHF_ORACLE_PASSWORD'] = 'isolated-synthetic-password'
        $child = New-Object System.Diagnostics.Process
        $child.StartInfo = $info
        try {
            [void]$child.Start()
            $stdout = $child.StandardOutput.ReadToEnd()
            $stderr = $child.StandardError.ReadToEnd()
            $child.WaitForExit()
            $expectedCode = if ($unitArgument -match '-OrgUnitId') { 'DEMO_UNIT_INVALID' } else { 'DEMO_UNIT_REQUIRED' }
            Assert-Demo ($child.ExitCode -eq 1) 'actual launcher failure exits one'
            Assert-Demo ($stdout -ceq '') 'actual early rejection has no success output'
            Assert-Demo ($stderr.StartsWith("Oracle demo [$expectedCode]: ") -and
                $stderr -match '(No Oracle connection attempted|no unit prompt or connection attempted)') 'actual stderr identifies safe pre-Node validation failure'
            Assert-Demo (($stdout + $stderr) -notmatch 'RAW_EXCEPTION_SENTINEL|isolated-synthetic-password|At .*:|CategoryInfo|FullyQualifiedErrorId|Start-ShifterOracleDemo.ps1|D:\\') 'actual stderr has no secret, input, stack, wrapper or source path'
        } finally { $child.Dispose() }
    }
    Reset-DemoSynthetic
    $before = Get-DemoSnapshot
    $output = @(Start-ShifterOracleDemo -OrgUnitId DEMO -NonInteractive)
    Assert-DemoSnapshot $before
    Assert-Demo ($script:prompts.Count -eq 0) 'configured terminal never prompts for paths or password'
    Assert-Demo (-not (($output -join "`n") -match 'isolated-synthetic-password|isolated-secure-input')) 'safe launcher output has no credential'
    Assert-Demo (($output -join "`n") -match 'not independent DB identity proof') 'no false readiness/identity claim'
    Assert-DemoRejected { Start-ShifterOracleDemo -NonInteractive }
    foreach ($bad in @('*', '%', 'A?', 'null', '-1', 'A,B', 'A/B', 'too-long-code', ' space')) {
        Assert-DemoRejected { Start-ShifterOracleDemo -OrgUnitId $bad -NonInteractive }
    }
    foreach ($case in @(
        @('NODE_ENV', 'production'), @('NODE_ENV', 'invalid'), @('SHF_APP_ENV', 'production'),
        @('SHF_APP_ENV', 'dev'), @('SHF_ORACLE_CONNECT_STRING', 'UNKNOWN'),
        @('SHF_ORACLE_USER', 'other'), @('SHF_NATIVE_EXIT_CONFIG', '{}'),
        @('SHF_ORACLE_CONFIG', '{}'), @('SHF_TEST_ORACLE_STAGE_WRITE_ENABLED', 'false'),
        @('NODE_OPTIONS', '--import=unapproved')
    )) {
        Reset-DemoSynthetic
        [Environment]::SetEnvironmentVariable($case[0], $case[1], 'Process')
        Assert-DemoRejected { Start-ShifterOracleDemo -OrgUnitId DEMO -NonInteractive }
    }
    Reset-DemoSynthetic
    [Environment]::SetEnvironmentVariable('SHF_ORACLE_PASSWORD', $null, 'Process')
    Assert-DemoRejected { Start-ShifterOracleDemo -OrgUnitId DEMO -NonInteractive }
    Assert-Demo ($script:prompts.Count -eq 0) 'missing noninteractive password never prompts'
    Reset-DemoSynthetic
    Assert-DemoRejected { Start-ShifterOracleDemo -OrgUnitId DEMO -ClientLibDir $PSScriptRoot -NonInteractive }
    Assert-DemoRejected { Start-ShifterOracleDemo -OrgUnitId DEMO -TnsAdmin '\\synthetic\share' -NonInteractive }
    Reset-DemoSynthetic
    $before = Get-DemoSnapshot
    $script:failNode = $true
    $caught = $false
    try { Start-ShifterOracleDemo -OrgUnitId DEMO -NonInteractive | Out-Null } catch { $caught = $true }
    Assert-Demo $caught 'Node error is not an Administrator/data fallback'
    Assert-DemoSnapshot $before
    Reset-DemoSynthetic
    $env:SHF_ORACLE_DEMO_ORG_UNIT_ID = 'UNIT'
    $script:expectedUnit = 'UNIT'
    [Environment]::SetEnvironmentVariable('SHF_ORACLE_PASSWORD', $null, 'Process')
    [Environment]::SetEnvironmentVariable('SHF_ORACLE_CLIENT_LIB_DIR', $null, 'Process')
    [Environment]::SetEnvironmentVariable('TNS_ADMIN', $null, 'Process')
    $before = Get-DemoSnapshot
    $env:ORACLE_HOME = $oracleHome
    $script:expectedClient = $bin
    $script:expectedTns = $admin
    $before = Get-DemoSnapshot
    Start-ShifterOracleDemo | Out-Null
    Assert-Demo ($script:prompts.Count -eq 1) 'only missing SecureString password may prompt after automatic paths'
    Assert-Demo ($script:answers.Count -eq 0) 'no path answers consumed'
    Assert-Demo ($script:prompts[0] -ceq 'Oracle password (process only)') 'existing secure helper reused'
    Assert-DemoSnapshot $before
    $source = [IO.File]::ReadAllText($launcher)
    Assert-Demo ($source -notmatch 'Start-Process|Set-Content|WriteAllText|Add-Content|npm install|Get-Credential') 'no background process, env file, install or credential vault'
    Assert-Demo ($source -notmatch "'User'|'Machine'") 'no persistent environment changes'
    Assert-Demo ($source -match 'RegistryView\]::Registry64' -and
        $source -match "OpenSubKey\('SOFTWARE\\Oracle\\KEY_OraClient19Home1', \`$false\)") 'registry access restricted to the known read-only 64-bit home key'
    $registryReads = @([regex]::Matches($source, "\.GetValue\('([^']+)'"))
    Assert-Demo ($registryReads.Count -eq 2 -and
        (($registryReads | ForEach-Object { $_.Groups[1].Value }) -join '|') -ceq 'ORACLE_HOME|TNS_ADMIN') 'only two explicit nonsecret registry values read'
    Assert-Demo ($source -notmatch 'GetValueNames|GetSubKeyNames|Get-ItemProperty|Get-Content|ReadAllText|ReadAllBytes|LoadLibrary|Resolve-DnsName|Test-NetConnection|-Recurse') 'no registry dump, content reads, native loading, network resolution or recursive search'
    Assert-Demo ($source -notmatch 'C:\\Users\\' -and
        $source -match '\[Environment\]::UserName') 'standard home derives the current username, never a personal path literal'
    Assert-Demo ($source -match '& node \$EntryPoint --test-read-only --org-unit \$Unit --port \$ListenPort') 'foreground Node argv contains scope and port only'
    Assert-Demo ($source -match '& node \$EntryPoint --test-read-only --all-test-units --port \$ListenPort') 'all foreground argv has opt-in and port only; no unit or password'
    # The outer launcher must preserve only structured allowlisted failures.
    $syntheticInvoker = ${function:Invoke-ShifterOracleDemoNode}
    try {
        function Invoke-ShifterOracleDemoNode {
            throw (New-ShifterOracleDemoFailure $script:testHostCode)
        }
        foreach ($script:testHostCode in @('DEMO_SCOPE_TOO_LARGE', 'DEMO_TEST_ASSETS_REQUIRED', 'DEMO_UNTRUSTED')) {
            Reset-DemoSynthetic
            $before = Get-DemoSnapshot
            $caught = $false
            try { Start-ShifterOracleDemo -OrgUnitId DEMO -NonInteractive | Out-Null } catch {
                $caught = $true
                $expected = if ($script:testHostCode -eq 'DEMO_UNTRUSTED') { 'DEMO_NODE_STARTUP_FAILED' } else { $script:testHostCode }
                Assert-Demo ($_.Exception.Data['ShifterOracleDemoCode'] -ceq $expected) 'outer launcher preserves only allowlisted structured host codes'
                $safe = Format-ShifterOracleDemoFailure $_.Exception
                Assert-Demo ([regex]::Matches($safe, 'Oracle demo \[').Count -eq 1 -and
                    $safe -notmatch 'DEMO_UNTRUSTED') 'outer launcher renders one unambiguous safe primary status'
            }
            Assert-Demo $caught 'typed host failure remains a failure'
            Assert-DemoSnapshot $before
        }
    } finally { Set-Item Function:Invoke-ShifterOracleDemoNode $syntheticInvoker }
    $hostSource = [IO.File]::ReadAllText((Join-Path (Split-Path $PSScriptRoot -Parent) 'backend/fixture-slice/oracle-demo-host.mts'))
    $hostCodes = @([regex]::Matches($hostSource, '"(DEMO_[A-Z_]+)"') |
        ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique)
    foreach ($hostCode in $hostCodes) {
        Assert-Demo ([bool](Get-ShifterOracleDemoHostAction $hostCode)) "source-observed host code has fixed action $hostCode"
    }
    Assert-Demo (-not (Get-ShifterOracleDemoHostAction 'DEMO_UNTRUSTED')) 'unrecognized DEMO prefix is never trusted'
    # Process-output double only: safe closed diagnostics, including malicious payloads.
    function node {
        Write-Output $script:diagnosticJson
        $script:LASTEXITCODE = 1
    }
    try {
        $reasons = @('EMPTY_SCOPE', 'INVALID_ROW_SHAPE', 'INVALID_TEAM_CODE', 'INVALID_TEAM_TYPE',
            'MISSING_OR_INVALID_PARENT', 'SELF_PARENT', 'DUPLICATE_TEAM', 'HIERARCHY_CARDINALITY',
            'TEAM_LABEL_INVALID', 'PARENT_NOT_G01', 'PARENT_LABEL_INVALID', 'PARENT_LABEL_CONFLICT',
            'FOREIGN_OR_MISSING_TEAM', 'PARENT_CHANGED', 'UNCLASSIFIED_SOURCE_FAILURE')
        foreach ($reason in $reasons) {
            $stage = if ($reason -eq 'UNCLASSIFIED_SOURCE_FAILURE') { 'snapshot' } elseif ($reason -eq 'EMPTY_SCOPE') { 'discovery' } else { 'hierarchy' }
            $payload = @{ stage = $stage; reason = $reason; discoveredCount = 1000; validatedCount = 999 }
            $script:diagnosticJson = @{ code = 'DEMO_SCOPE_INVALID'; scopeDiagnostic = $payload } | ConvertTo-Json -Compress
            $safe = ''
            try { & $nodeInvoker -EntryPoint synthetic -AllTestUnits -ListenPort 18083 } catch {
                $safe = Format-ShifterOracleDemoFailure $_.Exception
            }
            Assert-Demo ($safe -match ([regex]::Escape("[$reason]")) -and
                $safe -match 'discovered teams=1000; validated teams=999; no partial scope') 'closed reason and bounded counts reach operator'
            Assert-Demo ([regex]::Matches($safe, 'Oracle demo \[').Count -eq 1) 'scope diagnostic is one primary status'
        }
        $valid = @{ stage = 'discovery'; reason = 'MISSING_OR_INVALID_PARENT'; discoveredCount = 1; validatedCount = 0 }
        $malformed = @(
            $null, 'SECRET_DIAGNOSTIC', @($valid), @{},
            ($valid + @{ row = 'SECRET_DIAGNOSTIC' })
        )
        foreach ($field in @('stage', 'reason', 'discoveredCount', 'validatedCount')) {
            foreach ($value in @('SECRET_DIAGNOSTIC', $null, $true, -1, 1001, 0.5, '1', @{}, @(0, 1))) {
                $copy = $valid.Clone(); $copy[$field] = $value
                $malformed += $copy
            }
            $copy = $valid.Clone(); $copy.Remove($field); $malformed += $copy
        }
        $copy = $valid.Clone(); $copy.validatedCount = 2; $malformed += $copy
        foreach ($payload in $malformed) {
            $script:diagnosticJson = @{ code = 'DEMO_SCOPE_INVALID'; scopeDiagnostic = $payload } | ConvertTo-Json -Compress -Depth 6
            $safe = ''
            try { & $nodeInvoker -EntryPoint synthetic -AllTestUnits -ListenPort 18083 } catch {
                $safe = Format-ShifterOracleDemoFailure $_.Exception
            }
            Assert-Demo ($safe -match 'RuntimeDiagnosticRequired' -and
                $safe -notmatch 'SECRET_DIAGNOSTIC|discovered teams=') 'malformed scope diagnostic withheld without raw echo'
        }
        foreach ($number in @([double]::NaN, [double]::PositiveInfinity, [double]::NegativeInfinity)) {
            $payload = $valid.Clone(); $payload.discoveredCount = $number
            Assert-Demo ($null -eq (ConvertTo-ShifterOracleDemoScopeDiagnostic $payload)) 'nonfinite count rejected without string conversion'
        }
        $payload = @{ Stage = 'discovery'; reason = 'EMPTY_SCOPE'; discoveredCount = 0; validatedCount = 0 }
        Assert-Demo ($null -eq (ConvertTo-ShifterOracleDemoScopeDiagnostic $payload)) 'diagnostic keys are case-sensitive'
        $failure = New-ShifterOracleDemoFailure 'DEMO_SCOPE_INVALID'
        $failure.Data['ShifterOracleDemoScopeDiagnostic'] = $valid + @{ row = 'SECRET_DIAGNOSTIC' }
        $safe = Format-ShifterOracleDemoFailure $failure
        Assert-Demo ($safe -match 'RuntimeDiagnosticRequired' -and $safe -notmatch 'SECRET_DIAGNOSTIC') 'render boundary independently rejects extra fields'
    } finally { Remove-Item Function:node }
    # Real Windows PowerShell + native Node, but ONLY a test-owned module:
    # no host import, pool, Oracle driver, DNS or listener.
    $nativeFixture = Join-Path $directory 'native-fixture.mjs'
    [IO.File]::WriteAllText($nativeFixture, @'
const args = process.argv.slice(2);
const mode = args.includes("--all-test-units") ? "all" : args[args.indexOf("--org-unit") + 1];
if (process.env.SHF_ORACLE_PASSWORD !== "isolated-synthetic-password" ||
    args.includes(process.env.SHF_ORACLE_PASSWORD) ||
    args[0] !== "--test-read-only" || args.at(-2) !== "--port" || args.at(-1) !== "18083")
  process.exit(98);
process.stderr.write("benign warning SECRET_NATIVE_SENTINEL private-path\n");
if (mode === "all" || mode === "UNIT") {
  process.stdout.write("Oracle TEST read-only demo: http://127.0.0.1:18083\n");
  await new Promise(resolve => setTimeout(resolve, 150));
  process.stdout.write("Status: http://127.0.0.1:18083/demo-status\n");
} else {
  if (mode.startsWith("diag-")) {
    const stage = mode === "diag-discovery" ? "discovery" : mode === "diag-snapshot" ? "snapshot" : "hierarchy";
    const reason = stage === "discovery" ? "MISSING_OR_INVALID_PARENT"
      : stage === "snapshot" ? "UNCLASSIFIED_SOURCE_FAILURE" : "PARENT_LABEL_CONFLICT";
    const scopeDiagnostic = {stage, reason, discoveredCount: 1000, validatedCount: 999};
    if (mode === "diag-malformed") scopeDiagnostic.reason = "SECRET_NATIVE_SENTINEL";
    if (mode === "diag-extra") scopeDiagnostic.row = {label: "SECRET_NATIVE_SENTINEL"};
    process.stderr.write(JSON.stringify({code: "DEMO_SCOPE_INVALID", scopeDiagnostic}) + "\n");
    process.exitCode = 1;
  } else {
  const code = { assets: "DEMO_TEST_ASSETS_REQUIRED", scope: "DEMO_SCOPE_TOO_LARGE",
    invalid: "DEMO_SCOPE_INVALID", port: "DEMO_PORT_UNAVAILABLE", startup: "DEMO_STARTUP_FAILED",
    unknown: "DEMO_UNTRUSTED_SECRET_NATIVE_SENTINEL", malformed: "DEMO_STARTUP_FAILED" }[mode];
  if (code) process.stderr.write(JSON.stringify({code, oracleCode:
    mode === "malformed" ? "ORA-01017 SECRET_NATIVE_SENTINEL" : "ORA-01017"}) + "\n");
  process.exitCode = 1;
  }
}
'@)
    $nativeRunner = Join-Path $directory 'native-runner.ps1'
    [IO.File]::WriteAllText($nativeRunner, @'
param($Launcher, $Fixture, $Mode)
$ErrorActionPreference = 'Stop'
. $Launcher
$env:SHF_ORACLE_PASSWORD = 'isolated-synthetic-password'
$timer = [Diagnostics.Stopwatch]::StartNew()
if ($Mode -eq 'baseline-assets') {
    $Mode = 'assets'
    # Controlled before-fix behavior: the original unconditional remapping.
    function Invoke-ShifterOracleDemoNode {
        param($EntryPoint, $Unit, $ListenPort)
        try {
            & node $EntryPoint --test-read-only --org-unit $Unit --port $ListenPort
            if ($LASTEXITCODE -ne 0) { throw (New-ShifterOracleDemoFailure 'DEMO_NODE_STARTUP_FAILED') }
        } catch { throw (New-ShifterOracleDemoFailure 'DEMO_NODE_STARTUP_FAILED') }
    }
}
if ($Mode -eq 'missing') {
    function node { & ($Fixture + '.missing.exe') @args }
}
try {
    if ($Mode -eq 'all') {
        Invoke-ShifterOracleDemoNode -EntryPoint $Fixture -AllTestUnits -ListenPort 18083
    } else {
        Invoke-ShifterOracleDemoNode -EntryPoint $Fixture -Unit $Mode -ListenPort 18083
    }
    Write-Output 'NATIVE_EXIT_ZERO'
} catch {
    Write-Output (Format-ShifterOracleDemoFailure $_.Exception)
}
Write-Output ("PREFERENCE:" + $ErrorActionPreference)
if ($timer.ElapsedMilliseconds -ge 150) { Write-Output 'FOREGROUND_WAITED' }
'@)
    foreach ($mode in @('baseline-assets', 'all', 'UNIT', 'assets', 'scope', 'invalid', 'port', 'startup', 'unknown', 'malformed', 'missing',
        'diag-discovery', 'diag-hierarchy', 'diag-snapshot', 'diag-malformed', 'diag-extra')) {
        $info = New-Object Diagnostics.ProcessStartInfo
        $info.FileName = Join-Path $PSHOME 'powershell.exe'
        $info.Arguments = '-NoProfile -File "' + $nativeRunner + '" "' + $launcher + '" "' + $nativeFixture + '" ' + $mode
        $info.UseShellExecute = $false
        $info.RedirectStandardOutput = $true
        $info.RedirectStandardError = $true
        foreach ($name in @($info.EnvironmentVariables.Keys)) {
            if ($name.StartsWith('SHF_', [StringComparison]::OrdinalIgnoreCase) -or
                $name -cin @('NODE_ENV', 'NODE_OPTIONS', 'TNS_ADMIN')) { $info.EnvironmentVariables.Remove($name) }
        }
        $child = New-Object Diagnostics.Process
        $child.StartInfo = $info
        try {
            [void]$child.Start()
            $stdout = $child.StandardOutput.ReadToEnd()
            $stderr = $child.StandardError.ReadToEnd()
            $child.WaitForExit()
            Assert-Demo ($child.ExitCode -eq 0) "native fixture runner completed $mode"
            if ($mode -eq 'baseline-assets') {
                Assert-Demo ($stdout -match 'Oracle demo \[DEMO_NODE_STARTUP_FAILED\]' -and
                    $stdout -notmatch 'Oracle demo \[DEMO_TEST_ASSETS_REQUIRED\]') 'before-fix wrapper masks the real native asset failure primary code'
                Assert-Demo (($stdout + $stderr) -match 'DEMO_TEST_ASSETS_REQUIRED') 'before-fix native fixture actually emitted the specific JSON code'
                continue # Baseline output is captured only, deliberately never echoed.
            }
            Assert-Demo (($stdout + $stderr) -notmatch 'SECRET_NATIVE_SENTINEL|private-path|isolated-synthetic-password|CategoryInfo|FullyQualifiedErrorId') "native output sanitized $mode"
            Assert-Demo ($stdout -match 'PREFERENCE:Stop') "native invocation restores Stop preference $mode"
            if ($mode -cin @('all', 'UNIT')) {
                Assert-Demo ($stdout -match 'NATIVE_EXIT_ZERO' -and $stdout -notmatch 'DEMO_') "benign native stderr does not fail exit zero $mode"
                Assert-Demo ($stdout -match 'Status: http://127.0.0.1:18083/demo-status' -and
                    $stdout -match 'FOREGROUND_WAITED') "foreground lifecycle and approved stdout preserved $mode"
            } else {
                $expected = switch ($mode) {
                    assets { 'DEMO_TEST_ASSETS_REQUIRED' }; scope { 'DEMO_SCOPE_TOO_LARGE' }
                    invalid { 'DEMO_SCOPE_INVALID' }; port { 'DEMO_PORT_UNAVAILABLE' }
                    unknown { 'DEMO_NODE_RUNTIME_ERROR' }; missing { 'DEMO_NODE_STARTUP_FAILED' }
                    { $_ -like 'diag-*' } { 'DEMO_SCOPE_INVALID' }
                    default { 'DEMO_STARTUP_FAILED' }
                }
                Assert-Demo ($stdout -match ([regex]::Escape("Oracle demo [$expected]:")) -and
                    $stdout -notmatch 'NATIVE_EXIT_ZERO') "nonzero primary code retained $mode"
                if ($mode -eq 'assets') {
                    Assert-Demo ($stdout -match 'Build-Shifter.ps1 -Profile test -Validation') 'asset failure has constant canonical build action'
                }
                if ($mode -eq 'scope') {
                    Assert-Demo ($stdout -match '1000-team read-only capacity' -and
                        $stdout -notmatch 'approved 100-team|coordinated contract decision') 'capacity overflow reports1000 without obsolete permission prompt'
                }
                if ($mode -eq 'startup') { Assert-Demo ($stdout -match 'ORA-01017') 'safe Oracle code retained without message' }
                if ($mode -eq 'malformed') { Assert-Demo ($stdout -notmatch 'ORA-01017') 'malformed Oracle code rejected entirely' }
                if ($mode -cin @('diag-malformed', 'diag-extra')) {
                    Assert-Demo ($stdout -match 'RuntimeDiagnosticRequired' -and $stdout -notmatch 'discovered teams=') 'native malformed diagnostic withheld'
                } elseif ($mode -like 'diag-*') {
                    $stageLabel = switch ($mode) {
                        'diag-discovery' { 'Discovery' }; 'diag-hierarchy' { 'Hierarchy' }; 'diag-snapshot' { 'Snapshot' }
                    }
                    Assert-Demo ($stdout -match "$stageLabel validation failed" -and
                        $stdout -match 'discovered teams=1000; validated teams=999; no partial scope') 'native structured diagnostic safely rendered'
                    Assert-Demo ([regex]::Matches($stdout, 'Oracle demo \[').Count -eq 1) 'native diagnostic prints one primary status'
                }
            }
        } finally { $child.Dispose() }
    }
    # Exercise the actual argv branch with an isolated command double, not Node.
    function node {
        $script:nodeArguments = @($args)
        $script:LASTEXITCODE = 0
    }
    try {
        & $nodeInvoker -EntryPoint 'synthetic-host.mts' -AllTestUnits -ListenPort 18083
        Assert-Demo (($script:nodeArguments -join '|') -ceq 'synthetic-host.mts|--test-read-only|--all-test-units|--port|18083') 'actual all invoker sends no unit or credential argv'
        & $nodeInvoker -EntryPoint 'synthetic-host.mts' -Unit 'UNIT' -ListenPort 18083
        Assert-Demo (($script:nodeArguments -join '|') -ceq 'synthetic-host.mts|--test-read-only|--org-unit|UNIT|--port|18083') 'actual single invoker preserves legacy argv'
    } finally { Remove-Item Function:node }
    $tokens = $null; $errors = $null
    $ast = [Management.Automation.Language.Parser]::ParseFile($launcher, [ref]$tokens, [ref]$errors)
    $prompts = @($ast.FindAll({
        param($node)
        $node -is [Management.Automation.Language.CommandAst] -and $node.GetCommandName() -eq 'Read-Host'
    }, $true))
    Assert-Demo ($prompts.Count -eq 0) 'launcher AST has zero Read-Host calls in every mode'
    Write-Host "PASS Oracle demo launcher: $script:passed static/synthetic/native-fixture assertions; no live Oracle or real demo host invoked."
} finally {
    foreach ($key in $keys) { [Environment]::SetEnvironmentVariable($key, $original[$key], 'Process') }
    $original.Clear()
    Remove-Item -LiteralPath $directory -Recurse -Force -ErrorAction SilentlyContinue
}
