// Synthetic-browser verification only. Inspect actual screenshot pixels as well
// as outline style, effective ancestor opacity, exact focus and hit geometry.
import assert from 'node:assert/strict';
import { inflateSync } from 'node:zlib';
function pngPixels(buffer) {
  let width, height, channels; const data = [];
  for (let at = 8; at < buffer.length;) {
    const length = buffer.readUInt32BE(at), kind = buffer.toString('ascii', at + 4, at + 8);
    const bytes = buffer.subarray(at + 8, at + 8 + length); at += length + 12;
    if (kind === 'IHDR') {
      width = bytes.readUInt32BE(0); height = bytes.readUInt32BE(4);
      assert.equal(bytes[8], 8); assert.equal(bytes[12], 0);
      channels = bytes[9] === 2 ? 3 : bytes[9] === 6 ? 4 : 0; assert(channels);
    } else if (kind === 'IDAT') data.push(bytes);
  }
  const raw = inflateSync(Buffer.concat(data)), stride = width * channels, pixels = Buffer.alloc(stride * height);
  const paeth = (a, b, c) => {
    const p = a + b - c, x = Math.abs(p - a), y = Math.abs(p - b), z = Math.abs(p - c);
    return x <= y && x <= z ? a : y <= z ? b : c;
  };
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? pixels[y * stride + x - channels] : 0;
      const b = y ? pixels[(y - 1) * stride + x] : 0;
      const c = y && x >= channels ? pixels[(y - 1) * stride + x - channels] : 0;
      const predictor = [0, a, b, Math.floor((a + b) / 2), paeth(a, b, c)][filter];
      assert.notEqual(predictor, undefined);
      pixels[y * stride + x] = (raw[y * (stride + 1) + 1 + x] + predictor) & 255;
    }
  }
  return { width, height, pixel(x, y) {
    assert(x >= 0 && y >= 0 && x < width && y < height);
    const at = y * stride + x * channels; return [...pixels.subarray(at, at + 3)];
  } };
}
const luminance = rgb => rgb.map(v => {
  const x = v / 255; return x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4;
}).reduce((sum, x, i) => sum + x * [.2126, .7152, .0722][i], 0);
export async function proveArrivalFocus({ send, evaluate }, selector, label) {
  // Observation barrier only; no scrolling, focus changes or arbitrary sleeps.
  await evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(r))))');
  const m = await evaluate(`(() => {
    const n=document.querySelector(${JSON.stringify(selector)}), s=getComputedStyle(n), r=n.getBoundingClientRect();
    let opacity=1;for(let p=n;p;p=p.parentElement)opacity*=Number(getComputedStyle(p).opacity);
    const header=Math.max(0,...[...document.querySelectorAll('shf-stage-arrival .topbar,shf-stage-arrival .mockbar,shf-station-arrival .topbar,shf-station-arrival .mockbar,shf-station-exit .topbar,shf-station-exit .mockbar')]
      .filter(p=>['sticky','fixed'].includes(getComputedStyle(p).position)).map(p=>p.getBoundingClientRect().bottom));
    const modal=!!n.closest('mat-dialog-container'), top=modal?0:header;
    const hit=document.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2);
    return {active:document.activeElement===n,keyboard:n.matches(':focus-visible')||n.classList.contains('cdk-keyboard-focused'),
      style:s.outlineStyle,width:parseFloat(s.outlineWidth),offset:parseFloat(s.outlineOffset),color:s.outlineColor,opacity,
      left:r.left,right:r.right,top:r.top,bottom:r.bottom,viewport:innerHeight,viewportWidth:innerWidth,
      occlusion:top,visibleHeight:Math.max(0,Math.min(innerHeight,r.bottom)-Math.max(top,r.top)),hit:!!hit&&n.contains(hit)};
  })()`);
  assert(m.active && m.keyboard, label + ': exact keyboard focus');
  assert.equal(m.style, 'solid', label + ': visible solid outline, not nominal width alone');
  assert.equal(m.width, 3); assert.equal(m.offset, 3); assert.equal(m.opacity, 1);
  assert(m.hit && m.top - 6 >= m.occlusion && m.bottom + 6 <= m.viewport &&
    m.left - 6 >= 0 && m.right + 6 <= m.viewportWidth, label + ': full ring/opener visible and hit-testable ' + JSON.stringify(m));
  const { data } = await send('Page.captureScreenshot', { captureBeyondViewport: false });
  const image = pngPixels(Buffer.from(data, 'base64')), scale = image.width / m.viewportWidth;
  const x = Math.round((m.left + m.right) / 2 * scale);
  const ring = image.pixel(x, Math.round((m.top - m.offset - m.width / 2) * scale));
  const adjacent = image.pixel(x, Math.round((m.top - m.offset - m.width - 2) * scale));
  const l = [luminance(ring), luminance(adjacent)].sort((a, b) => b - a);
  const contrast = (l[0] + .05) / (l[1] + .05);
  assert(contrast >= 3, label + ': actual screenshot ring contrast ' + contrast + ' ' + JSON.stringify({ ring, adjacent }));
  console.log('PASS rendered focus', { label, contrast: +contrast.toFixed(4), ring, adjacent,
    top: +m.top.toFixed(2), bottom: +m.bottom.toFixed(2), visibleHeight: +m.visibleHeight.toFixed(2), hit: m.hit,
    outline: `${m.width}px ${m.style}`, opacity: m.opacity });
  return m;
}
