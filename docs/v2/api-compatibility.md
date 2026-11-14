# V2 API 兼容性清单（P0）

状态：P0 设计已确认，P1/P2/P3 已完成对应阶段验收；P4–P7 尚未完成。根包名称保持 `@standhigher/polaris-data-table`；V1 与 V2 通过 major version 和分支维护隔离。

## 保持不变

导出名称和公共类型签名均保持（除明确列出的可选 `listSlot` 扩展）：根入口的 `Table`、`TableColumnVisibility`、`TableFilterPresets`、`TableViews`、`renderCell`、`getColumnValue`、query/selection/formatter/URL/view/preset/core/adapter/V3 导出，以及 `/extension` 的 `ExtensionTable`、`EXTENSION_TABLE_MAX_COLUMNS` 和全部 Extension 类型。公共类型包括 `TableProps`、`TableColumnBase`、`TableColumnRenderer`、`TableLabels`、`TableSelectAllMatchingResult` 等。

- `TableQuery`、`TableDataPage<T>`、`TableSelection`、`TableFilterDefinition`、`TableBulkAction`、`TableRowAction`。
- `TableQuery` 的 page/pageSize/search/sort/filters JSON shape、one-based offset 语义。
- `TableSelection` 的 explicit/allMatching、`selectionToken`、`selectedCount`、`expiresAt`、`excludedIds` 字段。
- formatters、URL v=1 codec、filter preset、saved-view repository/manager 核心 contract、visible-column pure helpers。
- root 与 `/extension` 两个正式入口；ExtensionTable 的独立边界。
- `renderCell/getColumnValue`、领域 presets、Core/V3 纯函数导出（preview/stable 级别不变）。

## V2 新增/扩展

```ts
type TableListSlot = 'primary' | 'secondary' | 'kicker' | 'inline' | 'labeled';

type TableColumn<T extends object> = ExistingTableColumn<T> & {
  /** Optional Polaris 2 s-table mobile list designation. */
  listSlot?: TableListSlot;
};
```

以上是兼容性示意而非直接可编译的新类型定义；实现时将可选字段加入现有 `TableColumnBase`，保留 `type: 'custom'` 必须提供 `render` 的判别联合。`listSlot` 是可选字段，不改变 V1 omit 行为；V2 默认只在存在时映射，未指定使用官方默认 `labeled`。V2 可增加 controlled `variant?: 'auto' | 'list'`，但 `auto` 是官方默认，是否公开由 P2 验收决定。

## UI 破坏性变更（预期）

| 项目 | V1 | V2 迁移 |
|---|---|---|
| UI runtime | React Polaris `IndexTable`/Filters 等 | Polaris 2 custom elements `s-table` 等；宿主加载 `polaris-2.js` |
| React peers | React/DOM `>=18 <19` | React/DOM `>=19 <20`（beta 期间锁定并验证） |
| Polaris peer | `@shopify/polaris >=12 <14` | 不再依赖 Polaris React；`@shopify/polaris-types` 为 dev/type tooling；Runtime 不随包注入 |
| Sorting | IndexTable header callback | `s-table` 无排序，V2 组合 `s-select`/sort control；query API 不变 |
| Pagination | 自绘 Polaris pagination | s-table `paginate`, `hasPreviousPage`, `hasNextPage`, `nextpage`, `previouspage`；page-size 用 s-select |
| Filter controls | Polaris React props/events | `s-search-field`, `s-text-field`, `s-select`, `s-choice-list`, `s-popover`, `s-clickable-chip`；事件/属性按 v2 types |
| Selection | Polaris `IndexTable` selection | 显式 `s-checkbox.checked/indeterminate`；跨页 token 逻辑仍库/宿主拥有 |
| Row/bulk actions | Polaris action objects/IndexTable promoted actions | `s-button`, `s-menu`, `s-modal`组合；异步失败/确认路径需显式处理 |
| State | Banner/EmptyState/Spinner | Polaris 2 status elements或宿主插槽；错误/Retry/Empty 的文案 props 保持 |
| Responsive | IndexTable/宿主布局 | s-table `variant=auto` 原生 Table/List；`listSlot` 决定移动语义，不自造 parallel renderer |
| Styling | Polaris React/CSS | Web Components merchant styling；包不覆盖 shadow DOM。必要 CSS 仅用于容器/骨架且需打包契约 |

## P1 已落地的 UI 差异

- 排序从 IndexTable header 的点击移为原生受控 `s-select` 字段/方向组合；query shape 不变。
- 行选择改为显式 `s-checkbox`；点击普通行内容不再切换选择，避免与链接/Actions 冲突。
- Previous/Next 使用 s-table 内置按钮。`TableLabels.previousPage/nextPage` 仍保留类型兼容，但当前官方 Table 没有对应按钮文案属性，因此这两个字段不再控制内置按钮文案；Runtime 自身提供本地化。`pagination/itemsPerPage` 摘要与页大小文案仍受控。
- `TableColumn.align` 的签名保留，原生 header 按 `format=base/numeric/currency` 对齐；精确 center/end 自定义展示仍需要 P2 验收，不承诺等同 IndexTable 的对齐效果。
- 现有单测使用属性/事件 test doubles，不把它们当作真实 Polaris DOM/a11y 验证；真实 Runtime 由 Storybook host 加载并另行验证。

