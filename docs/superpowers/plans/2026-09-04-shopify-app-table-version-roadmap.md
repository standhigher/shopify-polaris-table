# Shopify App Table Version Roadmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `@standhigher/polaris-data-table` 的产品 Roadmap 拆分为按版本执行的编码任务，优先服务 Shopify Embedded Admin 应用，并逐步覆盖 App Extensions 特定场景。

**Architecture:** 以当前受控 Polaris `Table` 为 Admin 主线，先补齐 V1 交互闭环，再建设 Admin 产品化能力。Foundation、Admin Experience 和 Extension Experience 保持边界；Extension 通过独立 renderer/组件入口承载受限交互，不在 Admin Table 中堆叠场景分支。V3/V4 高级能力在真实业务需求和独立 POC 通过后逐项进入实现。

**Tech Stack:** React 18+, TypeScript 5+, `@shopify/polaris >=12 <15`, Vitest, React Testing Library, Storybook, TypeDoc, Docusaurus, npm ESM package。

**Spec:** `docs/roadmap.md`

## Global Constraints

- 当前发布基线为 `v0.4.0`，包名为 `@standhigher/polaris-data-table`。
- V1 `TableQuery` 使用 one-based offset pagination；组件不内置 fetch、Router、鉴权、数据库或 API client。
- Embedded Admin 与 App Extensions 共享 Foundation 数据契约，但允许使用不同 renderer 和交互组件。
- 所有公共 API 变更必须同步类型测试、运行时测试、文档和 CHANGELOG。
- 所有服务端字段、排序字段、filter operator、selection token 和 bulk action 都必须由应用后端重新校验。
- 不使用前端全量 ID 模拟跨页全选；跨页全选必须使用 query-bound、可过期的服务端 token。
- 每个任务完成后必须运行与任务范围匹配的测试；每个版本完成后必须运行完整发布门禁。
- 本计划只定义后续编码任务；当前阶段不实现任何代码。

## Version Overview

| 版本 | 目标 | 主要产物 | 进入条件 |
| --- | --- | --- | --- |
| `0.5` | V1 基础稳定性 | 完整 Admin Table 交互闭环 | 当前 `v0.4.0` 基线稳定 |
| `0.6` | Admin Experience 产品化 | 列配置、视图、Preset、国际化 | 至少一个真实 Admin 页面验证 `0.5` |
| `0.7` | Extension-safe MVP | 紧凑、只读/可选的 Extension renderer | 明确目标 Extension 容器和交互限制 |
| `0.8` | 高级交互与大数据量 | 经过 POC 的高级能力 | 对应业务场景有真实性能需求 |
| `1.0` | 产品矩阵稳定 API | 兼容矩阵、稳定 API、迁移文档 | 至少两个 Admin 产品和一个 Extension 场景接入 |

执行顺序：`0.5` 完成后进入 `0.6`；`0.7` 可在 `0.6` 完成后并行准备，但必须先锁定 Extension 场景；`0.8` 的能力按独立 POC 结果择优进入；`1.0` 在矩阵接入证据充分后执行。

---

## Version 0.5 — V1 基础稳定性

### Version Goal

让当前 `Table` 在 Embedded Admin 的 Product、Order、Customer 列表中具备稳定、可解释、可测试的基础交互闭环。

### Task 0.5.1 — 冻结 V1 行为契约与回归基线

**Files:**

- Review: `src/types/table.ts`
- Review: `src/components/Table/Table.tsx`
- Review: `src/components/TableFilters/TableFilters.tsx`
- Review: `src/components/TablePagination/TablePagination.tsx`
- Modify: `src/components/Table/Table.test.tsx`
- Modify: `src/components/TableFilters/TableFilters.test.tsx`
- Modify: `src/components/TablePagination/TablePagination.test.tsx`
- Modify: `src/index.public-types.test-d.ts`
- Modify: `CHANGELOG.md`

**Interfaces:**

- Consumes: 当前 `TableProps<T>`、`TableQuery`、`TableSelection`、`TableBulkActionResult`。
- Produces: 一份可由测试和文档引用的 V1 行为矩阵，覆盖查询、选择、操作、状态和分页。

