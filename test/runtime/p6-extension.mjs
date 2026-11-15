import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdir, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const exec = promisify(execFile);
const base = process.env.P6_BASE_URL ?? 'http://127.0.0.1:6112';
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) throw new Error('Only local P6 fixtures are permitted.');
const session = (await exec('agent-browser', ['session', 'id', '--scope', 'worktree', '--prefix', 'polaris2-p6-extension'])).stdout.trim();
const run = async (...args) => (await exec('agent-browser', ['--session', session, ...args], {timeout: 60000, maxBuffer: 8 * 1024 * 1024})).stdout.trim();
const report = {startedAt: new Date().toISOString(), cases: [], keyboard: [], failures: []};
try {
  for (const dir of ['ltr', 'rtl']) for (const [width, height] of [[320,648],[375,667],[768,1024],[1280,800]]) {
    await run('set', 'viewport', String(width), String(height));
    await run('open', `${base}/iframe.html?id=components-extension-table--playground&viewMode=story&globals=direction:${dir}`);
    await run('wait', '--fn', `!!document.querySelector('[role=table]') && getComputedStyle(document.querySelector('[role=table]')).direction === '${dir}'`);
    const layout = JSON.parse(await run('eval', `({width:innerWidth,scroll:document.documentElement.scrollWidth})`));
    assert.equal(layout.width, width);
    assert.ok(layout.scroll <= width + 1);
    const audit = JSON.parse(await run('a11y', '--json')).data;
    report.cases.push({dir, width, counts: audit.counts, violations: audit.violations, incomplete: audit.incomplete});
    assert.equal(audit.counts.violations, 0);
    assert.equal(audit.counts.incomplete, 0);
  }
  await run('eval', `document.querySelector('input[type=radio]').focus()`);
  await run('press', 'Space');
  await run('wait', '--fn', `document.querySelectorAll('input[type=radio]')[0].checked`);
  await run('press', 'ArrowDown');
  await run('wait', '--fn', `document.querySelectorAll('input[type=radio]')[1].checked`);
  report.keyboard.push({step: 'native-radio-space-arrowdown', pass: true});
} catch (error) {
  report.failures.push({message: error.message, stdout: error.stdout, stderr: error.stderr});
  process.exitCode = 1;
} finally {
  report.finishedAt = new Date().toISOString();
  await mkdir(resolve('test-results/p6'), {recursive: true});
  await writeFile(resolve('test-results/p6/extension.json'), JSON.stringify(report, null, 2) + '\n');
  await run('close').catch(() => undefined);
  console.log(JSON.stringify(report, null, 2));
}
