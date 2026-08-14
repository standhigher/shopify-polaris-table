---
id: selection-and-actions
sidebar_position: 2
title: 选择与操作示例
---

当用户必须选择匹配当前 query 的每一行并启动 server-side bulk operation 时，使用此示例。完整源码见 [examples/selection-and-actions.tsx](https://github.com/standhigher/shopify-polaris-table/blob/main/examples/selection-and-actions.tsx)。

```tsx
onSelectAllMatching={async (currentQuery) => ({
  selectionToken: await createSelectionToken(currentQuery),
  normalizedQuery: currentQuery,
  selectedCount: total,
  expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
})}
bulkActions={[{
  id: 'archive',
  content: 'Archive',
  perform: async ({selection: selected, idempotencyKey}) => archiveOrders(selected, idempotencyKey),
}]}
```

`createSelectionToken` 和 `archiveOrders` 是 **application-owned integrations**，仅为使示例通过 type-check 而声明。它们不是 package exports，且 package 不规定 backend endpoints。

`createSelectionToken` 必须要求 server 将 active、normalized query 绑定到具有 expiry 的 authorized token。`archiveOrders` 必须提交 explicit IDs 或 all-matching token 与 idempotency key。它返回 `TableBulkActionResult`；完成的 action 可以报告 partial failures，而已接受的 action 可返回 asynchronous `operationId`。

server 必须校验 token expiry、authorization、query scope 和 idempotency。完整契约见[选择与批量操作](../guides/selection-and-bulk-actions)。
