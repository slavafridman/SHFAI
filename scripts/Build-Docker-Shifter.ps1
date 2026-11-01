[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$NodeImage,
    [Parameter(Mandatory = $true)]
    [string]$NginxImage,
    [ValidatePattern('^[a-z0-9][a-z0-9_.-]{0,63}$')]
    [string]$ImageTag = 'production-preparation'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$script:DockerRepository = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))

function Assert-ShifterBaseImages {
    if ($NodeImage -cnotmatch '^node:24\.21\.0-bookworm-slim@sha256:[a-f0-9]{64}$') {
        throw 'NodeImage must be node:24.21.0-bookworm-slim pinned by sha256 digest.'
    }
    if ($NginxImage -cnotmatch '^nginxinc/nginx-unprivileged:stable-bookworm@sha256:[a-f0-9]{64}$') {
        throw 'NginxImage must be nginxinc/nginx-unprivileged:stable-bookworm pinned by sha256 digest.'
    }
}

function Invoke-ShifterDocker([string[]]$Arguments) {
    $docker = (Get-Command docker.exe -ErrorAction Stop).Source
    # Windows PowerShell wraps native stderr (including successful build progress).
    $ErrorActionPreference = 'Continue'
    $output = @(& $docker @Arguments 2>&1)
    $code = $LASTEXITCODE
    if ($code -ne 0) {
        $output | ForEach-Object { Write-Host "$_" }
        $failure = New-Object System.Exception("Docker command failed (exit $code).")
        $failure.Data['ExitCode'] = $code
        throw $failure
    }
    return $output
}

function Invoke-ShifterProductionSourceBuild {
    $builder = Join-Path $PSScriptRoot 'Build-Shifter.ps1'
    & powershell.exe -NoProfile -File $builder -Profile production -Validation | Out-Host
    if ($LASTEXITCODE -ne 0) {
        $failure = New-Object System.Exception("Production source validation failed (exit $LASTEXITCODE).")
        $failure.Data['ExitCode'] = $LASTEXITCODE
        throw $failure
    }
}

function Invoke-ShifterDockerBuild {
    Assert-ShifterBaseImages
    $os = @(Invoke-ShifterDocker @('info', '--format', '{{.OSType}}'))
    if (($os -join "`n").Trim() -cne 'linux') {
        throw 'An available Linux Docker engine is required. No runtime/settings changes are automatic.'
    }
    Invoke-ShifterProductionSourceBuild
    $context = $script:DockerRepository
    $backend = "shifter-backend:$ImageTag"
    $frontend = "shifter-frontend:$ImageTag"
    Invoke-ShifterDocker @('build', '--pull', '--platform', 'linux/amd64',
        '--file', (Join-Path $context 'docker\backend.Dockerfile'),
        '--build-arg', "NODE_IMAGE=$NodeImage", '--tag', $backend, $context) | Out-Host
    Invoke-ShifterDocker @('build', '--pull', '--platform', 'linux/amd64',
        '--file', (Join-Path $context 'docker\frontend.Dockerfile'),
        '--build-arg', "NGINX_IMAGE=$NginxImage", '--tag', $frontend, $context) | Out-Host
    Invoke-ShifterDocker @('run', '--rm', '--network', 'none',
        '--read-only', '--tmpfs', '/tmp:rw,noexec,nosuid,size=32m',
        '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges',
        '--entrypoint', 'nginx', $frontend, '-t') | Out-Host
    # Import the real entrypoint without starting a service or opening a pool.
    $gate = @'
import assert from 'node:assert/strict';
import {startFromEnvironment} from './server.mts';
import {RealAuthenticationNotConfiguredError} from './environment-profiles.mts';
const config = {deploymentClass:'production', authenticationMode:'real',
  syntheticAdministratorEnabled:false, realProviderId:'', dataSource:'oracle-read-only',
  businessTimeZone:'UTC', attendanceStageArrivalMode:'disabled'};
let calls = 0;
const factories = {read:async()=>{calls++; throw Error('Forbidden pool');},
  native:async()=>{calls++; throw Error('Forbidden pool');}};
await assert.rejects(startFromEnvironment({SHF_APP_ENV:'production',
  SHF_ORACLE_CONFIG:JSON.stringify(config)}, undefined, factories), RealAuthenticationNotConfiguredError);
await assert.rejects(startFromEnvironment({SHF_APP_ENV:'production',
  SHF_ORACLE_CONFIG:JSON.stringify({...config,authenticationMode:'synthetic',
    syntheticAdministratorEnabled:true})}, undefined, factories), /Production prohibits synthetic/);
assert.equal(calls, 0);
console.log('PASS image production gates; pool calls=0');
'@
    Invoke-ShifterDocker @('run', '--rm', '--network', 'none', '--read-only',
        '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges',
        $backend, 'node', '--input-type=module', '-e', $gate) | Out-Host
    Invoke-ShifterDocker @('image', 'inspect', '--format', '{{.Id}}', $backend, $frontend) | Out-Host
    Write-Host "PASS local image preparation: $backend / $frontend"
    Write-Host 'NOT DEPLOYABLE: real authentication, API ingress/binding, Oracle client and release approval remain blocked.'
}

if ($MyInvocation.InvocationName -ne '.') {
    try { Invoke-ShifterDockerBuild; exit 0 }
    catch {
        [Console]::Error.WriteLine($_.Exception.Message)
        if ($_.Exception.Data.Contains('ExitCode')) { exit [int]$_.Exception.Data['ExitCode'] }
        exit 1
    }
}
