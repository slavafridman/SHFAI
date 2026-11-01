[CmdletBinding()]
param(
    [switch]$ContainerChecks,
    [switch]$IngressContainerChecks,
    [switch]$ComposeChecks,
    [switch]$PortPreflight,
    [string]$HostPort = '8080'
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$passed = 0
function Assert-Demo([bool]$Condition, [string]$Message) {
    if (-not $Condition) { throw $Message }
    $script:passed++
    Write-Host "PASS $Message"
}
function Get-ValidatedDemoHostPort([string]$Value) {
    $number = 0
    if ($Value -cnotmatch '\A[0-9]+\z' -or
        -not [int]::TryParse($Value, [ref]$number) -or $number -lt 1 -or $number -gt 65535) {
        throw 'Host port must be decimal digits in the range 1..65535; no address or expression.'
    }
    return $number.ToString([Globalization.CultureInfo]::InvariantCulture)
}
function Assert-DemoPortUnoccupied([int]$Port, [object[]]$Listeners) {
    # Any listener on this port is a conflict. Never contact or stop its owner.
    if (@($Listeners | Where-Object { $_.LocalPort -eq $Port }).Count) {
        throw "Port $Port occupied; choose an explicitly approved alternate, never stop another owner."
    }
}
function Assert-DemoProjectAbsent([object[]]$ContainerIds) {
    if (@($ContainerIds | Where-Object { "$_".Trim() }).Count) {
        throw 'Existing shf-local-demo containers found; operator must establish ownership/state. No restart or replacement.'
    }
}
function Invoke-DemoDocker([string[]]$Arguments, [string]$InputScript) {
    $docker = (Get-Command docker.exe -ErrorAction Stop).Source
    $ErrorActionPreference = 'Continue'
    if ($InputScript) { $output = @($InputScript | & $docker @Arguments 2>&1) }
    else { $output = @(& $docker @Arguments 2>&1) }
    if ($LASTEXITCODE -ne 0) {
        $output | ForEach-Object { Write-Host "$_" }
        throw "Docker check failed (exit $LASTEXITCODE)."
    }
    return $output
}
$validatedHostPort = Get-ValidatedDemoHostPort $HostPort
foreach ($value in @('1', '8080', '18080', '65535')) {
    Assert-Demo ((Get-ValidatedDemoHostPort $value) -ceq $value) "decimal host port accepted: $value"
}
foreach ($value in @('', '0', '65536', '-1', '+18080', '18.080', ' 18080', "18080`n",
        '*', '0.0.0.0', '127.0.0.1:18080', '18080:8080', '${PORT}', '$(whoami)',
        '999999999999999999999', ([string][char]0xff11))) {
    $rejected = $false
    try { [void](Get-ValidatedDemoHostPort $value) } catch { $rejected = $true }
    Assert-Demo $rejected 'invalid host port rejected before native invocation'
}
Assert-DemoPortUnoccupied 18080 @([pscustomobject]@{ LocalPort = 8080; LocalAddress = '127.0.0.1' })
Assert-Demo $true 'mock unrelated port remains untouched'
foreach ($address in @('127.0.0.1', '0.0.0.0', '::', '::1')) {
    $rejected = $false
    try {
        Assert-DemoPortUnoccupied 18080 @([pscustomobject]@{ LocalPort = 18080; LocalAddress = $address })
    } catch { $rejected = $true }
    Assert-Demo $rejected "mock occupied port fails closed: $address"
}
Assert-DemoProjectAbsent @()
Assert-Demo $true 'mock absent demo project permits preflight'
$rejected = $false
try { Assert-DemoProjectAbsent @('synthetic-existing-container') } catch { $rejected = $true }
Assert-Demo $rejected 'mock existing project fails closed without restart/replacement'
foreach ($file in @('Build-LocalDemo-Shifter.ps1', 'Test-LocalDemo-Shifter.ps1')) {
    $tokens = $null; $errors = $null
    [void][Management.Automation.Language.Parser]::ParseFile(
        (Join-Path $PSScriptRoot $file), [ref]$tokens, [ref]$errors)
    Assert-Demo ($errors.Count -eq 0) "Windows PowerShell syntax $file"
}
foreach ($file in Get-ChildItem -LiteralPath (Join-Path $root 'docker') -Filter 'local-demo-*.mjs') {
    & node --check $file.FullName
    Assert-Demo ($LASTEXITCODE -eq 0) "Node syntax $($file.Name)"
}
Push-Location $root
try {
    $configTest = @'
import assert from 'node:assert/strict';
import {childEnvironment} from './docker/local-demo-config.mjs';
const base = {NODE_ENV:'development', SHF_APP_ENV:'dev', SHF_DEMO_OPT_IN:'synthetic-empty-dev'};
for (const env of [{}, {...base,NODE_ENV:'production'}, {...base,SHF_APP_ENV:'production'},
  {...base,SHF_APP_ENV:'test'}, {...base,SHF_DEMO_OPT_IN:'true'},
  {...base,NODE_OPTIONS:'--inspect'}, {...base,SHF_ORACLE_CONFIG:'{}'},
  {...base,SHF_NATIVE_COMMAND_COORDINATOR_CONFIG:'{}'},
  {...base,SHF_FIXTURE_CONFIG:'{}'}, {...base,SHF_FIXTURE_ROWS:'[]'},
  {...base,SHF_STATION_EXIT_ORIGINS:'[]'}, {...base,SHF_PACKAGING_SCOPE_PATH:'{}'}]) {
  assert.throws(()=>childEnvironment(env));
}
console.log('PASS 12 invalid/forbidden environment gates before config read/application import; no marker-path option');
'@
    $configTest | & node --input-type=module
    Assert-Demo ($LASTEXITCODE -eq 0) '12 explicit opt-in/profile/native/override gates'
    $purposeTest = @'
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerHooks} from 'node:module';
const source=readFileSync('./docker/local-demo-supervisor.mjs','utf8');
const empty='synthetic-empty-dev',full='synthetic-full-test';
let trace,marker;
globalThis.m02={
 read(path,encoding){trace.push('read');assert.equal(path,'/app/packaging-scope');
  assert.equal(encoding,'utf8');if(marker===null)throw Error('Missing marker');return marker;},
 config(kind){trace.push(kind);return {};},
 spawn(){trace.push('spawn');throw Error('Synthetic spawn boundary');}
};
const mocks={
 'node:fs':'export const readFileSync=(...a)=>globalThis.m02.read(...a);',
 'node:child_process':'export const spawn=(...a)=>globalThis.m02.spawn(...a);',
 './local-demo-config.mjs':'export const childEnvironment=()=>globalThis.m02.config("dev");',
 './full-test-config.mjs':'export const fullChildEnvironment=()=>globalThis.m02.config("test");',
 './full-test-readiness.mjs':'export const fullReady=()=>false;'
};
const hook=registerHooks({
 resolve(s,c,next){
  if(s.startsWith('m02:'))return {url:s,shortCircuit:true};
  if(c.parentURL?.startsWith('m02:supervisor')&&Object.hasOwn(mocks,s))
   return {url:'m02:mock/'+s,shortCircuit:true};
  return next(s,c);
 },
 load(url,c,next){
  if(url.startsWith('m02:supervisor'))return {format:'module',source,shortCircuit:true};
  if(url.startsWith('m02:mock/'))return {format:'module',source:mocks[url.slice(9)],shortCircuit:true};
  return next(url,c);
 }
});
const previous={NODE_ENV:process.env.NODE_ENV,SHF_DEMO_OPT_IN:process.env.SHF_DEMO_OPT_IN};
const listeners=['SIGTERM','SIGINT'].map(s=>[s,process.listeners(s)]);
let checks=0;
try {
 const invalid=[
  [empty,full,'test'],[full,empty,'development'],
  [empty,undefined,'production'],[full,undefined,'production'],
  [empty,empty,'production'],[full,full,'production'],
  [empty,'true','development'],[full,'synthetic-full-test\n','test'],
  ['unknown',full,'test'],['synthetic-full-test\n',full,'test'],
  [null,empty,'development'],[empty,'','development']
 ];
 const valid=[[empty,empty,'development','dev'],
  ...['READONLY','management','cancellation'].map(mode=>[full,full,'test','test',mode])];
 for(const [built,selected,nodeEnv,kind,mode] of [...invalid,...valid]){
  marker=built;trace=[];process.env.NODE_ENV=nodeEnv;
  if(selected===undefined)delete process.env.SHF_DEMO_OPT_IN;
  else process.env.SHF_DEMO_OPT_IN=selected;
  process.env.SHF_FULL_MODE=mode??'READONLY';
  await import('m02:supervisor/'+checks++);
  assert.deepEqual(trace,kind?['read',kind,'spawn']:['read']);
  assert.equal(process.exitCode,1);process.exitCode=0;
  for(const [signal,original] of listeners)
   for(const listener of process.listeners(signal))
    if(!original.includes(listener))process.removeListener(signal,listener);
 }
 console.log('PASS M02 immutable purpose: 12 rejections before config/spawn; DEV + 3 FULL modes; one fixed-path read; minimal mocks, no application imports');
} finally {
 hook.deregister();delete globalThis.m02;delete process.env.SHF_FULL_MODE;
 for(const [k,v] of Object.entries(previous))if(v===undefined)delete process.env[k];else process.env[k]=v;
}
'@
    $purposeTest | & node --input-type=module
    Assert-Demo ($LASTEXITCODE -eq 0) 'M02 shared supervisor read-before-config/spawn immutable-purpose gate'
} finally { Pop-Location }
$compose = Get-Content -LiteralPath (Join-Path $root 'docker/compose.local-demo.yml') -Raw
$nginx = Get-Content -LiteralPath (Join-Path $root 'docker/nginx.local-demo.conf') -Raw
$ingress = Get-Content -LiteralPath (Join-Path $root 'docker/nginx.local-demo-ingress.conf') -Raw
$builder = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'Build-LocalDemo-Shifter.ps1') -Raw
Assert-Demo ($compose.Contains('"127.0.0.1:${SHF_DEMO_HOST_PORT:-8080}:8080"') -and
    $compose.Contains('internal: true') -and $compose.Contains('init: true') -and
    $compose.Contains('read_only: true') -and $compose.Contains('restart: "no"') -and
    $compose.Contains('cap_drop: [ALL]') -and $compose.Contains('no-new-privileges:true') -and
    -not $compose.Contains('volumes:') -and -not $compose.Contains('build:')) 'isolated, nonroot, no-mount, no-restart Compose intent'
