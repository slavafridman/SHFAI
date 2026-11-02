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
    'SHF_ORACLE_DEMO_ORG_UNIT_ID')
$original = @{}
foreach ($key in $keys) { $original[$key] = [Environment]::GetEnvironmentVariable($key, 'Process') }
$directory = Join-Path $PSScriptRoot (".shf-oracle-demo-launcher-" + [Guid]::NewGuid().ToString('N'))
$script:invocations = 0
$script:failNode = $false
$script:expectedUnit = 'DEMO'
$script:expectedAll = $false
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
    $script:expectedUnit = 'DEMO'
    $script:expectedAll = $false
    $script:answers.Clear()
    $script:prompts.Clear()
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
    Assert-Demo (-not (($output -join "`n") -match 'isolated-synthetic-password|isolated-secure-input|RAW_EXCEPTION_SENTINEL')) 'rejected input and exception never echoed'
}
try {
    New-Item -ItemType Directory -Path $directory | Out-Null
    # Empty isolated test sentinel, NOT a real client or DLL execution.
    New-Item -ItemType File -Path (Join-Path $directory 'oci.dll') | Out-Null
    $before = Get-DemoSnapshot
    $calls = $script:invocations
    . $launcher
    $nodeInvoker = ${function:Invoke-ShifterOracleDemoNode}
    Assert-DemoSnapshot $before
    Assert-Demo ($script:invocations -eq $calls -and $script:prompts.Count -eq 0) 'dot-source defines functions without launching or prompting'
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
        Assert-Demo (-not $env:SHF_ORACLE_CONFIG -and -not $env:SHF_NATIVE_EXIT_CONFIG) 'no inherited native or arbitrary application configuration'
        Assert-Demo ($null -eq [Environment]::GetEnvironmentVariable('SHF_ORACLE_DEMO_ORG_UNIT_ID', 'Process')) 'launcher-only unit key never reaches Node'
        if ($script:failNode) { throw 'RAW_EXCEPTION_SENTINEL isolated-synthetic-password' }
    }
    function Read-Host {
        param($Prompt, [switch]$AsSecureString, $ErrorAction)
        if ([string]$Prompt -match '(?i)unit|org.?unit' -or
            [string]$Prompt -match ([string][char]0x05D9 + [char]0x05D7 + [char]0x05D9 + [char]0x05D3 + [char]0x05D4)) {
            throw 'Unit prompts are forbidden'
        }
        $script:prompts.Add([string]$Prompt)
        if ($AsSecureString) { return (ConvertTo-SecureString 'isolated-secure-input' -AsPlainText -Force) }
        if ($script:answers.Count -eq 0) { throw 'Unexpected isolated prompt' }
        return $script:answers.Dequeue()
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
    $script:answers.Enqueue($directory)
    $script:answers.Enqueue($directory)
    Start-ShifterOracleDemo | Out-Null
    Assert-Demo ($script:prompts.Count -eq 3) 'only two missing paths and one SecureString password prompt'
    Assert-Demo ($script:answers.Count -eq 0) 'only client and TNS answers consumed'
    Assert-Demo ($script:prompts[2] -ceq 'Oracle password (process only)') 'existing secure helper reused'
    Assert-DemoSnapshot $before
    $source = [IO.File]::ReadAllText($launcher)
    Assert-Demo ($source -notmatch 'Start-Process|Set-Content|WriteAllText|Add-Content|npm install|Get-Credential') 'no background process, env file, install or credential vault'
    Assert-Demo ($source -notmatch "'User'|'Machine'") 'no persistent environment changes'
    Assert-Demo ($source -match '& node \$EntryPoint --test-read-only --org-unit \$Unit --port \$ListenPort') 'foreground Node argv contains scope and port only'
    Assert-Demo ($source -match '& node \$EntryPoint --test-read-only --all-test-units --port \$ListenPort') 'all foreground argv has opt-in and port only; no unit or password'
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
    Assert-Demo ($prompts.Count -eq 2 -and
        $prompts[0].Extent.Text -match 'Oracle Client' -and
        $prompts[1].Extent.Text -match 'TNS_ADMIN') 'launcher AST has only client and TNS Read-Host calls; no unit prompt or retry'
    Write-Host "PASS Oracle demo launcher: $script:passed static/synthetic assertions; no live Oracle or real Node launcher invoked."
} finally {
    foreach ($key in $keys) { [Environment]::SetEnvironmentVariable($key, $original[$key], 'Process') }
    $original.Clear()
    Remove-Item -LiteralPath $directory -Recurse -Force -ErrorAction SilentlyContinue
}
