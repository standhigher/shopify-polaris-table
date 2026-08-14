---
id: filters-and-query-contract
sidebar_position: 2
title: 筛选与 query 契约
---

`TableQuery.filters` 是从稳定业务字段名到类型化 `TableFilterValue` 的 record。仅发送 JSON-safe scalar 值（`string`、有限的 `number` 或 `boolean`）和受支持的 operator。展示 label 不是 filter value。

```ts
const query = {
  page: 1,
  pageSize: 25,
  filters: {
    status: {operator: 'in', value: ['open', 'paid']},
    createdAt: {operator: 'between', value: {from: '2026-01-01', to: '2026-01-31'}},
    archived: {operator: 'equals', value: false},
  },
} as const;
```

支持的 operator 为 `equals`、`notEquals`、`contains`、`in`、`notIn`、`between`、`isEmpty` 和 `isNotEmpty`。`contains` 接受 string；`between` 接受 string 或 number 边界；`in` 和 `notIn` 接受非空 scalar 值数组。

用 `TableFilterDefinition` 定义面向用户的控件，但仍要在 server 再次校验 request。该包建模 client state；它不会为字段授权，也不会将 filter 翻译为 database query。

`cleanFilters` 会在状态更新前移除空值。条件改变必须将从 1 开始的页码重置为 1。若需可分享的 query state，请使用[URL state、已保存视图与预设](./url-state-saved-views-presets)中的 allowlisted URL adapter。

:::caution 在每个边界维护 allowlist

对调用者可使用的 sortable fields、filter fields、operators 和 values 都使用 allowlist。即使 `decodeTableQuery` 会拒绝格式错误的 filters，也应将 URL 和 browser state 视为不可信输入。

:::
