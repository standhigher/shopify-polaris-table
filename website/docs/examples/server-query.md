---
id: server-query
sidebar_position: 1
title: Server query example
---

Use this pattern when the application already owns a page loader and needs the table to render the latest server page. The complete source is [examples/server-side-query.tsx](https://github.com/standhigher/shopify-polaris-table/blob/main/examples/server-side-query.tsx).

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

Connect `query` to your loader. Convert its one-based page into an offset, send only allowlisted sort/filter fields, then provide `{data, total}` to the example's `products` and `total` props. The example intentionally does not contain a `fetch` call, endpoint URL, or authorization logic.

For errors and empty results, pass `error`, `emptyState`, and optionally `onRetry`; while loading, pass `loading`. Keep the prior query visible until the application replaces it with a successful response.

Read [server-side offset pagination](../guides/server-side-offset-pagination) and [locale, currency, and time zone](../guides/locale-currency-timezone) before adapting the example.
