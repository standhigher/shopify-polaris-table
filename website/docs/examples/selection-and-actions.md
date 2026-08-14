---
id: selection-and-actions
sidebar_position: 2
title: Selection and actions example
---

Use this example when users must select every row matching the current query and start a server-side bulk operation. The complete source is [examples/selection-and-actions.tsx](https://github.com/standhigher/shopify-polaris-table/blob/main/examples/selection-and-actions.tsx).

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

`createSelectionToken` and `archiveOrders` are **application-owned integrations**, declared only to make the example type-check. They are not package exports and the package does not prescribe backend endpoints.

`createSelectionToken` must ask the server to bind the active, normalized query to an authorized token with an expiry. `archiveOrders` must submit the explicit IDs or all-matching token plus the idempotency key. It returns a `TableBulkActionResult`; a completed action can report partial failures, while an accepted action can return an asynchronous `operationId`.

The server must validate token expiry, authorization, query scope, and idempotency. See [selection and bulk actions](../guides/selection-and-bulk-actions) for the full contract.
