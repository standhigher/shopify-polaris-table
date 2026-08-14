---
id: first-table
sidebar_position: 2
title: 第一个受控表格
---

`Table` 是受控组件：请在拥有该表格的页面中保存每一份状态。页面针对当前 `TableQuery` 获取 `TableDataPage<T>`，并将这一页数据传回 `Table`。

```tsx
import {useState} from 'react';
import {
  Table,
  type TableDataPage,
  type TableQuery,
  type TableSelection,
} from '@standhigher/shopify-polaris-table';

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

`TableQuery` 必须始终包含 `page` 和 `pageSize`。`TableDataPage<T>` 必须始终包含 `data` 和 `total`。即使页面没有批量操作，也应保持显式 `selection`，使组件完全受控。

当搜索、筛选、排序或 page size 改变时，请重置到第 1 页。`useTableQuery` 会在更新 query 时应用此规则；`updateCoreQuery` 仅在搜索、排序和筛选改变时重置。接下来请定义[服务端 offset 分页契约](../guides/server-side-offset-pagination)。

仓库中的 [server query example](https://github.com/standhigher/shopify-polaris-table/blob/main/examples/server-side-query.tsx) 是最小参考实现；它不是后端 client。
