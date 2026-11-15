import {act, renderHook} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import type {TableQuery, TableSelectAllMatchingResult, TableSelection} from '../types';
import {useTableSelection} from './useTableSelection';

const query: TableQuery = {page: 1, pageSize: 10, search: 'shoe'};
const explicit: TableSelection = {mode: 'explicit', ids: ['a']};
const token: TableSelection = {mode: 'allMatching', selectionToken: 'token', selectedCount: 42, expiresAt: '2035-01-01T00:00:00.000Z', excludedIds: []};
const issued = (normalizedQuery: TableQuery = query): TableSelectAllMatchingResult => ({selectionToken: 'issued', normalizedQuery, selectedCount: 42, expiresAt: '2035-01-01T00:00:00.000Z'});
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => { resolve = resolvePromise; reject = rejectPromise; });
  return {promise, resolve, reject};
}
afterEach(() => { vi.useRealTimers(); });

describe('useTableSelection', () => {
  it('preserves a token across pagination and page size but invalidates criteria changes', () => {
    const onSelectionChange = vi.fn();
    const {result, rerender} = renderHook(({currentQuery}) => useTableSelection({query: currentQuery, selection: token, pageIds: ['a'], loading: false, onSelectionChange}), {initialProps: {currentQuery: query}});
    rerender({currentQuery: {...query, page: 2, pageSize: 25}});
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(result.current.selectedCount).toBe(42);
    rerender({currentQuery: {...query, search: 'different'}});
    expect(onSelectionChange).toHaveBeenCalledWith({mode: 'explicit', ids: []});
    expect(result.current.selectedCount).toBe(0);
  });

  it('keeps allMatching mode for page exclusions and uses idempotent row checked state', () => {
    const onSelectionChange = vi.fn();
    const {result} = renderHook(() => useTableSelection({query, selection: token, pageIds: ['a', 'b'], loading: false, onSelectionChange}));
    act(() => result.current.setPage(false));
    expect(onSelectionChange).toHaveBeenLastCalledWith({...token, excludedIds: ['a', 'b']});
    act(() => result.current.setRow('a', true));
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
  });

  it('locks token requests synchronously and installs a validated token', async () => {
    const pending = deferred<TableSelectAllMatchingResult>();
    const request = vi.fn(() => pending.promise);
    const onSelectionChange = vi.fn();
    const {result} = renderHook(() => useTableSelection({query, selection: explicit, pageIds: ['a'], loading: false, onSelectionChange, onSelectAllMatching: request}));
    let first!: Promise<void>;
    act(() => { first = result.current.selectAll(); void result.current.selectAll(); });
    expect(request).toHaveBeenCalledTimes(1);
    expect(result.current.selectingAll).toBe(true);
    await act(async () => { pending.resolve(issued()); await first; });
    expect(onSelectionChange).toHaveBeenCalledWith({...token, selectionToken: 'issued'});
  });

  it('rejects stale A to B to A token responses and selection revisions', async () => {
    const pending = deferred<TableSelectAllMatchingResult>();
    const onSelectionChange = vi.fn();
    const {result, rerender} = renderHook(({currentQuery, selection}) => useTableSelection({query: currentQuery, selection, pageIds: ['a'], loading: false, onSelectionChange, onSelectAllMatching: () => pending.promise}), {initialProps: {currentQuery: query, selection: explicit}});
    let request!: Promise<void>;
    act(() => { request = result.current.selectAll(); });
    rerender({currentQuery: {...query, search: 'b'}, selection: explicit});
    rerender({currentQuery: query, selection: explicit});
    await act(async () => { pending.resolve(issued()); await request; });
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('rejects a normalized criteria mismatch and reports request failures without dropping selection', async () => {
    const onSelectionChange = vi.fn();
    const {result} = renderHook(() => useTableSelection({query, selection: explicit, pageIds: ['a'], loading: false, onSelectionChange, onSelectAllMatching: async () => issued({...query, search: 'normalized differently'})}));
    await act(async () => { await result.current.selectAll(); });
    expect(result.current.error).toMatch(/normalized/);
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('handles rejection, invalid/expired responses, and unmount cancellation', async () => {
    const onSelectionChange = vi.fn();
    const rejected = renderHook(() => useTableSelection({query, selection: explicit, pageIds: ['a'], loading: false, onSelectionChange, onSelectAllMatching: () => { throw new Error('Denied'); }}));
    await act(async () => { await rejected.result.current.selectAll(); });
    expect(rejected.result.current.error).toBe('Denied');
    rejected.unmount();
    const pending = deferred<TableSelectAllMatchingResult>();
    const mounted = renderHook(() => useTableSelection({query, selection: explicit, pageIds: ['a'], loading: false, onSelectionChange, onSelectAllMatching: () => pending.promise}));
    let request!: Promise<void>;
    act(() => { request = mounted.result.current.selectAll(); });
    mounted.unmount();
    await act(async () => { pending.resolve(issued()); await request; });
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('expires naturally, clears once, and invalidates a captured action context', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    const onSelectionChange = vi.fn();
    const selection: TableSelection = {...token, expiresAt: '2026-01-01T00:00:00.100Z'};
    const {result} = renderHook(() => useTableSelection({query, selection, pageIds: ['a'], loading: false, onSelectionChange}));
    const context = result.current.capture();
    act(() => vi.advanceTimersByTime(101));
    expect(result.current.expired).toBe(true);
    expect(result.current.isCurrent(context)).toBe(false);
    expect(onSelectionChange).toHaveBeenCalledOnce();
    expect(onSelectionChange).toHaveBeenCalledWith({mode: 'explicit', ids: []});
  });

  it('creates a new intent when selecting failed rows even if every selected row failed', () => {
    const onSelectionChange = vi.fn();
    const {result} = renderHook(() => useTableSelection({query, selection: explicit, pageIds: ['a'], loading: false, onSelectionChange}));
    const previous = result.current.capture();
    act(() => result.current.selectFailed(['a', 'a']));
    expect(onSelectionChange).toHaveBeenCalledWith({mode: 'explicit', ids: ['a']});
    expect(result.current.isCurrent(previous)).toBe(false);
    expect(result.current.capture().selectionRevision).toBeGreaterThan(previous.selectionRevision);
  });

  it('does not clear a new selection when an old action context completes', () => {
    const onSelectionChange = vi.fn();
    const {result, rerender} = renderHook(({selection}) => useTableSelection({query, selection, pageIds: ['a'], loading: false, onSelectionChange}), {initialProps: {selection: explicit}});
    const context = result.current.capture();
    rerender({selection: {mode: 'explicit', ids: ['b']}});
    rerender({selection: explicit});
    act(() => result.current.clearIfCurrent(context));
    expect(onSelectionChange).not.toHaveBeenCalled();
  });
});
