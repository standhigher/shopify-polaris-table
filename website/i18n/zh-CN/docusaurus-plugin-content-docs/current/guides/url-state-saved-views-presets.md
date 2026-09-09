---
id: url-state-saved-views-presets
sidebar_position: 5
title: URL state、已保存视图与预设
---

V2 将 routing 和 persistence 置于 table 之外，同时提供安全的 state helpers。

## URL state

结合 allowlist 使用 `encodeTableQuery` 和 `decodeTableQuery`。adapter 会序列化带有从 1 开始的 `page`、`pageSize`、可选 search/sort 和 JSON filters 的 versioned query。

```ts
const options = {
  filterKeys: ['status', 'createdAt'],
  sensitiveFilterKeys: ['customerEmail'],
  pageSizeOptions: [25, 50, 100],
};

const search = encodeTableQuery(query, options);
const restoredQuery = decodeTableQuery(search, options);
```

仅 allowlisted、non-sensitive filters 会被写入或恢复。格式错误的 filter JSON 会整体被拒绝。adapter 没有 router dependency；请使用应用的 routing layer 更新 browser state。

## 已保存视图与列显隐

`TableView` 会捕获 `TableQuery`、visible column keys、owner 和 update timestamp。在应用中实现 `TableViewRepository` 以处理 storage、authorization、uniqueness 和 conflict responses，然后用 `createTableViewManager` 包装它来获得 local write state。

`Table` 可以提供列显隐 UI，而应用继续持有偏好状态。传入 `visibleColumnKeys` 和 `onVisibleColumnsChange`；省略 `visibleColumnKeys` 时，所有声明的列都会显示。使用 `requiredColumnKeys` 标记绝不能隐藏的标识列。

```tsx
const [visibleColumnKeys, setVisibleColumnKeys] = useState(['id', 'name', 'status']);

<Table
  {...tableProps}
  visibleColumnKeys={visibleColumnKeys}
  requiredColumnKeys={['id']}
  onVisibleColumnsChange={setVisibleColumnKeys}
/>
```

内置的 **Columns** 控件支持显示、隐藏和重置列。保存的偏好若引用了已删除或重复的 key，`Table` 会通过 `onVisibleColumnsChange` 回传清理后的 keys；同时会通过 `onQueryChange` 移除刚隐藏字段上的 sort 和 filters。若在 `Table` 外恢复 saved state，请使用 `sanitizeVisibleColumnKeys`、`getVisibleColumns` 和 `reconcileVisibleColumnState`。

## Filter presets

`TableFilterPreset` 是一个 curated shortcut，只包含 ID、label 和 filters。`applyFilterPreset(query, preset)` 会替换 filters 并将 page 重置为 1；它刻意不能改变 sort、page size 或 visible columns。

领域辅助函数 `createProductColumns`、`createOrderColumns` 和 `createCustomerColumns` 提供起始 column sets。它们不会替应用作出 backend choices。
