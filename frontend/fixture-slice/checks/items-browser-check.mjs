// Invoked by the existing intercepted Chrome checker; all data is synthetic.
export async function runItemsChecks(h) {
  const { assert, send, evaluate, wait, size, navigate, key, click, input, screenshot,
    noOverflow, calls, readyList, readyDetail, setItems, setIdentity, setList, setSearch, setSchedule, release } = h;
  const route = '/employees/1001/shift-days/2001/breaks-and-exceptions';
  const ready = () => wait(`!!document.querySelector('shf-shift-items .context-card') && !document.querySelector('mat-progress-bar')`);
  const path = () => evaluate('location.pathname');
  const error = () => wait(`!!document.querySelector('shf-shift-items .error')`);
  const count = () => calls.filter(c => c.includes('/breaks-and-exceptions')).length;
  const back = async expected => { await send('Runtime.evaluate', { expression: 'history.back()' }); await wait(`location.pathname === ${JSON.stringify(expected)}`); };
  const forward = async expected => { await evaluate('history.forward()'); await wait(`location.pathname === ${JSON.stringify(expected)}`); };
  await size(1440,900);
  await navigate('/current-shifts'); await readyList();
  assert.equal(await evaluate(`document.querySelectorAll('#items-2001').length`),1);
  await click('#items-2001'); await ready(); assert.equal(await path(), route);
  assert.equal(await evaluate(`document.querySelector('.sidebar .active').textContent.trim()`), 'משמרות נוכחיות');
  await noOverflow();
  const info = await evaluate(`(() => {
    const p=document.querySelector('shf-shift-items');
    return {cells:p.querySelector('tbody tr').cells.length, rows:p.querySelectorAll('tbody tr').length,
      text:p.textContent, inputs:p.querySelectorAll('input,select,textarea').length,
      image:p.querySelector('tbody img'), tokens:[...p.querySelectorAll('.token')].every(n=>getComputedStyle(n).whiteSpace==='nowrap')};
  })()`);
  assert.equal(info.cells,8); assert.equal(info.rows,3); assert.equal(info.inputs,0); assert.equal(info.image,null); assert(info.tokens);
  for (const s of ['-5','99999999999999999999999999999999999999','שם סוג לא ידוע','-9','DEL','23:01:02','אין ערך רשום','לא חל','<img src=x']) assert(info.text.includes(s),s);
  await screenshot('items18-1440');
  // Four actual origins and both history directions, without a duplicate return.
  await click('#items-back'); await readyList();
  assert.equal(await path(), '/current-shifts');
  await wait(`document.activeElement.id === 'items-2001'`);
  await forward(route); await ready();
  await back('/current-shifts'); await readyList();
  await navigate('/shift-search');
  await wait(`!!document.getElementById('search-timeFrom') && !document.getElementById('search-timeFrom').disabled && !document.querySelector('mat-progress-bar')`);
  await input('search-timeFrom','09:00'); await input('search-timeTo','11:00');
  await click('#search-submit'); await wait(`!!document.getElementById('search-items-3001')`);
  await click('#search-items-3001'); await ready();
  assert.equal(await path(), '/employees/1001/shift-days/3001/breaks-and-exceptions');
  assert.equal(await evaluate(`document.querySelector('.sidebar .active').textContent.trim()`), 'חיפוש משמרות');
  await click('#items-back'); await wait(`document.activeElement.id === 'search-items-3001'`);
  assert.equal(await evaluate(`document.getElementById('search-timeFrom').value`),'09:00');
  // Nested search -> schedule -> detail -> items -> detail (return) -> schedule -> search.
  await click('#search-schedule-3001'); await wait(`!!document.getElementById('schedule-items-4001')`);
  await click('#schedule-items-4001'); await ready();
  assert.equal(await path(), '/employees/1001/shift-days/4001/breaks-and-exceptions');
  await click('#items-back'); await wait(`document.activeElement.id === 'schedule-items-4001'`);
  await click('#schedule-detail-4001'); await readyDetail();
  await click('#detail-items'); await ready();
  const itemsPath = await path();
  await click('#items-detail'); await wait(`location.pathname === '/employees/1001/shift-days/4001'`);
  await wait(`document.activeElement.id === 'detail-items'`);
  await forward(itemsPath); await ready();
  await click('#items-back'); await wait(`document.activeElement.id === 'detail-items'`);
  await click('#back-action'); await wait(`location.pathname === '/my-shifts/selected/1001' && !!document.getElementById('schedule-items-4001')`);
  await click('#schedule-back'); await wait(`location.pathname === '/shift-search' && !!document.getElementById('search-schedule-3001')`);
  assert.equal(await evaluate(`document.getElementById('search-timeFrom').value`),'09:00');
  assert.equal(await evaluate(`document.querySelector('.sidebar .active').textContent.trim()`),'חיפוש משמרות');
  // Optional excursion from a list's items into existing detail; disclosure state returns.
  await click('#search-items-3001'); await ready();
  await evaluate(`document.getElementById('items-technical').open=true`);
  await click('#items-detail'); await readyDetail();
  await click('#back-action'); await ready();
  assert.equal(await evaluate(`document.getElementById('items-technical').open`),true);
  await click('#items-back'); await wait(`location.pathname === '/shift-search'`);
  console.log('PASS ITEMS four origins, own day IDs, nested upstream memories, Back/Forward and non-cyclic detail excursion');
  // Independent current page25/minute/RTL scroll snapshot survives a full nested journey.
  await size(1440,900); setList('pages');
  await navigate('/current-shifts'); await readyList();
  await input('filter-time','09:31'); await click('#list-search'); await readyList();
  await click('#next-page'); await wait(`!!document.getElementById('items-2026')`);
  await evaluate(`(() => {const a=document.getElementById('items-2026'); a.scrollIntoView({block:'center'});
    document.querySelector('.table-wrap').scrollLeft=-150; a.focus({preventScroll:true});
    window.__originScroll=scrollY;window.__originRTL=document.querySelector('.table-wrap').scrollLeft; a.click();})()`);
  await ready();
  assert.equal(await path(), '/employees/1001/shift-days/2026/breaks-and-exceptions');
  assert(await evaluate(`document.querySelector('.topbar').getBoundingClientRect().top===0 && scrollY===0`));
  await click('#items-back'); await wait(`document.activeElement.id==='items-2026'`);
  assert.equal(await evaluate(`document.getElementById('filter-time').value`),'09:31');
  assert(await evaluate(`Math.abs(scrollY-__originScroll)<=1 && document.querySelector('.table-wrap').scrollLeft===__originRTL`));
  await click('#schedule-2026'); await wait(`!!document.getElementById('schedule-detail-4001')`);
  await click('#schedule-detail-4001'); await readyDetail();
  await click('#detail-items'); await ready();
  await click('#items-back'); await wait(`document.activeElement.id==='detail-items'`);
  await click('#back-action'); await wait(`document.activeElement.id==='schedule-detail-4001'`);
  await click('#schedule-back'); await wait(`document.activeElement.id==='schedule-2026'`);
  assert.equal(await evaluate(`document.getElementById('filter-time').value`),'09:31');
  assert.equal(await evaluate(`document.querySelectorAll('tbody tr').length`),25);
  // A dirty draft is separate from its old applied request, not silently re-fetched.
  await input('filter-time','09:32');
  assert.equal(await evaluate(`document.querySelectorAll('tbody tr').length`),0);
  const oldCurrentCalls=calls.filter(c=>c.startsWith('/api/v1/current-shifts?')).length;
  await evaluate(`document.querySelector('.sidebar a[href="/my-shifts"]').click()`);
  await wait(`location.pathname==='/my-shifts' && !!document.getElementById('schedule-error') || location.pathname==='/my-shifts' && document.querySelector('main')?.textContent.includes('יש לבחור')`);
  await back('/current-shifts');
  await wait(`document.getElementById('filter-time')?.value==='09:32' && !document.querySelector('mat-progress-bar')`);
  assert.equal(await evaluate(`document.querySelectorAll('tbody tr').length`),0);
  assert.equal(calls.filter(c=>c.startsWith('/api/v1/current-shifts?')).length,oldCurrentCalls);
  setList('normal');
  // Search's second-page filters remain independent of schedule's own page/range.
  setSearch('pages'); await navigate('/shift-search');
  await wait(`!!document.getElementById('search-timeFrom') && !document.getElementById('search-timeFrom').disabled`);
  await input('search-timeFrom','09:00'); await input('search-timeTo','11:00'); await click('#search-submit');
  await wait(`!!document.getElementById('search-items-3001')`);
  await click('#search-next'); await wait(`!!document.getElementById('search-items-3026')`);
  await click('#search-schedule-3026'); await wait(`!!document.getElementById('schedule-items-4001')`);
  await click('#schedule-items-4001'); await ready(); await click('#items-back');
  await wait(`document.activeElement.id==='schedule-items-4001'`);
  await click('#schedule-back'); await wait(`document.activeElement.id==='search-schedule-3026'`);
  assert.equal(await evaluate(`document.getElementById('search-timeTo').value`),'11:00');
  await click('#search-items-3026'); await ready();
  await click('#items-back'); await wait(`document.activeElement.id==='search-items-3026'`);
  setSearch('normal');
  console.log('PASS ITEMS independent current/search page25 + exact minute/range + vertical/RTL scroll + DOM opener + dirty draft without stale auto-search');
  // Page and manual reload semantics.
  setItems('pages'); await navigate(route); await ready();
  assert.equal(await evaluate(`document.querySelectorAll('tbody tr').length`),25);
  await click('#items-next'); await ready();
  assert.equal(await evaluate(`document.querySelectorAll('tbody tr').length`),5);
  assert(calls.at(-1).includes('offset=25'));
  await click('#items-previous'); await ready(); assert(calls.at(-1).includes('offset=0'));
  await click('#items-reload'); await ready(); assert(calls.at(-1).includes('offset=0'));
  setItems('empty'); await click('#items-reload'); await ready();
  assert(await evaluate(`document.querySelector('main').textContent.includes('לא נמצאו רשומות חלקיות מקושרות')`));
  setItems('normal'); await click('#items-reload'); await ready();
  // Same reload DOM node and focus through pending + terminal, repeat Space -> one GET.
  const before = count(); setItems('hold');
  await evaluate(`window.__itemsReload=document.getElementById('items-reload'); __itemsReload.focus()`);
  await key(' ','Space'); await wait(`document.getElementById('items-reload').getAttribute('aria-busy') === 'true'`);
  await key(' ','Space'); await key(' ','Space');
  assert.equal(count(),before+1);
  assert(await evaluate(`document.activeElement===__itemsReload && document.getElementById('items-reload')===__itemsReload && !__itemsReload.disabled`));
  setItems('normal'); await release(); await ready();
  assert(await evaluate(`document.activeElement===__itemsReload`));
  // Cancelled A and late response cannot overwrite B after leaving and selecting another own row.
  setItems('hold'); await click('#items-reload');
  await back('/shift-search'); // cold direct entry has no in-memory parent: browser back still honest
  setItems('normal'); await release().catch(() => {});
  await wait(`!!document.querySelector('a[id^="search-items-"]')`);
  const sourceItem = await evaluate(`document.querySelector('a[id^="search-items-"]').id`);
  await click('#' + sourceItem); await ready();
  assert.equal(await path(), `/employees/1001/shift-days/${sourceItem.slice('search-items-'.length)}/breaks-and-exceptions`);
  // Every specified error and malformed/source/identity boundary fails closed.
  for (const mode of [400,401,403,404,500,503,'ambiguity','malformed','source','mismatch']) {
    setItems(mode); await navigate(route); await error();
    assert.equal(await evaluate(`document.querySelectorAll('.context-card,tbody').length`),0);
    assert(await evaluate(`!!document.getElementById('items-back')`));
  }
  setItems('normal');
  for (const mode of ['failure','malformed','no-items','no-detail-items']) {
    setIdentity(mode); const before=count(); await navigate(route); await error(); assert.equal(count(),before);
    if (mode==='no-items') assert.equal(await evaluate(`document.querySelectorAll('.sidebar a').length`),3);
  }
  setIdentity('normal');
  await navigate('/employees/01/shift-days/2001/breaks-and-exceptions'); await error();
  for (const q of ['kind=break','limit=01','limit=25&%6cimit=25']) {
    const before=count(); await navigate(route+'?'+q); await error(); assert.equal(count(),before);
  }
  // Readable cards, all columns, tokens, drawer trap/Escape, enlarged text/link wrap.
  await navigate(route); await ready();
  for (const width of [1440,390,320]) {
    await size(width,width===1440?900:844); await noOverflow();
    assert.equal(await evaluate(`document.querySelector('tbody tr').querySelectorAll('td').length`),8);
    await evaluate(`document.querySelectorAll('tbody details').forEach(d=>d.open=true)`);
    await noOverflow(); await screenshot(`items18-${width}-disclosures`);
    await evaluate(`document.querySelector('.table-wrap').scrollIntoView({block:'start'})`);
    await screenshot(`items18-${width}-rows`);
    if (width<760) {
      await click('#menu-open'); await wait(`document.getElementById('menu').open`);
      await evaluate(`document.getElementById('menu-close').focus()`); await key('Tab','Tab',8);
      assert(await evaluate(`document.getElementById('menu').contains(document.activeElement)`));
      await key('Escape'); await wait(`!document.getElementById('menu').open`);
      assert.equal(await evaluate(`document.activeElement.id`),'menu-open');
    }
  }
  await evaluate(`document.querySelectorAll('main a,main button,main h1').forEach(n=>n.style.fontSize='30px')`);
  await noOverflow(); await screenshot('items18-320-font30');
  // Upstream long item links also wrap without page overflow.
  await navigate('/current-shifts'); await readyList(); await size(320,844);
  await evaluate(`document.querySelectorAll('a.row-link').forEach(n=>n.style.fontSize='30px')`); await noOverflow();
  assert(await evaluate(`getComputedStyle(document.getElementById('items-2001')).whiteSpace==='normal'`));
  await navigate('/shift-search');
  await wait(`!!document.getElementById('search-timeFrom') && !document.getElementById('search-timeFrom').disabled`);
  await click('#search-submit'); await wait(`!!document.getElementById('search-items-3001')`);
  await evaluate(`document.querySelectorAll('a.row-link').forEach(n=>n.style.fontSize='30px')`); await noOverflow();
  await click('#search-schedule-3001'); await wait(`!!document.getElementById('schedule-items-4001')`);
  await evaluate(`document.querySelectorAll('a.row-link').forEach(n=>n.style.fontSize='30px')`); await noOverflow();
  assert(await evaluate(`Object.keys(history.state).every(k=>['navigationId','shfView'].includes(k))`));
  setItems('normal'); setList('normal'); setSearch('normal'); setSchedule('normal');
  console.log('PASS ITEMS raw/null/negative/classification/source, 25+5/empty/reload0, stale abort, 400/401/403/404/500/503/ambiguity/malformed, both rights, keyboard reload/drawer, RTL 1440/390/320 +30px navigation. Synthetic interception only; not full WCAG.');
}
