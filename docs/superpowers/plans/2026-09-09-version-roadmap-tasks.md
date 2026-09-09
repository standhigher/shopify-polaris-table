# Polaris Data Table Versioned Development Plan

> 状态：计划阶段。本文只整理后续开发任务，不授权实现代码或发布版本。

## 基线与执行原则

- 当前发布基线为 `v0.7.0`；0.5 的 V1 稳定性工作与 0.6.x 的部分能力已完成。
- 后续开发按 `0.6.x → 0.7.x → 0.8 → 1.0` 推进。`0.6.x` 与 `0.7.x` 是连续开发跟进，不将每项能力绑定到单独的小版本发布。
- `Table` 保持受控：请求、鉴权、路由、数据库、持久化和业务错误处理仍由应用拥有。
- 所有新增公共 API 都需同步类型测试、运行时测试、Storybook、文档和 CHANGELOG。
- 所有服务端查询字段、排序、筛选 operator、selection token 和 bulk action 必须由服务端校验。

| 版本 | 状态 | 目标 | 开始条件 |
| --- | --- | --- | --- |
| `0.5` | 已发布 | V1 Admin Table 稳定性 | 已于 `v0.5.0` 完成 |
| `0.6.x` | 进行中（`v0.6.1` 已发布） | Admin Experience 产品化 | 确认至少两个目标 Admin 页面 |
| `0.7.x` | 进行中（`v0.7.0` 已发布） | Extension-safe MVP | 评审通过 Extension 能力矩阵 |
| `0.8` | 按需立项 | 高级交互与大数据量 | 有真实场景与性能证据 |
| `1.0` | 条件版本 | 产品矩阵级稳定 API | 完成多产品接入验证 |

## Development Track 0.6.x — Admin Experience 产品化

**跟进目标：** 让多个 Embedded Admin 页面可复用同一套列配置、查询状态、视图、Preset 和文案配置。能力可在适当时机随任意 `0.6.x` 补丁版本发布，不以原来的 0.6.1、0.6.2 等任务编号拆分版本。

### 开发清单

**已完成并已发布于 `v0.6.0`：受控列显隐与 schema migration**

- [x] 定义 `Table` 的受控列可见性 API（`visibleColumnKeys`、变更回调及必需列约束）。
- [x] 实现列隐藏、恢复、重置与 schema 变更后的 key reconcile 规则。
- [x] 确认隐藏列不会参与 heading、cell、排序索引和可访问性结构。
- [x] 覆盖状态迁移、全部隐藏防护和键盘操作，并增加 Storybook 场景。

**已完成并已发布于 `v0.6.1`：URL Query State 集成边界**

- [x] 固定 URL 参数版本，以及 page、pageSize、search、sort、filter 的编解码规则。
- [x] 明确非法 JSON、非法页码/页大小、未 allowlist 字段和敏感筛选字段的降级行为。
- [x] 编写与 Router 无关的接入示例，只描述应用路由层如何控制 `TableQuery`。
- [x] 补充前进、后退、刷新和 schema 变化时的恢复验收场景。

**已完成基础组件，待完成真实页面验证：Saved Views 与 Filter Presets 交互层**

- [x] 定义 Saved View 列表、切换、创建、重命名和删除的受控交互契约。
- [ ] 定义默认视图的持久化契约与应用层恢复时机。
- [ ] 定义 pending、权限不足、冲突、stale write、删除当前视图和失效列 key 的状态处理。
- [x] 设计 Filter Preset 的展示和应用流程，并保证其仅修改 filters 且重置 page。
- [x] 明确 repository 负责持久化、授权、唯一性和冲突响应，组件不得隐含后端策略。

**已完成基础覆盖，待完成领域验证：国际化、formatter 与领域 presets**

- [x] 建立内置 Table UI 文案的覆盖边界；views 和 presets 文案由各受控组件独立覆盖。
- [x] 统一 status、money、datetime formatter 的覆盖优先级与 locale/timezone 传递规则。
- [ ] 审核 Product、Order、Customer、Campaign、Offer presets，保证只承载最小行模型和可覆盖列定义。
- [ ] 以至少两个真实页面存在重复列为前提，决定是否新增领域 preset。

**待跟进：Admin 接入验证与发布门禁**

- [ ] 选定并记录至少两个 Admin 页面，逐项验证查询、列状态、URL 恢复、视图和权限边界。
- [ ] 为错误、并发写入、刷新、前进/后退及 schema 变化建立回归矩阵。
- [ ] 完成 API 文档、Storybook、迁移说明和 CHANGELOG 草案。
- [ ] 在实现完成后运行完整发布门禁，并准备下一个 `0.6.x` 的包内容检查。

**版本退出条件：** 两个页面使用同一基础 API，且没有因 views 或 presets 导致 `Table` 的既有行为回归。

