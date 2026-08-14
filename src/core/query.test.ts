import {describe, expect, it} from 'vitest';
import {normalizeCoreQuery, updateCoreQuery} from './query';

describe('renderer-independent query utilities', () => {
  it('normalizes empty values and keeps false/zero', () => {
    expect(normalizeCoreQuery({page: 0, pageSize: 0, search: ' ', filters: {active: {operator: 'equals', value: false}, count: {operator: 'equals', value: 0}}})).toEqual({page: 1, pageSize: 1, filters: {active: {operator: 'equals', value: false}, count: {operator: 'equals', value: 0}}});
  });

  it('resets page for query criteria changes but not pagination changes', () => {
    const query = {page: 3, pageSize: 20, search: 'ada'};
    expect(updateCoreQuery(query, {search: 'bob'})).toEqual({page: 1, pageSize: 20, search: 'bob'});
    expect(updateCoreQuery(query, {page: 4})).toEqual({page: 4, pageSize: 20, search: 'ada'});
  });
});
