# Focused offline checks for the delivery script, using only existing PS/Node.
[CmdletBinding()]
param()
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$builder = Join-Path $PSScriptRoot 'Build-Shifter.ps1'
$shell = (Get-Command powershell.exe).Source
$passed = 0
function Assert-Delivery([bool]$Condition, [string]$Message) {
    if (-not $Condition) { throw $Message }
    $script:passed++
    Write-Host "PASS $Message"
}

# Parser check does not execute build/application code.
$tokens = $null
$errors = $null
$null = [Management.Automation.Language.Parser]::ParseFile($builder, [ref]$tokens, [ref]$errors)
Assert-Delivery ($errors.Count -eq 0) 'Windows PowerShell builder syntax'

& $shell -NoProfile -File $builder -Profile invalid
Assert-Delivery ($LASTEXITCODE -ne 0) 'invalid profile rejected with nonzero exit'
& $shell -NoProfile -File $builder -Profile test -OutputDirectory $root
Assert-Delivery ($LASTEXITCODE -ne 0) 'repository-root output rejected before cleanup'
& $shell -NoProfile -File $builder -Profile test -OutputDirectory (Join-Path $root 'frontend/fixture-slice')
Assert-Delivery ($LASTEXITCODE -ne 0) 'source output collision rejected before cleanup'

# Dot-sourcing defines functions only; it cannot start an application build.
. $builder -Profile dev
# Phase checks are static/mocked; no actual compiled-browser claim is made here.
$builderText = Get-Content -LiteralPath $builder -Raw
$phaseCall = $builderText.IndexOf('Invoke-ShifterArtifactValidation $node $backend $stage')
Assert-Delivery ($phaseCall -gt $builderText.IndexOf('Write-ShifterZip $stage $zip')) 'artifact phase follows current ZIP creation'
Assert-Delivery ($phaseCall -gt $builderText.IndexOf('[IO.Compression.ZipFile]::ExtractToDirectory($zip, $extracted)')) 'artifact phase follows ZIP byte checks and extraction'
Assert-Delivery ($phaseCall -lt $builderText.IndexOf('Write-Host "PASS developer snapshot')) 'artifact phase required before build success'
$artifactSuite = Join-Path $root 'backend/fixture-slice/test/oracle-demo-artifact.mts'
$artifactText = Get-Content -LiteralPath $artifactSuite -Raw
$hostText = Get-Content -LiteralPath (Join-Path $root 'backend/fixture-slice/test/oracle-demo-host.test.mts') -Raw
Assert-Delivery (-not $hostText.Contains('demo actual compiled TEST browser')) 'compiled case no longer registered in backend default suite'
Assert-Delivery ($artifactText.Contains('assets: () => loadDemoAssets(stage)') -and
    $artifactText.Contains('process.env.SHF_TEST_ARTIFACT_STAGE') -and
    $artifactText.Contains('stage && isAbsolute(stage)')) 'artifact suite requires explicit stage and strict real asset loader'
