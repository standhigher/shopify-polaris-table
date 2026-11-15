import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url)));
const changelog = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8');
const releaseGuide = readFileSync(new URL('../docs/release.md', import.meta.url), 'utf8');

const betaVersion = '2.0.0-beta.1';

test('beta metadata is synchronized and prerelease only', () => {
  assert.equal(packageJson.version, betaVersion);
  assert.equal(lock.version, betaVersion);
  assert.equal(lock.packages[''].version, betaVersion);
  assert.match(betaVersion, /^2\.0\.0-beta\.1$/);
  assert.equal(packageJson.publishConfig?.access, 'public');
  assert.equal(packageJson.publishConfig?.registry, 'https://registry.npmjs.org/');
});

test('beta release uses next and never changes latest', () => {
  assert.match(packageJson.scripts?.['npm:publish:beta'] ?? '', /--tag next/);
  assert.doesNotMatch(packageJson.scripts?.['npm:publish:beta'] ?? '', /--tag latest/);
  assert.match(releaseGuide, /Prereleases must use.*`next`/s);
  assert.match(releaseGuide, /Do not move `latest`/);
  assert.match(changelog, /2\.0\.0-beta\.1/);
});

test('beta publish requires the guarded release check', () => {
  assert.match(packageJson.scripts?.['release:prepare:beta'] ?? '', /release:check/);
  assert.match(packageJson.scripts?.['release:prepare:beta'] ?? '', /test:beta-policy/);
  assert.match(packageJson.scripts?.['release:check:beta'] ?? '', /release:preflight:beta/);
  assert.match(packageJson.scripts?.prepublishOnly ?? '', /release-preflight/);
  assert.equal(packageJson.publishConfig?.tag, 'next');
  assert.match(packageJson.scripts?.['npm:publish'] ?? '', /publish-disabled/);
  assert.match(packageJson.scripts?.['npm:publish:beta'] ?? '', /release:check:beta/);
});
