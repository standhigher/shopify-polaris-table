import type {Meta, StoryObj} from '@storybook/react-vite';
import {useEffect, useMemo, useState} from 'react';

import {decodeTableQuery, encodeTableQuery, Table} from '../index';
import type {TableColumn, TableFilterDefinition, TableFilters, TableQuery, TableSelection} from '../types';

type InventoryRow = {
  id: string;
  title: string;
  status: 'active' | 'draft' | 'archived';
  tags: string;
  enabled: boolean;
  createdAtISO: string;
  createdAt: string;
  quantity: number;
};

const inventoryRows: readonly InventoryRow[] = Array.from({length: 50}, (_, index) => {
  const number = index + 1;
  const statuses: InventoryRow['status'][] = ['active', 'draft', 'archived'];
  const tags = ['summer', 'winter', 'featured', 'clearance'];
  return {
    id: `inventory-${number}`,
    title: `Inventory item ${String(number).padStart(2, '0')}`,
    status: statuses[index % statuses.length]!,
    tags: `${tags[index % tags.length]!},${tags[(index + 1) % tags.length]!}`,
    enabled: index % 3 !== 0,
    createdAtISO: new Date(Date.UTC(2026, 0, 1 + index)).toISOString(),
    createdAt: new Date(Date.UTC(2026, 0, 1 + index)).toISOString(),
    quantity: (index * 17) % 240,
  };
});

const pageSizeOptions = [10, 25, 50] as const;
const urlOptions = {
  filterKeys: ['title', 'status', 'tags', 'enabled', 'createdAt'],
  sortKeys: ['title', 'quantity', 'createdAt'],
  pageSizeOptions,
} as const;
const filterDefinitions: readonly TableFilterDefinition[] = [
  {key: 'title', label: 'Title', type: 'text', operators: ['contains']},
  {key: 'status', label: 'Status', type: 'select', operators: ['equals'], options: [{label: 'Active', value: 'active'}, {label: 'Draft', value: 'draft'}, {label: 'Archived', value: 'archived'}]},
  {key: 'tags', label: 'Tags', type: 'multi-select', operators: ['in'], options: [{label: 'Summer', value: 'summer'}, {label: 'Winter', value: 'winter'}, {label: 'Featured', value: 'featured'}, {label: 'Clearance', value: 'clearance'}]},
  {key: 'enabled', label: 'Enabled', type: 'boolean', operators: ['equals']},
  {key: 'createdAt', label: 'Created at', type: 'date-range', operators: ['between']},
];
const columns: readonly TableColumn<InventoryRow>[] = [
  {key: 'title', title: 'Title', type: 'text', sortable: true, listSlot: 'primary'},
  {key: 'status', title: 'Status', type: 'status', statusTone: {active: 'success', draft: 'warning', archived: 'critical'}, listSlot: 'inline'},
  {key: 'tags', title: 'Tags', type: 'text', listSlot: 'secondary'},
  {key: 'enabled', title: 'Enabled', type: 'text', listSlot: 'labeled'},
  {key: 'createdAt', title: 'Created', type: 'datetime', sortable: true, listSlot: 'labeled'},
  {key: 'quantity', title: 'Quantity', type: 'number', sortable: true, align: 'end', listSlot: 'labeled'},
];
const emptySelection: TableSelection = {mode: 'explicit', ids: []};
const formatOptions = {locale: 'en-US', timeZone: 'UTC'};
const allowedQueryKeys = ['v', 'page', 'pageSize', 'search', 'sort', 'filters'] as const;

type QueryPipelineProps = {loading: boolean};

function readUrlQuery(): TableQuery {
  if (typeof window === 'undefined') return {page: 1, pageSize: 10};
  return decodeTableQuery(new URLSearchParams(window.location.search), urlOptions);
}

function updateUrlQuery(query: TableQuery): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  for (const key of allowedQueryKeys) url.searchParams.delete(key);
  for (const [key, value] of encodeTableQuery(query, urlOptions).entries()) url.searchParams.set(key, value);
  const search = url.searchParams.toString();
  const nextUrl = `${url.pathname}${search ? `?${search}` : ''}${url.hash}`;
  window.history.pushState(window.history.state, '', nextUrl);
}

