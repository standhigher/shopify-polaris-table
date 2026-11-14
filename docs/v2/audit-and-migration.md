# V1 审计与 V2 功能迁移清单

## 审计范围

已阅读 67 个核心文件（`src/types`、`core`、`features`、`adapters`、`hooks`、`views`、`utils`、`presets`、`v3` 的实现与测试，以及入口、examples），另由 UI 审计覆盖 `src/components` 7 个模块、columns、experimental、全部 stories、Storybook 配置、测试 setup 和 `test` 包消费者测试。未执行浏览器/BestSourcing 生产验证；故事的 `play` 仅为代码存在证据，不是执行证据。

## V1 API 与功能盘点

| 区域 | 稳定能力/入口 | 复用策略 |
|---|---|---|
| 查询 | `TableQuery`：`page/pageSize/search/sort/filters`；`TableDataPage`、`TablePagination` | 保持类型与 one-based offset；V2 renderer 只发 `onQueryChange` |
| 列 | `TableColumnType` text/number/money/status/datetime/image/actions/custom；`TableColumn` 支持 title/sortable/align/currencyCode/timeZone/statusTone/render | 保持字段；新增可选 `listSlot`，映射为 `s-table-header`，不传播未知 WC 属性 |
| 格式化 | `renderCell/getColumnValue`、`formatText/Number/Money/DateTime`、warning、formatter preset | 纯函数保留；WC 输出只替换 UI 包装 |
| 查询 UI | `TableFilters`：text/select/multi-select/boolean/date-range，definition operator allowlist，search debounce，applied filters，clear | 保持 `TableFilterDefinition` 和 clean/page reset；改成 s-* 控件和 popover |
| 排序 | Table 根据 visible column index 生成 `sort`，criteria 变更 page=1 | WC table 没有 sort；新增受控排序 selector组合，保持 query model |
| 分页 | `TablePagination` page/pageSize/total/labels/loading | s-table 原生 `paginate/hasPreviousPage/hasNextPage` 和事件；页大小另用 s-select；不要再渲染重复 Prev/Next |
| 状态 | TableState error/retry、loading、empty；旧数据 loading 保留 IndexTable | `TableSkeleton` 只用于首次无数据；刷新使用 `s-table loading`；错误/重试行为需确认并补齐 |
| 选择 | explicit ids；allMatching token/selectedCount/expiresAt/excludedIds；当前页全选/部分选中 | s-checkbox checked/indeterminate/change；保留跨页协议；修复 token 并发、错误和旧响应 |
| 批量 | `TableBulkAction.perform`、idempotency key、completed/accepted、partial failures、clearSelection | s-button/s-menu/s-modal；ref 互斥、防旧结果清新 selection、反馈详情 |
| 行操作 | `TableRowAction` async perform，V1 actions stopPropagation | s-button/s-menu；捕获拒绝并反馈；不能靠整行 click 选中链接/操作 |
| 可见列 | `sanitize/reconcile/getVisibleColumns`；required key、至少一列、隐藏 sort/filter 清理 | s-popover + s-choice-list 或 s-checkbox；manager/host 仍拥有 preference |
| Saved Views | `TableViewRepository/Manager`、CRUD、StaleWriteError、TableViews controlled | 复用 repository/state；WC 只换呈现，补 stale response/conflict 处理 |
| Filter Presets | `applyFilterPreset` 仅替换 filters、page=1；TableFilterPresets | s-button-group / clickable-chip；API 不变 |
| URL | `encode/decodeTableQuery` fixed v=1、allowlists、sensitive keys、History 示例 | 保持，不引入 Router/API client |
| Extension | 独立 `ExtensionTable`、最多3列、host locale/timeZone/capabilities、cursor Load More、readOnly/selection/action/error | 本期不重构、不与 Admin s-table 共享隐式状态；若运行时不同，继续独立入口 |
| Core | `CoreSchema/CoreQuery/CoreSelection`、normalize/update、Polaris renderer adapter contract | 作为边界契约复用；不声称它自动驱动现有 Table，逐步接入而不删除 Admin types |
| Preview | `src/v3` cursor/virtual/columns/expandable/inlineEdit helpers | 保持 preview；本期不做 UI、不提升稳定承诺 |

## 公共导出与内部边界（精确盘点）

入口以 [root](<../../src/index.ts>)、[types](<../../src/types/index.ts>)、[extension](<../../src/extension.ts>) 为准；TableFilters/Pagination/State 本身不是 root export，不能误列为现有稳定公共组件。

