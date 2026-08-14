---
id: url-state-saved-views-presets
sidebar_position: 5
title: URL state, saved views, and presets
---

V2 keeps routing and persistence outside the table while providing safe state helpers.

## URL state

Use `encodeTableQuery` and `decodeTableQuery` with an allowlist. The adapter serializes a versioned query with one-based `page`, `pageSize`, optional search/sort, and JSON filters.

```ts
const options = {
  filterKeys: ['status', 'createdAt'],
  sensitiveFilterKeys: ['customerEmail'],
  pageSizeOptions: [25, 50, 100],
};

const search = encodeTableQuery(query, options);
const restoredQuery = decodeTableQuery(search, options);
```

Only allowlisted, non-sensitive filters are written or restored. Malformed filter JSON is rejected as a whole. The adapter has no router dependency; update browser state using your application's routing layer.

## Saved views and column visibility

A `TableView` captures a `TableQuery`, visible column keys, owner, and update timestamp. Implement `TableViewRepository` in the application for storage, authorization, uniqueness, and conflict responses, then wrap it with `createTableViewManager` for local write state.

Use `sanitizeVisibleColumnKeys`, `getVisibleColumns`, and `reconcileVisibleColumnState` when restoring a saved view after a column schema change. Visibility never changes data, but a saved sort or filter for a now-hidden field is removed by reconciliation.

## Filter presets

`TableFilterPreset` is a curated shortcut containing only an ID, label, and filters. `applyFilterPreset(query, preset)` replaces filters and resets page 1; it intentionally cannot change sort, page size, or visible columns.

Domain helpers `createProductColumns`, `createOrderColumns`, and `createCustomerColumns` provide starting column sets. They do not make backend choices for your application.
