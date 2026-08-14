import {Button, ButtonGroup, Card, Text} from '@shopify/polaris';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {useMemo, useState} from 'react';

import {Table, createProductColumns} from '../index';
import type {ProductRow} from '../index';
import type {TableColumn, TableRowAction, TableSelection} from '../types';
import {storyProducts} from './storyData';
import {defaultFormatOptions, explicitSelection, useStoryTable} from './storyTableHelpers';

const meta = {
  title: 'Components/Table',
  parameters: {
    docs: {
      description: {
        component: 'Table stories show offset pagination, filters, loading/error/empty states, row actions, and formatting warnings.',
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const statusFilters = [
  {key: 'status', label: 'Status', type: 'select' as const, operators: ['equals' as const], options: [{label: 'Active', value: 'Active'}, {label: 'Draft', value: 'Draft'}]},
] as const;

function ProductTableStory({
  pageSize = 2,
  selection,
  onSelectionChange,
  rowActions,
  onFormatWarning,
  loading,
  error,
  emptyState,
}: {
  pageSize?: number;
  selection: TableSelection;
  onSelectionChange: (selection: TableSelection) => void;
  rowActions?: readonly TableRowAction<ProductRow>[];
  onFormatWarning?: (warning: {columnKey: string; reason: 'missing-currency-code'}) => void;
  loading?: boolean;
  error?: string;
  emptyState?: string;
}) {
  const {query, setQuery, visiblePage} = useStoryTable(storyProducts, pageSize);
  const columns = createProductColumns({status: {statusTone: {Active: 'success', Draft: 'info'}}});

  return <Table
    columns={columns}
    data={visiblePage.data}
    rowId={(row) => row.id}
    query={query}
    pagination={{total: visiblePage.total}}
    formatOptions={defaultFormatOptions}
    filters={statusFilters}
    selection={selection}
    onSelectionChange={onSelectionChange}
    onQueryChange={setQuery}
    {...(rowActions ? {rowActions} : {})}
    {...(onFormatWarning ? {onFormatWarning} : {})}
    {...(loading ? {loading} : {})}
    {...(error ? {error} : {})}
    {...(emptyState ? {emptyState} : {})}
    {...(emptyState ? {onRetry: () => setQuery({page: 1, pageSize})} : {})}
  />;
}

export const ServerOffsetPagination: Story = {
  name: 'Server Offset Pagination',
  render: () => {
    const [selection, setSelection] = useState<TableSelection>(explicitSelection);
    return <ProductTableStory selection={selection} onSelectionChange={setSelection} />;
  },
};

export const SearchSortAndFilters: Story = {
  name: 'Search, Sort, and Filters',
  render: () => {
    const [selection, setSelection] = useState<TableSelection>(explicitSelection);
    return <Card>
      <Text as="p" variant="bodyMd">Filters are protocol-driven; the parent owns query state.</Text>
      <ProductTableStory selection={selection} onSelectionChange={setSelection} />
    </Card>;
  },
};

export const LoadingEmptyErrorAndRetry: Story = {
  name: 'Loading, Empty, Error, Retry',
  render: () => {
    const [mode, setMode] = useState<'loading' | 'empty' | 'error'>('loading');
    const [selection, setSelection] = useState<TableSelection>(explicitSelection);
    return <>
      <ButtonGroup>
        <Button pressed={mode === 'loading'} onClick={() => setMode('loading')}>Loading</Button>
        <Button pressed={mode === 'empty'} onClick={() => setMode('empty')}>Empty</Button>
        <Button pressed={mode === 'error'} onClick={() => setMode('error')}>Error</Button>
      </ButtonGroup>
      <div style={{marginTop: '1rem'}}>
        <ProductTableStory
          selection={selection}
          onSelectionChange={setSelection}
          {...(mode === 'loading' ? {loading: true} : {})}
          {...(mode === 'empty' ? {emptyState: 'No products match this query.'} : {})}
          {...(mode === 'error' ? {error: 'Could not load products.'} : {})}
        />
      </div>
    </>;
  },
};

export const FormatWarnings: Story = {
  name: 'Format Warnings',
  render: () => {
    const [warnings, setWarnings] = useState<string[]>([]);
    const rows = useMemo(() => storyProducts.map((row, index) => index === 0 ? {...row, currencyCode: ''} : row), []);
    const columns: readonly TableColumn<(typeof rows)[number]>[] = createProductColumns();
    return <Card>
      <Table
        columns={columns}
        data={rows}
        rowId={(row) => row.id}
        query={{page: 1, pageSize: 3}}
        pagination={{total: rows.length}}
        formatOptions={defaultFormatOptions}
        selection={explicitSelection}
        onSelectionChange={() => undefined}
        onQueryChange={() => undefined}
        onFormatWarning={(warning) => setWarnings((current) => [...current, `${warning.columnKey}:${warning.reason}`])}
      />
      <pre>{JSON.stringify(warnings, null, 2)}</pre>
    </Card>;
  },
};

export const RowActions: Story = {
  name: 'Row Actions',
  render: () => {
    const [message, setMessage] = useState('No action taken yet.');
    const [selection, setSelection] = useState<TableSelection>(explicitSelection);
    return <>
      <ProductTableStory
        selection={selection}
        onSelectionChange={setSelection}
        rowActions={[{
          id: 'view',
          content: 'View',
          perform: async ({rowId}) => { setMessage(`Viewed ${rowId}`); },
        }, {
          id: 'archive',
          content: 'Archive',
          destructive: true,
          perform: async ({rowId}) => { setMessage(`Archived ${rowId}`); },
        }]}
      />
      <div style={{marginTop: '1rem'}}><Text as="p" variant="bodySm">{message}</Text></div>
    </>;
  },
};
