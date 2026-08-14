---
id: advanced-v3-v4
sidebar_position: 6
title: Advanced V3 and V4 APIs
---

V3 and V4 are opt-in state and integration primitives. They do not alter the V1 controlled `Table` contract.

## V3: advanced state helpers

- **Cursor / infinite loading:** `createCursorQuery` creates a query with `mode: 'cursor'`; `appendCursorPage` deduplicates rows by your ID function, and `canLoadMoreCursorPage` respects loading and `nextCursor`.
- **Virtual window:** `calculateVirtualWindow` returns the start/end indexes and spacer offsets from explicit item size, scroll offset, viewport size, and optional overscan. Render only the returned range while preserving `totalSize`.
- **Column layout:** `createColumnLayoutState`, `resizeColumn`, `reorderColumns`, `setColumnVisibility`, and `getStickyOffsets` manage a renderer-owned layout. Preserve widths and visibility in application storage if desired.
- **Expandable rows:** use `expandRow`, `collapseRow`, and `toggleRowExpanded` with `ExpandableRowsState`; the renderer controls the expanded content.
- **Inline edit:** start with `beginInlineEdit`, validate a draft, call `markInlineEditSaving`, and resolve server outcomes with `resolveInlineEdit`. Include an application-managed row version so a `conflict` result can be handled safely.

Cursor models do not report V1's offset `total`; virtual-window helpers do not render DOM; inline-edit helpers do not save data. Each is intentionally framework-neutral state.

## V4: core contracts and Polaris adapters

Use `createCoreSchema` with a `CoreSchema` for a renderer-independent row ID and `CoreColumn` list. `CoreQuery` supports the same page/search/sort shape with generic filters; `normalizeCoreQuery` sanitizes it and `updateCoreQuery` resets page 1 for criteria changes.

Create a `PolarisRendererAdapter` only at the UI boundary:

```ts
const adapter = createPolarisRendererAdapter({
  renderTable: ({rows}) => rows.length,
  renderHeader: ({columns}) => columns.map((column) => column.title).join(', '),
  renderCell: ({value}) => String(value ?? ''),
});
```

The core package does not import Polaris UI components. The adapter identifies itself as `renderer: 'polaris'` and supplies `renderTable`, `renderHeader`, and `renderCell` functions. Validate untrusted integrations with `assertPolarisRendererAdapter`.
