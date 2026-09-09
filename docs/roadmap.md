# Polaris Data Table Roadmap

本文档描述 `@standhigher/polaris-data-table` 面向 Shopify App 产品矩阵的产品定位、当前能力、后续迭代和长期演进方向。

当前仓库版本：`v1.1.0`

> 本文档中的版本号是建议的里程碑，不代表已经承诺的发布日期。每个阶段都应以真实业务接入、兼容性验证和验收结果为准。

按版本拆分的现行开发任务见 [`docs/superpowers/plans/2026-09-09-version-roadmap-tasks.md`](superpowers/plans/2026-09-09-version-roadmap-tasks.md)。0.5 的原始任务拆分保留为[历史记录](superpowers/plans/2026-09-04-shopify-app-table-version-roadmap.md)；其稳定性工作已随 `v0.5.0` 发布完成，后续迭代从 0.6 开始。

## 1. 产品定位

`@standhigher/polaris-data-table` 不是一个独立的数据请求客户端，也不是追求覆盖所有场景的通用 Data Grid。它定位为：

> 面向 Shopify App 产品矩阵的列表与数据操作基础设施，重点服务嵌入式 Admin 应用，同时覆盖 App Extensions 的受限场景。

产品需要同时满足两类使用方式：

| 场景 | 目标 | 主要能力 |
| --- | --- | --- |
| Embedded Admin App | 支撑完整的管理后台列表页和运营工作流 | 查询、筛选、排序、分页、选择、批量操作、Saved Views、列配置 |
| App Extensions | 在受限容器和有限交互中提供可靠的数据列表 | 紧凑布局、只读/可选模式、简化查询、Load More、宿主上下文、能力降级 |

两类场景共享数据契约和状态模型，但不强制共享同一套 UI 组件。

## 2. 产品架构方向

长期建议按三层组织能力：

```text
Table Foundation
├── Schema / Query / Filters
├── Formatting contracts
├── Selection / Bulk Actions
└── Loading / Error / Empty state

Admin Experience
├── 完整 Polaris Admin Table
├── 复杂筛选和分页
├── Saved Views / Presets
└── 批量运营和高级编辑

Extension Experience
├── Compact Table
├── Read-only / Selectable Table
├── 简化筛选和分页
└── 受限环境下的降级策略
```

核心原则：

1. 通用数据行为进入 Foundation。
2. Admin 和 Extension 的界面体验由各自 renderer 负责。
3. 应用继续拥有请求、鉴权、路由、持久化和业务错误处理。
4. 复杂能力先做独立 POC，再进入稳定组件。

## 3. 当前能力基线

### 3.1 已可使用的 V1 基础能力

当前稳定入口是受控的 `Table` 组件，代码见 [`src/components/Table/Table.tsx`](../src/components/Table/Table.tsx)。

已支持：

- 泛型行数据和稳定 `rowId`
- Polaris `IndexTable` 渲染
- text、number、money、status、datetime、image、actions、custom 列
- 服务端驱动的 one-based offset pagination
- 搜索、排序和结构化筛选
- loading、error、empty 状态
- 当前页选择
- 服务端 token 驱动的跨页全选
- 行操作和批量操作
- 批量操作幂等键
- locale、currency、timezone 显式格式化

查询和公共类型见 [`src/types/table.ts`](../src/types/table.ts) 与 [`src/hooks/useTableQuery.ts`](../src/hooks/useTableQuery.ts)。

### 3.2 已完成基础实现的 V2 能力

当前已经提供应用侧 helper，但部分能力还没有完全进入 `Table` UI：

- URL query 编解码和 filter allowlist
- 敏感筛选字段排除
- visible column key 清理和 schema reconcile
- Filter Preset
- Saved View repository contract
- Saved View CRUD manager 和 stale write 保护
- formatter preset
- Product、Order、Customer、Campaign、Offer 列 preset

这些能力故意不绑定 Router、数据库、请求客户端或权限系统。

### 3.3 V3/V4 当前状态

V3 和 V4 当前主要是纯函数状态原语与架构契约，不应视为已经完成的高级 UI 组件：

- cursor/infinite loading 状态
- virtual window 计算
- 列宽、列顺序、列可见性和 sticky offset
- expandable row 状态
- inline edit session、校验和冲突状态
- UI 无关的 Core Schema 和 Core Query
- Polaris renderer adapter contract

相关实现见 [`src/v3`](../src/v3)、[`src/core`](../src/core) 和 [`src/adapters/polaris.ts`](../src/adapters/polaris.ts)。

## 4. 当前主要缺口

`v0.5.0` 已完成 V1 行为闭环，包括 date-range 部分范围输入、definition-driven filter operator allowlist、行操作与行选择隔离、Actions 列结构、ReactNode action content 保留、批量操作及 selection token 反馈，以及受控状态文案。详见 [`CHANGELOG.md`](../CHANGELOG.md)。

