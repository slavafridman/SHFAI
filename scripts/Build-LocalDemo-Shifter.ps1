[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('synthetic-empty-dev')]
    [string]$DemoOptIn,
    [string]$NodeImage = 'node:24.21.0-bookworm-slim@sha256:d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20',
    [string]$NginxImage = 'nginxinc/nginx-unprivileged:stable-bookworm@sha256:cd33960e98e93d4d63385790ff7f8f5bf2ca95184c581b7f42ae8aea1139fbfc',
    [switch]$ReuseValidatedPayload,
    [switch]$IngressOnly
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
. (Join-Path $PSScriptRoot 'Build-Shifter.ps1') -Profile dev
. (Join-Path $PSScriptRoot 'Build-Docker-Shifter.ps1') -NodeImage $NodeImage -NginxImage $NginxImage

function Assert-LocalDemoPins {
    Assert-ShifterBaseImages
    if ($NodeImage -cne 'node:24.21.0-bookworm-slim@sha256:d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20' -or
        $NginxImage -cne 'nginxinc/nginx-unprivileged:stable-bookworm@sha256:cd33960e98e93d4d63385790ff7f8f5bf2ca95184c581b7f42ae8aea1139fbfc') {
        throw 'Local demo accepts only reviewed Docker-v0.1 immutable bases; changes require review.'
    }
}
function Get-ValidatedDemoInputs {
    $stage = Join-Path $root '.shifter-developer-delivery/dev/stage'
    $zip = Join-Path $root '.shifter-developer-delivery/dev/shifter-developer-dev.zip'
    Assert-ShifterNoLink $stage
    Assert-ShifterNoLink $zip
    $build = Get-Content -LiteralPath (Join-Path $stage 'BUILD.md') -Raw
    $head = & git -C $root rev-parse HEAD
    if ($LASTEXITCODE -ne 0 -or -not $build.Contains("Source HEAD: $head") -or
        -not $build.Contains('Profile: dev; full source validation requested: True')) {
        throw 'A current full-validation DEV payload is required.'
    }
    $sourceSnapshot = @($build -split "`r?`n" | Where-Object {
        $_ -cmatch '^SOURCE\t[A-Za-z0-9][A-Za-z0-9._/-]*\t[0-9]+\t[A-F0-9]{64}$'
    })
    Assert-ShifterSourceSnapshot $sourceSnapshot @(Get-ShifterSourceSnapshot)
    $sourceHash = Get-ShifterSnapshotHash $sourceSnapshot
    if (-not $build.Contains("Source snapshot SHA256: $sourceHash") -or
        -not $build.Contains("Source snapshot files: $($sourceSnapshot.Count)")) {
        throw 'Missing or inconsistent canonical source-byte proof; run DEV full validation.'
    }
    $manifest = @{}
    foreach ($line in ($build -split "`r?`n")) {
        if ($line -cmatch '^([A-Za-z0-9][A-Za-z0-9._/-]*)\t([0-9]+)\t([A-F0-9]{64})$') {
            $name = $Matches[1]
            $size = [long]$Matches[2]
            $hash = $Matches[3]
            if ($name -cnotmatch '^[A-Za-z0-9][A-Za-z0-9._-]*(?:/[A-Za-z0-9][A-Za-z0-9._-]*)*$' -or
                $manifest.ContainsKey($name)) { throw 'Invalid or duplicate manifest path.' }
            $manifest[$name] = [pscustomobject]@{ Size = $size; Hash = $hash }
        }
    }
    if (-not $manifest.Count) { throw 'Missing validated byte manifest.' }
    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive = [IO.Compression.ZipFile]::OpenRead($zip)
    try {
        $seen = New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::OrdinalIgnoreCase)
        foreach ($entry in $archive.Entries) {
            $name = $entry.FullName
            if (-not $seen.Add($name) -or ($name -cne 'BUILD.md' -and -not $manifest.ContainsKey($name))) {
                throw 'ZIP differs from exact canonical manifest.'
            }
            $path = Join-Path $stage $name
            Assert-ShifterNoLink $path
            $bytes = [IO.File]::ReadAllBytes($path)
            $stream = $entry.Open()
            $sha = [Security.Cryptography.SHA256]::Create()
            try { $zipHash = [BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-', '') }
            finally { $stream.Dispose(); $sha.Dispose() }
            $stageHash = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash
            if ($entry.Length -ne $bytes.Length -or $zipHash -cne $stageHash) { throw 'ZIP/stage byte mismatch.' }
            if ($name -cne 'BUILD.md' -and ($bytes.Length -ne $manifest[$name].Size -or
                $stageHash -cne $manifest[$name].Hash)) { throw 'Validated payload hash mismatch.' }
        }
        if ($seen.Count -ne $manifest.Count + 1) { throw 'Missing ZIP manifest entries.' }
    } finally { $archive.Dispose() }
    $inputs = New-Object 'System.Collections.Generic.List[object]'
    $closure = @(Get-ShifterClosure (Join-Path $root 'backend/fixture-slice'))
    foreach ($name in @($closure) + @('package.json', 'package-lock.json', 'config-examples/dev.example.json')) {
        $relative = "backend/$name"
        if (-not $manifest.ContainsKey($relative) -or
            (Get-FileHash -LiteralPath (Join-Path $root "backend/fixture-slice/$name")).Hash -cne $manifest[$relative].Hash) {
            throw 'Runtime closure/source bytes differ from full validation.'
        }
        $inputs.Add([pscustomobject]@{ Source = Join-Path $stage $relative; Target = $relative })
    }
    foreach ($name in ($manifest.Keys | Sort-Object)) {
        if ($name -cmatch '^frontend/browser/(index\.html|(?:main|polyfills|chunk|styles)(?:-[A-Za-z0-9]+)?\.(?:js|css))$') {
            $inputs.Add([pscustomobject]@{ Source = Join-Path $stage $name; Target = "browser/$($Matches[1])" })
        }
    }
    if ($manifest.ContainsKey('THIRD-PARTY-NOTICES.txt')) {
        $inputs.Add([pscustomobject]@{ Source = Join-Path $stage 'THIRD-PARTY-NOTICES.txt'; Target = 'browser/THIRD-PARTY-NOTICES.txt' })
    } else { Write-Host 'DEV build generated no third-party notices; none invented or copied from another profile.' }
    Write-Host "PASS full-validation DEV snapshot HEAD=$head; modules=$($closure.Count); ZIP entries=$($seen.Count)"
    Write-Host "SOURCE SNAPSHOT files=$($sourceSnapshot.Count); SHA256=$sourceHash"
    Write-Host "ZIP SHA256=$((Get-FileHash -LiteralPath $zip).Hash)"
    return $inputs.ToArray()
}
function Invoke-LocalDemoBuild {
    Assert-LocalDemoPins
    $os = @(Invoke-ShifterDocker @('info', '--format', '{{.OSType}}'))
    if (($os -join "`n").Trim() -cne 'linux') { throw 'Approved available Linux engine required.' }
    if (-not $ReuseValidatedPayload) {
        & powershell.exe -NoProfile -File (Join-Path $PSScriptRoot 'Build-Shifter.ps1') -Profile dev -Validation | Out-Host
        if ($LASTEXITCODE -ne 0) { throw 'Canonical DEV validation failed.' }
    }
    $inputs = @(Get-ValidatedDemoInputs)
    $context = Join-Path ([IO.Path]::GetTempPath()) ("shf-docker-demo-" + [guid]::NewGuid().ToString('N'))
    Assert-ShifterNoLink $context
    New-Item -ItemType Directory -Path $context | Out-Null
    try {
        foreach ($name in @('local-demo.Dockerfile', 'nginx.local-demo.conf',
            'local-demo-config.mjs', 'local-demo-backend.mjs', 'local-demo-supervisor.mjs')) {
            $target = if ($name -eq 'local-demo.Dockerfile') { 'Dockerfile' } else { "packaging/$name" }
            $inputs += [pscustomobject]@{ Source = Join-Path $root "docker/$name"; Target = $target }
        }
        $contextManifest = New-Object 'System.Collections.Generic.List[string]'
        foreach ($input in ($inputs | Sort-Object Target)) {
            Assert-ShifterNoLink $input.Source
            $target = Join-Path $context $input.Target
            New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
            Copy-Item -LiteralPath $input.Source -Destination $target
            $bytes = (Get-Item -LiteralPath $target).Length
            $hash = (Get-FileHash -LiteralPath $target).Hash
            $contextManifest.Add("$($input.Target)`t$bytes`t$hash")
            Write-Host ("CONTEXT {0} bytes={1} SHA256={2}" -f $input.Target, $bytes, $hash)
        }
        # Exact per-file allowlist in a purpose-built temporary context; repository
        # root, docs, maps, host node_modules and all private inputs never enter it.
        $ignore = New-Object 'System.Collections.Generic.List[string]'
        $ignore.Add('**')
        $parents = @($inputs | ForEach-Object {
            $parts = $_.Target.Split('/')
            for ($i = 1; $i -lt $parts.Count; $i++) { ($parts[0..($i - 1)] -join '/') + '/' }
        } | Sort-Object -Unique)
        foreach ($parent in $parents) { $ignore.Add("!$parent"); $ignore.Add("$parent**") }
        foreach ($input in $inputs) { $ignore.Add("!$($input.Target)") }
        [IO.File]::WriteAllLines((Join-Path $context '.dockerignore'), $ignore)
        $sha = [Security.Cryptography.SHA256]::Create()
        try {
            $manifestBytes = [Text.Encoding]::UTF8.GetBytes(($contextManifest -join "`n") + "`n")
            Write-Host ("CONTEXT MANIFEST SHA256=" + [BitConverter]::ToString($sha.ComputeHash($manifestBytes)).Replace('-', ''))
        } finally { $sha.Dispose() }
        Write-Host "CONTEXT exact files=$($inputs.Count); generated .dockerignore; no repository upload"
        Invoke-ShifterDocker @('build', '--pull', '--platform', 'linux/amd64',
            '--build-arg', "NODE_IMAGE=$NodeImage", '--build-arg', "NGINX_IMAGE=$NginxImage",
            '--tag', 'shifter-local-demo:dev', $context) | Out-Host
        Invoke-ShifterDocker @('run', '--rm', '--network', 'none', '--read-only',
            '--tmpfs', '/tmp:rw,noexec,nosuid,size=32m', '--cap-drop', 'ALL',
            '--security-opt', 'no-new-privileges', '--entrypoint', 'nginx',
            'shifter-local-demo:dev', '-t') | Out-Host
        Invoke-ShifterDocker @('image', 'inspect', '--format', '{{.Id}}', 'shifter-local-demo:dev') | Out-Host
        Write-Host 'PASS local demo image packaging; not deployed; production default remains rejected.'
    } finally {
        # Only the unique temporary context created by this invocation is removed.
        Assert-ShifterNoLink $context
        Remove-Item -LiteralPath $context -Recurse -Force
    }
}
function Invoke-LocalDemoIngressBuild {
    Assert-LocalDemoPins
    $os = @(Invoke-ShifterDocker @('info', '--format', '{{.OSType}}'))
    if (($os -join "`n").Trim() -cne 'linux') { throw 'Approved available Linux engine required.' }
    # Cache-only base verification; no pull, package install or application build.
    Invoke-ShifterDocker @('image', 'inspect', '--format', '{{.Id}}', $NginxImage) | Out-Host
    $context = Join-Path $root ('.shifter-developer-delivery/ingress-context-' + [guid]::NewGuid().ToString('N'))
    Assert-ShifterNoLink $context
    New-Item -ItemType Directory -Path $context | Out-Null
    try {
        foreach ($name in @('local-demo-ingress.Dockerfile', 'nginx.local-demo-ingress.conf')) {
            $source = Join-Path $root "docker/$name"
            Assert-ShifterNoLink $source
            $target = if ($name -eq 'local-demo-ingress.Dockerfile') { 'Dockerfile' } else { $name }
            Copy-Item -LiteralPath $source -Destination (Join-Path $context $target)
            Write-Host "CONTEXT $target bytes=$((Get-Item -LiteralPath $source).Length) SHA256=$((Get-FileHash -LiteralPath $source).Hash)"
        }
        [IO.File]::WriteAllLines((Join-Path $context '.dockerignore'),
            @('**', '!Dockerfile', '!nginx.local-demo-ingress.conf'))
        Write-Host 'CONTEXT exact files=2; generated default-deny .dockerignore; no application/repository upload'
        Invoke-ShifterDocker @('build', '--pull=false', '--network', 'none', '--platform', 'linux/amd64',
            '--tag', 'shifter-local-demo-ingress:dev', $context) | Out-Host
        Invoke-ShifterDocker @('run', '--rm', '--network', 'none', '--add-host', 'demo:127.0.0.2',
            '--read-only', '--tmpfs', '/tmp:rw,noexec,nosuid,size=16m,mode=1777',
            '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges',
            'shifter-local-demo-ingress:dev', '-t') | Out-Host
        Invoke-ShifterDocker @('image', 'inspect', '--format', '{{.Id}}', 'shifter-local-demo-ingress:dev') | Out-Host
        Write-Host 'PASS ingress-only cached-base packaging and nonroot/read-only nginx syntax; no service operation'
    } finally {
        Assert-ShifterNoLink $context
        Remove-Item -LiteralPath $context -Recurse -Force
    }
}
if ($MyInvocation.InvocationName -ne '.') {
    try {
        if ($IngressOnly) { Invoke-LocalDemoIngressBuild }
        else { Invoke-LocalDemoBuild }
        exit 0
    }
    catch { [Console]::Error.WriteLine($_.Exception.Message); exit 1 }
}
