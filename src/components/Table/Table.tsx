import {useEffect, useMemo, useState} from 'react';
import type {ReactNode} from 'react';

import {renderCell} from '../../columns/renderCell';
import type {TableProps} from '../../types';
import {getVisibleColumns, reconcileVisibleColumnState} from '../../features/visibleColumns';
import {getRowId} from '../../features/selection';
import {TableColumnVisibility} from '../TableColumnVisibility/TableColumnVisibility';
import {getTablePaginationFlags, TablePagination} from '../TablePagination/TablePagination';
import {TableFilters} from '../TableFilters/TableFilters';
import {useTableSelection} from '../../hooks/useTableSelection';
import {TableRenderer} from './TableRenderer';
import {TableState} from './TableState';
import {TableSkeleton} from './TableSkeleton';
import {TableBulkActions} from './TableBulkActions';

export function Table<T extends object>(props: TableProps<T>) {
  const {
    columns, visibleColumnKeys, onVisibleColumnsChange, requiredColumnKeys, data, rowId, query, pagination, pageSizeOptions, formatOptions, filters, selection, onSelectionChange,
    onSelectAllMatching, rowActions = [], bulkActions = [], onFormatWarning, labels = {}, loading, error, emptyState,
    onRetry, onQueryChange,
  } = props;
  const [actionFeedback, setActionFeedback] = useState<ReactNode>(null);
  const reconciledColumnState = useMemo(() => visibleColumnKeys === undefined ? undefined : reconcileVisibleColumnState({
    columns, visibleColumnKeys, query, ...(requiredColumnKeys ? {requiredColumnKeys} : {}),
  }), [columns, query, requiredColumnKeys, visibleColumnKeys]);
  useEffect(() => {
    if (!reconciledColumnState) return;
    if (onVisibleColumnsChange && JSON.stringify(visibleColumnKeys) !== JSON.stringify(reconciledColumnState.visibleColumnKeys)) onVisibleColumnsChange(reconciledColumnState.visibleColumnKeys);
    if (JSON.stringify(query) !== JSON.stringify(reconciledColumnState.query)) onQueryChange({...reconciledColumnState.query, page: 1});
  }, [onQueryChange, onVisibleColumnsChange, query, reconciledColumnState, visibleColumnKeys]);
  const visibleColumns = getVisibleColumns(columns, visibleColumnKeys, requiredColumnKeys);
  const paginationFlags = getTablePaginationFlags(query, pagination.total);
  const ids = useMemo(() => data.map((row) => getRowId(row, rowId)), [data, rowId]);
  const selectionModel = useTableSelection({query, selection, pageIds: ids, loading: loading ?? false, onSelectionChange, ...(onSelectAllMatching ? {onSelectAllMatching} : {})});
  const selectionExpired = selectionModel.expired || selectionModel.expiryNotice;
  const selectedOnPage = ids.filter((id) => selectionModel.isRowSelected(id));
  const allPageSelected = selectionModel.allPageSelected;
  const onToggleRow = (id: string, nextSelected: boolean) => selectionModel.setRow(id, nextSelected);
  const selectAllCurrentPage = (nextSelected: boolean) => selectionModel.setPage(nextSelected);
  const actions = bulkActions.length > 0 ? <TableBulkActions
    actions={bulkActions}
    selectedCount={selectionModel.selectedCount}
    loading={Boolean(loading) || selectionModel.selectingAll}
    capture={selectionModel.capture}
    isCurrent={selectionModel.isCurrent}
    clearIfCurrent={selectionModel.clearIfCurrent}
    selectFailed={selectionModel.selectFailed}
    onClear={selectionModel.clear}
  /> : null;
  const initialLoading = Boolean(loading && data.length === 0 && !error);
  const empty = !loading && !error && data.length === 0;
  const state = <TableState error={error} loading={loading} hasData={data.length > 0} empty={empty} emptyState={emptyState} onRetry={onRetry} labels={labels} />;
  const showState = Boolean(error) || empty;
  const showTable = data.length > 0;
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
    {initialLoading ? <TableSkeleton columns={visibleColumns} label={labels.loading ?? 'Loading'} showActions={rowActions.length > 0 && !visibleColumns.some((column) => column.type === 'actions')} actionsLabel={labels.actions ?? 'Actions'} /> : null}
    {showState ? state : null}
    {showTable ? <TableRenderer
      columns={visibleColumns}
      rows={data.map((row) => {
        const id = getRowId(row, rowId);
        const rowActionNodes = rowActions.length > 0 ? <s-stack direction="inline" gap="small">{rowActions.map((action) => <s-button key={action.id} {...(action.destructive ? {tone: 'critical' as const} : {})} onClick={() => { void Promise.resolve().then(() => action.perform({row, rowId: id})).catch(() => setActionFeedback(<s-banner tone="critical">Action failed</s-banner>)); }}>{action.content}</s-button>)}</s-stack> : null;
        return {
          id,
          selected: selectionModel.isRowSelected(id),
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
      interactionDisabled={selectionModel.interactionDisabled}
      onSelectPage={selectAllCurrentPage}
      onSelectRow={onToggleRow}
      showActions={rowActions.length > 0 && !visibleColumns.some((column) => column.type === 'actions')}
      actionsLabel={labels.actions ?? 'Actions'}
    /> : null}
    {showTable ? <TablePagination query={query} total={pagination.total} onQueryChange={onQueryChange} loading={loading ?? false} labels={labels} {...(pageSizeOptions ? {pageSizeOptions} : {})} /> : null}
    {onSelectAllMatching && !selectionExpired && selection.mode === 'explicit' && pagination.total > data.length && allPageSelected ? <s-button disabled={selectionModel.selectingAll || Boolean(loading)} onClick={() => { void selectionModel.selectAll(); }}>{`Select all ${pagination.total} matching results`}</s-button> : null}
    {selectionModel.error ? <s-banner tone="critical">{selectionModel.error}</s-banner> : null}
  </>;
}
