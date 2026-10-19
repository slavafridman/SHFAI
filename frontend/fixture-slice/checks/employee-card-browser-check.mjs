// Actual Chrome + Angular, exclusively intercepted synthetic network data.
export async function runEmployeeCardChecks(h) {
  const {assert,send,evaluate,wait,size,navigate,key,click,input,screenshot,noOverflow,calls,
    readyList,readyDetail,setCard,setIdentity,setList,release} = h;
  const path = '/employees/1001/operational-card';
  const ready = () => wait(`!!document.querySelector('shf-employee-card .operational-card') && !document.querySelector('mat-progress-bar')`);
  const error = () => wait(`!!document.querySelector('shf-employee-card #card-status.error')`);
  const count = () => calls.filter(c=>c.includes('/operational-card')).length;
  await size(1440,900); await navigate('/current-shifts'); await readyList();
  assert.equal(await evaluate(`document.querySelector('#card-current-2001').getAttribute('href')`),path);
  await click('#card-current-2001'); await ready();
  const info = await evaluate(`(() => {const p=document.querySelector('shf-employee-card'); return {
    text:p.textContent, html:p.innerHTML, fields:p.querySelectorAll('.fields>div').length,
    inputs:p.querySelectorAll('input,select,textarea,img,iframe,[role=tab]').length,
    fold:p.querySelector('.fields').getBoundingClientRect().bottom,
    name:p.querySelector('h2 bdi').getAttribute('dir'),
    targets:['#card-back','#card-reload'].map(s=>{const r=p.querySelector(s).getBoundingClientRect();return [r.width,r.height]})
  };})()`);
  assert.equal(info.fields,6); assert.equal(info.inputs,0); assert(info.fold<=900); assert.equal(info.name,'auto');
  assert(!info.html.includes('PRIVATE_CARD_SENTINEL'));
  assert(info.text.includes('לא בוצע אימות סיסמה אמיתית')); assert(info.text.includes('לא זהות היישום'));
  assert(info.targets.every(([w,h])=>w>=48 && h>=48)); await noOverflow(); await screenshot('card19-1440');
  await click('#card-back'); await wait(`document.activeElement.id==='card-current-2001'`);
  await evaluate('history.forward()'); await ready();
  await click('#card-back'); await wait(`document.activeElement.id==='card-current-2001'`);
  // Search own-ID anchor, nested schedule -> detail -> items -> card -> exact reverse chain.
  await navigate('/shift-search');
  await wait(`!!document.getElementById('search-timeFrom') && !document.getElementById('search-timeFrom').disabled && !document.querySelector('mat-progress-bar')`);
  await input('search-timeFrom','09:00'); await input('search-timeTo','11:00'); await click('#search-submit');
  await wait(`!!document.getElementById('card-search-3001')`); await click('#card-search-3001'); await ready();
  await click('#card-back'); await wait(`document.activeElement.id==='card-search-3001'`);
  await click('#search-schedule-3001'); await wait(`!!document.getElementById('card-schedule-header')`);
  await click('#card-schedule-header'); await ready(); await click('#card-back');
  await wait(`document.activeElement.id==='card-schedule-header'`);
  await click('#schedule-detail-4001'); await readyDetail();
  await click('#card-detail'); await ready(); await click('#card-back');
  await wait(`document.activeElement.id==='card-detail'`);
  await click('#detail-items'); await wait(`!!document.getElementById('card-items')`);
  await evaluate(`document.getElementById('items-technical').open=true`);
  await click('#card-items'); await ready(); await click('#card-back');
  await wait(`document.activeElement.id==='card-items'`);
  assert.equal(await evaluate(`document.getElementById('items-technical').open`),true);
  await click('#items-back'); await wait(`document.activeElement.id==='detail-items'`);
  await click('#back-action'); await wait(`document.activeElement.id==='schedule-detail-4001'`);
  await click('#schedule-back'); await wait(`document.activeElement.id==='search-schedule-3001'`);
  assert.equal(await evaluate(`document.getElementById('search-timeFrom').value`),'09:00');
  console.log('PASS CARD five origins, own employee IDs, nested reverse chain, Back/Forward and exact opener/disclosure');
  // Separate current page/minute and physical RTL/vertical scroll memories.
  setList('pages'); await navigate('/current-shifts'); await readyList();
  await input('filter-time','09:31'); await click('#list-search'); await readyList();
  await click('#next-page'); await wait(`!!document.getElementById('card-current-2026')`);
  await evaluate(`(() => {const a=document.getElementById('card-current-2026');a.scrollIntoView({block:'center'});
    document.querySelector('.table-wrap').scrollLeft=-120; a.focus({preventScroll:true});
    window.__cardScroll=scrollY;window.__cardRTL=document.querySelector('.table-wrap').scrollLeft;a.click();})()`);
  await ready(); await click('#card-back'); await wait(`document.activeElement.id==='card-current-2026'`);
  assert.equal(await evaluate(`document.getElementById('filter-time').value`),'09:31');
  assert.equal(await evaluate(`document.querySelectorAll('tbody tr').length`),25);
  assert(await evaluate(`Math.abs(scrollY-__cardScroll)<=1 && document.querySelector('.table-wrap').scrollLeft===__cardRTL`));
  setList('normal');
  // Empty menu entry is an honest chooser, not synthetic self or arbitrary ID.
  await navigate('/employee-card'); await wait(`!!document.querySelector('.chooser') && !document.querySelector('mat-progress-bar')`);
  const before = count(); await new Promise(r=>setTimeout(r,200)); assert.equal(count(),before);
  assert.equal(await evaluate(`document.querySelectorAll('shf-employee-card input').length`),0);
  setCard('unknown'); await navigate(path); await ready();
  assert(await evaluate(`document.querySelector('.fields').textContent.includes('תיאור לא זמין') && document.querySelector('.fields').textContent.includes('-9') && document.querySelector('.fields').textContent.includes('לא צוין')`));
  await screenshot('card19-null-unknown');
  for (const mode of ['self-parent','wrong-id','scope','source','malformed',400,401,403,404,500,503]) {
    setCard(mode); await navigate(path); await error();
    assert.equal(await evaluate(`document.querySelectorAll('.operational-card,.fields').length`),0);
  }
  setCard('oracle'); setIdentity('oracle-items'); await navigate(path); await ready();
  assert(await evaluate(`document.querySelector('.resource-source').textContent.includes('Oracle')`));
  setCard('normal'); setIdentity('no-card'); const deniedBefore = count(); await navigate(path); await error();
  assert.equal(count(),deniedBefore);
  await navigate('/current-shifts'); await readyList();
  assert.equal(await evaluate(`document.querySelectorAll('a.employee-card-link').length`),0);
  assert(await evaluate(`document.querySelector('tbody').textContent.includes('אין הרשאה זמינה')`));
  setIdentity('normal'); await navigate(path); await ready();
  // Identity failure clears existing card and every prior name/context.
  setIdentity('failure'); await click('#identity-retry'); await error();
  assert.equal(await evaluate(`document.querySelectorAll('.operational-card').length`),0);
  setIdentity('normal'); await click('#identity-retry'); await ready();
  // Stable native button, keyboard Space, one GET while pending, no focus loss on terminal error.
  await evaluate(`document.getElementById('card-reload').focus(); window.__cardButton=document.activeElement`);
  setCard('hold'); const n = count(); await key(' '); await wait(`document.getElementById('card-reload').getAttribute('aria-disabled')==='true'`);
  await key(' '); await key(' '); assert.equal(count(),n+1);
  assert(await evaluate(`document.activeElement===__cardButton && document.getElementById('card-reload')===__cardButton && !__cardButton.disabled`));
  setCard('normal'); await release(); await ready();
  assert(await evaluate(`document.activeElement===__cardButton`));
  setCard(503); await key(' '); await error(); assert(await evaluate(`document.activeElement===__cardButton`));
  // A is held while B is navigated without document reload; late A cannot replace B.
  setCard('hold'); await navigate(path); await wait(`!!document.querySelector('shf-employee-card mat-progress-bar')`);
  setCard('normal');
  // In-page History API + popstate invokes Angular's route listener (not a page navigation).
  await evaluate(`history.pushState({},'', '/employees/1002/operational-card'); dispatchEvent(new PopStateEvent('popstate',{state:history.state}))`);
  await ready(); await release();
  await evaluate(`document.getElementById('card-technical').open=true`);
  assert(await evaluate(`document.getElementById('card-technical').textContent.includes('1002') && !document.getElementById('card-technical').textContent.includes('1001')`));
  console.log('PASS CARD error matrix, null/unknown, projection, source pairs, independent capability, revoke, late A/B, native reload focus and duplicate Space');
  // Long synthetic names/IDs and responsive/large text; no horizontal page overflow.
  setCard('long');
  for (const width of [1440,390,320]) {
    await size(width,900); await navigate('/employees/'+'9'.repeat(38)+'/operational-card'); await ready();
    await evaluate(`document.getElementById('card-technical').open=true`);
    await noOverflow(); await screenshot('card19-long-'+width);
    await evaluate(`(() => {const s=document.createElement('style');s.textContent='main{font-size:30px!important} main *{overflow-wrap:anywhere}';document.head.append(s)})()`);
    await noOverflow();
    assert(await evaluate(`['#card-back','#card-reload'].every(s=>{const r=document.querySelector(s).getBoundingClientRect();return r.width>=48&&r.height>=48})`));
    await screenshot('card19-large-'+width);
  }
  // Limited computed contrast, not a WCAG conformance scan.
  const ratio = await evaluate(`(() => {
    const rgb=s=>s.match(/[\\d.]+/g).slice(0,3).map(Number).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4});
    const lum=s=>{const [r,g,b]=rgb(s);return .2126*r+.7152*g+.0722*b};
    const f=lum(getComputedStyle(document.querySelector('.fields dt')).color), b=lum('rgb(255,255,255)');
    return (Math.max(f,b)+.05)/(Math.min(f,b)+.05);
  })()`);
  assert(ratio>=4.5); console.log('PASS CARD 1440/390/320, 30px wrap, >=48px controls, sampled dt contrast',ratio.toFixed(2));
  await size(1440,900); setCard('normal');
}
