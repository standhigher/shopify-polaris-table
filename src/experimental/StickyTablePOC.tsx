import {useMemo} from 'react';
import type {CSSProperties, ReactNode} from 'react';

import {createColumnLayoutState, getStickyOffsets} from '../v3/columns';
import type {StickyColumnPosition} from '../v3/columns';

/** Internal 0.8 POC only. It is deliberately not exported from the package entrypoint. */
export interface StickyTablePOCColumn<T> {
  id: string;
  heading: ReactNode;
  width: number;
  sticky?: StickyColumnPosition;
  render: (row: T) => ReactNode;
}

export interface StickyTablePOCProps<T> {
  columns: readonly StickyTablePOCColumn<T>[];
  rows: readonly T[];
  rowId: (row: T) => string;
  viewportHeight: number;
  ariaLabel: string;
}

const baseCellStyle: CSSProperties = {
  overflow: 'hidden', overflowWrap: 'anywhere', padding: '0.75rem', background: 'var(--p-color-bg-surface, #fff)',
};

/** Fixed-width sticky-header/column experiment. It does not claim compatibility with V1 Table interactions. */
export function StickyTablePOC<T>({columns, rows, rowId, viewportHeight, ariaLabel}: StickyTablePOCProps<T>) {
  const layout = useMemo(() => createColumnLayoutState(columns.map((column) => ({
    id: column.id, width: column.width, ...(column.sticky ? {sticky: column.sticky} : {}),
  }))), [columns]);
  const stickyOffsets = useMemo(() => getStickyOffsets(layout), [layout]);
  const gridTemplateColumns = columns.map((column) => `${column.width}px`).join(' ');
  const minWidth = columns.reduce((sum, column) => sum + column.width, 0);

  const stickyStyle = (column: StickyTablePOCColumn<T>, header: boolean): CSSProperties => {
    const offset = stickyOffsets[column.id];
    if (!offset) return baseCellStyle;
    return {
      ...baseCellStyle,
      position: 'sticky',
      ...(offset.insetInlineStart === undefined ? {} : {insetInlineStart: offset.insetInlineStart}),
      ...(offset.insetInlineEnd === undefined ? {} : {insetInlineEnd: offset.insetInlineEnd}),
      zIndex: header ? 4 : offset.zIndex,
    };
  };

  return <div role="region" aria-label={ariaLabel} tabIndex={0} style={{height: viewportHeight, overflow: 'auto', outlineOffset: 2}}>
    <div role="table" aria-label={ariaLabel} style={{minWidth}}>
      <div role="row" style={{display: 'grid', gridTemplateColumns, position: 'sticky', top: 0, zIndex: 3}}>
        {columns.map((column) => <div key={column.id} role="columnheader" style={{fontWeight: 600, ...stickyStyle(column, true)}}>{column.heading}</div>)}
      </div>
      {rows.map((row) => <div key={rowId(row)} role="row" style={{display: 'grid', gridTemplateColumns}}>
        {columns.map((column) => <div key={column.id} role="cell" style={stickyStyle(column, false)}>{column.render(row)}</div>)}
      </div>)}
    </div>
  </div>;
}
