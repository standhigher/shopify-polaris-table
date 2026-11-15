import type {TableQuery, TableSelection} from '../types/table';
import {isSelectionExpired as isCoreSelectionExpired} from '../core/actions';

export function getRowId<T extends object>(row: T, rowId: Extract<keyof T, string> | ((row: T) => string)): string {
  const value = typeof rowId === 'function' ? rowId(row) : (row as Record<string, unknown>)[rowId];
  return String(value);
}

export function toggleExplicitId(selection: TableSelection, id: string): TableSelection {
  const ids = selection.mode === 'explicit' ? [...new Set(selection.ids)] : [];
  const index = ids.indexOf(id);
  if (index >= 0) ids.splice(index, 1);
  else ids.push(id);
  return {mode: 'explicit', ids};
}

export function setExplicitId(selection: TableSelection, id: string, checked: boolean): TableSelection {
  const ids = selection.mode === 'explicit' ? [...new Set(selection.ids)] : [];
  const hasId = ids.includes(id);
  if (checked && !hasId) ids.push(id);
  if (!checked && hasId) return {mode: 'explicit', ids: ids.filter((candidate) => candidate !== id)};
  return {mode: 'explicit', ids};
}

export function selectCurrentPage(selection: TableSelection, pageIds: readonly string[], selected: boolean): TableSelection {
  const ids = [...new Set(pageIds)];
  if (selection.mode === 'allMatching') {
    const excluded = new Set(selection.excludedIds);
    ids.forEach((id) => selected ? excluded.delete(id) : excluded.add(id));
    return {...selection, excludedIds: [...excluded]};
  }
  const existing = [...new Set(selection.ids)];
  const pageSet = new Set(ids);
  const next = selected ? [...existing, ...ids.filter((id) => !existing.includes(id))] : existing.filter((id) => !pageSet.has(id));
  return {mode: 'explicit', ids: next};
}

export function isRowSelected(selection: TableSelection, id: string): boolean {
  return selection.mode === 'allMatching' ? !selection.excludedIds.includes(id) : selection.ids.includes(id);
}

export function addExcludedId(selection: TableSelection, id: string): TableSelection {
  if (selection.mode !== 'allMatching' || selection.excludedIds.includes(id)) return selection;
  return {...selection, excludedIds: [...selection.excludedIds, id]};
}

export function removeExcludedId(selection: TableSelection, id: string): TableSelection {
  if (selection.mode !== 'allMatching') return selection;
  return {...selection, excludedIds: selection.excludedIds.filter((excludedId) => excludedId !== id)};
}

export function getSelectionCount(selection: TableSelection): number {
  if (selection.mode === 'explicit') return new Set(selection.ids).size;
  const selectedCount = Number.isSafeInteger(selection.selectedCount) && selection.selectedCount >= 0 ? selection.selectedCount : 0;
  return Math.max(0, selectedCount - new Set(selection.excludedIds).size);
}

export function isSelectionExpired(selection: TableSelection, now = Date.now()): boolean {
  return isCoreSelectionExpired(selection, now);
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value as Record<string, unknown>).sort().map((key) => [key, canonicalize((value as Record<string, unknown>)[key])]));
  }
  return value;
}

/** Stable query identity for allMatching tokens; pagination does not change the identity. */
export function getQuerySelectionKey(query: TableQuery): string {
  const filters = query.filters && Object.keys(query.filters).length > 0 ? query.filters : null;
  return JSON.stringify(canonicalize({search: query.search ?? '', sort: query.sort ?? null, filters}));
}

export function clearSelection(): TableSelection {
  return {mode: 'explicit', ids: []};
}
