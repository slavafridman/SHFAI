// Actual Angular/Material in Chrome; exclusively synthetic intercepted JSON.
import { attendanceContextFixture, attendanceListFixture, attendanceRowFixture } from '../src/attendance-fixtures.ts';
import { formReadyExpression } from './browser-interactions.ts';
import { runAttendanceReviewChecks } from './attendance-review-check.mjs';
import { waitForPickerOverlay } from './picker-overlay.ts';
export const attendanceBrowserContext = attendanceContextFixture;
export function attendanceBrowserList(url, mode) {
  const p = url.searchParams;
  const request = { attendanceDate: p.get('attendanceDate'), timeFrom: p.get('timeFrom'), timeTo: p.get('timeTo'),
    ...(p.has('mokedCode') ? { mokedCode: p.get('mokedCode') } : {}),
    ...Object.fromEntries(['teamCodes','innerJobCodes','workLocations'].filter(k => p.has(k)).map(k => [k,p.get(k).split(',')])),
    limit: Number(p.get('limit')), offset: Number(p.get('offset')), sort: 'effective-start-asc' };
  const count = mode === 'empty' ? 0 : mode === 'pages' ? request.offset ? 5 : 25 : 2;
  const items = Array.from({ length: count }, (_, i) => attendanceRowFixture(String(5201 + request.offset + i), i % 2 ? '1002' : '1001'));
  if (items[1]) {
    items[1].employee.firstName = 'נועם';
    items[1].planned.startLocal = '2026-10-19T08:00:00'; // only split-end matches; not a public field
    items[1].planned.endLocal = '2026-10-20T02:00:00';
    items[1].attendance = { stageArrivalLocal: null, stationArrivalLocal: '2026-10-20T00:07:13',
      stationExitLocal: '2026-10-20T02:03:41', missingReasonCode: '0', briefingRecorded: false };
    // Required start-ascending order; IDs/employee IDs remain independent.
    items[0].planned.startLocal = '2026-10-19T07:00:00';
  }
  if (mode === 'null-start' && items.length) items[items.length-1].planned.startLocal = null;
  if (mode === 'pages') for (const row of items) row.planned.startLocal = '2026-10-19T10:00:00';
  if (mode === 'negative' && items[0]) items[0].attendance.missingReasonCode = '-3';
  if (mode === 'long') for (const row of items) {
    row.employee.firstName = 'א'.repeat(40); row.employee.lastName = 'ב'.repeat(40);
    row.planned.activities = [{ code: '00' + 'A'.repeat(120), label: null }];
  }
  const result = attendanceListFixture(request, items);
  if (mode === 'pages' && !request.offset) result.page = { ...result.page, hasMore: true, nextOffset: 25 };
  if (mode === 'source') result.dataSource = 'oracle-read-only';
  if (mode === 'date') result.applied.attendanceDate = '2026-10-18';
  if (mode === 'malformed') result.items[1].attendance.stageArrivalLocal = 'not-a-date';
  if (mode === 'parent') result.items[1].employee.unit.moked.unitType = 'J01';
  if (mode === 'missing-day') result.items[1].shiftDayId = null;
  return result;
}
export async function runAttendanceChecks(h) {
  const { assert, send, evaluate, wait, size, navigate, key, click, activate, input, noOverflow, screenshot,
    calls, setAttendance, setAttendanceContext, setIdentity, release } = h;
  const ready = () => wait(formReadyExpression('shf-attendance', 'attendance-date', 'attendance-submit', {
    'attendance-date': '19/10/2026', 'attendance-timeFrom': '10:00', 'attendance-timeTo': '10:00',
  }));
  const result = () => wait(`!!document.getElementById('attendance-results') && !document.querySelector('mat-progress-bar')`);
  const error = () => wait(`!!document.getElementById('attendance-error') && !document.querySelector('mat-progress-bar')`);
  const count = () => calls.filter(c => c.startsWith('/api/v1/attendance?')).length;
  const pickerState = options => evaluate(`(${waitForPickerOverlay.toString()})(${JSON.stringify(options)})`);
  const escapeSelect = async selectId => {
    const open = await pickerState({ phase:'select-open', selectId });
    await key('Escape');
    const closed = await pickerState({ ...open, phase:'select-closed', selectId });
    assert.equal(closed.focusedId,selectId); assert.equal(closed.finiteAnimations,0);
    assert.equal(closed.stableFrames,2);
    return closed;
  };
  await size(1440,900); await navigate('/attendance'); await ready();
  assert.equal(await evaluate(`document.getElementById('attendance-date').value`),'19/10/2026');
  assert.equal(await evaluate(`document.getElementById('attendance-timeFrom').value`),'10:00');
  assert.equal(count(),0); await click('#attendance-submit'); await result();
  assert.equal(await evaluate(`document.querySelectorAll('thead th').length`),12);
  assert.equal(await evaluate(`document.querySelectorAll('tbody tr').length`),2);
  assert.equal(await evaluate(`document.getElementById('attendance-detail-5202').getAttribute('href')`),'/employees/1002/shift-days/5202');
  assert(await evaluate(`document.querySelector('tbody').textContent.includes('20/10/2026 00:07:13')`));
  assert(await evaluate(`document.querySelector('.mockbar').textContent.includes('מנהל מערכת סינתטי')`));
  await noOverflow(); await screenshot('attendance19-1440-SYNTHETIC');
  // Calendar is Angular Material, independent strict civil input, Escape/opener.
  await activate('mat-datepicker-toggle button'); await wait(`!!document.querySelector('mat-calendar')`);
  await key('Escape'); await wait(`!document.querySelector('mat-calendar')`);
  assert(await evaluate(`document.activeElement.closest('mat-datepicker-toggle') !== null`));
  for (const date of ['29/02/2024','01/01/0001','31/12/9999']) {
    await input('attendance-date',date); await click('#attendance-submit'); await result();
    assert.equal(await evaluate(`document.getElementById('attendance-date').value`),date);
  }
  await input('attendance-date','29/02/2026'); const beforeInvalid = count();
  await click('#attendance-submit'); assert.equal(count(),beforeInvalid);
  assert.equal(await evaluate(`document.activeElement.id`),'attendance-date');
  assert.equal(await evaluate(`document.getElementById('attendance-date').getAttribute('aria-invalid')`),'true');
  await input('attendance-date','19/10/2026');
  // Strict typed minutes, equality, inversion; Material dialog has 24*60 choices.
  for (const target of ['timeFrom','timeTo']) {
    const other = target === 'timeFrom' ? 'timeTo' : 'timeFrom';
    const old = await evaluate(`document.getElementById('attendance-${other}').value`);
    const original = await evaluate(`document.getElementById('attendance-${target}').value`);
    await click(`#attendance-${target}-open`); await wait(`!!document.querySelector('mat-dialog-container')`);
    await click('#picker-hour'); await wait(`document.querySelectorAll('mat-option').length===24`);
    await escapeSelect('picker-hour');
    await click('#picker-minute'); await wait(`document.querySelectorAll('mat-option').length===60`);
    // Exactly TWO native Escapes for this stack: select first; only after its
    // panel/aria/animations/exact trigger focus settle, Escape the dialog.
    const minuteClosed = await escapeSelect('picker-minute');
    assert(await evaluate(`!!document.querySelector('mat-dialog-container') && document.activeElement.id==='picker-minute'`));
    await key('Escape');
    const dialogClosed = await pickerState({ ...minuteClosed, phase:'dialog-closed', selectId:'picker-minute',
      openerId:`attendance-${target}-open` });
    assert.equal(dialogClosed.finiteAnimations,0);
    assert(await evaluate(`!document.querySelector('mat-dialog-container')`));
    assert.equal(await evaluate(`document.activeElement.id`),`attendance-${target}-open`);
    assert.equal(await evaluate(`document.getElementById('attendance-${target}').value`),original);
    assert.equal(await evaluate(`document.getElementById('attendance-${other}').value`),old);
    console.log('PASS minute select→dialog TWO Escape sequence', {target,selectFocus:minuteClosed.focusedId,
      dismissalStableFrames:minuteClosed.stableFrames,finiteAnimations:0,opener:dialogClosed.focusedId,unchangedValues:true});
    for (const value of ['00:00','23:59','08:07']) {
      await click(`#attendance-${target}-open`); await wait(`!!document.querySelector('mat-dialog-container')`);
      for (const [field, token] of [['hour',value.slice(0,2)],['minute',value.slice(3)]]) {
        await click(`#picker-${field}`); await wait(`!!document.querySelector('mat-option')`);
        const option = await evaluate(`[...document.querySelectorAll('mat-option')].find(n=>n.textContent.trim()===${JSON.stringify(token)}).id`);
        await click('#'+option);
      }
      await click('#time-apply'); await wait(`!document.querySelector('mat-dialog-container')`);
      assert.equal(await evaluate(`document.getElementById('attendance-${target}').value`),value);
      assert.equal(await evaluate(`document.getElementById('attendance-${other}').value`),old);
      assert.equal(await evaluate(`document.activeElement.id`),`attendance-${target}-open`);
    }
  }
  await input('attendance-timeFrom','10:00'); await input('attendance-timeTo','10:00');
  await input('attendance-timeFrom','10:01'); await click('#attendance-submit');
  assert.equal(await evaluate(`document.activeElement.id`),'attendance-timeTo');
  assert.equal(await evaluate(`document.getElementById('attendance-timeFrom').value`),'10:01');
  await input('attendance-timeFrom','10:00'); await click('#attendance-submit'); await result();
  // Stable actual focused reload element: hold, success, error, repeat Space.
  await click('#attendance-reload'); await result();
  await evaluate(`window.__attendanceReload=document.getElementById('attendance-reload');window.__attendanceReload.focus()`);
  setAttendance('hold'); const before = count(); await key(' ','Space');
  await wait(`!!document.querySelector('mat-progress-bar')`); await key(' ','Space');
  assert.equal(count(),before+1);
  assert(await evaluate(`document.activeElement===window.__attendanceReload`));
  setAttendance('normal'); await release(); await result();
  assert(await evaluate(`document.activeElement===window.__attendanceReload`));
  setAttendance(500); await key(' ','Space'); await error();
  assert(await evaluate(`document.activeElement===window.__attendanceReload`));
  setAttendance('normal'); await key(' ','Space'); await result();
  assert(await evaluate(`document.activeElement===window.__attendanceReload`));
  // Every malformed response is atomic; no stale links.
  for (const mode of ['source','date','malformed','parent','missing-day']) {
    setAttendance(mode); await click('#attendance-reload'); await error();
    assert.equal(await evaluate(`document.querySelectorAll('tbody tr,.row-link').length`),0);
  }
  for (const status of [400,401,403,500,503]) {
    setAttendance(status); await navigate('/attendance'); await ready(); await click('#attendance-submit'); await error();
    assert.equal(await evaluate(`document.querySelectorAll('tbody tr').length`),0);
  }
  for (const identity of ['no-attendance','malformed','failure']) {
    setIdentity(identity); const n = calls.filter(c=>c.startsWith('/api/v1/attendance')).length;
    await navigate('/attendance'); await error();
    assert.equal(calls.filter(c=>c.startsWith('/api/v1/attendance')).length,n);
  }
  setIdentity('normal'); setAttendance('empty'); await navigate('/attendance'); await ready();
  await click('#attendance-submit'); await result(); assert.equal(await evaluate(`document.querySelectorAll('tbody tr').length`),0);
  for (const mode of ['null-start','negative','normal']) {
    setAttendance(mode); await click('#attendance-reload'); await result();
  }
  setIdentity('attendance-only'); await navigate('/attendance'); await ready(); await click('#attendance-submit'); await result();
  assert.equal(await evaluate(`document.querySelectorAll('.row-link,.employee-card-link').length`),0);
  setIdentity('normal');
  setAttendanceContext('source'); await navigate('/attendance'); await error();
  setAttendanceContext('hierarchy'); await navigate('/attendance'); await error();
  setAttendanceContext('normal'); setAttendance('pages'); await navigate('/attendance'); await ready();
  await click('#attendance-submit'); await result(); assert.equal(await evaluate(`document.querySelectorAll('tbody tr').length`),25);
  await click('#attendance-next'); await result(); assert.equal(await evaluate(`document.querySelectorAll('tbody tr').length`),5);
  assert(calls.at(-1).includes('offset=25'));
  // Nested own-ID journey, then a second actor and independent range; Back/Forward.
  await evaluate(`(() => { const a=document.getElementById('attendance-schedule-5226');
    document.querySelector('.table-wrap').scrollLeft=-10000;a.scrollIntoView({block:'center',inline:'nearest'});a.focus({preventScroll:true});
    window.__attendanceX=document.querySelector('.table-wrap').scrollLeft;window.__attendanceY=scrollY; })()`);
  await click('#attendance-schedule-5226'); await wait(`!!document.getElementById('schedule-detail-4001')`);
  await input('schedule-dateFrom','15/10/2026'); await input('schedule-dateTo','16/10/2026'); await click('#schedule-apply');
  await wait(`!!document.getElementById('schedule-detail-4001')`);
  await click('#schedule-detail-4001'); await wait(`!!document.getElementById('detail-items')`);
  await click('#detail-items'); await wait(`!!document.getElementById('card-items')`);
  await click('#card-items'); await wait(`!!document.querySelector('.operational-card')`);
  await click('#card-back'); await wait(`document.activeElement.id==='card-items'`);
  await click('#items-back'); await wait(`document.activeElement.id==='detail-items'`);
  await click('#back-action'); await wait(`document.activeElement.id==='schedule-detail-4001'`);
  await click('#schedule-back'); await wait(`document.activeElement.id==='attendance-schedule-5226'`);
  assert.equal(await evaluate(`document.querySelectorAll('tbody tr').length`),5);
  assert.equal(await evaluate(`document.querySelector('.table-wrap').scrollLeft`),await evaluate(`window.__attendanceX`));
  assert(await evaluate(`Math.abs(scrollY-window.__attendanceY)<=1`));
  await evaluate('history.forward()'); await wait(`!!document.getElementById('schedule-back')`);
  await evaluate('history.back()'); await wait(`document.activeElement.id==='attendance-schedule-5226'`);
  // Name -> card independent of day.
  await click('#card-attendance-5226'); await wait(`!!document.querySelector('.operational-card')`);
  await click('#card-back'); await wait(`document.activeElement.id==='card-attendance-5226'`);
  // Two immutable history entries: employee1001/rangeA, new Attendance entry,
  // employee1002/rangeB. Neither upstream nor dates may come from a global
  // employee-keyed cache when traversing Back/Forward through the older entry.
  await click('#attendance-schedule-5226'); await wait(`!!document.getElementById('schedule-back')`);
  await input('schedule-dateFrom','15/10/2026'); await input('schedule-dateTo','16/10/2026'); await click('#schedule-apply');
  await wait(`!!document.getElementById('schedule-detail-4001')`);
  await click('.sidebar a[href="/attendance"]'); await ready();
  await input('attendance-timeFrom','12:00'); await input('attendance-timeTo','13:00');
  await click('#attendance-submit'); await result();
  await click('#attendance-schedule-5202'); await wait(`location.pathname==='/my-shifts/selected/1002' && !!document.getElementById('schedule-back')`);
  await input('schedule-dateFrom','20/10/2026'); await input('schedule-dateTo','22/10/2026'); await click('#schedule-apply');
  await wait(`!!document.getElementById('schedule-detail-4001')`);
  await click('#schedule-back'); await wait(`document.activeElement.id==='attendance-schedule-5202'`);
  assert.equal(await evaluate(`document.getElementById('attendance-timeFrom').value`),'12:00');
  await evaluate('history.back()'); await wait(`location.pathname==='/my-shifts/selected/1001' && !!document.getElementById('schedule-detail-4001')`);
  assert.equal(await evaluate(`document.getElementById('schedule-dateFrom').value`),'15/10/2026');
  assert.equal(await evaluate(`document.getElementById('schedule-dateTo').value`),'16/10/2026');
  await click('#schedule-back'); await wait(`document.activeElement.id==='attendance-schedule-5226'`);
  assert.equal(await evaluate(`document.getElementById('attendance-timeFrom').value`),'10:00');
  assert.equal(await evaluate(`document.querySelectorAll('tbody tr').length`),5);
  await evaluate('history.forward()'); await wait(`location.pathname==='/my-shifts/selected/1001' && !!document.getElementById('schedule-detail-4001')`);
  await evaluate('history.forward()'); await wait(`!!document.getElementById('attendance-schedule-5202')`);
  assert.equal(await evaluate(`document.getElementById('attendance-timeFrom').value`),'12:00');
  await evaluate('history.forward()'); await wait(`location.pathname==='/my-shifts/selected/1002' && !!document.getElementById('schedule-detail-4001')`);
  assert.equal(await evaluate(`document.getElementById('schedule-dateFrom').value`),'20/10/2026');
  assert.equal(await evaluate(`document.getElementById('schedule-dateTo').value`),'22/10/2026');
  await click('#schedule-back'); await wait(`document.activeElement.id==='attendance-schedule-5202'`);
  // Dirty clears row links immediately and canceled old request cannot reappear.
  setAttendance('hold'); await click('#attendance-reload'); await wait(`!!document.querySelector('mat-progress-bar')`);
  await input('attendance-timeFrom','09:00'); setAttendance('normal'); await release();
  assert.equal(await evaluate(`document.querySelectorAll('tbody tr').length`),0);
  // Locale/time-zone changes must not reinterpret the civil date or context clock.
  for (const timezoneId of ['America/Los_Angeles','Pacific/Kiritimati']) {
    await send('Emulation.setLocaleOverride',{locale:'en-US'});
    await send('Emulation.setTimezoneOverride',{timezoneId});
    await navigate('/attendance'); await ready();
    assert.equal(await evaluate(`document.getElementById('attendance-date').value`),'19/10/2026');
    await input('attendance-date','29/02/2024'); await click('#attendance-submit'); await result();
    assert(calls.at(-1).includes('attendanceDate=2024-02-29'));
  }
  await send('Emulation.setLocaleOverride',{locale:'he-IL'});
  await send('Emulation.setTimezoneOverride',{timezoneId:'Asia/Jerusalem'});
  setAttendance('normal'); await navigate('/attendance'); await ready(); await click('#attendance-submit'); await result();
  await click('#card-attendance-5201'); await wait(`!!document.querySelector('.operational-card')`);
  setAttendance('empty'); await click('#card-back'); await result();
  await wait(`document.activeElement.id==='attendance-results'`);
  assert(await evaluate(`document.querySelector('[role=status]').textContent.includes('הרשומה המקורית אינה מופיעה')`));
  // Narrow reflow including 30px text: only the table's own scroll may overflow.
  setAttendance('long'); await click('#attendance-submit'); await result();
  for (const width of [390,320]) {
    await size(width,900); await noOverflow();
    await evaluate(`(() => { const s=document.createElement('style');s.id='attendance-large-test';s.textContent='main{font-size:30px!important}';document.head.append(s);})()`);
    await evaluate(`new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))`); await noOverflow();
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('main')).fontSize`),'30px');
    await activate('mat-datepicker-toggle button'); await wait(`!!document.querySelector('mat-calendar')`);
    await key('Escape'); await wait(`!document.querySelector('mat-calendar')`); await noOverflow();
    await screenshot(`attendance19-${width}-30px-SYNTHETIC`);
    await evaluate(`document.getElementById('attendance-large-test').remove();new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))`);
    await screenshot(`attendance19-${width}-SYNTHETIC`);
  }
  await runAttendanceReviewChecks(h);
  console.log('PASS ATTENDANCE actual Angular/Material + synthetic interception: context clock, 12 columns, split-only/no-attendance/night/null/raw code, strict civil years/leap, independent minute dialogs, equality/reverse, stable reload Space, atomic malformed/source/errors/capability, 25+5, two-actor independent-range nested Back/Forward history, RTL390/320/30px; UI19-D01/D02 measured.');
}
