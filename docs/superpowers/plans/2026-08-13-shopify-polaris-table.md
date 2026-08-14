# Shopify Polaris Table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建 `@standhigher/shopify-polaris-table`，让 Shopify Embedded Admin App 通过声明式列定义、查询状态和操作配置完成符合 Polaris 规范的数据列表页。

**Architecture:** 以 `@shopify/polaris` 的 `IndexTable` / `IndexFilters` 为渲染底座，组件库只负责把通用的 `TableColumn<T>`、`TableQuery` 和状态/操作配置转换成 Polaris 组件参数。V1 不持有远程数据请求：外部受控传入 `data`、`loading`、`error`、`query` 和 `onQueryChange`，从而适配 Shopify API、BFF 或任意服务端。查询一律采用 offset pagination；跨页全选通过服务端签发、绑定查询快照的 selection token 实现。格式化、筛选、选择和分页拆成独立模块，业务 Preset 在 V2 再建立在稳定的通用 API 之上。

**Tech Stack:** React、TypeScript、`@shopify/polaris`、测试框架（Task 1 选定）、包构建工具（Task 1 选定）。

---

## 方案边界与前置决策

- 本计划按技术方案拆为 V1 可交付、V2 增强、V3/V4 需求驱动的后续任务；不把所有远期能力一次性塞入首个版本。
- 当前仓库只有空 Git 初始化，尚不存在 `package.json`、源码、测试或既有组件规范。因此路径均是建议的新建路径；Task 1 完成后需将工具链与实际脚手架对齐。
- 已确认：V1 使用 offset pagination；`TableQuery.page` 从 1 开始，服务端响应的 `total` 是匹配当前 query 的总条数。
- 已确认：筛选值、币种/时区、跨页选择与批量操作的默认协议采用下文「V1 已确认契约」。实际 BFF/API 必须实现这些契约或由 consuming app adapter 做等价转换；Table 本身不直接请求任何 endpoint。

## V1 已确认契约

### 筛选值协议

`query.filters` 必须是可 JSON 序列化的、按字段名索引的条件对象，不允许直接传 UI 组件对象或任意函数。V1 采用以下闭合集合：

```ts
type FilterScalar = string | number | boolean;

type TableFilterValue =
  | { operator: 'equals' | 'notEquals'; value: FilterScalar }
  | { operator: 'contains'; value: string }
  | { operator: 'in' | 'notIn'; value: readonly FilterScalar[] }
  | { operator: 'between'; value: { from?: string | number; to?: string | number } }
  | { operator: 'isEmpty' | 'isNotEmpty' };

type TableFilters = Record<string, TableFilterValue>;
```

- 日期筛选使用 `between`，边界值为店铺时区下的 `YYYY-MM-DD`；服务端按该时区将起止日期转换为查询区间，不由浏览器猜测时区。
- `in` / `notIn` 的空数组、`contains` 的空字符串、空的 `between`，在传给 `onQueryChange` 前移除该字段；`0` 与 `false` 是有效值，绝不能当成空值清除。
- 每个 `TableFilterDefinition` 声明允许的 operator；Table 仅生成被定义允许的条件，BFF/API 仍必须按字段 allowlist 校验，绝不能将 field/operator 直接拼入数据库查询。

### 币种、语言与时区

调用方必须从店铺/商户配置显式传入 `formatOptions` 的 `locale`、`timeZone`、`defaultCurrencyCode`，不得从浏览器环境隐式读取。money 列的 currencyCode 优先级为“列的 row resolver → 列的固定值 → `formatOptions.defaultCurrencyCode`”；datetime 的 timeZone 优先级为“列的固定值 → `formatOptions.timeZone`”。无可用币种时以 locale 数字格式展示原 amount（无货币符号），并通过 `onFormatWarning` 报告，避免将真实金额静默显示为错误币种。未知 status 使用中性 tone 并显示原值。

### 跨页全选与批量操作

