import type {TableFilterScalar, TableFilterValue, TableFilters, TableQuery} from '../types';

export const TABLE_QUERY_URL_VERSION = '1';
const scalarTypes = new Set(['string', 'number', 'boolean']);
const operators = new Set([
  'equals',
  'notEquals',
  'contains',
  'in',
  'notIn',
  'between',
  'isEmpty',
  'isNotEmpty',
]);

export interface TableQueryUrlOptions {
  /** Only these filter fields can be written to or read from the URL. */
  filterKeys?: readonly string[];
  /** Sensitive filters are intentionally excluded even if they are allowlisted. */
  sensitiveFilterKeys?: readonly string[];
  /** Only these sort fields can be written to or read from the URL. */
  sortKeys?: readonly string[];
  /** Restricts URL page sizes and supplies the safe fallback when present. */
  pageSizeOptions?: readonly number[];
}

function isPositiveInteger(value: string | null): value is string {
  return value !== null && /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) >= 1;
}

function normalizePositiveInteger(value: number): number {
  const normalized = Math.floor(value);
  return Number.isSafeInteger(normalized) && normalized >= 1 ? normalized : 1;
}

function getPageSize(value: number, options: TableQueryUrlOptions): number {
  const normalized = normalizePositiveInteger(value);
  const allowedPageSizes = options.pageSizeOptions?.filter((pageSize) => Number.isSafeInteger(pageSize) && pageSize >= 1);
  if (!allowedPageSizes || allowedPageSizes.length === 0) return normalized;
  return allowedPageSizes.includes(normalized) ? normalized : allowedPageSizes[0]!;
}

function isScalar(value: unknown): value is TableFilterScalar {
  return scalarTypes.has(typeof value) && (typeof value !== 'number' || Number.isFinite(value));
}

function isFilterValue(value: unknown): value is TableFilterValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  const operator = candidate.operator;
  if (typeof operator !== 'string' || !operators.has(operator)) return false;
  if (operator === 'equals' || operator === 'notEquals') return isScalar(candidate.value);
  if (operator === 'contains') return typeof candidate.value === 'string' && candidate.value.length > 0;
  if (operator === 'in' || operator === 'notIn') {
    return Array.isArray(candidate.value) && candidate.value.length > 0 && candidate.value.every(isScalar);
  }
  if (operator === 'between') {
    if (!candidate.value || typeof candidate.value !== 'object' || Array.isArray(candidate.value)) return false;
    const range = candidate.value as Record<string, unknown>;
    const hasFrom = range.from !== undefined;
    const hasTo = range.to !== undefined;
    return (hasFrom || hasTo) &&
      (!hasFrom || typeof range.from === 'string' || typeof range.from === 'number') &&
      (!hasTo || typeof range.to === 'string' || typeof range.to === 'number');
  }
  return candidate.value === undefined;
}

function canExposeFilter(key: string, options: TableQueryUrlOptions): boolean {
  return (options.filterKeys === undefined || options.filterKeys.includes(key)) &&
    !(options.sensitiveFilterKeys?.includes(key) ?? false);
}

function canExposeSort(key: string, options: TableQueryUrlOptions): boolean {
  return options.sortKeys === undefined || options.sortKeys.includes(key);
}

function isSortField(value: string): boolean {
  return /^[^:\s][^:]*$/.test(value);
}

function safeFilters(filters: TableFilters, options: TableQueryUrlOptions): TableFilters | undefined {
  const result = Object.fromEntries(
    Object.entries(filters).filter(([key, value]) => canExposeFilter(key, options) && isFilterValue(value)),
  ) as TableFilters;
  return Object.keys(result).length > 0 ? result : undefined;
}

/** Serializes only the fixed V1 offset-query contract; no router dependency is required. */
export function encodeTableQuery(query: TableQuery, options: TableQueryUrlOptions = {}): URLSearchParams {
  const params = new URLSearchParams({
    v: TABLE_QUERY_URL_VERSION,
    page: String(normalizePositiveInteger(query.page)),
    pageSize: String(getPageSize(query.pageSize, options)),
  });
  if (query.search) params.set('search', query.search);
  if (query.sort && isSortField(query.sort.field) && canExposeSort(query.sort.field, options)) {
    params.set('sort', `${query.sort.direction}:${query.sort.field}`);
  }
  if (query.filters) {
    const filters = safeFilters(query.filters, options);
    if (filters) params.set('filters', JSON.stringify(filters));
  }
  return params;
}

/**
 * Decodes a versioned, untrusted URL query. Any malformed filters are rejected
 * as a whole instead of being partially interpreted by a server query layer.
 */
export function decodeTableQuery(searchParams: URLSearchParams, options: TableQueryUrlOptions = {}): TableQuery {
  const defaultQuery: TableQuery = {page: 1, pageSize: getPageSize(1, options)};
  if (searchParams.get('v') !== TABLE_QUERY_URL_VERSION) return defaultQuery;

  const page = searchParams.get('page');
  const requestedPageSize = searchParams.get('pageSize');
  const query: TableQuery = {
    page: isPositiveInteger(page) ? Number(page) : 1,
    pageSize: getPageSize(isPositiveInteger(requestedPageSize) ? Number(requestedPageSize) : 1, options),
  };
  const search = searchParams.get('search');
  if (search) query.search = search;

  const sort = searchParams.get('sort');
  const sortMatch = sort?.match(/^(asc|desc):([^:\s][^:]*)$/);
  if (sortMatch?.[1] && sortMatch[2] && canExposeSort(sortMatch[2], options)) {
    query.sort = {direction: sortMatch[1] as 'asc' | 'desc', field: sortMatch[2]};
  }

  const encodedFilters = searchParams.get('filters');
  if (encodedFilters) {
    try {
      const parsed: unknown = JSON.parse(encodedFilters);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const entries = Object.entries(parsed as Record<string, unknown>);
        if (entries.every(([key, value]) => canExposeFilter(key, options) && isFilterValue(value))) {
          const filters = Object.fromEntries(entries) as TableFilters;
          if (Object.keys(filters).length > 0) query.filters = filters;
        }
      }
    } catch {
      // URL state is optional; fall back to the safe base query.
    }
  }
  return query;
}
