import {useCallback, useMemo} from 'react';

import type {TableFilters, TableQuery, TableFilterValue} from '../types';

/** Controlled query state and optional accepted page sizes for `useTableQuery`. */
export interface UseTableQueryOptions {
  query: TableQuery;
  onQueryChange: (query: TableQuery) => void;
  pageSizeOptions?: readonly number[];
}

/** Query-update callbacks returned by `useTableQuery`. */
export interface UseTableQueryResult {
  setSearch: (search: string) => void;
  setFilters: (filters: TableFilters) => void;
  setSort: (sort: TableQuery['sort']) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  clearFilters: () => void;
}

function isEmptyFilterValue(value: TableFilterValue): boolean {
  if ('value' in value) {
    if (Array.isArray(value.value)) {
      return value.value.length === 0;
    }
    if (typeof value.value === 'string') {
      return value.value.length === 0;
    }
    if (value.operator === 'between') {
      return value.value.from === undefined && value.value.to === undefined;
    }
  }
  return false;
}

export function cleanFilters(filters: TableFilters | undefined): TableFilters | undefined {
  if (!filters) {
    return undefined;
  }

  const cleanedEntries = Object.entries(filters).filter(([, value]) => !isEmptyFilterValue(value));
  return cleanedEntries.length > 0 ? Object.fromEntries(cleanedEntries) : undefined;
}

export function useTableQuery({query, onQueryChange, pageSizeOptions}: UseTableQueryOptions): UseTableQueryResult {
  const allowedPageSizes = useMemo(
    () => (pageSizeOptions && pageSizeOptions.length > 0 ? pageSizeOptions : undefined),
    [pageSizeOptions],
  );

  const emit = useCallback(
    (next: TableQuery) => {
      const normalized: TableQuery = {
        ...next,
        page: Math.max(1, Math.floor(next.page)),
      };

      if (normalized.search === '') {
        delete normalized.search;
      }

      const cleanedFilters = cleanFilters(normalized.filters);
      if (cleanedFilters) {
        normalized.filters = cleanedFilters;
      } else {
        delete normalized.filters;
      }

      onQueryChange(normalized);
    },
    [onQueryChange],
  );

  return useMemo(
    () => ({
      setSearch: (search: string) => emit({...query, page: 1, search}),
      setFilters: (filters: TableFilters) => emit({...query, page: 1, filters}),
      setSort: (sort: TableQuery['sort']) => {
        const next = {...query, page: 1};
        if (sort) {
          next.sort = sort;
        } else {
          delete next.sort;
        }
        emit(next);
      },
      setPage: (page: number) => emit({...query, page}),
      setPageSize: (pageSize: number) => {
        const nextPageSize = allowedPageSizes?.includes(pageSize)
          ? pageSize
          : (allowedPageSizes?.find((size) => size === query.pageSize) ?? allowedPageSizes?.[0] ?? query.pageSize);
        emit({...query, page: 1, pageSize: nextPageSize});
      },
      clearFilters: () => {
        const next = {...query, page: 1};
        delete next.filters;
        emit(next);
      },
    }),
    [allowedPageSizes, emit, query],
  );
}
