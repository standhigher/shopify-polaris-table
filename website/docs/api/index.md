---
id: api-index
sidebar_position: 1
title: API overview
---

Generated signatures and TypeScript types are available in the [API reference](/api/reference). This page groups the public exports by purpose and records behavioral rules that signatures alone cannot express.

## Table and query

Use `Table`, `TableProps`, `TableQuery`, `TableDataPage`, `TablePagination`, `useTableQuery`, and `cleanFilters` for the controlled V1 experience. `TableQuery.page` is one-based; the package does not fetch data, and criteria changes reset page 1.

## Columns and formatters

Use `TableColumn`, `TableFilterDefinition`, `renderCell`, `getColumnValue`, `formatText`, `formatNumber`, `formatMoney`, `formatDateTime`, `resolveCurrencyCode`, and formatter presets. The application always supplies locale and timezone; currency resolves from the row/column before the table default.

## Selection and actions

Use `TableSelection`, `TableBulkAction`, `TableBulkActionResult`, `TableSelectAllMatchingResult`, `createIdempotencyKey`, `isSelectionExpired`, and `shouldClearSelection`. An `allMatching` selection token is server-issued and query-bound; bulk calls need an idempotency key.

## URL state, views, and presets

Use `encodeTableQuery` and `decodeTableQuery` with `TableQueryUrlOptions` to safely serialize allowlisted filters. Use column visibility helpers, `TableFilterPreset` / `applyFilterPreset`, `TableViewRepository`, and `createTableViewManager` for application-owned persistence.

## V3 advanced helpers

The V3 exports include cursor/infinite helpers, virtual-window calculation, column layout, expandable rows, and inline-edit sessions. They are pure state helpers: applications and renderers own fetching, DOM, storage, and persistence.

## V4 core and adapter

Use `CoreSchema`, `CoreQuery`, `CoreSelection`, and their helper functions to model UI-independent data behavior. `createPolarisRendererAdapter` and `assertPolarisRendererAdapter` form the explicit boundary from those contracts to a Polaris renderer.

For package-wide symbols, start with the [generated reference index](/api/reference). For integration rules, prefer the guides over inferred behavior from type signatures.