以下剩余问题应优先于新增复杂能力：

### Admin 产品化

- `Table` 的受控 visible columns、必需列保护、schema reconcile 和列配置控件已随 `v0.6.0` 发布
- Saved Views 和 Filter Presets 目前主要是底层协议，不是完整交互模块
- UI 文案国际化配置不足
- status、image、error 等 renderer 还需要更完整的 Polaris 体验
- 页面越界、操作失败、并发刷新等边界状态需要统一处理

### Extension 适配

- 当前主组件以 Polaris `IndexTable` 为核心，偏向完整 Admin 页面
- 尚无明确的 compact/read-only/extension-safe renderer
- 尚无 Extension 场景的尺寸、性能、能力降级和宿主上下文契约

## 5. Roadmap

### Milestone 0.5：V1 基础稳定性（已完成，`v0.5.0`）

已实现目标：让 Admin Table 的核心交互形成完整、可预期的闭环。

已完成工作：

- 完整实现 date-range filter
- 统一执行 filter operator allowlist
- 修复行操作与行选择的事件隔离
- 补齐 Actions heading 和列结构
- 增加批量操作 pending、success、partial failure、accepted、error 状态
- 保留 action content 的 ReactNode 能力
- 增加 selection token 过期和无效处理
- 统一错误、重试、空态和页面越界行为
- 增加键盘操作、屏幕阅读器和真实 Polaris DOM 测试

验收结果：

- Product、Order、Customer 三类典型列表可以接入
- 查询、选择、行操作和批量操作不会互相误触发
- 批量操作的所有返回分支都有明确 UI 或回调结果
- 核心交互具备单测、集成测试和可访问性断言

### Milestone 0.6.x：Admin Experience 产品化

目标：支持多个 Shopify App 产品复用同一套 Admin 列表基础设施。

0.6.x 作为一个连续开发跟进管理；每项能力不再预先对应独立的小版本，按完成度与兼容性决定补丁发布节奏。

重点工作：

- 已完成：将 `visibleColumnKeys` / `onVisibleColumnsChange` 接入 `Table`
- 增加列显示/隐藏、列重置和 schema migration 体验
- 已完成并发布于 `v0.6.1`：URL query 与路由层的接入示例
- 已完成基础组件：Saved Views 的切换、创建、重命名、保存与删除流程
- 已完成基础组件：Filter Presets 的展示和仅筛选条件应用流程
- 已完成基础覆盖：内置 Table UI 文案和 formatter preset 的 override 约定
- 明确业务动作的确认、审计、权限和异步 operation 接入规范

验收标准：

- 至少两个实际产品页面使用相同的基础 API
- 页面刷新、前进、后退可以恢复查询和列状态
- Saved View 在权限、冲突、删除当前视图和 schema 变化下行为明确
- 通用 Table 不因 preset 或视图能力发生行为回归

### Milestone 0.7.x：Extension-safe MVP

目标：为 App Extensions 提供受限但可靠的列表能力。

0.7.x 同样作为一个连续开发跟进管理；先完成能力矩阵和独立 renderer 边界，再按验证结果安排发布。

`ExtensionTable` 已随 `v0.7.0` 发布：它最多渲染三列，使用与 V1 offset query 隔离的 Load More 契约，并通过显式宿主 capabilities 对只读、单选、行操作和加载能力进行安全降级。真实 Extension 容器的视觉、性能与可访问性基线仍待验证。

建议新增独立的 Extension renderer 或组件入口，避免在 Admin `Table` 中累积大量场景判断。

首期范围：

- `readOnly` 模式
- `compact` 模式
- 可选的单行选择
- 单行点击和简化 action
- 少量核心列
- 简化筛选
- 分页或 Load More 二选一
- 自定义 loading、empty、error 插槽
- locale、timezone、宿主上下文透传
- 无法使用复杂能力时自动降级为只读

Extension 需要明确不包含的能力：

- 默认不启用 Saved Views
- 默认不依赖 URL state
- 不要求完整的跨页 ID 下载
- 不假设存在宽屏、长列表或复杂弹层空间

验收标准：

- 在目标 Extension 容器尺寸下无横向溢出和布局破坏
- 首屏渲染和交互性能有基线
- 受限环境缺少某项能力时可以安全降级
- 只读、选择、操作失败和重试均有独立测试

### Milestone 0.8：大数据量与高级交互

目标：按真实业务需求逐项增强，不把所有复杂能力捆绑发布。

