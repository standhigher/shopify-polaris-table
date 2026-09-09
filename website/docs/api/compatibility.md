---
id: compatibility
sidebar_position: 3
title: Compatibility matrix
slug: /api/compatibility
---

## Supported dependency ranges

The package declares the following compatibility contract for the 1.0 line:

| Dependency | Declared range | Validation status |
| --- | --- | --- |
| Node.js | `>=20` | CI runs the core verification suite on Node.js 20, 22, and 24. |
| React / React DOM | `>=18 <19` | React 18 is the supported and checked-in development baseline. |
| Shopify Polaris | `>=12 <14` | Polaris 12 and 13 are covered by packed-consumer type checks; Polaris 13 is the checked-in renderer-test baseline. |

Shopify Polaris is an optional peer only for `@standhigher/polaris-data-table/extension`. The package root includes the Admin renderer and requires Polaris at runtime.

The Node.js matrix runs unit, package-consumer, type, lint, build, Storybook-build, and package-content checks. It ensures a supported Node runtime cannot drift from the package's declared minimum unnoticed.

## 1.x compatibility gate

Before each 1.x release, run the public consumer and renderer tests for the supported React 18 and Polaris 12/13 combinations. Record the exact versions, command output, browser coverage, and any known limitation in the release evidence. A broad peer range is not itself proof of runtime compatibility.

Polaris React 12 and 13 themselves declare React 18 peer dependencies. At the time this policy was written, Polaris React 13 is the latest published major, so React 19 and Polaris 14 are intentionally excluded rather than being unsupported promises.

Applications should treat the root import path as the compatibility boundary. Internal experiments are intentionally absent from the npm tarball and are not versioned API.
