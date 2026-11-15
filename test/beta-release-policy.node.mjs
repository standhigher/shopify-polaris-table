import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url)));
const changelog = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8');
const releaseGuide = readFileSync(new URL('../docs/release.md', import.meta.url), 'utf8');
const stableVersion = '2.0.0';

test('stable metadata is synchronized and prerelease-free', () => {
  assert.equal(packageJson.version, stableVersion);
  assert.equal(lock.version, stableVersion);
  assert.equal(lock.packages[''].version, stableVersion);
  assert.match(stableVersion, /^2\.0\.0$/);
  assert.equal(packageJson.publishConfig?.access, 'public');
  assert.equal(packageJson.publishConfig?.registry, 'https://registry.npmjs.org/');
  assert.equal(packageJson.publishConfig?.tag, 'latest');
});

test('beta route remains next-only and cannot change latest', () => {
  assert.match(packageJson.scripts?.['npm:publish:beta'] ?? '', /--tag next/);
  assert.doesNotMatch(packageJson.scripts?.['npm:publish:beta'] ?? '', /--tag latest/);
  assert.match(releaseGuide, /Prereleases must use.*`next`/s);
  assert.match(releaseGuide, /Do not move `latest`/);
  assert.match(changelog, /## \[2\.0\.0\] - Unreleased/);
});

test('publish requires guarded release policy and side-effect-free package', () => {
  assert.match(packageJson.scripts?.['release:prepare:beta'] ?? '', /release:check/);
  assert.match(packageJson.scripts?.['release:prepare:beta'] ?? '', /test:beta-policy/);
  assert.match(packageJson.scripts?.['release:check:beta'] ?? '', /release:preflight:beta/);
  assert.match(packageJson.scripts?.prepublishOnly ?? '', /release-preflight/);
  assert.equal(packageJson.sideEffects, false);
  assert.match(packageJson.scripts?.['npm:publish'] ?? '', /publish-disabled/);
  assert.match(packageJson.scripts?.['npm:publish:stable'] ?? '', /release:check:stable/);
  assert.match(packageJson.scripts?.['npm:publish:stable'] ?? '', /--tag latest/);
  assert.match(packageJson.scripts?.['release:check:stable'] ?? '', /release:preflight:stable/);
  assert.match(packageJson.scripts?.['npm:publish:beta'] ?? '', /release:check:beta/);
});
