import {useEffect, useId, useRef, useState} from 'react';

import type {TableFilterDefinition, TableFilterScalar, TableFilterValue, TableQuery} from '../../types';
import {cleanFilters} from '../../hooks/useTableQuery';

export interface TableFiltersProps {
  query: TableQuery;
  filters?: readonly TableFilterDefinition[];
  onQueryChange: (query: TableQuery) => void;
  searchDebounceMs?: number;
  loading?: boolean | undefined;
}

function setFilter(query: TableQuery, key: string, value: TableFilterValue | undefined): TableQuery {
  const filters = {...(query.filters ?? {})};
  if (value === undefined) delete filters[key];
  else filters[key] = value;
  const next = {...query, page: 1};
  const cleaned = cleanFilters(filters);
  if (cleaned) next.filters = cleaned;
  else delete next.filters;
  return next;
}

function pickOperator<T extends TableFilterValue['operator']>(definition: TableFilterDefinition, supported: readonly T[], current: TableFilterValue | undefined): T | undefined {
  return supported.find((operator) => operator === current?.operator && definition.operators.includes(operator)) ?? supported.find((operator) => definition.operators.includes(operator));
}

function filterLabel(definition: TableFilterDefinition, filter: TableFilterValue): string {
  if (!('value' in filter)) return `${definition.label}: ${filter.operator}`;
  const labelFor = (value: TableFilterScalar) => definition.options?.find((option) => option.value === String(value))?.label ?? String(value);
  if (filter.operator === 'between') return `${definition.label}: ${filter.value.from ?? '…'} – ${filter.value.to ?? '…'}`;
  const value = filter.value;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return `${definition.label}: ${labelFor(value)}`;
  return `${definition.label}: ${value.map(labelFor).join(', ')}`;
}

type SearchDraft = {value: string; baseline: string};

