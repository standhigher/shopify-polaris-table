---
id: installation
sidebar_position: 1
title: Installation
---

Install the table library with its peer dependencies:

```bash
npm install @standhigher/polaris-data-table @shopify/polaris react react-dom
```

The Admin entrypoint supports `@shopify/polaris >=12 <14`, React 18, and React DOM 18. Keep the Polaris version aligned with the rest of your application.

Extension-only applications can install only React and React DOM, then import from the official extension entrypoint:

```bash
npm install @standhigher/polaris-data-table react react-dom
```

```tsx
import {ExtensionTable} from '@standhigher/polaris-data-table/extension';
```

No source or other deep import path is supported.

Wrap application screens in the Polaris provider before rendering a table:

```tsx
import {AppProvider} from '@shopify/polaris';
import enTranslations from '@shopify/polaris/locales/en.json';

export function App() {
  return <AppProvider i18n={enTranslations}>{/* routes and table screens */}</AppProvider>;
}
```

The table package does not install a data client or router. The application owns requests, authentication, URL integration, and errors. Continue with the [first controlled table](./first-table).

For a local documentation preview, run `npm run docs:build` and then `npm run docs:start` from the repository root. The public site is designed for GitHub Pages.
