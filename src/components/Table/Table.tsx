import {useEffect, useMemo, useRef, useState} from 'react';
import {Banner, Button, IndexTable, UnstyledButton} from '@shopify/polaris';
import type {ReactNode} from 'react';

import {renderCell} from '../../columns/renderCell';
import {createIdempotencyKey} from '../../core';
import type {TableProps} from '../../types';
import {addExcludedId, clearSelection, getRowId, isRowSelected, isSelectionExpired, removeExcludedId, selectCurrentPage, toggleExplicitId} from '../../features/selection';
import {TablePagination} from '../TablePagination/TablePagination';
import {TableFilters} from '../TableFilters/TableFilters';
import {TableRow} from './TableRow';
import {TableState} from './TableState';

export function Table<T extends object>(props: TableProps<T>) {
  const {
    columns, data, rowId, query, pagination, formatOptions, filters, selection, onSelectionChange,
    onSelectAllMatching, rowActions = [], bulkActions = [], onFormatWarning, labels = {}, loading, error, emptyState,
    onRetry, onQueryChange,
  } = props;
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<ReactNode>(null);
  const querySnapshot = JSON.stringify(query);
  const previousQuerySnapshot = useRef(querySnapshot);
  useEffect(() => {
    if (selection.mode === 'allMatching' && previousQuerySnapshot.current !== querySnapshot) {
      onSelectionChange({mode: 'explicit', ids: []});
    }
    previousQuerySnapshot.current = querySnapshot;
  }, [onSelectionChange, querySnapshot, selection.mode]);
  const selectionExpired = isSelectionExpired(selection);
  useEffect(() => {
    if (selectionExpired) onSelectionChange(clearSelection());
  }, [onSelectionChange, selectionExpired]);
  const visibleColumns = columns;
  const ids = useMemo(() => data.map((row) => getRowId(row, rowId)), [data, rowId]);
  const selectedOnPage = ids.filter((id) => isRowSelected(selection, id));
  const allPageSelected = ids.length > 0 && selectedOnPage.length === ids.length;
  const hasSelected = (selection.mode === 'allMatching' && !selectionExpired) || (selection.mode === 'explicit' && selection.ids.length > 0);

  const onToggleRow = (id: string, nextSelected: boolean) => {
    if (selection.mode === 'allMatching') {
      onSelectionChange(nextSelected ? removeExcludedId(selection, id) : addExcludedId(selection, id));
    } else {
      onSelectionChange(toggleExplicitId(selection, id));
    }
  };

  const selectAllCurrentPage = (nextSelected: boolean) => {
    onSelectionChange(selectCurrentPage(selection, ids, nextSelected));
  };

  const handleSelectionChange = (_selectionType: unknown, _toggleType: boolean, _selection?: string | [number, number]) => {
    // IndexTable handles checkbox UI; explicit row changes are wired by TableRow onClick.
    if (ids.length === 0) return;
    selectAllCurrentPage(!allPageSelected);
  };

  const headings = [...visibleColumns.map((column) => ({
    id: String(column.key),
    title: <span>{column.title}</span>,
    alignment: column.align,
  })), ...(rowActions.length > 0 ? [{id: 'actions', title: <span>Actions</span>, alignment: 'end' as const}] : [])] as unknown as [{id: string; title: ReactNode}, ...{id: string; title: ReactNode}[]];
  const sortable = visibleColumns.map((column) => Boolean(column.sortable));
  const sortColumnIndex = query.sort ? visibleColumns.findIndex((column) => String(column.key) === query.sort?.field) : -1;
  const sortDirection = query.sort?.direction === 'asc' ? 'ascending' : 'descending';
  const state = <TableState error={error} loading={loading} empty={data.length === 0 && !loading} emptyState={emptyState} onRetry={onRetry} labels={labels} />;
  const showState = Boolean(error) || data.length === 0;
  const showTable = !error && (data.length > 0 || (!loading && pagination.total > 0));

  const actions = hasSelected ? bulkActions.map((action) => ({
    content: String(action.content),
    destructive: action.destructive,
      disabled: pendingAction !== null,
      onAction: async () => {
        if (pendingAction) return;
        setPendingAction(action.id);
        setActionFeedback(null);
        try {
        const result = await action.perform({actionId: action.id, selection, idempotencyKey: createIdempotencyKey()});
        if (result.status === 'completed') {
          setActionFeedback(
            <Banner tone={result.failed.length > 0 ? 'warning' : 'success'}>
              {`${result.succeededCount} succeeded, ${result.failed.length} failed`}
            </Banner>,
          );
        } else {
          setActionFeedback(<Banner tone="info">{`Operation ${result.operationId} accepted (${result.acceptedCount})`}</Banner>);
        }
        if (result.clearSelection) onSelectionChange({mode: 'explicit', ids: []});
        } catch (error) {
          setActionFeedback(<Banner tone="critical">{error instanceof Error ? error.message : 'Bulk action failed'}</Banner>);
        } finally {
          setPendingAction(null);
        }
    },
  })) : undefined;

  return <>
    {filters ? <TableFilters query={query} filters={filters} onQueryChange={onQueryChange} loading={loading ?? false} /> : null}
    {selectionExpired ? <Banner tone="warning">{labels.selectionExpired ?? 'Selection has expired. Please select the rows again.'}</Banner> : null}
    {actionFeedback}
    {showState ? state : null}
    {showTable ? <IndexTable
      headings={headings}
      itemCount={data.length}
      selectable
      selectedItemsCount={selection.mode === 'allMatching' && !selectionExpired ? 'All' : selectedOnPage.length}
      loading={loading ?? false}
      sortable={sortable}
      {...(sortColumnIndex >= 0 ? {sortColumnIndex} : {})}
      sortDirection={sortDirection}
      onSort={(index, direction) => {
        const column = visibleColumns[index];
        if (!column?.sortable) return;
        onQueryChange({...query, page: 1, sort: {field: String(column.key), direction: direction === 'ascending' ? 'asc' : 'desc'}});
      }}
      onSelectionChange={handleSelectionChange}
      promotedBulkActions={actions}
    >
      {data.map((row, position) => {
        const id = getRowId(row, rowId);
        const rowActionNodes = rowActions.map((action) => <span key={action.id} onClick={(event) => event.stopPropagation()}><UnstyledButton {...(action.destructive ? {tone: 'critical' as const} : {})} onClick={() => { void action.perform({row, rowId: id}); }}>{action.content}</UnstyledButton></span>);
        return <TableRow key={id} id={id} position={position} selected={isRowSelected(selection, id)} onSelectionChange={(next) => onToggleRow(id, next)} cells={visibleColumns.map((column) => renderCell(column, row, formatOptions, onFormatWarning))} actions={rowActionNodes} />;
      })}
    </IndexTable> : null}
    <TablePagination query={query} total={pagination.total} onQueryChange={onQueryChange} loading={loading ?? false} labels={labels} />
    {onSelectAllMatching && !selectionExpired && selection.mode === 'explicit' && pagination.total > data.length && allPageSelected ? <Button variant="plain" onClick={() => {
      void onSelectAllMatching(query).then((result) => onSelectionChange({
        mode: 'allMatching',
        selectionToken: result.selectionToken,
        selectedCount: result.selectedCount,
        expiresAt: result.expiresAt,
        excludedIds: [],
      }));
    }}>{`Select all ${pagination.total} matching results`}</Button> : null}
  </>;
}
