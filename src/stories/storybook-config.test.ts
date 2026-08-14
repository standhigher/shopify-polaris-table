import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

import {describe, expect, it} from 'vitest';

import {
  storyCampaigns,
  storyCustomers,
  storyOffers,
  storyOrders,
  storyProducts,
} from './storyData';

const packageJsonPath = resolve(process.cwd(), 'package.json');
const eslintConfigPath = resolve(process.cwd(), 'eslint.config.js');
const docsIntroPath = resolve(process.cwd(), 'website/docs/intro.md');
const previewConfigPath = resolve(process.cwd(), '.storybook/preview.tsx');
const storyFiles = [
  'src/stories/ComponentsOverview.stories.tsx',
  'src/stories/Table.stories.tsx',
  'src/stories/TableFeatures.stories.tsx',
  'src/stories/FeaturesOverview.stories.tsx',
  'src/stories/Presets.stories.tsx',
  'src/stories/PresetsOverview.stories.tsx',
  'src/stories/Selection.stories.tsx',
  'src/stories/QueryState.stories.tsx',
  'src/stories/AdvancedOverview.stories.tsx',
  'src/stories/AdvancedV3.stories.tsx',
  'src/stories/AdvancedV4.stories.tsx',
] as const;

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

  it('keeps the sidebar order aligned to components, features, presets, and advanced stories', async () => {
    const previewConfig = await readFile(previewConfigPath, 'utf8');

    expect(previewConfig).toContain("'Components'");
    expect(previewConfig).toContain("'Features'");
    expect(previewConfig).toContain("'Presets'");
    expect(previewConfig).toContain("'Advanced'");
    expect(previewConfig).toContain("'Overview'");
  });

  it('covers the published Storybook example set', async () => {
    await Promise.all(storyFiles.map(async (file) => {
      await expect(readFile(resolve(process.cwd(), file), 'utf8')).resolves.toContain('export const');
    }));
  });

  it('redirects the documentation homepage to the OrderTable Storybook example', async () => {
    await expect(readFile(docsIntroPath, 'utf8')).resolves.toContain('/storybook/?path=/story/presets--order-table');
  });

  it('provides 50 mock rows for every published Storybook domain example', () => {
    expect(storyProducts).toHaveLength(50);
    expect(storyOrders).toHaveLength(50);
    expect(storyCustomers).toHaveLength(50);
    expect(storyCampaigns).toHaveLength(50);
    expect(storyOffers).toHaveLength(50);
  });
});
