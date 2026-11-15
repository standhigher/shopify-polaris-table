import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import test from 'node:test';

const repositoryRoot = process.cwd();
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(command, args, cwd) {
  return execFileSync(command, args, {cwd, encoding: 'utf8'});
}

test('typechecks a React 19 NodeNext consumer without Polaris React', () => {
  const packDirectory = mkdtempSync(join(tmpdir(), 'polaris-data-table-pack-'));

  try {
    const packOutput = run(
      npmCommand,
      ['pack', '--json', '--pack-destination', packDirectory, '--registry=https://registry.npmjs.org/'],
      repositoryRoot,
    );
    const [{filename, files}] = JSON.parse(packOutput);
    const tarballPath = join(packDirectory, filename);

    assert.equal(
      files.some(({path}) => path.startsWith('dist/experimental/')),
      false,
      'internal experiments must not be shipped in the npm tarball',
    );

    {
      const consumerDirectory = mkdtempSync(join(tmpdir(), 'polaris-data-table-react19-consumer-'));

      try {
        writeFileSync(
          join(consumerDirectory, 'package.json'),
          `${JSON.stringify({name: 'package-consumer', private: true, type: 'module'}, null, 2)}\n`,
        );
        writeFileSync(
          join(consumerDirectory, 'index.ts'),
          "import {Table, TableSkeleton, type TableQuery, type TableSkeletonProps} from '@standhigher/polaris-data-table';\n\nconst query: TableQuery = {page: 1, pageSize: 25};\nconst table: typeof Table = Table;\nconst skeleton: typeof TableSkeleton = TableSkeleton;\nconst skeletonProps: TableSkeletonProps<{id: string}> = {columns: [{key: 'id', title: 'ID'}]};\n\nvoid query;\nvoid table;\nvoid skeleton;\nvoid skeletonProps;\n",
        );
        writeFileSync(
          join(consumerDirectory, 'tsconfig.json'),
          `${JSON.stringify(
            {
              compilerOptions: {
                target: 'ES2022',
                module: 'NodeNext',
                moduleResolution: 'NodeNext',
                strict: true,
                noEmit: true,
                skipLibCheck: false,
              },
            },
            null,
            2,
          )}\n`,
        );

        run(
          npmCommand,
          [
            'install',
            '--ignore-scripts',
            '--no-package-lock',
            tarballPath,
            'react@19.3.1',
            'react-dom@19.3.1',
            '@types/react@19.3.0',
            '@types/react-dom@19.3.0',
          ],
          consumerDirectory,
        );
        run(
          process.execPath,
          [join(repositoryRoot, 'node_modules', 'typescript', 'lib', 'tsc.js'), '-p', 'tsconfig.json'],
          consumerDirectory,
        );

        writeFileSync(join(consumerDirectory, 'runtime-check.mjs'), `
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToString} from 'react-dom/server';
import {Table, TableSkeleton} from '@standhigher/polaris-data-table';
assert.equal(typeof window, 'undefined');
assert.equal(typeof document, 'undefined');
assert.equal(typeof TableSkeleton, 'function');
const html = renderToString(createElement(Table, {
  columns: [{key: 'name', title: 'Name', sortable: true}],
  data: [{id: '1', name: 'Inventory item'}], rowId: 'id',
  query: {page: 1, pageSize: 25}, pagination: {total: 1},
  formatOptions: {locale: 'en-US', timeZone: 'UTC'},
  selection: {mode: 'explicit', ids: []},
  filters: [{key: 'name', label: 'Name', type: 'text', operators: ['contains']}],
  onSelectionChange() {}, onQueryChange() {},
}));
assert.match(html, /<s-table /);
assert.match(html, /Inventory item/);
assert.doesNotMatch(html, /<script|polaris-types/);
const skeletonHtml = renderToString(createElement(TableSkeleton, {columns: [{key: 'name', title: 'Name'}], rowCount: 2, label: 'Loading inventory'}));
assert.match(skeletonHtml, /Loading inventory/);
assert.match(skeletonHtml, /aria-hidden="true"/);
assert.equal((skeletonHtml.match(/<s-table-row>/g) ?? []).length, 2);
assert.doesNotMatch(skeletonHtml, /<script|polaris-types/);
assert.equal(typeof window, 'undefined');
assert.equal(typeof document, 'undefined');
`);
        run(process.execPath, ['runtime-check.mjs'], consumerDirectory);
        assert.equal(existsSync(join(consumerDirectory, 'node_modules', '@shopify', 'polaris')), false);
        assert.equal(existsSync(join(consumerDirectory, 'node_modules', '@shopify', 'polaris-types')), false);

        const installedPackage = JSON.parse(
          readFileSync(join(consumerDirectory, 'node_modules', '@standhigher', 'polaris-data-table', 'package.json'), 'utf8'),
        );
        assert.equal(installedPackage.name, '@standhigher/polaris-data-table');
        assert.equal(
          existsSync(join(consumerDirectory, 'node_modules', '@standhigher', 'polaris-data-table', 'dist', 'experimental')),
          false,
          'installed consumers must not receive internal experiment modules',
        );
      } finally {
        rmSync(consumerDirectory, {force: true, recursive: true});
      }
    }
  } finally {
    rmSync(packDirectory, {force: true, recursive: true});
  }
});

