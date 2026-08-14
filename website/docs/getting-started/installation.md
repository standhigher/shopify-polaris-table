---
id: installation
sidebar_position: 1
title: Installation
---

Install the table library with its peer dependencies:

```bash
npm install @standhigher/shopify-polaris-table @shopify/polaris react react-dom
```

The package supports `@shopify/polaris >=12 <15`, React 18 or newer, and React DOM 18 or newer. Keep the Polaris version aligned with the rest of your application.

Wrap application screens in the Polaris provider before rendering a table:

```tsx
import {AppProvider} from '@shopify/polaris';
import enTranslations from '@shopify/polaris/locales/en.json';

export function App() {
  return <AppProvider i18n={enTranslations}>{/* routes and table screens */}</AppProvider>;
}
```

The table package does not install a data client or router. The application owns requests, authentication, URL integration, and errors. Continue with the [first controlled table](./first-table).

For a local documentation preview, run `npm run docs:build` and then `npm run docs:start` from the repository root. The public site is designed for GitHub Pages; private operational documentation is deliberately not included in the build.
