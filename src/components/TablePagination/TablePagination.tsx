import type {TableLabels, TableQuery} from '../../types';

export interface TablePaginationProps {
  query: TableQuery;
  total: number;
  onQueryChange: (query: TableQuery) => void;
  pageSizeOptions?: readonly number[] | undefined;
  loading?: boolean | undefined;
  labels?: Partial<TableLabels> | undefined;
}

export interface TablePaginationFlags {
  pageCount: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

const defaultPageSizeOptions = [10, 25, 50, 100] as const;

function isPositiveSafeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

function normalizeTotal(total: number): number {
  if (!Number.isFinite(total) || total <= 0) return 0;
  return Math.min(Math.floor(total), Number.MAX_SAFE_INTEGER);
}

export function getTablePaginationFlags(query: TableQuery, total: number): TablePaginationFlags {
  const normalizedTotal = normalizeTotal(total);
  if (!isPositiveSafeInteger(query.pageSize)) return {pageCount: 0, hasPrevious: false, hasNext: false};
  const pageCount = Math.min(Math.ceil(normalizedTotal / query.pageSize), Number.MAX_SAFE_INTEGER);
  const page = isPositiveSafeInteger(query.page) ? query.page : 1;
  return {pageCount, hasPrevious: page > 1 && pageCount > 0, hasNext: pageCount > 0 && page < pageCount};
}

function getPageSizeOptions(options: readonly number[], currentPageSize: number): number[] {
  const valid = options.filter(isPositiveSafeInteger);
  const unique = [...new Set(valid)];
  if (isPositiveSafeInteger(currentPageSize) && !unique.includes(currentPageSize)) unique.unshift(currentPageSize);
  return unique;
}

export function TablePagination({
  query,
  total,
  onQueryChange,
  pageSizeOptions = defaultPageSizeOptions,
  loading = false,
  labels = {},
}: TablePaginationProps) {
  const {pageCount} = getTablePaginationFlags(query, total);
  const page = isPositiveSafeInteger(query.page) ? query.page : 1;
  const normalizedTotal = normalizeTotal(total);
  const options = getPageSizeOptions(pageSizeOptions, query.pageSize);
  const allowedPageSizes = pageSizeOptions.filter(isPositiveSafeInteger);
  const pageLabel = `${pageCount === 0 ? 0 : page} of ${pageCount} · ${normalizedTotal} items`;
  const handlePageSizeChange = (nextValue: string) => {
    if (loading) return;
    const value = Number(nextValue);
    if (!isPositiveSafeInteger(value) || !allowedPageSizes.includes(value)) return;
    onQueryChange({...query, page: 1, pageSize: value});
  };

  return <s-stack direction="inline" gap="base">
    <s-text aria-live="polite">{`${labels.pagination ?? 'Table pagination'}: ${pageLabel}`}</s-text>
    <s-select
      label={labels.itemsPerPage ?? 'Items per page'}
      labelAccessibilityVisibility="exclusive"
      value={isPositiveSafeInteger(query.pageSize) ? String(query.pageSize) : ''}
      disabled={loading}
      onChange={(event) => handlePageSizeChange(event.currentTarget.value)}
    >
      {options.map((pageSize) => <s-option key={pageSize} value={String(pageSize)} selected={pageSize === query.pageSize}>{pageSize}</s-option>)}
    </s-select>
  </s-stack>;
}
