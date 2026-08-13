import {useState} from 'react';

import {Table, type TableQuery} from '../src';

type Order = {id: string; name: string; status: string};

export function SelectionAndActionsExample({orders, total}: {orders: Order[]; total: number}) {
  const [query, setQuery] = useState<TableQuery>({page: 1, pageSize: 25});
  const [selection, setSelection] = useState({mode: 'explicit' as const, ids: [] as string[]});

  return <Table
    columns={[{key: 'name', title: 'Order'}, {key: 'status', title: 'Status', type: 'status'}]}
    data={orders}
    rowId="id"
    query={query}
    pagination={{total}}
    formatOptions={{locale: 'en-US', timeZone: 'America/New_York', defaultCurrencyCode: 'USD'}}
    selection={selection}
    onSelectionChange={setSelection}
    onSelectAllMatching={async (currentQuery) => ({
      selectionToken: await createSelectionToken(currentQuery),
      normalizedQuery: currentQuery,
      selectedCount: total,
      expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
    })}
    bulkActions={[{
      id: 'archive',
      content: 'Archive',
      perform: async ({selection: selected, idempotencyKey}) => archiveOrders(selected, idempotencyKey),
    }]}
    onQueryChange={setQuery}
  />;
}

declare function createSelectionToken(query: TableQuery): Promise<string>;
declare function archiveOrders(selection: unknown, idempotencyKey: string): Promise<{
  status: 'completed'; succeededCount: number; failed: []; clearSelection: boolean;
}>;
