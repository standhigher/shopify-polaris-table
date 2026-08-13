import {describe, expect, it} from 'vitest';
import {decodeTableQuery, encodeTableQuery} from './urlQuery';

describe('table query URL adapter', () => {
  it('round trips offset query and JSON filters', () => {
    const query = {page: 2, pageSize: 50, search: 'shoe & bag', sort: {field: 'name', direction: 'asc' as const}, filters: {
      status: {operator: 'equals' as const, value: 'active'}, quantity: {operator: 'equals' as const, value: 0}, archived: {operator: 'equals' as const, value: false},
    }};
    const params = encodeTableQuery(query);
    expect(params.get('page')).toBe('2');
    expect(decodeTableQuery(params)).toEqual(query);
  });

  it('rejects invalid JSON filters and unsafe fields', () => {
    expect(decodeTableQuery(new URLSearchParams('page=0&pageSize=-1&filters=%7Bbad'))).toEqual({page: 1, pageSize: 1});
    expect(decodeTableQuery(new URLSearchParams('filters=%7B%22x%22%3A%7B%22operator%22%3A%22drop%22%2C%22value%22%3A1%7D%7D'))).toEqual({page: 1, pageSize: 1});
  });
});
