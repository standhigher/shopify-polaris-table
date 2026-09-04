import {useEffect, useMemo, useState} from 'react';
import {Checkbox, ChoiceList, Filters, Select, TextField} from '@shopify/polaris';

import type {TableFilterDefinition, TableFilterValue, TableQuery} from '../../types';
import {cleanFilters} from '../../hooks/useTableQuery';

export interface TableFiltersProps {
  query: TableQuery;
  filters?: readonly TableFilterDefinition[];
  onQueryChange: (query: TableQuery) => void;
  searchDebounceMs?: number;
  loading?: boolean | undefined;
}

function setFilter(query: TableQuery, key: string, value: TableFilterValue | undefined): TableQuery {
  const filters: Record<string, TableFilterValue> = {...(query.filters ?? {})};
  if (value === undefined) delete filters[key];
  else filters[key] = value;
  const cleaned = cleanFilters(filters);
  return cleaned ? {...query, page: 1, filters: cleaned} : (() => {
    const next = {...query, page: 1};
    delete next.filters;
    return next;
  })();
}

function pickTypedOperator<T extends TableFilterValue['operator']>(
  definition: TableFilterDefinition,
  preferred: readonly T[],
): T | undefined {
  return preferred.find((operator) => definition.operators.includes(operator));
}

function createTextFilter(operator: 'contains' | 'equals' | 'notEquals', value: string): TableFilterValue {
  return operator === 'contains' ? {operator, value} : {operator, value};
}

function createScalarFilter(operator: 'equals' | 'notEquals', value: string | boolean): TableFilterValue {
  return {operator, value};
}

function getRangeValue(value: TableFilterValue | undefined): {from?: string | number; to?: string | number} {
  if (!value || value.operator !== 'between') return {};
  return value.value;
}

export function TableFilters({query, filters = [], onQueryChange, searchDebounceMs = 300, loading = false}: TableFiltersProps) {
  const [search, setSearch] = useState(query.search ?? '');

  useEffect(() => setSearch(query.search ?? ''), [query.search]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (search === (query.search ?? '')) return;
      const next = {...query, page: 1};
      if (search.trim()) next.search = search;
      else delete next.search;
      onQueryChange(next);
    }, Math.max(0, searchDebounceMs));
    return () => window.clearTimeout(timer);
  }, [onQueryChange, query, search, searchDebounceMs]);

  const filterControls = useMemo(() => filters.map((definition) => {
    const current = query.filters?.[definition.key];
    const currentValue = current && 'value' in current ? current.value : undefined;
    if (definition.type === 'text') {
      const operator = pickTypedOperator(definition, ['contains', 'equals', 'notEquals']);
      if (!operator) return null;
      return <TextField key={definition.key} label={definition.label} value={typeof currentValue === 'string' ? currentValue : ''} autoComplete="off" onChange={(value) => onQueryChange(setFilter(query, definition.key, value ? createTextFilter(operator, value) : undefined))} />;
    }
    if (definition.type === 'select') {
      const operator = pickTypedOperator(definition, ['equals', 'notEquals']);
      if (!operator) return null;
      return <Select key={definition.key} label={definition.label} options={definition.options?.map((option) => ({label: option.label, value: option.value})) ?? []} value={typeof currentValue === 'string' ? currentValue : ''} onChange={(value) => onQueryChange(setFilter(query, definition.key, value ? createScalarFilter(operator, value) : undefined))} />;
    }
    if (definition.type === 'multi-select') {
      const operator = pickTypedOperator(definition, ['in', 'notIn']);
      if (!operator) return null;
      const selected = Array.isArray(currentValue) ? currentValue.map(String) : [];
      return <ChoiceList key={definition.key} title={definition.label} allowMultiple choices={definition.options?.map((option) => ({label: option.label, value: option.value})) ?? []} selected={selected} onChange={(values) => onQueryChange(setFilter(query, definition.key, values.length ? {operator, value: values} : undefined))} />;
    }
    if (definition.type === 'boolean') {
      const operator = pickTypedOperator(definition, ['equals', 'notEquals']);
      if (!operator) return null;
      const checked = operator === 'equals' ? currentValue === true : currentValue === false;
      return <Checkbox key={definition.key} label={definition.label} checked={checked} onChange={(value) => onQueryChange(setFilter(query, definition.key, createScalarFilter(operator, operator === 'notEquals' ? !value : value)))} />;
    }
    if (!definition.operators.includes('between')) return null;
    const range = getRangeValue(current);
    return <div key={definition.key} data-testid={`filter-${definition.key}`}><TextField label={`${definition.label} from`} value={range.from === undefined ? '' : String(range.from)} autoComplete="off" onChange={(value) => {
      const nextRange: {from?: string | number; to?: string | number} = {};
      if (value) nextRange.from = value;
      if (range.to !== undefined && range.to !== '') nextRange.to = range.to;
      onQueryChange(setFilter(query, definition.key, value || range.to ? {operator: 'between', value: nextRange} : undefined));
    }} /><TextField label={`${definition.label} to`} value={range.to === undefined ? '' : String(range.to)} autoComplete="off" onChange={(value) => {
      const nextRange: {from?: string | number; to?: string | number} = {};
      if (range.from !== undefined && range.from !== '') nextRange.from = range.from;
      if (value) nextRange.to = value;
      onQueryChange(setFilter(query, definition.key, range.from || value ? {operator: 'between', value: nextRange} : undefined));
    }} /></div>;
  }), [filters, onQueryChange, query]);

  return <Filters
    queryValue={search}
    onQueryChange={setSearch}
    onQueryClear={() => setSearch('')}
    onClearAll={() => {
      const next = {...query, page: 1};
      delete next.search;
      delete next.filters;
      setSearch('');
      onQueryChange(next);
    }}
    filters={filterControls.map((filter, index) => ({key: String(filters[index]?.key ?? index), label: String(filters[index]?.label ?? ''), filter}))}
    appliedFilters={filters.filter((definition) => query.filters?.[definition.key]).map((definition) => ({key: definition.key, label: definition.label, onRemove: () => onQueryChange(setFilter(query, definition.key, undefined))}))}
    hideFilters={filters.length === 0}
    loading={loading}
  >{filterControls}</Filters>;
}
