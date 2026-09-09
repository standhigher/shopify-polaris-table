---
id: api-stability
sidebar_position: 2
title: API stability and support policy
slug: /api/stability
---

The package root (`@standhigher/polaris-data-table`) and the Extension-only entrypoint (`@standhigher/polaris-data-table/extension`) are the only supported import paths. The Extension entrypoint excludes the Admin renderer and does not require Shopify Polaris. This page records the 1.0 API-freeze boundary and the support level of each capability. The supported runtime and peer-dependency targets are recorded in the [compatibility matrix](/api/compatibility).

## Stable API

The following root exports are stable in the 1.0 line. Their signatures and documented behavior follow the compatibility and deprecation policy below.

| Area | Root exports |
| --- | --- |
| Controlled Admin tables | `Table`, `TableColumnVisibility`, `TableFilterPresets`, `TableViews`, and their public props/types from the root entrypoint |
| Extension table | `ExtensionTable`, `EXTENSION_TABLE_MAX_COLUMNS`, and Extension types from `@standhigher/polaris-data-table/extension` |
| Query and selection | `useTableQuery`, `cleanFilters`, the `Table*` query/selection/action types, `createIdempotencyKey`, `isSelectionExpired`, and `shouldClearSelection` |
| Columns and formatting | `renderCell`, `getColumnValue`, formatter functions, `shopifyFormatterPreset`, and domain column factories |
| Application-owned state | URL query codecs, visible-column helpers, filter presets, saved-view manager contracts, and their public types |
| Renderer boundary | `CoreSchema`, `CoreQuery`, `CoreSelection`, their helpers, and the Polaris renderer adapter contract |

Anything in this table must be imported from one of those two documented entrypoints; source paths and undocumented built-file paths are not public API.

## Preview-level public helpers

The V3 cursor, virtual-window, column-layout, expandable-row, and inline-edit helpers are preview-level public pure-state helpers. They do not render UI, fetch data, or persist state. Until their host and accessibility contracts have production evidence, consumers should wrap them behind their own integration boundary and avoid treating them as complete table renderers. A promotion to stable API requires a documented migration path.

## Internal experiments

Components under `src/experimental` and their Storybook scenarios are internal validation artifacts. They are neither root exports nor npm package contents. Their purpose is to collect implementation and accessibility evidence for a future opt-in API; they may be changed or removed without a migration path.

## Deprecated API policy

There are currently no deprecated root exports. After 1.0, a stable API is deprecated only by adding a documentation notice and a changelog entry that names the replacement. It remains available for the rest of the current major line and for at least one subsequent minor release. Removal is reserved for the next major release and must include a migration guide with before-and-after examples.

## Compatibility commitment

Every stable public export has a documented support level and consumer-package verification. Internal experiments and undocumented deep imports are not covered by this commitment.