## Development Track 0.7.x — Extension-safe MVP

**跟进目标：** 以独立 renderer 为 App Extensions 提供紧凑、可靠并可安全降级的列表体验。该系列也采用一个连续开发跟进，不将能力拆分为预设的小版本。

**首批能力已发布于 `v0.7.0`：** 独立 `ExtensionTable`、三列紧凑布局、Load More 边界、显式 host context/capabilities 和受控状态槽。

### 开发清单

**实现前置：Extension 场景与能力矩阵**

- [ ] 确认目标 Extension 类型、宿主容器尺寸、可用 Polaris/宿主组件、导航能力和交互限制。
- [x] 记录 read-only、选择、行操作、分页/Load More、错误与重试的基础能力矩阵；筛选暂不进入首期 renderer。
- [x] 固定首期为 Load More；cursor 由宿主拥有，并与 V1 offset `TableQuery` 严格隔离。
- [x] 规定紧凑模式最多三列，使用最小宽度与换行规则避免横向溢出，并提供只读降级路径。

**待跟进：独立 Extension renderer 契约**

- [x] 设计独立 `ExtensionTable` 的 props、允许列类型和回调边界。
- [x] 定义 `readOnly`、`compact`、单行选择与单个简化 action 的可组合规则。
- [x] 设计 loading、empty、error、retry 插槽，避免耦合 Admin 页面布局。
- [x] 覆盖宿主不支持选择、操作或 Load More 时不渲染控件的降级测试。

**待跟进：查询、上下文与验证**

- [x] 明确 host locale、timezone、shop context 和 capability flags 的显式传递方式。
- [x] 设计请求失败、重试、无更多数据与 action/Load More 失败时的状态行为；renderer 不接受 V1 query。
- [ ] 定义目标容器的视觉验证、首屏/交互性能基线和可访问性检查方式。
- [x] 准备独立 Storybook 示例、能力差异文档和受限场景使用指南。

**版本退出条件：** 目标容器中无横向溢出；只读、选择、操作失败和重试均有独立测试与降级方案。

## Version 0.8 — 高级交互与大数据量

**版本目标：** 仅将通过独立 POC 的能力变为稳定 API，不将候选能力打包承诺发布。

每个候选能力都应按以下顺序立项：需求证据 → 设计/RFC → POC → 性能与无障碍验证 → opt-in API → 文档与发布。

| 候选任务 | POC 重点 | 进入稳定 API 的条件 |
| --- | --- | --- |
| 0.8.1 Sticky header / column | overflow、z-index、Safari、移动端、焦点与弹层裁剪 | 与选择、排序、横向滚动兼容 |
| 0.8.2 Column resize / reorder | 最小/最大宽度、键盘、持久化、失效列迁移 | 不破坏声明式 `TableColumn` API |
| 0.8.3 Virtual scrolling | 行高策略、窗口、焦点、读屏与动态内容 | 真实数据量超过现有 IndexTable 性能阈值 |
| 0.8.4 Expandable row / inline edit | ARIA、焦点回收、校验、冲突与撤销 | 写入仍完全由应用控制 |
| 0.8.5 Cursor infinite loading | cursor 协议、去重、终止、失败恢复 | 与 V1 offset 模型严格隔离 |

- [x] 为当前五个获批 POC 单独创建设计记录、验收指标和失败/回滚方案。
- [ ] 为每个进入稳定 API 的能力提供独立 opt-in API、测试、Storybook 和文档。
- [ ] 只发布完成性能及可访问性验证的能力；未达标 POC 保留为实验记录。

**进行中：Virtual scrolling POC（不公开发布）**

- [x] 建立固定行高、非交互列表的内部 POC，复用现有 virtual-window helper，且不改变 V1 `Table`。
- [x] 记录验收指标、浏览器/目标容器待验证项、失败条件与回滚方案，见 [`2026-09-09-v0.8-virtual-scroll-poc.md`](2026-09-09-v0.8-virtual-scroll-poc.md)。
- [x] 增加 10,000 行窗口渲染与滚动替换测试，以及明确标注为实验性的 Storybook 场景。
- [ ] 在 Safari、Chrome 和真实嵌入容器记录性能、焦点与读屏结果；通过前不得将 POC 从公共入口导出。

**进行中：Sticky header / column POC（不公开发布）**

- [x] 建立固定列宽的内部 sticky renderer，复用 column-layout offset helper，且不改变 V1 `Table`。
- [x] 记录堆叠层级、Safari/RTL/浮层风险、验收指标与回滚方案，见 [`2026-09-09-v0.8-sticky-columns-poc.md`](2026-09-09-v0.8-sticky-columns-poc.md)。
- [x] 增加 start/end offset 和 header 堆叠的 React 测试，以及实验性 Storybook 场景。
- [ ] 在 Chrome、Safari 和真实嵌入容器验证横向/纵向滚动、焦点、RTL、popover 裁剪和行选择/排序兼容性；通过前不得将 POC 从公共入口导出。