- [ ] 梳理所有现有公共 props 的行为，明确每个输入变化对应的回调和页面重置规则。
- [ ] 为已有但未充分覆盖的边界补充测试：空数据、加载旧数据、错误重试、总数为 0、页码边界、全选和 query 变化。
- [ ] 在 `CHANGELOG.md` 的 Unreleased 区域记录 `0.5` 的行为修复范围，不提前承诺发布日期。
- [ ] 运行 `npm test -- --reporter=dot`，确认基线测试数量和失败项清晰可追踪。

### Task 0.5.2 — 完整筛选控件与 operator allowlist

**Files:**

- Modify: `src/components/TableFilters/TableFilters.tsx`
- Modify: `src/components/TableFilters/TableFilters.test.tsx`
- Modify: `src/types/table.ts` only if the validated filter contract requires a backward-compatible type clarification
- Modify: `website/docs/guides/filters-and-query-contract.md`
- Modify: `website/i18n/zh-CN/docusaurus-plugin-content-docs/current/guides/filters-and-query-contract.md`

**Interfaces:**

- Consumes: `TableFilterDefinition`, `TableFilterValue`, `TableQuery`, `cleanFilters`。
- Produces: 所有已支持 filter 控件均按照声明的 operator 生成合法 query。

- [ ] 为 `date-range` 提供 from 和 to 两个独立输入，并在只填写一端时生成合法的部分 `between` value。
- [ ] 为 text、select、multi-select、boolean、date-range 建立 definition type 到 operator 的明确映射。
- [ ] 当 definition 不允许默认 operator 时，不生成该 operator；对无法渲染的 operator 使用明确的受支持降级规则并通过类型/文档说明。
- [ ] 验证空字符串、空数组、空范围被清理，`0` 和 `false` 被保留。
- [ ] 增加已存在 query 的回显测试，以及快速修改和清空筛选的回调测试。
- [ ] 更新中英文筛选契约文档，明确 UI allowlist 与服务端 allowlist 都必须存在。

### Task 0.5.3 — 行选择、行操作与 Actions 列闭环

**Files:**

- Modify: `src/components/Table/Table.tsx`
- Modify: `src/components/Table/TableRow.tsx`
- Modify: `src/components/Table/Table.test.tsx`
- Modify: `src/features/selection.ts`
- Modify: `src/features/selection.test.ts`

**Interfaces:**

- Consumes: `TableRowAction<T>`、`TableSelection`、`getRowId`、selection helpers。
- Produces: 行内 action 与行选择相互隔离，Actions 列具备稳定表头和 cell 结构。

- [ ] 为配置了 `rowActions` 的表格增加明确的 Actions heading，并保证每行 cell 数量与 heading 数量一致。
- [ ] 阻止行内 Button 的 click 事件冒泡到行选择处理器；增加回归测试验证 action click 不改变 selection。
- [ ] 让 action content 保留 `ReactNode`，不通过 `String()` 丢失图标或复合节点。
- [ ] 明确 row action 异常的处理方式：动作回调仍由应用负责业务错误，但组件必须避免未处理的同步 render 错误影响表格结构。
- [ ] 验证稳定 rowId、重复选择、取消选择和跨页 explicit selection 行为。

### Task 0.5.4 — Bulk Action 结果与 selection token 状态

**Files:**

- Modify: `src/components/Table/Table.tsx`
- Modify: `src/types/table.ts` only if result feedback needs a backward-compatible optional extension
- Modify: `src/features/selection.ts`
- Modify: `src/components/Table/Table.test.tsx`
- Modify: `src/features/selection.test.ts`
- Modify: `website/docs/guides/selection-and-bulk-actions.md`
- Modify: `website/i18n/zh-CN/docusaurus-plugin-content-docs/current/guides/selection-and-bulk-actions.md`

**Interfaces:**

- Consumes: `TableBulkAction.perform`、`TableBulkActionResult`、`TableSelection`、`isSelectionExpired`。
- Produces: completed、partial failure、accepted、error 和 token expired 均有稳定状态表现。