$phaseRunner = ${function:Invoke-ShifterCommand}
$phaseEnv = [Environment]::GetEnvironmentVariable('SHF_TEST_ARTIFACT_STAGE', 'Process')
$script:artifactCalls = 0
try {
    [Environment]::SetEnvironmentVariable('SHF_TEST_ARTIFACT_STAGE', 'synthetic-previous', 'Process')
    function Invoke-ShifterCommand([string]$File, [string[]]$Arguments, [string]$Directory) {
        $script:artifactCalls++
        Assert-Delivery ($Arguments.Count -eq 3 -and $Arguments[0] -ceq '--test' -and
            $Arguments[1] -ceq '--test-concurrency=1' -and $Arguments[2] -ceq $artifactSuite) 'explicit artifact filename and serial Node runner'
        Assert-Delivery ($env:SHF_TEST_ARTIFACT_STAGE -ceq (Join-Path $root 'synthetic-current-stage')) 'artifact runner receives current stage not inherited output'
    }
    $backendPath = Join-Path $root 'backend/fixture-slice'
    foreach ($mode in @('dev', 'production')) {
        Invoke-ShifterArtifactValidation 'node.exe' $backendPath '' $mode $true
    }
    Invoke-ShifterArtifactValidation 'node.exe' $backendPath '' 'test' $false
    Assert-Delivery ($script:artifactCalls -eq 0) 'non-TEST and nonvalidation modes do not count or execute artifact case'
    Invoke-ShifterArtifactValidation 'node.exe' $backendPath (Join-Path $root 'synthetic-current-stage') 'test' $true
    Assert-Delivery ($script:artifactCalls -eq 1 -and $env:SHF_TEST_ARTIFACT_STAGE -ceq 'synthetic-previous') 'TEST validation invokes artifact case once and restores test-only ENV'
    $missingRejected = $false
    try { Invoke-ShifterArtifactValidation 'node.exe' (Join-Path $root 'missing-artifact-backend') '' 'test' $true }
    catch { $missingRejected = $_.Exception.Message -like 'Required TEST artifact suite missing:*' }
    Assert-Delivery ($missingRejected -and $script:artifactCalls -eq 1) 'missing explicit suite fails TEST validation before runner'
    function Invoke-ShifterCommand([string]$File, [string[]]$Arguments, [string]$Directory) {
        $failure = New-Object System.Exception('Synthetic artifact exit')
        $failure.Data['ExitCode'] = 38
        throw $failure
    }
    $phaseFailure = $null
    try { Invoke-ShifterArtifactValidation 'node.exe' $backendPath (Join-Path $root 'synthetic-current-stage') 'test' $true }
    catch { $phaseFailure = $_.Exception }
    Assert-Delivery ($null -ne $phaseFailure -and $phaseFailure.Data['ExitCode'] -eq 38 -and
        $env:SHF_TEST_ARTIFACT_STAGE -ceq 'synthetic-previous') 'artifact failure propagates child code and restores ENV'
} finally {
    ${function:Invoke-ShifterCommand} = $phaseRunner
    [Environment]::SetEnvironmentVariable('SHF_TEST_ARTIFACT_STAGE', $phaseEnv, 'Process')
}
$snapshot = @(Get-ShifterSourceSnapshot)
Assert-ShifterSourceSnapshot $snapshot @(Get-ShifterSourceSnapshot)
Assert-Delivery ($snapshot.Count -gt 0) 'canonical source-byte snapshot matches current checkout'
$syntheticRows = @("SOURCE`tfrontend/fixture-slice/src/workspace-shell.html`t1`t$('A' * 64)")
foreach ($changed in @(
    @("SOURCE`tfrontend/fixture-slice/src/workspace-shell.html`t1`t$('B' * 64)"),
    @($syntheticRows[0], "SOURCE`tfrontend/fixture-slice/src/new.ts`t1`t$('A' * 64)"),
    @()
)) {
    $rejected = $false
    try { Assert-ShifterSourceSnapshot $syntheticRows $changed } catch { $rejected = $true }
    Assert-Delivery $rejected 'changed/added/missing source snapshot rejects validated reuse'
}
Assert-Delivery ((Get-ShifterSnapshotHash $syntheticRows) -cmatch '^[A-F0-9]{64}$') 'source proof is canonical UTF8 SHA256'
Assert-Delivery (Test-ShifterBrowserAsset 'attendance-page.css.map' 'dev') 'known Angular component map accepted only for dev'
Assert-Delivery (Test-ShifterBrowserAsset 'employee-name.css.map' 'dev') 'known inline employee component map accepted for dev'
Assert-Delivery (Test-ShifterBrowserAsset 'minute-picker.css.map' 'dev') 'known inline minute component map accepted for dev'
Assert-Delivery (-not (Test-ShifterBrowserAsset 'attendance-page.css.map' 'test')) 'component map rejected for test'
Assert-Delivery (-not (Test-ShifterBrowserAsset 'attendance-page.css.map' 'production')) 'component map rejected for production'
foreach ($name in @('station-exit-cancellation-dialog.css.map', 'station-exit-cancellation-page.css.map')) {
    Assert-Delivery (Test-ShifterBrowserAsset $name 'dev') "existing cancellation UI component map accepted for DEV: $name"
    Assert-Delivery (-not (Test-ShifterBrowserAsset $name 'test')) "cancellation component map rejected for TEST: $name"
    Assert-Delivery (-not (Test-ShifterBrowserAsset $name 'production')) "cancellation component map rejected for production: $name"
}
foreach ($name in @('unknown.css.map', '../attendance-page.css.map', 'Attendance-page.css.map', 'private.json')) {
    Assert-Delivery (-not (Test-ShifterBrowserAsset $name 'dev')) "browser allowlist rejects unknown/noncanonical asset: $name"
}
$script:OwnedOutput = Join-Path $root '.shifter-developer-delivery/checks/output'
$OutputDirectory = $script:OwnedOutput
$profileRoot = Join-Path $script:OwnedOutput 'dev'
$zip = Join-Path $profileRoot 'shifter-developer-dev.zip'
$stage = Join-Path $profileRoot 'stage'
$build = Join-Path $profileRoot 'frontend-build'
Assert-ShifterNoLink $profileRoot
foreach ($path in @($zip, $stage, $build)) {
    if (Test-Path -LiteralPath $path) { throw 'Focused fixture paths already exist; refusing to overwrite.' }
}
New-Item -ItemType Directory -Path $stage, $build -Force | Out-Null
# Synthetic stale artifacts are confined to exact owned test fixture paths.
Set-Content -LiteralPath $zip -Value 'synthetic stale zip'
Set-Content -LiteralPath (Join-Path $stage 'sentinel.txt') -Value 'synthetic'
Set-Content -LiteralPath (Join-Path $build 'sentinel.txt') -Value 'synthetic'
$originalCommand = ${function:Invoke-ShifterCommand}
$script:childCalls = 0
try {
    # Fail the first command with an actual native process exit; never execute a
    # package command. Exercise the real runner and the real build cleanup path.
    function Invoke-ShifterCommand([string]$File, [string[]]$Arguments, [string]$Directory) {
        $script:childCalls++
        & $originalCommand (Get-Command node.exe).Source @('-e', 'process.exit(37)') $Directory
    }
    $caught = $null
    try { Invoke-ShifterBuild } catch { $caught = $_.Exception }
    Assert-Delivery ($null -ne $caught -and $caught.Data['ExitCode'] -eq 37) 'real child exit 37 propagated through build'
    Assert-Delivery ($script:childCalls -eq 1) 'failure stops all later child commands'
    Assert-Delivery (-not (Test-Path -LiteralPath $zip)) 'failed run removes stale ZIP'
    Assert-Delivery (-not (Test-Path -LiteralPath $stage)) 'failed run removes staged distribution'
    Assert-Delivery (-not (Test-Path -LiteralPath $build)) 'failed run removes owned frontend output'
    $unsafe = $false
    try { Remove-ShifterOwned $root $profileRoot } catch { $unsafe = $true }
    Assert-Delivery $unsafe 'cleanup refuses repository root'
} finally {
    ${function:Invoke-ShifterCommand} = $originalCommand
    foreach ($path in @($zip, $stage, $build)) { Remove-ShifterOwned $path $profileRoot }
}

