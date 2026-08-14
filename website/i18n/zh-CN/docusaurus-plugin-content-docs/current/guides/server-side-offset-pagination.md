---
id: server-side-offset-pagination
sidebar_position: 1
title: 服务端 offset 分页
---

V1 query 使用**从 1 开始的页码**。请将其转换为许多 API 所期望的从 0 开始的 offset：

```ts
const offset = (query.page - 1) * query.pageSize;
const limit = query.pageSize;
```

应用的 request 和 response 可以如下所示：

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

`total` 是当前 search、filters 和 sort 在分页前的记录数——不是 `data.length`，也不是页数。将其作为 `pagination={{total: page.total}}` 传入。

只要 `page` 以外的任一条件改变，就加载第 1 页。`useTableQuery` 会在 search、filters、sort 和 page-size 改变时重置页码。保持有效的正数 `pageSize`；应用应在 request 之前将它限制在支持的范围内。

仅对独立的 V3 cursor state model 使用 cursor pagination。不要在 V1 `TableQuery` 中放入 cursor，也不要尝试从 cursor pages 推导 `total`。参阅[高级 V3 与 V4](./advanced-v3-v4)。
