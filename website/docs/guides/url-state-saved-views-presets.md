---
id: url-state-saved-views-presets
sidebar_position: 5
title: URL state, saved views, and presets
---

V2 keeps routing and persistence outside the table while providing safe state helpers.

## URL state

Use `encodeTableQuery` and `decodeTableQuery` with explicit allowlists. The adapter serializes the fixed `v=1` contract with one-based `page`, `pageSize`, optional `search` and `sort`, and JSON `filters`.

```ts
const options = {
  filterKeys: ['status', 'createdAt'],
  sensitiveFilterKeys: ['customerEmail'],
  sortKeys: ['createdAt', 'status'],
  pageSizeOptions: [25, 50, 100],
};

const search = encodeTableQuery(query, options);
const restoredQuery = decodeTableQuery(search, options);
```

Only allowlisted, non-sensitive filters and allowlisted sort fields are written or restored. Unknown URL versions, malformed filter JSON, invalid page values, and unsupported page sizes safely fall back to the base query; filters are rejected as a whole if any field is unsafe. The adapter has no router dependency, and the application must still allowlist every decoded field before making a server request.

For the browser History API pattern, see [`examples/url-state.tsx`](https://github.com/standhigher/shopify-polaris-table/blob/main/examples/url-state.tsx). It restores the query at first render and on `popstate`, so refresh, back, and forward navigation all use the same decoder. A Router can replace only the `pushState` and `popstate` wiring.

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
