import {Button, Card, Text} from '@shopify/polaris';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {useMemo, useState} from 'react';

import {Table, createOrderColumns} from '../index';
import type {TableBulkAction, TableBulkActionResult, TableQuery, TableSelection} from '../types';
import {storyOrders} from './storyData';
import {defaultFormatOptions, explicitSelection, useStoryTable} from './storyTableHelpers';

type SelectAllMatchingHandler = (query: TableQuery) => Promise<{
  selectionToken: string;
  normalizedQuery: TableQuery;
  selectedCount: number;
  expiresAt: string;
}>;

const meta = {
  title: 'Features/Selection',
  parameters: {
    docs: {
      description: {
        component: 'Selection stories show explicit selection, cross-page all-matching selection, and bulk action results.',
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function SelectionTable({
  selection,
  onSelectionChange,
  onSelectAllMatching,
  bulkActions,
  total = storyOrders.length,
}: {
  selection: TableSelection;
  onSelectionChange: (selection: TableSelection) => void;
  onSelectAllMatching?: SelectAllMatchingHandler;
  bulkActions?: readonly TableBulkAction[];
  total?: number;
}) {
  const {query, setQuery, visiblePage} = useStoryTable(storyOrders);

  const optionalProps = {
    ...(onSelectAllMatching ? {onSelectAllMatching} : {}),
    ...(bulkActions ? {bulkActions} : {}),
  };

  return <Table
    columns={createOrderColumns({
      financialStatus: {statusTone: {Paid: 'success', Pending: 'warning', Refunded: 'critical'}},
      fulfillmentStatus: {statusTone: {Fulfilled: 'success', Partial: 'warning', Unfulfilled: 'info'}},
    })}
    data={visiblePage.data}
    rowId="id"
    query={query}
    pagination={{total}}
    formatOptions={defaultFormatOptions}
    selection={selection}
    onSelectionChange={onSelectionChange}
    onQueryChange={setQuery}
    {...optionalProps}
  />;
}

export const ExplicitSelection: Story = {
  name: 'Explicit Selection',
  render: () => {
    const [selection, setSelection] = useState<TableSelection>(explicitSelection);
    return <SelectionTable selection={selection} onSelectionChange={setSelection} />;
  },
};

export const AllMatchingSelection: Story = {
  name: 'All Matching Selection',
  render: () => {
    const [selection, setSelection] = useState<TableSelection>(explicitSelection);
    return <SelectionTable
      selection={selection}
      onSelectionChange={setSelection}
      onSelectAllMatching={async (query) => ({
        selectionToken: 'orders-query-token',
        normalizedQuery: query,
        selectedCount: 42,
        expiresAt: '2026-12-31T23:59:59.000Z',
      })}
      total={42}
    />;
  },
};

export const BulkActionCompleted: Story = {
  name: 'Bulk Action Completed',
  render: () => {
    const [selection, setSelection] = useState<TableSelection>({mode: 'explicit', ids: ['o_1', 'o_2']});
    const [message, setMessage] = useState('Archive two orders to see a completed bulk result.');
    const bulkActions = useMemo<readonly TableBulkAction[]>(() => [{
      id: 'archive',
      content: 'Archive orders',
      perform: async ({selection: currentSelection, idempotencyKey}): Promise<TableBulkActionResult> => {
        const count = currentSelection.mode === 'allMatching'
          ? currentSelection.selectedCount - currentSelection.excludedIds.length
          : currentSelection.ids.length;
        setMessage(`Archived ${count} order(s); idempotency key ${idempotencyKey.slice(0, 8)}…`);
        return {status: 'completed', succeededCount: count, failed: [], clearSelection: true};
      },
    }], []);

    return <>
      <SelectionTable selection={selection} onSelectionChange={setSelection} bulkActions={bulkActions} total={42} />
      <div style={{marginTop: '1rem'}}><Text as="p" variant="bodySm">{message}</Text></div>
      <Card>
        <Button onClick={() => setSelection({mode: 'explicit', ids: ['o_1', 'o_2']})}>Reset selection</Button>
      </Card>
    </>;
  },
};
