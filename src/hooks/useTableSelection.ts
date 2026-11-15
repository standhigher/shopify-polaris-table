import {useEffect, useRef, useState} from 'react';
import type {TableQuery, TableSelectAllMatchingResult, TableSelection} from '../types';
import {addExcludedId, clearSelection, getQuerySelectionKey, getSelectionCount, isRowSelected, isSelectionExpired, removeExcludedId, selectCurrentPage, setExplicitId} from '../features/selection';

export interface TableSelectionContext {
  selection: TableSelection;
  criteriaKey: string;
  criteriaRevision: number;
  selectionRevision: number;
  usable: boolean;
}

export function copyTableSelection(selection: TableSelection): TableSelection {
  return selection.mode === 'explicit' ? {...selection, ids: [...new Set(selection.ids)]} : {...selection, excludedIds: [...new Set(selection.excludedIds)]};
}

function selectionKey(selection: TableSelection): string {
  return JSON.stringify(selection.mode === 'explicit'
    ? {mode: selection.mode, ids: [...new Set(selection.ids)].sort()}
    : {...selection, excludedIds: [...new Set(selection.excludedIds)].sort()});
}

interface Options {
  query: TableQuery;
  selection: TableSelection;
  pageIds: readonly string[];
  loading: boolean;
  onSelectionChange: (selection: TableSelection) => void;
  onSelectAllMatching?: ((query: TableQuery) => Promise<TableSelectAllMatchingResult>) | undefined;
}

