---
id: selection-and-bulk-actions
sidebar_position: 4
title: 选择与批量操作
---

对于一个或多个已加载页面中的已选行，存储 explicit selection：

```ts
{mode: 'explicit', ids: ['o_1', 'o_2']}
```

对于**全选匹配项**，不要下载或提交每个匹配行的 ID。`onSelectAllMatching` 接收 active `TableQuery`；应用将它发送给 server，server 返回与 query 绑定的 token：

```ts
{
  selectionToken: 'server-issued-token',
  normalizedQuery: query,
  selectedCount: 812,
  expiresAt: '2026-08-14T10:30:00.000Z',
}
```

将结果存储为 `allMatching` `TableSelection` variant，并包含 `excludedIds`。server 负责 token issuance、expiry、query normalization、permissions 和 revocation。拒绝过期 token；`isSelectionExpired` 可帮助 client 避免展示陈旧的 action。

每个 `TableBulkAction.perform` 都会接收 `idempotencyKey`。将它与 bulk request 一同转发，并让 server 按 action 和 key 对 retries 去重。当应用尚没有自己的 key 时，`createIdempotencyKey` 会创建 client key。

```ts
bulkActions: [{
  id: 'archive',
  content: 'Archive',
  perform: ({selection, idempotencyKey}) => archiveOrders(selection, idempotencyKey),
}]
```

`archiveOrders` 是 application-owned integration code。它必须校验 token 或 IDs、当前 authorization 与 idempotency key，然后返回 `completed` 或 `accepted` `TableBulkActionResult`。只有在收到该 response 后才遵从 `clearSelection`（或 `shouldClearSelection`）。

请查看完整的[选择与操作示例](../examples/selection-and-actions)。
