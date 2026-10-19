// Real Angular -> own loopback proxy -> own Node isolated fixture. NO interception.
export async function runEmployeeCardProxyChecks(h) {
  const {assert,app,send,evaluate,wait,input,screenshot,apiResponses} = h;
  const ready = () => wait(`!!document.querySelector('.operational-card') && !document.querySelector('mat-progress-bar')`);
  const navigate = async path => {
    await evaluate('window.__cardProxyLeaving=true');
    await send('Page.navigate',{url:app+path});
    await wait(`window.__cardProxyLeaving!==true && location.pathname===${JSON.stringify(path)} && document.readyState==='complete'`);
  };
  const click = async id => {
    await evaluate(`(() => {const n=document.getElementById(${JSON.stringify(id)}); n.scrollIntoView({block:'center'});n.focus({preventScroll:true})})()`);
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});
    await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
    await evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
  };
  for (const width of [1440,390,320]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height:width===1440?900:844,deviceScaleFactor:1,mobile:false});
    await navigate('/current-shifts'); await wait(`!!document.getElementById('list-search') && !document.getElementById('list-search').disabled`);
    await input('filter-date','15/10/2026'); await input('filter-time','23:59'); await click('list-search');
    await wait(`!!document.getElementById('card-current-2001')`);
    const n = apiResponses.filter(r=>r.url.endsWith('/operational-card')).length;
    await click('card-current-2001'); await ready();
    assert.equal(await evaluate('location.pathname'),'/employees/1001/operational-card');
    assert.equal(apiResponses.filter(r=>r.url.endsWith('/operational-card')).length,n+1);
    assert.equal(await evaluate(`document.querySelectorAll('.fields>div').length`),6);
    assert(await evaluate(`document.querySelector('.operational-card').textContent.includes('דנה לוי')`));
    assert(await evaluate(`document.querySelector('.resource-source').textContent.includes('סינתטיים בלבד')`));
    assert.equal(await evaluate(`document.querySelectorAll('main input,main select,main textarea,main img,main iframe,[role=tab]').length`),0);
    assert(await evaluate(`document.documentElement.scrollWidth<=innerWidth`));
    await screenshot('card19-proxy-'+width);
    await click('card-back'); await wait(`document.activeElement.id==='card-current-2001'`);
    assert.equal(await evaluate(`document.getElementById('filter-time').value`),'23:59');
  }
  await navigate('/shift-search'); await wait(`!!document.getElementById('search-submit') && !document.getElementById('search-submit').disabled`);
  await input('search-date','15/10/2026'); await input('search-timeFrom','10:00'); await input('search-timeTo','10:00');
  await click('search-submit'); await wait(`!!document.getElementById('card-search-3001')`);
  await click('card-search-3001'); await ready(); await click('card-back');
  await wait(`document.activeElement.id==='card-search-3001'`);
  await click('search-schedule-3001'); await wait(`!!document.getElementById('card-schedule-header')`);
  await click('card-schedule-header'); await ready(); await click('card-back');
  await wait(`document.activeElement.id==='card-schedule-header'`);
  await input('schedule-dateFrom','15/10/2026'); await input('schedule-dateTo','16/10/2026');
  await click('schedule-apply'); await wait(`!!document.getElementById('schedule-detail-3001')`);
  await click('schedule-detail-3001'); await wait(`!!document.getElementById('card-detail')`);
  await click('card-detail'); await ready(); await click('card-back');
  await wait(`document.activeElement.id==='card-detail'`);
  await click('detail-items'); await wait(`!!document.getElementById('card-items')`);
  await click('card-items'); await ready(); await click('card-back');
  await wait(`document.activeElement.id==='card-items'`);
  await click('items-back'); await wait(`document.activeElement.id==='detail-items'`);
  await click('back-action'); await wait(`document.activeElement.id==='schedule-detail-3001'`);
  await click('schedule-back'); await wait(`document.activeElement.id==='search-schedule-3001'`);
  assert.equal(await evaluate(`document.getElementById('search-timeFrom').value`),'10:00');
  await navigate('/employees/1002/operational-card'); await ready();
  const fields = await evaluate(`[...document.querySelectorAll('.fields dd')].map(n=>n.textContent.trim())`);
  assert(fields[4].includes('תיאור לא זמין') && fields[4].includes('-9')); assert.equal(fields[5],'לא צוין');
  await click('card-reload'); await ready(); await screenshot('card19-proxy-unknown');
  const base='/api/v1/employees/1001/operational-card';
  for (const suffix of ['?day=2001','?include=private','?x=1&%78=2']) {
    const r=await fetch(app+base+suffix,{cache:'no-store'});
    assert.equal(r.status,400); assert.equal(r.headers.get('cache-control'),'no-store');
    assert.equal((await r.json()).code,'INVALID_REQUEST');
  }
  for (const id of ['9999','1003']) {
    const r=await fetch(app+`/api/v1/employees/${id}/operational-card`,{cache:'no-store'});
    assert.equal(r.status,404); assert.equal((await r.json()).code,'EMPLOYEE_NOT_FOUND');
  }
  await navigate('/employees/9999/operational-card'); await wait(`!!document.querySelector('#card-status.error')`);
  assert.equal(await evaluate(`document.querySelectorAll('.operational-card').length`),0);
  const r=await fetch(app+base,{cache:'no-store'});
  assert.equal(r.headers.get('cache-control'),'no-store'); assert.equal(r.headers.get('x-content-type-options'),'nosniff');
  const body=await r.json();
  assert.deepEqual(Object.keys(body).sort(),['businessTimeZone','dataSource','employee','employeeId']);
  assert.deepEqual(Object.keys(body.employee).sort(),['firstName','innerJob','job','lastName','unit']);
  console.log('PASS CARD real Node proxy: five origins/nested exact focus, 1440/390/320, null vs unknown, one GET, projection, genuine400/404/no-store/nosniff', {
    successfulBrowserCardResponses:apiResponses.filter(r=>r.url.endsWith('/operational-card')&&r.status===200).length,
  });
}
