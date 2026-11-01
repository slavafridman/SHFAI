# Windows PowerShell 5.1 / PowerShell compatible. No installs, services or ENV loading.
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('dev', 'test', 'production')]
    [string]$Profile,
    [switch]$Validation,
    [string]$OutputDirectory
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$script:Repository = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$script:OwnedOutput = Join-Path $script:Repository '.shifter-developer-delivery'

function Assert-ShifterNoLink([string]$Path) {
    $current = [IO.Path]::GetFullPath($Path)
    while ($current) {
        if (Test-Path -LiteralPath $current) {
            $item = Get-Item -LiteralPath $current -Force
            if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) {
                throw 'Reparse points are not permitted in build input/output paths.'
            }
        }
        $parent = Split-Path -Parent $current
        if ($parent -eq $current) { break }
        $current = $parent
    }
}

function Invoke-ShifterCommand([string]$File, [string[]]$Arguments, [string]$Directory) {
    Push-Location -LiteralPath $Directory
    try {
        Write-Host ("RUN {0} {1}" -f $File, ($Arguments -join ' '))
        & $File @Arguments | Out-Host
        $code = $LASTEXITCODE
        if ($code -ne 0) {
            $failure = New-Object System.Exception("Child command failed (exit $code).")
            $failure.Data['ExitCode'] = $code
            throw $failure
        }
    } finally { Pop-Location }
}

function Remove-ShifterOwned([string]$Path, [string]$ProfileRoot) {
    # Only these exact, resolved outputs can ever be recursively removed.
    $allowed = @(
        (Join-Path $ProfileRoot 'frontend-build'),
        (Join-Path $ProfileRoot 'stage'),
        (Join-Path $ProfileRoot 'extracted-check'),
        (Join-Path $ProfileRoot "shifter-developer-$Profile.zip")
    )
    $full = [IO.Path]::GetFullPath($Path)
    if ($allowed -notcontains $full -or
        [IO.Path]::GetFullPath($ProfileRoot) -ne (Join-Path $script:OwnedOutput $Profile)) {
        throw 'Refusing cleanup outside exact owned outputs.'
    }
    Assert-ShifterNoLink $full
    if (Test-Path -LiteralPath $full) {
        # Inspect links before recursive cleanup; never follow an injected junction.
        if (Test-Path -LiteralPath $full -PathType Container) {
            $pending = New-Object 'System.Collections.Generic.Queue[string]'
            $pending.Enqueue($full)
            while ($pending.Count) {
                foreach ($entry in Get-ChildItem -LiteralPath $pending.Dequeue() -Force) {
                    if ($entry.Attributes -band [IO.FileAttributes]::ReparsePoint) {
                        throw 'Refusing cleanup containing a reparse point.'
                    }
                    if ($entry.PSIsContainer) { $pending.Enqueue($entry.FullName) }
                }
            }
        }
        Remove-Item -LiteralPath $full -Recurse -Force
    }
}

function Get-ShifterClosure([string]$Backend, [string[]]$EntryPoints = @('server.mts')) {
    # Current application uses literal relative .mts imports (including type imports)
    # and dynamic import("oracledb"). Fail if that supported packaging scope changes.
    $queue = New-Object 'System.Collections.Generic.Queue[string]'
    $seen = New-Object 'System.Collections.Generic.HashSet[string]'
    foreach ($entry in $EntryPoints) {
        if (@('server.mts', 'populated-server.mts') -cnotcontains $entry) {
            throw 'Unapproved runtime entrypoint.'
        }
        $queue.Enqueue($entry)
    }
    $manifest = Get-Content -LiteralPath (Join-Path $Backend 'package.json') -Raw | ConvertFrom-Json
    $dependencies = @($manifest.dependencies.PSObject.Properties.Name)
    $pattern = '(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)["'']([^"'']+)["'']'
    while ($queue.Count) {
        $name = $queue.Dequeue()
        if (-not $seen.Add($name)) { continue }
        if ($name -notmatch '^[a-z][a-z0-9-]*\.mts$' -or $name -match 'live-check|test|sample') {
            throw "Unsupported runtime closure member: $name"
        }
        $path = Join-Path $Backend $name
        Assert-ShifterNoLink $path
        $text = Get-Content -LiteralPath $path -Raw
        foreach ($match in [regex]::Matches($text, $pattern)) {
            $import = $match.Groups[1].Value
            if ($import.StartsWith('./')) { $queue.Enqueue($import.Substring(2)) }
            elseif (-not $import.StartsWith('node:') -and $dependencies -notcontains $import) {
                throw "Undeclared or out-of-scope backend import: $import"
            }
        }
        # Runtime file IO is operator-supplied allowance configuration, not a
        # repository asset. No .env/allowance/session files are ever read/copied.
        if ($text -match '(?:readFile(?:Sync)?|createReadStream)\s*\(\s*["'']' -or
            $text -match 'new\s+URL\s*\(\s*["''][^"'']+["'']\s*,\s*import\.meta\.url') {
            throw "New runtime file dependency requires explicit packaging review: $name"
        }
        if ($text -match '\bimport\s*\(\s*[^"''\s]') {
            throw "Nonliteral dynamic import requires packaging review: $name"
        }
    }
    return @($seen | Sort-Object)
}