- V1 基础选择是当前页的受控 `explicit` ID 集合。用户点击“选择全部 N 个匹配结果”后，应用调用 `onSelectAllMatching(query)`；该回调请求服务端，返回绑定规范化 query、当前用户、资源权限和过期时间的 `selectionToken`。
- `allMatching` 选择保存 token 与取消选择的 `excludedIds`，而不把所有 ID 传到浏览器。query 任意变化、token 过期或权限上下文改变时必须清除该选择。
- 后端处理 bulk action 时只信任 selection token 与 excludedIds：重新校验权限和查询快照；禁止接受前端宣称的“全选所有 ID”。token 建议 15 分钟有效且单次使用。
- bulk action callback 传入稳定 `actionId`、selection 和 UUID idempotencyKey。后端以 `(actor, actionId, idempotencyKey)` 至少 24 小时去重，支持部分成功，返回完成或异步受理的结构化结果。UI 在 action pending 时禁用重复提交；仅由返回的 `clearSelection: true` 清除选择，并展示成功/失败数量及可行动失败原因。

```ts
type TableSelection =
  | { mode: 'explicit'; ids: readonly string[] }
  | {
      mode: 'allMatching';
      selectionToken: string;
      selectedCount: number;
      expiresAt: string;
      excludedIds: readonly string[];
    };

type TableBulkActionResult =
  | { status: 'completed'; succeededCount: number; failed: readonly TableBulkFailure[]; clearSelection: boolean }
  | { status: 'accepted'; operationId: string; acceptedCount: number; clearSelection: boolean };
```

## 目录结构

```text
src/
├── components/
│   ├── Table/
│   │   ├── Table.tsx
│   │   ├── TableRow.tsx
│   │   ├── TableState.tsx
│   │   └── Table.test.tsx
│   ├── TableFilters/
│   │   ├── TableFilters.tsx
│   │   └── TableFilters.test.tsx
│   └── TablePagination/
│       ├── TablePagination.tsx
│       └── TablePagination.test.tsx
├── columns/
│   ├── renderCell.tsx
│   ├── renderCell.test.tsx
│   └── types.ts
├── features/
│   ├── selection.ts
│   └── selection.test.ts
├── hooks/
│   ├── useTableQuery.ts
│   └── useTableQuery.test.ts
├── presets/                         # V2 后创建
├── types/
│   ├── table.ts
│   └── index.ts
├── utils/
│   ├── formatters.ts
│   └── formatters.test.ts
└── index.ts
```

## V1：统一基础表格（建议作为首期 Release）

### Code Task 1：初始化可发布的组件库基座

**依赖：** 无。

**实现：**

- [ ] 创建 `package.json`、TypeScript 配置、包构建配置和 ESLint/Prettier 配置；设置包名为 `@standhigher/shopify-polaris-table`，并把 React、React DOM、`@shopify/polaris` 声明为 `peerDependencies`。
- [ ] 选定并配置测试栈（推荐 Vitest + React Testing Library + jsdom），创建 `src/index.ts` 作为唯一公共出口。
- [ ] 创建最小示例页或 Storybook（任选已确定的团队标准）以验证 Polaris `AppProvider` 上下文和组件样式加载方式。
- [ ] CI 至少执行 `typecheck`、lint、unit test、package build，并验证产物包含类型声明与 ESM/CJS（以团队发布规范为准）。

**验收：** 在干净环境执行 `npm run build && npm test && npm run typecheck` 成功；消费示例能从包根路径渲染一个 Polaris 组件。

### Code Task 2：冻结 V1 公共类型与受控状态契约

**依赖：** Task 1。

**文件：** `src/types/table.ts`、`src/types/index.ts`、`src/index.ts`、`src/types/table.test-d.ts`（或项目选定的类型测试文件）。

**实现：**