- [ ] 将 bulk action pending 状态与 action ID 绑定，阻止重复提交并保持其他 action 的明确禁用状态。
- [ ] 对 `completed` 结果呈现 succeeded count 和失败数量；失败明细通过稳定插槽或回调交给应用展示。
- [ ] 对 `accepted` 结果呈现 operation ID 或通过应用回调通知异步任务已受理。
- [ ] 对 promise rejection 和过期 all-matching token 提供错误状态，并允许应用重试或清除 selection。
- [ ] 仅当结果 `clearSelection === true` 时清除 selection；partial failure 默认保留 selection。
- [ ] 保持 idempotency key 由客户端生成且每次 action invocation 唯一。

### Task 0.5.5 — 状态、国际化与可访问性基线

**Files:**

- Modify: `src/components/Table/TableState.tsx`
- Modify: `src/components/TablePagination/TablePagination.tsx`
- Modify: `src/components/Table/Table.tsx`
- Modify: `src/components/Table/Table.test.tsx`
- Modify: `src/components/TablePagination/TablePagination.test.tsx`
- Modify: `src/stories/Table.stories.tsx`
- Modify: `src/stories/TableFeatures.stories.tsx`
- Modify: `website/docs/getting-started/first-table.md`
- Modify: `website/i18n/zh-CN/docusaurus-plugin-content-docs/current/getting-started/first-table.md`

**Interfaces:**

- Consumes: `loading`、`error`、`emptyState`、`onRetry`、pagination props。
- Produces: 可配置且可访问的 loading/error/empty/pagination 基础体验。

- [ ] 明确并测试状态优先级：error > loading > empty > table；加载已有数据时保留旧行。
- [ ] 为内置 UI 文案建立最小可覆盖文案入口，至少覆盖 loading、retry、empty、pagination 和 selection 相关文案。
- [ ] 为错误、加载、页码变化和批量操作状态补充 aria/live-region 测试。
- [ ] 在 Storybook 增加真实状态组合示例，不只展示类型或静态 JSON。
- [ ] 更新入门文档说明状态和文案配置方式。

### Task 0.5.6 — Version 0.5 release gate

**Files:**

- Modify: `package.json` only if release scripts need correction
- Modify: `CHANGELOG.md`
- Modify: `README.md` and `README.zh-CN.md` if public behavior or usage changes

- [ ] 运行 `npm run lint`。
- [ ] 运行 `npm test`。
- [ ] 运行 `npm run typecheck`。
- [ ] 运行 `npm run build`。
- [ ] 运行 `npm run test:package`。
- [ ] 运行 `npm run build-storybook`。
- [ ] 运行 `npm run docs:build`。
- [ ] 运行 `npm pack --dry-run --registry=https://registry.npmjs.org/`。
- [ ] 检查包内容只包含 `dist`、README、许可证和 CHANGELOG 等发布文件。
- [ ] 完成版本变更记录和迁移说明后，才允许发布 `0.5.0`。

---

## Version 0.6 — Admin Experience 产品化

### Version Goal

让多个 Embedded Admin 产品可以通过统一的列配置、查询状态、Saved Views、Filter Presets 和 formatter preset 快速接入。

### Task 0.6.1 — 受控列可见性与 schema migration

**Files:**

- Modify: `src/types/table.ts`
- Modify: `src/components/Table/Table.tsx`
- Modify: `src/features/visibleColumns.ts`
- Modify: `src/features/visibleColumns.test.ts`
- Modify: `src/components/Table/Table.test.tsx`
- Create: `src/components/TableColumnVisibility/TableColumnVisibility.tsx`
- Create: `src/components/TableColumnVisibility/TableColumnVisibility.test.tsx`
- Modify: `src/index.ts`
- Modify: `website/docs/guides/url-state-saved-views-presets.md`

**Interfaces:**

- Consumes: `getVisibleColumns`、`sanitizeVisibleColumnKeys`、`reconcileVisibleColumnState`。
- Produces: `Table` 的受控 `visibleColumnKeys` / `onVisibleColumnsChange` 能力，以及可访问的列配置入口。

