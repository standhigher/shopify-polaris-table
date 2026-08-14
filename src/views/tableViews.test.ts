import {describe, expect, it, vi} from 'vitest';
import {createTableViewManager, type TableView, type TableViewRepository} from './tableViews';

const view: TableView = {id: 'v1', name: 'Active', query: {page: 1, pageSize: 25}, visibleColumnKeys: ['name'], owner: 'u1', updatedAt: '2026-01-01T00:00:00.000Z'};

describe('table view manager', () => {
  it('delegates CRUD to repository and reports errors', async () => {
    const repository: TableViewRepository = {
      list: vi.fn().mockResolvedValue([view]),
      create: vi.fn().mockResolvedValue(view),
      update: vi.fn().mockResolvedValue({...view, name: 'Renamed'}),
      remove: vi.fn().mockResolvedValue(undefined),
    };
    const manager = createTableViewManager(repository);
    await expect(manager.list()).resolves.toEqual([view]);
    await expect(manager.create({
      name: 'Active',
      query: {page: 1, pageSize: 25},
      visibleColumnKeys: ['name'],
      owner: 'u1',
    })).resolves.toEqual(view);
    await expect(manager.rename('v1', 'Renamed')).resolves.toEqual({...view, name: 'Renamed'});
    await expect(manager.remove('v1')).resolves.toBeUndefined();
  });

  it('prevents stale concurrent writes from becoming the current result', async () => {
    let resolveFirst!: (value: TableView) => void;
    const first = new Promise<TableView>((resolve) => { resolveFirst = resolve; });
    const repository: TableViewRepository = {
      list: vi.fn(), create: vi.fn(), update: vi.fn()
        .mockReturnValueOnce(first)
        .mockResolvedValueOnce({...view, name: 'new'}), remove: vi.fn(),
    };
    const manager = createTableViewManager(repository);
    const stale = manager.rename('v1', 'old');
    const latest = manager.rename('v1', 'new');
    resolveFirst({...view, name: 'old'});
    await expect(latest).resolves.toEqual({...view, name: 'new'});
    await expect(stale).rejects.toMatchObject({name: 'StaleWriteError'});
  });

  it('exposes repository failures to callbacks without swallowing them', async () => {
    const error = new Error('name already exists');
    const onError = vi.fn();
    const repository: TableViewRepository = {
      list: vi.fn(),
      create: vi.fn().mockRejectedValue(error),
      update: vi.fn(),
      remove: vi.fn(),
    };
    const manager = createTableViewManager(repository, {onError});

    await expect(manager.create({
      name: 'Active', query: {page: 1, pageSize: 25}, visibleColumnKeys: [], owner: 'u1',
    })).rejects.toThrow('name already exists');
    expect(onError).toHaveBeenCalledWith(error);
    expect(manager.getState()).toEqual({pending: false, error});
  });
});
