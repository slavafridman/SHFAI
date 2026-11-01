[CmdletBinding()]
param([switch]$ContainerChecks, [switch]$ComposeChecks, [switch]$HeaderChecksOnly,
    [switch]$PurposeChecksOnly, [string]$PurposeImage = 'shifter-full-test:test')
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
if ($PurposeChecksOnly) {
    # Isolated actual-image supervisor probe. No build, Compose, fixture commands,
    # private inputs, test framework or live driver imports. PurposeImage may be
    # an immutable local image ID for before-red or a throwaway marker-only image.
    $purposeProbe = @'
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createConnection} from 'node:net';
import {setTimeout as sleep} from 'node:timers/promises';
const empty='synthetic-empty-dev',full='synthetic-full-test';
const marker=readFileSync('/app/packaging-scope','utf8');
assert.ok([empty,full].includes(marker));
assert.equal(process.getuid(),101);
assert.equal(process.env.NODE_ENV,'production');
const dev={NODE_ENV:'development',SHF_APP_ENV:'dev',SHF_DEMO_OPT_IN:empty};
const test=mode=>({NODE_ENV:'test',SHF_DEMO_OPT_IN:full,SHF_FULL_MODE:mode,
 SHF_FULL_PROFILE:'test',SHF_FULL_DEPLOYMENT_CLASS:'isolated-test-demo',
 SHF_FULL_SYNTHETIC_ADMINISTRATOR:'true',SHF_FULL_PORT:'4301',
 SHF_FULL_ORIGINS:'["http://127.0.0.1:18080"]'});
// Observe the actual supervisor without replacing its config, marker or child.
const runner=`
import {registerHooks} from 'node:module';
import {readFileSync} from 'node:fs';
registerHooks({
 resolve(s,c,next){if(s==='oracledb')throw Error('Native import forbidden in purpose probe');return next(s,c);},
 load(url,c,next){
  if(url.endsWith('/local-demo-supervisor.mjs')){
   let source=readFileSync(new URL(url),'utf8');
   source=source.replace("import { spawn } from 'node:child_process';",
    "import { spawn as actualSpawn } from 'node:child_process'; const spawn=(...a)=>{console.log('M02_SPAWN');return actualSpawn(...a);};");
   source=source.replace("import { readFileSync } from 'node:fs';",
    "import { readFileSync as actualRead } from 'node:fs'; const readFileSync=(...a)=>{if(a[0]==='/app/packaging-scope')console.log('M02_MARKER_READ');return actualRead(...a);};");
   source=source.replace('const env = full ?', "console.log('M02_CONFIG_SELECTION'); const env = full ?");
   return {format:'module',source,shortCircuit:true};
  }
  if(url.endsWith('.mts'))console.log('M02_APPLICATION_IMPORT');
  return next(url,c);
 }
});
await import('/app/packaging/local-demo-supervisor.mjs');
`;
const portOpen=port=>new Promise(resolve=>{
 const socket=createConnection({host:'127.0.0.1',port});
 const finish=v=>{socket.destroy();resolve(v);};
 socket.once('connect',()=>finish(true));socket.once('error',()=>finish(false));
 socket.setTimeout(100,()=>finish(false));
});
async function run(label,env,reject){
 const child=spawn(process.execPath,['--input-type=module','--eval',runner],
  {env,stdio:['ignore','pipe','pipe']});
 let logs='',closed=false,observed=new Set(),ready;
 child.stdout.on('data',d=>logs+=d);child.stderr.on('data',d=>logs+=d);
 const done=once(child,'close').then(result=>{closed=true;return result;});
 const deadline=Date.now()+12000;
 try{
  while(!closed&&Date.now()<deadline){
   for(const port of [4301,4302,8080])if(await portOpen(port))observed.add(port);
   if(observed.has(8080)){
    try{const r=await fetch('http://127.0.0.1:8080/readyz',{signal:AbortSignal.timeout(300)});
     if(r.ok){ready=await r.json();break;}}catch{}
   }
   await sleep(10);
  }
  if(!closed)child.kill('SIGTERM');
  const [code,signal]=await done;
  const spawns=(logs.match(/M02_SPAWN/g)||[]).length;
  const selections=(logs.match(/M02_CONFIG_SELECTION/g)||[]).length;
  const imports=(logs.match(/M02_APPLICATION_IMPORT/g)||[]).length;
  const reads=(logs.match(/M02_MARKER_READ/g)||[]).length;
  console.log(JSON.stringify({label,marker,code,signal,reads,selections,spawns,
   applicationImports:imports,ports:[...observed],ready:Boolean(ready?.ready)}));
  if(reject){
   assert.equal(code,1);assert.equal(signal,null);assert.match(logs,/DEMO startup rejected/);
   assert.equal(reads,1);assert.equal(selections,0);assert.equal(spawns,0);
   assert.equal(imports,0);assert.equal(observed.size,0);assert.equal(ready,undefined);
  }else{
   assert.equal(code,0,logs);assert.equal(signal,null);
   assert.equal(reads,1);assert.equal(selections,1);assert.equal(spawns,2);
   assert.equal(ready?.ready,true);assert.equal(ready.profile,'test');
   assert.equal(ready.mode,env.SHF_FULL_MODE);assert.equal(ready.nativeOracle,false);
   assert.equal(ready.nativeEMS,false);assert.match(logs,/forced=false/);
  }
 }finally{
  if(!closed){child.kill('SIGTERM');await done;}
 }
}
await run('cross-purpose',marker===empty?test('READONLY'):dev,true);
await run('default-production-no-opt-in',{NODE_ENV:process.env.NODE_ENV},true);
await run('production-explicit-opt-in',marker===empty?{...dev,NODE_ENV:'production'}:
 {...test('READONLY'),NODE_ENV:'production'},true);
