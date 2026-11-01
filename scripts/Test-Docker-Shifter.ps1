[CmdletBinding()]
param()
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$builder = Join-Path $PSScriptRoot 'Build-Docker-Shifter.ps1'
$passed = 0
function Assert-DockerPreparation([bool]$Condition, [string]$Message) {
    if (-not $Condition) { throw $Message }
    $script:passed++
    Write-Host "PASS $Message"
}

$tokens = $null
$errors = $null
$null = [Management.Automation.Language.Parser]::ParseFile($builder, [ref]$tokens, [ref]$errors)
Assert-DockerPreparation ($errors.Count -eq 0) 'Windows PowerShell Docker builder syntax'
$digest = 'a' * 64
$nodeReference = "node:24.21.0-bookworm-slim@sha256:$digest"
$nginxReference = "nginxinc/nginx-unprivileged:stable-bookworm@sha256:$digest"
. $builder -NodeImage $nodeReference -NginxImage $nginxReference
Assert-ShifterBaseImages
Assert-DockerPreparation $true 'approved repositories with immutable digests accepted'
foreach ($invalid in @('node:latest', 'node:24.21.0-bookworm-slim',
    "other/node:24.21.0-bookworm-slim@sha256:$digest",
    "node:24.21.0-alpine@sha256:$digest",
    "node:24.21.0-bookworm-slim@sha256:$($digest.Substring(1))")) {
    $NodeImage = $invalid
    $rejected = $false
    try { Assert-ShifterBaseImages } catch { $rejected = $true }
    Assert-DockerPreparation $rejected 'invalid Node image reference rejected'
}
$NodeImage = $nodeReference
$NginxImage = 'nginx:latest'
$rejected = $false
try { Assert-ShifterBaseImages } catch { $rejected = $true }
Assert-DockerPreparation $rejected 'unapproved NGINX repository rejected'
$NginxImage = $nginxReference

$originalDocker = ${function:Invoke-ShifterDocker}
$originalSource = ${function:Invoke-ShifterProductionSourceBuild}
$script:events = New-Object 'System.Collections.Generic.List[object]'
$script:engine = 'linux'
$script:sourceFails = $false
$script:buildFails = $false
try {
    function Invoke-ShifterDocker([string[]]$Arguments) {
        $script:events.Add([pscustomobject]@{ Kind = 'docker'; Arguments = $Arguments })
        if ($Arguments[0] -eq 'info') { return $script:engine }
        if ($Arguments[0] -eq 'build' -and $script:buildFails) { throw 'Synthetic Docker build failure' }
    }
    function Invoke-ShifterProductionSourceBuild {
        $script:events.Add([pscustomobject]@{ Kind = 'source'; Arguments = @() })
        if ($script:sourceFails) { throw 'Synthetic source check failure' }
    }
    Invoke-ShifterDockerBuild
    Assert-DockerPreparation ($events.Count -eq 7) 'mock workflow has engine, source, two builds, two checks and image inspection'
    Assert-DockerPreparation ($events[0].Arguments[0] -eq 'info' -and
        $events[1].Kind -eq 'source') 'engine and source gates precede image construction'
    $builds = @($events | Where-Object { $_.Arguments.Count -and $_.Arguments[0] -eq 'build' })
    Assert-DockerPreparation ($builds.Count -eq 2 -and
        @($builds | Where-Object { $_.Arguments -contains 'linux/amd64' }).Count -eq 2) 'both images target Linux amd64'
    Assert-DockerPreparation ($builds[0].Arguments -contains "NODE_IMAGE=$nodeReference" -and
        $builds[1].Arguments -contains "NGINX_IMAGE=$nginxReference") 'immutable base references reach Docker unchanged'
    $runs = @($events | Where-Object { $_.Arguments.Count -and $_.Arguments[0] -eq 'run' })
    Assert-DockerPreparation ($runs.Count -eq 2 -and
        @($runs | Where-Object { $_.Arguments -contains 'none' -and
            $_.Arguments -contains '--read-only' -and $_.Arguments -contains '--rm' }).Count -eq 2) 'image checks are transient, read-only and network-isolated'
    Assert-DockerPreparation (@($events | Where-Object { $_.Arguments -contains 'push' -or
        $_.Arguments -contains '--env-file' -or $_.Arguments -contains '--publish' }).Count -eq 0) 'workflow does not publish images, load environment files or expose ports'
    foreach ($failure in @('engine', 'source', 'build')) {
        $events.Clear()
        $script:engine = 'linux'
        $script:sourceFails = $failure -eq 'source'
        $script:buildFails = $failure -eq 'build'
        if ($failure -eq 'engine') { $script:engine = 'windows' }
        $rejected = $false
        try { Invoke-ShifterDockerBuild } catch { $rejected = $true }
        $expected = @{ engine = 1; source = 2; build = 3 }[$failure]
        Assert-DockerPreparation ($rejected -and $events.Count -eq $expected) "$failure failure stops all dependent commands"
    }
} finally {
    ${function:Invoke-ShifterDocker} = $originalDocker
    ${function:Invoke-ShifterProductionSourceBuild} = $originalSource
}

