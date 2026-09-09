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

`Table` can own the visible-column UI while the application retains the preference. Pass `visibleColumnKeys` and `onVisibleColumnsChange`; omit `visibleColumnKeys` to render every declared column. Use `requiredColumnKeys` for identifiers that must never be hidden.

```tsx
const [visibleColumnKeys, setVisibleColumnKeys] = useState(['id', 'name', 'status']);

<Table
  {...tableProps}
  visibleColumnKeys={visibleColumnKeys}
  requiredColumnKeys={['id']}
  onVisibleColumnsChange={setVisibleColumnKeys}
/>
```

The built-in **Columns** control supports show, hide, and reset. When a saved preference references removed or duplicate keys, `Table` calls `onVisibleColumnsChange` with the sanitized keys. It also calls `onQueryChange` with any sort or filters for newly hidden fields removed. Use `sanitizeVisibleColumnKeys`, `getVisibleColumns`, and `reconcileVisibleColumnState` when restoring saved state outside `Table`.

## Filter presets

`TableFilterPreset` is a curated shortcut containing only an ID, label, and filters. `applyFilterPreset(query, preset)` replaces filters and resets page 1; it intentionally cannot change sort, page size, or visible columns.

Domain helpers `createProductColumns`, `createOrderColumns`, and `createCustomerColumns` provide starting column sets. They do not make backend choices for your application.
