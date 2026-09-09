import {describe, expect, it} from 'vitest';

import {decodeTableQuery, encodeTableQuery, TABLE_QUERY_URL_VERSION} from './urlQuery';

describe('table query URL adapter', () => {
  it('round trips the fixed V1 offset-query contract and JSON filters', () => {
    const query = {page: 2, pageSize: 50, search: 'shoe & bag', sort: {field: 'name', direction: 'asc' as const}, filters: {
      status: {operator: 'equals' as const, value: 'active'}, quantity: {operator: 'equals' as const, value: 0}, archived: {operator: 'equals' as const, value: false},
    }};
    const options = {filterKeys: ['status', 'quantity', 'archived'], sortKeys: ['name'], pageSizeOptions: [25, 50, 100]};
    const params = encodeTableQuery(query, options);

    expect(params.get('v')).toBe(TABLE_QUERY_URL_VERSION);
    expect(params.get('page')).toBe('2');
    expect(decodeTableQuery(params, options)).toEqual(query);
  });

  it('omits sensitive and non-allowlisted URL state when encoding', () => {
    const params = encodeTableQuery({
      page: 2.8,
      pageSize: 99,
      sort: {field: 'privateField', direction: 'asc'},
      filters: {
        status: {operator: 'equals', value: 'active'},
        customerEmail: {operator: 'contains', value: 'customer@example.com'},
      },
    }, {
      filterKeys: ['status', 'customerEmail'],
      sensitiveFilterKeys: ['customerEmail'],
      sortKeys: ['name'],
      pageSizeOptions: [25, 50],
    });

    expect(params).toEqual(new URLSearchParams('v=1&page=2&pageSize=25&filters=%7B%22status%22%3A%7B%22operator%22%3A%22equals%22%2C%22value%22%3A%22active%22%7D%7D'));
    expect(params.get('sort')).toBeNull();
  });

  it('falls back safely for an unknown version and invalid page values', () => {
    const options = {pageSizeOptions: [25, 50]};

    expect(decodeTableQuery(new URLSearchParams('v=2&page=4&pageSize=50'), options)).toEqual({page: 1, pageSize: 25});
    expect(decodeTableQuery(new URLSearchParams('v=1&page=0&pageSize=99'), options)).toEqual({page: 1, pageSize: 25});
    expect(decodeTableQuery(new URLSearchParams('v=1&page=9007199254740992&pageSize=50'), options)).toEqual({page: 1, pageSize: 50});
  });

  it('drops an unallowlisted sort and rejects malformed or unsafe filters as a whole', () => {
    const options = {filterKeys: ['status'], sortKeys: ['name']};
    const encodedFilters = JSON.stringify({
      status: {operator: 'equals', value: 'active'},
      privateField: {operator: 'equals', value: 'secret'},
    });

    expect(decodeTableQuery(new URLSearchParams('v=1&page=2&pageSize=25&sort=asc:privateField'), options)).toEqual({page: 2, pageSize: 25});
    expect(decodeTableQuery(new URLSearchParams({v: '1', filters: encodedFilters}), options)).toEqual({page: 1, pageSize: 1});
    expect(decodeTableQuery(new URLSearchParams('v=1&filters=%7Bbad'), options)).toEqual({page: 1, pageSize: 1});
  });
});
