export interface CoreQuery {
  page: number;
  pageSize: number;
  search?: string;
  sort?: {field: string; direction: 'asc' | 'desc'};
  filters?: Readonly<Record<string, unknown>>;
}

export function normalizeCoreQuery(query: CoreQuery): CoreQuery {
  const normalized: CoreQuery = {
    ...query,
    page: Math.max(1, Math.floor(query.page)),
    pageSize: Math.max(1, Math.floor(query.pageSize)),
  };
  if (!normalized.search?.trim()) delete normalized.search;
  if (normalized.filters) {
    const filters = Object.fromEntries(Object.entries(normalized.filters).filter(([, value]) => !isEmptyFilter(value)));
    if (Object.keys(filters).length > 0) normalized.filters = filters;
    else delete normalized.filters;
  }
  return normalized;
}

/** Applies a partial update and resets the offset page for criteria changes. */
export function updateCoreQuery(query: CoreQuery, patch: Partial<CoreQuery>): CoreQuery {
  const next = {...query, ...patch};
  if (Object.keys(patch).some((key) => key !== 'page' && key !== 'pageSize')) next.page = 1;
  return normalizeCoreQuery(next);
}

function isEmptyFilter(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as {operator?: unknown; value?: unknown};
  if (candidate.operator === 'contains') return candidate.value === '';
  if (candidate.operator === 'in' || candidate.operator === 'notIn') return Array.isArray(candidate.value) && candidate.value.length === 0;
  if (candidate.operator === 'between') {
    const range = candidate.value;
    return !!range && typeof range === 'object' && !Array.isArray(range) && Object.values(range).every((part) => part === undefined);
  }
  return false;
}
