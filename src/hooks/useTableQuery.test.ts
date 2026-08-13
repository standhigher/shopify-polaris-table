import {act, renderHook} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';

import type {TableQuery} from '../types';
import {useTableQuery} from './useTableQuery';

describe('useTableQuery', () => {
  const initial: TableQuery = {
    page: 2,
    pageSize: 25,
    search: 'old',
    sort: {field: 'name', direction: 'asc'},
    filters: {
      status: {operator: 'equals', value: 'active'},
    },
  };

  it('resets page for search, filters, and sort but preserves a complete immutable query', () => {
    const onQueryChange = vi.fn();
    const {result} = renderHook(() => useTableQuery({query: initial, onQueryChange}));

    act(() => result.current.setSearch('new'));
    expect(onQueryChange).toHaveBeenLastCalledWith({
      ...initial,
      page: 1,
      search: 'new',
    });
    expect(initial.page).toBe(2);

    act(() => result.current.setPage(4));
    expect(onQueryChange).toHaveBeenLastCalledWith({...initial, page: 4});

    act(() => result.current.setFilters({}));
    expect(onQueryChange).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 25,
      search: 'old',
      sort: initial.sort,
    });
  });

  it('cleans empty search and filters while preserving zero and false values', () => {
    const onQueryChange = vi.fn();
    const {result} = renderHook(() => useTableQuery({query: initial, onQueryChange}));

    act(() =>
      result.current.setFilters({
        quantity: {operator: 'equals', value: 0},
        archived: {operator: 'equals', value: false},
        tags: {operator: 'in', value: []},
        title: {operator: 'contains', value: ''},
        date: {operator: 'between', value: {}},
      }),
    );

    expect(onQueryChange).toHaveBeenLastCalledWith({
      ...initial,
      page: 1,
      filters: {
        quantity: {operator: 'equals', value: 0},
        archived: {operator: 'equals', value: false},
      },
    });
  });

  it('constrains page and page size to configured limits', () => {
    const onQueryChange = vi.fn();
    const {result} = renderHook(() =>
      useTableQuery({query: initial, onQueryChange, pageSizeOptions: [10, 25, 50]}),
    );

    act(() => result.current.setPage(0));
    expect(onQueryChange).toHaveBeenLastCalledWith({...initial, page: 1});

    act(() => result.current.setPageSize(99));
    expect(onQueryChange).toHaveBeenLastCalledWith({...initial, page: 1, pageSize: 25});
    act(() => result.current.setPageSize(10));
    expect(onQueryChange).toHaveBeenLastCalledWith({...initial, page: 1, pageSize: 10});
  });
});
