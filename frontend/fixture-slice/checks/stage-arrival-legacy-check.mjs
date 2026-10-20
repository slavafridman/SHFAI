// Run the UNCHANGED seven-view Chrome regression driver on owned helper ports.
import { spawn } from 'node:child_process';
import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';
const profile=resolve(`.angular/f1-legacy-chrome-${crypto.randomUUID()}`);
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',[
  '--headless=new','--remote-debugging-port=9398',`--user-data-dir=${profile}`,
  '--no-first-run','--no-default-browser-check','--disable-background-networking','about:blank'],{stdio:'ignore'});
try {
  const deadline=performance.now()+15000;
  let ready=false;
  while(performance.now()<deadline) {
    try {ready=(await fetch('http://127.0.0.1:9398/json/version')).ok;}catch{}
    if(ready)break;
    await new Promise(r=>setTimeout(r,30));
  }
  if(!ready)throw Error('Owned Chrome readiness failed');
  process.env.SHF_UI_URL='http://127.0.0.1:4388';
  process.env.SHF_CDP_URL='http://127.0.0.1:9398';
  await import('./browser-check.mjs');
} finally {
  if(chrome.exitCode===null)chrome.kill();
  await new Promise(r=>chrome.exitCode!==null?r():chrome.once('exit',r));
  await rm(profile,{recursive:true,force:true,maxRetries:10,retryDelay:100});
}