Assert-Demo ($ingress.Contains('proxy_pass http://demo:8080;') -and
    $ingress.Contains('proxy_set_header Host $http_host;') -and
    $ingress.Contains('proxy_next_upstream off;') -and
    $ingress.Contains('proxy_intercept_errors off;') -and
    $ingress.Contains('proxy_buffering off;') -and
    $ingress.Contains('proxy_request_buffering off;') -and
    $ingress.Contains('error_page 502 504 =503') -and
    -not $ingress.Contains('try_files') -and -not ($ingress -match '(?m)^\s*resolver\s') -and
    $ingress.Contains('access_log off;') -and $ingress.Contains('error_log /dev/null;')) 'fixed all-path ingress, unchanged upstream errors, no retry/buffering/fallback/request logs'
Assert-Demo ($nginx.Contains('location = /api {') -and
    $nginx.Contains('location ^~ /api/ {') -and $nginx.Contains('127.0.0.1:4301') -and
    $nginx.Contains('proxy_next_upstream off') -and $nginx.Contains('proxy_request_buffering off') -and
    $nginx.Contains('proxy_intercept_errors off') -and -not $nginx.Contains('X-Forwarded') -and
    $nginx.Contains('error_page 502 504 =503')) 'loopback proxy preserves API and maps only gateway failure'
