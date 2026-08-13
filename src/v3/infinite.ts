export interface CursorTableQuery {
  mode: 'cursor';
  pageSize: number;
  cursor?: string;
  search?: string;
  sort?: {field: string; direction: 'asc' | 'desc'};
  filters?: Readonly<Record<string, unknown>>;
}

export interface CursorDataPage<T> {
  data: readonly T[];
  nextCursor: string | null;
}

export interface CursorInfiniteState<T> {
  items: readonly T[];
  nextCursor: string | null;
  loading: boolean;
}

export function createCursorQuery(query: Omit<CursorTableQuery, 'mode'>): CursorTableQuery {
  return {mode: 'cursor', ...query};
}

export function isCursorQuery(value: unknown): value is CursorTableQuery {
  return typeof value === 'object' && value !== null && (value as {mode?: unknown}).mode === 'cursor';
}

export function canLoadMoreCursorPage<T>(state: CursorInfiniteState<T>): boolean {
  return !state.loading && state.nextCursor !== null;
}

export function appendCursorPage<T>(state: CursorInfiniteState<T>, page: CursorDataPage<T>, getId: (item: T) => string): CursorInfiniteState<T> {
  const seenIds = new Set(state.items.map(getId));
  const uniqueItems = page.data.filter((item) => {
    const id = getId(item);
    if (seenIds.has(id)) return false;
    seenIds.add(id);
    return true;
  });
  return {items: [...state.items, ...uniqueItems], nextCursor: page.nextCursor, loading: false};
}
