import {fireEvent, screen} from '@testing-library/react';
import {useState} from 'react';
import {describe, expect, it} from 'vitest';

import {createColumnLayoutState} from '../v3/columns';
import type {ColumnLayoutState} from '../v3/columns';
import {render} from '../test/setup';
import {ColumnLayoutPOC} from './ColumnLayoutPOC';

const definitions = [
  {id: 'name', heading: 'Name', minWidth: 120, maxWidth: 240, render: (row: {name: string}) => row.name},
  {id: 'status', heading: 'Status', minWidth: 80, maxWidth: 160, render: (row: {status: string}) => row.status},
] as const;

function ControlledPOC() {
  const [layout, setLayout] = useState<ColumnLayoutState>(() => createColumnLayoutState([
    {id: 'name', width: 160, minWidth: 120, maxWidth: 240},
    {id: 'status', width: 120, minWidth: 80, maxWidth: 160},
  ]));
  return <ColumnLayoutPOC
    columns={definitions}
    layout={layout}
    onLayoutChange={setLayout}
    rows={[{id: 'ada', name: 'Ada', status: 'Active'}]}
    rowId={(row) => row.id}
    ariaLabel="Column layout POC"
  />;
}

describe('ColumnLayoutPOC', () => {
  it('keeps width state controlled and constrains resizing to the declared bounds', () => {
    render(<ControlledPOC />);

    const table = screen.getByRole('table', {name: 'Column layout POC'});
    expect(table.style.gridTemplateColumns).toBe('160px 120px');

    const resizeName = screen.getByRole('slider', {name: 'Resize Name'});
    expect(resizeName).toHaveAttribute('min', '120');
    expect(resizeName).toHaveAttribute('max', '240');
    fireEvent.change(resizeName, {target: {value: '240'}});

    expect(table.style.gridTemplateColumns).toBe('240px 120px');
  });

  it('offers keyboard-reachable, explicit reorder controls without drag-and-drop', () => {
    render(<ControlledPOC />);

    const statusHeader = screen.getByRole('columnheader', {name: 'Status column controls'});
    expect(statusHeader).toHaveAttribute('tabindex', '0');
    expect(statusHeader).toHaveAttribute('aria-keyshortcuts', 'Alt+ArrowLeft Alt+ArrowRight');
    expect(screen.getByRole('button', {name: 'Move Name left'})).toBeDisabled();

    statusHeader.focus();
    fireEvent.keyDown(statusHeader, {key: 'ArrowLeft', altKey: true});

    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      expect.stringContaining('Status'), expect.stringContaining('Name'),
    ]);
    expect(screen.getByRole('cell', {name: 'Active'})).toBeInTheDocument();
  });
});