- [ ] 将 visible column props 纳入 `TableProps<T>`，默认行为保持所有声明列可见。
- [ ] 确保隐藏列不参与 headings、cell rendering、sort index 和表格 a11y 结构。
- [ ] 提供隐藏、恢复、全部恢复和 schema migration 行为。
- [ ] 防止隐藏所有必需标识列；保留应用可指定的 required column 约束。
- [ ] 为列配置菜单增加键盘访问和 schema 变化测试。

### Task 0.6.2 — URL Query State 集成边界

**Files:**

- Review/Modify: `src/adapters/urlQuery.ts`
- Modify: `src/adapters/urlQuery.test.ts`
- Create: `examples/url-state.tsx`
- Modify: `website/docs/guides/url-state-saved-views-presets.md`
- Modify: `website/i18n/zh-CN/docusaurus-plugin-content-docs/current/guides/url-state-saved-views-presets.md`

**Interfaces:**

- Consumes: `encodeTableQuery`、`decodeTableQuery`、`TableQueryUrlOptions`。
- Produces: 与任意 Router 集成的无依赖 URL state 示例。

- [ ] 固定 URL 参数版本、page/pageSize/search/sort/filter 的序列化规则。
- [ ] 验证 allowlisted filters、sensitive filters、非法 JSON、非法 page size 和非法 sort field 的行为。
- [ ] 确保 decode 结果经过应用侧字段 allowlist 后才能用于请求。
- [ ] 示例只演示路由层接入，不引入具体 Router 作为包硬依赖。

### Task 0.6.3 — Saved Views UI 与并发状态

**Files:**

- Review/Modify: `src/views/tableViews.ts`
- Modify: `src/views/tableViews.test.ts`
- Create: `src/components/TableViews/TableViews.tsx`
- Create: `src/components/TableViews/TableViews.test.tsx`
- Modify: `src/index.ts`
- Modify: `website/docs/guides/url-state-saved-views-presets.md`

**Interfaces:**

- Consumes: `TableViewRepository`、`createTableViewManager`、visible column reconciliation。
- Produces: 应用可组合的 view list/create/rename/delete/switch UI 和状态回调。

- [ ] 保持 repository 负责持久化、授权、唯一性和冲突响应。
- [ ] 为 list/create/update/remove 提供 pending、error 和 stale write 状态。
- [ ] 处理删除当前视图、保存期间切换视图、服务端冲突和失效列 key。
- [ ] 区分“完整 Saved View”和“只应用筛选的 Filter Preset”。
- [ ] 为默认视图和无权限视图定义稳定的受控回调，不在组件内假设后端策略。

### Task 0.6.4 — Filter Presets、formatter 和领域 preset

**Files:**

- Review/Modify: `src/views/filterPresets.ts`
- Modify: `src/presets/formatters.ts`
- Modify: `src/presets/formatters.test.ts`
- Modify: `src/presets/product.ts`
- Modify: `src/presets/order.ts`
- Modify: `src/presets/customer.ts`
- Modify: `src/presets/campaign.ts`
- Modify: `src/presets/offer.ts`
- Modify: `src/presets/domains.test.ts`
- Create: `src/components/TableFilterPresets/TableFilterPresets.tsx`
- Create: `src/components/TableFilterPresets/TableFilterPresets.test.tsx`

- [ ] 保持 `applyFilterPreset` 只修改 filters 并重置 page，不修改 sort、pageSize 或 visible columns。
- [ ] 为 formatter preset 增加统一的 status、money、datetime override 规则。
- [ ] 验证各领域 preset 只包含最小行模型和可覆盖列定义，不混入请求、权限和产品私有流程。
- [ ] 以至少两个真实页面的重复列证据为准，决定是否增加新的领域 preset。
- [ ] 添加完整 Storybook 示例，展示 preset + override 的典型接入方式。

### Task 0.6.5 — Version 0.6 adoption and release gate

**Files:**

- Modify: `src/stories/QueryState.stories.tsx`
- Modify: `src/stories/Presets.stories.tsx`
- Modify: `src/stories/storybook-config.test.ts`
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `CHANGELOG.md`

- [ ] 使用同一套 API 完成至少两个 Admin 产品页面的接入示例或内部验证记录。
- [ ] 验证刷新、前进、后退、schema 变化、权限错误和并发写入场景。
- [ ] 运行完整发布门禁：lint、unit test、typecheck、build、package test、Storybook、docs build、pack dry-run。
- [ ] 完成 `0.6.0` 迁移说明和公开 API 变更记录。