function Get-ShifterSourceSnapshot {
    # Hash only enumerated application/tooling inputs, never private operator
    # configuration, docs, installed dependencies or arbitrary repository files.
    $names = @(& git -C $script:Repository ls-files --cached --others --exclude-standard -- backend/fixture-slice frontend/fixture-slice)
    if ($LASTEXITCODE -ne 0) { throw 'Cannot enumerate scoped source inputs.' }
    $rows = @()
    foreach ($name in ($names | Sort-Object -Unique)) {
        $allowed = $name -cmatch '^backend/fixture-slice/(?:[a-z0-9-]+\.mts|test/(?:[A-Za-z0-9._-]+/)*[A-Za-z0-9._-]+\.mts|package(?:-lock)?\.json|tsconfig\.json|config-examples/(?:dev|test|production)\.example\.json)$' -or
            $name -cmatch '^frontend/fixture-slice/(?:src/(?:[A-Za-z0-9._-]+/)*[A-Za-z0-9._-]+\.(?:ts|html|scss|css)|checks/[A-Za-z0-9._-]+\.(?:mjs|mts|ts)|package(?:-lock)?\.json|angular\.json|tsconfig(?:\.app|\.spec)?\.json|vitest\.config\.ts)$'
        if (-not $allowed) { continue }
        $path = Join-Path $script:Repository $name
        Assert-ShifterNoLink $path
        $rows += "SOURCE`t$name`t$((Get-Item -LiteralPath $path).Length)`t$((Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash)"
    }
    if (-not $rows.Count) { throw 'Missing scoped source inputs.' }
    return $rows
}

function Get-ShifterSnapshotHash([string[]]$Rows) {
    $sha = [Security.Cryptography.SHA256]::Create()
    try {
        return [BitConverter]::ToString($sha.ComputeHash(
            [Text.Encoding]::UTF8.GetBytes(($Rows -join "`n") + "`n"))).Replace('-', '')
    } finally { $sha.Dispose() }
}

function Assert-ShifterSourceSnapshot([string[]]$Recorded, [string[]]$Current) {
    if (-not $Recorded.Count -or ($Recorded -join "`n") -cne ($Current -join "`n")) {
        throw 'Scoped source bytes differ from validation snapshot; run the canonical DEV full validation.'
    }
}

function Write-ShifterZip([string]$Stage, [string]$Zip, [string[]]$EntryNames) {
    # Never derive archive names from Windows filesystem separators.
    # Validate the entire explicit whitelist before creating an output file.
    $stageRoot = [IO.Path]::GetFullPath($Stage)
    $zipPath = [IO.Path]::GetFullPath($Zip)
    Assert-ShifterNoLink $stageRoot
    Assert-ShifterNoLink $zipPath
    if ($zipPath -eq $stageRoot -or $zipPath.StartsWith($stageRoot + [IO.Path]::DirectorySeparatorChar,
        [StringComparison]::OrdinalIgnoreCase)) { throw 'ZIP output must be outside its staging directory.' }
    if ($EntryNames.Count -eq 0) { throw 'ZIP whitelist must not be empty.' }
    $seen = New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::OrdinalIgnoreCase)
    foreach ($name in $EntryNames) {
        if ($name -cnotmatch '^[A-Za-z0-9][A-Za-z0-9._-]*(?:/[A-Za-z0-9][A-Za-z0-9._-]*)*$' -or
            -not $seen.Add($name)) { throw 'ZIP input names must be canonical, relative and unique without case collisions.' }
        $source = Join-Path $stageRoot $name
        Assert-ShifterNoLink $source
        if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw "Missing ZIP input: $name" }
    }
    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive = [IO.Compression.ZipFile]::Open($zipPath, [IO.Compression.ZipArchiveMode]::Create)
    try {
        foreach ($name in ($EntryNames | Sort-Object)) {
            $null = [IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
                $archive, (Join-Path $stageRoot $name), $name, [IO.Compression.CompressionLevel]::Optimal)
        }
    } finally { $archive.Dispose() }
}