- [ ] 定义并导出 `TableColumn<T>`、`TableQuery`、`TableDataPage<T>`、`TableProps<T>`、`TableFilterDefinition`、`TableRowAction<T>`、`TableBulkAction<T>`、`TableSelection`、`TableBulkActionResult`、`TableBulkFailure` 和 `TablePagination`；实现上方「V1 已确认契约」的 discriminated union，不允许以 `any` 逃逸。
- [ ] 将 `TableColumn<T>` 的 `type` 限为技术方案指定的 `text | number | money | status | datetime | image | actions | custom`；`custom` 或任何需要复合展示的列必须提供 `render`。
- [ ] 明确每行稳定主键为 `rowId: keyof T | ((row: T) => string)`，禁止组件用数组下标做选择或行 key。
- [ ] 明确查询变更规则：搜索、筛选、排序变更时 `page` 回到 1；纯翻页保留其它查询字段；组件通过 `onQueryChange(nextQuery)` 输出完整不可变对象。
- [ ] 将 `TableQuery` 固定为 offset 模型（`page`、`pageSize`），并将 `TableDataPage<T>` 固定为 `{ data, total }`；page 从 1 开始，`total` 为当前 query 的匹配总数。V1 不支持 cursor pagination，也不在公共类型中留下两种模型的可选分支。
- [ ] 定义 `TableFilterDefinition` 的 field、label、control type 与 operator allowlist，确保产生的 `TableFilters` 符合上方的 JSON 协议；日期筛选的值始终为店铺时区下的 `YYYY-MM-DD`。
- [ ] 将 `formatOptions: { locale: string; timeZone: string; defaultCurrencyCode?: string }` 设为 `TableProps` 必填项；为 column 提供 `currencyCode` 和 `timeZone` 覆盖字段，并规定其解析优先级。

**建议类型骨架：**

```ts
export interface TableQuery {
  page: number;
  pageSize: number;
  search?: string;
  sort?: { field: string; direction: 'asc' | 'desc' };
  filters?: TableFilters;
}

export interface TableColumn<T> {
  key: keyof T | string;
  title: string;
  type?: 'text' | 'number' | 'money' | 'status' | 'datetime' | 'image' | 'actions' | 'custom';
  sortable?: boolean;
  align?: 'start' | 'center' | 'end';
  currencyCode?: string | ((row: T) => string | undefined);
  timeZone?: string;
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface TableFilterDefinition {
  key: string;
  label: string;
  type: 'text' | 'select' | 'multi-select' | 'boolean' | 'date-range';
  operators: readonly TableFilterValue['operator'][];
  options?: readonly { label: string; value: string }[];
}

export interface TableBulkAction<T> {
  id: string;
  content: React.ReactNode;
  perform: (context: {
    actionId: string;
    selection: TableSelection;
    idempotencyKey: string;
  }) => Promise<TableBulkActionResult>;
}

export interface TableProps<T extends Record<string, unknown>> {
  columns: readonly TableColumn<T>[];
  data: readonly T[];
  rowId: keyof T | ((row: T) => string);
  query: TableQuery;
  pagination: { total: number };
  formatOptions: { locale: string; timeZone: string; defaultCurrencyCode?: string };
  filters?: readonly TableFilterDefinition[];
  selection: TableSelection;
  onSelectionChange: (selection: TableSelection) => void;
  onSelectAllMatching?: (query: TableQuery) => Promise<{
    selectionToken: string;
    normalizedQuery: TableQuery;
    selectedCount: number;
    expiresAt: string;
  }>;
  rowActions?: readonly TableRowAction<T>[];
  bulkActions?: readonly TableBulkAction<T>[];
  onFormatWarning?: (warning: { columnKey: string; reason: string }) => void;
  loading?: boolean;
  error?: React.ReactNode;
  onQueryChange: (query: TableQuery) => void;
}
```

**验收：** 类型测试拒绝不存在的 column type、缺失 `rowId` 或 `formatOptions`、不在 filter definition allowlist 的 operator、混入 cursor 字段的分页对象；能为真实 Product/Order 行推导 `render` 的 `row` 类型，并穷尽 `TableSelection` / `TableBulkActionResult` 的分支。

