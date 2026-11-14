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
