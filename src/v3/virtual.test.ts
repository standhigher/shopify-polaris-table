import {describe, expect, it} from 'vitest';
import {calculateVirtualWindow} from './virtual';

describe('virtual window calculation', () => {
  it('returns an overscanned, bounded window and offsets', () => {
    expect(calculateVirtualWindow({itemCount: 100, itemSize: 20, scrollOffset: 200, viewportSize: 100, overscan: 2})).toEqual({
      startIndex: 8,
      endIndex: 16,
      offsetStart: 160,
      offsetEnd: 1660,
      totalSize: 2000,
    });
  });

  it('handles empty lists and clamps negative scroll offsets', () => {
    expect(calculateVirtualWindow({itemCount: 0, itemSize: 20, scrollOffset: -1, viewportSize: 100})).toEqual({
      startIndex: 0,
      endIndex: 0,
      offsetStart: 0,
      offsetEnd: 0,
      totalSize: 0,
    });
  });
});
