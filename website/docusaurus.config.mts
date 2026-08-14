import type {Config} from '@docusaurus/types';
import {themes as prismThemes} from 'prism-react-renderer';

const repository = process.env.GITHUB_REPOSITORY ?? 'standhigher/shopify-polaris-table';
const [organizationName = 'standhigher', projectName = 'shopify-polaris-table'] = repository.split('/');
const isGitHubPagesBuild = process.env.GITHUB_ACTIONS === 'true';

const config: Config = {
  title: 'Shopify Polaris Table',
  tagline: 'Server-driven data tables for Shopify Polaris',
  url: process.env.DOCUSAURUS_URL ?? `https://${organizationName}.github.io`,
  baseUrl: process.env.DOCUSAURUS_BASE_URL ?? (isGitHubPagesBuild ? `/${projectName}/` : '/'),
  organizationName,
  projectName,
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'throw',
  trailingSlash: false,
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh-CN'],
    localeConfigs: {
      en: {
        htmlLang: 'en',
        label: 'English',
      },
      'zh-CN': {
        htmlLang: 'zh-CN',
        label: '简体中文',
      },
    },
  },
  presets: [
    [
      'classic',
      {
        docs: {
          path: 'docs',
          routeBasePath: '/',
          sidebarPath: './sidebars.cjs',
          editUrl: `https://github.com/${repository}/tree/main/website/`,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      },
    ],
  ],
  themeConfig: {
    navbar: {
      title: 'Shopify Polaris Table',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          type: 'localeDropdown',
          position: 'right',
        },
        {
          href: `https://github.com/${repository}`,
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'json5', 'typescript', 'tsx'],
    },
  },
};

export default config;
