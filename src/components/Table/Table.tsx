import {useEffect, useMemo, useRef, useState} from 'react';
import type {ReactNode} from 'react';

import {renderCell} from '../../columns/renderCell';
import {createIdempotencyKey} from '../../core';
import type {TableProps} from '../../types';
import {getVisibleColumns, reconcileVisibleColumnState} from '../../features/visibleColumns';
import {addExcludedId, clearSelection, getRowId, isRowSelected, isSelectionExpired, removeExcludedId, selectCurrentPage, toggleExplicitId} from '../../features/selection';
import {TableColumnVisibility} from '../TableColumnVisibility/TableColumnVisibility';
import {getTablePaginationFlags, TablePagination} from '../TablePagination/TablePagination';
import {TableFilters} from '../TableFilters/TableFilters';
import {TableRenderer} from './TableRenderer';
import {TableState} from './TableState';

export function Table<T extends object>(props: TableProps<T>) {
  const {
    columns, visibleColumnKeys, onVisibleColumnsChange, requiredColumnKeys, data, rowId, query, pagination, pageSizeOptions, formatOptions, filters, selection, onSelectionChange,
    onSelectAllMatching, rowActions = [], bulkActions = [], onFormatWarning, labels = {}, loading, error, emptyState,
    onRetry, onQueryChange,
  } = props;
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<ReactNode>(null);
  const pendingActionRef = useRef(false);
  const selectAllRequestRef = useRef(0);
  const reconciledColumnState = useMemo(() => visibleColumnKeys === undefined ? undefined : reconcileVisibleColumnState({
    columns, visibleColumnKeys, query, ...(requiredColumnKeys ? {requiredColumnKeys} : {}),
  }), [columns, query, requiredColumnKeys, visibleColumnKeys]);
  useEffect(() => {
    if (!reconciledColumnState) return;
    if (onVisibleColumnsChange && JSON.stringify(visibleColumnKeys) !== JSON.stringify(reconciledColumnState.visibleColumnKeys)) onVisibleColumnsChange(reconciledColumnState.visibleColumnKeys);
    if (JSON.stringify(query) !== JSON.stringify(reconciledColumnState.query)) onQueryChange({...reconciledColumnState.query, page: 1});
  }, [onQueryChange, onVisibleColumnsChange, query, reconciledColumnState, visibleColumnKeys]);
  const querySnapshot = JSON.stringify(query);
  const previousQuerySnapshot = useRef(querySnapshot);
  useEffect(() => {
    if (selection.mode === 'allMatching' && previousQuerySnapshot.current !== querySnapshot) onSelectionChange({mode: 'explicit', ids: []});
    previousQuerySnapshot.current = querySnapshot;
  }, [onSelectionChange, querySnapshot, selection.mode]);
  const selectionExpired = isSelectionExpired(selection);
  useEffect(() => { if (selectionExpired) onSelectionChange(clearSelection()); }, [onSelectionChange, selectionExpired]);
  const visibleColumns = getVisibleColumns(columns, visibleColumnKeys, requiredColumnKeys);
  const paginationFlags = getTablePaginationFlags(query, pagination.total);
  const ids = useMemo(() => data.map((row) => getRowId(row, rowId)), [data, rowId]);
  const selectedOnPage = ids.filter((id) => isRowSelected(selection, id));
  const allPageSelected = ids.length > 0 && selectedOnPage.length === ids.length;
  const hasSelected = (selection.mode === 'allMatching' && !selectionExpired) || (selection.mode === 'explicit' && selection.ids.length > 0);
  const onToggleRow = (id: string, nextSelected: boolean) => onSelectionChange(selection.mode === 'allMatching' ? (nextSelected ? removeExcludedId(selection, id) : addExcludedId(selection, id)) : toggleExplicitId(selection, id));
  const selectAllCurrentPage = (nextSelected: boolean) => onSelectionChange(selectCurrentPage(selection, ids, nextSelected));
  const actions = hasSelected && bulkActions.length > 0 ? <s-stack direction="inline" gap="small">
    {bulkActions.map((action) => <s-button key={action.id} {...(action.destructive ? {tone: 'critical' as const} : {})} disabled={pendingAction !== null} onClick={() => {
      if (pendingActionRef.current) return;
      pendingActionRef.current = true;
      setPendingAction(action.id);
      setActionFeedback(null);
      void Promise.resolve().then(() => action.perform({actionId: action.id, selection, idempotencyKey: createIdempotencyKey()})).then((result) => {
        if (result.status === 'completed') setActionFeedback(<s-banner tone={result.failed.length > 0 ? 'warning' : 'success'}>{`${result.succeededCount} succeeded, ${result.failed.length} failed`}</s-banner>);
        else setActionFeedback(<s-banner tone="info">{`Operation ${result.operationId} accepted (${result.acceptedCount})`}</s-banner>);
        if (result.clearSelection) onSelectionChange({mode: 'explicit', ids: []});
      }).catch((reason: unknown) => setActionFeedback(<s-banner tone="critical">{reason instanceof Error ? reason.message : 'Bulk action failed'}</s-banner>)).finally(() => {
        pendingActionRef.current = false;
        setPendingAction(null);
      });
    }}>{action.content}</s-button>)}
  </s-stack> : null;
  const state = <TableState error={error} loading={loading} empty={data.length === 0 && !loading} emptyState={emptyState} onRetry={onRetry} labels={labels} />;
  const showState = Boolean(error) || data.length === 0;
  const showTable = !error && (data.length > 0 || (!loading && pagination.total > 0));
  return <>
    {onVisibleColumnsChange ? <TableColumnVisibility columns={columns} visibleColumnKeys={visibleColumnKeys} onVisibleColumnsChange={onVisibleColumnsChange} label={labels.columns ?? 'Columns'} resetLabel={labels.resetColumns ?? 'Reset columns'} {...(requiredColumnKeys ? {requiredColumnKeys} : {})} /> : null}
    {filters ? <TableFilters query={query} filters={filters} onQueryChange={onQueryChange} loading={loading ?? false} /> : null}
    {visibleColumns.some((column) => column.sortable) ? <s-stack direction="inline" gap="base">
      <s-select label="Sort by" value={query.sort?.field ?? ''} disabled={loading ?? false} onChange={(event) => {
        if (loading) return;
        const field = event.currentTarget.value;
        if (!field) {
          const next = {...query, page: 1};
          delete next.sort;
          onQueryChange(next);
        } else if (visibleColumns.some((column) => column.sortable && column.key === field)) onQueryChange({...query, page: 1, sort: {field, direction: query.sort?.direction ?? 'desc'}});
      }}>
        <s-option value="">Choose sort field</s-option>
        {visibleColumns.filter((column) => column.sortable).map((column) => <s-option key={column.key} value={column.key}>{typeof column.title === 'string' ? column.title : column.key}</s-option>)}
      </s-select>
      <s-select label="Sort direction" disabled={!query.sort || Boolean(loading)} value={query.sort?.direction ?? 'desc'} onChange={(event) => {
        const direction = event.currentTarget.value;
        if (!loading && query.sort && (direction === 'asc' || direction === 'desc') && visibleColumns.some((column) => column.sortable && column.key === query.sort?.field)) onQueryChange({...query, page: 1, sort: {field: query.sort.field, direction}});
      }}>
        <s-option value="asc">Ascending</s-option><s-option value="desc">Descending</s-option>
      </s-select>
    </s-stack> : null}
    {selectionExpired ? <s-banner tone="warning">{labels.selectionExpired ?? 'Selection has expired. Please select the rows again.'}</s-banner> : null}
    {actions}
    {actionFeedback}
    {showState ? state : null}
    {showTable ? <TableRenderer
      columns={visibleColumns}
      rows={data.map((row) => {
        const id = getRowId(row, rowId);
        const rowActionNodes = rowActions.length > 0 ? <s-stack direction="inline" gap="small">{rowActions.map((action) => <s-button key={action.id} {...(action.destructive ? {tone: 'critical' as const} : {})} onClick={() => { void Promise.resolve().then(() => action.perform({row, rowId: id})).catch(() => setActionFeedback(<s-banner tone="critical">Action failed</s-banner>)); }}>{action.content}</s-button>)}</s-stack> : null;
        return {
          id,
          selected: isRowSelected(selection, id),
          cells: visibleColumns.map((column) => {
            const rendered = renderCell(column, row, formatOptions, onFormatWarning);
            const content = column.type === 'actions' && rowActionNodes ? <s-stack direction="inline" gap="small">{rendered}{rowActionNodes}</s-stack> : column.type === 'actions' && !column.render ? rowActionNodes : rendered;
            return {key: column.key, content, ...(column.align ? {align: column.align} : {})};
          }),
          actions: rowActionNodes,
        };
      })}
      loading={loading ?? false}
      hasPreviousPage={!loading && paginationFlags.hasPrevious}
      hasNextPage={!loading && paginationFlags.hasNext}
      onPreviousPage={() => {
        if (!loading && paginationFlags.hasPrevious) onQueryChange({...query, page: Math.max(1, query.page - 1)});
      }}
      onNextPage={() => {
        if (!loading && paginationFlags.hasNext) onQueryChange({...query, page: (Number.isSafeInteger(query.page) && query.page > 0 ? query.page : 1) + 1});
      }}
      allPageSelected={allPageSelected}
      somePageSelected={selectedOnPage.length > 0}
      onSelectPage={selectAllCurrentPage}
      onSelectRow={onToggleRow}
      showActions={rowActions.length > 0 && !visibleColumns.some((column) => column.type === 'actions')}
      actionsLabel={labels.actions ?? 'Actions'}
    /> : null}
    <TablePagination query={query} total={pagination.total} onQueryChange={onQueryChange} loading={loading ?? false} labels={labels} {...(pageSizeOptions ? {pageSizeOptions} : {})} />
    {onSelectAllMatching && !selectionExpired && selection.mode === 'explicit' && pagination.total > data.length && allPageSelected ? <s-button onClick={() => {
      const requestId = ++selectAllRequestRef.current;
      void onSelectAllMatching(query).then((result) => {
        if (requestId !== selectAllRequestRef.current) return;
        onSelectionChange({mode: 'allMatching', selectionToken: result.selectionToken, selectedCount: result.selectedCount, expiresAt: result.expiresAt, excludedIds: []});
      }).catch((reason: unknown) => setActionFeedback(<s-banner tone="critical">{reason instanceof Error ? reason.message : 'Could not select all results'}</s-banner>));
    }}>{`Select all ${pagination.total} matching results`}</s-button> : null}
  </>;
}
