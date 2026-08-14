---
id: server-query
sidebar_position: 1
title: 服务端 query 示例
---

当应用已拥有 page loader，并需要 table 渲染最新 server page 时，使用此模式。完整源码见 [examples/server-side-query.tsx](https://github.com/standhigher/shopify-polaris-table/blob/main/examples/server-side-query.tsx)。

```tsx
const [query, setQuery] = useState<TableQuery>({page: 1, pageSize: 25});
const [selection, setSelection] = useState({mode: 'explicit' as const, ids: [] as string[]});

return <Table
  columns={[
    {key: 'title', title: 'Product', sortable: true},
    {key: 'price', title: 'Price', type: 'money', currencyCode: (row: Product) => row.currencyCode, sortable: true},
    {key: 'createdAt', title: 'Created', type: 'datetime'},
  ]}
  data={products}
  rowId="id"
  query={query}
  pagination={{total}}
  formatOptions={{locale: 'en-US', timeZone: 'America/New_York'}}
  selection={selection}
  onSelectionChange={setSelection}
  loading={loading}
  onQueryChange={setQuery}
/>;
```

将 `query` 连接到你的 loader。把它的从 1 开始的 page 转换为 offset，仅发送 allowlisted sort/filter fields，然后向示例的 `products` 和 `total` props 提供 `{data, total}`。该示例刻意不包含 `fetch` call、endpoint URL 或 authorization logic。

对于 errors 和 empty results，传入 `error`、`emptyState`，以及可选的 `onRetry`；加载期间传入 `loading`。在应用使用成功 response 替换 prior query 之前，让它保持可见。

在改造示例前，请阅读[服务端 offset 分页](../guides/server-side-offset-pagination)和[语言区域、币种与时区](../guides/locale-currency-timezone)。