await run('unknown-opt-in',marker===empty?{...dev,SHF_DEMO_OPT_IN:'true'}:
 {...test('READONLY'),SHF_DEMO_OPT_IN:'true'},true);
if(marker===full)for(const mode of ['READONLY','management','cancellation'])
 await run('happy-'+mode,test(mode),false);
console.log('PASS M02 actual immutable marker; rejection before config/spawn/import/ports/readiness; network-none; no fixture commands or native imports');
'@
    $ErrorActionPreference = 'Continue'
    $purposeProbe | & docker.exe run --rm -i --pull never --network none --init --read-only --tmpfs '/tmp:rw,noexec,nosuid,size=32m,mode=1777' --cap-drop ALL --security-opt no-new-privileges --entrypoint node $PurposeImage --input-type=module
    if ($LASTEXITCODE -ne 0) { throw "M02 actual-image purpose checks failed (exit $LASTEXITCODE)." }
    Write-Host "PASS focused purpose checks only: $PurposeImage; no service operations"
    exit 0
}
. (Join-Path $PSScriptRoot 'Build-LocalDemo-Shifter.ps1') -DemoOptIn synthetic-full-test -Mode READONLY -ReuseValidatedPayload
foreach ($file in @('Build-Shifter.ps1', 'Build-LocalDemo-Shifter.ps1', 'Test-FullTest-Shifter.ps1')) {
    $tokens = $null; $errors = $null
    [void][Management.Automation.Language.Parser]::ParseFile((Join-Path $PSScriptRoot $file), [ref]$tokens, [ref]$errors)
    if ($errors.Count) { throw "Invalid PowerShell syntax: $file" }
}
foreach ($file in @('full-test-config.mjs', 'full-test-backend.mjs', 'full-test-readiness.mjs', 'full-test-probe.mjs')) {
    & node.exe --check (Join-Path $root "docker/$file")
    if ($LASTEXITCODE -ne 0) { throw "Invalid Node syntax: $file" }
}
$gate = @'
import assert from 'node:assert/strict';
import {fullChildEnvironment} from './docker/full-test-config.mjs';
const base={NODE_ENV:'test',SHF_DEMO_OPT_IN:'synthetic-full-test',SHF_FULL_MODE:'READONLY',
 SHF_FULL_PROFILE:'test',SHF_FULL_DEPLOYMENT_CLASS:'isolated-test-demo',
 SHF_FULL_SYNTHETIC_ADMINISTRATOR:'true',SHF_FULL_PORT:'4301',
 SHF_FULL_ORIGINS:'["http://127.0.0.1:18080"]'};
