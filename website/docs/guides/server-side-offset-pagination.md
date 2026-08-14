---
id: server-side-offset-pagination
sidebar_position: 1
title: Server-side offset pagination
---

V1 queries use a **one-based page number**. Convert it to the zero-based offset expected by many APIs:

```ts
const offset = (query.page - 1) * query.pageSize;
const limit = query.pageSize;
```

An application request and response can look like this:

```json
{
  "request": {
    "offset": 25,
    "limit": 25,
    "search": "hoodie",
    "sort": {"field": "createdAt", "direction": "desc"}
  },
  "response": {
    "data": [{"id": "p_102", "title": "Hoodie"}],
    "total": 83
  }
}
```

`total` is the count for the active search, filters, and sort before pagination—not `data.length` and not a page count. Pass it as `pagination={{total: page.total}}`.

When any criteria other than `page` changes, load page 1. `useTableQuery` resets page for search, filters, sort, and page-size changes. Preserve a valid, positive `pageSize`; applications should clamp it to their supported limits before the request.

Use cursor pagination only for the separate V3 cursor state model. Do not put a cursor in V1 `TableQuery` or attempt to derive `total` from cursor pages. See [advanced V3 and V4](./advanced-v3-v4).