Assert-Demo ($nginx.Contains('access_log off') -and $nginx.Contains('error_log /dev/null')) 'API paths, query strings and bodies excluded from NGINX logs'
foreach ($location in @('= /api', '^~ /api/')) {
    $block = [regex]::Match($nginx, 'location ' + [regex]::Escape($location) + ' \{([^}]+)\}').Groups[1].Value
    Assert-Demo ($block.Contains('proxy_hide_header X-Content-Type-Options;') -and
        -not $block.Contains('add_header ') -and -not $block.Contains('proxy_hide_header Cache-Control') -and
        -not $block.Contains('proxy_hide_header Content-Type')) "SHF53-D01 $location hides only upstream nosniff and inherits canonical security headers"
}
foreach ($location in @('= /healthz', '@gateway_unavailable')) {
    $block = [regex]::Match($nginx, 'location ' + [regex]::Escape($location) + ' \{([^}]+)\}').Groups[1].Value
    Assert-Demo ($block.Contains('add_header Cache-Control no-store always;') -and
        $block.Contains('add_header X-Content-Type-Options nosniff always;')) "SHF53-D01 $location explicit no-store/nosniff after inheritance override"
}
Assert-Demo (-not $ingress.Contains('add_header X-Content-Type-Options') -and
    -not $ingress.Contains('proxy_hide_header')) 'SHF53-D01 fixed ingress does not duplicate or strip upstream security headers'
