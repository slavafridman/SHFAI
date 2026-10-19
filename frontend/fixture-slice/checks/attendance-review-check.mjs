// Bounded independent-QA retest: real keyboard/mouse + actual Material geometry.
// Synthetic interception only; called by the stock attendance suite as well.
import { formReadyExpression } from './browser-interactions.ts';
import { waitForCalendarGeometry } from './calendar-geometry.ts';
export async function runAttendanceReviewChecks(h) {
  const { assert, send, evaluate, wait, size, navigate, key, click, activate, input, screenshot, noOverflow,
    calls, setAttendance, setAttendanceContext, setIdentity, release } = h;
  const ready = () => wait(formReadyExpression('shf-attendance', 'attendance-date', 'attendance-submit', {
    'attendance-date': '19/10/2026', 'attendance-timeFrom': '10:00', 'attendance-timeTo': '10:00',
  }));
  const count = () => calls.filter(c => c.startsWith('/api/v1/attendance?')).length;
  const openCalendar = () => activate('mat-datepicker-toggle button');
  const luminance = color => {
    const c = color.match(/[\d.]+/g).slice(0,3).map(Number).map(v => {
      const x=v/255; return x<=.04045 ? x/12.92 : ((x+.055)/1.055)**2.4;
    });
    return .2126*c[0]+.7152*c[1]+.0722*c[2];
  };
  const ring = async () => {
    const info = await evaluate(`(() => {
      const n=document.getElementById('attendance-reload'),s=getComputedStyle(n),r=n.getBoundingClientRect();
      const topbar=document.querySelector('.topbar').getBoundingClientRect();
      return {same:n===window.__attendanceQaReload,focused:document.activeElement===n,
        visible:n.matches(':focus-visible'),style:s.outlineStyle,width:parseFloat(s.outlineWidth),
        offset:parseFloat(s.outlineOffset),color:s.outlineColor,opacity:s.opacity,
        background:getComputedStyle(document.documentElement).backgroundColor,
        top:r.top,bottom:r.bottom,headerBottom:Math.max(0,topbar.bottom),viewport:innerHeight,
        exposed:n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};
    })()`);
    const a=luminance(info.color),b=luminance(info.background);
    info.contrast=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
    assert(info.same && info.focused && info.visible && info.exposed);
    assert.equal(info.style,'solid'); assert(info.width>=3 && info.offset>=3);
    assert.equal(info.opacity,'1'); assert(info.contrast>=3);
    assert(info.top-info.offset-info.width>=info.headerBottom && info.bottom+info.offset+info.width<=info.viewport);
    return info;
  };
  setIdentity('normal'); setAttendanceContext('normal');
  for (const width of [1440,320]) for (const status of [200,503]) {
    setAttendance('normal'); await size(width,width===1440?900:844);
    await navigate('/attendance'); await ready(); await click('#attendance-submit');
    await wait(`!!document.getElementById('attendance-results') && !document.querySelector('mat-progress-bar')`);
    // Establish actual keyboard modality with Tab, not just scripted focus.
    await evaluate(`(() => {const n=document.getElementById('attendance-submit');n.scrollIntoView({block:'center'});n.focus({preventScroll:true})})()`);
    await key('Tab'); await wait(`document.activeElement.id==='attendance-reload'`);
    await evaluate(`window.__attendanceQaReload=document.activeElement`);
    const initial=await ring(), before=count();
    setAttendance('hold'); await key(' ','Space'); await wait(`!!document.querySelector('mat-progress-bar')`);
    await key(' ','Space'); assert.equal(count(),before+1);
    const pending=await ring(); setAttendance('normal'); await release(status);
    await wait(status===200 ? `!!document.getElementById('attendance-results') && !document.querySelector('mat-progress-bar')` :
      `!!document.getElementById('attendance-error') && !document.querySelector('mat-progress-bar')`);
    const terminal=await ring(); assert.equal(count(),before+1);
    await screenshot(`attendance19-D01-${width}-${status}-SYNTHETIC`);
    console.log('PASS UI19-D01', {width,status,initial:initial.contrast,pending:pending.contrast,terminal:terminal.contrast,
      outline:`${terminal.width}px ${terminal.style}`,sameDOM:terminal.same,keyboardFocus:terminal.visible,requests:1,exposed:terminal.exposed});
  }
  for (const font30 of [false,true]) {
    setAttendance('normal'); await size(320,844); await navigate('/attendance'); await ready();
    if (font30) await evaluate(`(() => {const s=document.createElement('style');s.id='attendance-qa-font30';
      s.textContent='html,main{font-size:30px!important}.shf-attendance-calendar{--mat-datepicker-calendar-text-size:30px}';document.head.append(s)})()`);
    await noOverflow();
    const before=await evaluate(`document.documentElement.clientWidth`);
    let measurement, peakFinite=0, ignoredInfinite=0, minWidth=Infinity, minHeight=Infinity;
    for (let day=1;day<=31;day++) {
      const expectedActiveDay=String(Number((await evaluate(`document.getElementById('attendance-date').value`)).slice(0,2)));
      await openCalendar();
      const data=await evaluate(`(${waitForCalendarGeometry.toString()})(${JSON.stringify({
        selector:'.shf-attendance-calendar',expectedPeriod:'אוקטובר 2026',expectedActiveDay,timeoutMs:5000,
      })})`);
      assert.equal(data.signals.stableFrames,3); assert.equal(data.signals.finiteAnimations,0);
      assert.equal(data.cells.length,31);
      assert(data.cells.every(r=>r.width>=44 && r.height>=44 && r.left>=0 && r.right<=320 && r.top>=0 && r.bottom<=844));
      assert(data.cells.every(r=>r.uncovered), 'Actual day targets, including their corners, are not clipped/covered by scrollbars');
      assert(data.page<=data.viewport);
      if (font30) assert.equal(data.font,'30px');
      if (day===31) await screenshot(`attendance19-D02-grid-320-${font30?'30px':'normal'}-SYNTHETIC`);
      await click(`.shf-attendance-calendar button[aria-label=${JSON.stringify(data.cells.find(c=>c.day===String(day)).label)}]`);
      await wait(`!document.querySelector('mat-calendar') && document.getElementById('attendance-date').value==='${String(day).padStart(2,'0')}/10/2026'`);
      assert(await evaluate(`document.activeElement.closest('mat-datepicker-toggle')!==null`));
      measurement=data;
      peakFinite=Math.max(peakFinite,data.signals.peakFiniteAnimations);
      ignoredInfinite=Math.max(ignoredInfinite,data.signals.ignoredInfiniteAnimations);
      minWidth=Math.min(minWidth,...data.cells.map(r=>r.width)); minHeight=Math.min(minHeight,...data.cells.map(r=>r.height));
    }
    await noOverflow(); await screenshot(`attendance19-D02-320-${font30?'30px':'normal'}-SYNTHETIC`);
    console.log('PASS UI19-D02', {viewport:320,font30,clientBefore:before,clientDuring:measurement.client,calendar:measurement.calendar,
      minWidth,minHeight,geometryReadyOpens:31,stableFrames:3,finiteAtMeasurement:0,peakFinite,ignoredInfinite,
      physicalDaysClicked:31,cornerFailures:0,offscreen:0,pageOverflow:false});
    if (font30) await evaluate(`document.getElementById('attendance-qa-font30').remove()`);
  }
  // The scoped portal override must not resize an existing non-attendance picker.
  await navigate('/shift-search');
  await wait(formReadyExpression('shf-shift-search','search-date','search-submit'));
  await openCalendar();
  const oldCalendar=await evaluate(`(${waitForCalendarGeometry.toString()})(${JSON.stringify({
    selector:'mat-calendar',expectedPeriod:'אוקטובר 2026',expectedActiveDay:'15',timeoutMs:5000,
  })})`);
  assert.equal(oldCalendar.calendar,296);
  assert.equal(await evaluate(`document.querySelectorAll('.shf-attendance-calendar').length`),0);
  await key('Escape'); await wait(`!document.querySelector('mat-calendar')`);
  await noOverflow();
}