### Code Task 3：实现无副作用的值格式化与单元格渲染器

**依赖：** Task 2。

**文件：** `src/utils/formatters.ts`、`src/utils/formatters.test.ts`、`src/columns/renderCell.tsx`、`src/columns/renderCell.test.tsx`。

**实现：**

- [ ] 提供空值占位、文本截断、数字、金额、日期时间、状态 Badge、图片占位和列对齐的统一渲染规则。
- [ ] 按「V1 已确认契约」实现 money currencyCode 和 datetime timeZone 的优先级；金额与日期 formatter 只接收显式 `formatOptions`/列配置，禁止隐式从浏览器语言/时区生成会导致服务端渲染不一致的文案。
- [ ] `status` 使用可覆盖的 `statusTone` 映射；未知状态用中性 tone 并保留原文，不能默认为 success。
- [ ] 图片无 URL、加载失败或 URL 非法时显示 Polaris 空占位，不渲染破图；money 无可用币种时保留 amount 的 locale 数字展示且调用 `onFormatWarning`，不得猜测 USD 或其他货币。
- [ ] `render` 优先级高于 `type` 默认 renderer；`actions` 仅由后续的行操作配置提供，不能尝试将任意对象字符串化。

**验收：** 覆盖 0/空字符串/null/undefined、负数、行级/列级/全局币种优先级、无币种 warning、店铺时区日期、无效日期、未知状态、超长中英文文本、图片加载失败和自定义 renderer 覆盖默认 renderer 的单测。

### Code Task 4：实现受控的服务端查询状态 Hook

**依赖：** Task 2。

**文件：** `src/hooks/useTableQuery.ts`、`src/hooks/useTableQuery.test.ts`。

**实现：**

- [ ] 提供 `useTableQuery({ query, onQueryChange })`，只负责合成下一份 `TableQuery`；不在库内发起 `fetch`。
- [ ] 提供 `setSearch`、`setFilters`、`setSort`、`setPage`、`setPageSize`、`clearFilters`，分别保持或重置页码的规则与 Task 2 一致。
- [ ] 搜索输入的 debounce 是 UI 层可选行为：Hook 默认立即输出，`TableFilters` 可通过 `searchDebounceMs`（默认 300ms）配置延迟，避免隐藏的请求时序。
- [ ] 保护输入：`page >= 1`，`pageSize` 必须落在传入的允许值内；按照「V1 已确认契约」清理空搜索、空筛选字段与空数组，但保留 `0` 和 `false`，避免 URL/API 产生无意义参数。

**验收：** 对每个 mutation 验证完整 query 输出、源 query 不被修改、筛选/排序/搜索重置页码、翻页不重置筛选、清空操作的边界行为；fake timer 验证 debounce 的取消与最后一次输入生效。

### Code Task 5：实现筛选与搜索栏

**依赖：** Tasks 2、4。

**文件：** `src/components/TableFilters/TableFilters.tsx`、`src/components/TableFilters/TableFilters.test.tsx`。

**实现：**

- [ ] 使用 Polaris `IndexFilters`（或团队锁定版本中等价组件）渲染搜索、已应用筛选条件和清空操作。
- [ ] V1 filter schema 至少支持 text、select、multi-select、boolean、date-range；filter 值一律以「V1 已确认契约」的 `TableFilterValue` 写入 `query.filters[filter.key]`，日期范围只提交店铺时区日期字符串。
- [ ] 仅显示已声明为可见的筛选器；空筛选不显示为 applied filter。
- [ ] 筛选操作与 Hook 集成，确保服务端查询由父应用在 `onQueryChange` 后自行刷新。

**验收：** 搜索、每种筛选类型生成的 operator/value、`0`/`false` 保留、空数组/空范围清理、清空全部、首次加载已存在 query 的回显，以及快速输入时只触发一次 search query 更新。

### Code Task 6：实现表格主体与状态视图

**依赖：** Tasks 2、3。

