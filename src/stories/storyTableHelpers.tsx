import {useMemo, useState} from 'react';
import type {TableQuery, TableSelection} from '../types';

export const defaultFormatOptions = {
  locale: 'en-US',
  timeZone: 'America/New_York',
  defaultCurrencyCode: 'USD',
} as const;

export const explicitSelection = {mode: 'explicit', ids: []} as const satisfies TableSelection;

export function useStoryTable<T extends {id: string}>(rows: readonly T[], pageSize = 3) {
  const [query, setQuery] = useState<TableQuery>({page: 1, pageSize});
  const [selection, setSelection] = useState<TableSelection>(explicitSelection);

  const visiblePage = useMemo(() => {
    const offset = (query.page - 1) * query.pageSize;
    return {
      data: rows.slice(offset, offset + query.pageSize),
      total: rows.length,
    };
  }, [query, rows]);

  return {query, setQuery, selection, setSelection, visiblePage};
}
