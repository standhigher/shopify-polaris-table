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

  it.each([
    '{"range":{"operator":"between","value":{"from":1e400}}}',
    '{"range":{"operator":"between","value":{"to":-1e400}}}',
    '{"range":{"operator":"between","value":{"from":true}}}',
    '{"range":{"operator":"between","value":{}}}',
    '{"range":{"operator":"in","value":[1,1e400]}}',
    '{"range":{"operator":"equals","value":1e400}}',
    '{"range":{"operator":"unknown","value":0}}',
  ])('rejects malformed filter JSON as a whole: %s', (filters) => {
    const params = new URLSearchParams({v: '1', filters});
    expect(decodeTableQuery(params)).toEqual({page: 1, pageSize: 1});
  });

  it('omits invalid numeric ranges on encode without losing false or zero', () => {
    const params = encodeTableQuery({page: 1, pageSize: 25, filters: {
      unsafe: {operator: 'between', value: {from: Number.POSITIVE_INFINITY}},
      count: {operator: 'equals', value: 0},
      enabled: {operator: 'equals', value: false},
      safeRange: {operator: 'between', value: {from: 0, to: 10}},
    }});
    expect(decodeTableQuery(params).filters).toEqual({
      count: {operator: 'equals', value: 0}, enabled: {operator: 'equals', value: false},
      safeRange: {operator: 'between', value: {from: 0, to: 10}},
    });
  });

  it.each(['', ' name', 'name ', 'name:other', 'name\u0000', 'name\nother'])('rejects unsafe sort syntax %j on encode and decode', (field) => {
    expect(encodeTableQuery({page: 1, pageSize: 25, sort: {field, direction: 'asc'}}).has('sort')).toBe(false);
    expect(decodeTableQuery(new URLSearchParams({v: '1', sort: `asc:${field}`})).sort).toBeUndefined();
  });

  it.each(['', '0', '2', '1.0', '01', ' 1'])('rejects noncanonical version %j without restoring any criteria', (version) => {
    expect(decodeTableQuery(new URLSearchParams({v: version, page: '2', pageSize: '50', search: 'private'}), {pageSizeOptions: [25, 50]})).toEqual({page: 1, pageSize: 25});
  });

  it.each(['0', '-1', '1.5', 'NaN', 'Infinity', '1e2', '9007199254740992'])('falls back for invalid page/pageSize %j', (value) => {
    expect(decodeTableQuery(new URLSearchParams({v: '1', page: value, pageSize: value}), {pageSizeOptions: [25, 50]})).toEqual({page: 1, pageSize: 25});
  });

  it('retains valid dotted sort names and filters by the supplied allowlist', () => {
    const query = {page: 1, pageSize: 25, sort: {field: 'inventory.quantity', direction: 'desc' as const}};
    expect(decodeTableQuery(encodeTableQuery(query), {sortKeys: ['inventory.quantity']})).toEqual(query);
    expect(decodeTableQuery(encodeTableQuery(query), {sortKeys: []})).toEqual({page: 1, pageSize: 25});
  });

  it('rejects duplicate versions, unsafe sort fields, and non-finite between bounds', () => {
    const options = {filterKeys: ['createdAt'], sortKeys: ['name']};
    expect(decodeTableQuery(new URLSearchParams('v=1&v=1&page=2'), options)).toEqual({page: 1, pageSize: 1});
    expect(decodeTableQuery(new URLSearchParams('v=1&sort=asc:name%20desc'), options)).toEqual({page: 1, pageSize: 1});
    expect(decodeTableQuery(new URLSearchParams({v: '1', filters: JSON.stringify({createdAt: {operator: 'between', value: {from: Number.POSITIVE_INFINITY}}})}), options)).toEqual({page: 1, pageSize: 1});
    expect(decodeTableQuery(new URLSearchParams({v: '1', filters: JSON.stringify({createdAt: {operator: 'between', value: {from: 0, to: 12.5}}})}), options)).toEqual({page: 1, pageSize: 1, filters: {createdAt: {operator: 'between', value: {from: 0, to: 12.5}}}});
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
