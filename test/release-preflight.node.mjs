import assert from 'node:assert/strict';
import test from 'node:test';
import {validateRelease} from '../scripts/release-preflight.mjs';

const base = {version: '2.0.0-beta.1', channel: 'next', branch: 'main', status: '', readiness: {version: '2.0.0-beta.1', channel: 'next', p6AutomationAccepted: true, screenReaderDecision: 'passed', publishAuthorized: true}, p6: {status: 'passed', failures: [], unavailable: []}};

test('accepts only an explicitly authorized clean beta readiness record', () => {
  assert.deepEqual(validateRelease(base), []);
});

test('blocks feature branches, dirty trees, P6 partial and missing authorization', () => {
  const errors = validateRelease({...base, branch: 'feat/v2', status: '?? pnpm-lock.yaml', readiness: {...base.readiness, publishAuthorized: false}, p6: {status: 'partial', failures: [], unavailable: ['headless']}});
  assert.ok(errors.some((error) => error.includes('merged main')));
  assert.ok(errors.some((error) => error.includes('clean')));
  assert.ok(errors.some((error) => error.includes('P6 automation')));
  assert.ok(errors.some((error) => error.includes('authorization')));
});

test('blocks a beta version from latest', () => {
  const errors = validateRelease({...base, channel: 'latest'});
  assert.ok(errors.some((error) => error.includes('latest')));
});