五项候选能力已随 `v0.8.0` 以内部 POC 形式记录（不从包入口导出，也不改变 `Table` 的默认渲染）。Chrome 和 Safari 的本地 Storybook 核心交互已验证；辅助技术、真实嵌入容器、性能 trace 与服务端契约仍须通过后才可评审公共 API。统一状态见 [`docs/superpowers/plans/2026-09-09-v0.8-poc-validation-matrix.md`](superpowers/plans/2026-09-09-v0.8-poc-validation-matrix.md)。

候选能力：

1. sticky header / sticky column
2. resize column
3. reorder column
4. virtual scrolling
5. expandable row
6. inline edit
7. cursor infinite loading

每项能力进入开发前必须完成独立 POC，明确：

- Polaris 兼容方式
- Safari 和移动端行为
- 键盘和屏幕阅读器语义
- 选择、焦点和动态高度处理
- 服务端协议与失败恢复
- 性能基线和数据量上限

各 POC 的独立范围、失败条件与回滚方案分别见 [`Virtual scrolling`](superpowers/plans/2026-09-09-v0.8-virtual-scroll-poc.md)、[`Sticky header / column`](superpowers/plans/2026-09-09-v0.8-sticky-columns-poc.md)、[`Column resize / reorder`](superpowers/plans/2026-09-09-v0.8-column-layout-poc.md)、[`Expandable row / inline edit`](superpowers/plans/2026-09-09-v0.8-expandable-inline-edit-poc.md) 和 [`Cursor infinite loading`](superpowers/plans/2026-09-09-v0.8-cursor-infinite-poc.md)。

### Milestone 1.0：产品矩阵级稳定 API

`v1.0.0` 已发布 API 稳定性基线。真实多产品接入与 Extension 容器证据仍作为 1.x 持续验证项，不会将内部 0.8 POC 提升为公共 API。

进入 1.0 前建议满足：

- V1 公共类型和行为已稳定
- 至少两个 Embedded Admin 产品真实接入
- 至少一个 App Extension 场景验证
- Polaris 12、13 兼容矩阵明确
- React 18 验证完成（Polaris React 12/13 的 peer dependency 不支持 React 19）
- Admin 与 Extension renderer 边界稳定
- 重大 breaking change 有迁移文档
- 关键交互具备视觉、可访问性和包入口测试

### Post-1.0：Core 与 renderer 拆分

只有在出现第二套 renderer、非 React 消费者或明确的 Polaris 大版本迁移需求后，再考虑拆分为：

```text
@standhigher/table-core
@standhigher/polaris-data-table
@standhigher/table-renderer-*
```

在此之前，优先在单仓库中保持清晰目录边界：

```text
src/core/
src/components/admin/
src/components/extension/
src/adapters/
src/presets/
```

## 6. 版本与发布策略

- `0.x`：允许快速补齐行为，但每次变更必须记录公共 API 影响
- `0.5`：已完成 V1 交互闭环（`v0.5.0`）
- `0.6.x`：连续提升 Admin 产品复用效率
- `0.7.x`：连续交付 Extension-safe 最小能力
- `0.8`：按业务证据推进性能和复杂交互
- `1.0`：冻结稳定公共 API

每次发布至少执行：

```bash
npm run lint
npm test
npm run typecheck
npm run build
npm run test:package
npm run docs:build
npm pack --dry-run --registry=https://registry.npmjs.org/
```

## 7. 暂不做事项

当前阶段暂不建议：

- 在 Table 内置 fetch、缓存、鉴权或具体 API client
- 把 Router、数据库或 Saved View 存储做成硬依赖
- 在没有真实需求前实现完整通用 Data Grid
- 在没有第二 renderer 前过早拆分 npm workspace
- 用 offset query 伪装 cursor infinite loading
- 用前端全量 ID 模拟跨页全选
- 为了支持 Extension 在 Admin 组件中加入大量不可组合的条件分支

## 8. 需要持续确认的产品决策

随着产品矩阵接入，需要持续明确：

1. 各产品允许公开的查询字段、排序字段和筛选 operator。
2. Product、Order、Customer 等资源的统一行模型和币种字段。
3. 批量动作的确认、审批、审计、异步处理和幂等策略。
4. App Extension 的目标容器、最大尺寸和可用交互能力。
5. Admin 与 Extension 是否需要不同的品牌主题、文案和 renderer。
6. 哪些能力属于 Foundation，哪些能力属于具体产品 preset。

## 9. 成功指标

Roadmap 的最终验证不以导出 API 数量为准，而以产品矩阵复用效果为准：

- 新增一个 Admin 列表页面所需的业务代码持续减少
- 多个产品使用一致的查询、选择和批量操作语义
- App Extension 可以在受限环境下稳定提供核心数据操作
- Polaris 升级不会迫使所有业务页面同步重写
- 复杂能力具备明确的启用条件、性能边界和降级方案
