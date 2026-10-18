// Narrow independent-QA D01–D04 regressions, actual Chrome + synthetic HTTP only.
export async function runItemsReviewChecks(h) {
  const { assert, evaluate, wait, size, navigate, key, screenshot, noOverflow,
    calls, setItems, setIdentity, release } = h;
  const route = '/employees/1001/shift-days/2001/breaks-and-exceptions';
  const ready = () => wait(`!!document.querySelector('.context-card') && !document.querySelector('mat-progress-bar')`);
  const count = () => calls.filter(c => c.includes('/breaks-and-exceptions')).length;
  for (const width of [1440,390,320]) {
    setItems('normal'); setIdentity('normal');
    await size(width,width===1440?900:844); await navigate(route); await ready();
    const geometry = await evaluate(`(() => {
      const n=[...document.querySelectorAll('.duration-value')].find(n=>n.textContent==='9'.repeat(38));
      const range=document.createRange();range.selectNodeContents(n);
      const lines=new Set([...range.getClientRects()].filter(r=>r.width>0).map(r=>Math.round(r.top*100)/100)).size;
      n.scrollLeft=n.scrollWidth;
      const last=document.createRange();last.setStart(n.firstChild,37);last.setEnd(n.firstChild,38);
      const r=last.getBoundingClientRect(),box=n.getBoundingClientRect(),cell=n.closest('td').getBoundingClientRect(),region=n.closest('.table-wrap').getBoundingClientRect();
      return {literal:n.textContent,lines,whiteSpace:getComputedStyle(n).whiteSpace,
        overflow:getComputedStyle(n).overflowX,client:n.clientWidth,scroll:n.scrollWidth,
        finalDigitVisible:r.left>=box.left-1&&r.right<=box.right+1,
        contained:box.left>=cell.left-1&&box.right<=cell.right+1&&cell.left>=region.left-1&&cell.right<=region.right+1,
        tabbable:n.tabIndex===0&&!!n.getAttribute('aria-label'),
        fields:[...document.querySelectorAll('tbody tr')].map(r=>r.cells.length),
        rawWrap:getComputedStyle(document.querySelector('tbody pre')).whiteSpace,
        actions:['items-back','items-reload'].map(id=>({id,height:document.getElementById(id).getBoundingClientRect().height}))};
    })()`);
    assert.equal(geometry.literal,'9'.repeat(38)); assert.equal(geometry.lines,1);
    assert.equal(geometry.whiteSpace,'nowrap'); assert.equal(geometry.overflow,'auto');
    assert(geometry.finalDigitVisible && geometry.tabbable && geometry.contained);
    assert(geometry.fields.every(n=>n===8)); assert.equal(geometry.rawWrap,'pre-wrap');
    assert(geometry.actions.every(n=>n.height>=48)); await noOverflow();
    await evaluate(`document.querySelectorAll('.toolbar button').forEach(n=>n.style.fontSize='30px')`);
    const large = await evaluate(`['items-back','items-reload'].map(id=>({id,height:document.getElementById(id).getBoundingClientRect().height}))`);
    assert(large.every(n=>n.height>=48)); await noOverflow();
    await evaluate(`[...document.querySelectorAll('.duration-value')].find(n=>n.textContent==='9'.repeat(38)).scrollIntoView({block:'center'})`);
    await screenshot('items18-review-duration-'+width);
    console.log('PASS D01/D02', {width,...geometry,font30:large});
  }
  setItems('self-parent'); await navigate(route);
  await wait(`!!document.querySelector('shf-shift-items .error')`);
  assert.equal(await evaluate(`document.querySelectorAll('.context-card,tbody tr').length`),0);
  for (const source of ['isolated-fixture','oracle']) {
    setIdentity(source==='oracle'?'oracle-items':'normal');
    setItems(source==='oracle'?'oracle-valid':'normal'); await navigate(route); await ready();
    assert.equal(await evaluate(`document.querySelectorAll('tbody tr').length`),3);
  }
  console.log('PASS D03 self-parent25 rejected atomically; valid J01/G01 and both approved sources accepted (all synthetic)');
  setIdentity('normal'); setItems('normal');
  for (const width of [1440,320]) for (const status of [200,503]) {
    await size(width,width===1440?900:844); await navigate(route); await ready();
    await evaluate(`(()=>{const n=document.getElementById('items-back');n.scrollIntoView({block:'center'});n.focus({preventScroll:true})})()`);
    await key('Tab');
    await wait(`document.activeElement.id==='items-reload'`);
    await key('Tab','Tab',8); await wait(`document.activeElement.id==='items-back'`);
    await key('Tab'); await wait(`document.activeElement.id==='items-reload'`);
    const focus = await evaluate(`(() => {
      const n=document.activeElement,s=getComputedStyle(n),r=n.getBoundingClientRect(),header=document.querySelector('.topbar').getBoundingClientRect();
      const luminance=c=>{const [r,g,b]=c.match(/[\\d.]+/g).slice(0,3).map(Number).map(v=>{const x=v/255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4});return .2126*r+.7152*g+.0722*b};
      const background=getComputedStyle(document.documentElement).backgroundColor;
      const a=luminance(s.outlineColor),b=luminance(background);
      return {visible:n.matches(':focus-visible'),style:s.outlineStyle,outlineWidth:s.outlineWidth,offset:s.outlineOffset,
        color:s.outlineColor,background,contrast:(Math.max(a,b)+.05)/(Math.min(a,b)+.05),
        top:r.top,bottom:r.bottom,headerBottom:header.bottom,viewport:innerHeight,opacity:s.opacity};
    })()`);
    assert(focus.visible); assert.equal(focus.style,'solid');
    assert(parseFloat(focus.outlineWidth)>=3); assert(focus.contrast>=3);
    assert(focus.top-6>=focus.headerBottom && focus.bottom+6<=focus.viewport,'Unobscured focus ring');
    await screenshot(`items18-review-focus-${width}-${status}`);
    await evaluate(`window.__reviewReload=document.getElementById('items-reload')`);
    const before=count();setItems('hold');
    await key(' ','Space'); await wait(`document.getElementById('items-reload').getAttribute('aria-busy')==='true'`);
    await key(' ','Space');await key(' ','Space');
    assert.equal(count(),before+1);
    assert(await evaluate(`document.activeElement===__reviewReload && document.getElementById('items-reload')===__reviewReload && !__reviewReload.disabled`));
    setItems('normal');await release(status);
    await wait(`document.getElementById('items-reload').getAttribute('aria-busy')==='false'`);
    assert(await evaluate(`document.activeElement===__reviewReload && document.getElementById('items-reload')===__reviewReload`));
    assert.equal(count(),before+1);
    console.log('PASS D04 + reload lifecycle', {width,status,...focus,requests:1,sameDOM:true});
  }
}
