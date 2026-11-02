[CmdletBinding()]
param()
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$passed = 0
function Assert-OracleEnvironment([bool]$Condition, [string]$Message) {
    if (-not $Condition) { throw $Message }
    $script:passed++
    Write-Host "PASS $Message"
}
$helper = Join-Path $PSScriptRoot 'Set-ShifterOracleEnvironment.ps1'
foreach ($file in @($helper, $PSCommandPath)) {
    $tokens = $null; $errors = $null
    [void][Management.Automation.Language.Parser]::ParseFile($file, [ref]$tokens, [ref]$errors)
    Assert-OracleEnvironment ($errors.Count -eq 0) 'Windows PowerShell parser accepts script'
}
# Snapshot only assigned keys. Never print environment values or exception data.
$keys = @('SHF_ORACLE_CONNECT_STRING', 'SHF_ORACLE_USER', 'SHF_ORACLE_PASSWORD',
    'SHF_ORACLE_CLIENT_LIB_DIR', 'TNS_ADMIN', 'SHF_APP_ENV', 'SHF_ORACLE_CONFIG',
    'SHF_FIXTURE_CONFIG', 'SHF_TEST_ORACLE_STAGE_WRITE_ENABLED', 'NODE_ENV')
$original = @{}
$persistent = @{}
foreach ($key in $keys) {
    $original[$key] = [Environment]::GetEnvironmentVariable($key, 'Process')
    foreach ($scope in @('User', 'Machine')) {
        $persistent["$scope/$key"] = [Environment]::GetEnvironmentVariable($key, $scope)
    }
}
$existingReader = Get-Item Function:Read-Host -ErrorAction SilentlyContinue
$promptMode = 'forbidden'
$promptCalls = 0
function Read-Host {
    param($Prompt, [switch]$AsSecureString, $ErrorAction)
    $script:promptCalls++
    if (-not $AsSecureString -or $script:promptMode -eq 'forbidden') {
        throw 'Synthetic input must not be requested'
    }
    if ($script:promptMode -eq 'failure') { throw 'synthetic-sensitive-error' }
    if ($script:promptMode -eq 'empty') { return (New-Object Security.SecureString) }
    return (ConvertTo-SecureString 'synthetic-interactive-only' -AsPlainText -Force)
}
function Get-TestSnapshot {
    $snapshot = @{}
    foreach ($key in $keys) { $snapshot[$key] = [Environment]::GetEnvironmentVariable($key, 'Process') }
    return $snapshot
}
function Assert-TestSnapshot($Expected, [string]$Message) {
    $same = $true
    foreach ($key in $keys) {
        if ([Environment]::GetEnvironmentVariable($key, 'Process') -cne $Expected[$key]) { $same = $false }
    }
    Assert-OracleEnvironment $same $Message
}
function Assert-Rejected($Action, [string]$ExpectedMessage) {
    $before = Get-TestSnapshot
    $caught = $false; $safe = $false
    try { & $Action | Out-Null } catch {
        $caught = $true
        $safe = $_.Exception.Message -ceq $ExpectedMessage
    }
    Assert-OracleEnvironment $caught 'invalid prerequisite rejected'
    Assert-OracleEnvironment $safe 'constant diagnostic without sensitive values'
    Assert-TestSnapshot $before 'failure preserves all process inputs and existing password'
    $before.Clear()
}
try {
    $before = Get-TestSnapshot
    . $helper
    Assert-TestSnapshot $before 'dot-source is inert'
    $warning = @(& $helper 3>&1)
    Assert-OracleEnvironment ($warning.Count -eq 1 -and $warning[0].ToString() -ceq
        'Dot-source this script and call Set-ShifterOracleEnvironment in the launcher process. Direct script execution does not configure the caller.') 'direct invocation warns about caller process scope'
    Assert-TestSnapshot $before 'direct invocation is inert'
    $before.Clear()
    $directory = $PSScriptRoot
    foreach ($key in $keys) { [Environment]::SetEnvironmentVariable($key, 'synthetic-sentinel', 'Process') }
    foreach ($profile in @('dev', 'test', 'production')) {
        $env:SHF_ORACLE_PASSWORD = 'synthetic-inherited-only'
        $before = Get-TestSnapshot
        $output = @(Set-ShifterOracleEnvironment -Profile $profile -ClientLibDir $directory -TnsAdmin $directory -NonInteractive)
        Assert-OracleEnvironment ($env:SHF_ORACLE_CONNECT_STRING -ceq 'CTIDBT_WFMT' -and
            $env:SHF_ORACLE_USER -ceq 'shifter') "shared default target for $profile"
        Assert-OracleEnvironment ($env:SHF_ORACLE_PASSWORD -ceq 'synthetic-inherited-only') 'inherited password reused without prompting'
        Assert-OracleEnvironment ($env:SHF_ORACLE_CLIENT_LIB_DIR -ceq $directory -and
            $env:TNS_ADMIN -ceq $directory) 'explicit directory inputs applied'
        $unchanged = $true
        foreach ($key in $keys | Select-Object -Skip 5) {
            if ([Environment]::GetEnvironmentVariable($key, 'Process') -cne $before[$key]) { $unchanged = $false }
        }
        Assert-OracleEnvironment $unchanged 'profile datasource auth and writer controls untouched'
        Assert-OracleEnvironment ($output.Count -eq 1 -and $output[0] -ceq
            'Oracle process inputs prepared only; no connection, client verification or readiness proof performed. Deployment and security gates unchanged.') 'success output is constant and contains no credentials'
        $before.Clear()
    }
    Set-ShifterOracleEnvironment -Profile test -ConnectString 'ctidbt_wfmt.world' -NonInteractive | Out-Null
    Assert-OracleEnvironment ($env:SHF_ORACLE_CONNECT_STRING -ceq 'CTIDBT_WFMT.WORLD') 'approved WORLD spelling canonicalized with inherited directories'
    Assert-OracleEnvironment ($promptCalls -eq 0) 'noninteractive inherited-secret cases never prompt'
    $pathMessage = 'Oracle client and TNS directories must be explicitly supplied existing local absolute Windows directories.'
    foreach ($bad in @('', '.', '\\synthetic\share', 'Z:\synthetic-not-existing-shf-directory', $helper)) {
        Assert-Rejected { Set-ShifterOracleEnvironment -Profile test -ClientLibDir $bad -NonInteractive } $pathMessage
        Assert-Rejected { Set-ShifterOracleEnvironment -Profile test -TnsAdmin $bad -NonInteractive } $pathMessage
    }
    Assert-Rejected { Set-ShifterOracleEnvironment -Profile test -ConnectString 'synthetic-invalid-alias' -NonInteractive } 'Oracle target alias must be an approved CTIDBT_WFMT spelling.'
    $before = Get-TestSnapshot
    $rejected = $false
    try { Set-ShifterOracleEnvironment -Profile 'synthetic-invalid-profile' -NonInteractive | Out-Null }
    catch { $rejected = $true }
    Assert-OracleEnvironment $rejected 'invalid profile rejected without fallback'
    Assert-TestSnapshot $before 'invalid profile preserves all process inputs'
    $before.Clear()
    [Environment]::SetEnvironmentVariable('SHF_ORACLE_PASSWORD', $null, 'Process')
    Assert-Rejected { Set-ShifterOracleEnvironment -Profile test -NonInteractive } 'SHF_ORACLE_PASSWORD is required in the current process; interactive input is disabled.'
    Assert-OracleEnvironment ($promptCalls -eq 0) 'missing noninteractive secret never prompts'
    $promptMode = 'failure'
    Assert-Rejected { Set-ShifterOracleEnvironment -Profile test } 'Oracle secure password input unavailable; environment unchanged.'
    $promptMode = 'empty'
    Assert-Rejected { Set-ShifterOracleEnvironment -Profile test } 'Oracle process password is invalid; environment unchanged.'
    $promptMode = 'success'
    Set-ShifterOracleEnvironment -Profile test | Out-Null
    Assert-OracleEnvironment ($env:SHF_ORACLE_PASSWORD -ceq 'synthetic-interactive-only') 'SecureString prompt hands password to process only'
    Assert-OracleEnvironment ($promptCalls -eq 3) 'only explicit interactive cases prompt'
    $env:SHF_ORACLE_PASSWORD = ('x' * 1025)
    Assert-Rejected { Set-ShifterOracleEnvironment -Profile test -NonInteractive } 'Oracle process password is invalid; environment unchanged.'
    $functionVariables = @('password', 'securePassword', 'buffer', 'previous', 'values')
    Assert-OracleEnvironment (@($functionVariables | Where-Object {
        Get-Variable -Name $_ -Scope Script -ErrorAction SilentlyContinue
    }).Count -eq 0) 'helper credential variables do not escape function scope'
    foreach ($key in $keys) {
        foreach ($scope in @('User', 'Machine')) {
            Assert-OracleEnvironment ([Environment]::GetEnvironmentVariable($key, $scope) -ceq
                $persistent["$scope/$key"]) 'persistent environment unchanged'
        }
    }
} finally {
    foreach ($key in $keys) { [Environment]::SetEnvironmentVariable($key, $original[$key], 'Process') }
    Remove-Item Function:Read-Host
    if ($null -ne $existingReader) { Set-Item Function:Read-Host $existingReader.ScriptBlock }
    Remove-Item Function:Set-ShifterOracleEnvironment -ErrorAction SilentlyContinue
    $persistent.Clear()
}
Assert-TestSnapshot $original 'test restores all original process variables'
$original.Clear()
Write-Host "PASS $passed assertions (static and synthetic only; no Oracle access)"
