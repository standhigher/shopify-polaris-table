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

  it('accepts a valid page size without an allowlist and preserves query fields', () => {
    const onQueryChange = vi.fn();
    const {result} = renderHook(() => useTableQuery({query: initial, onQueryChange}));
    act(() => result.current.setPageSize(50));
    expect(onQueryChange).toHaveBeenLastCalledWith({...initial, page: 1, pageSize: 50});
    act(() => result.current.setPageSize(3));
    expect(onQueryChange).toHaveBeenLastCalledWith({...initial, page: 1, pageSize: 3});
  });

  it('rejects invalid page sizes while preserving the controlled current value', () => {
    const onQueryChange = vi.fn();
    const {result} = renderHook(() => useTableQuery({query: initial, onQueryChange}));
    for (const value of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, -10, 0, 2.5, Number.MAX_SAFE_INTEGER + 1]) {
      act(() => result.current.setPageSize(value));
      expect(onQueryChange).toHaveBeenLastCalledWith({...initial, page: 1});
    }
  });

  it('normalizes non-finite or unsafe pages without emitting NaN or Infinity', () => {
    const onQueryChange = vi.fn();
    const {result} = renderHook(() => useTableQuery({query: initial, onQueryChange}));
    for (const value of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1, -10]) {
      act(() => result.current.setPage(value));
      expect(onQueryChange).toHaveBeenLastCalledWith({...initial, page: 1});
    }
    act(() => result.current.setPage(3.8));
    expect(onQueryChange).toHaveBeenLastCalledWith({...initial, page: 3});
  });

  it('sanitizes configured page sizes and retains the existing fallback order', () => {
    const onQueryChange = vi.fn();
    const allowed = [Number.NaN, -1, 0, Number.POSITIVE_INFINITY, 2.5, 10, 10, 25, Number.MAX_SAFE_INTEGER + 1];
    const {result} = renderHook(() => useTableQuery({query: initial, onQueryChange, pageSizeOptions: allowed}));
    act(() => result.current.setPageSize(99));
    expect(onQueryChange).toHaveBeenLastCalledWith({...initial, page: 1, pageSize: 25});
    act(() => result.current.setPageSize(Number.NaN));
    expect(onQueryChange).toHaveBeenLastCalledWith({...initial, page: 1, pageSize: 25});
    act(() => result.current.setPageSize(10));
    expect(onQueryChange).toHaveBeenLastCalledWith({...initial, page: 1, pageSize: 10});
    const outside = {...initial, pageSize: 30};
    const {result: outsideResult} = renderHook(() => useTableQuery({query: outside, onQueryChange, pageSizeOptions: allowed}));
    act(() => outsideResult.current.setPageSize(99));
    expect(onQueryChange).toHaveBeenLastCalledWith({...outside, page: 1, pageSize: 10});
  });

  it('keeps an empty allowlist unrestricted and an invalid-only allowlist restrictive', () => {
    const onQueryChange = vi.fn();
    const {result} = renderHook(() => useTableQuery({query: initial, onQueryChange, pageSizeOptions: []}));
    act(() => result.current.setPageSize(50));
    expect(onQueryChange).toHaveBeenLastCalledWith({...initial, page: 1, pageSize: 50});
    const {result: invalidOnly} = renderHook(() => useTableQuery({query: initial, onQueryChange, pageSizeOptions: [Number.NaN, -1]}));
    act(() => invalidOnly.current.setPageSize(50));
    expect(onQueryChange).toHaveBeenLastCalledWith({...initial, page: 1});
  });

  it('preserves partial ranges and clears optional criteria without mutating the query', () => {
    const onQueryChange = vi.fn();
    const {result} = renderHook(() => useTableQuery({query: initial, onQueryChange}));
    act(() => result.current.setFilters({
      start: {operator: 'between', value: {from: '2026-01-01'}},
      end: {operator: 'between', value: {to: '2026-01-31'}},
      zero: {operator: 'equals', value: 0},
      disabled: {operator: 'equals', value: false},
      empty: {operator: 'between', value: {}},
    }));
    expect(onQueryChange).toHaveBeenLastCalledWith({...initial, page: 1, filters: {
      start: {operator: 'between', value: {from: '2026-01-01'}},
      end: {operator: 'between', value: {to: '2026-01-31'}},
      zero: {operator: 'equals', value: 0},
      disabled: {operator: 'equals', value: false},
    }});
    act(() => result.current.setSearch(''));
    const withoutSearch = {...initial, page: 1};
    delete withoutSearch.search;
    expect(onQueryChange).toHaveBeenLastCalledWith(withoutSearch);
    act(() => result.current.setSort(undefined));
    const withoutSort = {...initial, page: 1};
    delete withoutSort.sort;
    expect(onQueryChange).toHaveBeenLastCalledWith(withoutSort);
    act(() => result.current.clearFilters());
    const withoutFilters = {...initial, page: 1};
    delete withoutFilters.filters;
    expect(onQueryChange).toHaveBeenLastCalledWith(withoutFilters);
    expect(initial).toEqual({page: 2, pageSize: 25, search: 'old', sort: {field: 'name', direction: 'asc'}, filters: {status: {operator: 'equals', value: 'active'}}});
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
