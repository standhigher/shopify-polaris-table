import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import test from 'node:test';
import {build} from 'esbuild';

const root = resolve('.');
const dist = join(root, 'dist');

async function bundle(entry) {
  const result = await build({stdin: {contents: entry, resolveDir: root, sourcefile: 'consumer.ts', loader: 'ts'}, bundle: true, write: false, format: 'esm', platform: 'browser', treeShaking: true, metafile: true, external: ['react', 'react-dom', 'react/jsx-runtime']});
  return {code: result.outputFiles[0].text, inputs: Object.keys(result.metafile.inputs)};
}

test('pure helper consumer drops renderers and never injects Polaris Runtime', async () => {
  const {code, inputs} = await bundle(`import {formatMoney} from './dist/index.js';console.log(formatMoney(12.5,{currencyCode:'USD',locale:'en-US'}));`);
  assert.doesNotMatch(code, /shopifycloud|createElement\(["']script|customElements\.define|s-table/);
  assert.equal(inputs.some((path) => path.includes('experimental')), false);
  // Inputs can be parsed during graph discovery; output proves dead renderer removal.
  assert.doesNotMatch(code, /function Table\(|function ExtensionTable\(/);
});

test('Table consumer excludes Extension and experimental code from emitted bundle', async () => {
  const {code} = await bundle(`import {Table} from './dist/index.js';console.log(Table);`);
  assert.match(code, /s-table|TableRenderer/);
  assert.doesNotMatch(code, /function ExtensionTable\(|VirtualListPOC|StickyTablePOC|shopifycloud/);
});

test('formal extension entry bundles without Admin table code or Runtime', async () => {
  const {code} = await bundle(`import {ExtensionTable} from './dist/extension.js';console.log(ExtensionTable);`);
  assert.match(code, /ExtensionTable/);
  assert.doesNotMatch(code, /TableBulkActions|s-table|shopifycloud|customElements\.define/);
});

test('generated declarations and exports retain both formal entrypoints', () => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.exports['.'].import, './dist/index.js');
  assert.equal(pkg.exports['./extension'].import, './dist/extension.js');
  assert.match(readFileSync(join(dist, 'index.d.ts'), 'utf8'), /TableSkeleton/);
  assert.match(readFileSync(join(dist, 'extension.d.ts'), 'utf8'), /ExtensionTable/);
});
