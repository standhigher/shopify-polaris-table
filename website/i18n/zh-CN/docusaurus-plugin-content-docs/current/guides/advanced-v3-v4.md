---
id: advanced-v3-v4
sidebar_position: 6
title: 高级 V3 与 V4 API
---

V3 和 V4 是按需使用的 state 与 integration primitives。它们不会改变 V1 受控 `Table` 契约。

## V3：高级状态辅助函数

- **Cursor / infinite loading：** `createCursorQuery` 创建带有 `mode: 'cursor'` 的 query；`appendCursorPage` 使用你的 ID function 去重 rows，`canLoadMoreCursorPage` 会遵守 loading 和 `nextCursor`。
- **Virtual window：** `calculateVirtualWindow` 根据显式 item size、scroll offset、viewport size 和可选 overscan 返回 start/end indexes 与 spacer offsets。在保留 `totalSize` 的同时仅渲染返回的 range。
- **Column layout：** `createColumnLayoutState`、`resizeColumn`、`reorderColumns`、`setColumnVisibility` 和 `getStickyOffsets` 管理 renderer-owned layout。如有需要，可将 widths 和 visibility 保存在应用 storage 中。
- **Expandable rows：** 将 `expandRow`、`collapseRow` 和 `toggleRowExpanded` 与 `ExpandableRowsState` 一起使用；renderer 控制 expanded content。
- **Inline edit：** 使用 `beginInlineEdit` 开始，校验 draft，调用 `markInlineEditSaving`，再用 `resolveInlineEdit` 处理 server outcomes。包含 application-managed row version，以便安全处理 `conflict` result。

cursor models 不会报告 V1 的 offset `total`；virtual-window helpers 不会渲染 DOM；inline-edit helpers 不会保存 data。每一项都刻意保持 framework-neutral state。

## V4：core contracts 与 Polaris adapters

将 `createCoreSchema` 与 `CoreSchema` 一起使用，以获得 renderer-independent row ID 和 `CoreColumn` list。`CoreQuery` 以 generic filters 支持相同的 page/search/sort shape；`normalizeCoreQuery` 会对其进行 sanitize，`updateCoreQuery` 则在 criteria changes 时将 page 重置为 1。

仅在 UI boundary 创建 `PolarisRendererAdapter`：

```ts
const adapter = createPolarisRendererAdapter({
  renderTable: ({rows}) => rows.length,
  renderHeader: ({columns}) => columns.map((column) => column.title).join(', '),
  renderCell: ({value}) => String(value ?? ''),
});
```

core package 不 import Polaris UI components。adapter 将自身标识为 `renderer: 'polaris'`，并提供 `renderTable`、`renderHeader` 和 `renderCell` functions。请用 `assertPolarisRendererAdapter` 校验不可信 integrations。
