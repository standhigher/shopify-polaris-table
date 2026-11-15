import {act, fireEvent, waitFor} from '@testing-library/react';
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

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => { resolve = resolvePromise; reject = rejectPromise; });
  return {promise, resolve, reject};
}
function button(container: HTMLElement, text: string) {
  const result = Array.from(container.querySelectorAll('s-button')).find((element) => element.textContent === text);
  expect(result).toBeDefined();
  return result!;
}

describe('TableViews', () => {
  it('creates a view from the controlled query and visible columns', async () => {
    const manager = createManager();
    const onViewsChange = vi.fn();
    const onSelectedViewChange = vi.fn();
    const {container} = render(<TableViews manager={manager} views={[]} owner="shop-1" query={{page: 2, pageSize: 25}} visibleColumnKeys={['title']} onViewsChange={onViewsChange} onSelectedViewChange={onSelectedViewChange} />);

    const nameField = container.querySelector('s-text-field');
    expect(nameField).not.toBeNull();
    fireEvent.input(nameField!, {target: {value: 'My view'}});
    const createButton = Array.from(container.querySelectorAll('s-button')).find((button) => button.textContent === 'Create view');
    expect(createButton).toBeDefined();
    fireEvent.click(createButton!);

    await waitFor(() => expect(manager.create).toHaveBeenCalledWith({name: 'My view', owner: 'shop-1', query: {page: 2, pageSize: 25}, visibleColumnKeys: ['title']}));
    expect(onViewsChange).toHaveBeenCalledWith([view]);
    expect(onSelectedViewChange).toHaveBeenCalledWith(view);
  });

  it('locks same-tick clicks and snapshots query/columns before submission', async () => {
    const request = deferred<TableView>();
    const update = vi.fn(() => request.promise);
    const manager = createManager({update});
    const capturedQuery = {page: 2, pageSize: 25};
    const columns = ['title'];
    const {container} = render(<TableViews manager={manager} views={[view]} owner="shop-1" query={capturedQuery} visibleColumnKeys={columns} selectedViewId={view.id} onViewsChange={vi.fn()} onSelectedViewChange={vi.fn()} />);
    act(() => {
      fireEvent.click(button(container, 'Save view'));
      fireEvent.click(button(container, 'Save view'));
    });
    capturedQuery.page = 99;
    columns.push('new-column');
    await waitFor(() => expect(update).toHaveBeenCalledOnce());
    expect(update).toHaveBeenCalledWith({id: view.id, query: {page: 2, pageSize: 25}, visibleColumnKeys: ['title'], updatedAt: view.updatedAt});
    await act(async () => request.resolve(view));
  });

  it('does not apply an old save over a changed controlled list or query (including ABA)', async () => {
    const request = deferred<TableView>();
    const update = vi.fn(() => request.promise);
    const manager = createManager({update});
    const onViewsChange = vi.fn();
    const onSelectedViewChange = vi.fn();
    const props = {manager, views: [view], owner: 'shop-1', query: view.query, visibleColumnKeys: view.visibleColumnKeys, selectedViewId: view.id, onViewsChange, onSelectedViewChange};
    const {container, rerender} = render(<TableViews {...props} />);
    fireEvent.click(button(container, 'Save view'));
    await waitFor(() => expect(update).toHaveBeenCalledOnce());
    rerender(<TableViews {...props} query={{...view.query, search: 'new'}} views={[view, {...view, id: 'second'}]} />);
    rerender(<TableViews {...props} />);
    await act(async () => request.resolve({...view, name: 'Old result'}));
    expect(onViewsChange).not.toHaveBeenCalled();
    expect(onSelectedViewChange).not.toHaveBeenCalled();
  });

  it('ignores old permission failures after owner/manager changes and on unmount', async () => {
    const request = deferred<TableView>();
    const update = vi.fn(() => request.promise);
    const manager = createManager({update});
    const props = {manager, views: [view], owner: 'shop-1', query: view.query, visibleColumnKeys: view.visibleColumnKeys, selectedViewId: view.id, onViewsChange: vi.fn(), onSelectedViewChange: vi.fn()};
    const {container, rerender, unmount} = render(<TableViews {...props} />);
    fireEvent.click(button(container, 'Save view'));
    await waitFor(() => expect(update).toHaveBeenCalledOnce());
    rerender(<TableViews {...props} owner="shop-2" manager={createManager()} />);
    await act(async () => request.reject(new Error('Old permission error')));
    expect(container.querySelector('s-banner')).toBeNull();
    expect(props.onViewsChange).not.toHaveBeenCalled();
    unmount();
  });

  it('retries a current conflict with the captured updatedAt and reloads explicitly', async () => {
    const conflict = new Error('Version conflict. Reload views.');
    const update = vi.fn().mockRejectedValueOnce(conflict).mockResolvedValueOnce({...view, name: 'Saved'});
    const list = vi.fn().mockResolvedValue([{...view, name: 'Reloaded'}]);
    const manager = createManager({update, list});
    const onViewsChange = vi.fn();
    const {container} = render(<TableViews manager={manager} views={[view]} owner="shop-1" query={view.query} visibleColumnKeys={view.visibleColumnKeys} selectedViewId={view.id} onViewsChange={onViewsChange} onSelectedViewChange={vi.fn()} />);
    fireEvent.click(button(container, 'Save view'));
    await waitFor(() => expect(container.querySelector('s-banner')).toHaveTextContent('Version conflict'));
    fireEvent.click(button(container, 'Retry saved view'));
    await waitFor(() => expect(update).toHaveBeenCalledTimes(2));
    expect(update.mock.calls[0]![0]).toEqual(update.mock.calls[1]![0]);
    expect(update.mock.calls[1]![0].updatedAt).toBe(view.updatedAt);
    await waitFor(() => expect(onViewsChange).toHaveBeenCalled());
    fireEvent.click(button(container, 'Reload views'));
    await waitFor(() => expect(onViewsChange).toHaveBeenLastCalledWith([{...view, name: 'Reloaded'}]));
  });

  it('clears only the current deleted selection and suppresses deletion callbacks after a new view is selected', async () => {
    const request = deferred<void>();
    const remove = vi.fn(() => request.promise);
    const manager = createManager({remove});
    const onViewsChange = vi.fn();
    const onSelectedViewChange = vi.fn();
    const other = {...view, id: 'other'};
    const props = {manager, views: [view, other], owner: 'shop-1', query: view.query, visibleColumnKeys: view.visibleColumnKeys, selectedViewId: view.id, onViewsChange, onSelectedViewChange};
    const {container, rerender} = render(<TableViews {...props} />);
    fireEvent.click(button(container, 'Delete view'));
    await waitFor(() => expect(remove).toHaveBeenCalledWith(view.id));
    rerender(<TableViews {...props} selectedViewId={other.id} />);
    await act(async () => request.resolve());
    expect(onViewsChange).not.toHaveBeenCalled();
    expect(onSelectedViewChange).not.toHaveBeenCalled();
  });

  it('gates handlers when the shared manager is pending and permits explicit reload after success', async () => {
    const update = vi.fn();
    const manager = createManager({update, getState: () => ({pending: true})});
    const {container} = render(<TableViews manager={manager} views={[view]} owner="shop-1" query={view.query} visibleColumnKeys={view.visibleColumnKeys} selectedViewId={view.id} onViewsChange={vi.fn()} onSelectedViewChange={vi.fn()} />);
    expect(button(container, 'Save view')).toHaveProperty('disabled', true);
    fireEvent.click(button(container, 'Save view'));
    expect(update).not.toHaveBeenCalled();
  });

  it('reacts to manager pending subscription and re-enables after repository settles', async () => {
    const request = deferred<TableView>();
    const repository = {list: vi.fn(), create: vi.fn(() => request.promise), update: vi.fn(), remove: vi.fn()};
    const {createTableViewManager} = await import('../../views/tableViews');
    const manager = createTableViewManager(repository);
    const {container} = render(<TableViews manager={manager} views={[]} owner="shop-1" query={view.query} visibleColumnKeys={view.visibleColumnKeys} onViewsChange={vi.fn()} onSelectedViewChange={vi.fn()} />);
    fireEvent.input(container.querySelector('s-text-field')!, {target: {value: 'Pending view'}});
    let operation!: Promise<TableView>;
    act(() => { operation = manager.create({name: 'External write', owner: 'shop-1', query: view.query, visibleColumnKeys: view.visibleColumnKeys}); });
    expect(button(container, 'Create view')).toHaveProperty('disabled', true);
    await act(async () => { request.resolve(view); await operation; });
    expect(button(container, 'Create view')).toHaveProperty('disabled', false);
  });

  it('unsubscribes from manager notifications on unmount', () => {
    const unsubscribe = vi.fn();
    const subscribe = vi.fn(() => unsubscribe);
    const manager = createManager({subscribe});
    const {unmount} = render(<TableViews manager={manager} views={[]} owner="shop-1" query={view.query} visibleColumnKeys={view.visibleColumnKeys} onViewsChange={vi.fn()} onSelectedViewChange={vi.fn()} />);
    expect(subscribe).toHaveBeenCalled();
    unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('renames with the selected updatedAt and clears a successfully deleted current view', async () => {
    const renamed = {...view, name: 'Renamed', updatedAt: '2026-09-10T00:00:00.000Z'};
    const rename = vi.fn().mockResolvedValue(renamed);
    const remove = vi.fn().mockResolvedValue(undefined);
    const manager = createManager({rename, remove});
    const onViewsChange = vi.fn();
    const onSelectedViewChange = vi.fn();
    const {container} = render(<TableViews manager={manager} views={[view]} owner="shop-1" query={view.query} visibleColumnKeys={view.visibleColumnKeys} selectedViewId={view.id} onViewsChange={onViewsChange} onSelectedViewChange={onSelectedViewChange} />);
    fireEvent.input(container.querySelector('s-text-field')!, {target: {value: 'Renamed'}});
    fireEvent.click(button(container, 'Rename view'));
    await waitFor(() => expect(rename).toHaveBeenCalledWith(view.id, 'Renamed', view.updatedAt));
    await waitFor(() => expect(onViewsChange).toHaveBeenCalledWith([renamed]));
    fireEvent.click(button(container, 'Delete view'));
    await waitFor(() => expect(onViewsChange).toHaveBeenLastCalledWith([]));
    expect(onSelectedViewChange).toHaveBeenLastCalledWith(undefined);
  });

  it('removes the selected view and reports repository errors', async () => {
    const error = new Error('Permission denied');
    const manager = createManager({remove: vi.fn().mockRejectedValue(error)});
    const onViewsChange = vi.fn();
    const {container} = render(<TableViews manager={manager} views={[view]} owner="shop-1" query={view.query} visibleColumnKeys={view.visibleColumnKeys} selectedViewId={view.id} onViewsChange={onViewsChange} onSelectedViewChange={() => undefined} />);

    const deleteButton = Array.from(container.querySelectorAll('s-button')).find((button) => button.textContent === 'Delete view');
    expect(deleteButton).toBeDefined();
    fireEvent.click(deleteButton!);
    await waitFor(() => expect(container.querySelector('s-banner')).toHaveTextContent('Permission denied'));
    expect(onViewsChange).not.toHaveBeenCalled();
  });
});