# Optional checker argument and unchanged default are both tested without
# reading/modifying the pilot's assets. Minimal synthetic public bundles only.
$checker = Join-Path $root 'frontend/fixture-slice/checks/environment-build-check.mjs'
$checkerText = Get-Content -LiteralPath $checker -Raw
Assert-Delivery ($checkerText.Contains("join(root, 'dist/fixture-slice/browser')")) 'profile checker retains backward-compatible default'
$checkerFixture = Join-Path $root '.shifter-developer-delivery/checks/browser'
Assert-ShifterNoLink $checkerFixture
New-Item -ItemType Directory -Path $checkerFixture -Force | Out-Null
$bundle = Join-Path $checkerFixture 'main.js'
if (Test-Path -LiteralPath $bundle) { throw 'Checker fixture already exists; refusing overwrite.' }
try {
    Set-Content -LiteralPath $bundle -Value "const environment=Object.freeze({appEnv:'test',apiBasePath:'/api'});"
    & node.exe $checker test $checkerFixture
    Assert-Delivery ($LASTEXITCODE -eq 0) 'checker accepts explicit isolated output directory'
    & node.exe $checker production $checkerFixture
    Assert-Delivery ($LASTEXITCODE -ne 0) 'checker rejects wrong compiled profile'
    & node.exe $checker invalid $checkerFixture
    Assert-Delivery ($LASTEXITCODE -ne 0) 'checker rejects invalid profile'
} finally { Remove-Item -LiteralPath $bundle -Force }