for(const mode of ['READONLY','management','cancellation']){
 const env=fullChildEnvironment({...base,SHF_FULL_MODE:mode});
 assert.equal(Object.keys(env).length,7);
}
for(const env of [{},{...base,NODE_ENV:'production'},{...base,SHF_FULL_MODE:'all'},
 {...base,SHF_FULL_ORIGINS:'["http://0.0.0.0:18080"]'},
 ...['SHF_ORACLE_CONFIG','SHF_NATIVE_COMMAND_COORDINATOR_CONFIG','NODE_OPTIONS',
 'SHF_PACKAGING_SCOPE_PATH'].map(k=>({...base,[k]:'{}'}))])
 assert.throws(()=>fullChildEnvironment(env));
console.log('PASS 3 valid / 8 invalid pre-import packaging configurations; exact CLI environment=7 keys; no marker-path environment option');
'@
Push-Location $root
try {
    $gate | & node.exe --input-type=module
    if ($LASTEXITCODE -ne 0) { throw 'FULL packaging configuration failed.' }
} finally { Pop-Location }
if ($ComposeChecks) {
    $keys = @('SHF_DEMO_OPT_IN', 'SHF_FULL_MODE', 'SHF_FULL_ORIGINS', 'SHF_DEMO_HOST_PORT')
    $previous = @{}
    foreach ($key in $keys) { $previous[$key] = [Environment]::GetEnvironmentVariable($key, 'Process') }
    try {
        $env:SHF_DEMO_OPT_IN = 'synthetic-full-test'
        $env:SHF_FULL_MODE = 'READONLY'
        $env:SHF_FULL_ORIGINS = '["http://127.0.0.1:18080"]'
        $env:SHF_DEMO_HOST_PORT = '18080'
        $config = (@(Invoke-ShifterDocker @('compose', '--env-file', 'NUL', '-p', 'shf-full-test',
            '-f', (Join-Path $root 'docker/compose.full-test.yml'), 'config', '--format', 'json')) -join "`n") | ConvertFrom-Json
        $demo = $config.services.demo
        $ingress = $config.services.ingress
        if ($demo.image -cne 'shifter-full-test:test' -or $demo.environment.NODE_ENV -cne 'test' -or
            $demo.environment.SHF_FULL_MODE -cne 'READONLY' -or $demo.user -cne '101:101' -or
            -not $demo.read_only -or -not $demo.init -or @($demo.tmpfs).Count -ne 1 -or
            $demo.tmpfs[0] -cne '/tmp:rw,noexec,nosuid,size=32m,mode=1777' -or
            @($ingress.tmpfs).Count -ne 1 -or $ingress.tmpfs[0] -cne '/tmp:rw,noexec,nosuid,size=16m,mode=1777' -or
            @($ingress.ports).Count -ne 1 -or $ingress.ports[0].host_ip -cne '127.0.0.1' -or
            $ingress.ports[0].published -cne '18080' -or -not $config.networks.demo.internal -or
            ($config.networks.ingress.PSObject.Properties['internal'] -and
                $config.networks.ingress.PSObject.Properties['internal'].Value)) {
            throw 'Resolved Compose isolation/profile configuration mismatch.'
        }
        Write-Host 'PASS resolved Compose TEST image/profile/mode/UID101/read-only/init/exact bounded tmpfs/127-only/internal Node network; configuration only'
    } finally {
        foreach ($key in $keys) { [Environment]::SetEnvironmentVariable($key, $previous[$key], 'Process') }
    }
}
if (-not $ContainerChecks -and -not $HeaderChecksOnly) { Write-Host 'PASS static/configuration only; container checks not requested'; exit 0 }
# Execute the unchanged consumer guards against actual HTTP below. Transpile only
# their runtime closure and the two envelope methods in memory; no Angular build,
# file output, dependency installation, application image/context or HTTP double.
$consumerCompiler = @'
const fs=require('node:fs'),path=require('node:path');
const ts=require('./frontend/fixture-slice/node_modules/typescript');
const root=path.resolve('frontend/fixture-slice/src'),modules={};
const compile=s=>ts.transpileModule(s,{compilerOptions:{
 target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022
}}).outputText;
function add(name){
 const key='file:///shf53-consumer/'+name;
 if(Object.hasOwn(modules,key))return;
 if(!/^[a-z0-9-]+\.ts$/.test(name))throw Error('Non-contract closure input');
 const js=compile(fs.readFileSync(path.join(root,name),'utf8')); modules[key]=js;
 for(const i of ts.preProcessFile(js).importedFiles){
  if(!/^\.\/[a-z0-9-]+$/.test(i.fileName))throw Error('Unexpected consumer runtime dependency');
  add(i.fileName.slice(2)+'.ts');
 }
}
for(const n of ['contract.ts','shift-management-contract.ts','station-exit-cancellation-contract.ts'])add(n);
function envelope(file,klass,method){
 const raw=fs.readFileSync(path.join(root,file),'utf8');
 const ast=ts.createSourceFile(file,raw,ts.ScriptTarget.Latest,true);
 const c=ast.statements.find(n=>ts.isClassDeclaration(n)&&n.name.text===klass);
 const member=c.members.find(n=>n.name?.text===method);
 if(!member)throw Error('Missing unchanged consumer envelope');
 return compile('export class '+klass+'Envelope {'+member.getText(ast).replace(/^private /,'')+'}');
}
modules['file:///shf53-consumer/envelopes.ts']=
 envelope('api.ts','SliceApi','arrivalBody')+envelope('shift-management-api.ts','ShiftManagementApi','body');
