import type {TableColumn, TableQuery} from '../types';

/**
 * Returns valid, unique user preferences. The preference's order is preserved
 * so a consuming application can retain it for a future column-order feature.
 */
export function sanitizeVisibleColumnKeys<T extends object>(
  visibleColumnKeys: readonly string[],
  columns: readonly TableColumn<T>[],
  requiredColumnKeys: readonly string[] = [],
): string[] {
  const knownKeys = new Set(columns.map((column) => String(column.key)));
  const seen = new Set<string>();
  const sanitizedRequiredKeys = requiredColumnKeys.filter((key) => knownKeys.has(key));

  const sanitizedKeys = visibleColumnKeys.filter((key) => {
    if (!knownKeys.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  for (const key of sanitizedRequiredKeys) {
    if (!seen.has(key)) sanitizedKeys.push(key);
  }

  if (sanitizedKeys.length === 0 && columns[0]) {
    sanitizedKeys.push(String(columns[0].key));
  }

  return sanitizedKeys;
}

/** The rendering order always follows the declared schema, never stored preference order. */
export function getVisibleColumns<T extends object>(
  columns: readonly TableColumn<T>[],
  visibleColumnKeys: readonly string[] | undefined,
  requiredColumnKeys: readonly string[] = [],
): readonly TableColumn<T>[] {
  if (visibleColumnKeys === undefined) return columns;
  const visible = new Set(sanitizeVisibleColumnKeys(visibleColumnKeys, columns, requiredColumnKeys));
  return columns.filter((column) => visible.has(String(column.key)));
}

/** Persisted visibility and query state to reconcile against the current column schema. */
export interface ReconcileVisibleColumnStateOptions<T extends object> {
  columns: readonly TableColumn<T>[];
  visibleColumnKeys: readonly string[];
  requiredColumnKeys?: readonly string[];
  query: TableQuery;
}

/** Safe visible-column keys and query returned after reconciliation. */
export interface ReconciledVisibleColumnState {
  visibleColumnKeys: readonly string[];
  query: TableQuery;
}

/**
 * Makes a persisted visibility preference safe after a schema migration.
 * A sort or filter for a hidden field is removed so it cannot be changed by
 * controls that the user can no longer see. This function is pure and does
 * not reset offset pagination because visibility itself does not change data.
 */
export function reconcileVisibleColumnState<T extends object>({
  columns,
  visibleColumnKeys,
  requiredColumnKeys,
  query,
}: ReconcileVisibleColumnStateOptions<T>): ReconciledVisibleColumnState {
  const sanitizedKeys = sanitizeVisibleColumnKeys(visibleColumnKeys, columns, requiredColumnKeys);
  const visible = new Set(sanitizedKeys);
  const next: TableQuery = {...query};

  if (next.sort && !visible.has(next.sort.field)) {
    delete next.sort;
  }

  if (next.filters) {
    const filters = Object.fromEntries(
      Object.entries(next.filters).filter(([field]) => visible.has(field)),
    );
    if (Object.keys(filters).length > 0) next.filters = filters;
    else delete next.filters;
  }

  return {visibleColumnKeys: sanitizedKeys, query: next};
}
