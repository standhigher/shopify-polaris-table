import assert from 'node:assert/strict';
import test from 'node:test';
import {validateRelease} from '../scripts/release-preflight.mjs';

const base = {version: '2.0.0-beta.1', channel: 'next', branch: 'main', status: '', readiness: {version: '2.0.0-beta.1', channel: 'next', p6AutomationAccepted: true, screenReaderDecision: 'passed', publishAuthorized: true, dependencyAuditAccepted: true}, p6: {status: 'passed', failures: [], unavailable: []}};

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

test('allows an explicitly recorded P6 accepted-risk decision without claiming a pass', () => {
  const errors = validateRelease({...base, readiness: {...base.readiness, p6Decision: 'accepted-risk', screenReaderDecision: 'accepted-risk'}, p6: {status: 'partial', failures: [], unavailable: ['Headless Chromium did not expose Polaris s-menu menuitems for keyboard harness: known']}});
  assert.deepEqual(errors, []);
});

test('accepted P6-01 risk does not waive unrelated automation failures', () => {
  const errors = validateRelease({...base, readiness: {...base.readiness, p6Decision: 'accepted-risk', screenReaderDecision: 'accepted-risk'}, p6: {status: 'partial', failures: [{case: 'data-loss'}], unavailable: []}});
  assert.ok(errors.some((error) => error.includes('P6 automation')));
});

test('excluded acceptance items do not waive clean tree, audit or publish authorization', () => {
  const errors = validateRelease({...base, status: '?? user-file', readiness: {...base.readiness, p6Decision: 'accepted-risk', screenReaderDecision: 'accepted-risk', publishAuthorized: false, dependencyAuditAccepted: false}, p6: {status: 'partial', failures: [], unavailable: ['Headless Chromium did not expose Polaris s-menu menuitems for keyboard harness: known']}});
  assert.equal(errors.some((error) => error.includes('P6 automation') || error.includes('Screen-reader')), false);
  assert.ok(errors.some((error) => error.includes('clean')));
  assert.ok(errors.some((error) => error.includes('authorization')));
  assert.ok(errors.some((error) => error.includes('Dependency audit')));
});

test('blocks a beta version from latest', () => {
  const errors = validateRelease({...base, channel: 'latest'});
  assert.ok(errors.some((error) => error.includes('latest')));
});
