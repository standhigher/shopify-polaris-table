---
id: first-table
sidebar_position: 2
title: Your first controlled table
---

`Table` is controlled: retain every piece of state in the screen that owns the table. The screen fetches a `TableDataPage<T>` for the current `TableQuery` and passes the page back into `Table`.

```tsx
import {useState} from 'react';
import {
  Table,
  type TableDataPage,
  type TableQuery,
  type TableSelection,
} from '@standhigher/polaris-data-table';

type Order = {id: string; name: string; total: number; currencyCode: string; createdAt: string};

export function OrdersTable({page}: {page: TableDataPage<Order>}) {
  const [query, setQuery] = useState<TableQuery>({page: 1, pageSize: 25});
  const [selection, setSelection] = useState<TableSelection>({mode: 'explicit', ids: []});

  return <Table
    columns={[
      {key: 'name', title: 'Order', sortable: true},
      {key: 'total', title: 'Total', type: 'money', currencyCode: (order: Order) => order.currencyCode},
      {key: 'createdAt', title: 'Created', type: 'datetime'},
    ]}
    data={page.data}
    rowId="id"
    query={query}
    pagination={{total: page.total}}
    formatOptions={{locale: 'en-US', timeZone: 'America/New_York', defaultCurrencyCode: 'USD'}}
    selection={selection}
    onSelectionChange={setSelection}
    onQueryChange={setQuery}
  />;
}
```

`TableQuery` must always include `page` and `pageSize`. `TableDataPage<T>` always includes `data` and `total`. Keep `selection` explicit even when the screen has no bulk actions so the component remains fully controlled.

When search, filters, sort, or page size changes, reset to page 1. `useTableQuery` applies that rule for its query updates; `updateCoreQuery` resets only search, sort, and filter changes. Next, define the [server-side offset pagination contract](../guides/server-side-offset-pagination).

The repository's [server query example](https://github.com/standhigher/shopify-polaris-table/blob/main/examples/server-side-query.tsx) is the smallest reference implementation; it is not a backend client.
