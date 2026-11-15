import {describe, expect, it} from 'vitest';
import {applyFilterPreset} from './filterPresets';
import type {TableFilterPreset} from './filterPresets';

describe('filter preset snapshots', () => {
  it('does not alias mutable filter records, arrays or ranges', () => {
    const preset: TableFilterPreset = {id: 'range', label: 'Range', filters: {
      createdAt: {operator: 'between', value: {from: '2026-01-01'}},
      tags: {operator: 'in', value: ['summer']},
      enabled: {operator: 'equals', value: false},
    }};
    const next = applyFilterPreset({page: 4, pageSize: 25, search: 'shoe'}, preset);
    expect(next.page).toBe(1);
    expect(next.filters).not.toBe(preset.filters);
    expect(next.filters?.tags).not.toBe(preset.filters.tags);
    if (next.filters?.createdAt?.operator === 'between') next.filters.createdAt.value.from = 'changed';
    expect(preset.filters.createdAt).toEqual({operator: 'between', value: {from: '2026-01-01'}});
    expect(next.filters?.tags?.operator === 'in' && next.filters.tags.value).not.toBe(preset.filters.tags && 'value' in preset.filters.tags ? preset.filters.tags.value : undefined);
  });
});
