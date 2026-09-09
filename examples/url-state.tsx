import {useEffect, useState} from 'react';

import {
  decodeTableQuery,
  encodeTableQuery,
  Table,
  type TableDataPage,
  type TableQuery,
} from '../src';

type Product = {id: string; title: string; status: string};

const urlOptions = {
  filterKeys: ['status'],
  sortKeys: ['title', 'status'],
  pageSizeOptions: [25, 50, 100],
} as const;

function readQueryFromLocation(): TableQuery {
  return decodeTableQuery(new URLSearchParams(window.location.search), urlOptions);
}

/** Router-free URL state: any router can replace the History API calls below. */
export function UrlStateExample({page}: {page: TableDataPage<Product>}) {
  const [query, setQuery] = useState(readQueryFromLocation);
  const [selection, setSelection] = useState({mode: 'explicit' as const, ids: [] as string[]});

  useEffect(() => {
    const restoreQuery = () => setQuery(readQueryFromLocation());
    window.addEventListener('popstate', restoreQuery);
    return () => window.removeEventListener('popstate', restoreQuery);
  }, []);

  const updateQuery = (nextQuery: TableQuery) => {
    const url = new URL(window.location.href);
    url.search = encodeTableQuery(nextQuery, urlOptions).toString();
    window.history.pushState(null, '', url);
    setQuery(nextQuery);
  };

  return <Table
    columns={[
      {key: 'title', title: 'Product', sortable: true},
      {key: 'status', title: 'Status', type: 'status', sortable: true},
    ]}
    data={page.data}
    rowId="id"
    query={query}
    pagination={{total: page.total}}
    formatOptions={{locale: 'en-US', timeZone: 'UTC'}}
    selection={selection}
    onSelectionChange={setSelection}
    onQueryChange={updateQuery}
  />;
}
