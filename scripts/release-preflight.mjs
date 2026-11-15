import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

/** Pure fail-closed policy; this module never logs in, publishes or changes tags. */
export function validateRelease({version, channel, branch, status, readiness, p6}) {
  const errors = [];
  const beta = /^2\.\d+\.\d+-beta\.\d+$/.test(version);
  const stable = /^\d+\.\d+\.\d+$/.test(version);
  if (channel === 'next') {
    if (!beta) errors.push('next requires a V2 beta semantic version.');
    if (branch !== 'main') errors.push('V2 beta releases must come from merged main.');
  } else if (channel === 'latest') {
    if (!stable) errors.push('latest must never point to a prerelease.');
    if (version.startsWith('1.') && branch !== 'maintenance/v1.x') errors.push('V1 fixes release from maintenance/v1.x.');
    if (!version.startsWith('1.') && branch !== 'main') errors.push('Stable V2 releases must come from main.');
  } else errors.push('An explicit next or latest channel is required.');
  if (status.trim()) errors.push('Release checkout must be clean, including unrelated untracked files.');
  if (readiness?.version !== version) errors.push('Release-readiness version does not match package metadata.');
  if (readiness?.channel !== channel) errors.push('Release-readiness channel does not match the requested channel.');
  if (readiness?.p6AutomationAccepted !== true || p6?.status !== 'passed' || p6?.failures?.length !== 0 || p6?.unavailable?.some((item) => item.startsWith('Headless Chromium'))) errors.push('P6 automation is not accepted; partial is not a release pass.');
  if (!['passed', 'explicitly-accepted-manual-follow-up'].includes(readiness?.screenReaderDecision)) errors.push('Screen-reader acceptance/risk decision is still pending.');
  if (readiness?.publishAuthorized !== true) errors.push('A separate explicit human publish authorization is required.');
  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    const channelIndex = process.argv.indexOf('--channel');
    const channel = process.argv.includes('--npm-lifecycle') ? process.env.npm_config_tag ?? pkg.publishConfig?.tag ?? 'latest' : channelIndex >= 0 ? process.argv[channelIndex + 1] : undefined;
    const readiness = JSON.parse(readFileSync(new URL('../docs/v2/release-readiness.json', import.meta.url), 'utf8'));
    const p6 = JSON.parse(readFileSync(new URL('../docs/v2/p6-evidence/chromium.json', import.meta.url), 'utf8'));
    const branch = execFileSync('git', ['branch', '--show-current'], {encoding: 'utf8'}).trim();
    const status = execFileSync('git', ['status', '--porcelain'], {encoding: 'utf8'});
    const errors = validateRelease({version: pkg.version, channel, branch, status, readiness, p6});
    if (errors.length) { console.error(errors.map((error) => `BLOCKED: ${error}`).join('\n')); process.exitCode = 1; }
    else console.log(`Release preflight accepted ${pkg.version} on ${channel}. No publish was performed.`);
  } catch (error) { console.error(`BLOCKED: ${error.message}`); process.exitCode = 1; }
}
