// Native Chrome; own tab/profile/ports. Synthetic interception only unless
// --fixture-proxy explicitly selected against the owned loopback fixture helper.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { rm, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { physicalInput, formReadyExpression } from './browser-interactions.ts';
import { waitForKeyboardModalReady } from './keyboard-modal.ts';
const app = 'http://127.0.0.1:4388', cdp = 'http://127.0.0.1:9398';
const proxy = process.argv.includes('--fixture-proxy');
const proxyScenario = process.argv.find(v => v.startsWith('--scenario='))?.slice(11) ?? 'clean';
assert(['clean','late','unknown','stale','expired'].includes(proxyScenario));
const profile = resolve(`.angular/f1-chrome-${crypto.randomUUID()}`);
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new', '--remote-debugging-port=9398', `--user-data-dir=${profile}`, '--no-first-run',
    '--no-default-browser-check', '--disable-background-networking', '--disable-component-update', 'about:blank'],
  { stdio: 'ignore' });
let socket, sequence = 0, pausedCommand = null, mode = 'clean', identityMode = 'fixture', commandBody = null;
const pending = new Map(), calls = [], errors = [], external = [];
const pause = ms => new Promise(r => setTimeout(r, ms));
async function until(fn, label, ms = 15000) {
  const start = performance.now();
  while (performance.now() - start < ms) { const result = await fn(); if (result) return result; await pause(30); }
  throw Error('Timed out: ' + label);
}
const rights = ['shift-day:read','current-shifts:read','shift-search:read','my-shifts:read','shift-items:read',
  'employee:read','attendance:read','attendance-stage-arrival:prepare','attendance-stage-arrival:commit'];
const identity = () => ({ principal: { subject:'synthetic:administrator', provider:'synthetic', synthetic:true,
  displayName:'Synthetic Administrator (local/isolated only)', roles:['Administrator'], employeeId:null,
  capabilities:identityMode === 'fixture' ? rights : rights.slice(0,7), resourceScope:{orgUnitIds:['0021']} },
  dataSource:identityMode === 'oracle' ? 'oracle' : 'isolated-fixture' });
const context = () => ({ employeeId:'9001',shiftDayId:'6201',orgUnitId:'0021',
  planned:{startLocal:mode === 'late' ? '2026-10-20T10:00:00' : '2026-10-20T10:30:00',endLocal:'2026-10-20T18:30:00'},
  recorded:{stageArrivalLocal:null,stationArrivalLocal:null,stationExitLocal:null,briefing:null},
  serverTime:{instant:'2026-10-20T07:22:00.000Z',local:'2026-10-20T10:22:00',businessTimeZone:'Asia/Jerusalem'},
  eligibility:mode === 'missing' ? 'deferred':'eligible',blockers:mode === 'missing'?['ATTENDANCE_ROW_REQUIRED']:[],
  lateReasonOptions:[{code:'1',label:'סיבה סינתטית בלבד'}],dataSource:'isolated-fixture' });
const validation = () => ({employeeId:'9001',shiftDayId:'6201',state:mode === 'late'?'warning-requires-confirmation':'ready',
  evaluatedAt:'2026-10-20T07:22:00.000Z',evaluatedLocal:'2026-10-20T10:22:00',
  expiresAt:'2026-10-20T07:24:00.000Z',
  businessTimeZone:'Asia/Jerusalem',fingerprint:'a'.repeat(64),validationToken:'x'.repeat(43),
  warnings:mode === 'late'?[{code:'STAGE_ARRIVAL_LATE',minutes:'22'}]:[],confirmationRequired:mode === 'late',
  dataSource:'isolated-fixture'});
