import {useState} from 'react';
import type {ReactNode} from 'react';

/** Extension tables never render more than this many columns, preventing narrow hosts from overflowing horizontally. */
export const EXTENSION_TABLE_MAX_COLUMNS = 3;

export type ExtensionTableColumnType = 'text' | 'status' | 'custom';

export interface ExtensionTableHostCapabilities {
  selection?: boolean;
  rowActions?: boolean;
  loadMore?: boolean;
}

/** Context supplied by the extension host; it is never inferred from URL state or global Admin state. */
export interface ExtensionTableHostContext {
  locale: string;
  timeZone: string;
  shopId?: string;
  capabilities?: ExtensionTableHostCapabilities;
}

export interface ExtensionTableCellContext<T extends object> {
  row: T;
  columnKey: string;
  host: ExtensionTableHostContext;
}

export interface ExtensionTableColumn<T extends object> {
  key: string;
  title: ReactNode;
  type?: ExtensionTableColumnType;
  render: (context: ExtensionTableCellContext<T>) => ReactNode;
}

export interface ExtensionTableRowAction<T extends object> {
  content: ReactNode;
  perform: (context: {row: T; rowId: string; host: ExtensionTableHostContext}) => void | Promise<void>;
}

export interface ExtensionTableProps<T extends object> {
  columns: readonly ExtensionTableColumn<T>[];
  data: readonly T[];
  rowId: Extract<keyof T, string> | ((row: T) => string);
  /** Required explicit host context; ExtensionTable never reads Admin routing or shop globals. */
  host: ExtensionTableHostContext;
  readOnly?: boolean;
  compact?: boolean;
  selectedRowId?: string;
  onSelectionChange?: (rowId: string | undefined) => void;
  rowAction?: ExtensionTableRowAction<T>;
  loading?: boolean;
  error?: ReactNode;
  onRetry?: () => void;
  loadingState?: ReactNode;
  emptyState?: ReactNode;
  errorState?: (context: {error: ReactNode; onRetry?: () => void}) => ReactNode;
  /** Cursor ownership stays in the host; this is intentionally unrelated to V1 offset pagination. */
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void | Promise<void>;
}

function getRowId<T extends object>(row: T, rowId: ExtensionTableProps<T>['rowId']): string {
  return typeof rowId === 'function' ? rowId(row) : String(row[rowId]);
}

function defaultErrorState(error: ReactNode, onRetry?: () => void) {
  return <div role="alert">
    <div>{error}</div>
    {onRetry ? <button type="button" onClick={onRetry}>Retry</button> : null}
  </div>;
}

/** A narrow-host renderer with no URL state, Saved Views, bulk selection, or offset pagination. */
export function ExtensionTable<T extends object>({
  columns, data, rowId, host, readOnly = false, compact = false, selectedRowId, onSelectionChange, rowAction,
  loading = false, error, onRetry, loadingState, emptyState, errorState, hasMore = false, loadingMore = false, onLoadMore,
}: ExtensionTableProps<T>) {
  const [actionError, setActionError] = useState<ReactNode>();
  const [pendingRowId, setPendingRowId] = useState<string>();
  const [loadMoreError, setLoadMoreError] = useState<ReactNode>();
  const visibleColumns = columns.slice(0, EXTENSION_TABLE_MAX_COLUMNS);
  const selectionEnabled = !readOnly && host.capabilities?.selection !== false && onSelectionChange !== undefined;
  const actionEnabled = !readOnly && host.capabilities?.rowActions !== false && rowAction !== undefined;
  const loadMoreEnabled = host.capabilities?.loadMore !== false && onLoadMore !== undefined;
  const gridColumns = `${selectionEnabled ? 'auto ' : ''}repeat(${visibleColumns.length}, minmax(0, 1fr))${actionEnabled ? ' auto' : ''}`;
  const cellStyle = {minWidth: 0, overflowWrap: 'anywhere' as const, padding: compact ? '0.375rem' : '0.75rem'};

  if (error) return <>{errorState ? errorState({error, ...(onRetry ? {onRetry} : {})}) : defaultErrorState(error, onRetry)}</>;
  if (loading && data.length === 0) return <div role="status">{loadingState ?? 'Loading…'}</div>;
  if (data.length === 0) return <>{emptyState ?? <div>No results</div>}</>;

  return <div data-extension-table="true">
    <div role="table" aria-label="Extension table">
      <div role="row" style={{display: 'grid', gridTemplateColumns: gridColumns, fontWeight: 600}}>
        {selectionEnabled ? <div role="columnheader" style={cellStyle}>Select</div> : null}
        {visibleColumns.map((column) => <div key={column.key} role="columnheader" style={cellStyle}>{column.title}</div>)}
        {actionEnabled ? <div role="columnheader" style={cellStyle}>Action</div> : null}
      </div>
      {data.map((row) => {
        const id = getRowId(row, rowId);
        return <div key={id} role="row" style={{display: 'grid', gridTemplateColumns: gridColumns, alignItems: 'center', borderTop: '1px solid var(--p-color-border-secondary, #d2d5d8)'}}>
          {selectionEnabled ? <div role="cell" style={cellStyle}><input type="radio" aria-label={`Select ${id}`} checked={selectedRowId === id} onChange={() => onSelectionChange(selectedRowId === id ? undefined : id)} /></div> : null}
          {visibleColumns.map((column) => <div key={column.key} role="cell" style={cellStyle}>{column.render({row, columnKey: column.key, host})}</div>)}
          {actionEnabled && rowAction ? <div role="cell" style={cellStyle}><button type="button" disabled={pendingRowId === id} onClick={() => {
            setActionError(undefined);
            setPendingRowId(id);
            void Promise.resolve(rowAction.perform({row, rowId: id, host})).catch((reason: unknown) => {
              setActionError(reason instanceof Error ? reason.message : 'Action failed');
            }).finally(() => setPendingRowId(undefined));
          }}>{rowAction.content}</button></div> : null}
        </div>;
      })}
    </div>
    {actionError ? <div role="alert">{actionError}</div> : null}
    {hasMore && loadMoreEnabled ? <div style={{marginTop: compact ? '0.5rem' : '0.75rem'}}><button type="button" disabled={loadingMore} onClick={() => {
      setLoadMoreError(undefined);
      void Promise.resolve(onLoadMore()).catch((reason: unknown) => setLoadMoreError(reason instanceof Error ? reason.message : 'Could not load more rows'));
    }}>{loadingMore ? 'Loading…' : 'Load more'}</button></div> : null}
    {loadMoreError ? <div role="alert">{loadMoreError}</div> : null}
  </div>;
}
