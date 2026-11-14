import type {StorybookConfig} from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: '@storybook/react-vite',
  // Storybook owns its runtime; the published library never injects scripts.
  previewHead: (head) => `${head}\n<script src="https://cdn.shopify.com/shopifycloud/polaris-2.0.js"></script>`,
};

export default config;
