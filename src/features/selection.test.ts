import { describe, expect, it } from 'vitest';
import {
  addExcludedId,
  getRowId,
  isRowSelected,
  removeExcludedId,
  selectCurrentPage,
  toggleExplicitId,
} from './selection';
import type { TableSelection } from '../types/table';

describe('selection helpers', () => {
  it('reads a stable row id from a key or resolver', () => {
    const row = { id: 42, name: 'Ada' };
    expect(getRowId(row, 'id')).toBe('42');
    expect(getRowId(row, (item) => `user-${item.id}`)).toBe('user-42');
  });

  it('toggles explicit ids immutably', () => {
    const initial: TableSelection = { mode: 'explicit', ids: ['a'] };
    expect(toggleExplicitId(initial, 'b')).toEqual({ mode: 'explicit', ids: ['a', 'b'] });
    expect(toggleExplicitId(initial, 'a')).toEqual({ mode: 'explicit', ids: [] });
    expect(initial).toEqual({ mode: 'explicit', ids: ['a'] });
  });

  it('selects and clears only the current page', () => {
    const initial: TableSelection = { mode: 'explicit', ids: ['outside'] };
    expect(selectCurrentPage(initial, ['a', 'b'], true)).toEqual({
      mode: 'explicit',
      ids: ['outside', 'a', 'b'],
    });
    expect(selectCurrentPage(initial, ['a', 'b'], false)).toEqual({
      mode: 'explicit',
      ids: ['outside'],
    });
  });

  it('treats allMatching as selected except excluded ids', () => {
    const selection: TableSelection = {
      mode: 'allMatching',
      selectionToken: 'token',
      selectedCount: 10,
      expiresAt: new Date(Date.now() + 10_000).toISOString(),
      excludedIds: ['b'],
    };
    expect(isRowSelected(selection, 'a')).toBe(true);
    expect(isRowSelected(selection, 'b')).toBe(false);
    expect(addExcludedId(selection, 'a')).toEqual({ ...selection, excludedIds: ['b', 'a'] });
    expect(removeExcludedId(selection, 'b')).toEqual({ ...selection, excludedIds: [] });
  });
});
