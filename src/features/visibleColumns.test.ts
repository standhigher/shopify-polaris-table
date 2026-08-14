import {describe, expect, it} from 'vitest';
import {getVisibleColumns, reconcileVisibleColumnState, sanitizeVisibleColumnKeys} from './visibleColumns';

const columns = [
  {key: 'id', title: 'ID'},
  {key: 'name', title: 'Name'},
  {key: 'status', title: 'Status'},
] as const;

describe('visible column state', () => {
  it('sanitizes unknown and duplicate keys while preserving column order', () => {
    expect(sanitizeVisibleColumnKeys(['status', 'nope', 'status', 'id'], columns)).toEqual(['status', 'id']);
    expect(getVisibleColumns(columns, ['status', 'id']).map((column) => column.key)).toEqual(['id', 'status']);
  });

  it('removes hidden columns from sorting and filters', () => {
    const result = reconcileVisibleColumnState({
      columns,
      visibleColumnKeys: ['id', 'name'],
      query: {page: 2, pageSize: 25, sort: {field: 'status', direction: 'desc'}, filters: {
        status: {operator: 'equals', value: 'active'},
        name: {operator: 'contains', value: 'shoe'},
      }},
    });
    expect(result.visibleColumnKeys).toEqual(['id', 'name']);
    expect(result.query).toEqual({page: 2, pageSize: 25, filters: {name: {operator: 'contains', value: 'shoe'}}});
  });
});
