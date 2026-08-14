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
}

export function createTableViewManager(
  repository: TableViewRepository,
  options: TableViewManagerOptions = {},
): TableViewManager {
  let latestWrite = 0;
  let pendingWrites = 0;
  let state: TableViewManagerState = {pending: false};
  const notify = () => options.onStateChange?.(state);
  const setState = (next: TableViewManagerState) => { state = next; notify(); };

  async function write<T>(operation: () => Promise<T>): Promise<T> {
    const operationId = ++latestWrite;
    pendingWrites += 1;
    setState({pending: true});
    try {
      const result = await operation();
      if (operationId !== latestWrite) throw new StaleWriteError();
      setState({pending: pendingWrites > 1});
      return result;
    } catch (error) {
      if (!(error instanceof StaleWriteError)) {
        setState({pending: pendingWrites > 1, error});
        options.onError?.(error);
      }
      throw error;
    } finally {
      pendingWrites -= 1;
      if (pendingWrites === 0 && state.pending) setState(state.error === undefined ? {pending: false} : {pending: false, error: state.error});
    }
  }

  return {
    list: async () => {
      try { return await repository.list(); }
      catch (error) { setState({pending: false, error}); options.onError?.(error); throw error; }
    },
    create: (input) => write(() => repository.create(input)),
    update: (input) => write(() => repository.update(input)),
    rename: (id, name, updatedAt) => write(() => repository.update({id, name, ...(updatedAt ? {updatedAt} : {})})),
    remove: (id) => write(() => repository.remove(id)),
    getState: () => state,
  };
}