export function useTableSelection(options: Options) {
  const {query, selection, pageIds, loading} = options;
  const criteriaKey = getQuerySelectionKey(query);
  const currentSelectionKey = selectionKey(selection);
  const tracking = useRef({criteriaKey, selectionKey: currentSelectionKey, criteriaRevision: 0, selectionRevision: 0, generation: 0});
  const pending = useRef<number | null>(null);
  const mounted = useRef(true);
  const [selectingAll, setSelectingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiryNotice, setExpiryNotice] = useState(false);
  const [, setClock] = useState(0);
  const latest = useRef(options);
  latest.current = options;
  const boundToken = useRef<{token: string; key: string} | null>(null);
  const notifiedInvalid = useRef<string | null>(null);

  if (tracking.current.criteriaKey !== criteriaKey) {
    tracking.current.criteriaKey = criteriaKey;
    tracking.current.criteriaRevision += 1;
    tracking.current.generation += 1;
    pending.current = null;
  }
  if (tracking.current.selectionKey !== currentSelectionKey) {
    tracking.current.selectionKey = currentSelectionKey;
    tracking.current.selectionRevision += 1;
    tracking.current.generation += 1;
    pending.current = null;
  }
  if (selection.mode === 'allMatching' && boundToken.current?.token !== selection.selectionToken) boundToken.current = {token: selection.selectionToken, key: criteriaKey};
  const criteriaInvalid = selection.mode === 'allMatching' && boundToken.current?.key !== criteriaKey;
  const expired = isSelectionExpired(selection);
  const unusable = expired || criteriaInvalid;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; pending.current = null; tracking.current.generation += 1; };
  }, []);
  useEffect(() => { if (pending.current === null) setSelectingAll(false); }, [criteriaKey, currentSelectionKey]);
  useEffect(() => {
    if (!unusable) { notifiedInvalid.current = null; if (getSelectionCount(selection) > 0) setExpiryNotice(false); return; }
    const key = `${criteriaKey}:${currentSelectionKey}`;
    if (notifiedInvalid.current === key) return;
    notifiedInvalid.current = key;
    if (expired) setExpiryNotice(true);
    tracking.current.generation += 1;
    tracking.current.selectionRevision += 1;
    pending.current = null;
    setSelectingAll(false);
    options.onSelectionChange(clearSelection());
  }, [criteriaKey, currentSelectionKey, options.onSelectionChange, unusable]);
  useEffect(() => {
    if (selection.mode !== 'allMatching' || expired) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const delay = Math.min(Math.max(1, Date.parse(selection.expiresAt) - Date.now() + 1), 2_147_483_647);
      timer = setTimeout(() => { setClock((clock) => clock + 1); if (Date.parse(selection.expiresAt) > Date.now()) schedule(); }, delay);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [currentSelectionKey, expired, selection]);

  const capture = (): TableSelectionContext => ({selection: copyTableSelection(latest.current.selection), criteriaKey: tracking.current.criteriaKey, criteriaRevision: tracking.current.criteriaRevision, selectionRevision: tracking.current.selectionRevision, usable: !latest.current.loading && pending.current === null && !isSelectionExpired(latest.current.selection) && !(latest.current.selection.mode === 'allMatching' && boundToken.current?.key !== tracking.current.criteriaKey)});
  const isCurrent = (context: TableSelectionContext) => mounted.current && context.criteriaRevision === tracking.current.criteriaRevision && context.selectionRevision === tracking.current.selectionRevision && context.criteriaKey === tracking.current.criteriaKey;
  const emit = (next: TableSelection) => {
    if (selectionKey(next) === selectionKey(latest.current.selection)) return;
    tracking.current.generation += 1;
    tracking.current.selectionRevision += 1;
    pending.current = null;
    setSelectingAll(false);
    setError(null);
    latest.current.onSelectionChange(next);
  };
  const clear = () => emit(clearSelection());
  const setRow = (id: string, checked: boolean) => {
    const current = latest.current;
    if (current.loading || pending.current !== null || unusable || isSelectionExpired(current.selection)) return;
    emit(current.selection.mode === 'allMatching' ? (checked ? removeExcludedId(current.selection, id) : addExcludedId(current.selection, id)) : setExplicitId(current.selection, id, checked));
  };
  const setPage = (checked: boolean) => {
    const current = latest.current;
    if (current.loading || pending.current !== null || unusable || isSelectionExpired(current.selection)) return;
    emit(selectCurrentPage(current.selection, current.pageIds, checked));
  };
  const selectAll = async () => {
    const current = latest.current;
    if (current.loading || pending.current !== null || !current.onSelectAllMatching || current.selection.mode !== 'explicit' || current.pageIds.length === 0 || !current.pageIds.every((id) => isRowSelected(current.selection, id))) return;
    const context = capture();
    const generation = ++tracking.current.generation;
    pending.current = generation;
    setSelectingAll(true);
    setError(null);
    const requestQuery = JSON.parse(JSON.stringify(current.query)) as TableQuery;
    try {
      const result = await current.onSelectAllMatching(requestQuery);
      if (!isCurrent(context) || generation !== tracking.current.generation) return;
      const next: TableSelection = {mode: 'allMatching', selectionToken: result.selectionToken, selectedCount: result.selectedCount, expiresAt: result.expiresAt, excludedIds: []};
      if (getQuerySelectionKey(result.normalizedQuery) !== context.criteriaKey) throw new Error('The server normalized this query differently. Apply the normalized query and select again.');
      if (isSelectionExpired(next)) throw new Error('The server selection is invalid or has expired. Select again.');
      boundToken.current = {token: result.selectionToken, key: context.criteriaKey};
      latest.current.onSelectionChange(result.selectedCount === 0 ? clearSelection() : next);
    } catch (reason) {
      if (isCurrent(context) && generation === tracking.current.generation) setError(reason instanceof Error ? reason.message : 'Could not select all matching rows.');
    } finally {
      if (mounted.current && pending.current === generation) { pending.current = null; setSelectingAll(false); }
    }
  };

  const selectedOnPage = pageIds.filter((id) => !unusable && isRowSelected(selection, id));
  return {
    expired, criteriaInvalid, error, selectingAll, capture, isCurrent, clear, setRow, setPage, selectAll,
    selectedCount: unusable ? 0 : getSelectionCount(selection),
    allPageSelected: pageIds.length > 0 && selectedOnPage.length === pageIds.length,
    somePageSelected: selectedOnPage.length > 0,
    interactionDisabled: loading || selectingAll || unusable,
    expiryNotice,
    isRowSelected: (id: string) => !unusable && isRowSelected(selection, id),
    clearIfCurrent: (context: TableSelectionContext) => { if (isCurrent(context)) clear(); },
    selectFailed: (ids: readonly string[]) => {
      // Selecting failed rows is an explicit new intent even if every row failed
      // and the resulting ID set equals the previous selection.
      tracking.current.generation += 1;
      tracking.current.selectionRevision += 1;
      pending.current = null;
      setSelectingAll(false);
      setError(null);
      setClock((clock) => clock + 1);
      latest.current.onSelectionChange({mode: 'explicit', ids: [...new Set(ids)]});
    },
  };
}
