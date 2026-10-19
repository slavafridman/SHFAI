// Actual Angular -> own proxy -> Node attendance read port, NO interception.
// Caller refuses non-synthetic/non-fixture identity before any resource read.
export async function runAttendanceProxyChecks(h) {
  const { assert, app, send, evaluate, wait, input, screenshot, apiResponses } = h;
  const navigate = async path => {
    await evaluate('window.__attendanceLeaving=true');
    await send('Page.navigate', { url: app + path });
    await wait(`window.__attendanceLeaving!==true && location.pathname===${JSON.stringify(path)} && document.readyState==='complete'`);
  };
  const click = async id => {
    await evaluate(`(() => {const n=document.getElementById(${JSON.stringify(id)});n.scrollIntoView({block:'center'});n.focus({preventScroll:true})})()`);
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    await evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
  };
  const select = async () => {
    await input('attendance-date','19/10/2026'); await input('attendance-timeFrom','10:00'); await input('attendance-timeTo','10:00');
    await click('attendance-submit'); await wait(`!!document.getElementById('attendance-detail-5202')`);
  };
  const source = await fetch(app + '/api/v1/attendance/filter-context', { cache: 'no-store' });
  assert.equal(source.status,200); const context = await source.json();
  assert.equal(context.dataSource,'isolated-fixture'); assert.equal(context.defaults.timeFrom,context.defaults.timeTo);
  assert.equal(source.headers.get('cache-control'),'no-store'); assert.equal(source.headers.get('x-content-type-options'),'nosniff');
  for (const width of [1440,390,320]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height:900, deviceScaleFactor:1, mobile:false });
    const before = apiResponses.filter(r=>r.url==='/api/v1/attendance').length;
    await navigate('/attendance'); await wait(`!!document.getElementById('attendance-submit') && !document.getElementById('attendance-submit').disabled`);
    assert.equal(apiResponses.filter(r=>r.url==='/api/v1/attendance').length,before);
    assert.equal(await evaluate(`document.getElementById('attendance-timeFrom').value`),context.defaults.timeFrom);
    await select();
    assert.equal(await evaluate(`document.querySelectorAll('tbody tr').length`),25);
    const first = await evaluate(`document.querySelector('tbody tr').textContent`);
    assert(first.includes('20/10/2026 00:07:13') && first.includes('19/10/2026 08:00:00'));
    assert(await evaluate(`document.querySelectorAll('thead th').length===12`));
    await click('attendance-next'); await wait(`!!document.getElementById('attendance-detail-5226')`);
    assert.equal(await evaluate(`document.querySelectorAll('tbody tr').length`),5);
    await screenshot(`attendance19-proxy-${width}-SYNTHETIC`);
    await click('attendance-schedule-5226'); await wait(`!!document.getElementById('schedule-dateFrom') && !document.getElementById('schedule-dateFrom').disabled`);
    await input('schedule-dateFrom','19/10/2026'); await input('schedule-dateTo','20/10/2026'); await click('schedule-apply');
    await wait(`!!document.getElementById('schedule-detail-5201')`);
    await click('schedule-detail-5201'); await wait(`!!document.getElementById('detail-items')`);
    assert.equal(await evaluate('location.pathname'),'/employees/1001/shift-days/5201');
    await click('detail-items'); await wait(`!!document.getElementById('card-items')`);
    await click('card-items'); await wait(`!!document.querySelector('.operational-card')`);
    await click('card-back'); await wait(`document.activeElement.id==='card-items'`);
    await click('items-back'); await wait(`document.activeElement.id==='detail-items'`);
    await click('back-action'); await wait(`document.activeElement.id==='schedule-detail-5201'`);
    await click('schedule-back'); await wait(`document.activeElement.id==='attendance-schedule-5226'`);
    assert.equal(await evaluate(`document.getElementById('attendance-timeFrom').value`),'10:00');
    assert.equal(await evaluate(`document.querySelectorAll('tbody tr').length`),5);
    assert(await evaluate(`document.documentElement.scrollWidth<=innerWidth`));
    await input('attendance-timeFrom','10:01'); await input('attendance-timeTo','10:01'); await click('attendance-submit');
    await wait(`!!document.getElementById('attendance-results') && !document.querySelector('table')`);
    assert.equal(await evaluate(`document.querySelectorAll('.row-link').length`),0);
  }
  const base = app + '/api/v1/attendance';
  for (const q of ['?attendanceDate=2026-10-19&timeFrom=10:01&timeTo=10:00',
    '?attendanceDate=2026-10-19&timeFrom=10:00&timeTo=10:00&include=private',
    '?attendanceDate=2026-10-19&timeFrom=10:00&timeTo=10:00&timeTo=10:00']) {
    const r = await fetch(base+q,{cache:'no-store'}); assert.equal(r.status,400);
    assert.equal((await r.json()).code,'INVALID_REQUEST');
  }
  const data = await fetch(base+'?attendanceDate=2026-10-19&timeFrom=10:00&timeTo=10:00&limit=100',{cache:'no-store'}).then(r=>r.json());
  assert.equal(data.items.length,30); const row = data.items.find(r=>r.shiftDayId==='5201');
  assert.deepEqual(Object.values(row.attendance),[null,null,null,null,null]);
  assert.deepEqual(Object.keys(row).sort(),['attendance','employee','planned','shiftDayId']);
  assert(!JSON.stringify(data).includes('employeeNumber'));
  console.log('PASS ATTENDANCE real fixture proxy (not intercepted): 1440/390/320, single server-default context, planned-only/split-only/no-attendance/night raw0, actual25+5, nested schedule/detail/items/card reverse chain, genuine empty/400, exact privacy projection/no-store/nosniff.');
}