**文件：** `src/components/Table/Table.tsx`、`src/components/Table/TableRow.tsx`、`src/components/Table/TableState.tsx`、`src/components/Table/Table.test.tsx`。

**实现：**

- [ ] 将 `columns` 映射为 Polaris `IndexTable` 的 heading，使用 Task 3 renderer 将每行每列映射为 `IndexTable.Row` / `IndexTable.Cell`。
- [ ] 仅为 `sortable: true` 列展示可排序 UI；点击后在 asc/desc 间切换，并将 column key 写入 query sort。
- [ ] 状态优先级固定为 `error > loading > empty > table`；加载时保留已存在行并叠加 loading 反馈，首次加载且无数据可使用骨架屏。
- [ ] Empty state 提供 `emptyState` 插槽；Error state 提供 `error` 插槽和可选 `onRetry`，组件不自作主张重发请求。
- [ ] 当 `data` 变化导致当前页超过总页数时，组件只报告有效页码建议（或父层显式控制），不能在 render 阶段循环调用 `onQueryChange`。

**验收：** 覆盖 heading、各 cell type、排序交互、加载后保留旧数据、无数据空态、错误优先级、custom empty/error、键稳定性与无 React key warning。

### Code Task 7：实现选择、行操作与批量操作

**依赖：** Tasks 2、6。

**文件：** `src/features/selection.ts`、`src/features/selection.test.ts`、`src/components/Table/Table.tsx`、`src/components/Table/Table.test.tsx`。

**实现：**

- [ ] 将已选行作为受控的 `selection: TableSelection`：支持当前页 `explicit` IDs 与「V1 已确认契约」的 `allMatching` token；V1 不提供非受控兼容模式，避免跨分页选择语义不清。
- [ ] 支持单行选择、当前页全选、全不选和 `rowActions`；将行数据及稳定 `rowId` 传给 action callback。所有 query 改变时通过 `onSelectionChange({ mode: 'explicit', ids: [] })` 清除选择。
- [ ] 仅在 `onSelectAllMatching` 存在、当前 total 大于当前页数据数且 explicit selection 覆盖当前页时展示“选择全部 N 个匹配结果”；成功后切换为 `allMatching`，取消单行时写入 `excludedIds`。
- [ ] 支持 `bulkActions`，当未选中任何行时不显示；回调接收 `{ actionId, selection, idempotencyKey }`，以 `TableBulkActionResult` 返回。action pending 时禁用重复点击；只在 `clearSelection: true` 时清除选择，completed 结果展示 succeeded/failed count，accepted 结果展示 operationId。
- [ ] token 过期、服务端返回 token 无效、用户权限上下文改变或 query 改变时，清除 `allMatching` 选择并通知 consuming app 刷新；前端永远不以完整 ID 数组模拟“选择所有匹配结果”。

**验收：** 选择/反选/全选、从当前页升级为 allMatching、allMatching 中单行排除、query 改变/token 过期后清除、批量操作无选中时隐藏、partial failure 保留选择、accepted/completed 返回、重复点击防护和 row action 参数正确。

### Code Task 8：实现服务端分页并组装 Table 容器

**依赖：** Tasks 4、5、6、7。

**文件：** `src/components/TablePagination/TablePagination.tsx`、`src/components/TablePagination/TablePagination.test.tsx`、`src/components/Table/Table.tsx`、`src/components/Table/Table.test.tsx`。

**实现：**

- [ ] 使用 Polaris `Pagination`（或相应版本的组件）展示上一页/下一页、当前页、每页条数和总数。
- [ ] 首页禁用上一页、末页禁用下一页；总数为 0 时显示 0 条且不允许翻页。
- [ ] 更改 page size 后重置 page=1；父层收到新 query 后负责请求数据和更新 `pagination.total`。
- [ ] 在 `Table` 中按固定顺序组合 Filters、主表、Bulk actions、Pagination，并让屏幕阅读器可得到 loading、选择数量和页码变化通知。

