import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
const ciWorkflow = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');

test('declares the supported Node.js baseline', () => {
  assert.equal(packageJson.engines?.node, '>=20');
  assert.match(ciWorkflow, /node:\s*\[20, 22, 24\]/);
  assert.match(ciWorkflow, /node-version:\s*\$\{\{ matrix\.node \}\}/);
});

test('declares the intended React and Polaris peer ranges', () => {
  assert.equal(packageJson.peerDependencies?.['@shopify/polaris'], undefined);
  assert.equal(packageJson.peerDependencies?.react, '>=19 <20');
  assert.equal(packageJson.peerDependencies?.['react-dom'], '>=19 <20');
  assert.equal(packageJson.devDependencies?.['@shopify/polaris-types'], '2.0.0');
});
