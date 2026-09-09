import {screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import {render} from '../test/setup';
import {StickyTablePOC} from './StickyTablePOC';

const columns = [
  {id: 'name', heading: 'Name', width: 180, sticky: 'start' as const, render: (row: {name: string}) => row.name},
  {id: 'status', heading: 'Status', width: 160, render: (row: {status: string}) => row.status},
  {id: 'notes', heading: 'Notes', width: 240, render: (row: {notes: string}) => row.notes},
  {id: 'actions', heading: 'Actions', width: 140, sticky: 'end' as const, render: () => 'Open'},
] as const;

describe('StickyTablePOC', () => {
  it('creates a horizontally scrollable fixed-width table with stacked sticky header and edge columns', () => {
    render(<StickyTablePOC
      columns={columns}
      rows={[{id: 'a', name: 'Ada', status: 'Active', notes: 'Long note'}]}
      rowId={(row) => row.id}
      viewportHeight={200}
      ariaLabel="Sticky POC"
    />);

    const region = screen.getByRole('region', {name: 'Sticky POC'});
    expect(region).toHaveAttribute('tabindex', '0');
    expect(region.style.overflow).toBe('auto');
    expect(screen.getByRole('table', {name: 'Sticky POC'}).style.minWidth).toBe('720px');

    const nameHeader = screen.getByRole('columnheader', {name: 'Name'});
    const actionsHeader = screen.getByRole('columnheader', {name: 'Actions'});
    const headerRow = screen.getAllByRole('row')[0]!;
    expect(headerRow.style.position).toBe('sticky');
    expect(headerRow.style.top).toBe('0px');
    expect(headerRow.style.zIndex).toBe('3');
    expect(nameHeader.style.position).toBe('sticky');
    expect(nameHeader.style.insetInlineStart).toBe('0');
    expect(nameHeader.style.zIndex).toBe('4');
    expect(actionsHeader.style.insetInlineEnd).toBe('0');
    expect(actionsHeader.style.zIndex).toBe('4');
    expect(screen.getAllByRole('cell')[0]?.style.insetInlineStart).toBe('0');
    expect(screen.getAllByRole('cell')[3]?.style.insetInlineEnd).toBe('0');
  });

  it('uses cumulative offsets when multiple start-sticky columns are configured', () => {
    render(<StickyTablePOC
      columns={[
        {id: 'id', heading: 'ID', width: 80, sticky: 'start', render: (row: {id: string}) => row.id},
        {id: 'name', heading: 'Name', width: 180, sticky: 'start', render: () => 'Ada'},
        {id: 'status', heading: 'Status', width: 160, render: () => 'Active'},
      ]}
      rows={[{id: 'a'}]}
      rowId={(row) => row.id}
      viewportHeight={200}
      ariaLabel="Multiple sticky columns"
    />);

    expect(screen.getByRole('columnheader', {name: 'ID'}).style.insetInlineStart).toBe('0');
    expect(screen.getByRole('columnheader', {name: 'Name'}).style.insetInlineStart).toBe('80px');
  });
});
