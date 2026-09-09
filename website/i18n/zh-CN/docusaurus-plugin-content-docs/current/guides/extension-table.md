---
id: extension-table
sidebar_position: 7
title: Extension 安全表格
---

`ExtensionTable` 是面向窄 App Extension 容器的独立 renderer。它刻意不使用 Admin `Table` 的契约：没有 URL state、已保存视图、批量选择、筛选或 V1 offset pagination。

## 必需的宿主边界

显式传入 `locale`、`timeZone` 与宿主 capabilities。宿主负责数据获取和 cursor；`hasMore` 与 `onLoadMore` 是 Load More 边界，不接收 V1 `TableQuery`。

```tsx
<ExtensionTable
  columns={columns}
  data={rows}
  rowId="id"
  host={{
    locale: 'en',
    timeZone: 'UTC',
    shopId,
    capabilities: {selection: true, rowActions: true, loadMore: true},
  }}
  selectedRowId={selectedRowId}
  onSelectionChange={setSelectedRowId}
  rowAction={{content: 'Open', perform: openOrder}}
  hasMore={page.hasMore}
  loadingMore={page.loadingMore}
  onLoadMore={loadNextCursorPage}
/>
```

renderer 最多输出三列，并使用 `minmax(0, 1fr)` 的 cell layout，因此不会在目标宿主中引入横向溢出。仅支持 `text`、`status` 和应用自行渲染的 `custom` cell。

## 安全降级

对无法安全暴露写入控件的宿主设置 `readOnly`；它会移除单选和 row action，但仍保留宿主允许的 Load More。每个控件都只有在应用传入且 `host.capabilities` 开启时才会渲染。

使用 `loadingState`、`emptyState` 和 `errorState` 提供宿主特定 UI。`error` 与 `onRetry` 处理首屏请求；action 与 Load More 失败会展示可访问的错误信息，但不会改变 selection 或 query state。