test('installs the extension entrypoint without Shopify Polaris', () => {
  const packDirectory = mkdtempSync(join(tmpdir(), 'polaris-data-table-extension-pack-'));
  const consumerDirectory = mkdtempSync(join(tmpdir(), 'polaris-data-table-extension-consumer-'));

  try {
    const packOutput = run(
      npmCommand,
      ['pack', '--json', '--pack-destination', packDirectory, '--registry=https://registry.npmjs.org/'],
      repositoryRoot,
    );
    const [{filename}] = JSON.parse(packOutput);
    const tarballPath = join(packDirectory, filename);

    writeFileSync(
      join(consumerDirectory, 'package.json'),
      `${JSON.stringify({name: 'extension-consumer', private: true, type: 'module'}, null, 2)}\n`,
    );
    writeFileSync(
      join(consumerDirectory, 'index.ts'),
      "import {ExtensionTable, type ExtensionTableHostContext} from '@standhigher/polaris-data-table/extension';\n\nconst host: ExtensionTableHostContext = {locale: 'en', timeZone: 'UTC'};\nconst table: typeof ExtensionTable = ExtensionTable;\n\nvoid host;\nvoid table;\n",
    );
    writeFileSync(
      join(consumerDirectory, 'tsconfig.json'),
      `${JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2022',
            module: 'NodeNext',
            moduleResolution: 'NodeNext',
            strict: true,
            noEmit: true,
            skipLibCheck: false,
          },
        },
        null,
        2,
      )}\n`,
    );

    run(
      npmCommand,
      [
        'install',
        '--ignore-scripts',
        '--no-package-lock',
        tarballPath,
        'react@19.3.1',
        'react-dom@19.3.1',
        '@types/react@19.3.0',
        '@types/react-dom@19.3.0',
      ],
      consumerDirectory,
    );
    run(
      process.execPath,
      [join(repositoryRoot, 'node_modules', 'typescript', 'lib', 'tsc.js'), '-p', 'tsconfig.json'],
      consumerDirectory,
    );

    assert.equal(existsSync(join(consumerDirectory, 'node_modules', '@shopify', 'polaris')), false);
    writeFileSync(
      join(consumerDirectory, 'runtime-check.mjs'),
      "import {ExtensionTable} from '@standhigher/polaris-data-table/extension';\n\nif (typeof ExtensionTable !== 'function') process.exit(1);\n",
    );
    run(process.execPath, ['runtime-check.mjs'], consumerDirectory);
  } finally {
    rmSync(packDirectory, {force: true, recursive: true});
    rmSync(consumerDirectory, {force: true, recursive: true});
  }
});
