/** UI-framework-neutral column schema consumed by renderer adapters. */
export type CoreColumnType = 'text' | 'number' | 'money' | 'status' | 'datetime' | 'image' | 'actions' | 'custom';

export interface CoreColumn {
  id: string;
  title: string;
  type: CoreColumnType;
  sortable?: boolean;
}

export interface CoreSchema<T = unknown> {
  rowId: string | ((row: T) => string);
  columns: readonly CoreColumn[];
}

export function createCoreSchema<T>(input: CoreSchema<T>): CoreSchema<T> {
  return {
    rowId: input.rowId,
    columns: input.columns.map((column) => ({...column})),
  };
}

export function getCoreColumn<T>(schema: CoreSchema<T>, id: string): CoreColumn | undefined {
  return schema.columns.find((column) => column.id === id);
}

export function validateCoreSchema<T>(schema: CoreSchema<T>): readonly string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const column of schema.columns) {
    if (!column.id.trim()) errors.push('empty-column-id');
    if (seen.has(column.id)) errors.push(`duplicate-column:${column.id}`);
    seen.add(column.id);
  }
  if (schema.columns.length === 0) errors.push('no-columns');
  return errors;
}
