import type {TableQuery} from '../types';

export interface TableView {
  id: string;
  name: string;
  query: TableQuery;
  visibleColumnKeys: readonly string[];
  owner: string;
  updatedAt: string;
}

export type CreateTableViewInput = Omit<TableView, 'id' | 'updatedAt'>;
export type UpdateTableViewInput = Pick<TableView, 'id'> & Partial<Pick<TableView, 'name' | 'query' | 'visibleColumnKeys'>> & {
  /** Optimistic-concurrency token supplied by the last repository response. */
  updatedAt?: string;
};

/** The application owns persistence, authorization, uniqueness and conflict responses. */
export interface TableViewRepository {
  list: () => Promise<readonly TableView[]>;
  create: (input: CreateTableViewInput) => Promise<TableView>;
  update: (input: UpdateTableViewInput) => Promise<TableView>;
  remove: (id: string) => Promise<void>;
}

export class StaleWriteError extends Error {
  override name = 'StaleWriteError';
  constructor() { super('A newer table-view write has already started.'); }
}

export interface TableViewManagerOptions {
  /** Observer exceptions do not replace repository results or errors. */
  onError?: (error: unknown) => void;
  onStateChange?: (state: TableViewManagerState) => void;
}

export interface TableViewManagerState {
  pending: boolean;
  error?: unknown;
}

export interface TableViewManager {
  list: () => Promise<readonly TableView[]>;
  create: (input: CreateTableViewInput) => Promise<TableView>;
  rename: (id: string, name: string, updatedAt?: string) => Promise<TableView>;
  update: (input: UpdateTableViewInput) => Promise<TableView>;
  remove: (id: string) => Promise<void>;
  getState: () => TableViewManagerState;
  /** Optional external state subscription for controlled UI pending/error updates. */
  subscribe?: (listener: () => void) => () => void;
}

export function createTableViewManager(repository: TableViewRepository, options: TableViewManagerOptions = {}): TableViewManager {
  let latestWrite = 0;
  let latestRead = 0;
  let activeWrites = 0;
  let activeOperations = 0;
  let state: TableViewManagerState = {pending: false};
  const listeners = new Set<() => void>();
  const publish = () => {
    // Observers cannot turn a committed write into a rejected write or leak pending.
    try { options.onStateChange?.({...state}); } catch { /* Isolated observer. */ }
    for (const listener of [...listeners]) {
      try { listener(); } catch { /* Isolated subscriber. */ }
    }
  };
  const reportError = (error: unknown) => {
    try { options.onError?.(error); } catch { /* Preserve the repository rejection. */ }
  };
  const updateState = (error?: unknown) => {
    state = error === undefined ? {pending: activeOperations > 0} : {pending: activeOperations > 0, error};
    publish();
  };
  const finish = () => { activeOperations -= 1; updateState(state.error); };

  async function write<T>(operation: () => Promise<T>): Promise<T> {
    const operationId = ++latestWrite;
    activeOperations += 1;
    activeWrites += 1;
    updateState();
    try {
      const result = await operation();
      if (operationId !== latestWrite) throw new StaleWriteError();
      updateState();
      return result;
    } catch (error) {
      if (operationId !== latestWrite) throw new StaleWriteError();
      if (!(error instanceof StaleWriteError)) { updateState(error); reportError(error); }
      throw error;
    } finally {
      activeWrites -= 1;
      finish();
    }
  }

  const list = async () => {
    const readId = ++latestRead;
    const writeEpoch = latestWrite;
    const beganWithoutWrite = activeWrites === 0;
    const ownsReadState = () => beganWithoutWrite && activeWrites === 0 && latestWrite === writeEpoch && latestRead === readId;
    activeOperations += 1;
    updateState(beganWithoutWrite ? undefined : state.error);
    try {
      const result = await repository.list();
      if (ownsReadState()) updateState();
      return result;
    } catch (error) {
      if (ownsReadState()) { updateState(error); reportError(error); }
      throw error;
    } finally { finish(); }
  };

  return {
    list,
    create: (input) => write(() => repository.create(input)),
    update: (input) => write(() => repository.update(input)),
    rename: (id, name, updatedAt) => write(() => repository.update({id, name, ...(updatedAt !== undefined ? {updatedAt} : {})})),
    remove: (id) => write(() => repository.remove(id)),
    getState: () => ({...state}),
    subscribe: (listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
  };
}
