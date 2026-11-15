import {act, fireEvent, screen, waitFor} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {render} from '../../test/setup';
import {copyTableSelection} from '../../hooks/useTableSelection';
import type {TableSelectionContext} from '../../hooks/useTableSelection';
import type {TableBulkAction, TableBulkActionResult} from '../../types';
import {TableBulkActions} from './TableBulkActions';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => { resolve = resolvePromise; reject = rejectPromise; });
  return {promise, resolve, reject};
}
function fixture(actions: readonly TableBulkAction[]) {
  let current: TableSelectionContext = {selection: {mode: 'explicit', ids: ['a', 'b']}, criteriaKey: 'query', criteriaRevision: 0, selectionRevision: 0, usable: true};
  const clear = vi.fn();
  const selectFailed = vi.fn();
  const isCurrent = (context: TableSelectionContext) => context.criteriaKey === current.criteriaKey && context.criteriaRevision === current.criteriaRevision && context.selectionRevision === current.selectionRevision;
  const props = {
    actions, selectedCount: 2, loading: false,
    capture: () => ({...current, selection: copyTableSelection(current.selection)}),
    isCurrent,
    clearIfCurrent: (context: TableSelectionContext) => { if (isCurrent(context)) clear(); },
    selectFailed, onClear: vi.fn(),
  };
  return {props, clear, selectFailed, change: (next: Partial<TableSelectionContext>) => { current = {...current, ...next}; }};
}
const completed: TableBulkActionResult = {status: 'completed', succeededCount: 2, failed: [], clearSelection: false};

