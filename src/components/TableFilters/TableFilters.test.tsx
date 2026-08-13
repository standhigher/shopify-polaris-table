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
});
