import {fireEvent} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';

import {render} from '../../test/setup';
import {TableColumnVisibility} from './TableColumnVisibility';

const columns = [
  {key: 'id', title: 'ID'},
  {key: 'name', title: 'Name'},
  {key: 'status', title: 'Status'},
] as const;

describe('TableColumnVisibility', () => {
  it('updates controlled visibility and prevents hiding required columns', () => {
    const onVisibleColumnsChange = vi.fn();
    const {container} = render(
      <TableColumnVisibility
        columns={columns}
        visibleColumnKeys={['id', 'name']}
        requiredColumnKeys={['id']}
        onVisibleColumnsChange={onVisibleColumnsChange}
      />,
    );

    const popover = container.querySelector('s-popover');
    expect(popover).not.toBeNull();
    expect(container.querySelector('s-button')).toHaveProperty('commandFor', popover!.id);
    const checkboxes = container.querySelectorAll('s-checkbox');
    expect(checkboxes).toHaveLength(3);
    expect(checkboxes[0]).toHaveProperty('disabled', true);
    expect(checkboxes[0]).toHaveProperty('checked', true);

    fireEvent.change(checkboxes[2]!, {target: {checked: true}});
    expect(onVisibleColumnsChange).toHaveBeenCalledWith(['id', 'name', 'status']);

    fireEvent.change(checkboxes[1]!, {target: {checked: false}});
    expect(onVisibleColumnsChange).toHaveBeenLastCalledWith(['id']);
  });

  it('does not accidentally require the first column when no required keys are configured', () => {
    const onVisibleColumnsChange = vi.fn();
    const {container} = render(<TableColumnVisibility columns={columns} visibleColumnKeys={['id', 'name']} onVisibleColumnsChange={onVisibleColumnsChange} />);
    const first = container.querySelector('s-checkbox')!;
    expect(first).toHaveProperty('disabled', false);
    fireEvent.change(first, {target: {checked: false}});
    expect(onVisibleColumnsChange).toHaveBeenCalledWith(['name']);
  });

  it('guards disabled controls, duplicate native events, and no-op reset', () => {
    const onVisibleColumnsChange = vi.fn();
    const {container, rerender} = render(<TableColumnVisibility columns={columns} visibleColumnKeys={['id', 'name']} requiredColumnKeys={['id', 'id']} onVisibleColumnsChange={onVisibleColumnsChange} />);
    fireEvent.change(container.querySelectorAll('s-checkbox')[0]!, {target: {checked: false}});
    fireEvent.change(container.querySelectorAll('s-checkbox')[1]!, {target: {checked: true}});
    expect(onVisibleColumnsChange).not.toHaveBeenCalled();
    rerender(<TableColumnVisibility columns={columns} visibleColumnKeys={['name']} onVisibleColumnsChange={onVisibleColumnsChange} />);
    const name = container.querySelectorAll('s-checkbox')[1]!;
    expect(name).toHaveProperty('disabled', true);
    fireEvent.change(name, {target: {checked: false}});
    expect(onVisibleColumnsChange).not.toHaveBeenCalled();
    rerender(<TableColumnVisibility columns={columns} visibleColumnKeys={['id', 'name', 'status']} onVisibleColumnsChange={onVisibleColumnsChange} />);
    const reset = Array.from(container.querySelectorAll('s-button')).find((button) => button.textContent === 'Reset columns')!;
    expect(reset).toHaveProperty('disabled', true);
    fireEvent.click(reset);
    expect(onVisibleColumnsChange).not.toHaveBeenCalled();
  });

  it('renders authoritative schema/preferences after external changes or rejected writes', () => {
    const onVisibleColumnsChange = vi.fn();
    const {container, rerender} = render(<TableColumnVisibility columns={columns} visibleColumnKeys={['id', 'name']} onVisibleColumnsChange={onVisibleColumnsChange} />);
    fireEvent.change(container.querySelectorAll('s-checkbox')[2]!, {target: {checked: true}});
    expect(onVisibleColumnsChange).toHaveBeenCalledWith(['id', 'name', 'status']);
    expect(container.querySelectorAll('s-checkbox')[2]).toHaveProperty('checked', false);
    // Parent rejects the write; rerender from its authoritative preferences.
    rerender(<TableColumnVisibility columns={columns.slice(0, 2)} visibleColumnKeys={['name', 'removed', 'name']} requiredColumnKeys={['name', 'name']} onVisibleColumnsChange={onVisibleColumnsChange} />);
    const checkboxes = container.querySelectorAll('s-checkbox');
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0]).toHaveProperty('checked', false);
    expect(checkboxes[1]).toHaveProperty('checked', true);
    expect(checkboxes[1]).toHaveProperty('disabled', true);
    expect(onVisibleColumnsChange).toHaveBeenCalledTimes(1);
  });

  it('preserves rich titles in light DOM and gives separate tables unique popover IDs', () => {
    const richColumns = [{key: 'id', title: <strong>Identity</strong>}, {key: 'name', title: 'Name'}];
    const {container} = render(<><TableColumnVisibility columns={richColumns} visibleColumnKeys={['id', 'name']} onVisibleColumnsChange={vi.fn()} /><TableColumnVisibility columns={richColumns} visibleColumnKeys={['id', 'name']} onVisibleColumnsChange={vi.fn()} /></>);
    expect(container.querySelectorAll('strong')).toHaveLength(2);
    expect(container.querySelector('strong')).toHaveTextContent('Identity');
    expect(container.querySelector('s-checkbox')).toHaveProperty('label', 'id');
    const popovers = container.querySelectorAll('s-popover');
    expect(popovers[0]!.id).not.toBe(popovers[1]!.id);
    expect(container.querySelector('s-button')).toHaveProperty('commandFor', popovers[0]!.id);
  });

  it('resets the controlled visibility to the declared schema', () => {
    const onVisibleColumnsChange = vi.fn();
    const {container} = render(
      <TableColumnVisibility
        columns={columns}
        visibleColumnKeys={['name']}
        onVisibleColumnsChange={onVisibleColumnsChange}
      />,
    );

    const resetButton = Array.from(container.querySelectorAll('s-button')).find((button) => button.textContent === 'Reset columns');
    expect(resetButton).toBeDefined();
    fireEvent.click(resetButton!);
    expect(onVisibleColumnsChange).toHaveBeenCalledWith(['id', 'name', 'status']);
  });
});