## P2 已落地的列呈现契约

- `TableColumnBase.imageAlt?: string | ((row: T) => string)`：可选图片替代文本；省略时保持装饰图语义。图片使用原生 `s-thumbnail`，非法 URL 返回占位符，加载/网络错误展示由 Runtime 负责，不删除 React 管理的节点。
- `status` 使用原生 `s-badge`；未知状态使用 neutral tone，空值仍为占位符。
- `align` 通过 light-DOM CSS wrapper 支持 start/center/end，不向 `s-table-header` 传不存在的 align 属性；number/money 的 native format 仍为 numeric/currency。
- primary/secondary/kicker 在每个列表项中只能占一个位置。重复声明按 schema 顺序保留第一个，其余以 labeled 呈现，避免数据被 Runtime 隐藏；inline/labeled 可重复。选择列使用 inline。
- `type: 'actions'` 可提供自定义 render，也可接收 Table 的 rowActions；同时提供时合并到同一个 cell，不再额外增加第二个 Actions 列。未声明 Actions 列时保持 Table 自动追加 Actions 列的行为。
- 列 key 与行 ID 必须唯一。Renderer 对重复的已渲染列 key/行 ID 显式报错，避免 custom cell state 错位；动态增删/重排列使用稳定列 key 保持组件身份。
- custom render 返回的 ReactNode 保持 light-DOM；独立交互可放 custom cell。rowActions.content 仍应为非交互内容，不要把 button/link 再嵌到动作按钮里。

完整 P2 证据见 [P2 验收记录](<p2-validation.md>)。

## P3 已落地的查询契约

- Search 只在 debounce 到期且仍对应当前受控 query 时提交，提交前 trim；外部 query/router restore、loading 或卸载会取消旧 timer。
- Filter controls 只接受 definition 声明的 operators/options；Applied Chips 和 Clear all 都通过受控 query 修改并重置 page=1。
- Sort field 必须来自 visible sortable columns，direction 仅 `asc/desc`；Sort/Page Size/filters/search criteria 变化重置 page=1。
- Native pagination flags 对非有限/负 total、非法 page/pageSize 安全归一化；loading 时属性和 handler 都不发出分页变更。
- URL codec 保留 v=1 和 public API；重复 version、控制字符/空白/冒号 sort、非 finite JSON numeric filters、敏感/未 allowlist 字段均安全拒绝。History 示例保留无关参数、重复参数、hash、history.state，并清理 popstate listener。

## 兼容性限制

- ReactNode `title`, `content`, `empty` 和 custom render 签名保持。P2 通过 React 管理的真实 light-DOM children / 明确 named slot 容器呈现，不将业务类型替换为 Preact `ComponentChildren`，不字符串化。若某个 WC 只支持字符串，则选择支持 children 的呈现组合；不能未经额外 breaking-change 决议缩窄上述字段。
- V2 不能传官方不存在的 `align`, `sortDirection`, `selected`, `onRemove` 等属性到错误元素；React 19 的 `onX` 事件映射必须通过 `@shopify/polaris-types@2.0.0` 和浏览器测试确认。
- `s-table` 官方 `variant` 只有 `auto | list`；不要实现/声明 `table`。
- `s-select` 是单选；multi-select 使用 `s-choice-list multiple`。所有表单值事件为 string（choice list 为 string[]），必须转换并校验。
- Polaris Runtime 由宿主负责；库不能导入 CDN、执行 `customElements.define` 或重复注册。未加载 Runtime 时只能保证 import/render 不崩，不保证视觉/交互。
- `/extension` 继续不要求 Admin Polaris React；若 V2 Admin 与 Extension 都需 Polaris Web Components runtime，宿主负责加载，包不得改变 Extension 的 host capability contract。

## 迁移步骤

1. V1 消费者固定 1.x 分支/版本，不在同一安装中通过 deep import 混用 V2 renderer。
2. 将应用 React/DOM 升到 19.x，宿主 HTML/SSR 加载匹配的 `polaris-2.js`（或固定 `polaris-2.0.js`），同时安装匹配 `@shopify/polaris-types`。
3. 保留 query/data/selection/action/repository 代码，仅按 breaking UI props 迁移 slot、sort、pagination 和 action render。
4. 审查 `ReactNode` rich content、自定义 cell 和 row action 的映射；不能以字符串化替代可访问内容。
5. 逐页验证 URL/back-forward、token expiry/partial failures、loading/empty/error、窄屏 auto list、键盘/a11y。
6. 仅在 V2 beta 消费者和 BestSourcing 页面通过后，使用 `next`；正式 `latest`/release tag 需单独确认。

## API 版本记录要求

每个 V2 UI 变更必须同步：类型测试、运行时/集成测试、Storybook、中文/英文 README、迁移文档、CHANGELOG。任何删除或改变上述保持字段的行为必须先新增迁移段落，禁止通过 build 失败后的 `any` 或旧 Polaris shim 掩盖。
