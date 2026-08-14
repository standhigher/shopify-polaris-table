# Shopify Polaris Table

`@standhigher/shopify-polaris-table` is a controlled, server-driven data table for Shopify Polaris applications. It keeps query state, fetching, authorization, and persistence in the host application.

## Installation

```bash
npm install @standhigher/shopify-polaris-table @shopify/polaris react react-dom
```

The package expects a Polaris `AppProvider` above the table. See the [installation guide](https://standhigher.github.io/shopify-polaris-table/getting-started/installation) for the peer-dependency setup.

## Quick start

```tsx
import {useState} from 'react';
import {Table, type TableDataPage, type TableQuery, type TableSelection} from '@standhigher/shopify-polaris-table';

type Product = {id: string; title: string; price: number; currencyCode: string; createdAt: string};

export function ProductTable({page}: {page: TableDataPage<Product>}) {
  const [query, setQuery] = useState<TableQuery>({page: 1, pageSize: 25});
  const [selection, setSelection] = useState<TableSelection>({mode: 'explicit', ids: []});

  return <Table
    columns={[
      {key: 'title', title: 'Product', sortable: true},
      {key: 'price', title: 'Price', type: 'money', currencyCode: (row: Product) => row.currencyCode},
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

`Table` does not fetch data. When `onQueryChange` receives a new `TableQuery`, the application loads `{data, total}` and supplies it back to the component.

## Contracts to keep explicit

- **Offset pagination:** `query.page` is one-based. Derive the server offset as `(page - 1) * pageSize`; return `data` and the unfiltered `total` for the active query.
- **Filters:** use typed, JSON-safe filter values with stable, allowlisted field names. Do not send display labels as filter values.
- **Formatting:** the host application supplies `locale`, `timeZone`, and a default currency. A row or column can provide a more specific currency code.
- **Selection:** an `allMatching` selection is a server-issued, query-bound token—not a client-side list of every matching ID. Send an idempotency key with every bulk request.

## Documentation and development

Read the [English documentation site](https://standhigher.github.io/shopify-polaris-table/) for guides, examples, and generated API reference. The site includes a Simplified Chinese translation when published.

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run docs:build
npm run docs:start
```
