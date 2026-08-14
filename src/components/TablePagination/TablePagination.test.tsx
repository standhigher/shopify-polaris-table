import { fireEvent, screen } from '@testing-library/react';
import { render } from '../../test/setup';
import { describe, expect, it, vi } from 'vitest';
import { TablePagination } from './TablePagination';
import type { TableQuery } from '../../types/table';

const query: TableQuery = { page: 2, pageSize: 10 };

describe('TablePagination', () => {
  it('reports previous and next offset pages', () => {
    const onQueryChange = vi.fn();
    render(<TablePagination query={query} total={35} onQueryChange={onQueryChange} />);
    screen.getByRole('button', { name: /previous/i }).click();
    expect(onQueryChange).toHaveBeenCalledWith({ ...query, page: 1 });
    screen.getByRole('button', { name: /next/i }).click();
    expect(onQueryChange).toHaveBeenCalledWith({ ...query, page: 3 });
  });

  it('resets to page one when page size changes', () => {
    const onQueryChange = vi.fn();
    render(
      <TablePagination
        query={{ page: 4, pageSize: 10 }}
        total={100}
        pageSizeOptions={[10, 25]}
        onQueryChange={onQueryChange}
      />,
    );
    fireEvent.change(screen.getAllByRole('combobox', { name: /items per page/i }).at(-1)!, {target: {value: '25'}});
    expect(onQueryChange).toHaveBeenCalledWith({ page: 1, pageSize: 25 });
  });

  it('disables navigation at boundaries and for empty data', () => {
    const { rerender } = render(
      <TablePagination query={{ page: 1, pageSize: 10 }} total={0} onQueryChange={vi.fn()} />,
    );
    expect(screen.getAllByRole('button', { name: /previous/i }).at(-1)).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getAllByRole('button', { name: /next/i }).at(-1)).toHaveAttribute('aria-disabled', 'true');
    rerender(<TablePagination query={{ page: 4, pageSize: 10 }} total={35} onQueryChange={vi.fn()} />);
    expect(screen.getAllByRole('button', { name: /next/i }).at(-1)).toHaveAttribute('aria-disabled', 'true');
  });
});
