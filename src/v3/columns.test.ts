import {describe, expect, it} from 'vitest';
import {
  createColumnLayoutState,
  getStickyOffsets,
  getVisibleColumns,
  reorderColumns,
  resetColumnLayout,
  resizeColumn,
  setColumnVisibility,
} from './columns';

describe('column layout state', () => {
  const definitions = [
    {id: 'name', width: 160, minWidth: 120, maxWidth: 240, sticky: 'start' as const},
    {id: 'status', width: 100},
    {id: 'total', width: 140, sticky: 'end' as const},
  ];

  it('creates runtime state and clamps resize to min/max', () => {
    const state = createColumnLayoutState(definitions);
    expect(resizeColumn(state, 'name', 40).columns[0]).toMatchObject({width: 120});
    expect(resizeColumn(state, 'name', 400).columns[0]).toMatchObject({width: 240});
  });

  it('reorders columns immutably and exposes only visible columns', () => {
    const state = createColumnLayoutState(definitions);
    const hidden = setColumnVisibility(state, 'status', false);
    const reordered = reorderColumns(hidden, 'total', 0);
    expect(getVisibleColumns(reordered).map((column) => column.id)).toEqual(['total', 'name']);
    expect(state.columns.map((column) => column.id)).toEqual(['name', 'status', 'total']);
  });

  it('calculates sticky offsets from visible columns', () => {
    const state = createColumnLayoutState(definitions);
    expect(getStickyOffsets(state)).toEqual({
      name: {position: 'sticky', insetInlineStart: 0, zIndex: 2},
      total: {position: 'sticky', insetInlineEnd: 0, zIndex: 2},
    });
  });

  it('resets runtime preferences to definitions', () => {
    const state = reorderColumns(setColumnVisibility(createColumnLayoutState(definitions), 'name', false), 'total', 0);
    expect(resetColumnLayout(state, definitions).columns).toEqual(createColumnLayoutState(definitions).columns);
  });
});
