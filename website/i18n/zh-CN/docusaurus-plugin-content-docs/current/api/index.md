---
id: api-index
sidebar_position: 1
title: API 概览
---

生成的 signatures 和 TypeScript types 位于 [API reference](/api/reference)。本页按用途归类 public exports，并记录仅凭 signatures 无法表达的 behavioral rules。

## Table 与 query

将 `Table`、`TableProps`、`TableQuery`、`TableDataPage`、`TablePagination`、`useTableQuery` 和 `cleanFilters` 用于受控 V1 体验。`TableQuery.page` 从 1 开始；package 不会获取数据，criteria changes 会重置到第 1 页。

## Columns 与 formatters

使用 `TableColumn`、`TableFilterDefinition`、`renderCell`、`getColumnValue`、`formatText`、`formatNumber`、`formatMoney`、`formatDateTime`、`resolveCurrencyCode` 和 formatter presets。应用始终提供 locale 和 timezone；currency 会先从 row/column 解析，再使用 table default。

## Selection 与 actions

使用 `TableSelection`、`TableBulkAction`、`TableBulkActionResult`、`TableSelectAllMatchingResult`、`createIdempotencyKey`、`isSelectionExpired` 和 `shouldClearSelection`。`allMatching` selection token 由 server 签发并与 query 绑定；bulk calls 需要 idempotency key。

## URL state、views 与 presets

结合 `TableQueryUrlOptions` 使用 `encodeTableQuery` 和 `decodeTableQuery`，以安全序列化 allowlisted filters。使用 column visibility helpers、`TableFilterPreset` / `applyFilterPreset`、`TableViewRepository` 和 `createTableViewManager` 实现 application-owned persistence。

## V3 advanced helpers

V3 exports 包含 cursor/infinite helpers、virtual-window calculation、column layout、expandable rows 和 inline-edit sessions。它们都是 pure state helpers：applications 和 renderers 负责 fetching、DOM、storage 和 persistence。

## V4 core 与 adapter

使用 `CoreSchema`、`CoreQuery`、`CoreSelection` 及其 helpers 为 UI-independent data behavior 建模。`createPolarisRendererAdapter` 和 `assertPolarisRendererAdapter` 构成从这些 contracts 到 Polaris renderer 的显式边界。

对于 package-wide symbols，请从[生成的 reference index](/api/reference)开始。对于 integration rules，请优先阅读 guides，不要从 type signatures 推断行为。
