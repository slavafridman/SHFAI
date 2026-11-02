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
    'SHF_NATIVE_EXIT_CONFIG', 'SHF_ORACLE_CONFIG', 'SHF_TEST_ORACLE_STAGE_WRITE_ENABLED')
$original = @{}
foreach ($key in $keys) { $original[$key] = [Environment]::GetEnvironmentVariable($key, 'Process') }
$directory = Join-Path ([IO.Path]::GetTempPath()) ("shf-oracle-demo-launcher-" + [Guid]::NewGuid().ToString('N'))
$script:invocations = 0
$script:failNode = $false
$script:prompts = New-Object 'System.Collections.Generic.List[string]'
$script:answers = New-Object 'System.Collections.Generic.Queue[string]'
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
    $script:answers.Clear()
    $script:prompts.Clear()
}
function Assert-DemoRejected($action) {
    $before = Get-DemoSnapshot
    $calls = $script:invocations
    $caught = $false
    try { & $action | Out-Null } catch { $caught = $true }
    Assert-Demo $caught 'invalid demo input fails explicitly'
    Assert-Demo ($script:invocations -eq $calls) 'rejection happens before Node/pool/HTTP'
    Assert-DemoSnapshot $before
}
try {
    New-Item -ItemType Directory -Path $directory | Out-Null
    # Empty isolated test sentinel, NOT a real client or DLL execution.
    New-Item -ItemType File -Path (Join-Path $directory 'oci.dll') | Out-Null
    $before = Get-DemoSnapshot
    . $launcher
    Assert-DemoSnapshot $before
    function Invoke-ShifterOracleDemoNode {
        param([string]$EntryPoint, [string]$Unit, [int]$ListenPort)
        $script:invocations++
        Assert-Demo ($Unit -ceq 'DEMO') 'only operator supplied exact scope forwarded'
        Assert-Demo ($ListenPort -eq 18083) 'default host port18083 forwarded'
        Assert-Demo ($EntryPoint.EndsWith('backend\fixture-slice\oracle-demo-host.mts') -or
            $EntryPoint.EndsWith('backend/fixture-slice/oracle-demo-host.mts')) 'source host used instead of stale backend payload'
        Assert-Demo ($env:NODE_ENV -ceq 'test' -and $env:SHF_APP_ENV -ceq 'test') 'explicit isolated TEST profile'
        Assert-Demo ($env:SHF_ORACLE_USER -ceq 'shifter' -and $env:SHF_ORACLE_CONNECT_STRING -ceq 'CTIDBT_WFMT.WORLD') 'approved account and alias only'
        Assert-Demo ($env:SHF_ORACLE_PASSWORD -cin @('isolated-synthetic-password', 'isolated-secure-input')) 'synthetic secret only in process environment'
        Assert-Demo (-not $env:SHF_ORACLE_CONFIG -and -not $env:SHF_NATIVE_EXIT_CONFIG) 'no inherited native or arbitrary application configuration'
        if ($script:failNode) { throw 'Synthetic Node startup failure' }
    }
    function Read-Host {
        param($Prompt, [switch]$AsSecureString, $ErrorAction)
        $script:prompts.Add([string]$Prompt)
        if ($AsSecureString) { return (ConvertTo-SecureString 'isolated-secure-input' -AsPlainText -Force) }
        if ($script:answers.Count -eq 0) { throw 'Unexpected isolated prompt' }
        return $script:answers.Dequeue()
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
    [Environment]::SetEnvironmentVariable('SHF_ORACLE_PASSWORD', $null, 'Process')
    [Environment]::SetEnvironmentVariable('SHF_ORACLE_CLIENT_LIB_DIR', $null, 'Process')
    [Environment]::SetEnvironmentVariable('TNS_ADMIN', $null, 'Process')
    $before = Get-DemoSnapshot
    $script:answers.Enqueue('DEMO')
    $script:answers.Enqueue($directory)
    $script:answers.Enqueue($directory)
    Start-ShifterOracleDemo | Out-Null
    Assert-Demo ($script:prompts.Count -eq 4) 'one unit, two missing paths and one SecureString password prompt'
    Assert-Demo ($script:prompts[0] -match 'not employee ID/password; no default') 'unit prompt explains scope, not employee/password'
    Assert-Demo ($script:prompts[3] -ceq 'Oracle password (process only)') 'existing secure helper reused'
    Assert-DemoSnapshot $before
    $source = [IO.File]::ReadAllText($launcher)
    Assert-Demo ($source -notmatch 'Start-Process|Set-Content|WriteAllText|Add-Content|npm install|Get-Credential') 'no background process, env file, install or credential vault'
    Assert-Demo ($source -notmatch "'User'|'Machine'") 'no persistent environment changes'
    Assert-Demo ($source -match '& node \$EntryPoint --test-read-only --org-unit \$Unit --port \$ListenPort') 'foreground Node argv contains scope and port only'
    Write-Host "PASS Oracle demo launcher: $script:passed static/synthetic assertions; no live Oracle or real Node launcher invoked."
} finally {
    foreach ($key in $keys) { [Environment]::SetEnvironmentVariable($key, $original[$key], 'Process') }
    $original.Clear()
    Remove-Item -LiteralPath $directory -Recurse -Force -ErrorAction SilentlyContinue
}
