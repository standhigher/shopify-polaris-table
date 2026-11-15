import {describe, expect, it, vi} from 'vitest';
import {createTableViewManager, type TableView, type TableViewManagerState, type TableViewRepository} from './tableViews';

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

  it('includes list operations in pending and does not let a stale list failure overwrite a newer write', async () => {
    let rejectList!: (reason: unknown) => void;
    const listPromise = new Promise<readonly TableView[]>((_, reject) => { rejectList = reject; });
    const repository: TableViewRepository = {
      list: vi.fn().mockReturnValue(listPromise), create: vi.fn().mockResolvedValue(view), update: vi.fn().mockResolvedValue(view), remove: vi.fn().mockResolvedValue(undefined),
    };
    const changes: TableViewManagerState[] = [];
    const manager = createTableViewManager(repository, {onStateChange: (state) => changes.push(state)});
    const list = manager.list();
    expect(manager.getState().pending).toBe(true);
    await manager.create({name: view.name, query: view.query, visibleColumnKeys: view.visibleColumnKeys, owner: view.owner});
    rejectList(new Error('late list failure'));
    await expect(list).rejects.toThrow('late list failure');
    expect(manager.getState().error).toBeUndefined();
    expect(changes.some((state) => state.pending)).toBe(true);
  });

  it('isolates observer exceptions and keeps committed writes successful', async () => {
    const repository: TableViewRepository = {list: vi.fn(), create: vi.fn().mockResolvedValue(view), update: vi.fn(), remove: vi.fn()};
    const onError = vi.fn(() => { throw new Error('observer failed'); });
    const onStateChange = vi.fn(() => { throw new Error('state observer failed'); });
    const manager = createTableViewManager(repository, {onError, onStateChange});
    await expect(manager.create({name: 'Active', query: view.query, visibleColumnKeys: ['name'], owner: 'u1'})).resolves.toEqual(view);
    expect(manager.getState().pending).toBe(false);
  });

  it('turns a superseded write rejection into StaleWriteError without publishing its error', async () => {
    let rejectOld!: (reason: unknown) => void;
    const oldWrite = new Promise<TableView>((_, reject) => { rejectOld = reject; });
    const repository: TableViewRepository = {list: vi.fn(), create: vi.fn(), update: vi.fn().mockReturnValueOnce(oldWrite).mockResolvedValueOnce({...view, name: 'Latest'}), remove: vi.fn()};
    const onError = vi.fn();
    const manager = createTableViewManager(repository, {onError});
    const stale = manager.rename(view.id, 'Old');
    const staleAssertion = expect(stale).rejects.toMatchObject({name: 'StaleWriteError'});
    await expect(manager.rename(view.id, 'Latest')).resolves.toMatchObject({name: 'Latest'});
    expect(manager.getState().pending).toBe(true);
    rejectOld(new Error('Old failure'));
    await staleAssertion;
    expect(onError).not.toHaveBeenCalled();
    expect(manager.getState()).toEqual({pending: false});
  });

  it('does not let a list started during a write clear that write conflict', async () => {
    let rejectWrite!: (reason: unknown) => void;
    let resolveList!: (views: readonly TableView[]) => void;
    const writePromise = new Promise<TableView>((_, reject) => { rejectWrite = reject; });
    const listPromise = new Promise<readonly TableView[]>((resolve) => { resolveList = resolve; });
    const conflict = new Error('Version conflict');
    const repository: TableViewRepository = {list: vi.fn(() => listPromise), create: vi.fn(), update: vi.fn(() => writePromise), remove: vi.fn()};
    const manager = createTableViewManager(repository);
    const write = manager.update({id: view.id, updatedAt: view.updatedAt});
    const writeAssertion = expect(write).rejects.toBe(conflict);
    const read = manager.list();
    rejectWrite(conflict);
    await writeAssertion;
    expect(manager.getState()).toEqual({pending: true, error: conflict});
    resolveList([view]);
    await read;
    expect(manager.getState()).toEqual({pending: false, error: conflict});
  });

  it('keeps the latest read error when an older read completes later', async () => {
    let resolveOld!: (views: readonly TableView[]) => void;
    const first = new Promise<readonly TableView[]>((resolve) => { resolveOld = resolve; });
    const failure = new Error('Latest read denied');
    const repository: TableViewRepository = {list: vi.fn().mockReturnValueOnce(first).mockRejectedValueOnce(failure), create: vi.fn(), update: vi.fn(), remove: vi.fn()};
    const manager = createTableViewManager(repository);
    const old = manager.list();
    await expect(manager.list()).rejects.toBe(failure);
    resolveOld([view]);
    await old;
    expect(manager.getState()).toEqual({pending: false, error: failure});
  });

  it('clears read errors on explicit reload and does not supersede an in-flight write', async () => {
    const failure = new Error('Temporary read failure');
    const repository: TableViewRepository = {list: vi.fn().mockRejectedValueOnce(failure).mockResolvedValue([view]), create: vi.fn().mockResolvedValue(view), update: vi.fn(), remove: vi.fn()};
    const manager = createTableViewManager(repository);
    await expect(manager.list()).rejects.toBe(failure);
    await expect(manager.list()).resolves.toEqual([view]);
    expect(manager.getState()).toEqual({pending: false});
    const create = manager.create({name: view.name, query: view.query, owner: view.owner, visibleColumnKeys: view.visibleColumnKeys});
    const read = manager.list();
    await expect(create).resolves.toEqual(view);
    await read;
    expect(manager.getState()).toEqual({pending: false});
  });

  it('preserves repository error identity when onError throws and protects state snapshots', async () => {
    const conflict = new Error('Conflict');
    const repository: TableViewRepository = {list: vi.fn(), create: vi.fn().mockRejectedValue(conflict), update: vi.fn(), remove: vi.fn()};
    const manager = createTableViewManager(repository, {onError: () => { throw new Error('Observer failure'); }});
    await expect(manager.create({name: view.name, query: view.query, owner: view.owner, visibleColumnKeys: view.visibleColumnKeys})).rejects.toBe(conflict);
    const snapshot = manager.getState();
    snapshot.pending = true;
    expect(manager.getState()).toEqual({pending: false, error: conflict});
  });

  it('supports unsubscribe and isolates throwing subscribers from repository outcomes', async () => {
    const repository: TableViewRepository = {list: vi.fn().mockResolvedValue([view]), create: vi.fn().mockResolvedValue(view), update: vi.fn(), remove: vi.fn()};
    const manager = createTableViewManager(repository);
    const broken = vi.fn(() => { throw new Error('Subscriber failed'); });
    const healthy = vi.fn();
    const unsubscribeBroken = manager.subscribe?.(broken);
    const unsubscribeHealthy = manager.subscribe?.(healthy);
    await expect(manager.create({name: view.name, query: view.query, owner: view.owner, visibleColumnKeys: view.visibleColumnKeys})).resolves.toEqual(view);
    expect(healthy).toHaveBeenCalled();
    expect(manager.getState()).toEqual({pending: false});
    unsubscribeBroken?.();
    unsubscribeHealthy?.();
    const calls = healthy.mock.calls.length;
    await manager.list();
    expect(healthy).toHaveBeenCalledTimes(calls);
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
