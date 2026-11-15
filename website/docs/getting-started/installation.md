---
id: installation
sidebar_position: 1
title: Installation
---

## Choose the correct major version

The two version lines serve different application stacks. **V2 is not a drop-in upgrade for V1. Pin the major version instead of relying on an unqualified install.**

| Version | Appropriate use | React / UI stack | Maintenance |
|---|---|---|---|
| `v1.x` | Existing Polaris React apps that are not migrating their UI stack | React 18 + Polaris React 12–13 for the Admin renderer | `maintenance/v1.x` |
| `v2.x` | New apps or apps explicitly migrating to Polaris 2 Web Components | React 19 + host-loaded Polaris 2 Runtime; no Polaris React AppProvider | V2 `main` |

V1 consumers should keep their existing AppProvider, CSS and React 18 setup:

```bash
npm install @standhigher/polaris-data-table@^1
```

V2 is locally prepared as `2.0.0` but is not published yet. **Only after V2 has been published**, use:

```bash
npm install @standhigher/polaris-data-table@^2 react@19 react-dom@19
```

Do not switch a V1 app to `@^2` without migrating its renderer, React peers and Runtime loading. The current registry `latest` remains V1 until a separately authorized V2 publication.

The host application must load the Polaris 2 Runtime before mounting the table. Pin an exact release during validation, or use the stable 2.x channel in production:

```html
<script src="https://cdn.shopify.com/shopifycloud/polaris-2.0.js"></script>
```

The package does not inject the script, register custom elements, import a CDN, or require `@shopify/polaris` React `AppProvider`. TypeScript consumers can install the matching type package for editor support:

```bash
npm install --save-dev @shopify/polaris-types@2.0.0
```

The V2 renderer uses documented `s-*` elements such as `s-table`, `s-search-field`, `s-select`, and `s-checkbox`. Runtime registration and merchant theme styling remain host responsibilities. Extension-only applications can import the independent entrypoint:

```tsx
import {ExtensionTable} from '@standhigher/polaris-data-table/extension';
```

No source or other deep import path is supported. The table package does not install a data client or router. The application owns requests, authentication, URL integration, and errors. Continue with the [first controlled table](./first-table).

For a local documentation preview, run `npm run docs:build` and then `npm run docs:start` from the repository root. The public site is designed for GitHub Pages.

> V2 is currently under development and has not been published. Existing V1 consumers should remain on the React 18 / Polaris React release line until a V2 release and migration guide are published.