process.stdout.write(JSON.stringify(modules));
'@
Push-Location $root
try {
    $consumerModules = ($consumerCompiler | & node.exe) -join "`n"
    if ($LASTEXITCODE -ne 0) { throw 'Unchanged consumer guard memory compilation failed.' }
} finally { Pop-Location }
$consumerPrefix = @"
import {registerHooks} from 'node:module';
const consumerSources=$consumerModules;
registerHooks({
 resolve(s,c,next){
  let url=s;
  if(c.parentURL?.startsWith('file:///shf53-consumer/'))url=new URL(s+'.ts',c.parentURL).href;
  if(Object.hasOwn(consumerSources,url))return {url,shortCircuit:true};
  return next(s,c);
 },
 load(url,c,next){
  if(Object.hasOwn(consumerSources,url))return {format:'module',source:consumerSources[url],shortCircuit:true};
  return next(url,c);
 }
});
"@
$headerProbe = @'
// SHF53-D01: real Node HTTP raw headers, never a mocked response or tolerant consumer.
import assert from 'node:assert/strict';
import {request} from 'node:http';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {readFileSync,readdirSync} from 'node:fs';
import {setTimeout as sleep} from 'node:timers/promises';
import {childEnvironment} from '/app/packaging/local-demo-config.mjs';
const {identity:validIdentity}=await import('file:///shf53-consumer/contract.ts');
const {managementContext}=await import('file:///shf53-consumer/shift-management-contract.ts');
const {cancellationIdentity,cancellationContext}=await import('file:///shf53-consumer/station-exit-cancellation-contract.ts');
const {SliceApiEnvelope,ShiftManagementApiEnvelope}=await import('file:///shf53-consumer/envelopes.ts');
const origin='http://127.0.0.1:18080';
let checks=0;
function wire(path, status, options={}, type=status>=400?'application/problem+json':'application/json', cache=true) {
 return new Promise((resolve,reject)=>{
  const q=request({host:'127.0.0.1',port:8080,path,...options},r=>{
   let body=''; r.setEncoding('utf8'); r.on('data',d=>body+=d);
   r.on('error',reject); r.on('end',()=>{
    try {
     assert.equal(r.statusCode,status,path);
     const values=[];
     for(let i=0;i<r.rawHeaders.length;i+=2)
      if(r.rawHeaders[i].toLowerCase()==='x-content-type-options')values.push(r.rawHeaders[i+1]);
     assert.deepEqual(values,['nosniff'],path+' raw header lines');
     assert.deepEqual(values.flatMap(v=>v.split(',')),['nosniff'],path+' header parts');
     assert.equal(r.headers['x-content-type-options'],'nosniff',path+' strict consumer envelope');
     assert.ok(r.headers['content-type'].startsWith(type),path+' content type');
     if(cache)assert.equal(r.headers['cache-control'],'no-store',path+' cache');
     if(status===200&&type==='application/json') {
      const dto=JSON.parse(body);
      assert.equal(new SliceApiEnvelope().arrivalBody({status,body:dto,
       headers:{get:k=>r.headers[k.toLowerCase()]??null}},2097152),dto,path+' unchanged exact envelope');
     }
     checks++; resolve({body,headers:r.headers});
    } catch(e){reject(e);}
   });
  });
  const deadline=setTimeout(()=>q.destroy(Error('HTTP deadline')),8000);
  q.once('close',()=>clearTimeout(deadline)); q.on('error',reject);
  q.end(options.body);
 });
}
function ownedBackend() {
 for(const n of readdirSync('/proc').filter(n=>/^\d+$/.test(n))) {
  try {
   const a=readFileSync('/proc/'+n+'/cmdline','utf8').split('\0');
   if(a[1]==='/app/packaging/full-test-backend.mjs')return Number(n);
  } catch {}
 }
 throw Error('Owned isolated backend absent');
}
async function stop(child,signal='SIGTERM') {
 if(child.exitCode!==null||child.signalCode!==null)return;
 const closed=once(child,'close'); child.kill(signal); await closed;
}
for(const mode of ['READONLY','management','cancellation','empty']) {
 const children=[];
 let owner;
 try {
  const env=mode==='empty'?childEnvironment({
   NODE_ENV:'development',SHF_APP_ENV:'dev',SHF_DEMO_OPT_IN:'synthetic-empty-dev'
  }):{NODE_ENV:'test',SHF_DEMO_OPT_IN:'synthetic-full-test',SHF_FULL_MODE:mode,
   SHF_FULL_PROFILE:'test',SHF_FULL_DEPLOYMENT_CLASS:'isolated-test-demo',
   SHF_FULL_SYNTHETIC_ADMINISTRATOR:'true',SHF_FULL_PORT:'4301',
   SHF_FULL_ORIGINS:JSON.stringify([origin])};
  owner=spawn(process.execPath,[mode==='empty'?'/app/packaging/local-demo-backend.mjs':
   '/app/packaging/local-demo-supervisor.mjs'],{env,stdio:['ignore','ignore','ignore']});
  children.push(owner);
  if(mode==='empty') {
   const nginx=spawn('/usr/sbin/nginx',['-e','/dev/null','-g','daemon off;'],
    {env:{PATH:'/usr/sbin:/usr/bin:/bin'},stdio:'ignore'});
   children.push(nginx);
  }
  let started=false;
  for(let i=0;i<120;i++) {
   assert.equal(owner.exitCode,null,'startup '+mode);
   try {
    // Wait only for sockets/application startup; all security assertions below are uncaught.
    const r=await fetch('http://127.0.0.1:8080/api/v1/identity',{signal:AbortSignal.timeout(500)});
    if(r.status===200){started=true;break;}
   } catch {}
   await sleep(100);
  }
  assert.ok(started,mode);
  const identity=JSON.parse((await wire('/api/v1/identity',200)).body);
  assert.ok(validIdentity(identity)); assert.equal(identity.principal.synthetic,true);
  // Bare API targets are invalid framing (400), not a SPA or route-not-found.
  for(const path of ['/api','/api/'])await wire(path,400);
  await wire('/api/v1/employees/1/shift-days/9999999999',404);
  if(mode==='empty') {
   await wire('/api/v1/employees/1/operational-card',503);
   await wire('/api/v1/current-shifts/filter-context',503);
  } else {
   const {fullInquiryPaths}=await import('/app/populated-world.mts');
   for(const path of fullInquiryPaths(mode)) {
    const b=JSON.parse((await wire(path,200)).body);
    assert.ok(JSON.stringify(b).includes('"dataSource":"isolated-fixture"'),path);
   }
   const path=mode==='cancellation'
    ?'/api/v1/employees/9001/shift-days/6201/station-exit-cancellation/validations'
    :'/api/v1/employees/1/shift-management/preparations';
   await wire(path,403,{method:'POST',headers:{origin:'http://127.0.0.1:18081',
    'content-type':'application/json'},body:'{}'});
   const ready=JSON.parse((await wire('/readyz',200)).body);
   assert.equal(ready.mode,mode); assert.equal(ready.nativeOracle,false); assert.equal(ready.nativeEMS,false);
   if(mode==='management'||mode==='cancellation') {
    const contextPath=mode==='management'?'/api/v1/employees/1/shift-management/shift-days/19003/context':
     '/api/v1/employees/9001/shift-days/6201/station-exit-cancellation/context';
    const r=await wire(contextPath,200),body=JSON.parse(r.body);
    const response={status:200,body,headers:{get:k=>r.headers[k.toLowerCase()]??null}};
    if(mode==='management') {
     assert.equal(new ShiftManagementApiEnvelope().body(response),body);
     assert.ok(managementContext(body,'1','19003',identity));
    } else {
     assert.ok(cancellationIdentity(identity));
     assert.equal(new SliceApiEnvelope().arrivalBody(response,65536),body);
     const detail=JSON.parse((await wire('/api/v1/employees/9001/shift-days/6201',200)).body);
     const selection={employeeId:'9001',shiftDayId:'6201',orgUnitId:detail.employee.orgUnitId,
      attendanceKey:{shiftDayId:'6201'},dataSource:'isolated-fixture',
      startLocal:detail.effectiveShift.startLocal,endLocal:detail.effectiveShift.endLocal};
     assert.ok(cancellationContext(body,selection));
    }
    // Prove the unchanged exact consumer still rejects the original defect.
    const duplicate={...response,headers:{get:k=>k.toLowerCase()==='x-content-type-options'
     ?'nosniff,nosniff':response.headers.get(k)}};
    assert.throws(()=>mode==='management'?new ShiftManagementApiEnvelope().body(duplicate):
     new SliceApiEnvelope().arrivalBody(duplicate,65536));
    console.log('PASS '+mode+' unchanged programmatic consumer envelope + context DTO; duplicate remains rejected');
   }
  }
  await wire('/healthz',200,{},'text/plain');
  const index=(await wire('/',200,{},'text/html')).body;
  for(const m of index.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css))["']/g)) {
   const path=new URL(m[1],'http://127.0.0.1:8080/').pathname;
   await wire(path,200,{},path.endsWith('.css')?'text/css':'application/javascript');
  }
  await wire('/missing-security-asset.js',404,{},'text/html');
  await wire('/missing-security-asset.map',404,{},'text/html',false);
  if(mode!=='empty') {
   const pid=ownedBackend();
   process.kill(pid,'SIGSTOP');
   try {await wire('/readyz',503,{},'application/json');} finally {process.kill(pid,'SIGCONT');}
   owner.kill('SIGSTOP');
   try {
    process.kill(pid,'SIGTERM');
    await sleep(500);
    const b=JSON.parse((await wire('/api/v1/identity',503,{},'application/json')).body);
    assert.equal(b.error,'DEMO_GATEWAY_UNAVAILABLE');
    await wire('/api',503,{},'application/json');
   } finally {owner.kill('SIGCONT');}
  }
  console.log('PASS SHF53-D01 '+mode+' actual raw-header/API/context/error/static/health'+
   (mode==='empty'?' upstream503':' readiness503/gateway503')+' checks');
 } finally {
  for(const child of children.reverse())await stop(child,child.spawnfile==='/usr/sbin/nginx'?'SIGQUIT':'SIGTERM');
 }
}
console.log('PASS SHF53-D01 canonical raw-header envelopes='+checks+'; Origin denial unchanged; no fixture commands');
'@
$ErrorActionPreference = 'Continue'
($consumerPrefix + "`n" + $headerProbe) | & docker.exe run --rm -i --network none --init --read-only --tmpfs '/tmp:rw,noexec,nosuid,size=32m,mode=1777' --cap-drop ALL --security-opt no-new-privileges --entrypoint node shifter-full-test:test --input-type=module
if ($LASTEXITCODE -ne 0) { throw "SHF53-D01 raw-header probes failed (exit $LASTEXITCODE)." }
$ErrorActionPreference = 'Stop'
if ($HeaderChecksOnly) { Write-Host 'PASS focused header container checks only; no service operations'; exit 0 }
$inputs = @(Get-ValidatedDemoInputs)
$imageRows = @()
foreach ($input in $inputs) {
    $path = if ($input.Target.StartsWith('backend/')) { '/app/' + $input.Target.Substring(8) }
        else { '/usr/share/nginx/html/' + $input.Target.Substring(8) }
    $imageRows += [pscustomobject]@{ path = $path; sha256 = (Get-FileHash -LiteralPath $input.Source).Hash.ToLowerInvariant() }
}
$imageRows += [pscustomobject]@{ path = '/etc/nginx/nginx.conf'; sha256 = (Get-FileHash -LiteralPath (Join-Path $root 'docker/nginx.local-demo.conf')).Hash.ToLowerInvariant() }
$rows = ConvertTo-Json -InputObject $imageRows -Compress
$byteProbe = @"
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const rows=$rows;
for(const row of rows) assert.equal(createHash('sha256').update(readFileSync(row.path)).digest('hex'),row.sha256,row.path);
console.log('PASS actual image bytes: validated TEST payload files='+(rows.length-1)+'; current nginx config=1; runtime and browser hashes verified');
"@
$ErrorActionPreference = 'Continue'
$byteProbe | & docker.exe run --rm -i --network none --read-only --cap-drop ALL --security-opt no-new-privileges --entrypoint node shifter-full-test:test --input-type=module
if ($LASTEXITCODE -ne 0) { throw "Image byte proof failed (exit $LASTEXITCODE)." }
$ErrorActionPreference = 'Stop'
$probe = Get-Content -LiteralPath (Join-Path $root 'docker/full-test-probe.mjs') -Raw
$ErrorActionPreference = 'Continue'
$probe | & docker.exe run --rm -i --network none --init --read-only --tmpfs '/tmp:rw,noexec,nosuid,size=32m,mode=1777' --cap-drop ALL --security-opt no-new-privileges --entrypoint node shifter-full-test:test --input-type=module
if ($LASTEXITCODE -ne 0) { throw "FULL image packaging probes failed (exit $LASTEXITCODE)." }
$ErrorActionPreference = 'Stop'
[void](Get-ValidatedDemoInputs)
Write-Host 'PASS container checks; source snapshot unchanged; no Compose service operations'