describe('TableBulkActions', () => {
  it('synchronously locks double clicks and keeps pending feedback', async () => {
    const request = deferred<TableBulkActionResult>();
    const perform = vi.fn(() => request.promise);
    const setup = fixture([{id: 'archive', content: <span>Archive</span>, perform}]);
    render(<TableBulkActions {...setup.props} />);
    const button = screen.getByRole('button', {name: 'Archive'});
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(perform).toHaveBeenCalledTimes(1));
    expect(button).toHaveProperty('disabled', true);
    await act(async () => request.resolve(completed));
    expect(screen.getByText('2 succeeded, 0 failed')).toBeInTheDocument();
    expect(button).toHaveProperty('disabled', true);
  });

  it('retries a rejected operation with the same key and frozen target', async () => {
    const perform = vi.fn().mockRejectedValueOnce(new Error('Network unavailable')).mockResolvedValueOnce(completed);
    const setup = fixture([{id: 'archive', content: 'Archive', perform}]);
    render(<TableBulkActions {...setup.props} />);
    fireEvent.click(screen.getByRole('button', {name: 'Archive'}));
    await screen.findByText('Network unavailable');
    fireEvent.click(screen.getByRole('button', {name: 'Retry same operation'}));
    await screen.findByText('2 succeeded, 0 failed');
    expect(perform).toHaveBeenCalledTimes(2);
    expect(perform.mock.calls[0]![0]).toEqual(perform.mock.calls[1]![0]);
  });

  it('never clears a new selection when an old operation resolves', async () => {
    const request = deferred<TableBulkActionResult>();
    const setup = fixture([{id: 'archive', content: 'Archive', perform: () => request.promise}]);
    const {rerender} = render(<TableBulkActions {...setup.props} />);
    fireEvent.click(screen.getByRole('button', {name: 'Archive'}));
    setup.change({selection: {mode: 'explicit', ids: ['new']}, selectionRevision: 1});
    rerender(<TableBulkActions {...setup.props} selectedCount={1} />);
    await act(async () => request.resolve({...completed, clearSelection: true}));
    expect(setup.clear).not.toHaveBeenCalled();
  });

  it('shows partial failure IDs/reasons and selects failed rows without rerunning successes', async () => {
    const perform = vi.fn().mockResolvedValue({status: 'completed', succeededCount: 1, failed: [{id: 'b', reason: 'Locked'}], clearSelection: false});
    const setup = fixture([{id: 'archive', content: 'Archive', perform}]);
    render(<TableBulkActions {...setup.props} />);
    fireEvent.click(screen.getByRole('button', {name: 'Archive'}));
    await screen.findByText('b: Locked');
    fireEvent.click(screen.getByRole('button', {name: 'Select failed rows'}));
    expect(setup.selectFailed).toHaveBeenCalledWith(['b']);
    expect(perform).toHaveBeenCalledTimes(1);
  });

  it('keeps accepted feedback after the toolbar disappears and blocks duplicate intent', async () => {
    const perform = vi.fn().mockResolvedValue({status: 'accepted', operationId: 'op-1', acceptedCount: 2, clearSelection: true});
    const setup = fixture([{id: 'archive', content: 'Archive', perform}]);
    const {rerender} = render(<TableBulkActions {...setup.props} />);
    fireEvent.click(screen.getByRole('button', {name: 'Archive'}));
    await screen.findByText(/Operation op-1 accepted/);
    expect(setup.clear).toHaveBeenCalledTimes(1);
    rerender(<TableBulkActions {...setup.props} selectedCount={0} />);
    expect(screen.queryByRole('button', {name: 'Archive'})).not.toBeInTheDocument();
    expect(screen.getByText(/Processing is not yet complete/)).toBeInTheDocument();
    expect(perform).toHaveBeenCalledTimes(1);
  });

  it('freezes destructive confirmation and refuses changed context without calling perform', async () => {
    const perform = vi.fn().mockResolvedValue(completed);
    const setup = fixture([{id: 'delete', content: 'Delete', destructive: true, perform}]);
    const {rerender} = render(<TableBulkActions {...setup.props} />);
    fireEvent.click(screen.getByRole('button', {name: 'Delete'}));
    expect(perform).not.toHaveBeenCalled();
    setup.change({selectionRevision: 1, selection: {mode: 'explicit', ids: ['new']}});
    rerender(<TableBulkActions {...setup.props} selectedCount={1} />);
    fireEvent.click(screen.getByRole('button', {name: 'Confirm'}));
    expect(perform).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', {name: 'Cancel'}));
    expect(perform).not.toHaveBeenCalled();
  });

  it('keeps destructive errors inside the modal and retries the same intent', async () => {
    const perform = vi.fn().mockRejectedValueOnce(new Error('Delete unavailable')).mockResolvedValueOnce(completed);
    const setup = fixture([{id: 'delete', content: 'Delete', destructive: true, perform}]);
    const {container} = render(<TableBulkActions {...setup.props} />);
    fireEvent.click(screen.getByRole('button', {name: 'Delete'}));
    fireEvent.click(screen.getByRole('button', {name: 'Confirm'}));
    await screen.findByText('Delete unavailable');
    expect(container.querySelector('s-modal s-banner')).toHaveTextContent('Delete unavailable');
    fireEvent.click(screen.getByRole('button', {name: 'Retry same operation'}));
    await screen.findByText('2 succeeded, 0 failed');
    expect(perform.mock.calls[0]![0].idempotencyKey).toBe(perform.mock.calls[1]![0].idempotencyKey);
  });

  it('checks token expiry again immediately before calling perform', async () => {
    vi.useFakeTimers();
    try {
      const now = Date.parse('2026-01-01T00:00:00.000Z');
      vi.setSystemTime(now);
      const perform = vi.fn().mockResolvedValue(completed);
      const setup = fixture([{id: 'archive', content: 'Archive', perform}]);
      setup.change({selection: {mode: 'allMatching', selectionToken: 'token', selectedCount: 2, expiresAt: new Date(now + 1).toISOString(), excludedIds: []}});
      render(<TableBulkActions {...setup.props} />);
      fireEvent.click(screen.getByRole('button', {name: 'Archive'}));
      vi.setSystemTime(now + 2);
      await act(async () => { await Promise.resolve(); });
      expect(perform).not.toHaveBeenCalled();
      expect(setup.clear).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Selection has expired. Select the rows again.')).toBeInTheDocument();
    } finally { vi.useRealTimers(); }
  });

  it('treats explicit backend selection expiry as terminal for retry', async () => {
    const perform = vi.fn().mockRejectedValue({code: 'SELECTION_EXPIRED'});
    const setup = fixture([{id: 'archive', content: 'Archive', perform}]);
    render(<TableBulkActions {...setup.props} />);
    fireEvent.click(screen.getByRole('button', {name: 'Archive'}));
    await screen.findByText('Selection has expired. Select the rows again.');
    expect(setup.clear).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', {name: 'Retry same operation'})).not.toBeInTheDocument();
  });
});
