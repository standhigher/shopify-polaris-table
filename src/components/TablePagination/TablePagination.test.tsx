import {fireEvent, screen} from '@testing-library/react';
import {render} from '../../test/setup';
import {describe, expect, it, vi} from 'vitest';
import {getTablePaginationFlags, TablePagination} from './TablePagination';
import type {TableQuery} from '../../types/table';

const query: TableQuery = {page: 2, pageSize: 10};

describe('TablePagination', () => {
  it('reports the offset page summary without duplicating table navigation', () => {
    const {container} = render(<TablePagination query={query} total={35} onQueryChange={vi.fn()} />);
    expect(screen.getByText('Table pagination: 2 of 4 · 35 items')).toBeInTheDocument();
    expect(container.querySelector('s-text')).toHaveAttribute('aria-live', 'polite');
    expect(container.querySelectorAll('s-button')).toHaveLength(0);
    expect(getTablePaginationFlags(query, 35)).toEqual({pageCount: 4, hasPrevious: true, hasNext: true});
  });

  it('resets to page one when page size changes', () => {
    const onQueryChange = vi.fn();
    const {container} = render(
      <TablePagination
        query={{page: 4, pageSize: 10}}
        total={100}
        pageSizeOptions={[10, 25]}
        onQueryChange={onQueryChange}
      />,
    );
    const select = container.querySelector('s-select');
    expect(select).not.toBeNull();
    expect(Array.from(container.querySelectorAll('s-option'), (option) => option.textContent)).toEqual(['10', '25']);
    fireEvent.change(select!, {target: {value: '25'}});
    expect(onQueryChange).toHaveBeenCalledWith({page: 1, pageSize: 25});
  });

  it('sanitizes invalid totals and page inputs without mutating or fetching', () => {
    const cases = [
      [{page: 1, pageSize: 10}, Number.NaN, {pageCount: 0, hasPrevious: false, hasNext: false}],
      [{page: 1, pageSize: 10}, Number.POSITIVE_INFINITY, {pageCount: 0, hasPrevious: false, hasNext: false}],
      [{page: 1, pageSize: 10}, -10, {pageCount: 0, hasPrevious: false, hasNext: false}],
      [{page: 0, pageSize: 10}, 35, {pageCount: 4, hasPrevious: false, hasNext: true}],
      [{page: -1, pageSize: 10}, 35, {pageCount: 4, hasPrevious: false, hasNext: true}],
      [{page: Number.NaN, pageSize: 10}, 35, {pageCount: 4, hasPrevious: false, hasNext: true}],
      [{page: Number.POSITIVE_INFINITY, pageSize: 10}, 35, {pageCount: 4, hasPrevious: false, hasNext: true}],
      [{page: 1.5, pageSize: 10}, 35, {pageCount: 4, hasPrevious: false, hasNext: true}],
      [{page: 99, pageSize: 10}, 35, {pageCount: 4, hasPrevious: true, hasNext: false}],
      [{page: 99, pageSize: 10}, 0, {pageCount: 0, hasPrevious: false, hasNext: false}],
      [{page: 1, pageSize: 0}, 35, {pageCount: 0, hasPrevious: false, hasNext: false}],
      [{page: 1, pageSize: Number.POSITIVE_INFINITY}, 35, {pageCount: 0, hasPrevious: false, hasNext: false}],
    ] as const;
    for (const [input, total, expected] of cases) expect(getTablePaginationFlags(input, total)).toEqual(expected);
  });

  it('deduplicates invalid page-size options and preserves an external current size', () => {
    const {container} = render(<TablePagination query={{page: 1, pageSize: 30}} total={100} pageSizeOptions={[10, 10, 0, -1, 25, 25, Number.NaN, Number.POSITIVE_INFINITY]} onQueryChange={vi.fn()} />);
    expect(Array.from(container.querySelectorAll('s-option'), (option) => option.textContent)).toEqual(['30', '10', '25']);
  });

  it('rejects disallowed, invalid, and loading page-size events while preserving query fields', () => {
    const onQueryChange = vi.fn();
    const baseQuery = {page: 4, pageSize: 10, search: 'shoe', filters: {status: {operator: 'equals' as const, value: 'active'}}};
    const {container, rerender} = render(<TablePagination query={baseQuery} total={100} pageSizeOptions={[10, 25]} onQueryChange={onQueryChange} />);
    const select = container.querySelector('s-select')!;
    fireEvent.change(select, {target: {value: '30'}});
    fireEvent.change(select, {target: {value: '0'}});
    expect(onQueryChange).not.toHaveBeenCalled();
    fireEvent.change(select, {target: {value: '25'}});
    expect(onQueryChange).toHaveBeenCalledWith({...baseQuery, page: 1, pageSize: 25});
    onQueryChange.mockClear();
    rerender(<TablePagination query={baseQuery} total={100} pageSizeOptions={[10, 25]} loading onQueryChange={onQueryChange} />);
    fireEvent.change(container.querySelector('s-select')!, {target: {value: '25'}});
    expect(onQueryChange).not.toHaveBeenCalled();
  });

  it('reports first, last, and empty page boundaries for the native table controls', () => {
    const {rerender} = render(<TablePagination query={{page: 1, pageSize: 10}} total={0} onQueryChange={vi.fn()} />);
    expect(screen.getByText('Table pagination: 0 of 0 · 0 items')).toBeInTheDocument();
    expect(getTablePaginationFlags({page: 1, pageSize: 10}, 0)).toEqual({pageCount: 0, hasPrevious: false, hasNext: false});
    expect(getTablePaginationFlags({page: 1, pageSize: 10}, 35)).toEqual({pageCount: 4, hasPrevious: false, hasNext: true});
    rerender(<TablePagination query={{page: 4, pageSize: 10}} total={35} onQueryChange={vi.fn()} />);
    expect(screen.getByText('Table pagination: 4 of 4 · 35 items')).toBeInTheDocument();
    expect(getTablePaginationFlags({page: 4, pageSize: 10}, 35)).toEqual({pageCount: 4, hasPrevious: true, hasNext: false});
  });

  it('uses caller-provided pagination labels', () => {
    const {container} = render(
      <TablePagination
        query={query}
        total={35}
        onQueryChange={vi.fn()}
        labels={{pagination: 'Order pages', previousPage: 'Older orders', nextPage: 'Newer orders', itemsPerPage: 'Orders per page'}}
      />,
    );
    expect(screen.getByText('Order pages: 2 of 4 · 35 items')).toBeInTheDocument();
    expect(container.querySelector('s-select')).toHaveProperty('label', 'Orders per page');
  });

  it('disables page size changes while loading', () => {
    const {container, rerender} = render(<TablePagination query={query} total={35} loading onQueryChange={vi.fn()} />);
    expect(container.querySelector('s-select')).toHaveProperty('disabled', true);
    rerender(<TablePagination query={query} total={35} onQueryChange={vi.fn()} />);
    expect(container.querySelector('s-select')).toHaveProperty('disabled', false);
  });
});
