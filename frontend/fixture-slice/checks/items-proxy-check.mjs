// Real Angular -> own loopback proxy -> approved Node fixture read port.
// Called only after fixture-proxy-check refuses non-synthetic/Oracle identities.
export async function runItemsProxyChecks(h) {
  const { assert, app, send, evaluate, wait, input, screenshot, apiResponses } = h;
  const ready = () => wait(`!!document.querySelector('shf-shift-items .context-card') && !document.querySelector('mat-progress-bar')`);
  const navigate = async path => {
    // Do not mistake the previous document's ready DOM for a new Page.navigate.
    await evaluate(`window.__itemsProxyNavigating=true`);
    await send('Page.navigate',{url:app+path});
    await wait(`window.__itemsProxyNavigating!==true && location.pathname===${JSON.stringify(path)} && document.readyState==='complete'`);
  };
  const click = async id => {
    await evaluate(`(() => { const n=document.getElementById(${JSON.stringify(id)}); n.scrollIntoView({block:'center'}); n.focus({preventScroll:true}); })()`);
    // Actual keyboard activation supplies a browser user gesture. Script .click()
    // can make Chrome mark SPA history entries skippable on subsequent Back.
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});
    await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
    await evaluate(`new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))`);
  };
  for (const width of [1440,390,320]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height:width===1440?900:844,deviceScaleFactor:1,mobile:false});
    await navigate('/current-shifts');
    await wait(`!!document.getElementById('results-heading') && !document.querySelector('mat-progress-bar')`);
    await input('filter-date','15/10/2026'); await input('filter-time','23:59'); await click('list-search');
    await wait(`!!document.getElementById('items-2001')`);
    await click('items-2001'); await ready();
    assert.equal(await evaluate('location.pathname'),'/employees/1001/shift-days/2001/breaks-and-exceptions');
    assert.equal(await evaluate(`document.querySelectorAll('tbody tr').length`),25);
    for (const token of ['-5','99999999999999999999999999999999999999','שם סוג לא ידוע','DEL','לא חל','אין ערך רשום'])
      assert(await evaluate(`document.querySelector('main').textContent.includes(${JSON.stringify(token)})`),token);
    assert.equal(await evaluate(`document.querySelectorAll('tbody img,input[type="date"],input[type="time"]').length`),0);
    await click('items-next'); await ready(); assert.equal(await evaluate(`document.querySelectorAll('tbody tr').length`),5);
    await click('items-previous'); await ready(); await click('items-reload'); await ready();
    await evaluate(`document.querySelectorAll('tbody details').forEach(d=>d.open=true)`);
    assert(await evaluate(`document.documentElement.scrollWidth<=innerWidth`));
    await screenshot(`items18-proxy-${width}`);
    await click('items-detail'); await wait(`!!document.querySelector('.detail-card') && !document.querySelector('mat-progress-bar')`);
    await click('back-action'); await ready();
    await wait(`document.querySelector('tbody details')?.open===true`);
    await click('items-back'); await wait(`document.activeElement.id==='items-2001'`);
    assert.equal(await evaluate(`document.getElementById('filter-time').value`),'23:59');
  }
  // The other real entry actions use their own returned pairs, including schedule day.
  await navigate('/shift-search');
  await wait(`!!document.getElementById('search-submit') && !document.getElementById('search-submit').disabled`);
  await input('search-date','15/10/2026'); await input('search-timeFrom','10:00'); await input('search-timeTo','10:00');
  await click('search-submit'); await wait(`!!document.getElementById('search-items-3001')`);
  await click('search-items-3001'); await ready();
  assert.equal(await evaluate('location.pathname'),'/employees/1001/shift-days/3001/breaks-and-exceptions');
  await click('items-back'); await wait(`document.activeElement.id==='search-items-3001'`);
  await click('search-schedule-3001'); await wait(`!!document.getElementById('schedule-dateFrom') && !document.getElementById('schedule-dateFrom').disabled`);
  await input('schedule-dateFrom','15/10/2026'); await input('schedule-dateTo','16/10/2026');
  await click('schedule-apply'); await wait(`!!document.getElementById('schedule-items-3001')`);
  await click('schedule-items-3001'); await ready();
  await click('items-back'); await wait(`document.activeElement.id==='schedule-items-3001'`);
  await click('schedule-detail-3001'); await wait(`!!document.getElementById('detail-items')`);
  await click('detail-items'); await ready();
  await click('items-back'); await wait(`document.activeElement.id==='detail-items'`);
  await click('back-action'); await wait(`!!document.getElementById('schedule-back')`);
  await click('schedule-back'); await wait(`!!document.getElementById('search-schedule-3001')`);
  // Genuine server authorization/resource failures, not intercepted HTTP.
  const target='/api/v1/employees/1001/shift-days/2001/breaks-and-exceptions';
  for (const [suffix,status] of [['?limit=01',400],['?kind=break',400],['?limit=25&%6cimit=25',400]]) {
    const r=await fetch(app+target+suffix,{cache:'no-store'});
    assert.equal(r.status,status); assert.equal(r.headers.get('cache-control'),'no-store');
  }
  const wrong=await fetch(app+'/api/v1/employees/1002/shift-days/2001/breaks-and-exceptions',{cache:'no-store'});
  assert.equal(wrong.status,404);
  const p=await wrong.json(); assert.equal(p.code,'SHIFT_DAY_NOT_FOUND');
  const success=apiResponses.filter(r=>r.url.endsWith('/breaks-and-exceptions')&&r.status===200).length;
  console.log('PASS actual proxy four origins/nested return + 1440/390/320 + 25+5/reload/disclosures + real400/404', {successfulBrowserItemResponses:success});
}