- **Admin**：`Table`、`TableProps`；`TableColumnVisibility` / `TableColumnVisibilityProps`；`TableFilterPresets` / `TableFilterPresetsProps`；`TableViews` / `TableViewsProps` / `TableViewLabels`。
- **业务类型**：`TableColumn`、`TableColumnBase`、`TableColumnRenderer`、`TableColumnType`、`TableColumnAlignment`、`TableStatusTone`、`TableDataPage`、`TablePagination`、`TableQuery`、`TableFilters`、`TableFilterScalar`、`TableFilterValue`、`TableFilterOperator`、`TableFilterDefinition`、`TableFormatOptions`、`TableFormatWarning`、`TableLabels`、`TableSelection`、`TableSelectAllMatchingResult`、`TableBulkAction`、`TableBulkActionResult`、`TableBulkFailure`、`TableRowAction`。
- **格式化**：`renderCell`、`getColumnValue`、`EMPTY_CELL_PLACEHOLDER`、`formatDateTime`、`formatMoney`、`formatNumber`、`formatText`、`resolveCurrencyCode`；`FormatDateTimeOptions` / `FormatMoneyOptions` / `FormatTextOptions`。
- **查询/列**：`cleanFilters`、`useTableQuery`（`setSearch/setFilters/setSort/setPage/setPageSize/clearFilters`）；`UseTableQueryOptions/Result`；`getVisibleColumns`、`reconcileVisibleColumnState`、`sanitizeVisibleColumnKeys`、`ReconciledVisibleColumnState`、`ReconcileVisibleColumnStateOptions`。
- **URL**：`decodeTableQuery`、`encodeTableQuery`、`TABLE_QUERY_URL_VERSION`、`TableQueryUrlOptions`。
- **视图/预设**：`applyFilterPreset`、`TableFilterPreset`；`createTableViewManager`、`StaleWriteError`；`CreateTableViewInput`、`UpdateTableViewInput`、`TableView`、`TableViewManager`、`TableViewManagerOptions`、`TableViewManagerState`、`TableViewRepository`。
- **Formatter preset**：`createFormatterPreset`、`shopifyFormatterPreset`、`FormatterPresetOptions`、`TableFormatterPreset`、`TableFormatterPresetOverrides`。
- **领域 preset**：`createProductColumns/createOrderColumns/createCustomerColumns/createCampaignColumns/createOfferColumns`；每类 `*Row` 与 `*ColumnOverrides`。
- **Core**：`CoreColumnType/CoreColumn/CoreSchema`、`createCoreSchema/getCoreColumn/validateCoreSchema`；`CoreQuery`、`normalizeCoreQuery/updateCoreQuery`；`CoreExplicitSelection/CoreAllMatchingSelection/CoreSelection/CoreBulkActionResult`、`createIdempotencyKey/isSelectionExpired/shouldClearSelection`。
- **Adapter**：`assertPolarisRendererAdapter/createPolarisRendererAdapter`、`PolarisRendererAdapter`、`PolarisRenderTableContext/PolarisRenderHeaderContext/PolarisRenderCellContext`。
- **Extension**（root 也保留再导出）：`ExtensionTable`、`EXTENSION_TABLE_MAX_COLUMNS`；`ExtensionTableCellContext/Column/ColumnType/HostCapabilities/HostContext/Labels/Props/RowAction`。
- **Preview V3**：`appendCursorPage/canLoadMoreCursorPage/createCursorQuery/isCursorQuery`、`CursorDataPage/CursorInfiniteState/CursorTableQuery`；`calculateVirtualWindow`、`VirtualWindow/VirtualWindowOptions`；`createColumnLayoutState/getStickyOffsets/getLayoutVisibleColumns/reorderColumns/resetColumnLayout/resizeColumn/setColumnVisibility`、`ColumnLayoutDefinition/ColumnLayoutState/RuntimeColumnLayout/StickyColumnPosition/StickyOffset`；`collapseRow/expandRow/isRowExpanded/toggleRowExpanded`、`ExpandableRowsState`；`beginInlineEdit/cancelInlineEdit/isInlineEditVersionCurrent/markInlineEditSaving/resolveInlineEdit/updateInlineEdit/validateInlineEdit`、`InlineEditError/InlineEditResult/InlineEditSession/InlineEditVersion`。
- [selection helpers](<../../src/features/selection.ts>) 中 row toggle/page/exclusion helper 是内部实现，不直接 root export；root 的 `isSelectionExpired` 来自 Core，存在重复 expiry 实现，后续修改需同时回归。

### 关键证据索引