export function TableFilters({query, filters = [], onQueryChange, searchDebounceMs = 300, loading = false}: TableFiltersProps) {
  const popoverId = useId();
  const snapshot = JSON.stringify(query);
  const [draft, setDraft] = useState<SearchDraft>();
  const activeDraft = draft?.baseline === snapshot ? draft : undefined;
  const search = activeDraft?.value ?? query.search ?? '';
  const latest = useRef({query, onQueryChange, loading});
  useEffect(() => { latest.current = {query, onQueryChange, loading}; }, [loading, onQueryChange, query]);
  useEffect(() => {
    // Permanently discard a stale draft: A -> B -> A must not revive a search
    // that was cancelled by navigation or a refresh loading boundary.
    if (draft && (draft.baseline !== snapshot || loading)) setDraft(undefined);
  }, [draft, loading, snapshot]);

  useEffect(() => {
    if (!draft || draft.baseline !== snapshot || loading) return;
    const searchValue = draft.value.trim();
    if (searchValue === (query.search ?? '').trim()) return;
    const delay = Number.isFinite(searchDebounceMs) ? Math.max(0, searchDebounceMs) : 300;
    const timer = window.setTimeout(() => {
      const current = latest.current;
      if (current.loading || JSON.stringify(current.query) !== draft.baseline) return;
      const next = {...current.query, page: 1};
      if (searchValue) next.search = searchValue;
      else delete next.search;
      setDraft(undefined);
      current.onQueryChange(next);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [draft, loading, query.search, searchDebounceMs, snapshot]);

  // Immediate filter changes also commit the current search draft, so a late
  // search timer cannot overwrite a newly selected filter or router restore.
  const emitQuery = (next: TableQuery) => {
    if (loading) return;
    if (activeDraft) {
      const value = activeDraft.value.trim();
      if (value) next.search = value;
      else delete next.search;
    }
    setDraft(undefined);
    onQueryChange(next);
  };

  const filterControls = filters.map((definition) => {
    const current = query.filters?.[definition.key];
    const currentValue = current && 'value' in current ? current.value : undefined;
    if (definition.type === 'text') {
      const operator = pickOperator(definition, ['contains', 'equals', 'notEquals'], current);
      if (!operator) return null;
      return <s-text-field key={definition.key} label={definition.label} value={typeof currentValue === 'string' ? currentValue : ''} autocomplete="off" disabled={loading} onInput={(event) => {
        const value = event.currentTarget.value;
        emitQuery(setFilter(query, definition.key, value ? {operator, value} : undefined));
      }} />;
    }
    if (definition.type === 'select') {
      const operator = pickOperator(definition, ['equals', 'notEquals'], current);
      if (!operator) return null;
      const value = typeof currentValue === 'string' ? currentValue : '';
      return <s-select key={definition.key} label={definition.label} value={value} disabled={loading} onChange={(event) => {
        const nextValue = event.currentTarget.value;
        if (nextValue && !definition.options?.some((option) => option.value === nextValue)) return;
        emitQuery(setFilter(query, definition.key, nextValue ? {operator, value: nextValue} : undefined));
      }}>
        <s-option value="">Any</s-option>
        {definition.options?.map((option) => <s-option key={option.value} value={option.value}>{option.label}</s-option>)}
      </s-select>;
    }
    if (definition.type === 'multi-select') {
      const operator = pickOperator(definition, ['in', 'notIn'], current);
      if (!operator) return null;
      const selected = Array.isArray(currentValue) ? currentValue.map(String) : [];
      return <s-choice-list key={definition.key} label={definition.label} multiple values={selected} disabled={loading} onChange={(event) => {
        const values = [...new Set(event.currentTarget.values)];
        if (values.some((value) => !definition.options?.some((option) => option.value === value))) return;
        emitQuery(setFilter(query, definition.key, values.length ? {operator, value: values} : undefined));
      }}>
        {definition.options?.map((option) => <s-choice key={option.value} value={option.value}>{option.label}</s-choice>)}
      </s-choice-list>;
    }
    if (definition.type === 'boolean') {
      const operator = pickOperator(definition, ['equals', 'notEquals'], current);
      if (!operator) return null;
      const checked = operator === 'equals' ? currentValue === true : currentValue === false;
      return <s-checkbox key={definition.key} label={definition.label} checked={checked} disabled={loading} onChange={(event) => {
        const value = event.currentTarget.checked;
        emitQuery(setFilter(query, definition.key, {operator, value: operator === 'notEquals' ? !value : value}));
      }} />;
    }
    if (!definition.operators.includes('between')) return null;
    const range = current?.operator === 'between' ? current.value : {};
    const updateRange = (part: 'from' | 'to', value: string) => {
      const nextRange = {...range};
      if (value) nextRange[part] = value;
      else delete nextRange[part];
      const hasBoundary = [nextRange.from, nextRange.to].some((boundary) => boundary !== undefined && boundary !== '');
      emitQuery(setFilter(query, definition.key, hasBoundary ? {operator: 'between', value: nextRange} : undefined));
    };
    return <s-stack key={definition.key} direction="inline" gap="base" data-testid={`filter-${definition.key}`}>
      <s-text-field label={`${definition.label} from`} value={range.from === undefined ? '' : String(range.from)} autocomplete="off" disabled={loading} onInput={(event) => updateRange('from', event.currentTarget.value)} />
      <s-text-field label={`${definition.label} to`} value={range.to === undefined ? '' : String(range.to)} autocomplete="off" disabled={loading} onInput={(event) => updateRange('to', event.currentTarget.value)} />
    </s-stack>;
  });

  return <s-stack direction="inline" gap="base">
    <s-search-field label="Search" labelAccessibilityVisibility="exclusive" value={search} disabled={loading} onInput={(event) => {
      if (!loading) setDraft({value: event.currentTarget.value, baseline: snapshot});
    }} />
    {filters.length > 0 ? <>
      <s-button commandFor={popoverId} disabled={loading}>Filters</s-button>
      <s-popover id={popoverId} inlineSize="320px">
        <div style={{maxBlockSize: 'min(70vh, 480px)', overflowY: 'auto'}}><s-box padding="base"><s-stack gap="base">{filterControls}</s-stack></s-box></div>
      </s-popover>
    </> : null}
    {filters.map((definition) => {
      const filter = query.filters?.[definition.key];
      return filter ? <s-clickable-chip key={definition.key} removable hidden={false} disabled={loading} accessibilityLabel={`Remove ${definition.label} filter`} onRemove={() => emitQuery(setFilter(query, definition.key, undefined))}>{filterLabel(definition, filter)}</s-clickable-chip> : null;
    })}
    {(search || Object.keys(query.filters ?? {}).length > 0) ? <s-button disabled={loading} onClick={() => {
      if (loading) return;
      const next = {...query, page: 1};
      delete next.search;
      delete next.filters;
      setDraft(undefined);
      onQueryChange(next);
    }}>Clear all</s-button> : null}
  </s-stack>;
}
