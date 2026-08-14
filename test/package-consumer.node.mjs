import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import test from 'node:test';

const repositoryRoot = process.cwd();
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(command, args, cwd) {
  return execFileSync(command, args, {cwd, encoding: 'utf8'});
}

test('typechecks a NodeNext consumer installed from the packed tarball', () => {
  const packDirectory = mkdtempSync(join(tmpdir(), 'polaris-data-table-pack-'));
  const consumerDirectory = mkdtempSync(join(tmpdir(), 'polaris-data-table-consumer-'));

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
      `${JSON.stringify({name: 'package-consumer', private: true, type: 'module'}, null, 2)}\n`,
    );
    writeFileSync(
      join(consumerDirectory, 'index.ts'),
      "import {Table, type TableQuery} from '@standhigher/polaris-data-table';\n\nconst query: TableQuery = {page: 1, pageSize: 25};\nconst table: typeof Table = Table;\n\nvoid query;\nvoid table;\n",
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
            skipLibCheck: true,
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
        '@types/react@18',
        '@types/react-dom@18',
      ],
      consumerDirectory,
    );
    run(join(repositoryRoot, 'node_modules', 'typescript', 'bin', 'tsc'), ['-p', 'tsconfig.json'], consumerDirectory);

    const installedPackage = JSON.parse(
      readFileSync(join(consumerDirectory, 'node_modules', '@standhigher', 'polaris-data-table', 'package.json'), 'utf8'),
    );
    assert.equal(installedPackage.name, '@standhigher/polaris-data-table');
  } finally {
    rmSync(packDirectory, {force: true, recursive: true});
    rmSync(consumerDirectory, {force: true, recursive: true});
  }
});