| 发现 | 实现证据 |
| --- | --- |
| Table 核心 API / 判别列联合 | [Table 类型](<../../src/types/table.ts#L81-L192>) |
| 完整 query 变化清 token | [Table:40–47](<../../src/components/Table/Table.tsx#L40-L47>) |
| bulk state锁/反馈/旧结果清选择 | [Table:88–114](<../../src/components/Table/Table.tsx#L88-L114>) |
| token无catch/normalizedQuery未用 | [Table:153–161](<../../src/components/Table/Table.tsx#L153-L161>) |
| 页全选降级 explicit / exclusions | [selection:19–48](<../../src/features/selection.ts#L19-L48>) |
| 两套 query reset 不同 | [Core:24–29](<../../src/core/query.ts#L24-L29>)、[hook:75–99](<../../src/hooks/useTableQuery.ts#L75-L99>) |
| visibility移除条件但不重置page | [visibleColumns:58–86](<../../src/features/visibleColumns.ts#L58-L86>) |
| Repository/manager并发边界 | [views:12–24](<../../src/views/tableViews.ts#L12-L24>)、[views:54–89](<../../src/views/tableViews.ts#L54-L89>) |
| URL默认允许所有字段（必须宿主提供allowlist） | [URL:69–76](<../../src/adapters/urlQuery.ts#L69-L76>) |
| status只是span，actions默认null，image错误移除 | [renderCell:37–54](<../../src/columns/renderCell.tsx#L37-L54>) |

## 已发现的行为风险

- `Table.tsx` 使用 `JSON.stringify(query)` 清 allMatching，page/pageSize 变化也会清，属性顺序变化可能误触发；`selectCurrentPage` 会把 allMatching 降级为 explicit。
- select-all matching 的 Promise 没有 catch、没有 request revision，服务端 `normalizedQuery` 被丢弃，旧响应可能覆盖新 selection。
- bulk `pendingAction` 是 state，快速双击可能同一提交周期重复调用；每次点击新建 key，网络重试不复用；旧结果可能清空新 selection。row action rejection 也未反馈。
- `allMatching` 的 `selectedCount` 不因 exclusions 更新；非法日期没有过期；部分失败只展示计数，不展示失败原因/id。
- views manager 的 latestWrite 是全局且旧写仍会落库；晚到错误可污染当前 error，UI 没有 refetch/merge/conflict recovery。
- `CoreQuery` 与 `TableQuery` 并行但不等价；现有 Polaris adapter 只是 contract，Admin Table 直接导入 `@shopify/polaris`。
- 现有 Table 的 `error` 覆盖旧数据；data 空而 total>0 且非 loading 时可能同时显示 empty state 与空表；TableFeatures 名称为 loading/empty/error/retry 的故事并未全部真实触发分支。Table.stories 有实际空/加载切换；Extension story 有局部 play。
- 当前测试真实覆盖了主要 happy path 和各 POC 核心纯状态，但未覆盖 WC runtime、SSR、事件注册时序、真实 popover/modal、键盘/读屏全流程、URL 并发、row-action rejection、select-all rejection、invalid pagination、旧响应隔离。

## 复用边界

**直接复用**：所有公共数据类型、formatters、query/URL helpers、selection/visible-column pure helpers、views repository contract/manager、presets、idempotency key、Core validation、ExtensionTable。

**适配复用**：`renderCell`（返回 ReactNode 的签名可保留，但内层节点改为官方 WC 或宿主提供的 custom renderer）、`TableFilters`、Pagination、State、Visibility、Views、Presets、Table 编排。

**重构 UI**：所有 `@shopify/polaris` imports；IndexTable、Filters、ChoiceList、Select、TextField、Checkbox、Banner、EmptyState、Spinner、Button、UnstyledButton、Popover/Modal 组合。旧 `TableRow` 的整行 click-select 设计不能原样搬迁。

**保持隔离**：`ExtensionTable` 不接 Admin URL/Saved Views/bulk/V1 offset；experimental 不进入包内容；V3/V4 纯 helper 不假装 UI 完成。

## 分阶段迁移

1. **P0**：本文、架构、兼容性、验证与风险决议；不实现。
2. **P1**：React 19 + DOM/types；`@shopify/polaris-types@2.0.0`；WC runtime 由宿主；React JSX augmentation；清除 Polaris React root peer/dev/import；Node types 基线修复；SSR/事件 spike。
3. **P2**：只实现 Admin s-table renderer 和 cells；先静态受控 rows，再接 selection/action；header `listSlot`/format 映射。
4. **P3**：search/filter/applied/sort/page-size/native pagination/URL；每次 criteria page=1，旧数据 refresh 保持。
5. **P4**：checkbox selection、token、excluded、bulk、modal/menu、反馈和幂等竞态。
6. **P5**：visibility/views/presets/state/skeleton/loading/error/retry；补 repository stale/conflict tests。
7. **P6**：单测/集成/axe/键盘/浏览器视觉/Storybook/BestSourcing 三类页面。
8. **P7**：beta 元数据、迁移文档、产物、真实消费者；只准备发布，不执行正式 publish。

## 迁移非目标

Virtual Scrolling、Sticky Header/Columns、Resize/Reorder、Expandable Row、Inline Edit、Cursor Infinite Loading、ExtensionTable 重构均不纳入本期；不新增 fetch/cache/auth/router/database/UI library。