function Test-ShifterBrowserAsset([string]$Name, [string]$SelectedProfile) {
    if ($Name -cmatch '^(?:index\.html|(?:main|polyfills|chunk|styles)(?:-[A-Za-z0-9]+)?\.(?:js|css)(?:\.map)?)$') {
        return $true
    }
    # Angular development emits separate component stylesheet source maps.
    # Explicit current stylesheet names only; never allow arbitrary JSON/maps.
    $componentMaps = @(
        'arrival-focus.css.map', 'attendance-calendar.css.map', 'attendance-page.css.map',
        'current-shifts-page.css.map', 'employee-card-page.css.map', 'my-shifts-page.css.map',
        'shift-day-page.css.map', 'shift-items-page.css.map', 'shift-management-dialog.css.map',
        'shift-management-page.css.map', 'shift-search-page.css.map', 'stage-arrival-page.css.map',
        'station-arrival-dialog.css.map', 'station-arrival-page.css.map', 'station-exit-page.css.map',
        'station-exit-cancellation-dialog.css.map', 'station-exit-cancellation-page.css.map',
        'workspace-shell.css.map', 'employee-name.css.map', 'minute-picker.css.map'
    )
    return $SelectedProfile -ceq 'dev' -and $componentMaps -ccontains $Name
}