function getFilter(filters: TableFilters | undefined, key: string) {
  return filters?.[key];
}

function matchesQuery(row: InventoryRow, query: TableQuery): boolean {
  const search = query.search?.trim().toLowerCase();
  if (search && !row.title.toLowerCase().includes(search) && !row.id.toLowerCase().includes(search)) return false;
  const filters = query.filters;
  const title = getFilter(filters, 'title');
  if (title?.operator === 'contains' && !row.title.toLowerCase().includes(title.value.toLowerCase())) return false;
  const status = getFilter(filters, 'status');
  if (status?.operator === 'equals' && row.status !== String(status.value)) return false;
  const tags = getFilter(filters, 'tags');
  if ((tags?.operator === 'in' || tags?.operator === 'notIn') && Array.isArray(tags.value)) {
    const rowTags = new Set(row.tags.split(','));
    const matched = tags.value.some((tag) => rowTags.has(String(tag)));
    if (tags.operator === 'in' && !matched) return false;
    if (tags.operator === 'notIn' && matched) return false;
  }
  const enabled = getFilter(filters, 'enabled');
  if (enabled?.operator === 'equals' && row.enabled !== enabled.value) return false;
  const createdAt = getFilter(filters, 'createdAt');
  if (createdAt?.operator === 'between') {
    const timestamp = Date.parse(row.createdAtISO);
    const from = createdAt.value.from === undefined ? undefined : Date.parse(String(createdAt.value.from));
    const to = createdAt.value.to === undefined ? undefined : Date.parse(`${String(createdAt.value.to)}T23:59:59.999Z`);
    if (from !== undefined && timestamp < from) return false;
    if (to !== undefined && timestamp > to) return false;
  }
  return true;
}

function QueryPipelineExample({loading}: QueryPipelineProps) {
  const [query, setQuery] = useState<TableQuery>(readUrlQuery);
  const [selection, setSelection] = useState<TableSelection>(emptySelection);

  useEffect(() => {
    const onPopState = () => setQuery(readUrlQuery());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const matchedRows = useMemo(() => {
    const matched = inventoryRows.filter((row) => matchesQuery(row, query));
    if (!query.sort) return matched;
    return [...matched].sort((left, right) => {
      const leftValue = left[query.sort!.field as keyof InventoryRow];
      const rightValue = right[query.sort!.field as keyof InventoryRow];
      const comparison = String(leftValue).localeCompare(String(rightValue), undefined, {numeric: true});
      return query.sort!.direction === 'asc' ? comparison : -comparison;
    });
  }, [query]);
  const pageStart = (query.page - 1) * query.pageSize;
  const pageRows = matchedRows.slice(pageStart, pageStart + query.pageSize);
  const updateQuery = (nextQuery: TableQuery) => {
    setQuery(nextQuery);
    updateUrlQuery(nextQuery);
  };
  const restoreQuery = () => updateQuery({page: 1, pageSize: 10, search: 'Inventory item 2'});

  return <>
    <s-stack direction="inline" gap="base">
      <s-button onClick={restoreQuery}>Restore query</s-button>
      <s-text data-testid="matched-count">Matched {matchedRows.length} of {inventoryRows.length}</s-text>
    </s-stack>
    <s-section>
      <s-text data-testid="query-json">{JSON.stringify(query)}</s-text>
    </s-section>
    <Table
      columns={columns}
      data={pageRows}
      rowId="id"
      query={query}
      pagination={{total: matchedRows.length}}
      pageSizeOptions={pageSizeOptions}
      formatOptions={formatOptions}
      filters={filterDefinitions}
      selection={selection}
      onSelectionChange={setSelection}
      onQueryChange={updateQuery}
      loading={loading}
    />
  </>;
}

const meta = {
  title: 'Integration features/Query Pipeline',
  component: QueryPipelineExample,
  parameters: {docs: {description: {component: 'A local, controlled query pipeline that applies search, typed filters, sorting, offset pagination, and URL v1 state.'}}},
  argTypes: {loading: {control: 'boolean'}},
} satisfies Meta<typeof QueryPipelineExample>;

export default meta;
type Story = StoryObj<typeof meta>;
export const ControlledUrlQuery: Story = {args: {loading: false}};