Assert-Demo ($builder.Contains('Get-ValidatedDemoInputs') -and $builder.Contains('ComputeHash($stream)') -and
    $builder.Contains('Get-ShifterClosure') -and $builder.Contains('shf-docker-demo-') -and
    $builder.Contains('$ignore.Add("!$($input.Target)")')) 'validated ZIP/source hashes and exact temporary-context allowlist'
if ($ComposeChecks -or $ContainerChecks -or $IngressContainerChecks -or $PortPreflight) {
    $composeArguments = @('compose', '--env-file', 'NUL', '-p', 'shf-local-demo', '-f',
        (Join-Path $root 'docker/compose.local-demo.yml'))
    $previousHostPort = [Environment]::GetEnvironmentVariable('SHF_DEMO_HOST_PORT', 'Process')
    try {
        if ($null -ne $previousHostPort -and $previousHostPort -ne '') {
            $validatedEnvironmentPort = Get-ValidatedDemoHostPort $previousHostPort
            if ($PortPreflight -and $validatedEnvironmentPort -cne $validatedHostPort) {
                throw 'Requested HostPort differs from SHF_DEMO_HOST_PORT; set the explicit caller choice consistently before preflight.'
            }
        }
        foreach ($port in @('8080', '18080', $validatedHostPort) | Select-Object -Unique) {
            if ($port -ceq '8080') { Remove-Item Env:SHF_DEMO_HOST_PORT -ErrorAction SilentlyContinue }
            else { $env:SHF_DEMO_HOST_PORT = $port }
            $resolved = ((@(Invoke-DemoDocker ($composeArguments + @('config', '--format', 'json'))) -join "`n") | ConvertFrom-Json)
            $binding = @($resolved.services.ingress.ports)
            Assert-Demo ($binding.Count -eq 1 -and $binding[0].host_ip -ceq '127.0.0.1' -and
                [string]$binding[0].published -ceq $port -and $binding[0].target -eq 8080) "actual Compose loopback:$port -> container:8080"
            $demo = $resolved.services.demo
            # Compose omits false default booleans in normalized JSON.
            $ingressInternal = $resolved.networks.ingress.PSObject.Properties['internal']
            Assert-Demo (-not ($demo.PSObject.Properties.Name -contains 'ports') -and
                @($demo.expose).Count -eq 1 -and [string]$demo.expose[0] -ceq '8080' -and
                @($demo.networks.PSObject.Properties.Name).Count -eq 1 -and
                $demo.networks.PSObject.Properties.Name -contains 'demo' -and
                $resolved.networks.demo.internal -eq $true -and
                ($null -eq $ingressInternal -or $ingressInternal.Value -eq $false) -and
                $resolved.networks.ingress.driver -ceq 'bridge' -and
                @($resolved.services.PSObject.Properties.Name).Count -eq 2 -and
                @($resolved.networks.PSObject.Properties.Name).Count -eq 2 -and
                @($resolved.services.ingress.networks.PSObject.Properties.Name).Count -eq 2 -and
                $resolved.services.ingress.depends_on.demo.condition -ceq 'service_healthy' -and
                $resolved.services.ingress.healthcheck.test -contains 'http://127.0.0.1:8080/readyz') "actual Compose demo internal-only/expose8080, dual-network ingress and upstream readiness:$port"
        }
        if ($PortPreflight) {
            $env:SHF_DEMO_HOST_PORT = $validatedHostPort
            $existing = @(Invoke-DemoDocker ($composeArguments + @('ps', '--all', '--quiet')))
            Assert-DemoProjectAbsent $existing
            $listeners = @(Get-NetTCPConnection -State Listen -ErrorAction Stop)
            Assert-DemoPortUnoccupied ([int]$validatedHostPort) $listeners
            $probe = New-Object Net.Sockets.TcpListener ([Net.IPAddress]::Loopback, [int]$validatedHostPort)
            $probe.ExclusiveAddressUse = $true
            try { $probe.Start() }
            catch { throw "Loopback port $validatedHostPort unavailable; no reassignment or owner termination." }
            finally { $probe.Stop() }
            Assert-Demo $true "actual port $validatedHostPort free/bindable; no existing demo project containers (point-in-time only)"
        }
    } finally {
        if ($null -eq $previousHostPort) { Remove-Item Env:SHF_DEMO_HOST_PORT -ErrorAction SilentlyContinue }
        else { [Environment]::SetEnvironmentVariable('SHF_DEMO_HOST_PORT', $previousHostPort, 'Process') }
    }
    Assert-Demo ([Environment]::GetEnvironmentVariable('SHF_DEMO_HOST_PORT', 'Process') -ceq $previousHostPort) 'host-port process environment restored'
}
if ($IngressContainerChecks) {
    $probeName = 'shf-packaging-ingress-' + [guid]::NewGuid().ToString('N')
    try {
        Invoke-DemoDocker @('run', '-d', '--name', $probeName, '--network', 'none',
            '--add-host', 'demo:127.0.0.2', '--init', '--read-only',
            '--tmpfs', '/tmp:rw,noexec,nosuid,size=16m,mode=1777',
            '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges',
            'shifter-local-demo-ingress:dev') | Out-Host
        $probe = @'
set -eu
test "$(id -u)" = 101
nginx -t
! command -v node
! touch /etc/nginx/forbidden-write 2>/dev/null
for path in /readyz /api /api/v1/identity /missing.js /; do
  result=$(curl --silent --max-time 2 --write-out '\n%{http_code}' "http://127.0.0.1:8080$path")
  test "$result" = "$(printf '%s\n503' '{"error":"DEMO_INGRESS_UNAVAILABLE","businessOutcome":"unknown"}')"
done
! curl --fail --silent --max-time 2 --output /dev/null http://127.0.0.1:8080/readyz
printf '%s\n' 'PASS ingress actual UID101/read-only/no-Node/all-path503/real readiness rejection'
'@
        # NGINX needs only a bounded startup interval in this isolated probe.
        Start-Sleep -Seconds 1
        # Windows PowerShell's native stdin adds CRLF; strip CR before POSIX sh.
        Invoke-DemoDocker @('exec', '-i', $probeName, 'sh', '-c', "tr -d '\015' | sh") $probe | Out-Host
        Assert-Demo $true 'actual ingress no-upstream failure is503, not healthy/static/SPA success'
        Invoke-DemoDocker @('stop', '--timeout', '20', $probeName) | Out-Host
        $exitCode = (@(Invoke-DemoDocker @('inspect', '--format', '{{.State.ExitCode}}', $probeName)) -join '').Trim()
        Assert-Demo ($exitCode -ceq '0') 'actual ingress init/NGINX SIGQUIT graceful exit0'
    } finally {
        & docker.exe rm -f $probeName | Out-Host
        if ($LASTEXITCODE -ne 0) { Write-Warning "Owned ingress probe cleanup failed: $probeName" }
    }
}
if (-not $ContainerChecks) {
    Write-Host "PASS $passed focused checks (static/local Node; optional Compose configuration/port preflight and isolated ingress probe; no project service operation)"
    exit 0
}
$image = 'shifter-local-demo:dev'
$owned = New-Object 'System.Collections.Generic.List[string]'
function Start-DemoProbe {
    $name = 'shf-packaging-check-' + [guid]::NewGuid().ToString('N')
    $owned.Add($name)
    Invoke-DemoDocker @('run', '-d', '--name', $name, '--network', 'none', '--init',
        '--read-only', '--tmpfs', '/tmp:rw,noexec,nosuid,size=32m,mode=1777',
        '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges',
        '-e', 'NODE_ENV=development', '-e', 'SHF_APP_ENV=dev',
        '-e', 'SHF_DEMO_OPT_IN=synthetic-empty-dev', $image) | Out-Host
    return $name
}
function Wait-DemoExit([string]$Name) {
    $deadline = [DateTime]::UtcNow.AddSeconds(25)
    do {
        $state = (@(Invoke-DemoDocker @('inspect', '--format', '{{json .State}}', $Name)) -join '') | ConvertFrom-Json
        if (-not $state.Running) { return [string]$state.ExitCode }
        Start-Sleep -Milliseconds 100
    } while ([DateTime]::UtcNow -lt $deadline)
    throw 'Owned probe did not exit within bounded deadline.'
}
try {
    foreach ($extra in @(@(), @('-e', 'NODE_ENV=production', '-e', 'SHF_APP_ENV=dev',
            '-e', 'SHF_DEMO_OPT_IN=synthetic-empty-dev'),
        @('-e', 'NODE_ENV=development', '-e', 'SHF_APP_ENV=dev',
            '-e', 'SHF_DEMO_OPT_IN=synthetic-empty-dev', '-e', 'SHF_ORACLE_CONFIG={}'))) {
        $name = 'shf-packaging-negative-' + [guid]::NewGuid().ToString('N')
        $owned.Add($name)
        $args = @('create', '--name', $name, '--network', 'none', '--read-only',
            '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges') + $extra + @($image)
        Invoke-DemoDocker $args | Out-Host
        Invoke-DemoDocker @('start', $name) | Out-Host
        $exitCode = @(Wait-DemoExit $name)
        Assert-Demo (($exitCode -join '').Trim() -eq '1') 'actual image rejects default/production/Oracle injection'
        $logs = @(Invoke-DemoDocker @('logs', $name))
        Assert-Demo (-not ($logs -join '').Contains('identity ready')) 'negative container never starts demo backend'
    }
    $name = Start-DemoProbe
    $httpChecks = @'
import assert from 'node:assert/strict';
import {readFileSync, readdirSync, existsSync} from 'node:fs';
import {setTimeout as sleep} from 'node:timers/promises';
import net from 'node:net';
const nativeFetch=globalThis.fetch;
globalThis.fetch=(url,options={})=>nativeFetch(url,{signal:AbortSignal.timeout(2000),...options});
const base='http://127.0.0.1:8080';
let ready=false;
for(let i=0;i<50;i++) {
  try { const r=await fetch(base+'/readyz',{signal:AbortSignal.timeout(1500)});
    const b=await r.json(); if(r.status===200 && b.ready && b.profile==='dev') {ready=true;break;} } catch {}
  await sleep(100);
}
assert(ready);
const versions=JSON.parse(readFileSync('/app/runtime-versions.json','utf8'));
assert.deepEqual(versions,{node:'v24.21.0',npm:'11.19.0',oracledb:'26.0.0',debian:'bookworm'});
assert.equal(process.version,'v24.21.0'); assert.equal(process.getuid(),101);
assert.deepEqual(readdirSync('/app/node_modules').filter(n=>!n.startsWith('.')),['oracledb']);
assert(!existsSync('/usr/local/bin/npm'));
assert.throws(()=>{requireWrite();},{code:'EROFS'});
function requireWrite() {
  // The immutable runtime must not accept writes outside its bounded tmpfs.
  const fd=process.getBuiltinModule('fs');
  fd.writeFileSync('/app/packaging-unexpected-write','forbidden');
}
console.log('PASS installed runtime versions, UID101, locked runtime-only closure; npm absent');
const identity=await (await fetch(base+'/api/v1/identity')).json();
assert.equal(identity.dataSource,'isolated-fixture');
assert.equal(identity.principal.synthetic,true);
assert.equal(identity.principal.employeeId,null);
assert.equal(identity.principal.capabilities.length,7);
console.log('PASS actual synthetic identity; seven read capabilities; no native write grant');
const routes=[
 ['/api/v1/current-shifts',400],
 ['/api/v1/shift-search',400],
 ['/api/v1/my-shifts',400],
 ['/api/v1/attendance',400],
 ['/api/v1/employees/1/shift-days/1',404],
 ['/api/v1/employees/1/shift-days/1/breaks-and-exceptions',503],
 ['/api/v1/employees/1/operational-card',503],
];
for(const [path,status] of routes) {
  const r=await fetch(base+path), body=await r.json();
  console.log('READ',path,'status='+r.status,'code='+body.code);
  assert.equal(r.status,status); assert.equal(r.headers.get('cache-control'),'no-store');
  assert.equal(body.status,status); assert(body.code);
}
console.log('PASS 7 honest read-route validation/not-found responses (not seven data successes)');
for(const path of ['/api/v1/current-shifts/filter-context','/api/v1/shift-search/filter-context',
 '/api/v1/attendance/filter-context']) {
  const r=await fetch(base+path), b=await r.json();
  console.log('CONTEXT',path,'status='+r.status,JSON.stringify(b));
  assert.equal(r.status,503); assert.equal(b.code,'DEPENDENCY_UNAVAILABLE');
}
console.log('PASS 3 optional reader contexts honestly unavailable in approved empty fixture');
const staticHealth=await fetch(base+'/healthz');
assert.equal(staticHealth.status,200);
assert.match(await staticHealth.text(),/static frontend only/);
const index=await (await fetch(base+'/')).text();
assert.match(index,/\bdir=["']rtl["']/); assert.match(index,/\blang=["']he["']/);
assert.equal(await (await fetch(base+'/workspace/current-shifts')).text(),index);
let assets=0;
for(const match of index.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css))["']/g)) {
  const r=await fetch(new URL(match[1],base+'/')); assert.equal(r.status,200); assets++;
}
assert(assets>0);
assert.equal((await fetch(base+'/missing-test-asset.js')).status,404);
assert.equal((await fetch(base+'/missing-test-asset.map')).status,404);
const malformed=await fetch(base+'/api/v1/identity?unexpected=1');
assert.equal(malformed.status,400); assert.match(malformed.headers.get('content-type'),/json/);
console.log('PASS SPA Hebrew/RTL/deep link, '+assets+' index assets, missing assets404, API no-SPA fallback');
let blocked=await new Promise(resolve=>{
 const s=net.connect({host:'1.1.1.1',port:443});
 s.setTimeout(800,()=>{s.destroy();resolve(true)});
 s.on('error',()=>resolve(true));s.on('connect',()=>{s.destroy();resolve(false)});
});
assert(blocked);
console.log('PASS actual network=none TCP egress denied; Compose internal-network egress NOT certified');
'@
    Invoke-DemoDocker @('exec', '-i', $name, 'node', '--input-type=module') $httpChecks | Out-Host
    Assert-Demo $true 'actual isolated demo HTTP/runtime/RTL/assets/read failures and no-network egress'
    Invoke-DemoDocker @('top', $name) | Out-Host
    Invoke-DemoDocker @('stop', '--timeout', '20', $name) | Out-Host
    $state = @(Invoke-DemoDocker @('inspect', '--format', '{{.State.ExitCode}}', $name))
    $logs = (@(Invoke-DemoDocker @('logs', $name)) -join "`n")
    Write-Host $logs
    Assert-Demo (($state -join '').Trim() -eq '0' -and $logs.Contains('backend drained') -and
        $logs.Contains('nginx reaped code=0') -and $logs.Contains('forced=false')) 'actual graceful stop drains backend and reaps both children without force'

    $name = Start-DemoProbe
    $fault = @'
import assert from 'node:assert/strict';
import {readdirSync,readFileSync} from 'node:fs';
import {setTimeout as sleep} from 'node:timers/promises';
const nativeFetch=globalThis.fetch;
globalThis.fetch=(url,options={})=>nativeFetch(url,{signal:AbortSignal.timeout(2000),...options});
let ready=false;
for(let i=0;i<50;i++) {
 try { if((await fetch('http://127.0.0.1:8080/readyz')).status===200){ready=true;break;} } catch {}
 await sleep(100);
}
assert(ready);
function pidFor(arg) {
 for(const name of readdirSync('/proc').filter(n=>/^[0-9]+$/.test(n))) {
  try {const args=readFileSync('/proc/'+name+'/cmdline','utf8').split('\0');
   if(args[1]===arg)return Number(name);} catch {}
 }
 throw Error('Owned child not found');
}
const owner=pidFor('/app/packaging/local-demo-supervisor.mjs');
const backend=pidFor('/app/packaging/local-demo-backend.mjs');
process.kill(backend,'SIGSTOP');
try {
 assert.equal((await fetch('http://127.0.0.1:8080/readyz')).status,503);
 console.log('PASS actual unresponsive identity makes readiness503 while supervisor lives');
} finally { process.kill(backend,'SIGCONT'); }
// Freeze only this transient probe's supervisor to observe the genuine gateway
// failure interval; resume it in finally so fail-fast behavior is tested too.
process.kill(owner,'SIGSTOP');
try {
 process.kill(backend,'SIGTERM');
 await sleep(300);
 const r=await fetch('http://127.0.0.1:8080/api/v1/identity');
 assert.equal(r.status,503);
 assert.equal((await r.json()).error,'DEMO_GATEWAY_UNAVAILABLE');
 console.log('PASS actual backend-down gateway503; no fake identity/SPA success');
} finally { process.kill(owner,'SIGCONT'); }
'@
    Invoke-DemoDocker @('exec', '-i', $name, 'node', '--input-type=module') $fault | Out-Host
    $exitCode = @(Wait-DemoExit $name)
    $logs = (@(Invoke-DemoDocker @('logs', $name)) -join "`n")
    Write-Host $logs
    Assert-Demo (($exitCode -join '').Trim() -eq '1' -and
        $logs.Contains('nginx reaped code=0') -and $logs.Contains('forced=false')) 'actual backend loss fail-fast stops/reaps nginx and exits nonzero'

    $name = Start-DemoProbe
    $nginxFault = @'
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {setTimeout as sleep} from 'node:timers/promises';
let ready=false;
for(let i=0;i<50;i++) {
 try {const r=await fetch('http://127.0.0.1:8080/readyz',{signal:AbortSignal.timeout(1500)});
  if(r.status===200){ready=true;break;}} catch {}
 await sleep(100);
}
assert(ready);
const pid=Number(readFileSync('/tmp/nginx.pid','utf8').trim());
assert(Number.isInteger(pid)&&pid>1);
process.kill(pid,'SIGQUIT');
console.log('PASS fault injected into exact owned NGINX PID');
'@
    Invoke-DemoDocker @('exec', '-i', $name, 'node', '--input-type=module') $nginxFault | Out-Host
    $exitCode = @(Wait-DemoExit $name)
    $logs = (@(Invoke-DemoDocker @('logs', $name)) -join "`n")
    Write-Host $logs
    Assert-Demo (($exitCode -join '').Trim() -eq '1' -and $logs.Contains('backend drained') -and
        $logs.Contains('backend reaped code=0') -and $logs.Contains('forced=false')) 'actual nginx loss fail-fast drains/reaps backend and exits nonzero'
    Invoke-DemoDocker @('image', 'inspect', '--format', '{{.Id}}', $image) | Out-Host
    Write-Host "PASS $passed focused assertions plus embedded runtime checks; no ports, deployment, live dependencies or durable state"
} finally {
    foreach ($name in $owned) {
        # Exact names created by this invocation only; never unrelated containers.
        & docker.exe rm -f $name | Out-Host
        if ($LASTEXITCODE -ne 0) { Write-Warning "Owned probe cleanup failed: $name" }
    }
}
