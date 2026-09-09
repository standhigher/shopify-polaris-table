# Polaris Data Table Versioned Development Plan

> 状态：计划阶段。本文只整理后续开发任务，不授权实现代码或发布版本。

## 基线与执行原则

- 当前发布基线为 `v0.5.0`；0.5 的 V1 稳定性工作已完成。
- 后续开发按 `0.6 → 0.7 → 0.8 → 1.0` 推进；未经明确批准，不跨版本提前实现。
- `Table` 保持受控：请求、鉴权、路由、数据库、持久化和业务错误处理仍由应用拥有。
- 所有新增公共 API 都需同步类型测试、运行时测试、Storybook、文档和 CHANGELOG。
- 所有服务端查询字段、排序、筛选 operator、selection token 和 bulk action 必须由服务端校验。

| 版本 | 状态 | 目标 | 开始条件 |
| --- | --- | --- | --- |
| `0.5` | 已发布 | V1 Admin Table 稳定性 | 已于 `v0.5.0` 完成 |
| `0.6` | 下一版本 | Admin Experience 产品化 | 确认至少两个目标 Admin 页面 |
| `0.7` | 后续版本 | Extension-safe MVP | 评审通过 Extension 能力矩阵 |
| `0.8` | 按需立项 | 高级交互与大数据量 | 有真实场景与性能证据 |
| `1.0` | 条件版本 | 产品矩阵级稳定 API | 完成多产品接入验证 |

## Version 0.6 — Admin Experience 产品化

**版本目标：** 让多个 Embedded Admin 页面可复用同一套列配置、查询状态、视图、Preset 和文案配置。

### 0.6.1 受控列可见性与 schema migration（已完成，`v0.6.0`）

- [x] 定义 `Table` 的受控列可见性 API（`visibleColumnKeys`、变更回调及必需列约束）。
- [x] 实现列隐藏、恢复、重置与 schema 变更后的 key reconcile 规则。
- [x] 确认隐藏列不会参与 heading、cell、排序索引和可访问性结构。
- [x] 覆盖状态迁移、全部隐藏防护和键盘操作，并增加 Storybook 场景。

**完成条件：** API 与已有 visible-columns helper 保持兼容；默认行为不改变；包含迁移和无障碍验证方案。

### 0.6.2 URL Query State 集成边界

- [ ] 固定 URL 参数版本，以及 page、pageSize、search、sort、filter 的编解码规则。
- [ ] 明确非法 JSON、非法页码/页大小、未 allowlist 字段和敏感筛选字段的降级行为。
- [ ] 编写与 Router 无关的接入示例，只描述应用路由层如何控制 `TableQuery`。
- [ ] 补充前进、后退、刷新和 schema 变化时的恢复验收场景。

**完成条件：** URL helper 不引入 Router 依赖；所有解码结果在发请求前仍需要应用侧 allowlist 校验。

### 0.6.3 Saved Views 与 Filter Presets 交互层

- [ ] 定义 Saved View 列表、切换、创建、重命名、删除及默认视图的受控交互契约。
- [ ] 定义 pending、权限不足、冲突、stale write、删除当前视图和失效列 key 的状态处理。
- [ ] 设计 Filter Preset 的展示和应用流程，并保证其仅修改 filters 且重置 page。
- [ ] 明确 repository 负责持久化、授权、唯一性和冲突响应，组件不得隐含后端策略。

**完成条件：** Saved View 与 Filter Preset 的边界清晰；有完整状态矩阵和两个典型页面的接入方案。

### 0.6.4 国际化、formatter 与领域 presets

- [ ] 建立内置 UI 文案的覆盖边界，覆盖 table state、pagination、selection、views 和 presets。
- [ ] 统一 status、money、datetime formatter 的覆盖优先级与 locale/timezone 传递规则。
- [ ] 审核 Product、Order、Customer、Campaign、Offer presets，保证只承载最小行模型和可覆盖列定义。
- [ ] 以至少两个真实页面存在重复列为前提，决定是否新增领域 preset。

**完成条件：** 文案与 formatter 可由应用控制；preset 不包含请求、权限或私有业务流程。

### 0.6.5 Admin 接入验证与发布门禁

- [ ] 选定并记录至少两个 Admin 页面，逐项验证查询、列状态、URL 恢复、视图和权限边界。
- [ ] 为错误、并发写入、刷新、前进/后退及 schema 变化建立回归矩阵。
- [ ] 完成 API 文档、Storybook、迁移说明和 CHANGELOG 草案。
- [ ] 在实现完成后运行完整发布门禁，并准备 `0.6.0` 的包内容检查。

**版本退出条件：** 两个页面使用同一基础 API，且没有因 views 或 presets 导致 `Table` 的既有行为回归。

## Version 0.7 — Extension-safe MVP

**版本目标：** 以独立 renderer 为 App Extensions 提供紧凑、可靠并可安全降级的列表体验。

### 0.7.1 Extension 场景与能力矩阵（实现前置）

- [ ] 确认目标 Extension 类型、宿主容器尺寸、可用 Polaris/宿主组件、导航能力和交互限制。
- [ ] 记录 read-only、选择、行操作、筛选、分页/Load More、错误与重试的能力矩阵。
- [ ] 固定首期分页方案；若选择 Load More，明确 cursor 契约与 V1 offset query 的隔离。
- [ ] 规定紧凑模式的最大列数、最小宽度、截断规则和只读降级路径。

**完成条件：** 能力矩阵经评审通过，且明确不依赖 URL state、Saved Views、宽屏布局或复杂弹层。

### 0.7.2 独立 Extension renderer 契约

- [ ] 设计独立 `ExtensionTable`（或等价入口）的 props、允许列类型和回调边界。
- [ ] 定义 `readOnly`、`compact`、单行选择与简化 action 的可组合规则。
- [ ] 设计 loading、empty、error、retry 插槽，避免耦合 Admin 页面布局。
- [ ] 列出宿主不支持选择或操作时不渲染控件的降级测试。

**完成条件：** 不向 Admin `Table` 添加 Extension 条件分支；Foundation 契约复用但 UI 依赖独立。

### 0.7.3 查询、上下文与验证

- [ ] 明确 host locale、timezone、shop context 和 capability flags 的显式传递方式。
- [ ] 设计容器变化、请求失败、重试、无更多数据及 query 变化时的状态行为。
- [ ] 定义目标容器的视觉验证、首屏/交互性能基线和可访问性检查方式。
- [ ] 准备独立 Storybook 示例、能力差异文档和受限场景使用指南。

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

- [ ] 为每个获批 POC 单独创建设计记录、验收指标和失败/回滚方案。
- [ ] 为每个进入稳定 API 的能力提供独立 opt-in API、测试、Storybook 和文档。
- [ ] 只发布完成性能及可访问性验证的能力；未达标 POC 保留为实验记录。

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
