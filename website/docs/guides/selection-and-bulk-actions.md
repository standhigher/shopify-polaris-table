---
id: selection-and-bulk-actions
sidebar_position: 4
title: Selection and bulk actions
---

For selected rows on one or more loaded pages, store an explicit selection:

```ts
{mode: 'explicit', ids: ['o_1', 'o_2']}
```

For **select all matching**, do not download or post every matching row ID. `onSelectAllMatching` receives the active `TableQuery`; your application sends it to the server, which returns a query-bound token:

```ts
{
  selectionToken: 'server-issued-token',
  normalizedQuery: query,
  selectedCount: 812,
  expiresAt: '2026-08-14T10:30:00.000Z',
}
```

Store the result as the `allMatching` `TableSelection` variant, including `excludedIds`. The server owns token issuance, expiry, query normalization, permissions, and revocation. Reject an expired token; `isSelectionExpired` helps the client avoid presenting a stale action.

Every `TableBulkAction.perform` receives an `idempotencyKey`. Forward it with the bulk request and have the server deduplicate retries by action and key. `createIdempotencyKey` creates a client key when an application does not already have one.

```ts
bulkActions: [{
  id: 'archive',
  content: 'Archive',
  perform: ({selection, idempotencyKey}) => archiveOrders(selection, idempotencyKey),
}]
```

`archiveOrders` is application-owned integration code. It must validate the token or IDs, current authorization, and idempotency key, then return either a `completed` or `accepted` `TableBulkActionResult`. Honor `clearSelection` (or `shouldClearSelection`) only after receiving that response.

See the complete [selection and actions example](../examples/selection-and-actions).