function send(method, params = {}) {
  return new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
}
async function evaluate(expression) {
  const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
  return r.result.value;
}
const wait = expression => until(()=>evaluate(expression),expression);
async function fulfill(event, body, status = 200) {
  await send('Fetch.fulfillRequest',{requestId:event.requestId,responseCode:status,responseHeaders:[
    {name:'Content-Type',value:status===200?'application/json':'application/problem+json'},
    {name:'Cache-Control',value:'no-store'},{name:'X-Content-Type-Options',value:'nosniff'}],
  body:Buffer.from(JSON.stringify(body)).toString('base64')});
}
async function intercept(e) {
  const url=new URL(e.request.url), path=url.pathname;
  calls.push({path,method:e.request.method});
  assert.equal(url.search,'','F1 requests have no query except attendance');
  if(path==='/api/v1/identity') return fulfill(e,identity());
  if(path.endsWith('/attendance/filter-context')) return fulfill(e, {
    defaults:{attendanceDate:'2026-10-20',timeFrom:'10:00',timeTo:'10:00',mokedCode:'0012',teamCodes:[],innerJobCodes:[],workLocations:[]},
    mokedOptions:[{code:'0012',label:'מוקד סימולציה',unitType:'G01'}],
    teamOptions:[{code:'0021',label:'צוות סימולציה',unitType:'J01',parentMokedCode:'0012'}],
    innerJobOptions:[],workLocationOptions:[{code:'home',label:'בית'},{code:'site',label:'אתר'}],
    businessTimeZone:'Asia/Jerusalem',dataSource:identityMode==='oracle'?'oracle-read-only':'isolated-fixture'});
  if(path.endsWith('/context')) {
    if(mode.startsWith('error-')) {
      const status=Number(mode.slice(6)),code=({400:'INVALID_REQUEST',403:'FORBIDDEN',404:'SHIFT_DAY_NOT_FOUND',
        500:'INVALID_SOURCE_DATA',503:'DEPENDENCY_UNAVAILABLE'})[status];
      return fulfill(e,{type:`urn:shf:problem:${code}`,title:'Synthetic error',status,code,requestId:'synthetic-context',
        commandId:null,effect:'none',nextAction:status===400?'correct-and-validate':'stop'},status);
    }
    return fulfill(e,context());
  }
  if(path.endsWith('/validations')) return fulfill(e,validation());
  if(path.endsWith('/commands')) { pausedCommand=e; return; }
  throw Error('Unexpected endpoint: '+path);
}
async function key(key, code=key, modifiers=0) {
  await send('Page.bringToFront'); await wait(`document.hasFocus()`);
  const vk={Enter:13,Escape:27,Tab:9,' ':32,ArrowDown:40,ArrowUp:38}[key]??0;
  if(key==='Escape') await evaluate(`(${waitForKeyboardModalReady.toString()})(5000)`);
  await send('Input.dispatchKeyEvent',{type:'keyDown',key,code,modifiers,windowsVirtualKeyCode:vk,
    ...(key==='Enter'?{text:'\r'}:key===' '?{text:' '}:{})});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key,code,modifiers,windowsVirtualKeyCode:vk});
}
async function activate(selector) {
  await evaluate(`(()=>{const n=document.querySelector(${JSON.stringify(selector)});if(!n)throw Error('Missing target');
    n.scrollIntoView({block:'center'});n.focus({preventScroll:true});if(document.activeElement!==n)throw Error('No focus');})()`);
  await key('Enter');
}
async function navigate(path) {
  await evaluate(`window.__f1Leaving=true`);
  await send('Page.navigate',{url:app+path});
  await wait(`window.__f1Leaving!==true && location.pathname===${JSON.stringify(path)} && document.readyState==='complete'`);
}
const count = suffix => calls.filter(c=>c.path.endsWith('/'+suffix)).length;
async function screenshot(name) {
  await mkdir('.angular/browser-evidence',{recursive:true});
  const {data}=await send('Page.captureScreenshot',{captureBeyondViewport:false});
  await writeFile(`.angular/browser-evidence/F1-${name}-SYNTHETIC.png`,Buffer.from(data,'base64'));
}
async function enter(fromChooser = false) {
  if (fromChooser) await activate('shf-stage-arrival .actions a[href="/attendance"]');
  else await navigate('/attendance');
  await wait(formReadyExpression('shf-attendance','attendance-date','attendance-submit'));
  const input = physicalInput({send,evaluate,wait});
  // The real fixture sample is planned at10:30, not the intercepted scenarios'
  // generic10:00 filter. An honest empty real result must never be auto-filled.
  const inquiryTime=proxy && proxyScenario!=='late'?'10:30':'10:00';
  await input('attendance-date','20/10/2026'); await input('attendance-timeFrom',inquiryTime); await input('attendance-timeTo',inquiryTime);
  await activate('#attendance-submit'); await wait(`!!document.getElementById('attendance-arrival-6201')`);
  await activate('#attendance-arrival-6201');
  await wait(`!!document.getElementById('arrival-validate') || document.getElementById('recovery-title') ||
    document.body.textContent.includes('כשירה') || document.getElementById('arrival-status')?.textContent.includes('השרת דחה')`);
}
async function prepare() { await activate('#arrival-validate'); await wait(`!!document.getElementById('arrival-confirm') || !!document.querySelector('mat-dialog-container') || document.body.textContent.includes('תוקף הבדיקה פג')`); }
async function fixtureReadback() {
  const result=await evaluate(`(async()=>{
    const r=await fetch('/api/v1/employees/9001/shift-days/6201',{cache:'no-store'});
    const b=await r.json();return {status:r.status,source:b.dataSource,
      employee:b.employeeId,day:b.shiftDayId,stage:b.attendance?.stageArrivalLocal};
  })()`);
  assert.equal(result.status,200);assert.equal(result.source,'isolated-fixture');
  assert.equal(result.employee,'9001');assert.equal(result.day,'6201');
  return result.stage;
}
async function chooseReason() {
  await activate('#arrival-reason');await wait(`!!document.querySelector('mat-option')`);
  await key('ArrowDown');await key('Enter');
  await wait(`!document.querySelector('.cdk-overlay-pane mat-option') && document.getElementById('arrival-reason').textContent.includes('סיבה סינתטית')`);
}
async function acknowledge() {
  await evaluate(`document.querySelector('#arrival-warning-ack input').focus()`);
  await key(' ','Space');
  await wait(`document.querySelector('#arrival-warning-ack input').checked && !document.getElementById('arrival-warning-review').disabled`);
  await activate('#arrival-warning-review');
  await wait(`!!document.getElementById('arrival-confirm') && !document.querySelector('mat-dialog-container')`);
}
try {
  await until(async()=>{try{return (await fetch(cdp+'/json/version')).ok;}catch{return false;}},'own Chrome ready');
  const target=await fetch(cdp+'/json/new?about:blank',{method:'PUT'}).then(r=>r.json());
  socket=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
  socket.onmessage=e=>{
    const m=JSON.parse(e.data);
    if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}}
    else if(m.method==='Fetch.requestPaused') {
      const ev=m.params,url=new URL(ev.request.url);
      if(url.pathname==='/api/v1/attendance') {
        calls.push({path:url.pathname,method:ev.request.method});
        const p=url.searchParams, c=context(),source=identityMode==='oracle'?'oracle-read-only':'isolated-fixture';
        const body={items:[{shiftDayId:'6201',employee:{employeeId:'9001',firstName:'עובד/ת',lastName:'דוגמה',
          unit:{code:'0021',label:'צוות סימולציה',moked:{code:'0012',label:'מוקד סימולציה',unitType:'G01'}}},
          planned:{...c.planned,workingFromHome:false,activities:[],activityFallback:null,innerJob:null},
          attendance:{...c.recorded,missingReasonCode:null,briefingRecorded:null}}],
          applied:{attendanceDate:p.get('attendanceDate'),timeFrom:p.get('timeFrom'),timeTo:p.get('timeTo'),mokedCode:p.get('mokedCode'),
            teamCodes:[],innerJobCodes:[],workLocations:[],sort:'effective-start-asc'},
          page:{limit:Number(p.get('limit')),offset:Number(p.get('offset')),hasMore:false,nextOffset:null},
          businessTimeZone:'Asia/Jerusalem',dataSource:source};
        delete body.items[0].attendance.briefing;
        void fulfill(ev,body).catch(e=>errors.push(e.message));
      } else void intercept(ev).catch(e=>errors.push(e.message));
    } else if(m.method==='Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text);
    else if(m.method==='Network.requestWillBeSent') {
      const url=m.params.request.url;
      if(!url.startsWith(app)&&!url.startsWith('data:')&&!url.startsWith('about:'))external.push(url);
      if(proxy&&url.startsWith(app+'/api/')) {
        calls.push({path:new URL(url).pathname,method:m.params.request.method,
          headerNames:Object.keys(m.params.request.headers).map(s=>s.toLowerCase()).sort()});
        // Only for explicit KNOWN-success replay assertion. Volatile test
        // memory, never logged/history/browser storage; UNKNOWN never replays.
        if(url.endsWith('/stage-arrival/commands') && commandBody===null) commandBody=m.params.request.postData;
      }
    }
  };
  await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
  if(!proxy)await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__f1Elapsed=0;
    { const actual=performance.now.bind(performance); performance.now=()=>actual()+window.__f1Elapsed; }`});
  if(!proxy)await send('Fetch.enable',{patterns:[{urlPattern:'*/api/*'}]});
  // No-context direct route: zero context, zero commands.
  await navigate('/stage-arrival');await wait(`document.body.textContent.includes('לא נבחרו')`);
  assert.equal(count('commands'),0);assert.equal(count('context'),0);
  await enter();
  if(proxy)assert(await evaluate(`!!document.getElementById('arrival-validate')`),
    'Real fixture context must be admitted; inspect explicit UI problem instead of fabricating ready state');
  {
    await activate('#arrival-cancel');
    await wait(`document.activeElement.id==='attendance-arrival-6201'`);
    assert.equal(count('commands'),0);
    assert.equal(await evaluate(`document.getElementById('attendance-date').value`),'20/10/2026');
    assert.equal(await evaluate(`document.getElementById('attendance-timeFrom').value`),proxy && proxyScenario!=='late'?'10:30':'10:00');
    await activate('#attendance-arrival-6201');await wait(`!!document.getElementById('arrival-validate')`);
    console.log('PASS cancel0 restores attendance filters and exact opener');
  }
  for(const width of [1440,390,320]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
    if(width===320)await evaluate(`document.documentElement.style.fontSize='30px'`);
    await evaluate(`new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))`);
    assert(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),'no page overflow '+width);
    assert(await evaluate(`[...document.querySelectorAll('.actions button')].every(n=>n.getBoundingClientRect().height>=48)`));
    if(width===1440)assert(await evaluate(`(()=>{const r=document.getElementById('arrival-validate').getBoundingClientRect();
      return r.top>=0 && r.bottom<=innerHeight;})()`),'desktop primary action above fold');
    await screenshot('ready-'+width+(width===320?'-font30':''));
  }
  await evaluate(`document.documentElement.style.fontSize=''`);
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  if(proxy)assert.equal(await fixtureReadback(),null,'actual projection before preparation has no arrival');
  if(proxy && proxyScenario==='late')await chooseReason();
  await prepare();assert.equal(count('commands'),0);
  if(proxy) {
    assert.equal(await fixtureReadback(),null,'PURE validation changed no actual arrival');
    if(proxyScenario==='late') {
      await key('Escape');await wait(`!document.querySelector('mat-dialog-container')`);
      assert.equal(await evaluate(`document.activeElement.id`),'arrival-validate');
      assert.equal(count('commands'),0);assert.equal(await fixtureReadback(),null);
      await prepare();await acknowledge();
      assert.equal(count('commands'),0);assert.equal(await fixtureReadback(),null);
      console.log('PASS REAL late warning Escape0 / acknowledgment review0 / exact opener');
    }
    await activate('#arrival-confirm');
    if(proxyScenario==='unknown') {
      await wait(`document.getElementById('arrival-status').textContent.includes('UNKNOWN')`);
      assert.equal(count('commands'),1);assert.equal(await fixtureReadback(),'2026-10-20T10:22:00');
      assert(await evaluate(`!document.getElementById('arrival-success') && Array.isArray(history.state.shfF1Safety)`));
      for(let i=0;i<3;i++)await key(' ','Space');
      assert.equal(count('commands'),1);
      const priorContexts=count('context'),priorValidations=count('validations');
      await send('Page.reload');await wait(`!!document.getElementById('recovery-title')`);
      await enter(true);
      assert(await evaluate(`!!document.getElementById('recovery-title') && !document.getElementById('arrival-validate')`));
      assert.equal(count('context'),priorContexts);assert.equal(count('validations'),priorValidations);
      assert.equal(count('commands'),1);
      console.log('PASS REAL post-install fault UNKNOWN: actual stage exists, no false zero/success; reload/chooser same tuple blocked; command1');
    } else if(proxyScenario==='stale' || proxyScenario==='expired') {
      await wait(`document.getElementById('arrival-status').textContent.includes('STALE_PREPARATION')`);
      assert.equal(await fixtureReadback(),null);assert.equal(count('commands'),1);
      assert(await evaluate(`!document.getElementById('arrival-success') && !document.getElementById('recovery-title') && !history.state.shfF1Safety`));
      for(let i=0;i<3;i++)await key(' ','Space');
      assert.equal(count('commands'),1);
      console.log(`PASS REAL ${proxyScenario}: known-none409, actual arrival null, no auto retry/new validation`);
    } else {
      await wait(`!!document.getElementById('arrival-success')`);
      assert.equal(count('commands'),1);assert.equal(await fixtureReadback(),'2026-10-20T10:22:00');
      for(let i=0;i<3;i++)await key(' ','Space');
      assert.equal(count('commands'),1,'repeated UI activation is not an HTTP replay');
      if(proxyScenario==='clean') {
        assert(commandBody,'Native command body available only in volatile test memory');
        const replay=await evaluate(`(async()=>{
          const r=await fetch('/api/v1/employees/9001/shift-days/6201/stage-arrival/commands',{
            method:'POST',headers:{'Content-Type':'application/json'},body:${JSON.stringify(commandBody)},cache:'no-store'});
          const b=await r.json();return {status:r.status,outcome:b.outcome,replayed:b.replayed,
            source:b.dataSource,partner:b.partnerCompletion};
        })()`);
        assert.deepEqual(replay,{status:200,outcome:'fixture-committed',replayed:true,source:'isolated-fixture',partner:'not-invoked'});
        assert.equal(count('commands'),2);
        assert.equal(await fixtureReadback(),'2026-10-20T10:22:00');
        commandBody=null;
        console.log('PASS REAL explicit TEST-ONLY replay of KNOWN receipt after server-token expiry: HTTP2, one retained arrival/receipt/audit; not UI retry');
      }
      await activate('#arrival-cancel');await wait(`document.activeElement.id==='attendance-arrival-6201'`);
      assert(await evaluate(`document.querySelector('td[data-label="דיווח: הגעה לשלב"]').textContent.includes('20/10/2026 10:22:00')`));
      await activate('#attendance-arrival-6201');
      await wait(`document.body.textContent.includes('כבר אושרה בסימולציה')`);
      assert(await evaluate(`!document.getElementById('recovery-title') && !document.getElementById('arrival-validate')`));
      console.log('PASS REAL success readback in attendance + already-recorded context, no false UNKNOWN / second registration');
    }
    const stageCalls=calls.filter(c=>c.path.includes('/stage-arrival/'));
    assert(stageCalls.every(c=>['sec-ch-ua','sec-ch-ua-mobile','sec-ch-ua-platform'].every(k=>c.headerNames.includes(k))));
    console.log('PASS REAL native three Chrome client hints present unchanged; no Fetch interception', {scenario:proxyScenario});
  } else {
    await activate('#arrival-confirm');await until(()=>pausedCommand,'command paused');
    assert.equal(count('commands'),1);
    for(let i=0;i<4;i++)await key(' ','Space');
    assert.equal(count('commands'),1);
    assert.equal(await evaluate(`document.activeElement.id`),'arrival-confirm');
    assert(await evaluate(`Array.isArray(history.state.shfF1Safety) && !JSON.stringify(history.state).includes('9001')`));
    const e=pausedCommand,cmd=JSON.parse(e.request.postData);pausedCommand=null;
    await fulfill(e,{commandId:cmd.commandId,employeeId:'9001',shiftDayId:'6201',outcome:'fixture-committed',
      recorded:{stageArrivalLocal:'2026-10-20T10:22:05',briefing:false,stageLate:null},
      committedAt:'2026-10-20T07:22:05.000Z',businessTimeZone:'Asia/Jerusalem',replayed:false,
      partnerCompletion:'not-invoked',dataSource:'isolated-fixture'});
    await wait(`!!document.getElementById('arrival-success')`);assert.equal(count('commands'),1);
    await screenshot('success-1440');
    console.log('PASS clean prepare0 / repeated Space pending1 / fixture success1 / 1440,390,320+30px');
    mode='expired';await enter();await prepare();const beforeExpiry=count('commands');
    await evaluate(`window.__f1Elapsed=120000`);await activate('#arrival-confirm');
    await wait(`document.getElementById('arrival-status').textContent.includes('תוקף הבדיקה פג')`);
    assert.equal(count('commands'),beforeExpiry);
    console.log('PASS virtual elapsed-clock expiry: command0, no auto-validation/retry');
    mode='conflict';await enter();await prepare();await activate('#arrival-confirm');
    await until(()=>pausedCommand,'conflict command');const conflict=pausedCommand;pausedCommand=null;
    const conflictId=JSON.parse(conflict.request.postData).commandId;
    await fulfill(conflict,{type:'urn:shf:problem:STALE_PREPARATION',title:'Synthetic stale',status:409,
      code:'STALE_PREPARATION',requestId:'synthetic-stale',commandId:conflictId,effect:'none',nextAction:'prepare-again'},409);
    await wait(`document.getElementById('arrival-status').textContent.includes('STALE_PREPARATION')`);
    const stopped=count('commands');await key(' ','Space');assert.equal(count('commands'),stopped);
    console.log('PASS 409 stale: no receipt / no automatic command');
    mode='missing';await enter();assert.equal(await evaluate(`document.getElementById('arrival-validate')===null`),true);
    assert.equal(count('commands'),stopped);
    for(const status of [400,403,404,500,503]) {
      mode='error-'+status;await enter();assert.equal(count('commands'),stopped);
      assert(await evaluate(`document.getElementById('arrival-confirm')===null && document.getElementById('arrival-success')===null`));
    }
    console.log('PASS existing-row-required + five pure context error classes 400/403/404/500/503: command0');
    identityMode='oracle';await navigate('/attendance');
    await wait(formReadyExpression('shf-attendance','attendance-date','attendance-submit'));
    await activate('#attendance-submit');await wait(`!!document.getElementById('attendance-detail-6201')`);
    assert(await evaluate(`!document.getElementById('attendance-arrival-6201')`));
    const contextsBeforeOracle=count('context');
    await navigate('/employees/9001/shift-days/6201/stage-arrival');
    await wait(`document.getElementById('arrival-status')?.textContent.includes('קריאה בלבד')`);
    assert.equal(count('context'),contextsBeforeOracle);assert.equal(count('commands'),stopped);
    identityMode='fixture';
    console.log('PASS seven-capability Oracle identity valid READONLY; zero F1 controls/context/commands');
    // Fresh isolated browser context per scenario, not a production/UI reset API.
    mode='late';await enter();
    await activate('#arrival-reason'); await wait(`!!document.querySelector('mat-option')`);
    await key('ArrowDown');await key('Enter');
    await wait(`!document.querySelector('.cdk-overlay-pane mat-option') && document.getElementById('arrival-reason').textContent.includes('סיבה סינתטית')`);
    await prepare();const before=count('commands');
    for (const width of [390,320]) {
      await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
      await evaluate(`document.documentElement.style.fontSize=${width===320?"'30px'":"''"}`);
      const ready=await evaluate(`(${waitForKeyboardModalReady.toString()})(5000)`);
      assert.equal(ready.kind,'dialog');assert.equal(ready.finiteAnimations,0);
      assert(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),'warning no page overflow '+width);
      assert(await evaluate(`[...document.querySelectorAll('mat-dialog-actions button')].every(n=>{
        const r=n.getBoundingClientRect();return r.top>=0 && r.bottom<=innerHeight && r.height>=48;})`),
        'entire warning actions visible inside viewport '+width);
      await screenshot('warning-'+width+(width===320?'-font30':''));
      for(let i=0;i<7;i++) {
        await key('Tab','Tab',i%2?1:0);
        assert(await evaluate(`!!document.activeElement.closest('mat-dialog-container')`),'warning traps keyboard focus');
      }
    }
    await evaluate(`document.documentElement.style.fontSize=''`);
    await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
    await key('Escape');await wait(`!document.querySelector('mat-dialog-container')`);
    assert.equal(count('commands'),before);assert.equal(await evaluate(`document.activeElement.id`),'arrival-validate');
    await prepare();
    await evaluate(`document.querySelector('#arrival-warning-ack input').focus()`);
    await key(' ','Space');
    await wait(`document.querySelector('#arrival-warning-ack input').checked && !document.getElementById('arrival-warning-review').disabled`);
    await activate('#arrival-warning-review');
    await wait(`!!document.getElementById('arrival-confirm') && !document.querySelector('mat-dialog-container')`);
    assert.equal(count('commands'),before);
    await activate('#arrival-confirm');await until(()=>pausedCommand,'late command paused');
    const late=pausedCommand;pausedCommand=null;
    assert.deepEqual(JSON.parse(late.request.postData).confirmation,{accepted:true,warningCodes:['STAGE_ARRIVAL_LATE']});
    await send('Fetch.failRequest',{requestId:late.requestId,errorReason:'ConnectionClosed'});
    await wait(`document.getElementById('arrival-status').textContent.includes('UNKNOWN')`);
    assert.equal(count('commands'),before+1);
    assert.equal(await evaluate(`document.activeElement.id`),'arrival-confirm');
    assert(await evaluate(`(()=>{const r=document.querySelector('.simulation-notice').getBoundingClientRect();
      return r.top>=0 && r.bottom<=innerHeight;})()`),'simulation badge stays visible on UNKNOWN after scrolling');
    await screenshot('unknown-1440');
    await send('Page.reload');await wait(`!!document.getElementById('recovery-title')`);
    await enter(true);assert.equal(count('commands'),before+1);
    assert(await evaluate(`!!document.getElementById('recovery-title') && !document.getElementById('arrival-validate')`));
    console.log('PASS late Escape cancel0 exact opener / acknowledge review0 / command disconnect UNKNOWN / reload same tuple blocked');
    // Independent synthetic pending fixture test in a NEW tab/history. The
    // unresolved prior tab is NOT reset or changed into a known outcome.
    const onMessage=socket.onmessage;
    socket.onmessage=null;socket.close();
    const pendingTarget=await fetch(cdp+'/json/new?about:blank',{method:'PUT'}).then(r=>r.json());
    socket=new WebSocket(pendingTarget.webSocketDebuggerUrl);
    await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
    socket.onmessage=onMessage;
    await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
    await send('Fetch.enable',{patterns:[{urlPattern:'*/api/*'}]});
    mode='clean';await enter();await prepare();const pendingBefore=count('commands');
    await activate('#arrival-confirm');await until(()=>pausedCommand,'pending reload fixture request');
    assert.equal(count('commands'),pendingBefore+1);pausedCommand=null;
    await send('Page.reload');await wait(`!!document.getElementById('recovery-title')`);
    await enter(true);
    assert(await evaluate(`!!document.getElementById('recovery-title') && !document.getElementById('arrival-validate')`));
    assert.equal(count('commands'),pendingBefore+1);
    console.log('PASS separate pending test: reload before response -> recovery -> chooser same tuple blocked, command exactly1');
  }
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  console.log('F1 native Chrome PASS', {mode:proxy?'real isolated fixture proxy':'synthetic intercepted',counts:calls.reduce((a,c)=>(a[c.path]=(a[c.path]??0)+1,a),{})});
} catch (error) {
  console.error('F1 harness failure', error.message, await evaluate(`({
    path:location.pathname,status:document.getElementById('arrival-status')?.textContent,
    reason:document.getElementById('arrival-reason')?.textContent,
    active:document.activeElement?.id,dialog:!!document.querySelector('mat-dialog-container')})`).catch(()=>null));
  if(proxy)console.error('Last F1 request metadata only',calls.filter(c=>c.path.includes('/stage-arrival/')).at(-1)??null);
  throw error;
} finally {
  if(socket?.readyState===1) { try { await send('Browser.close'); } catch {} socket.close(); }
  // Kill ONLY the child process owned by this harness; profile is random/owned.
  if(chrome.exitCode===null)chrome.kill();
  await new Promise(r=>chrome.exitCode!==null?r():chrome.once('exit',r));
  await rm(profile,{recursive:true,force:true,maxRetries:10,retryDelay:100});
}