**验收：** 边界页、总数不是 pageSize 整数倍、变更 pageSize、加载时分页禁用策略、上一页/下一页输出的 query、基本 a11y 断言。

### Code Task 9：补齐 V1 对外文档、示例与发布门禁

**依赖：** Tasks 1–8。

**文件：** `README.md`、`examples/server-side-query.tsx`、`examples/selection-and-actions.tsx`、`.github/workflows/ci.yml`（或团队现有 CI 路径）。

**实现：**

- [ ] 记录安装、peer dependency 版本范围、Polaris `AppProvider` 初始化、样式依赖和最小 Table 用法。
- [ ] 提供“offset 服务端 query + loading/error + retry”和“selection token 跨页全选 + idempotent bulk action”两个可运行示例，且示例不把数据请求写入 Table 组件；示例明确展示 shop locale/timezone/currency 传入。
- [ ] 发布前执行 typecheck、lint、所有单元测试、构建产物检查和一个消费者 smoke test。
- [ ] 建立变更日志和语义化版本规则；将 V1 API 标记为稳定范围，V2 预留 API 不提前导出。

**验收：** 从 README 复制的最小示例可运行；CI 在 lint、类型、测试或构建失败时阻止发布；产物可被独立消费者 TypeScript 项目导入。

## V2：提升业务复用（在 V1 已被至少一个实际业务页面验证后排期）

### Code Task 10：提炼并发布领域格式化、列可见性与 URL Query State

**依赖：** V1 已在至少一个 Product/Order/Customer 页面落地。

- [ ] 将 Money / DateTime / Status 统一格式化的业务默认值提炼为可覆盖 formatter preset，不破坏 V1 显式配置。
- [ ] 新增受控 `visibleColumnKeys` / `onVisibleColumnsChange`，确保隐藏列不参与 headings、cell rendering、排序交互和 a11y 表格结构。
- [ ] 提供可选 URL adapter，在应用层将 `TableQuery` 与 URL search params 互相序列化；不要把路由库设为该包的硬依赖。
- [ ] 处理非法 URL query、版本迁移和 filters JSON 编解码；避免暴露业务敏感筛选值到 URL。

**验收：** 刷新/前进/后退能恢复 query；隐藏/恢复列不破坏选择与排序；formatters 可覆盖且不同 locale/timezone 下有稳定测试。

### Code Task 11：Saved Views 与 Filter Presets

**依赖：** Task 10，且产品定义视图的归属、共享权限、最大数量与服务端存储 API。

- [ ] 定义 `TableView`（id、name、query、visibleColumnKeys、owner、updatedAt）及 repository adapter，不把存储协议硬编码进 Table。
- [ ] 实现创建、切换、重命名、删除、恢复默认视图；写操作必须带 loading/error 和并发覆盖处理。
- [ ] 仅将稳定、高频筛选组合发布为 Filter Preset；与 Saved View 区分为“只应用筛选”与“完整查询/列视图”。

**验收：** 多用户无权限访问、同名、删除当前视图、保存期间切换、服务端冲突、失效列 key 迁移等场景均有测试和产品验收标准。

### Code Task 12：Product / Order / Customer Presets

**依赖：** V1 稳定且至少两个业务页面的列结构重复率已验证。

- [ ] 为每个 preset 定义最小领域行模型和可覆盖 columns，避免将应用私有字段、请求逻辑或权限规则写进 preset。
- [ ] 首批仅交付 Product、Order、Customer；Campaign / Offer 必须有重复页面证据后再加。
- [ ] Preset 只能组合通用 Table API 与 formatter，不能 fork Table 渲染路径。

**验收：** 一个业务页面可通过 preset + 少量 override 接入；不用 preset 时通用 Table 的行为完全不变；preset API 有类型与视觉回归测试。

## V3：复杂表格能力（按真实性能与交互需求逐项立项）

### Code Task 13：Sticky Header / Column

**前置：** 确认当前 Polaris 版本支持方式、横向滚动容器和 Safari/移动端兼容策略。

