import { fireEvent, screen, waitFor } from '@testing-library/react';
import { Text } from '@shopify/polaris';
import { render } from '../../test/setup';
import { describe, expect, it, vi } from 'vitest';
import { Table } from './Table';
import type { TableColumn, TableProps } from '../../types/table';

type Row = { id: string; name: string; amount: number };
const columns: TableColumn<Row>[] = [
  { key: 'name', title: 'Name', type: 'text', sortable: true },
  { key: 'amount', title: 'Amount', type: 'number' },
];
const baseProps: TableProps<Row> = {
  columns,
  data: [{ id: '1', name: 'Shoe', amount: 2 }],
  rowId: 'id',
  query: { page: 1, pageSize: 10 },
  pagination: { total: 1 },
  formatOptions: { locale: 'en-US', timeZone: 'UTC' },
  selection: { mode: 'explicit', ids: [] },
  onSelectionChange: vi.fn(),
  onQueryChange: vi.fn(),
};

describe('Table', () => {
  it('renders headings, cells, and sort interaction', () => {
    const onQueryChange = vi.fn();
    render(<Table {...baseProps} onQueryChange={onQueryChange} />);
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByText('Shoe')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    screen.getAllByRole('button', { name: 'Name' }).at(-1)?.click();
    expect(onQueryChange).toHaveBeenCalledWith({ ...baseProps.query, sort: { field: 'name', direction: 'desc' } });
  });

  it('prioritizes error, loading, then empty over rows', () => {
    const { rerender } = render(<Table {...baseProps} error="Could not load" />);
    expect(screen.getByText('Could not load')).toBeInTheDocument();
    rerender(<Table {...baseProps} loading />);
    expect(screen.getAllByText(/loading/i).length).toBeGreaterThan(0);
    rerender(<Table {...baseProps} data={[]} pagination={{ total: 0 }} emptyState="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('shows a loading state before the first page arrives', () => {
    render(<Table {...baseProps} data={[]} pagination={{total: 0}} loading />);
    expect(screen.getByRole('status', {name: 'Loading'})).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('uses the custom retry label for an error state', () => {
    render(<Table {...baseProps} error="Could not load" onRetry={() => undefined} labels={{retry: 'Try again'}} />);
    expect(screen.getByRole('button', {name: 'Try again'})).toBeInTheDocument();
  });

  it('upgrades an explicit page selection to a server-issued all-matching token', async () => {
    const onSelectionChange = vi.fn();
    const onSelectAllMatching = vi.fn().mockResolvedValue({
      selectionToken: 'server-token',
      normalizedQuery: baseProps.query,
      selectedCount: 42,
      expiresAt: '2030-01-01T00:00:00.000Z',
    });
    render(
      <Table
        {...baseProps}
        pagination={{total: 42}}
        selection={{mode: 'explicit', ids: ['1']}}
        onSelectionChange={onSelectionChange}
        onSelectAllMatching={onSelectAllMatching}
      />,
    );
    fireEvent.click(screen.getByRole('button', {name: /select all 42 matching results/i}));
    await waitFor(() => expect(onSelectAllMatching).toHaveBeenCalledWith(baseProps.query));
    expect(onSelectionChange).toHaveBeenCalledWith({
      mode: 'allMatching',
      selectionToken: 'server-token',
      selectedCount: 42,
      expiresAt: '2030-01-01T00:00:00.000Z',
      excludedIds: [],
    });
  });

  it('clears an all-matching selection when the controlled query changes', () => {
    const onSelectionChange = vi.fn();
    const {rerender} = render(
      <Table
        {...baseProps}
        selection={{mode: 'allMatching', selectionToken: 'token', selectedCount: 1, expiresAt: '2030-01-01T00:00:00.000Z', excludedIds: []}}
        onSelectionChange={onSelectionChange}
      />,
    );
    rerender(<Table {...baseProps} query={{...baseProps.query, search: 'new'}} selection={{mode: 'allMatching', selectionToken: 'token', selectedCount: 1, expiresAt: '2030-01-01T00:00:00.000Z', excludedIds: []}} onSelectionChange={onSelectionChange} />);
    expect(onSelectionChange).toHaveBeenCalledWith({mode: 'explicit', ids: []});
  });

  it('keeps row actions separate from row selection and renders an actions heading', () => {
    const onSelectionChange = vi.fn();
    const rowAction = vi.fn();
    render(
      <Table
        {...baseProps}
        selection={{mode: 'explicit', ids: []}}
        onSelectionChange={onSelectionChange}
        rowActions={[{id: 'view', content: <Text as="span">View</Text>, perform: rowAction}]}
      />,
    );

    expect(screen.getByRole('columnheader', {name: 'Actions'})).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'View'}));

    expect(rowAction).toHaveBeenCalledWith({row: baseProps.data[0], rowId: '1'});
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('renders completed bulk action results including partial failures', async () => {
    const onSelectionChange = vi.fn();
    render(
      <Table
        {...baseProps}
        selection={{mode: 'explicit', ids: ['1']}}
        onSelectionChange={onSelectionChange}
        bulkActions={[{
          id: 'archive',
          content: 'Archive',
          perform: vi.fn().mockResolvedValue({
            status: 'completed',
            succeededCount: 1,
            failed: [{id: '2', reason: 'Locked'}],
            clearSelection: false,
          }),
        }]}
      />,
    );

    fireEvent.click(screen.getAllByRole('button', {name: 'Archive'}).at(-1)!);
    await waitFor(() => expect(screen.getByText(/1 succeeded, 1 failed/i)).toBeInTheDocument());
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('renders accepted bulk action operation ids and clears selection when requested', async () => {
    const onSelectionChange = vi.fn();
    render(
      <Table
        {...baseProps}
        selection={{mode: 'explicit', ids: ['1']}}
        onSelectionChange={onSelectionChange}
        bulkActions={[{
          id: 'archive',
          content: 'Archive',
          perform: vi.fn().mockResolvedValue({
            status: 'accepted',
            operationId: 'op-1',
            acceptedCount: 1,
            clearSelection: true,
          }),
        }]}
      />,
    );

    fireEvent.click(screen.getAllByRole('button', {name: 'Archive'}).at(-1)!);
    await waitFor(() => expect(screen.getByText(/operation op-1/i)).toBeInTheDocument());
    expect(onSelectionChange).toHaveBeenCalledWith({mode: 'explicit', ids: []});
  });

  it('clears expired all-matching selection before actions can use it', async () => {
    const onSelectionChange = vi.fn();
    render(
      <Table
        {...baseProps}
        selection={{mode: 'allMatching', selectionToken: 'expired', selectedCount: 1, expiresAt: '2000-01-01T00:00:00.000Z', excludedIds: []}}
        onSelectionChange={onSelectionChange}
      />,
    );

    await waitFor(() => expect(onSelectionChange).toHaveBeenCalledWith({mode: 'explicit', ids: []}));
    expect(screen.getByText(/selection has expired/i)).toBeInTheDocument();
  });

  it('uses caller-provided labels for table states and selection feedback', async () => {
    const {rerender} = render(
      <Table
        {...baseProps}
        data={[]}
        pagination={{total: 0}}
        labels={{empty: 'No orders', selectionExpired: 'Order selection expired'}}
      />,
    );
    expect(screen.getByText('No orders')).toBeInTheDocument();

    rerender(
      <Table
        {...baseProps}
        selection={{mode: 'allMatching', selectionToken: 'expired', selectedCount: 1, expiresAt: '2000-01-01T00:00:00.000Z', excludedIds: []}}
        labels={{empty: 'No orders', selectionExpired: 'Order selection expired'}}
      />,
    );
    await waitFor(() => expect(screen.getByText('Order selection expired')).toBeInTheDocument());
  });

  it('renders only controlled visible columns and keeps required columns visible', async () => {
    const onVisibleColumnsChange = vi.fn();
    render(
      <Table
        {...baseProps}
        visibleColumnKeys={['amount']}
        requiredColumnKeys={['name']}
        onVisibleColumnsChange={onVisibleColumnsChange}
      />,
    );

    expect(screen.getByRole('columnheader', {name: 'Name'})).toBeInTheDocument();
    expect(screen.getByRole('columnheader', {name: 'Amount'})).toBeInTheDocument();
    await waitFor(() => expect(onVisibleColumnsChange).toHaveBeenCalledWith(['amount', 'name']));
  });

  it('reconciles stale visible-column preferences and removes hidden query fields', async () => {
    const onVisibleColumnsChange = vi.fn();
    const onQueryChange = vi.fn();
    const query = {
      page: 1,
      pageSize: 10,
      sort: {field: 'amount', direction: 'desc' as const},
      filters: {
        amount: {operator: 'equals' as const, value: 2},
        name: {operator: 'contains' as const, value: 'Shoe'},
      },
    };
    render(
      <Table
        {...baseProps}
        query={query}
        visibleColumnKeys={['name', 'removed']}
        onVisibleColumnsChange={onVisibleColumnsChange}
        onQueryChange={onQueryChange}
      />,
    );

    expect(screen.queryByRole('columnheader', {name: 'Amount'})).not.toBeInTheDocument();
    await waitFor(() => expect(onVisibleColumnsChange).toHaveBeenCalledWith(['name']));
    await waitFor(() => expect(onQueryChange).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      filters: {name: {operator: 'contains', value: 'Shoe'}},
    }));
  });
});
