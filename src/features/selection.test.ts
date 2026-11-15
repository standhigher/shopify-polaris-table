import {describe, expect, it} from 'vitest';
import {isSelectionExpired as isCoreSelectionExpired} from '../core/actions';
import {
  addExcludedId, clearSelection, getQuerySelectionKey, getRowId, getSelectionCount,
  isRowSelected, isSelectionExpired, removeExcludedId, selectCurrentPage, setExplicitId, toggleExplicitId,
} from './selection';
import type {TableQuery, TableSelection} from '../types/table';

const matching: TableSelection = {
  mode: 'allMatching', selectionToken: 'server-token', selectedCount: 10,
  expiresAt: '2030-01-01T00:00:00.000Z', excludedIds: ['outside', 'b'],
};

describe('selection helpers', () => {
  it('reads a stable row id from a key or resolver', () => {
    const row = {id: 42, name: 'Ada'};
    expect(getRowId(row, 'id')).toBe('42');
    expect(getRowId(row, (item) => `user-${item.id}`)).toBe('user-42');
  });

  it('toggles explicit ids immutably and normalizes duplicates', () => {
    const initial: TableSelection = {mode: 'explicit', ids: ['a']};
    expect(toggleExplicitId(initial, 'b')).toEqual({mode: 'explicit', ids: ['a', 'b']});
    expect(toggleExplicitId(initial, 'a')).toEqual({mode: 'explicit', ids: []});
    expect(initial).toEqual({mode: 'explicit', ids: ['a']});
    expect(toggleExplicitId({mode: 'explicit', ids: ['a', 'a']}, 'a')).toEqual(clearSelection());
  });

  it('sets explicit checked state idempotently rather than toggling', () => {
    const initial: TableSelection = {mode: 'explicit', ids: ['outside', 'a', 'a']};
    const checked = setExplicitId(initial, 'a', true);
    expect(checked).toEqual({mode: 'explicit', ids: ['outside', 'a']});
    expect(setExplicitId(checked, 'a', true)).toEqual(checked);
    const unchecked = setExplicitId(checked, 'a', false);
    expect(unchecked).toEqual({mode: 'explicit', ids: ['outside']});
    expect(setExplicitId(unchecked, 'a', false)).toEqual(unchecked);
    expect(setExplicitId(unchecked, 'b', true)).toEqual({mode: 'explicit', ids: ['outside', 'b']});
    expect(initial.ids).toEqual(['outside', 'a', 'a']);
  });

  it('selects and clears only the explicit current page while keeping other pages', () => {
    const initial: TableSelection = {mode: 'explicit', ids: ['outside', 'outside']};
    const selected = selectCurrentPage(initial, ['a', 'b', 'a'], true);
    expect(selected).toEqual({mode: 'explicit', ids: ['outside', 'a', 'b']});
    expect(selectCurrentPage(selected, ['a', 'b'], true)).toEqual(selected);
    expect(selectCurrentPage(selected, ['a', 'b'], false)).toEqual({mode: 'explicit', ids: ['outside']});
    expect(initial.ids).toEqual(['outside', 'outside']);
  });

  it('updates exclusions for allMatching page selection without losing the token', () => {
    const selected = selectCurrentPage(matching, ['a', 'b', 'a'], true);
    expect(selected).toEqual({...matching, excludedIds: ['outside']});
    expect(selectCurrentPage(selected, ['a', 'b'], true)).toEqual(selected);
    const unselected = selectCurrentPage(matching, ['a', 'b', 'a'], false);
    expect(unselected).toEqual({...matching, excludedIds: ['outside', 'b', 'a']});
    expect(selectCurrentPage(unselected, ['a', 'b'], false)).toEqual(unselected);
    expect(selectCurrentPage(matching, [], false)).toEqual(matching);
    expect(matching.excludedIds).toEqual(['outside', 'b']);
  });

  it('treats allMatching rows as selected except excluded ids', () => {
    expect(isRowSelected(matching, 'a')).toBe(true);
    expect(isRowSelected(matching, 'b')).toBe(false);
    expect(addExcludedId(matching, 'a')).toEqual({...matching, excludedIds: ['outside', 'b', 'a']});
    expect(addExcludedId(matching, 'b')).toBe(matching);
    expect(removeExcludedId(matching, 'b')).toEqual({...matching, excludedIds: ['outside']});
  });

  it('counts unique explicit ids and unique exclusions without double decrementing the base count', () => {
    expect(getSelectionCount({mode: 'explicit', ids: ['a', 'a', 'b']})).toBe(2);
    expect(getSelectionCount(matching)).toBe(8);
    expect(getSelectionCount({...matching, selectedCount: 2, excludedIds: ['a', 'a', 'b']})).toBe(0);
    expect(getSelectionCount({...matching, selectedCount: 1, excludedIds: ['a', 'b']})).toBe(0);
    expect(getSelectionCount({...matching, selectedCount: 0, excludedIds: []})).toBe(0);
    for (const selectedCount of [Number.NaN, Number.POSITIVE_INFINITY, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
      expect(getSelectionCount({...matching, selectedCount, excludedIds: []})).toBe(0);
    }
    expect(matching.selectedCount).toBe(10);
  });

  it('shares fail-closed expiry validation with the Core export', () => {
    const now = Date.parse('2026-01-01T00:00:00.000Z');
    const selections: readonly TableSelection[] = [
      matching,
      {...matching, expiresAt: 'invalid'},
      {...matching, expiresAt: '2026-01-01T00:00:00.000Z'},
      {...matching, selectionToken: ''},
      {...matching, selectedCount: -1},
      {...matching, selectedCount: 0},
      clearSelection(),
    ];
    for (const selection of selections) expect(isSelectionExpired(selection, now)).toBe(isCoreSelectionExpired(selection, now));
    expect(isSelectionExpired({...matching, expiresAt: 'invalid'}, now)).toBe(true);
    expect(isSelectionExpired({...matching, selectedCount: 0}, now)).toBe(false);
  });

  it('builds a stable token query identity independent of page, size, and object key order', () => {
    const first: TableQuery = {
      page: 1, pageSize: 10, search: 'shoe', sort: {field: 'createdAt', direction: 'asc'},
      filters: {status: {operator: 'equals', value: false}, quantity: {operator: 'between', value: {from: 0, to: 10}}},
    };
    const reordered: TableQuery = {
      filters: {quantity: {value: {to: 10, from: 0}, operator: 'between'}, status: {value: false, operator: 'equals'}},
      sort: {direction: 'asc', field: 'createdAt'}, search: 'shoe', pageSize: 50, page: 9,
    };
    expect(getQuerySelectionKey(first)).toBe(getQuerySelectionKey(reordered));
    expect(getQuerySelectionKey(first)).not.toBe(getQuerySelectionKey({...first, search: 'other'}));
    expect(getQuerySelectionKey(first)).not.toBe(getQuerySelectionKey({...first, sort: {field: 'createdAt', direction: 'desc'}}));
    expect(getQuerySelectionKey(first)).not.toBe(getQuerySelectionKey({...first, filters: {status: {operator: 'equals', value: true}}}));
    expect(getQuerySelectionKey({page: 1, pageSize: 10})).toBe(getQuerySelectionKey({page: 4, pageSize: 50, search: '', filters: {}}));
  });
});