- [ ] 先做独立 POC，验证 z-index、overflow、焦点可见性、弹层裁剪和屏幕阅读器行为。
- [ ] POC 通过后在 Table 中以 opt-in props 提供 sticky header / 首列，而不是默认启用。

### Code Task 14：列宽调整与列顺序

**前置：** 用户列偏好持久化契约（本地或服务端）和拖拽库/Polaris 支持结论。

- [ ] 将列展示配置从 `TableColumn` 静态定义拆为 runtime column state。
- [ ] 支持键盘可访问的调整/排序、最小最大宽度、持久化、失效列配置迁移和 reset。

### Code Task 15：虚拟滚动、可展开行、行内编辑与无限加载

**前置：** 每个能力独立 POC 和性能基线；不要捆绑开发。

- [ ] 虚拟滚动：定义行高策略、可访问性和选择/焦点/动态高度限制。
- [ ] 可展开行：定义嵌套内容生命周期和 ARIA relationship。
- [ ] 行内编辑：定义字段校验、乐观更新、并发版本冲突、保存/撤销和错误恢复。
- [ ] 无限加载：仅在服务端 cursor API、去重与终止条件明确后实现；不能复用 offset `TableQuery` 伪装无限滚动。

## V4：平台化（架构演进，不应在 V1/V2 预先实现）

### Code Task 16：抽象独立于 Polaris 的 Table Schema 与 Renderer Adapter

**前置：** 至少一次 Polaris 大版本升级或第二套 UI renderer 的明确需求。

- [ ] 将业务 Schema / query / actions 移入无 UI 依赖的 core package。
- [ ] 将 Polaris 渲染移为 adapter；补充 renderer contract test，确保核心状态机与格式化不依赖特定 UI 框架。
- [ ] 仅在有第二 renderer 后评估 workspace 拆包，避免为“未来可扩展”过早增加包维护成本。

## 任务依赖与交付顺序

```text
Task 1 → Task 2 → Task 3 ─┐
                 Task 4 ─┼→ Task 5 ─┐
                          └→ Task 6 ─┼→ Task 7 → Task 8 → Task 9 (V1 release)
                                      │
V1 adoption evidence → Task 10 → Task 11 / Task 12 (V2)
real business need → Tasks 13–15 (V3, individual POCs)
renderer migration need → Task 16 (V4)
```

## 进入开发前需确认的决策

1. 哪些服务端字段可公开为 filter field，以及各 field 对应的 `TableFilterDefinition.operator` allowlist？这是 BFF/API 的安全白名单，不能由前端自行扩展。
2. money 列所需的行级 currencyCode 字段名称是否已在 Product/Order/Customer API 中稳定提供？没有时须由 BFF 补齐或使用店铺 defaultCurrencyCode。
3. bulk action 的业务动作清单中，哪些动作需要二次确认、审批、审计事件或异步 `operationId` 轮询？这些是业务端实现 `TableBulkActionResult` 的约束。
4. 错误状态的边界：查询错误、列 render 错误、单行图片错误是否使用同一 UI？
5. 目标 Polaris 版本和支持的 React/浏览器范围是什么？这会直接影响 IndexFilters、IndexTable 和复杂功能的实现路径。

## 覆盖检查

- V1 的 Column Schema、Search/Filter、Sorting/Pagination、Selection/Bulk Actions、Loading/Empty/Error、Server-side Query 分别由 Tasks 2–8 覆盖。
- 方案列出的金额、日期、Badge tone、空值、文本截断、图片占位、对齐由 Task 3 覆盖。
- V2 的 Presets、Saved Views、Filter Presets、Column Visibility、Formatter、URL Query State 由 Tasks 10–12 覆盖。
- V3 的 Sticky、Resize、Order、Virtual Scroll、Inline Editing、Expandable Row、Infinite Loading 由 Tasks 13–15 覆盖，但必须单项 POC 后实施。
- V4 的 UI 实现解耦由 Task 16 覆盖。
