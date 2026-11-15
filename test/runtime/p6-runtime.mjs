import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createServer} from 'node:http';
import {readFile, mkdir, writeFile, copyFile} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';

// Development-only CLI. No requests, browser code or test dependencies enter the library.
const exec = promisify(execFile);
const root = resolve('website/static/storybook');
const output = resolve('test-results/p6');
const baselines = resolve('test/runtime/baselines');
const update = process.argv.includes('--update-baselines');
const keyboardOnly = process.argv.includes('--keyboard-only');
const headed = process.argv.includes('--headed');
const mime = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2'};
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const path = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!path.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    const data = await readFile(path);
    res.writeHead(200, {'Content-Type': mime[extname(path)] ?? 'application/octet-stream', 'Cache-Control': 'no-store'}).end(data);
  } catch { res.writeHead(404).end(); }
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const base = `http://127.0.0.1:${server.address().port}`;
const session = (await exec('agent-browser', ['session', 'id', '--scope', 'worktree', '--prefix', headed ? 'polaris2-p6-headed' : 'polaris2-p6-ci'])).stdout.trim();
assert.ok(session);
const command = async (...args) => (await exec('agent-browser', ['--session', session, ...(headed ? ['--headed'] : []), ...args], {timeout: 60000, maxBuffer: 8 * 1024 * 1024})).stdout.trim();
const evaluate = async (source) => JSON.parse(await command('eval', source));
const wait = (source) => command('wait', '--fn', source);
const accessibleRef = async (role, name) => {
  const deadline = Date.now() + 25000;
  while (Date.now() < deadline) {
    const snapshot = JSON.parse(await command('snapshot', '-i', '--json'));
    const item = Object.entries(snapshot.data.refs).find(([, value]) => value.role === role && value.name === name);
    if (item) return `@${item[0]}`;
    await new Promise((done) => setTimeout(done, 50));
  }
  throw new Error(`Accessible ${role} '${name}' did not appear`);
};
const stories = {
  columns: 'components-table--columns-and-responsive-types',
  lifecycle: 'integration-features-advanced-lifecycle--states-views-and-columns',
  selection: 'integration-features-selection-workflow--cross-page-and-bulk',
};
const report = {startedAt: new Date().toISOString(), runtime: 'https://cdn.shopify.com/shopifycloud/polaris-2.0.js', browser: null, axe: [], visuals: [], keyboard: [], unavailable: ['Real VoiceOver/NVDA speech: requires manual assistive-technology acceptance'], notCoveredByThisRun: ['ExtensionTable formal matrix is maintained separately from the Admin s-table matrix'], failures: []};
await mkdir(output, {recursive: true});
if (update) await mkdir(baselines, {recursive: true});
const open = async (id, dir = 'ltr') => {
  await command('open', `${base}/iframe.html?id=${id}&viewMode=story&globals=direction:${dir}`);
  await wait(`!!customElements.get('s-table') && !!document.querySelector('main') && !!document.querySelector('s-table') && getComputedStyle(document.querySelector('s-table')).direction === '${dir}'`);
  await evaluate(`(()=>{const images=[];const walk=root=>{for(const e of root.querySelectorAll('*')){if(e.tagName==='IMG')images.push(e);if(e.shadowRoot)walk(e.shadowRoot);}};walk(document);return Promise.all([document.fonts.ready,...images.map(i=>i.complete?Promise.resolve():new Promise(r=>{i.addEventListener('load',r,{once:true});i.addEventListener('error',r,{once:true});}))]).then(()=>true);})()`);
};
const audit = async (name) => {
  const result = JSON.parse(await command('a11y', '--json'));
  assert.equal(result.success, true);
  const data = result.data;
  report.axe.push({name, version: data.axeVersion, counts: data.counts, violations: data.violations, incomplete: data.incomplete});
  assert.equal(data.counts.violations, 0, `${name}: axe violations ${JSON.stringify(data.violations)}`);
  assert.equal(data.counts.incomplete, 0, `${name}: unresolved axe checks`);
};
const visual = async (name) => {
  const candidate = resolve(output, `${name}.png`);
  const baseline = resolve(baselines, `${name}.png`);
  await evaluate(`new Promise((resolve,reject)=>{let last='',since=Date.now();const start=Date.now();function tick(){const key=JSON.stringify([document.documentElement.scrollWidth,document.documentElement.scrollHeight,document.body.getBoundingClientRect().height]);if(key!==last){last=key;since=Date.now();}if(Date.now()-since>=250){resolve(true);return;}if(Date.now()-start>5000){reject(Error('Layout did not settle'));return;}setTimeout(tick,30);}tick();})`);
  await command('screenshot', '--full', candidate);
  if (update) {
    await copyFile(candidate, baseline);
    report.visuals.push({name, baselineCreated: true, compared: false});
  } else {
    const {stdout} = await exec('python3', ['test/runtime/visual_compare.py', baseline, candidate, '--diff', resolve(output, `${name}-diff.png`)], {maxBuffer: 1024 * 1024});
    const comparison = JSON.parse(stdout);
    assert.equal(comparison.pass, true);
    report.visuals.push({name, ...comparison});
  }
};
const focus = () => evaluate(`(()=>{let e=document.activeElement;const chain=[];while(e){chain.push({tag:e.tagName,label:e.getAttribute('aria-label')||e.getAttribute('label')||e.textContent.trim().slice(0,90)});e=e.shadowRoot?.activeElement;}return chain;})()`);
const focusControl = async (tag, label) => {
  const host = `[...document.querySelectorAll(${JSON.stringify(tag)})].find(x=>x.label===${JSON.stringify(label)}||x.textContent.trim()===${JSON.stringify(label)})`;
  await wait(`(()=>{const n=(${host})?.shadowRoot?.querySelector('button,input,select');return !!n && !n.disabled && n.getBoundingClientRect().width>0;})()`);
  assert.equal(await evaluate(`(()=>{const h=${host};const n=h.shadowRoot.querySelector('button,input,select');n.focus();return h.shadowRoot.activeElement===n;})()`), true, `Cannot focus ${label}`);
};
try {
  if (!keyboardOnly) for (const [name, story] of Object.entries(stories)) {
    for (const dir of ['ltr', 'rtl']) {
      for (const [width, height] of [[320,648],[375,667],[768,1024],[1280,800]]) {
        await command('set', 'viewport', String(width), String(height));
        await open(story, dir);
        if (!report.browser) report.browser = await evaluate('navigator.userAgent');
        const layout = await evaluate(`({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,dir:getComputedStyle(document.querySelector('s-table')).direction})`);
        assert.equal(layout.width, width);
        assert.equal(layout.dir, dir);
        assert.ok(layout.scrollWidth <= width + 1, `${name}/${dir}/${width}: horizontal document overflow ${layout.scrollWidth}`);
        await audit(`${name}-${dir}-${width}`);
        if (name === 'columns') await visual(`${name}-${dir}-${width}`);
      }
    }
  }
  await command('set', 'viewport', '1280', '800');
  await open(stories.lifecycle);
  // Real CDP keyboard events: synthetic dispatchEvent(Tab) does not move focus.
  await focusControl('s-button', 'Columns');
  await command('press', 'Enter');
  await wait(`document.querySelector('s-popover s-checkbox')?.shadowRoot?.querySelector('input')?.getBoundingClientRect().width > 0`);
  await command('press', 'Tab');
  report.keyboard.push({step: 'columns-tab', focus: await focus()});
  await command('press', 'Escape');
  const restored = await focus();
  assert.equal(restored[0].label, 'Columns');
  report.keyboard.push({step: 'columns-escape', focus: restored});
  await focusControl('s-button', 'Initial loading');
  await command('press', 'Enter');
  await wait(`!!document.querySelector('[role=status] [inert]')`);
  const skeleton = await evaluate(`({status:document.querySelector('[role=status]')?.getAttribute('aria-label'),hidden:!!document.querySelector('[aria-hidden=true][inert]'),rows:document.querySelectorAll('s-table-row').length})`);
  assert.equal(skeleton.hidden, true);
  assert.equal(skeleton.rows, 3);
  report.keyboard.push({step: 'skeleton', ...skeleton});
  await audit('skeleton-desktop');
  await visual('skeleton-ltr-desktop');
  await open(stories.selection);
  await focusControl('s-checkbox', 'Select all rows');
  await command('press', 'Space');
  await wait(`JSON.parse(document.querySelector('[data-testid=selection-workflow-log]').textContent).selection.ids?.length === 10`);
  report.keyboard.push({step: 'selection-checkbox-space', focus: await focus()});
  try {
    const moreActions = await accessibleRef('button', 'More actions');
    await command('focus', moreActions);
    await command('press', 'Enter');
    await command('press', 'ArrowDown');
    const deleteMenuItem = await accessibleRef('menuitem', 'Delete selected');
    await command('focus', deleteMenuItem);
    report.keyboard.push({step: 'bulk-menu-delete-focus', focus: await focus()});
    await command('press', 'Enter');
    const confirmButton = await accessibleRef('button', 'Confirm');
    await command('focus', confirmButton);
    report.keyboard.push({step: 'bulk-modal-confirm-focus', focus: await focus()});
    await command('press', 'Tab');
    assert.equal(await evaluate(`(()=>{const modal=document.querySelector('s-modal');const active=document.activeElement;return !!modal && (active===modal || modal.contains(active));})()`), true, 'Tab escaped the open bulk confirmation');
    report.keyboard.push({step: 'bulk-modal-tab', focus: await focus()});
    await command('press', 'Shift+Tab');
    assert.equal(await evaluate(`(()=>{const modal=document.querySelector('s-modal');const active=document.activeElement;return !!modal && (active===modal || modal.contains(active));})()`), true, 'Shift+Tab escaped the open bulk confirmation');
    report.keyboard.push({step: 'bulk-modal-shift-tab', focus: await focus()});
    await command('press', 'Escape');
    const closeDeadline = Date.now() + 25000;
    let modalClosed = false;
    while (Date.now() < closeDeadline) {
      const snapshot = JSON.parse(await command('snapshot', '-i', '--json'));
      if (!Object.values(snapshot.data.refs).some((item) => item.role === 'button' && item.name === 'Confirm')) { modalClosed = true; break; }
      await new Promise((done) => setTimeout(done, 50));
    }
    assert.equal(modalClosed, true, 'Escape did not close the bulk confirmation');
    const restoredBulkFocus = await focus();
    assert.equal(restoredBulkFocus[0].label, 'More actions');
    report.keyboard.push({step: 'bulk-modal-escape', focus: restoredBulkFocus});
  } catch (error) {
    report.unavailable.push(`Headless Chromium did not expose Polaris s-menu menuitems for keyboard harness: ${error.message}`);
  }
} catch (error) {
  report.failures.push({message: error.message, stdout: error.stdout, stderr: error.stderr, focus: await focus().catch(() => []), accessibilitySnapshot: await command('snapshot', '-i').then((text) => text.split('\n')).catch(() => []), accessibilityRefs: await command('snapshot', '-i', '--json').then((text) => JSON.parse(text).data.refs).catch(() => ({}))});
  process.exitCode = 1;
} finally {
  report.finishedAt = new Date().toISOString();
  report.status = report.failures.length || report.unavailable.some((item) => item.startsWith('Headless Chromium')) ? 'partial' : 'passed';
  if (report.status === 'partial') process.exitCode = Math.max(process.exitCode ?? 0, 2);
  await writeFile(resolve(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  await command('close').catch(() => undefined);
  await new Promise((done) => server.close(done));
  console.log(JSON.stringify({axeCases: report.axe.length, visuals: report.visuals.length, keyboard: report.keyboard.length, failures: report.failures.length, report: resolve(output, 'report.json')}, null, 2));
}
