import {fireEvent, screen, waitFor} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';

import {render} from '../../test/setup';
import type {TableView, TableViewManager} from '../../views/tableViews';
import {TableViews} from './TableViews';

const view: TableView = {
  id: 'active', name: 'Active', owner: 'shop-1', query: {page: 1, pageSize: 25}, visibleColumnKeys: ['title'], updatedAt: '2026-09-09T00:00:00.000Z',
};

function createManager(overrides: Partial<TableViewManager> = {}): TableViewManager {
  return {
    list: vi.fn(),
    create: vi.fn().mockResolvedValue(view),
    rename: vi.fn().mockResolvedValue(view),
    update: vi.fn().mockResolvedValue(view),
    remove: vi.fn().mockResolvedValue(undefined),
    getState: vi.fn().mockReturnValue({pending: false}),
    ...overrides,
  };
}

describe('TableViews', () => {
  it('creates a view from the controlled query and visible columns', async () => {
    const manager = createManager();
    const onViewsChange = vi.fn();
    const onSelectedViewChange = vi.fn();
    render(<TableViews manager={manager} views={[]} owner="shop-1" query={{page: 2, pageSize: 25}} visibleColumnKeys={['title']} onViewsChange={onViewsChange} onSelectedViewChange={onSelectedViewChange} />);

    fireEvent.change(screen.getByRole('textbox', {name: 'View name'}), {target: {value: 'My view'}});
    fireEvent.click(screen.getByRole('button', {name: 'Create view'}));

    await waitFor(() => expect(manager.create).toHaveBeenCalledWith({name: 'My view', owner: 'shop-1', query: {page: 2, pageSize: 25}, visibleColumnKeys: ['title']}));
    expect(onViewsChange).toHaveBeenCalledWith([view]);
    expect(onSelectedViewChange).toHaveBeenCalledWith(view);
  });

  it('removes the selected view and reports repository errors', async () => {
    const error = new Error('Permission denied');
    const manager = createManager({remove: vi.fn().mockRejectedValue(error)});
    const onViewsChange = vi.fn();
    render(<TableViews manager={manager} views={[view]} owner="shop-1" query={view.query} visibleColumnKeys={view.visibleColumnKeys} selectedViewId={view.id} onViewsChange={onViewsChange} onSelectedViewChange={() => undefined} />);

    fireEvent.click(screen.getByRole('button', {name: 'Delete view'}));
    await waitFor(() => expect(screen.getByText('Permission denied')).toBeInTheDocument());
    expect(onViewsChange).not.toHaveBeenCalled();
  });
});
