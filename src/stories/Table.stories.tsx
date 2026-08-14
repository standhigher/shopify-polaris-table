import {Button, ButtonGroup, Card, Text} from '@shopify/polaris';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {useMemo, useState} from 'react';

import {Table} from '../index';
import type {TableBulkAction, TableBulkActionResult, TableColumn, TableQuery, TableSelection} from '../types';

type Order = {
  id: string;
  customer: string;
  total: number;
  currencyCode: string;
  status: 'Paid' | 'Pending' | 'Refunded';
  createdAt: string;
};

const orders: readonly Order[] = [
  {id: '1001', customer: 'Ava Rodriguez', total: 128.5, currencyCode: 'USD', status: 'Paid', createdAt: '2026-08-12T14:30:00.000Z'},
  {id: '1002', customer: 'Liam Chen', total: 89.99, currencyCode: 'CAD', status: 'Pending', createdAt: '2026-08-11T09:15:00.000Z'},
  {id: '1003', customer: 'Mia Martin', total: 240, currencyCode: 'USD', status: 'Refunded', createdAt: '2026-08-10T18:45:00.000Z'},
  {id: '1004', customer: 'Noah Smith', total: 64.75, currencyCode: 'USD', status: 'Paid', createdAt: '2026-08-09T12:00:00.000Z'},
  {id: '1005', customer: 'Emma Wilson', total: 155.2, currencyCode: 'CAD', status: 'Pending', createdAt: '2026-08-08T16:10:00.000Z'},
];

const columns: readonly TableColumn<Order>[] = [
  {key: 'id', title: 'Order', type: 'text', sortable: true},
  {key: 'customer', title: 'Customer', type: 'text', sortable: true},
  {key: 'total', title: 'Total', type: 'money', align: 'end', currencyCode: (order) => order.currencyCode},
  {key: 'status', title: 'Payment status', type: 'status', statusTone: {Paid: 'success', Pending: 'warning', Refunded: 'critical'}},
  {key: 'createdAt', title: 'Created', type: 'datetime'},
];

const initialQuery: TableQuery = {page: 1, pageSize: 3};
const emptySelection: TableSelection = {mode: 'explicit', ids: []};
const formatOptions = {locale: 'en-US', timeZone: 'America/New_York', defaultCurrencyCode: 'USD'};

function useControlledTable() {
  const [query, setQuery] = useState<TableQuery>(initialQuery);
  const [selection, setSelection] = useState<TableSelection>(emptySelection);
  const visibleOrders = useMemo(() => {
    const search = query.search?.trim().toLowerCase();
    const matchingOrders = search
      ? orders.filter((order) => order.customer.toLowerCase().includes(search) || order.id.includes(search))
      : orders;
    const sortedOrders = query.sort
      ? [...matchingOrders].sort((left, right) => {
          const leftValue = String(left[query.sort?.field as keyof Order] ?? '');
          const rightValue = String(right[query.sort?.field as keyof Order] ?? '');
          return query.sort?.direction === 'asc' ? leftValue.localeCompare(rightValue) : rightValue.localeCompare(leftValue);
        })
      : matchingOrders;
    const offset = (query.page - 1) * query.pageSize;
    return {data: sortedOrders.slice(offset, offset + query.pageSize), total: sortedOrders.length};
  }, [query]);

  return {query, selection, setQuery, setSelection, visibleOrders};
}

function ControlledTableExample() {
  const {query, selection, setQuery, setSelection, visibleOrders} = useControlledTable();

  return <Table
    columns={columns}
    data={visibleOrders.data}
    rowId="id"
    query={query}
    pagination={{total: visibleOrders.total}}
    formatOptions={formatOptions}
    filters={[{key: 'customer', label: 'Customer', type: 'text', operators: ['contains']}]}
    selection={selection}
    onSelectionChange={setSelection}
    onQueryChange={setQuery}
  />;
}

function LoadingAndEmptyStateExample() {
  const [state, setState] = useState<'loading' | 'empty'>('loading');
  const [query, setQuery] = useState<TableQuery>(initialQuery);
  const [selection, setSelection] = useState<TableSelection>(emptySelection);

  return <>
    <ButtonGroup>
      <Button pressed={state === 'loading'} onClick={() => setState('loading')}>Loading state</Button>
      <Button pressed={state === 'empty'} onClick={() => setState('empty')}>Empty state</Button>
    </ButtonGroup>
    <div style={{marginTop: '1rem'}}>
      <Table
        columns={columns}
        data={state === 'loading' ? orders.slice(0, 3) : []}
        rowId="id"
        query={query}
        pagination={{total: state === 'loading' ? orders.length : 0}}
        formatOptions={formatOptions}
        selection={selection}
        onSelectionChange={setSelection}
        onQueryChange={setQuery}
        loading={state === 'loading'}
        emptyState={<Card><Text as="p" variant="bodyMd">No orders match this query.</Text></Card>}
      />
    </div>
  </>;
}

function FormattingExample() {
  const {query, selection, setQuery, setSelection, visibleOrders} = useControlledTable();

  return <Table
    columns={columns.slice(1)}
    data={visibleOrders.data}
    rowId="id"
    query={query}
    pagination={{total: visibleOrders.total}}
    formatOptions={formatOptions}
    selection={selection}
    onSelectionChange={setSelection}
    onQueryChange={setQuery}
  />;
}

function SelectionAndBulkActionExample() {
  const {query, selection, setQuery, setSelection, visibleOrders} = useControlledTable();
  const [result, setResult] = useState('Select one or more orders to archive them.');
  const bulkActions = useMemo<readonly TableBulkAction[]>(() => [{
    id: 'archive',
    content: 'Archive orders',
    perform: async ({selection: currentSelection, idempotencyKey}): Promise<TableBulkActionResult> => {
      const count = currentSelection.mode === 'allMatching'
        ? currentSelection.selectedCount - currentSelection.excludedIds.length
        : currentSelection.ids.length;
      setResult(`Archived ${count} order(s) with idempotency key ${idempotencyKey.slice(0, 8)}…`);
      return {status: 'completed', succeededCount: count, failed: [], clearSelection: true};
    },
  }], []);

  return <>
    <Table
      columns={columns}
      data={visibleOrders.data}
      rowId="id"
      query={query}
      pagination={{total: 24}}
      formatOptions={formatOptions}
      selection={selection}
      onSelectionChange={setSelection}
      onQueryChange={setQuery}
      onSelectAllMatching={async (currentQuery) => ({
        selectionToken: 'orders-query-token',
        normalizedQuery: currentQuery,
        selectedCount: 24,
        expiresAt: '2026-12-31T23:59:59.000Z',
      })}
      bulkActions={bulkActions}
    />
    <div style={{marginTop: '1rem'}}><Text as="p" variant="bodySm">{result}</Text></div>
  </>;
}

const meta = {
  title: 'Components/Table',
  component: ControlledTableExample,
  parameters: {
    docs: {
      description: {
        component: 'A controlled, server-driven data table that uses offset pagination and server-issued selection tokens.',
      },
    },
  },
} satisfies Meta<typeof ControlledTableExample>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ControlledTable: Story = {render: () => <ControlledTableExample />};

export const LoadingAndEmptyState: Story = {render: () => <LoadingAndEmptyStateExample />};

export const Formatting: Story = {render: () => <FormattingExample />};

export const SelectionAndBulkAction: Story = {render: () => <SelectionAndBulkActionExample />};
