export type StickyColumnPosition = 'start' | 'end';

export interface ColumnLayoutDefinition {
  id: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  visible?: boolean;
  sticky?: StickyColumnPosition;
}

export interface RuntimeColumnLayout extends Required<Pick<ColumnLayoutDefinition, 'id' | 'width' | 'visible'>> {
  minWidth?: number;
  maxWidth?: number;
  sticky?: StickyColumnPosition;
}

export interface ColumnLayoutState {
  columns: readonly RuntimeColumnLayout[];
}

export interface StickyOffset {
  position: 'sticky';
  insetInlineStart?: number;
  insetInlineEnd?: number;
  zIndex: number;
}

const DEFAULT_COLUMN_WIDTH = 160;

export function createColumnLayoutState(definitions: readonly ColumnLayoutDefinition[]): ColumnLayoutState {
  return {
    columns: definitions.map((definition) => ({
      id: definition.id,
      width: clampWidth(definition.width ?? DEFAULT_COLUMN_WIDTH, definition.minWidth, definition.maxWidth),
      visible: definition.visible ?? true,
      ...(definition.minWidth === undefined ? {} : {minWidth: definition.minWidth}),
      ...(definition.maxWidth === undefined ? {} : {maxWidth: definition.maxWidth}),
      ...(definition.sticky === undefined ? {} : {sticky: definition.sticky}),
    })),
  };
}

export function resizeColumn(state: ColumnLayoutState, id: string, width: number): ColumnLayoutState {
  return {
    columns: state.columns.map((column) => column.id === id
      ? {...column, width: clampWidth(width, column.minWidth, column.maxWidth)}
      : column),
  };
}

export function reorderColumns(state: ColumnLayoutState, id: string, targetIndex: number): ColumnLayoutState {
  const sourceIndex = state.columns.findIndex((column) => column.id === id);
  if (sourceIndex === -1) return state;

  const columns = [...state.columns];
  const [column] = columns.splice(sourceIndex, 1);
  if (column === undefined) return state;
  const destination = Math.max(0, Math.min(targetIndex, columns.length));
  columns.splice(destination, 0, column);
  return {columns};
}

export function setColumnVisibility(state: ColumnLayoutState, id: string, visible: boolean): ColumnLayoutState {
  return {
    columns: state.columns.map((column) => column.id === id ? {...column, visible} : column),
  };
}

export function resetColumnLayout(_state: ColumnLayoutState, definitions: readonly ColumnLayoutDefinition[]): ColumnLayoutState {
  return createColumnLayoutState(definitions);
}

export function getVisibleColumns(state: ColumnLayoutState): readonly RuntimeColumnLayout[] {
  return state.columns.filter((column) => column.visible);
}

export function getStickyOffsets(state: ColumnLayoutState): Readonly<Record<string, StickyOffset>> {
  const visibleColumns = getVisibleColumns(state);
  const offsets: Record<string, StickyOffset> = {};
  let startOffset = 0;

  for (const column of visibleColumns) {
    if (column.sticky === 'start') {
      offsets[column.id] = {position: 'sticky', insetInlineStart: startOffset, zIndex: 2};
      startOffset += column.width;
    }
  }

  let endOffset = 0;
  for (const column of [...visibleColumns].reverse()) {
    if (column.sticky === 'end') {
      offsets[column.id] = {position: 'sticky', insetInlineEnd: endOffset, zIndex: 2};
      endOffset += column.width;
    }
  }

  return offsets;
}

function clampWidth(width: number, minWidth?: number, maxWidth?: number): number {
  const minimum = minWidth ?? 0;
  const maximum = maxWidth ?? Number.POSITIVE_INFINITY;
  return Math.max(minimum, Math.min(width, maximum));
}
