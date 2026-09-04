import {Pagination, Select} from '@shopify/polaris';

import type {TableLabels, TableQuery} from '../../types';

export interface TablePaginationProps {
  query: TableQuery;
  total: number;
  onQueryChange: (query: TableQuery) => void;
  pageSizeOptions?: readonly number[] | undefined;
  loading?: boolean | undefined;
  labels?: Partial<TableLabels> | undefined;
}

export function TablePagination({
  query,
  total,
  onQueryChange,
  pageSizeOptions = [10, 25, 50, 100],
  loading = false,
  labels = {},
}: TablePaginationProps) {
  const pageCount = Math.ceil(total / query.pageSize);
  const hasPrevious = query.page > 1;
  const hasNext = query.page < pageCount;

  return (
    <div aria-live="polite">
      <Pagination
        accessibilityLabel={labels.pagination ?? 'Table pagination'}
        accessibilityLabels={{previous: labels.previousPage ?? 'Previous page', next: labels.nextPage ?? 'Next page'}}
        hasPrevious={hasPrevious && !loading}
        hasNext={hasNext && !loading}
        label={`${total === 0 ? 0 : query.page} of ${pageCount || 0} · ${total} items`}
        onPrevious={() => onQueryChange({...query, page: Math.max(1, query.page - 1)})}
        onNext={() => onQueryChange({...query, page: query.page + 1})}
      />
      <Select
        label={labels.itemsPerPage ?? 'Items per page'}
        options={pageSizeOptions.map((pageSize) => ({label: String(pageSize), value: String(pageSize)}))}
        value={String(query.pageSize)}
        disabled={loading}
        onChange={(value) => {
          const pageSize = Number(value);
          if (Number.isFinite(pageSize) && pageSize > 0) {
            onQueryChange({...query, page: 1, pageSize});
          }
        }}
      />
    </div>
  );
}
