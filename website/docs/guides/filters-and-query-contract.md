---
id: filters-and-query-contract
sidebar_position: 2
title: Filters and query contract
---

`TableQuery.filters` is a record of stable business field names to typed `TableFilterValue` values. Only send JSON-safe scalar values (`string`, finite `number`, or `boolean`) and the supported operators. Display labels are not filter values.

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

Supported operators are `equals`, `notEquals`, `contains`, `in`, `notIn`, `between`, `isEmpty`, and `isNotEmpty`. `contains` accepts a string; `between` accepts a string or number boundary; `in` and `notIn` accept non-empty arrays of scalar values.

Define user-facing controls with `TableFilterDefinition`, but validate the request again on the server. The package models client state; it does not authorize fields or translate a filter into a database query.

`cleanFilters` removes empty values before a state update. A criteria change must reset the one-based page to 1. For shareable query state, use the allowlisted URL adapter in [URL state, saved views, and presets](./url-state-saved-views-presets).

:::caution Allowlist at every boundary

Allowlist sortable fields, filter fields, operators, and values that a caller may use. Treat URLs and browser state as untrusted input even though `decodeTableQuery` rejects malformed filters.

:::
