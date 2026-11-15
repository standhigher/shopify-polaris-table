# P5 高级能力与页面状态验收记录

状态：P5 编码、自动化门禁和基础真实 Runtime 验收完成；不进入 P6，不发布 npm。

真实 Runtime 证据：[initial skeleton](<p5-skeleton.png>)。

## 已实现

- `TableSkeleton`：首次 data=[] + loading 时使用 native `s-table`/`s-box` skeleton，有限 rowCount，`role=status`，不臆造 `s-skeleton`。
- 后台 refresh：旧 data 保留，`s-table.loading=true`，不替换为 skeleton；selection/pagination/filter 交互禁用。
- Error：旧 data 保留并显示 `s-banner` + secondary Retry；空 data 时只显示 Error/Retry，不和 Empty 混合。
- Empty：默认使用 `s-empty-state`，custom `emptyState` 和 ReactNode 文案优先；不渲染空 table/pagination。
- Column Visibility：required keys 正确 disabled，至少保留一列，schema stale/duplicate/reconcile，Popover 内层滚动和 rich title fallback。
- Filter Presets：保持 filter-only/page=1 语义、search/sort/pageSize 不变、preset filter 数据不被 mutate。
- Saved Views：Repository manager 保留 updatedAt/global stale-write 语义；list 纳入 pending；stale list/write success/error 不污染当前状态；observer 异常隔离；UI 受控 snapshot、同步锁、stale result suppression、Retry/Reload。

## 自动化验证

- Table page state / skeleton / error / empty：新增 TablePageState 与 TableState tests。
- Column Visibility / visible columns：focused 15 tests。
- Filter Presets：3 tests。
- Saved Views manager：10 tests；TableViews UI：8 tests。
- P5 focused：38 tests通过。
- 最终完整 suite：41 files / 238 tests 通过。
- TypeScript、ESLint、Build、compatibility、React19 package consumer、Extension consumer、Storybook build、pack dry-run 全部通过。
- package consumer 增加 TableSkeleton strict type 与 SSR markup 检查。

## Storybook / Runtime

新增 [Advanced Lifecycle Story](<../../src/stories/AdvancedLifecycle.stories.tsx>)，覆盖：

- ready
- initial loading skeleton
- refresh with old rows
- empty
- error with no rows
- error with old rows
- Retry
- column schema add/remove
- controlled visibility/required column
- Filter Presets
- Saved Views create/update/delete/reload
- permission/conflict repository errors
- query search/filter/sort/page slice

真实 Runtime 已在 fixed Polaris2 iframe 验证 skeleton、empty-state、error retry、Popover focus/Escape、Saved Views create/rename/delete/permission Retry/conflict Reload、Preset filter application 和 schema visibility；完整跨浏览器/axe/BestSourcing 属于 P6。

## 约束

- 不引入 fetch/router/auth/cache。
- Repository 仍由宿主负责权限、唯一性、冲突和持久化。
- accepted bulk operation 不轮询；P4 contract 不扩展。
