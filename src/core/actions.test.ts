import {describe, expect, it} from 'vitest';
import {createIdempotencyKey, isSelectionExpired, shouldClearSelection} from './actions';
import type {CoreAllMatchingSelection} from './actions';

const selection: CoreAllMatchingSelection = {
  mode: 'allMatching', selectionToken: 'server-token', selectedCount: 10,
  expiresAt: '2026-01-01T01:00:00.000Z', excludedIds: [],
};

describe('renderer-independent action utilities', () => {
  it('creates non-empty idempotency keys', () => {
    expect(createIdempotencyKey()).toEqual(expect.any(String));
    expect(createIdempotencyKey().length).toBeGreaterThan(10);
  });

  it('checks the expiry boundary for numeric and Date clocks', () => {
    const boundary = Date.parse(selection.expiresAt);
    expect(isSelectionExpired(selection, boundary - 1)).toBe(false);
    expect(isSelectionExpired(selection, boundary)).toBe(true);
    expect(isSelectionExpired(selection, new Date(boundary + 1))).toBe(true);
    expect(isSelectionExpired({mode: 'explicit', ids: []}, boundary)).toBe(false);
  });

  it('fails closed for an invalid expiry, clock, or empty token', () => {
    const now = Date.parse('2026-01-01T00:00:00.000Z');
    for (const expiresAt of ['', 'not-a-date']) expect(isSelectionExpired({...selection, expiresAt}, now)).toBe(true);
    for (const selectionToken of ['', '   ']) expect(isSelectionExpired({...selection, selectionToken}, now)).toBe(true);
    expect(isSelectionExpired(selection, Number.NaN)).toBe(true);
    expect(isSelectionExpired(selection, new Date('invalid'))).toBe(true);
  });

  it('fails closed for invalid counts while accepting a valid zero-result token', () => {
    const now = Date.parse('2026-01-01T00:00:00.000Z');
    for (const selectedCount of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1]) {
      expect(isSelectionExpired({...selection, selectedCount}, now)).toBe(true);
    }
    expect(isSelectionExpired({...selection, selectedCount: 0}, now)).toBe(false);
  });

  it('only clears selection when a result explicitly requests it', () => {
    expect(shouldClearSelection({status: 'completed', succeededCount: 1, failed: [], clearSelection: true})).toBe(true);
    expect(shouldClearSelection({status: 'accepted', operationId: 'op', acceptedCount: 1, clearSelection: false})).toBe(false);
  });
});
