import {useMemo, useState} from 'react';
import type {ReactNode} from 'react';

import {calculateVirtualWindow} from '../v3/virtual';

/**
 * Internal 0.8 POC only. It intentionally has no public package export.
 * It proves fixed-height, non-interactive list virtualization; it is not an IndexTable replacement.
 */
export interface VirtualListPOCProps<T> {
  items: readonly T[];
  itemKey: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => ReactNode;
  itemSize: number;
  viewportSize: number;
  overscan?: number;
  ariaLabel: string;
}

export function VirtualListPOC<T>({
  items, itemKey, renderItem, itemSize, viewportSize, overscan = 2, ariaLabel,
}: VirtualListPOCProps<T>) {
  const [scrollOffset, setScrollOffset] = useState(0);
  const window = useMemo(() => calculateVirtualWindow({
    itemCount: items.length, itemSize, scrollOffset, viewportSize, overscan,
  }), [itemSize, items.length, overscan, scrollOffset, viewportSize]);
  const visibleItems = items.slice(window.startIndex, items.length === 0 ? 0 : window.endIndex + 1);

  return <>
    <div
      role="list"
      aria-label={ariaLabel}
      tabIndex={0}
      style={{height: viewportSize, overflowY: 'auto', overflowX: 'hidden', outlineOffset: 2}}
      onScroll={(event) => setScrollOffset(event.currentTarget.scrollTop)}
    >
      <div style={{height: window.totalSize, position: 'relative'}}>
        <div style={{position: 'absolute', top: window.offsetStart, left: 0, right: 0}}>
          {visibleItems.map((item, relativeIndex) => {
            const index = window.startIndex + relativeIndex;
            return <div key={itemKey(item, index)} role="listitem" style={{height: itemSize, overflow: 'hidden'}}>
              {renderItem(item, index)}
            </div>;
          })}
        </div>
      </div>
    </div>
    <div role="status" aria-live="polite">Showing {visibleItems.length} of {items.length} rows</div>
  </>;
}