---

## Version 0.7 — Extension-safe MVP

### Version Goal

为 App Extensions 提供受限但可靠的列表体验，重点保证容器适配、首屏性能、可用交互和安全降级。

### Task 0.7.1 — 锁定 Extension 场景与能力矩阵

**Files:**

- Create: `docs/superpowers/specs/2026-09-04-extension-safe-table-design.md`
- Create: `docs/extension-capability-matrix.md`
- Create: `src/stories/ExtensionRequirements.stories.tsx`
- Modify: `docs/roadmap.md`

- [ ] 记录目标 Extension 类型、宿主容器尺寸、可用 Polaris/宿主组件、导航能力和交互限制。
- [ ] 建立 read-only、selectable、row action、filter、pagination/load more、error/retry 的能力矩阵。
- [ ] Extension 首期固定采用 Load More；继续保留 V1 offset pagination 作为 Admin 场景契约，不在 Extension 中混用两套分页状态。
- [ ] 明确不能依赖 URL state、Saved Views、宽屏布局和复杂弹层空间。
- [ ] 定义 compact 模式的列数、最小宽度、文本截断和操作降级规则。
- [ ] 在进入实现前完成该场景设计文档评审。

### Task 0.7.2 — Extension renderer 公共接口

**Files:**

- Create: `src/components/extension/ExtensionTable.tsx`
- Create: `src/components/extension/ExtensionTable.types.ts`
- Create: `src/components/extension/ExtensionTable.test.tsx`
- Modify: `src/index.ts`
- Modify: `src/types/table.ts` only when shared contracts need a backward-compatible extension

**Interfaces:**

- Consumes: Foundation query/schema/formatting/selection contracts。
- Produces: `ExtensionTable` 或等价独立入口，具备 `readOnly`、`compact`、可选选择和简化 action 能力。

- [ ] 不在 Admin `Table` 中添加大量 Extension 条件分支。
- [ ] 明确 Extension 组件允许的列类型、最大列数、行操作数量和交互回调。
- [ ] 默认提供只读降级路径；当宿主不支持选择或 action 时，不渲染不可用控件。
- [ ] 保证自定义 loading、empty、error 和 retry 插槽不依赖 Admin 页面布局。

### Task 0.7.3 — Extension 查询、分页和宿主上下文

**Files:**

- Create: `src/components/extension/ExtensionPagination.tsx`
- Create: `src/components/extension/ExtensionPagination.test.tsx`
- Create: `src/components/extension/extensionContext.ts`
- Create: `src/components/extension/extensionContext.test.ts`
- Modify: `src/v3/infinite.ts` only if cursor behavior is selected by the approved capability matrix

- [ ] 使用 `CursorTableQuery`、`CursorDataPage<T>` 和 `appendCursorPage` 实现 Extension 首期 Load More；不得将 cursor 字段加入 V1 `TableQuery`。
- [ ] 不把 cursor 字段混入 V1 offset `TableQuery`。
- [ ] 让宿主 locale、timezone、shop context 和 capability flags 通过显式 props/context 进入。
- [ ] 处理容器变化、请求失败、重试和无更多数据状态。
- [ ] 为只读、选择、Load More/分页和降级路径分别增加测试。

### Task 0.7.4 — Extension visual/performance validation

**Files:**

- Create: `src/stories/ExtensionTable.stories.tsx`
- Create: `website/docs/guides/app-extension-table.md`
- Create: `website/i18n/zh-CN/docusaurus-plugin-content-docs/current/guides/app-extension-table.md`
- Modify: `website/sidebars.cjs`

- [ ] 使用目标容器尺寸验证无横向溢出、操作区域不被裁剪、文本截断可理解。
- [ ] 记录首屏渲染、交互响应和典型数据量的性能基线。
- [ ] 验证键盘焦点、屏幕阅读器、只读降级和错误恢复。
- [ ] 文档明确 Extension 与 Embedded Admin 的能力差异和推荐入口。

### Task 0.7.5 — Version 0.7 release gate

