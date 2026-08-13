import {describe, expect, it} from 'vitest';
import {createPolarisRendererAdapter, assertPolarisRendererAdapter} from './polaris';

describe('Polaris renderer adapter contract', () => {
  it('creates and validates a renderer adapter without coupling core to Polaris components', () => {
    const adapter = createPolarisRendererAdapter({
      renderTable: ({rows}) => rows.length,
      renderHeader: ({columns}) => columns.map((column) => column.title).join(','),
      renderCell: ({value}) => String(value ?? ''),
    });
    expect(adapter.renderer).toBe('polaris');
    expect(adapter.renderTable({schema: {rowId: 'id', columns: []}, rows: [], query: {page: 1, pageSize: 10}})).toBe(0);
    expect(assertPolarisRendererAdapter(adapter)).toBe(true);
  });
});
