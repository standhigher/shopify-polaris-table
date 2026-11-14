import {useEffect, useState} from 'react';

import {
  decodeTableQuery,
  encodeTableQuery,
  Table,
  type TableDataPage,
  type TableQuery,
  type TableSelection,
} from '../src';

type Product = {id: string; title: string; status: string};

const urlOptions = {
  filterKeys: ['status'],
  sortKeys: ['title', 'status'],
  pageSizeOptions: [25, 50, 100],
} as const;

const tableQueryParamKeys = ['v', 'page', 'pageSize', 'search', 'sort', 'filters'] as const;
const baseQuery: TableQuery = {page: 1, pageSize: 25};

function readQueryFromLocation(): TableQuery {
  if (typeof window === 'undefined') return baseQuery;
  return decodeTableQuery(new URLSearchParams(window.location.search), urlOptions);
}

function pushQueryToHistory(nextQuery: TableQuery): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  const encoded = encodeTableQuery(nextQuery, urlOptions);
  for (const key of tableQueryParamKeys) url.searchParams.delete(key);
  encoded.forEach((value, key) => url.searchParams.set(key, value));
  // Preserve unrelated query params, hash, and the caller's existing history state.
  if (url.href !== window.location.href) window.history.pushState(window.history.state, '', url);
}

/** Router-free URL state: any router can replace the History API calls below. */
export function UrlStateExample({page}: {page: TableDataPage<Product>}) {
  const [query, setQuery] = useState<TableQuery>(baseQuery);
  const [selection, setSelection] = useState<TableSelection>({mode: 'explicit', ids: []});

  useEffect(() => {
    const restoreQuery = () => setQuery(readQueryFromLocation());
    restoreQuery();
    window.addEventListener('popstate', restoreQuery);
    return () => window.removeEventListener('popstate', restoreQuery);
  }, []);

  const updateQuery = (nextQuery: TableQuery) => {
    pushQueryToHistory(nextQuery);
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