- [ ] 运行完整发布门禁。
- [ ] 验证 Admin `Table` 的现有测试和构建不因 Extension renderer 引入回归。
- [ ] 验证 Extension 示例可以在目标容器限制下渲染。
- [ ] 完成 `0.7.0` 的 API、能力矩阵、迁移说明和 CHANGELOG。

---

## Version 0.8 — 高级交互与大数据量

### Version Goal

按真实性能和交互需求逐项引入高级能力，每个能力拥有独立 POC、独立验收和独立失败边界。

### Task 0.8.1 — Sticky Header / Sticky Column POC

**Files:**

- Create: `docs/superpowers/specs/2026-09-04-sticky-table-design.md`
- Modify: `src/v3/columns.ts` if offset contract requires clarification
- Create: `src/components/admin/StickyTable.tsx` only after POC approval
- Create: `src/components/admin/StickyTable.test.tsx` only after POC approval

- [ ] 验证 overflow、z-index、焦点可见性、弹层裁剪、Safari 和移动端行为。
- [ ] 验证 sticky header/column 与选择、排序、横向滚动的关系。
- [ ] POC 未通过时保留纯函数 helper，不进入稳定 UI API。

### Task 0.8.2 — Column resize / reorder POC

**Files:**

- Review/Modify: `src/v3/columns.ts`
- Modify: `src/v3/columns.test.ts`
- Create: `src/components/admin/ColumnLayoutControls.tsx` after POC approval
- Create: `src/components/admin/ColumnLayoutControls.test.tsx` after POC approval

- [ ] 验证最小/最大宽度、键盘调整、拖拽或等价排序方式。
- [ ] 验证持久化、失效列迁移、reset 和隐藏列之间的关系。
- [ ] 不破坏当前声明式 `TableColumn<T>` API；runtime layout 作为受控增强状态存在。

### Task 0.8.3 — Virtual scrolling POC

**Files:**

- Review/Modify: `src/v3/virtual.ts`
- Modify: `src/v3/virtual.test.ts`
- Create: `src/components/admin/VirtualTable.tsx` after POC approval
- Create: `src/components/admin/VirtualTable.test.tsx` after POC approval

- [ ] 确认固定行高或动态行高策略以及数据量阈值。
- [ ] 验证滚动窗口、焦点、键盘导航、选择、屏幕阅读器和动态内容。
- [ ] 记录性能基线，只有在真实数据量超过当前 IndexTable 可接受范围时进入稳定组件。

### Task 0.8.4 — Expandable row / Inline edit POC

**Files:**

- Review/Modify: `src/v3/expandable.ts`
- Review/Modify: `src/v3/inlineEdit.ts`
- Modify: `src/v3/expandable.test.ts`
- Modify: `src/v3/inlineEdit.test.ts`
- Create: `src/components/admin/ExpandableTable.tsx` after POC approval
- Create: `src/components/admin/InlineEditTable.tsx` after POC approval

- [ ] 明确展开内容生命周期、ARIA relationship、焦点回收和分页变化行为。
- [ ] 明确 inline edit 的字段 renderer、校验、保存、撤销、乐观更新和冲突恢复。
- [ ] 所有写入继续由应用执行，组件只管理受控 session 和结果状态。

### Task 0.8.5 — Cursor infinite loading POC

**Files:**

- Review/Modify: `src/v3/infinite.ts`
- Modify: `src/v3/infinite.test.ts`
- Create: `src/components/extension/CursorTable.tsx` or `src/components/admin/CursorTable.tsx` only after approved scenario

- [ ] 固定 cursor query、page response、去重和终止条件。
- [ ] 验证加载中、重复 cursor、重复 row ID、错误重试和筛选条件变化。
- [ ] 保持 cursor 模型与 V1 offset 模型隔离，不用 `total` 推导无限加载结束。

### Task 0.8.6 — Version 0.8 selective release gate

- [ ] 只发布已完成 POC、性能基线和可访问性验证的能力。
- [ ] 每个高级能力拥有独立的 opt-in API 和文档，不默认改变 V1 `Table` 行为。
- [ ] 运行完整发布门禁。
- [ ] 完成 `0.8.0` 变更记录；未进入稳定组件的 POC 只保留为内部设计和实验记录。

