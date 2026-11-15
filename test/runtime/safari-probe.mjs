import {mkdir, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

// Never enables Remote Automation or changes Safari/system security settings.
const driver = process.env.P6_WEBDRIVER_URL ?? 'http://127.0.0.1:6113';
const site = process.env.P6_BASE_URL ?? 'http://127.0.0.1:6112';
for (const url of [driver, site]) {
  if (!['127.0.0.1', 'localhost'].includes(new URL(url).hostname)) throw new Error('P6 Safari probe only accepts local test endpoints.');
}
const report = {startedAt: new Date().toISOString(), status: 'not-run', capabilities: null, cases: [], limitation: 'Safari desktop only; not an iOS simulator or real screen-reader speech test.'};
let id;
await mkdir(resolve('test-results/p6'), {recursive: true});
const request = async (path, body, method = 'POST') => {
  const response = await fetch(driver + path, {method, ...(body === undefined ? {} : {headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)})});
  const result = await response.json();
  if (!response.ok || result.value?.error) throw new Error(result.value?.message ?? `WebDriver HTTP ${response.status}`);
  return result.value;
};
try {
  const session = await request('/session', {capabilities: {alwaysMatch: {browserName: 'safari'}}});
  id = session.sessionId;
  report.capabilities = session.capabilities;
  await request(`/session/${id}/timeouts`, {script: 30000});
  await request(`/session/${id}/window/rect`, {width: 1280, height: 800});
  for (const [name, story] of [['columns', 'components-table--columns-and-responsive-types'], ['lifecycle', 'integration-features-advanced-lifecycle--states-views-and-columns'], ['selection', 'integration-features-selection-workflow--cross-page-and-bulk']]) {
    for (const dir of ['ltr', 'rtl']) {
      await request(`/session/${id}/url`, {url: `${site}/iframe.html?id=${story}&viewMode=story&globals=direction:${dir}`});
      const result = await request(`/session/${id}/execute/async`, {script: `const done=arguments[arguments.length-1];const start=Date.now();function poll(){const table=document.querySelector('s-table');if(table&&customElements.get('s-table')&&document.querySelector('main')){done({rows:document.querySelectorAll('s-table-row').length,direction:getComputedStyle(table).direction,viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth});return;}if(Date.now()-start>25000){done({error:'Runtime not ready'});return;}setTimeout(poll,100);}poll();`, args: []});
      if (result.error || result.rows < 1 || result.direction !== dir || result.scrollWidth > result.viewport + 1) throw new Error(`${name}/${dir}: ${JSON.stringify(result)}`);
      const images = await request(`/session/${id}/execute/async`, {script: `const done=arguments[arguments.length-1];const images=[];function walk(root){for(const e of root.querySelectorAll('*')){if(e.tagName==='IMG')images.push(e);if(e.shadowRoot)walk(e.shadowRoot);}}walk(document);Promise.all([document.fonts.ready,...images.map(i=>i.complete?Promise.resolve():new Promise(r=>{i.addEventListener('load',r,{once:true});i.addEventListener('error',r,{once:true});}))]).then(()=>done(images.map(i=>({complete:i.complete,naturalWidth:i.naturalWidth,src:i.currentSrc}))));`, args: []});
      const screenshot = `safari-${name}-${dir}.png`;
      const image = await request(`/session/${id}/screenshot`, undefined, 'GET');
      await writeFile(resolve('test-results/p6', screenshot), Buffer.from(image, 'base64'));
      report.cases.push({name, dir, ...result, images, screenshot});
    }
  }
  await request(`/session/${id}/url`, {url: `${site}/iframe.html?id=integration-features-advanced-lifecycle--states-views-and-columns&viewMode=story`});
  await request(`/session/${id}/execute/async`, {script: `const done=arguments[arguments.length-1];function ready(){const h=[...document.querySelectorAll('s-button')].find(x=>x.textContent.trim()==='Columns');if(h?.shadowRoot?.querySelector('button')){h.shadowRoot.querySelector('button').focus();done(true);}else setTimeout(ready,50);}ready();`, args: []});
  const key = (value) => request(`/session/${id}/actions`, {actions: [{type: 'key', id: 'p6-keyboard', actions: [{type: 'keyDown', value}, {type: 'keyUp', value}]}]});
  await key('\uE007');
  await request(`/session/${id}/execute/async`, {script: `const done=arguments[arguments.length-1];function ready(){const n=document.querySelector('s-popover s-checkbox')?.shadowRoot?.querySelector('input');if(n?.getBoundingClientRect().width>0)done(true);else setTimeout(ready,50);}ready();`, args: []});
  await key('\uE00C');
  await request(`/session/${id}/execute/async`, {script: `const done=arguments[arguments.length-1];function ready(){const n=document.querySelector('s-popover s-checkbox')?.shadowRoot?.querySelector('input');if(!n||n.getBoundingClientRect().width===0)done(true);else setTimeout(ready,50);}ready();`, args: []});
  const focus = await request(`/session/${id}/execute/sync`, {script: `return {host:document.activeElement?.tagName,text:document.activeElement?.textContent?.trim()};`, args: []});
  if (focus.text !== 'Columns') throw new Error(`Safari Columns Escape focus: ${JSON.stringify(focus)}`);
  report.keyboard = [{step: 'columns-enter-escape', ...focus}];
  await request(`/session/${id}/url`, {url: `${site}/iframe.html?id=integration-features-selection-workflow--cross-page-and-bulk&viewMode=story`});
  await request(`/session/${id}/execute/async`, {script: `const done=arguments[arguments.length-1];function ready(){const h=document.querySelector('s-table-header s-checkbox');const n=h?.shadowRoot?.querySelector('input');if(n?.getBoundingClientRect().width>0){n.focus();done(true);}else setTimeout(ready,50);}ready();`, args: []});
  await key('\uE00D');
  await request(`/session/${id}/execute/async`, {script: `const done=arguments[arguments.length-1];function ready(){const h=[...document.querySelectorAll('s-button')].find(x=>x.textContent.trim()==='More actions');const n=h?.shadowRoot?.querySelector('button');if(n?.getBoundingClientRect().width>0){n.focus();done(true);}else setTimeout(ready,50);}ready();`, args: []});
  await key('\uE007');
  await request(`/session/${id}/execute/async`, {script: `const done=arguments[arguments.length-1];function ready(){const m=document.querySelector('s-menu');const n=m?.shadowRoot?.querySelector('[role=menuitem]');if(n?.getBoundingClientRect().width>0){n.focus();done(true);}else setTimeout(ready,50);}ready();`, args: []});
  await key('\uE007');
  await request(`/session/${id}/execute/async`, {script: `const done=arguments[arguments.length-1];function ready(){if(document.querySelector('s-modal')?.shadowRoot?.querySelector('dialog')?.open)done(true);else setTimeout(ready,50);}ready();`, args: []});
  await key('\uE00C');
  await request(`/session/${id}/execute/async`, {script: `const done=arguments[arguments.length-1];function ready(){if(document.querySelector('s-modal')?.shadowRoot?.querySelector('dialog')?.open===false)done(true);else setTimeout(ready,50);}ready();`, args: []});
  const bulkFocus = await request(`/session/${id}/execute/sync`, {script: `return {host:document.activeElement?.tagName,text:document.activeElement?.textContent?.trim()};`, args: []});
  report.keyboard.push({step: 'bulk-checkbox-space-menu-enter-modal-escape', pass: true, focus: bulkFocus});
  report.status = 'passed';
} catch (error) {
  report.status = id ? 'failed' : 'unavailable';
  report.error = error.message;
  process.exitCode = id ? 1 : 2;
} finally {
  if (id) await request(`/session/${id}`, undefined, 'DELETE').catch(() => undefined);
  report.finishedAt = new Date().toISOString();
  await mkdir(resolve('test-results/p6'), {recursive: true});
  await writeFile(resolve('test-results/p6/safari.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
}
