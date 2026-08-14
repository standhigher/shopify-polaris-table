import type {TableFilters, TableQuery} from '../types';

/** A curated, stable filter shortcut. It intentionally cannot alter sort, page size or visible columns. */
export interface TableFilterPreset {
  id: string;
  label: string;
  filters: TableFilters;
}

export function applyFilterPreset(query: TableQuery, preset: TableFilterPreset): TableQuery {
  return {...query, page: 1, filters: preset.filters};
}
