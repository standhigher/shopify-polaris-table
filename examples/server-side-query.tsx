import {useState} from 'react';

import {Table, type TableQuery, type TableSelection} from '../src';

type Product = {id: string; title: string; price: number; currencyCode: string; createdAt: string};

export function ServerSideQueryExample({products, total, loading}: {products: Product[]; total: number; loading: boolean}) {
  const [query, setQuery] = useState<TableQuery>({page: 1, pageSize: 25});
  const [selection, setSelection] = useState<TableSelection>({mode: 'explicit', ids: []});

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
}
