import {useMemo} from 'react';
import type {CSSProperties, KeyboardEvent, ReactNode} from 'react';

import {getVisibleColumns, reorderColumns, resizeColumn} from '../v3/columns';
import type {ColumnLayoutState} from '../v3/columns';

/** Internal 0.8 POC only. It is deliberately not exported from the package entrypoint. */
export interface ColumnLayoutPOCColumn<T> {
  id: string;
  heading: ReactNode;
  minWidth?: number;
  maxWidth?: number;
  render: (row: T) => ReactNode;
}

/**
 * The caller owns the layout state. This experiment intentionally has no drag-and-drop,
 * persistence, or migration policy: it proves only constrained resize and explicit reorder.
 */
export interface ColumnLayoutPOCProps<T> {
  columns: readonly ColumnLayoutPOCColumn<T>[];
  layout: ColumnLayoutState;
  onLayoutChange: (layout: ColumnLayoutState) => void;
  rows: readonly T[];
  rowId: (row: T) => string;
  ariaLabel: string;
}

interface ResolvedColumn<T> {
  id: string;
  heading: ReactNode;
  width: number;
  minWidth: number;
  maxWidth: number;
  render: (row: T) => ReactNode;
}

const DEFAULT_MIN_WIDTH = 80;
const DEFAULT_MAX_WIDTH = 480;
const cellStyle: CSSProperties = {borderBottom: '1px solid var(--p-color-border, #d8d8d8)', overflow: 'hidden', overflowWrap: 'anywhere', padding: '0.75rem'};

/**
 * Controlled column layout renderer used solely to evaluate 0.8 interaction boundaries.
 * Header controls are keyboard reachable; Alt+ArrowLeft/Alt+ArrowRight reorder the focused column.
 */
export function ColumnLayoutPOC<T>({columns, layout, onLayoutChange, rows, rowId, ariaLabel}: ColumnLayoutPOCProps<T>) {
  const resolvedColumns = useMemo<readonly ResolvedColumn<T>[]>(() => {
    const definitions = new Map(columns.map((column) => [column.id, column] as const));
    return getVisibleColumns(layout).flatMap((runtimeColumn) => {
      const definition = definitions.get(runtimeColumn.id);
      if (!definition) return [];
      return [{
        id: runtimeColumn.id,
        heading: definition.heading,
        width: runtimeColumn.width,
        minWidth: runtimeColumn.minWidth ?? definition.minWidth ?? DEFAULT_MIN_WIDTH,
        maxWidth: runtimeColumn.maxWidth ?? definition.maxWidth ?? DEFAULT_MAX_WIDTH,
        render: definition.render,
      }];
    });
  }, [columns, layout]);
  const gridTemplateColumns = resolvedColumns.map((column) => `${column.width}px`).join(' ');
  const fullOrder = layout.columns.map((column) => column.id);

  const moveColumn = (id: string, direction: -1 | 1) => {
    const currentIndex = fullOrder.indexOf(id);
    const targetIndex = currentIndex + direction;
    if (currentIndex === -1 || targetIndex < 0 || targetIndex >= fullOrder.length) return;
    onLayoutChange(reorderColumns(layout, id, targetIndex));
  };

  const handleHeaderKeyDown = (event: KeyboardEvent<HTMLElement>, id: string) => {
    if (!event.altKey || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
    event.preventDefault();
    moveColumn(id, event.key === 'ArrowLeft' ? -1 : 1);
  };

  return <div role="region" aria-label={ariaLabel} tabIndex={0} style={{maxWidth: '100%', overflowX: 'auto', outlineOffset: 2}}>
    <div role="table" aria-label={ariaLabel} style={{display: 'grid', gridTemplateColumns, minWidth: 'max-content'}}>
      <div role="row" style={{display: 'contents'}}>
        {resolvedColumns.map((column) => {
          const orderIndex = fullOrder.indexOf(column.id);
          return <div
            key={column.id}
            role="columnheader"
            tabIndex={0}
            aria-label={`${String(column.heading)} column controls`}
            aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight"
            onKeyDown={(event) => handleHeaderKeyDown(event, column.id)}
            style={{...cellStyle, background: 'var(--p-color-bg-surface-secondary, #f6f6f7)', fontWeight: 600}}
          >
            <div>{column.heading}</div>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem'}}>
              <button type="button" aria-label={`Move ${String(column.heading)} left`} disabled={orderIndex <= 0} onClick={() => moveColumn(column.id, -1)}>←</button>
              <button type="button" aria-label={`Move ${String(column.heading)} right`} disabled={orderIndex === -1 || orderIndex >= fullOrder.length - 1} onClick={() => moveColumn(column.id, 1)}>→</button>
              <input
                aria-label={`Resize ${String(column.heading)}`}
                type="range"
                min={column.minWidth}
                max={column.maxWidth}
                value={column.width}
                onChange={(event) => onLayoutChange(resizeColumn(layout, column.id, Number(event.currentTarget.value)))}
              />
            </div>
          </div>;
        })}
      </div>
      {rows.map((row) => <div key={rowId(row)} role="row" style={{display: 'contents'}}>
        {resolvedColumns.map((column) => <div key={column.id} role="cell" style={cellStyle}>{column.render(row)}</div>)}
      </div>)}
    </div>
  </div>;
}