---

## Version 1.0 — 产品矩阵级稳定 API

### Version Goal

让多个 Embedded Admin 产品和至少一个 App Extension 依赖同一套稳定 Foundation 与明确的 renderer 边界。

### Task 1.0.1 — 公共 API 和兼容性冻结

**Files:**

- Review: `src/index.ts`
- Review: `src/types/index.ts`
- Review: `src/types/table.ts`
- Modify: `src/index.public-types.test-d.ts`
- Create: `docs/migrations/0.7-to-1.0.md`
- Modify: `CHANGELOG.md`

- [ ] 列出稳定 API、实验 API、内部 API 和弃用 API。
- [ ] 对所有 breaking change 提供迁移前后示例。
- [ ] 验证 React 18/19、Node.js 20+、Polaris 12/13/14 的支持矩阵。
- [ ] 确认 Admin 和 Extension renderer 不共享不必要的 UI 依赖。

### Task 1.0.2 — 产品矩阵接入验证

**Files:**

- Create: `docs/adoption/admin-product-matrix.md`
- Create: `docs/adoption/extension-scenarios.md`
- Modify: `website/docs/intro.md`
- Modify: `website/i18n/zh-CN/docusaurus-plugin-content-docs/current/intro.md`

- [ ] 记录至少两个 Admin 产品的接入范围、复用 API 和业务差异。
- [ ] 记录至少一个 Extension 场景的容器限制、能力降级和性能结果。
- [ ] 统计新增列表页所需业务代码、公共能力复用率和未覆盖场景。
- [ ] 将真实接入证据转化为稳定文档，而不是只依赖 Storybook mock。

### Task 1.0.3 — 生产质量与发布流程

**Files:**

- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/docs.yml`
- Modify: `package.json`
- Modify: `docs/release.md`
- Modify: `README.md`
- Modify: `README.zh-CN.md`

- [ ] 将兼容矩阵、包入口 smoke test、文档构建、Storybook 构建和 npm pack 纳入发布门禁。
- [ ] 修复 Docusaurus 已弃用配置项和 Storybook 大 chunk 等非阻断质量问题。
- [ ] 明确稳定版本、预发布版本和 breaking change 的发布规则。
- [ ] 发布 `1.0.0` 前完成 npm registry、文档站、示例和 CHANGELOG 一致性检查。

---

## Post-1.0 — Core / Renderer 拆分触发条件

此阶段不是固定版本任务，只有满足以下任一条件时才立项：

- 出现第二套实际使用的 UI renderer。
- 出现非 React 消费者，需要独立复用 Query、Schema、Selection 或 Actions。
- Polaris 大版本迁移导致现有 renderer 与 Foundation 的维护成本明显分离。
- 多个产品需要独立升级 Core 而不升级 UI renderer。

候选拆分：

```text
@standhigher/table-core
@standhigher/polaris-data-table
@standhigher/table-renderer-*
```

拆分前必须先完成包边界 RFC、依赖图、迁移方案、bundle 体积评估和双包消费者测试。

## Cross-Version Definition of Done

每个版本在进入发布前必须满足：

- 公共类型与运行时行为一致。
- 新增能力拥有单元测试和必要的 React 集成测试。
- Admin 与 Extension 场景的边界没有被隐式改变。
- 文档、Storybook、API reference 和 CHANGELOG 已同步。
- 关键安全边界仍由服务端负责校验。
- 完整命令执行成功：

```bash
npm run lint
npm test
npm run typecheck
npm run build
npm run test:package
npm run build-storybook
npm run docs:build
npm pack --dry-run --registry=https://registry.npmjs.org/
```

## Execution Rule

后续编码按照本计划的版本顺序执行：

1. 先完成 `0.5`，建立 Admin 基础交互和测试基线。
2. `0.5` 发布后，再开始 `0.6` 的 Admin 产品化能力。
3. `0.7` 必须以已评审的 Extension capability matrix 为前置条件。
4. `0.8` 的高级能力逐项立项，不因为 Roadmap 中列出就默认全部实现。
5. `1.0` 只在真实产品矩阵接入证据充分后执行。
