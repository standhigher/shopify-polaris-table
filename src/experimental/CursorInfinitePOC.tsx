import {useMemo, useState} from 'react';
import type {ReactNode} from 'react';

import {appendCursorPage, canLoadMoreCursorPage, createCursorQuery} from '../v3/infinite';
import type {CursorDataPage, CursorInfiniteState, CursorTableQuery} from '../v3/infinite';

/**
 * Internal 0.8 POC only. Cursor ownership deliberately stays separate from V1 offset TableQuery.
 * It proves the loading state machine, not a public table renderer or data-fetching abstraction.
 */
export interface CursorInfinitePOCProps<T> {
  initialItems: readonly T[];
  initialNextCursor: string | null;
  pageSize: number;
  search?: string;
  getItemId: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  /** Receives a V3 cursor query and the exact cursor being loaded; it must return the next page. */
  loadPage: (request: {cursor: string; query: CursorTableQuery}) => Promise<CursorDataPage<T>>;
  ariaLabel: string;
}

function getErrorMessage(reason: unknown) {
  return reason instanceof Error ? reason.message : 'Could not load more rows';
}

/**
 * A deliberately small, accessible cursor "Load more" experiment. There is no page number,
 * offset query, URL-state integration, or public package export.
 */
export function CursorInfinitePOC<T>({
  initialItems, initialNextCursor, pageSize, search, getItemId, renderItem, loadPage, ariaLabel,
}: CursorInfinitePOCProps<T>) {
  const [state, setState] = useState<CursorInfiniteState<T>>({items: initialItems, nextCursor: initialNextCursor, loading: false});
  const [error, setError] = useState<string>();
  const query = useMemo(() => createCursorQuery({pageSize, ...(search === undefined ? {} : {search})}), [pageSize, search]);

  const loadMore = async () => {
    const cursor = state.nextCursor;
    if (state.loading || cursor === null) return;
    setError(undefined);
    setState((current) => ({...current, loading: true}));

    try {
      const page = await loadPage({cursor, query});
      setState((current) => appendCursorPage(current, page, getItemId));
    } catch (reason) {
      setState((current) => ({...current, loading: false}));
      setError(getErrorMessage(reason));
    }
  };

  const canLoadMore = canLoadMoreCursorPage(state);

  return <section data-testid="cursor-poc" data-cursor-infinite-poc="true" data-query-mode={query.mode}>
    <div role="list" aria-label={ariaLabel}>
      {state.items.map((item) => <div key={getItemId(item)} role="listitem">{renderItem(item)}</div>)}
    </div>
    {state.loading ? <div role="status" aria-live="polite" aria-atomic="true">Loading more rows…</div> : null}
    {!state.loading && state.nextCursor === null ? <div role="status" aria-live="polite" aria-atomic="true">All rows loaded</div> : null}
    {error ? <div role="alert">
      <div>{error}</div>
      <button type="button" onClick={() => void loadMore()}>Retry loading rows</button>
    </div> : null}
    {canLoadMore ? <button type="button" onClick={() => void loadMore()}>Load more rows</button> : null}
  </section>;
}
