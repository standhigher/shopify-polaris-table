import {describe, expect, it} from 'vitest';
import {createCoreSchema, getCoreColumn, validateCoreSchema} from './schema';

describe('renderer-independent schema', () => {
  it('validates unique columns and resolves by id', () => {
    const schema = createCoreSchema({rowId: 'id', columns: [{id: 'name', type: 'text', title: 'Name'}, {id: 'status', type: 'status', title: 'Status'}]});
    expect(validateCoreSchema(schema)).toEqual([]);
    expect(getCoreColumn(schema, 'status')?.title).toBe('Status');
    expect(validateCoreSchema({...schema, columns: [...schema.columns, {id: 'name', type: 'text', title: 'Duplicate'}]})).toEqual(['duplicate-column:name']);
  });
});
