import type {CoreColumn, CoreQuery, CoreSchema} from '../core';

export interface PolarisRenderTableContext<T> {
  schema: CoreSchema<T>;
  rows: readonly T[];
  query: CoreQuery;
}

export interface PolarisRenderHeaderContext {
  columns: readonly CoreColumn[];
}

export interface PolarisRenderCellContext<T> {
  column: CoreColumn;
  value: unknown;
  row: T;
}

export interface PolarisRendererAdapter<T = unknown, TableOutput = unknown, HeaderOutput = unknown, CellOutput = unknown> {
  renderer: 'polaris';
  renderTable: (context: PolarisRenderTableContext<T>) => TableOutput;
  renderHeader: (context: PolarisRenderHeaderContext) => HeaderOutput;
  renderCell: (context: PolarisRenderCellContext<T>) => CellOutput;
}

export function createPolarisRendererAdapter<T, TableOutput, HeaderOutput, CellOutput>(
  renderers: Omit<PolarisRendererAdapter<T, TableOutput, HeaderOutput, CellOutput>, 'renderer'>,
): PolarisRendererAdapter<T, TableOutput, HeaderOutput, CellOutput> {
  return {renderer: 'polaris', ...renderers};
}

export function assertPolarisRendererAdapter(value: unknown): value is PolarisRendererAdapter {
  if (!value || typeof value !== 'object') return false;
  const adapter = value as Partial<PolarisRendererAdapter>;
  return adapter.renderer === 'polaris' && typeof adapter.renderTable === 'function' &&
    typeof adapter.renderHeader === 'function' && typeof adapter.renderCell === 'function';
}
