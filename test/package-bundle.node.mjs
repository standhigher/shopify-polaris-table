import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, rmSync, readFileSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve, relative} from 'node:path';
import test from 'node:test';
import {build} from 'esbuild';

const root = resolve('.');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

test('bundles formal exports from an installed tarball and verifies output contribution graph', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'polaris-beta-bundle-'));
  try {
    const packed = JSON.parse(execFileSync(npm, ['pack', '--json', '--pack-destination', directory, '--registry=https://registry.npmjs.org/'], {cwd: root, encoding: 'utf8'}))[0];
    const sourcePackage = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    assert.equal(packed.version, sourcePackage.version);
    writeFileSync(join(directory, 'package.json'), JSON.stringify({name: 'beta-bundle-consumer', private: true, type: 'module'}));
    execFileSync(npm, ['install', '--ignore-scripts', '--no-package-lock', join(directory, packed.filename), 'react@19.3.1', 'react-dom@19.3.1', '--registry=https://registry.npmjs.org/'], {cwd: directory, encoding: 'utf8'});
    const installed = JSON.parse(readFileSync(join(directory, 'node_modules/@standhigher/polaris-data-table/package.json'), 'utf8'));
    assert.equal(installed.version, sourcePackage.version);
    assert.equal(installed.sideEffects, false);
    for (const [name, entry, required, excluded] of [
      ['helper', `import {formatMoney} from '@standhigher/polaris-data-table';console.log(formatMoney(12.5,{currencyCode:'USD',locale:'en-US'}));`, /formatMoney/, /components\//],
      ['table', `import {Table} from '@standhigher/polaris-data-table';console.log(Table);`, /TableRenderer/, /components\/ExtensionTable/],
      ['extension', `import {ExtensionTable} from '@standhigher/polaris-data-table/extension';console.log(ExtensionTable);`, /ExtensionTable/, /components\/Table\//],
    ]) {
      const result = await build({stdin: {contents: entry, resolveDir: directory, sourcefile: `${name}.mjs`}, bundle: true, write: false, metafile: true, treeShaking: true, platform: 'browser', format: 'esm', external: ['react', 'react-dom', 'react/jsx-runtime']});
      const code = result.outputFiles[0].text;
      const contributing = Object.values(result.metafile.outputs).flatMap((output) => Object.entries(output.inputs).filter(([, value]) => value.bytesInOutput > 0).map(([path]) => path)).join('\n').replaceAll('\\', '/');
      assert.match(code, required, `${name}: required exported behavior missing`);
      assert.doesNotMatch(contributing, excluded, `${name}: unrelated modules contributed bytes`);
      assert.doesNotMatch(code, /shopifycloud|customElements\.define|<script/);
      assert.doesNotMatch(contributing, /experimental|node_modules\/@shopify\/polaris\//);
    }
  } finally {
    // Only remove the temporary directory created by this test, never a checkout.
    const pathFromTemp = relative(tmpdir(), directory);
    assert.ok(pathFromTemp.startsWith('polaris-beta-bundle-') && !pathFromTemp.includes('..'));
    rmSync(directory, {recursive: true, force: true});
  }
});
