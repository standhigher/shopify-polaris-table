import {describe, expect, it} from 'vitest';
import {collapseRow, expandRow, isRowExpanded, toggleRowExpanded} from './expandable';

describe('expandable row state', () => {
  it('toggles rows immutably and keeps ids unique', () => {
    const initial = {expandedIds: ['a']};
    expect(toggleRowExpanded(initial, 'a')).toEqual({expandedIds: []});
    expect(toggleRowExpanded(initial, 'b')).toEqual({expandedIds: ['a', 'b']});
    expect(expandRow(initial, 'a')).toEqual(initial);
    expect(collapseRow(initial, 'a')).toEqual({expandedIds: []});
    expect(isRowExpanded(initial, 'a')).toBe(true);
  });
});
