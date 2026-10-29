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

function Get-ShifterClosure([string]$Backend) {
    # Current application uses literal relative .mts imports (including type imports)
    # and dynamic import("oracledb"). Fail if that supported packaging scope changes.
    $queue = New-Object 'System.Collections.Generic.Queue[string]'
    $seen = New-Object 'System.Collections.Generic.HashSet[string]'
    $queue.Enqueue('server.mts')
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
        $closure = @(Get-ShifterClosure $backend)
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
                $asset.Name -notmatch '^(?:index\.html|(?:main|polyfills|chunk|styles)(?:-[A-Za-z0-9]+)?\.(?:js|css)(?:\.map)?)$') {
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
        $provenance = @(
            '# PROVISIONAL developer artifact - not a release',
            "Source HEAD: $head",
            "Scoped tracked backend/frontend changes against HEAD: $($sourceChanges -join ',')",
            'Source scope: tracked fixture-slice import closure and selected browser build; unrelated files excluded.',
            "Profile: $Profile; full source validation requested: $Validation",
            "Runtime modules: $($closure.Count)",
            'Prerequisites: native Windows; Node 24.21.0; npm 11.19.0; external runtime dependencies.',
            'Oracle driver 26.0.0 / Thick Client 19.3 / Oracle 11g require separately authorized external setup and verification.',
            'Same-origin /api serving and any private operator packet/configuration are external prerequisites, not ZIP contents.',
            'Production is a fail-closed developer artifact; real authentication is not implemented.',
            'Independent QA and final closure match remain required. No deployment/native-live approval.',
            '',
            'Source checkout commands (no install performed):',
            'powershell.exe -NoProfile -File scripts\Test-Build-Shifter.ps1',
            "powershell.exe -NoProfile -File scripts\Build-Shifter.ps1 -Profile $Profile -Validation",
            '',
            'Payload bytes / SHA256 (excluding this self-describing BUILD.md):'
        )
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
import {join} from 'node:path';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import dns from 'node:dns';
import net from 'node:net';
import {syncBuiltinESMExports} from 'node:module';
const {startFromEnvironment} = await import(pathToFileURL(join(process.argv[1], 'server.mts')));
const {RealAuthenticationNotConfiguredError} = await import(pathToFileURL(join(process.argv[1], 'environment-profiles.mts')));
let forbiddenIO = 0;
const forbidden = () => { forbiddenIO++; throw Error('Forbidden startup IO'); };
for (const name of ['readFile','readFileSync','open','openSync','writeFile','writeFileSync','existsSync','stat','statSync','access','accessSync'])
  fs[name] = forbidden;
for (const name of ['readFile','open','writeFile','stat','access']) fsp[name] = forbidden;
dns.lookup = forbidden; dns.resolve = forbidden;
net.connect = forbidden; net.createConnection = forbidden;
syncBuiltinESMExports();
const real = {deploymentClass:'production', authenticationMode:'real',
  syntheticAdministratorEnabled:false, realProviderId:'', dataSource:'oracle-read-only',
  businessTimeZone:'UTC', attendanceStageArrivalMode:'disabled'};
let calls = 0;
const factories = {read:async()=>{calls++; throw Error('Forbidden pool');},
  native:async()=>{calls++; throw Error('Forbidden pool');}};
await assert.rejects(startFromEnvironment({SHF_APP_ENV:'production',
  SHF_ORACLE_CONFIG:JSON.stringify(real)}, undefined, factories), RealAuthenticationNotConfiguredError);
await assert.rejects(startFromEnvironment({SHF_APP_ENV:'production',
  SHF_ORACLE_CONFIG:JSON.stringify({...real, authenticationMode:'synthetic',
    syntheticAdministratorEnabled:true})}, undefined, factories), /Production prohibits synthetic/);
assert.equal(calls, 0);
assert.equal(forbiddenIO, 0);
console.log('PASS extracted entrypoint import; production rejects missing real provider and synthetic mode; zero pools/file IO/DNS/network');
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
        $files = @(Get-ChildItem -LiteralPath $stage -File -Recurse)
        Write-Host "PASS developer snapshot profile=$Profile validation=$Validation"
        Write-Host "PASS runtime closure=$($closure.Count); required manifests/index; exact ZIP whitelist; no dependencies/private files"
        Write-Host 'PASS raw ZIP names: canonical forward slashes; zero backslashes/traversal/absolute paths/duplicates/case collisions'
        Write-Host "ARTIFACT .shifter-developer-delivery/$Profile/shifter-developer-$Profile.zip"
        Write-Host "ZIP bytes=$((Get-Item -LiteralPath $zip).Length); files=$($files.Count); expanded bytes=$bytes"
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
