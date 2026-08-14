import type { TableSelection } from '../types/table';

export function getRowId<T extends object>(
  row: T,
  rowId: Extract<keyof T, string> | ((row: T) => string),
): string {
  const value = typeof rowId === 'function' ? rowId(row) : (row as Record<string, unknown>)[rowId];
  return String(value);
}

export function toggleExplicitId(selection: TableSelection, id: string): TableSelection {
  const ids = selection.mode === 'explicit' ? [...selection.ids] : [];
  const index = ids.indexOf(id);
  if (index >= 0) ids.splice(index, 1);
  else ids.push(id);
  return { mode: 'explicit', ids };
}

export function selectCurrentPage(
  selection: TableSelection,
  pageIds: readonly string[],
  selected: boolean,
): TableSelection {
  const ids = selection.mode === 'explicit' ? [...selection.ids] : [];
  const pageSet = new Set(pageIds);
  const next = selected
    ? [...ids, ...pageIds.filter((id) => !ids.includes(id))]
    : ids.filter((id) => !pageSet.has(id));
  return { mode: 'explicit', ids: next };
}

export function isRowSelected(selection: TableSelection, id: string): boolean {
  return selection.mode === 'allMatching' ? !selection.excludedIds.includes(id) : selection.ids.includes(id);
}

export function addExcludedId(selection: TableSelection, id: string): TableSelection {
  if (selection.mode !== 'allMatching' || selection.excludedIds.includes(id)) return selection;
  return { ...selection, excludedIds: [...selection.excludedIds, id] };
}

export function removeExcludedId(selection: TableSelection, id: string): TableSelection {
  if (selection.mode !== 'allMatching') return selection;
  return { ...selection, excludedIds: selection.excludedIds.filter((excludedId) => excludedId !== id) };
}

export function isSelectionExpired(selection: TableSelection, now = Date.now()): boolean {
  return selection.mode === 'allMatching' && Date.parse(selection.expiresAt) <= now;
}

export function clearSelection(): TableSelection {
  return { mode: 'explicit', ids: [] };
}
