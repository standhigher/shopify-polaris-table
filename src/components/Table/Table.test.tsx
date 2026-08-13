import { fireEvent, screen, waitFor } from '@testing-library/react';
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
});
