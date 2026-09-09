---
id: extension-table
sidebar_position: 7
title: Extension-safe table
---

`ExtensionTable` is a separate renderer for narrow App Extension hosts. It deliberately does not use the Admin `Table` contract: there is no URL state, saved views, bulk selection, filters, or V1 offset pagination.

## Required host boundary

Pass `locale`, `timeZone`, and the host capabilities explicitly. The host owns data retrieval and its cursor; `hasMore` and `onLoadMore` are a Load More boundary and do not accept a V1 `TableQuery`.

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

The renderer caps output at three columns and uses `minmax(0, 1fr)` cell layout, so it does not introduce horizontal overflow in the target host. Only `text`, `status`, and application-owned `custom` cell renderers are supported.

## Safe fallbacks

Set `readOnly` for a host that cannot safely expose write controls; it removes selection and the row action but leaves host-approved Load More available. Each control renders only when it is both supplied by the application and enabled in `host.capabilities`.

Use `loadingState`, `emptyState`, and `errorState` to provide host-specific UI. `error` and `onRetry` cover initial requests; action and Load More failures render an accessible error message without changing selection or query state.
