# Polaris Data Table

[![npm version](https://img.shields.io/npm/v/%40standhigher%2Fpolaris-data-table?style=flat-square)](https://www.npmjs.com/package/@standhigher/polaris-data-table)
[![npm downloads](https://img.shields.io/npm/dm/%40standhigher%2Fpolaris-data-table?style=flat-square)](https://www.npmjs.com/package/@standhigher/polaris-data-table)
[![CI](https://github.com/standhigher/shopify-polaris-table/actions/workflows/ci.yml/badge.svg)](https://github.com/standhigher/shopify-polaris-table/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Documentation](https://img.shields.io/badge/docs-GitHub%20Pages-222?style=flat-square&logo=githubpages)](https://standhigher.github.io/shopify-polaris-table/)
[![Storybook](https://img.shields.io/badge/Storybook-preview-FF4785?style=flat-square&logo=storybook&logoColor=white)](https://standhigher.github.io/shopify-polaris-table/storybook/)

[中文](README.zh-CN.md) · **English**

`@standhigher/polaris-data-table` is a controlled, server-driven data-table foundation for Shopify Polaris applications.

It renders familiar Polaris table UI while your application retains control of fetching, query state, authorization, URL state, and persistence.

## Links

- [npm package](https://www.npmjs.com/package/@standhigher/polaris-data-table)
- [GitHub repository](https://github.com/standhigher/shopify-polaris-table)
- [Documentation](https://standhigher.github.io/shopify-polaris-table/)
- [Storybook demo](https://standhigher.github.io/shopify-polaris-table/storybook/)
- [API reference](https://standhigher.github.io/shopify-polaris-table/api/)
- [Usage guides](https://standhigher.github.io/shopify-polaris-table/getting-started/first-table)
- [Changelog](https://github.com/standhigher/shopify-polaris-table/blob/main/CHANGELOG.md)

## Installation

```bash
npm install @standhigher/polaris-data-table @shopify/polaris react react-dom
```

The table requires `@shopify/polaris >=12 <15`, React 18 or newer, and React DOM 18 or newer. Render it under Polaris `AppProvider`; see the [installation guide](https://standhigher.github.io/shopify-polaris-table/getting-started/installation).

## Basic usage

`Table` is controlled. Keep the current query, page data, and selection in the screen that owns the table.

```tsx
import {useState} from 'react';
import {
  Table,
  type TableDataPage,
  type TableQuery,
  type TableSelection,
} from '@standhigher/polaris-data-table';

type Product = {
  id: string;
  title: string;
  price: number;
  currencyCode: string;
  createdAt: string;
};

export function ProductsTable({page}: {page: TableDataPage<Product>}) {
  const [query, setQuery] = useState<TableQuery>({page: 1, pageSize: 25});
  const [selection, setSelection] = useState<TableSelection>({
    mode: 'explicit',
    ids: [],
  });

  return (
    <Table
      columns={[
        {key: 'title', title: 'Product', sortable: true},
        {
          key: 'price',
          title: 'Price',
          type: 'money',
          currencyCode: (product: Product) => product.currencyCode,
        },
        {key: 'createdAt', title: 'Created', type: 'datetime'},
      ]}
      data={page.data}
      rowId="id"
      query={query}
      pagination={{total: page.total}}
      formatOptions={{
        locale: 'en-US',
        timeZone: 'America/New_York',
        defaultCurrencyCode: 'USD',
      }}
      selection={selection}
      onSelectionChange={setSelection}
      onQueryChange={setQuery}
    />
  );
}
```

When `onQueryChange` receives a new query, load the corresponding page on the server and pass its `{data, total}` result back to `Table`. See [your first controlled table](https://standhigher.github.io/shopify-polaris-table/getting-started/first-table) for the complete data-flow contract.

## Feature overview

| Area | What it provides |
| --- | --- |
| Controlled query and pagination | One-based, offset-compatible pagination; typed search, sort, and filter state. |
| Polaris columns and formatting | Text, number, money, status, date/time, image, actions, and custom renderers. |
| Selection and bulk actions | Explicit selection or server-issued, query-bound cross-page selection tokens. |
| URL state and views | Query encoding, visible-column state, filter presets, and saved-view helpers. |
| Advanced table primitives | Cursor data models, virtual windows, column layouts, expanded rows, and inline-edit state. |
| Renderer abstraction | A framework-neutral core schema with a Polaris renderer adapter. |

## Compatibility

| Dependency | Supported versions |
| --- | --- |
| Node.js | 20 or newer (development and CI) |
| React / React DOM | 18 or newer |
| `@shopify/polaris` | `>=12 <15` |

This package is ESM-only and ships TypeScript declarations. Its peer dependencies are intentionally not bundled.

## Examples, Storybook, and demo

- Browse the interactive [Storybook demo](https://standhigher.github.io/shopify-polaris-table/storybook/).
- Read the [server query example](https://standhigher.github.io/shopify-polaris-table/examples/server-query) for offset pagination and formatting.
- Read the [selection and bulk actions example](https://standhigher.github.io/shopify-polaris-table/examples/selection-and-actions) for server-side selection tokens.
- Use the [API reference](https://standhigher.github.io/shopify-polaris-table/api/) for exported types and functions.

## Package quality

Every change is checked by CI with tests, type checking, linting, package-entry verification, a production build, a Storybook build, and `npm pack --dry-run`.

Before opening a pull request, run:

```bash
npm run lint
npm test
npm run typecheck
npm run build
npm run build-storybook
npm run docs:build
npm pack --dry-run --registry=https://registry.npmjs.org/
```

## Local development

```bash
git clone https://github.com/standhigher/shopify-polaris-table.git
cd shopify-polaris-table
npm ci
npm run docs:start
```

Use `npm test` for the test suite, `npm run build-storybook` to generate the preview, and `npm run docs:build` to produce the complete documentation site. See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution expectations.

## Release preparation

Releases are made from merged `main` only. Verify the package contents and all checks before publishing:

```bash
npm run release:check
npm login --auth-type=web --registry=https://registry.npmjs.org/
npm publish --access public --tag latest --auth-type=web --registry=https://registry.npmjs.org/
```

Run publish from an interactive terminal so npm can open the browser authentication link for passkey, security key, or fingerprint verification. Follow the full [release guide](docs/release.md) for registry checks, versioning, annotated tags, prerelease tags, and post-publish verification.

## Contributing and support

Contributions are welcome; read [CONTRIBUTING.md](CONTRIBUTING.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md), and [SECURITY.md](SECURITY.md) first. Report reproducible problems through [GitHub Issues](https://github.com/standhigher/shopify-polaris-table/issues), and use a [private security advisory](https://github.com/standhigher/shopify-polaris-table/security/advisories/new) for vulnerabilities.

## License

[MIT](LICENSE) © StandHigher