$backend = Get-Content -LiteralPath (Join-Path $root 'docker\backend.Dockerfile') -Raw
$frontend = Get-Content -LiteralPath (Join-Path $root 'docker\frontend.Dockerfile') -Raw
$nginx = Get-Content -LiteralPath (Join-Path $root 'docker\nginx.conf') -Raw
$ignore = @(Get-Content -LiteralPath (Join-Path $root '.dockerignore'))
$builderText = Get-Content -LiteralPath $builder -Raw
Assert-DockerPreparation ($backend.Contains('USER node') -and
    $backend.Contains('SHF_APP_ENV=production') -and
    $backend.Contains('CMD ["node", "server.mts"]')) 'backend defaults to production and invokes Node directly as non-root'
Assert-DockerPreparation ($backend.Contains('npm ci --omit=dev --ignore-scripts') -and
    $backend.Contains('test "$(npm --version)" = "11.19.0"')) 'locked runtime install omits tooling and lifecycle scripts and verifies npm'
Assert-DockerPreparation ($frontend.Contains('USER 101:101') -and
    $frontend.Contains('EXPOSE 8080') -and $frontend.Contains('THIRD-PARTY-NOTICES.txt')) 'frontend is non-root on 8080 and retains generated notices'
Assert-DockerPreparation ($nginx.Contains('location = /api {') -and
    $nginx.Contains('location ^~ /api/ {') -and
    ([regex]::Matches($nginx, 'return 503')).Count -eq 2 -and
    -not $nginx.Contains('proxy_pass')) 'bare API and API descendants fail closed without an inferred upstream'
Assert-DockerPreparation ($nginx.Contains('try_files $uri $uri/ /index.html;') -and
    $nginx.Contains('try_files $uri =404;') -and $nginx.Contains('Cache-Control "no-store"')) 'SPA deep links, missing-asset 404 and noncached HTML are configured'
Assert-DockerPreparation ($ignore[0] -ceq '**' -and
    @($ignore | Where-Object { $_ -match '^!' -and
        $_ -notmatch '^!(docker/|docker/nginx\.conf|\.shifter-developer-delivery/.*)$' }).Count -eq 0) 'build context defaults to deny and admits only packaging config and generated production payload'
Assert-DockerPreparation (@($ignore | Where-Object { $_ -match '(?i)config-examples|\.env|node_modules|\.map|old/|docs/' }).Count -eq 0) 'context has no exceptions for private config, installed dependencies, maps, legacy or docs'
$guarded = $true
for ($i = 0; $i -lt $ignore.Count; $i++) {
    if ($ignore[$i] -match '^!.+/$' -and
        ($i + 1 -ge $ignore.Count -or $ignore[$i + 1] -cne ($ignore[$i].Substring(1) + '**'))) {
        $guarded = $false
    }
}
Assert-DockerPreparation $guarded 'every traversable parent immediately excludes its descendants before explicit file exceptions'
Assert-DockerPreparation ($builderText.Contains('-Profile production -Validation')) 'real builder requests full production source validation'
Write-Host "PASS $passed focused Docker preparation checks (static and mocked; no Docker, app build or live access)"