# Import/file closure tests use synthetic source only, not the live application.
$closureFixture = Join-Path $root '.shifter-developer-delivery/checks/closure'
Assert-ShifterNoLink $closureFixture
New-Item -ItemType Directory -Path $closureFixture -Force | Out-Null
$fixtureFiles = @('server.mts', 'contracts.mts', 'package.json')
foreach ($file in $fixtureFiles) {
    if (Test-Path -LiteralPath (Join-Path $closureFixture $file)) { throw 'Closure fixture already exists.' }
}
try {
    Set-Content -LiteralPath (Join-Path $closureFixture 'package.json') -Value '{"dependencies":{"oracledb":"26.0.0"}}'
    Set-Content -LiteralPath (Join-Path $closureFixture 'contracts.mts') -Value 'export type Example = string;'
    Set-Content -LiteralPath (Join-Path $closureFixture 'server.mts') -Value 'import type {Example} from "./contracts.mts"; const driver = () => import("oracledb");'
    $closure = @(Get-ShifterClosure $closureFixture)
    Assert-Delivery (($closure -join ',') -eq 'contracts.mts,server.mts') 'closure includes relative type imports and declared driver'
    Set-Content -LiteralPath (Join-Path $closureFixture 'populated-server.mts') -Value 'import "./contracts.mts";'
    $both = @(Get-ShifterClosure $closureFixture @('server.mts', 'populated-server.mts'))
    Assert-Delivery (($both -join ',') -eq 'contracts.mts,populated-server.mts,server.mts') 'explicit populated launcher closure includes only reachable modules'
    Remove-Item -LiteralPath (Join-Path $closureFixture 'populated-server.mts')
    $rejected = $false
    try { Get-ShifterClosure $closureFixture @('unapproved.mts') } catch { $rejected = $true }
    Assert-Delivery $rejected 'unapproved runtime entrypoint rejected'
    foreach ($scenario in @(
        'import "../outside.mts";',
        'import "./missing.mts";',
        'const driver = import(variable);',
        'const asset = new URL("./data.json", import.meta.url);',
        'readFileSync("./data.json");',
        'import "./oracle-live-check.mts";',
        'import "unapproved-package";'
    )) {
        Set-Content -LiteralPath (Join-Path $closureFixture 'server.mts') -Value $scenario
        $rejected = $false
        try { $null = Get-ShifterClosure $closureFixture } catch { $rejected = $true }
        Assert-Delivery $rejected "closure rejects out-of-scope dependency: $scenario"
    }
} finally {
    foreach ($file in $fixtureFiles) { Remove-Item -LiteralPath (Join-Path $closureFixture $file) -Force }
}
# Exercise the actual archive writer, including raw names on Windows PS 5.1.
$zipFixture = Join-Path $root '.shifter-developer-delivery/checks/zipwriter'
$zipStage = Join-Path $zipFixture 'stage'
$synthetic = Join-Path $zipStage 'nested/synthetic.txt'
$syntheticZip = Join-Path $zipFixture 'synthetic.zip'
Assert-ShifterNoLink $zipFixture
foreach ($file in @($synthetic, $syntheticZip)) {
    if (Test-Path -LiteralPath $file) { throw 'ZIP writer fixture already exists; refusing overwrite.' }
}
New-Item -ItemType Directory -Path (Split-Path -Parent $synthetic) -Force | Out-Null
try {
    Set-Content -LiteralPath $synthetic -Value 'synthetic archive payload'
    Write-ShifterZip $zipStage $syntheticZip @('nested/synthetic.txt')
    $archive = [IO.Compression.ZipFile]::OpenRead($syntheticZip)
    try {
        Assert-Delivery ($archive.Entries.Count -eq 1 -and
            $archive.Entries[0].FullName -ceq 'nested/synthetic.txt') 'actual ZIP writer preserves exact canonical nested raw name'
        Assert-Delivery (@($archive.Entries | Where-Object { $_.FullName.Contains('\') }).Count -eq 0) 'actual ZIP writer emits zero raw backslashes'
    } finally { $archive.Dispose() }
    Remove-Item -LiteralPath $syntheticZip -Force
    foreach ($names in @(
        @('nested/missing.txt'),
        @('../synthetic.txt'),
        @('nested\synthetic.txt'),
        @('/nested/synthetic.txt'),
        @('C:/nested/synthetic.txt'),
        @('nested/synthetic.txt', 'nested/synthetic.txt'),
        @('nested/synthetic.txt', 'Nested/Synthetic.txt')
    )) {
        $rejected = $false
        try { Write-ShifterZip $zipStage $syntheticZip $names } catch { $rejected = $true }
        Assert-Delivery ($rejected -and -not (Test-Path -LiteralPath $syntheticZip)) "ZIP writer rejects invalid inputs before output: $($names -join ',')"
    }
} finally {
    foreach ($file in @($syntheticZip, $synthetic)) {
        if (Test-Path -LiteralPath $file) { Remove-Item -LiteralPath $file -Force }
    }
}
Write-Host "PASS focused delivery checks: $passed; no package builds, services, installs or live connections"