function Invoke-ShifterBuild {
    if (-not $OutputDirectory) { $OutputDirectory = $script:OwnedOutput }
    $fullOutput = [IO.Path]::GetFullPath($OutputDirectory)
    if ($fullOutput -ne $script:OwnedOutput) {
        throw 'OutputDirectory must be the exact repository .shifter-developer-delivery directory.'
    }
    Assert-ShifterNoLink $script:Repository
    Assert-ShifterNoLink $fullOutput
    $backend = Join-Path $script:Repository 'backend/fixture-slice'
    $frontend = Join-Path $script:Repository 'frontend/fixture-slice'
    foreach ($directory in @($backend, $frontend)) {
        Assert-ShifterNoLink $directory
        foreach ($file in @('package.json', 'package-lock.json')) {
            Assert-ShifterNoLink (Join-Path $directory $file)
            if (-not (Test-Path -LiteralPath (Join-Path $directory $file) -PathType Leaf)) {
                throw "Missing application prerequisite: $file"
            }
        }
    }
    $node = (Get-Command node.exe -ErrorAction Stop).Source
    $npm = (Get-Command npm.cmd -ErrorAction Stop).Source
    # Read only tool versions, never dump the current process environment.
    $nodeVersion = & $node --version
    if ($LASTEXITCODE -ne 0) { throw 'Node version probe failed.' }
    $npmVersion = & $npm --version
    if ($LASTEXITCODE -ne 0) { throw 'npm version probe failed.' }
    if ($nodeVersion -ne 'v24.21.0' -or $npmVersion -ne '11.19.0') {
        throw 'Approved tooling required: Node 24.21.0 and npm 11.19.0. No automatic install.'
    }
    Write-Host "Tooling: $nodeVersion / npm $npmVersion"
    $profileRoot = Join-Path $fullOutput $Profile
    $build = Join-Path $profileRoot 'frontend-build'
    $stage = Join-Path $profileRoot 'stage'
    $extracted = Join-Path $profileRoot 'extracted-check'
    $zip = Join-Path $profileRoot "shifter-developer-$Profile.zip"
    # A failed rerun must not leave a stale success ZIP or staged distribution.
    foreach ($path in @($zip, $stage, $build, $extracted)) { Remove-ShifterOwned $path $profileRoot }
    New-Item -ItemType Directory -Path $profileRoot -Force | Out-Null
    try {
        $sourceSnapshot = @(Get-ShifterSourceSnapshot)
        # Resolve installed packages without executing the application or driver.
        $toolCheck = @'
const fs = require('node:fs');
const path = require('node:path');
const {createRequire} = require('node:module');
for (const [dir, packages] of [
  [process.argv[1], {'typescript':'5.9.3', 'oracledb':'26.0.0'}],
  [process.argv[2], {'typescript':'5.9.3', '@angular/core':'21.2.25',
    '@angular/cli':'21.2.27', '@angular/build':'21.2.27',
    '@angular/material':'21.2.14', '@angular/cdk':'21.2.14', 'vitest':'4.0.9'}],
]) {
  const resolve = createRequire(path.join(dir, 'package.json'));
  for (const [name, expected] of Object.entries(packages)) {
    const actual = JSON.parse(fs.readFileSync(resolve.resolve(name + '/package.json'), 'utf8')).version;
    if (actual !== expected) throw Error('Installed version mismatch: ' + name);
  }
}
console.log('PASS installed approved package versions; no install or driver import');
'@
        Invoke-ShifterCommand $node @('-e', $toolCheck, $backend, $frontend) $script:Repository
        Invoke-ShifterCommand $npm @('run', 'typecheck') $backend
        Invoke-ShifterCommand $npm @('run', 'typecheck') $frontend
        if ($Validation) {
            Invoke-ShifterCommand $npm @('test') $backend
            Invoke-ShifterCommand $npm @('test') $frontend
        }
        # Never use the pilot-owned frontend dist. Angular owns only this output.
        Invoke-ShifterCommand $npm @('run', "build:$Profile", '--', '--output-path', $build) $frontend
        $browser = Join-Path $build 'browser'
        Invoke-ShifterCommand $npm @('run', 'check:profile', '--', $Profile, $browser) $frontend
        $closure = @(Get-ShifterClosure $backend @('server.mts', 'populated-server.mts'))
        $backendStage = Join-Path $stage 'backend'
        $browserStage = Join-Path $stage 'frontend/browser'
        $configStage = Join-Path $backendStage 'config-examples'
        New-Item -ItemType Directory -Path $configStage, $browserStage -Force | Out-Null
        $expected = New-Object 'System.Collections.Generic.HashSet[string]'
        foreach ($name in @($closure) + @('package.json', 'package-lock.json')) {
            Copy-Item -LiteralPath (Join-Path $backend $name) -Destination (Join-Path $backendStage $name)
            $null = $expected.Add("backend/$name")
        }
        foreach ($name in @('dev', 'test', 'production')) {
            $relative = "config-examples/$name.example.json"
            $source = Join-Path $backend $relative
            Assert-ShifterNoLink $source
            $config = Get-Content -LiteralPath $source -Raw | ConvertFrom-Json
            # Exact keys AND values: no future config additions are silently copied.
            $safeExamples = @{
                dev = '{"deploymentClass":"local-development","authenticationMode":"synthetic","syntheticAdministratorEnabled":true,"syntheticOrgUnitIds":["DEMO"],"dataSource":"isolated-fixture","businessTimeZone":"UTC","attendanceStageArrivalMode":"disabled"}'
                test = '{"deploymentClass":"isolated-test-demo","authenticationMode":"synthetic","syntheticAdministratorEnabled":true,"syntheticOrgUnitIds":[],"dataSource":"oracle-read-only","oracleTestScopeConfirmed":false,"businessTimeZone":"UTC","attendanceStageArrivalMode":"disabled"}'
                production = '{"deploymentClass":"production","authenticationMode":"real","syntheticAdministratorEnabled":false,"realProviderId":"","dataSource":"oracle-read-only","businessTimeZone":"UTC","attendanceStageArrivalMode":"disabled"}'
            }
            $safe = $safeExamples[$name] | ConvertFrom-Json
            if (@($config.PSObject.Properties).Count -ne @($safe.PSObject.Properties).Count) {
                throw 'Unexpected config example keys; sanitization review required.'
            }
            foreach ($property in $safe.PSObject.Properties) {
                $actual = $config.PSObject.Properties[$property.Name]
                if ($null -eq $actual -or
                    (ConvertTo-Json -InputObject $actual.Value -Compress -Depth 4) -cne
                    (ConvertTo-Json -InputObject $property.Value -Compress -Depth 4)) {
                    throw 'Config example is not the approved inert example.'
                }
            }
            Copy-Item -LiteralPath $source -Destination (Join-Path $backendStage $relative)
            $null = $expected.Add("backend/$relative")
        }
        # The Angular browser output is flat today. New output layouts need review.
        foreach ($asset in Get-ChildItem -LiteralPath $browser -Force) {
            if ($asset.PSIsContainer -or $asset.Attributes -band [IO.FileAttributes]::ReparsePoint -or
                -not (Test-ShifterBrowserAsset $asset.Name $Profile)) {
                throw "Unexpected browser asset; packaging review required: $($asset.Name)"
            }
            Copy-Item -LiteralPath $asset.FullName -Destination (Join-Path $browserStage $asset.Name)
            $null = $expected.Add("frontend/browser/$($asset.Name)")
        }
        if (-not $expected.Contains('frontend/browser/index.html')) { throw 'Missing browser index.' }
        # Preserve generated third-party notices outside the browser directory.
        $licenses = Join-Path $build '3rdpartylicenses.txt'
        if (Test-Path -LiteralPath $licenses -PathType Leaf) {
            Assert-ShifterNoLink $licenses
            Copy-Item -LiteralPath $licenses -Destination (Join-Path $stage 'THIRD-PARTY-NOTICES.txt')
            $null = $expected.Add('THIRD-PARTY-NOTICES.txt')
        }
        Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'DeveloperDistribution.README.md') -Destination (Join-Path $stage 'README.md')
        $null = $expected.Add('README.md')
        # Record only scoped source facts; never read unrelated status/docs/config.
        $head = & git -C $script:Repository rev-parse HEAD
        if ($LASTEXITCODE -ne 0) { throw 'Cannot record source HEAD.' }
        $sourceChanges = @(& git -C $script:Repository diff --name-only HEAD -- backend frontend)
        if ($LASTEXITCODE -ne 0) { throw 'Cannot record scoped source changes.' }
        $untrackedSource = @(& git -C $script:Repository ls-files --others --exclude-standard -- backend/fixture-slice frontend/fixture-slice)
        if ($LASTEXITCODE -ne 0) { throw 'Cannot record scoped untracked source names.' }
        $packagingChanges = @(& git -C $script:Repository diff --name-only HEAD -- scripts/Build-Shifter.ps1 scripts/Test-Build-Shifter.ps1 scripts/DeveloperDistribution.README.md backend/fixture-slice/config-examples)
        if ($LASTEXITCODE -ne 0) { throw 'Cannot record assigned packaging changes.' }
        $validationArgument = if ($Validation) { ' -Validation' } else { '' }
        $provenance = @(
            '# PROVISIONAL developer artifact - not a release',
            "Source HEAD: $head",
            "Scoped tracked backend/frontend changes against HEAD: $($sourceChanges -join ',')",
            "Scoped untracked fixture-slice source names: $($untrackedSource -join ',')",
            "Assigned tracked packaging changes against HEAD: $($packagingChanges -join ',')",
            'Source scope: current fixture-slice import closure and selected browser build; uncommitted bytes are not published source.',
            "Profile: $Profile; full source validation requested: $Validation",
            "Runtime modules: $($closure.Count)",
            'Runtime entrypoints: server.mts,populated-server.mts (explicit approved roots; literal import closure only)',
            'Prerequisites: native Windows; Node 24.21.0; npm 11.19.0; external runtime dependencies.',
            'Oracle driver 26.0.0 / Thick Client 19.3 / Oracle 11g require separately authorized external setup and verification.',
            'Same-origin /api serving and any private operator packet/configuration are external prerequisites, not ZIP contents.',
            'Native writes additionally require externally approved SHF_NATIVE_COMMAND_COORDINATOR_CONFIG; no namespace is provisioned or packaged. Read-only mode is unchanged.',
            'Production is a fail-closed developer artifact; real authentication is not implemented.',
            'Independent QA and final closure match remain required. No deployment/native-live approval.',
            '',
            'Source checkout commands (no install performed):',
            'powershell.exe -NoProfile -File scripts\Test-Build-Shifter.ps1',
            "powershell.exe -NoProfile -File scripts\Build-Shifter.ps1 -Profile $Profile$validationArgument",
            '',
            "Source snapshot SHA256: $(Get-ShifterSnapshotHash $sourceSnapshot)",
            "Source snapshot files: $($sourceSnapshot.Count)",
            'Scoped source bytes / SHA256 (evidence only; source is not bundled):'
        )
        $provenance += $sourceSnapshot
        $provenance += @('', 'Payload bytes / SHA256 (excluding this self-describing BUILD.md):')
        foreach ($name in ($expected | Sort-Object)) {
            $payload = Join-Path $stage $name
            $provenance += "$name`t$((Get-Item -LiteralPath $payload).Length)`t$((Get-FileHash -LiteralPath $payload -Algorithm SHA256).Hash)"
        }
        Set-Content -LiteralPath (Join-Path $stage 'BUILD.md') -Value $provenance -Encoding UTF8
        $null = $expected.Add('BUILD.md')
        # Validate closure again at its packaged location: no source-tree fallback.
        $packagedClosure = @(Get-ShifterClosure $backendStage)
        if (($closure -join ',') -ne ($packagedClosure -join ',')) { throw 'Packaged import closure mismatch.' }
        $productionCheck = @'
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {join, resolve, dirname} from 'node:path';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import dns from 'node:dns';
import dnsp from 'node:dns/promises';
import net from 'node:net';
import {syncBuiltinESMExports, registerHooks} from 'node:module';
const {startFromEnvironment} = await import(pathToFileURL(join(process.argv[1], 'server.mts')));
const {RealAuthenticationNotConfiguredError} = await import(pathToFileURL(join(process.argv[1], 'environment-profiles.mts')));
const {nativeCoordinatorFromEnvironment} = await import(pathToFileURL(join(process.argv[1], 'native-command-coordinator.mts')));
let forbiddenIO = 0;
const forbidden = () => { forbiddenIO++; throw Error('Forbidden startup IO'); };
for (const name of ['readFile','readFileSync','open','openSync','writeFile','writeFileSync','existsSync','stat','statSync','access','accessSync',
  'lstat','lstatSync','realpath','realpathSync','readSync','writeSync','fstatSync','fsyncSync','ftruncateSync','closeSync',
  'mkdir','mkdirSync','unlink','unlinkSync','rm','rmSync','rename','renameSync'])
  fs[name] = forbidden;
fs.realpathSync.native = forbidden;
for (const name of ['readFile','open','writeFile','stat','access','lstat','realpath','mkdir','unlink','rm','rename']) fsp[name] = forbidden;
dns.lookup = forbidden; dns.resolve = forbidden;
dnsp.lookup = forbidden; dnsp.resolve = forbidden;
net.connect = forbidden; net.createConnection = forbidden;
net.Server.prototype.listen = forbidden;
syncBuiltinESMExports();
const hooks = registerHooks({resolve(specifier, context, next) {
  if (specifier === 'oracledb') return forbidden();
  return next(specifier, context);
}});
const real = {deploymentClass:'production', authenticationMode:'real',
  syntheticAdministratorEnabled:false, realProviderId:'', dataSource:'oracle-read-only',
  businessTimeZone:'UTC', attendanceStageArrivalMode:'disabled'};
let calls = 0;
const factories = {read:async()=>{calls++; throw Error('Forbidden pool');},
  native:async()=>{calls++; throw Error('Forbidden pool');},
  resolveEndpoint:async()=>{calls++; throw Error('Forbidden endpoint resolver');}};
await assert.rejects(startFromEnvironment({SHF_APP_ENV:'production',
  SHF_ORACLE_CONFIG:JSON.stringify(real)}, undefined, factories), RealAuthenticationNotConfiguredError);
await assert.rejects(startFromEnvironment({SHF_APP_ENV:'production',
  SHF_ORACLE_CONFIG:JSON.stringify({...real, authenticationMode:'synthetic',
    syntheticAdministratorEnabled:true})}, undefined, factories), /Production prohibits synthetic/);
const readonly = {deploymentClass:'isolated-test-demo', authenticationMode:'synthetic',
  syntheticAdministratorEnabled:true, syntheticOrgUnitIds:['T001'], dataSource:'oracle-read-only',
  oracleTestScopeConfirmed:true, businessTimeZone:'UTC', attendanceStageArrivalMode:'disabled'};
const oldNative = {...readonly, attendanceStageArrivalMode:'test-oracle-controlled'};
for (const profile of ['test', undefined]) {
  const env = {SHF_ORACLE_CONFIG:JSON.stringify(oldNative),
    ...(profile === undefined ? {} : {SHF_APP_ENV:profile})};
  await assert.rejects(startFromEnvironment(env, undefined, factories), /Explicit native TEST write enablement/);
}
await assert.rejects(startFromEnvironment({SHF_APP_ENV:'test', SHF_ORACLE_CONFIG:JSON.stringify(readonly),
  SHF_NATIVE_COMMAND_COORDINATOR_CONFIG:'{}'}, undefined, factories),
  e => e?.code === 'LIVE_WRITES_DISABLED');
// Exercise the strict coordinator reader without a namespace or allowance path.
// No native target: absent key is a no-op; a stray key is fail-closed.
assert.equal(await nativeCoordinatorFromEnvironment({}, []), undefined);
await assert.rejects(nativeCoordinatorFromEnvironment({}, [
  {employeeId:'9001', writeIdentity:{database:'SYNTHETIC_TEST', schema:'SYNTHETIC_SCHEMA'}},
]), e => e?.code === 'LIVE_WRITES_DISABLED');
// Fully enabled OLD native config: only allowance-path validation is emulated.
// No namespace is created/read; any path outside this literal whitelist fails.
const syntheticDirectory = resolve('C:/shf-packaging-synthetic-only');
const allowanceFile = join(syntheticDirectory, 'operator-allowance');
const ancestors = new Set();
for (let p = syntheticDirectory; ; p = dirname(p)) {
  ancestors.add(p);
  if (dirname(p) === p) break;
}
const repoBoundary = resolve(process.argv[1], '../..');
let syntheticPathCalls = 0;
fs.lstatSync = path => {
  syntheticPathCalls++;
  if (ancestors.has(path)) return {isDirectory:()=>true, isSymbolicLink:()=>false};
  if (path === allowanceFile) throw Object.assign(Error('Synthetic absent allowance'), {code:'ENOENT'});
  return forbidden();
};
fs.realpathSync.native = path => {
  syntheticPathCalls++;
  if (path === syntheticDirectory || path === repoBoundary) return path;
  return forbidden();
};
syncBuiltinESMExports();
const identity = {database:'SYNTHETIC_TEST', host:'synthetic-host', service:'synthetic-service',
  user:'SYNTHETIC_WRITER', schema:'SYNTHETIC_SCHEMA'};
const binding = {marker:'SHF_TEST_ARRIVAL_20261020_B', employeeId:'9001', shiftDayId:'6201', orgUnitId:'T001',
  readIdentity:identity, writeIdentity:identity, metadataDigest:'0'.repeat(64),
  approval:'synthetic-approval', freezeOwner:'synthetic-freeze', recoveryOwner:'synthetic-recovery',
  writerFreezeConfirmed:true, noExternalEffectsConfirmed:true, singleExecutorConfirmed:true,
  windowStart:'2026-10-01T00:00:00.000Z', windowEnd:'2026-12-01T00:00:00.000Z', allowanceFile};
const enabled = {SHF_ORACLE_CONFIG:JSON.stringify(oldNative), SHF_ORACLE_PORT:'0',
  SHF_TEST_ORACLE_STAGE_WRITE_ENABLED:'true', SHF_NATIVE_STAGE_CONNECT_STRING:'CTIDBT_WFMT',
  SHF_NATIVE_STAGE_USER:'SYNTHETIC_WRITER', SHF_NATIVE_STAGE_PASSWORD:'synthetic-only',
  SHF_NATIVE_STAGE_CLIENT_LIB_DIR:'synthetic-unused', SHF_NATIVE_STAGE_BINDING:JSON.stringify(binding),
  SHF_STAGE_ARRIVAL_ORIGINS:'["http://localhost:4521"]'};
for (const profile of ['test', undefined]) {
  for (const coordinator of [undefined, '{}']) {
    await assert.rejects(startFromEnvironment({...enabled,
      ...(profile === undefined ? {} : {SHF_APP_ENV:profile}),
      ...(coordinator === undefined ? {} : {SHF_NATIVE_COMMAND_COORDINATOR_CONFIG:coordinator})},
      undefined, factories), e => e?.code === 'LIVE_WRITES_DISABLED');
  }
}
assert(syntheticPathCalls > 0, 'native binding allowance validation was actually reached');
assert.equal(calls, 0);
assert.equal(forbiddenIO, 0);
hooks.deregister();
console.log('PASS extracted entrypoint import; production missing-real/synthetic; old native test/profileless missing/malformed coordinator rejects; zero pools/real file IO/DNS/network/driver imports');
console.log('PASS synthetic allowance-path validation calls=' + syntheticPathCalls +
  '; missing coordinator reader zero IO; no namespace IO/provisioning/reset');
'@
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        Write-ShifterZip $stage $zip @($expected)
        $archive = [IO.Compression.ZipFile]::OpenRead($zip)
        $bytes = 0L
        $rawNames = New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::OrdinalIgnoreCase)
        try {
            if ($archive.Entries.Count -ne $expected.Count) { throw 'ZIP file count mismatch.' }
            foreach ($entry in $archive.Entries) {
                $name = $entry.FullName
                if ($name -cnotmatch '^[A-Za-z0-9][A-Za-z0-9._-]*(?:/[A-Za-z0-9][A-Za-z0-9._-]*)*$' -or
                    -not $rawNames.Add($name)) { throw 'Noncanonical or duplicate raw ZIP entry name.' }
                if (-not $expected.Remove($name) -or $name -match '(^|/)(?:\.|node_modules|old|test/|vendor|allowance|session)' -or
                    $name -match '(?i)secret|credential|live-check|screenshot|\.env') {
                    throw "ZIP whitelist violation: $name"
                }
                $stream = $entry.Open()
                $sha = [Security.Cryptography.SHA256]::Create()
                try { $actualHash = [BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-', '') }
                finally { $stream.Dispose(); $sha.Dispose() }
                if ($actualHash -cne (Get-FileHash -LiteralPath (Join-Path $stage $name) -Algorithm SHA256).Hash) {
                    throw "ZIP payload bytes differ from staging: $name"
                }
                $bytes += $entry.Length
            }
            if ($expected.Count -ne 0) { throw 'ZIP missing expected files.' }
        } finally { $archive.Dispose() }
        # Check the real extracted artifact, not a source/staging fallback.
        [IO.Compression.ZipFile]::ExtractToDirectory($zip, $extracted)
        $extractedBackend = Join-Path $extracted 'backend'
        $extractedClosure = @(Get-ShifterClosure $extractedBackend)
        if (($closure -join ',') -cne ($extractedClosure -join ',')) { throw 'Extracted import closure mismatch.' }
        Invoke-ShifterCommand $node @('--input-type=module', '-e', $productionCheck, $extractedBackend) $extracted
        Invoke-ShifterCommand $npm @('run', 'check:profile', '--', $Profile, (Join-Path $extracted 'frontend/browser')) $frontend
        Remove-ShifterOwned $extracted $profileRoot
        Assert-ShifterSourceSnapshot $sourceSnapshot @(Get-ShifterSourceSnapshot)
        $files = @(Get-ChildItem -LiteralPath $stage -File -Recurse)
        Write-Host "PASS unchanged scoped source snapshot files=$($sourceSnapshot.Count); SHA256=$(Get-ShifterSnapshotHash $sourceSnapshot)"
        Write-Host "PASS developer snapshot profile=$Profile validation=$Validation"
        Write-Host "PASS runtime closure=$($closure.Count); required manifests/index; exact ZIP whitelist; no dependencies/private files"
        Write-Host 'PASS raw ZIP names: canonical forward slashes; zero backslashes/traversal/absolute paths/duplicates/case collisions'
        Write-Host "ARTIFACT .shifter-developer-delivery/$Profile/shifter-developer-$Profile.zip"
        Write-Host "ZIP bytes=$((Get-Item -LiteralPath $zip).Length); files=$($files.Count); expanded bytes=$bytes"
        Write-Host "ZIP SHA256=$((Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash)"
    } catch {
        # No success artifact survives any command, closure or ZIP assertion failure.
        foreach ($path in @($zip, $stage, $build, $extracted)) { Remove-ShifterOwned $path $profileRoot }
        throw
    }
}

if ($MyInvocation.InvocationName -ne '.') {
    try { Invoke-ShifterBuild; exit 0 }
    catch {
        [Console]::Error.WriteLine($_.Exception.Message)
        if ($_.Exception.Data.Contains('ExitCode')) { exit [int]$_.Exception.Data['ExitCode'] }
        exit 1
    }
}