**进行中：Column resize / reorder POC（不公开发布）**

- [x] 建立受控布局 renderer，使用既有 column-layout helper 完成受限宽度调整与显式顺序调整，且不改变 V1 `Table`。
- [x] 记录持久化/失效列的风险、验收指标与回滚方案，见 [`2026-09-09-v0.8-column-layout-poc.md`](2026-09-09-v0.8-column-layout-poc.md)。
- [x] 增加受控宽度、键盘重排和边界属性的 React 测试，以及实验性 Storybook 场景。
- [ ] 在 Chrome、Safari 和真实嵌入容器验证缩放、RTL、触控、焦点、持久化迁移以及与 sticky/virtual renderer 的组合；通过前不得将 POC 从公共入口导出。

**进行中：Expandable row / inline edit POC（不公开发布）**

- [x] 建立受控展开与版本化单字段编辑 renderer，且不在组件内写入 canonical rows 或改变 V1 `Table`。
- [x] 记录写入边界、校验、冲突、取消、焦点与回滚方案，见 [`2026-09-09-v0.8-expandable-inline-edit-poc.md`](2026-09-09-v0.8-expandable-inline-edit-poc.md)。
- [x] 增加受控展开、焦点、校验、取消、版本化保存和冲突的 React 测试，以及实验性 Storybook 场景。
- [ ] 在 Chrome、Safari 和真实嵌入容器验证键盘、读屏、焦点恢复、授权/持久化、异步竞态与多字段组合；通过前不得将 POC 从公共入口导出。

**进行中：Cursor infinite loading POC（不公开发布）**

- [x] 建立独立的 V3 cursor “Load more” renderer，验证去重、终止与失败重试，且不混入 V1 offset `TableQuery`。
- [x] 记录 cursor 排序、失败恢复、无障碍状态与回滚方案，见 [`2026-09-09-v0.8-cursor-infinite-poc.md`](2026-09-09-v0.8-cursor-infinite-poc.md)。
- [x] 增加 cursor query 隔离、去重、终止、失败重试和状态宣告的 React 测试，以及实验性 Storybook 场景。
- [ ] 在 Chrome、Safari 和真实嵌入容器验证慢网、取消、重复触发、读屏播报与服务端 cursor 稳定排序；通过前不得将 POC 从公共入口导出。

**版本退出条件：** 已发布能力均有真实场景证据，且不默认改变 V1 `Table` 行为。

## Version 1.0 — 产品矩阵级稳定 API

**版本目标：** 让多个 Embedded Admin 产品与至少一个 Extension 场景依赖相同 Foundation 和稳定 renderer 边界。

### 1.0.1 API、兼容性与迁移冻结

- [ ] 列出稳定、实验、内部和弃用 API，并定义弃用周期。
- [ ] 为每个 breaking change 准备迁移前后示例和迁移文档。
- [ ] 验证 React 18/19、Node.js 20+、Polaris 12/13/14 的兼容矩阵。
- [ ] 确认 Admin 与 Extension 不共享不必要的 UI 依赖。

### 1.0.2 产品矩阵接入证据

- [ ] 记录至少两个 Admin 产品的接入范围、复用 API、差异及收益。
- [ ] 记录至少一个 Extension 场景的容器限制、能力降级和性能结果。
- [ ] 汇总新增列表页业务代码、公共能力复用率和剩余空白场景。

### 1.0.3 生产质量与发布

- [ ] 完成 CI、发布流程、文档站、Storybook、包入口与 npm 包内容的一致性审查。
- [ ] 明确稳定版、预发布版和 breaking change 的发布规则。
- [ ] 仅在上述接入和兼容性证据齐备时，准备 `1.0.0` 发布。

**版本退出条件：** 真实接入证据充分、公共 API 冻结、迁移路径清晰且完整发布门禁通过。

## 跨版本完成定义

- [ ] 公共类型、运行时行为、测试和文档一致。
- [ ] 新能力具有单元测试及必要的 React 集成测试。
- [ ] Storybook、API reference、中英文文档与 CHANGELOG 已同步。
- [ ] Admin 与 Extension 的边界未被隐式改变。
- [ ] 发布前通过 lint、test、typecheck、build、package test、Storybook、docs build 和 pack dry-run。

## 历史记录

`0.5` 的原始任务拆分保留在 [`2026-09-04-shopify-app-table-version-roadmap.md`](2026-09-04-shopify-app-table-version-roadmap.md)，用于追溯已发布的稳定性工作；它不再是当前待办清单。
