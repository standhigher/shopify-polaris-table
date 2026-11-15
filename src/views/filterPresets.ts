import type {TableFilters, TableFilterValue, TableQuery} from '../types';

/** A curated, stable filter shortcut. It intentionally cannot alter sort, page size or visible columns. */
export interface TableFilterPreset {
  id: string;
  label: string;
  filters: TableFilters;
}

function cloneFilterValue(value: TableFilterValue): TableFilterValue {
  if (value.operator === 'in' || value.operator === 'notIn') return {...value, value: [...value.value]};
  if (value.operator === 'between') return {...value, value: {...value.value}};
  return {...value};
}

function cloneFilters(filters: TableFilters): TableFilters {
  return Object.fromEntries(Object.entries(filters).map(([key, value]) => [key, cloneFilterValue(value)]));
}

export function applyFilterPreset(query: TableQuery, preset: TableFilterPreset): TableQuery {
  return {...query, page: 1, filters: cloneFilters(preset.filters)};
}
