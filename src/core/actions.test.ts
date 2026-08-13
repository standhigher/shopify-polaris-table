import {describe, expect, it} from 'vitest';
import {createIdempotencyKey, isSelectionExpired, shouldClearSelection} from './actions';

describe('renderer-independent action utilities', () => {
  it('creates non-empty idempotency keys and detects expired selections', () => {
    expect(createIdempotencyKey()).toEqual(expect.any(String));
    expect(createIdempotencyKey().length).toBeGreaterThan(10);
    const selection = {mode: 'allMatching' as const, selectionToken: 't', selectedCount: 1, expiresAt: '2020-01-01T00:00:00.000Z', excludedIds: []};
    expect(isSelectionExpired(selection, new Date('2021-01-01T00:00:00.000Z'))).toBe(true);
  });

  it('only clears selection when a result explicitly requests it', () => {
    expect(shouldClearSelection({status: 'completed', succeededCount: 1, failed: [], clearSelection: true})).toBe(true);
    expect(shouldClearSelection({status: 'accepted', operationId: 'op', acceptedCount: 1, clearSelection: false})).toBe(false);
  });
});
