import {Button, ButtonGroup} from '@shopify/polaris';

import {applyFilterPreset} from '../../views/filterPresets';
import type {TableFilterPreset} from '../../views/filterPresets';
import type {TableQuery} from '../../types';

export interface TableFilterPresetsProps {
  presets: readonly TableFilterPreset[];
  query: TableQuery;
  onQueryChange: (query: TableQuery) => void;
}

/** Applies curated filter-only shortcuts without taking ownership of query state. */
export function TableFilterPresets({presets, query, onQueryChange}: TableFilterPresetsProps) {
  if (presets.length === 0) return null;

  return <ButtonGroup>
    {presets.map((preset) => <Button key={preset.id} onClick={() => onQueryChange(applyFilterPreset(query, preset))}>{preset.label}</Button>)}
  </ButtonGroup>;
}
