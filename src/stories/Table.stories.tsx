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

type ColumnShowcaseRow = {
  id: string;
  title: string | null;
  quantity: number | null;
  amount: number | null;
  currencyCode?: string;
  status: 'Active' | 'Warning' | 'Missing';
  createdAt: string | null;
  imageUrl: string | null;
  imageAlt: string;
  customLabel: string;
};

const columnShowcaseRows: readonly ColumnShowcaseRow[] = [
  {id: 'showcase-1', title: 'Everyday tote', quantity: 24, amount: 39.95, currencyCode: 'USD', status: 'Active', createdAt: '2026-08-12T14:30:00.000Z', imageUrl: 'https://cdn.shopify.com/static/images/polaris/thumbnail-wc_src.jpg', imageAlt: 'White sneakers', customLabel: 'Featured'},
  {id: 'showcase-2', title: null, quantity: null, amount: null, status: 'Missing', createdAt: 'not-a-date', imageUrl: 'not-a-valid-image-url', imageAlt: 'Unavailable product image', customLabel: 'Needs review'},
];

const columnShowcaseColumns: readonly TableColumn<ColumnShowcaseRow>[] = [
  {key: 'title', title: 'Text', type: 'text', listSlot: 'primary'},
  {key: 'quantity', title: 'Number', type: 'number', listSlot: 'secondary', align: 'end'},
  {key: 'amount', title: 'Money', type: 'money', listSlot: 'labeled', align: 'end', currencyCode: (row) => row.currencyCode},
  {key: 'status', title: 'Status', type: 'status', listSlot: 'inline', statusTone: {Active: 'success', Warning: 'warning', Missing: 'critical'}},
  {key: 'createdAt', title: 'Datetime', type: 'datetime', listSlot: 'secondary'},
  {key: 'imageUrl', title: 'Image', type: 'image', listSlot: 'kicker', imageAlt: (row) => row.imageAlt},
  {key: 'id', title: 'Actions', type: 'actions', listSlot: 'inline', render: (_value, row) => <s-link href={`#${row.id}`}>Inspect item</s-link>},
  {key: 'customLabel', title: 'Custom', type: 'custom', listSlot: 'labeled', render: (value) => <s-badge tone="info">{String(value ?? 'No label')}</s-badge>},
];

function ColumnsAndResponsiveTypesExample() {
  const [query, setQuery] = useState<TableQuery>({page: 1, pageSize: 10});
  const [selection, setSelection] = useState<TableSelection>(emptySelection);
  const [showQuantity, setShowQuantity] = useState(true);
  const [reversed, setReversed] = useState(false);
  const [lastAction, setLastAction] = useState('No action yet');
  const activeColumns = columnShowcaseColumns.filter((column) => showQuantity || column.key !== 'quantity');
  if (reversed) activeColumns.reverse();
  return <>
    <s-stack direction="inline" gap="small">
      <s-button onClick={() => setShowQuantity((current) => !current)}>Toggle number column</s-button>
      <s-button onClick={() => setReversed((current) => !current)}>Reverse column order</s-button>
    </s-stack>
    <p role="status">{lastAction}</p>
    <Table
    columns={activeColumns}
    data={columnShowcaseRows}
    rowId="id"
    query={query}
    pagination={{total: columnShowcaseRows.length}}
    formatOptions={{locale: 'en-US', timeZone: 'America/New_York', defaultCurrencyCode: 'USD'}}
    selection={selection}
    onSelectionChange={setSelection}
    onQueryChange={setQuery}
    rowActions={[{id: 'inspect', content: <s-text>Inspect</s-text>, perform: async ({row}) => { setLastAction(`Inspected ${row.id}`); }}]}
    />
  </>;
}
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
    <s-button-group>
      <s-button variant={state === 'loading' ? 'primary' : 'secondary'} aria-pressed={state === 'loading'} onClick={() => setState('loading')}>Loading state</s-button>
      <s-button variant={state === 'empty' ? 'primary' : 'secondary'} aria-pressed={state === 'empty'} onClick={() => setState('empty')}>Empty state</s-button>
    </s-button-group>
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
        emptyState={<s-section><s-paragraph>No orders match this query.</s-paragraph></s-section>}
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
    <div style={{marginTop: '1rem'}}><s-paragraph fontSize="small">{result}</s-paragraph></div>
  </>;
}

type TablePlaygroundProps = {pageSize: number; showFilters: boolean; loading: boolean};

function TablePlayground({pageSize, showFilters, loading}: TablePlaygroundProps) {
  const {query, selection, setQuery, setSelection} = useControlledTable();
  const adjustedQuery = {...query, pageSize};
  const visibleOrders = useMemo(() => {
    const search = adjustedQuery.search?.trim().toLowerCase();
    const matchingOrders = search
      ? orders.filter((order) => order.customer.toLowerCase().includes(search) || order.id.includes(search))
      : orders;
    const sortedOrders = adjustedQuery.sort
      ? [...matchingOrders].sort((left, right) => {
          const leftValue = String(left[adjustedQuery.sort?.field as keyof Order] ?? '');
          const rightValue = String(right[adjustedQuery.sort?.field as keyof Order] ?? '');
          return adjustedQuery.sort?.direction === 'asc' ? leftValue.localeCompare(rightValue) : rightValue.localeCompare(leftValue);
        })
      : matchingOrders;
    const offset = (adjustedQuery.page - 1) * adjustedQuery.pageSize;
    return {data: sortedOrders.slice(offset, offset + adjustedQuery.pageSize), total: sortedOrders.length};
  }, [adjustedQuery]);

  return <Table
    columns={columns}
    data={visibleOrders.data}
    rowId="id"
    query={adjustedQuery}
    pagination={{total: visibleOrders.total}}
    formatOptions={formatOptions}
    {...(showFilters ? {filters: [{key: 'customer', label: 'Customer', type: 'text' as const, operators: ['contains' as const]}]} : {})}
    selection={selection}
    onSelectionChange={setSelection}
    onQueryChange={(nextQuery) => setQuery({...nextQuery, pageSize})}
    loading={loading}
  />;
}

const meta = {
  title: 'Components/Table',
  component: TablePlayground,
  parameters: {
    docs: {
      description: {
        component: 'A controlled, server-driven data table that uses offset pagination and server-issued selection tokens.',
      },
    },
  },
  argTypes: {
    pageSize: {control: {type: 'select'}, options: [2, 3, 5]},
    showFilters: {control: 'boolean'},
    loading: {control: 'boolean'},
  },
} satisfies Meta<typeof TablePlayground>;

export default meta;

type Story = StoryObj<TablePlaygroundProps>;

export const ControlledTable: Story = {render: () => <ControlledTableExample />};

export const Playground: Story = {
  args: {pageSize: 3, showFilters: true, loading: false},
  render: (args) => <TablePlayground {...args} />,
};

export const LoadingAndEmptyState: Story = {render: () => <LoadingAndEmptyStateExample />};

export const Formatting: Story = {render: () => <FormattingExample />};

export const ColumnsAndResponsiveTypes: Story = {render: () => <ColumnsAndResponsiveTypesExample />};

export const SelectionAndBulkAction: Story = {render: () => <SelectionAndBulkActionExample />};
