import { fireEvent, screen, waitFor } from '@testing-library/react';
import { render } from '../../test/setup';
import { describe, expect, it, vi } from 'vitest';
import { TableFilters } from './TableFilters';
import type { TableFilterDefinition, TableQuery } from '../../types/table';

describe('TableFilters', () => {
  it('writes typed search and filter values while resetting page', async () => {
    const onQueryChange = vi.fn();
    const query: TableQuery = { page: 3, pageSize: 20 };
    const filters: TableFilterDefinition[] = [
      { key: 'status', label: 'Status', type: 'select', operators: ['equals'], options: [{ label: 'Active', value: 'active' }] },
      { key: 'enabled', label: 'Enabled', type: 'boolean', operators: ['equals'] },
    ];
    render(<TableFilters query={query} filters={filters} onQueryChange={onQueryChange} searchDebounceMs={0} />);
    const search = screen.getByRole('textbox');
    fireEvent.change(search, { target: { value: 'shoe' } });
    await waitFor(() => expect(onQueryChange).toHaveBeenCalledWith({ ...query, page: 1, search: 'shoe' }));
  });

  it('removes empty values without dropping false', async () => {
    const onQueryChange = vi.fn();
    const query: TableQuery = { page: 2, pageSize: 10, filters: { enabled: { operator: 'equals', value: true } } };
    render(
      <TableFilters
        query={query}
        filters={[{ key: 'enabled', label: 'Enabled', type: 'boolean', operators: ['equals'] }]}
        onQueryChange={onQueryChange}
        searchDebounceMs={0}
      />,
    );
    fireEvent.click(screen.getByRole('checkbox', { name: /enabled/i }));
    expect(onQueryChange).toHaveBeenCalledWith({ page: 1, pageSize: 10, filters: { enabled: { operator: 'equals', value: false } } });
  });

  it('renders both date range boundaries and preserves a partial range', () => {
    const onQueryChange = vi.fn();
    render(
      <TableFilters
        query={{page: 2, pageSize: 10}}
        filters={[{key: 'createdAt', label: 'Created', type: 'date-range', operators: ['between']}]}
        onQueryChange={onQueryChange}
        searchDebounceMs={0}
      />,
    );

    fireEvent.change(screen.getByRole('textbox', {name: /created from/i}), {target: {value: '2026-01-01'}});
    expect(onQueryChange).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      filters: {createdAt: {operator: 'between', value: {from: '2026-01-01'}}},
    });

    expect(screen.getByRole('textbox', {name: /created to/i})).toBeInTheDocument();
  });

  it('uses only an operator declared by the filter definition', () => {
    const onQueryChange = vi.fn();
    render(
      <TableFilters
        query={{page: 1, pageSize: 10}}
        filters={[{key: 'status', label: 'Status', type: 'select', operators: ['notEquals'], options: [{label: 'Active', value: 'active'}]}]}
        onQueryChange={onQueryChange}
        searchDebounceMs={0}
      />,
    );

    fireEvent.change(screen.getByRole('combobox', {name: /status/i}), {target: {value: 'active'}});
    expect(onQueryChange).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      filters: {status: {operator: 'notEquals', value: 'active'}},
    });
  });
});
