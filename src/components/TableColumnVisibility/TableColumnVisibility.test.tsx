import {fireEvent, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import type {ReactElement, ReactNode} from 'react';

vi.mock('@shopify/polaris', async () => {
  const actual = await vi.importActual<typeof import('@shopify/polaris')>('@shopify/polaris');
  const Popover = Object.assign(
    ({active, activator, children}: {active: boolean; activator: ReactElement; children?: ReactNode}) => <>{activator}{active ? children : null}</>,
    {Section: ({children}: {children?: ReactNode}) => <>{children}</>},
  );

  return {...actual, Popover};
});

import {render} from '../../test/setup';
import {TableColumnVisibility} from './TableColumnVisibility';

const columns = [
  {key: 'id', title: 'ID'},
  {key: 'name', title: 'Name'},
  {key: 'status', title: 'Status'},
] as const;

describe('TableColumnVisibility', () => {
  it('updates controlled visibility and prevents hiding required columns', async () => {
    const onVisibleColumnsChange = vi.fn();
    render(
      <TableColumnVisibility
        columns={columns}
        visibleColumnKeys={['id', 'name']}
        requiredColumnKeys={['id']}
        onVisibleColumnsChange={onVisibleColumnsChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', {name: 'Columns'}));
    expect(await screen.findByRole('checkbox', {name: 'ID'})).toBeDisabled();

    fireEvent.click(screen.getByRole('checkbox', {name: 'Status'}));
    expect(onVisibleColumnsChange).toHaveBeenCalledWith(['id', 'name', 'status']);

    fireEvent.click(screen.getByRole('checkbox', {name: 'Name'}));
    expect(onVisibleColumnsChange).toHaveBeenLastCalledWith(['id']);
  });

  it('resets the controlled visibility to the declared schema', async () => {
    const onVisibleColumnsChange = vi.fn();
    render(
      <TableColumnVisibility
        columns={columns}
        visibleColumnKeys={['name']}
        onVisibleColumnsChange={onVisibleColumnsChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', {name: 'Columns'}));
    fireEvent.click(await screen.findByRole('button', {name: 'Reset columns'}));

    expect(onVisibleColumnsChange).toHaveBeenCalledWith(['id', 'name', 'status']);
  });
});
