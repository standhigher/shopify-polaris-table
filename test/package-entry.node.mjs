import assert from 'node:assert/strict';
import test from 'node:test';

test('imports the built package entrypoint in Node ESM', async () => {
  const packageEntry = await import('../dist/index.js');

  assert.equal(typeof packageEntry.Table, 'function');
});
