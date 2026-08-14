import type {ReactNode} from 'react';

export type TableColumnType =
  | 'text'
  | 'number'
  | 'money'
  | 'status'
  | 'datetime'
  | 'image'
  | 'actions'
  | 'custom';

export type TableColumnAlignment = 'start' | 'center' | 'end';

export type TableStatusTone = 'success' | 'info' | 'warning' | 'critical';

export type TableFilterScalar = string | number | boolean;

export type TableFilterOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'in'
  | 'notIn'
  | 'between'
  | 'isEmpty'
  | 'isNotEmpty';

export type TableFilterValue =
  | {operator: 'equals' | 'notEquals'; value: TableFilterScalar}
  | {operator: 'contains'; value: string}
  | {operator: 'in' | 'notIn'; value: readonly TableFilterScalar[]}
  | {operator: 'between'; value: {from?: string | number; to?: string | number}}
  | {operator: 'isEmpty' | 'isNotEmpty'};

export type TableFilters = Record<string, TableFilterValue>;

export interface TableQuery {
  page: number;
  pageSize: number;
  search?: string;
  sort?: {field: string; direction: 'asc' | 'desc'};
  filters?: TableFilters;
}

export interface TableDataPage<T> {
  data: readonly T[];
  total: number;
}

export interface TablePagination {
  total: number;
}

export interface TableFormatOptions {
  locale: string;
  timeZone: string;
  defaultCurrencyCode?: string;
}

export interface TableFormatWarning {
  columnKey: string;
  reason: 'missing-currency-code';
}

/** Shared configuration accepted by every table-column variant. */
export interface TableColumnBase<T extends object> {
  key: string;
  title: ReactNode;
  sortable?: boolean;
  align?: TableColumnAlignment;
  currencyCode?: string | ((row: T) => string | undefined);
  timeZone?: string;
  statusTone?: Readonly<Record<string, TableStatusTone>>;
}

/** Renders a cell value when a built-in column presentation is insufficient. */
export type TableColumnRenderer<T extends object> = (value: unknown, row: T) => ReactNode;

export type TableColumn<T extends object> =
  | (TableColumnBase<T> & {
      type?: Exclude<TableColumnType, 'custom'>;
      render?: TableColumnRenderer<T>;
    })
  | (TableColumnBase<T> & {
      type: 'custom';
      render: TableColumnRenderer<T>;
    });

export interface TableFilterDefinition {
  key: string;
  label: string;
  type: 'text' | 'select' | 'multi-select' | 'boolean' | 'date-range';
  operators: readonly TableFilterOperator[];
  options?: readonly {label: string; value: string}[];
}

export type TableSelection =
  | {mode: 'explicit'; ids: readonly string[]}
  | {
      mode: 'allMatching';
      selectionToken: string;
      selectedCount: number;
      expiresAt: string;
      excludedIds: readonly string[];
    };

export interface TableBulkFailure {
  id: string;
  reason: string;
}

export type TableBulkActionResult =
  | {
      status: 'completed';
      succeededCount: number;
      failed: readonly TableBulkFailure[];
      clearSelection: boolean;
    }
  | {
      status: 'accepted';
      operationId: string;
      acceptedCount: number;
      clearSelection: boolean;
    };

export interface TableRowAction<T extends object> {
  id: string;
  content: ReactNode;
  destructive?: boolean;
  perform: (context: {row: T; rowId: string}) => void | Promise<void>;
}

export interface TableBulkAction {
  id: string;
  content: ReactNode;
  destructive?: boolean;
  perform: (context: {
    actionId: string;
    selection: TableSelection;
    idempotencyKey: string;
  }) => Promise<TableBulkActionResult>;
}

export interface TableSelectAllMatchingResult {
  selectionToken: string;
  normalizedQuery: TableQuery;
  selectedCount: number;
  expiresAt: string;
}

export interface TableProps<T extends object> {
  columns: readonly TableColumn<T>[];
  data: readonly T[];
  rowId: Extract<keyof T, string> | ((row: T) => string);
  query: TableQuery;
  pagination: TablePagination;
  formatOptions: TableFormatOptions;
  filters?: readonly TableFilterDefinition[];
  selection: TableSelection;
  onSelectionChange: (selection: TableSelection) => void;
  onSelectAllMatching?: (query: TableQuery) => Promise<TableSelectAllMatchingResult>;
  rowActions?: readonly TableRowAction<T>[];
  bulkActions?: readonly TableBulkAction[];
  onFormatWarning?: (warning: TableFormatWarning) => void;
  loading?: boolean;
  error?: ReactNode;
  emptyState?: ReactNode;
  onRetry?: () => void;
  onQueryChange: (query: TableQuery) => void;
}
