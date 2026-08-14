import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

import {describe, expect, it} from 'vitest';

const packageJsonPath = resolve(process.cwd(), 'package.json');
const eslintConfigPath = resolve(process.cwd(), 'eslint.config.js');

describe('Storybook release integration', () => {
  it('builds Storybook before the documentation site', async () => {
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8')) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.['build-storybook']).toContain('website/static/storybook');
    expect(packageJson.scripts?.['docs:build']).toContain('build-storybook');
  });

  it('keeps generated documentation and Storybook files out of linting', async () => {
    const eslintConfig = await readFile(eslintConfigPath, 'utf8');

    expect(eslintConfig).toContain("'website/build/**'");
    expect(eslintConfig).toContain("'website/static/storybook/**'");
  });
});
