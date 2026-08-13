export interface VirtualWindowOptions {
  itemCount: number;
  itemSize: number;
  scrollOffset: number;
  viewportSize: number;
  overscan?: number;
}

export interface VirtualWindow {
  startIndex: number;
  endIndex: number;
  offsetStart: number;
  offsetEnd: number;
  totalSize: number;
}

export function calculateVirtualWindow(options: VirtualWindowOptions): VirtualWindow {
  const itemCount = Math.max(0, options.itemCount);
  const itemSize = Math.max(1, options.itemSize);
  const totalSize = itemCount * itemSize;
  if (itemCount === 0) {
    return {startIndex: 0, endIndex: 0, offsetStart: 0, offsetEnd: 0, totalSize};
  }

  const overscan = Math.max(0, options.overscan ?? 0);
  const firstVisibleIndex = Math.floor(Math.max(0, options.scrollOffset) / itemSize);
  const visibleCount = Math.ceil(Math.max(0, options.viewportSize) / itemSize);
  const startIndex = Math.max(0, firstVisibleIndex - overscan);
  const endIndex = Math.min(itemCount - 1, firstVisibleIndex + Math.max(visibleCount - 1, 0) + overscan);
  const offsetStart = startIndex * itemSize;
  const renderedSize = (endIndex - startIndex + 1) * itemSize;

  return {
    startIndex,
    endIndex,
    offsetStart,
    offsetEnd: Math.max(0, totalSize - offsetStart - renderedSize),
    totalSize,
  };
}
