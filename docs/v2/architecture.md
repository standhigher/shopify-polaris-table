# V2 技术架构提案（P0 已确认，P1 进行中）

审计日期：2026-11-14。基线：`v1.1.0` / `bf8b63a1a11175be094c207fe5d08e7d80f6f53c`。

本文为设计交付，不表示 V2 已实现或兼容性已通过。方案确认及 P0 遗留门禁解决前，不进入 P1。审计结果见[现有能力与迁移清单](<audit-and-migration.md>)、[API 兼容性](<api-compatibility.md>)、[验证记录](<validation.md>)。

## 1. 需求摘要与研发结论

目标是在同仓库、同 npm 包内，用 React 19 + Polaris 2 Web Components 替换 Admin renderer；保留受控、服务端驱动的数据契约，不重写查询、格式化、URL、选择、视图存储逻辑。用户为新项目 Admin 页面与现有 V1 消费方；请求、权限、持久化、token 签发、业务幂等仍属于宿主/服务端。

结论：**P0 审计完成；用户已在本轮交互中确认进入 P1。** P1 首先修复类型基线，再完成 React 19 / 官方类型 / Runtime spike；四项门禁和功能验证未通过前不进入 P2。行为变更的具体细节在对应阶段冻结，不能把进入 P1 的确认视为允许任意 breaking change。 不将全量 Core 重构作为迁移前置。已有 `src/core` 是小型 schema/adapter 契约，并未驱动现有 Table；真正可复用逻辑还分布在 features/hooks/views/utils/adapters 中。

本期不增加 virtual/sticky/resize/reorder/expandable/inline edit/cursor UI，不重构 ExtensionTable。已有 preview helpers 保留导出和测试，不等于承诺这些 UI 可用于新 renderer。历史文档中的 V2/V3/V4 为能力代际，不等于这次 npm 2.x 主版本。

## 2. 分支与版本保护

已执行的本地保护：

- `v1.1.0` 是已有 annotated Tag，指向当前稳定基线；不移动、不重建，不修改发布历史。
- `maintenance/v1.x` 从 `v1.1.0` 建立，独立维护 React 18 + Polaris React 12/13。
- `feat/v2-polaris-web-components` 从同一 Tag 建立，当前位于此分支；本轮仅新增 P0 文档。
- `main` 不改写；既有未跟踪锁文件原样保留，不纳入交付，也不暂存、删除或自动提交。
- 未 push、merge、commit、publish；远端分支保护尚未配置。若团队要远端保护，需后续维护者设置必需检查与禁止 force push。

建议修复流：V1 缺陷先在维护分支做兼容修复，经测试后按需 cherry-pick 到 V2；禁止 V2 整体合回 V1。V1 用户固定 `@^1`，V2 beta 以后使用 `@next` 或精确 beta 版本。正式发布仍需单独确认。

当前[发布指南](<../release.md>)限定 merged main 发布，需在 P7 更新为经过评审的 V1 maintenance / V2 release 策略；在此之前不从 feature 分支发布。beta 使用 `next`，绝不提前移动 `latest`；V1 后续补丁不要误将 `latest` 从正式 V2 切回 V1（届时另定 `v1` dist-tag）。

## 3. 目标职责和目录

```text
src/
  types/table.ts                    # 保留业务契约，TableColumn 仅增可选 listSlot
  core/                             # 现有中立 schema/query/action 契约
  features/selection.ts              # 无 UI 的选择状态变换
  features/visibleColumns.ts         # 可见列清理/reconcile
  hooks/useTableQuery.ts             # React 状态适配，不放 DOM/请求
  views/                            # Repository/manager/preset（不放 UI）
  utils/formatters.ts                # Intl 格式化
  presets/                          # formatter 和领域列工厂
  adapters/urlQuery.ts               # URL v=1 编解码
  adapters/polaris.ts                # 保留公共 renderer adapter 契约
  columns/renderCell.tsx             # 保留公共函数签名，内部改 WC 展示
  components/admin/                 # P1-P5 逐模块迁移，不做第二套公共 Table API
    Table.tsx                       # 编排受控状态与回调
    TableRenderer.tsx               # s-table 结构，仅呈现
    TableRow.tsx                    # 显式 s-checkbox，不靠整行点击选中
    TableFilters.tsx                # s-search-field / s-popover / typed filters
    TableSort.tsx                   # 字段/方向选择器组合
    TablePagination.tsx             # 计算分页 flags + 页大小/页码摘要，不重复 Prev/Next
    TableBulkActions.tsx            # s-button / s-menu / s-modal 业务组合
    TableColumnVisibility.tsx
    TableViews.tsx
    TableFilterPresets.tsx
    TableState.tsx
    TableSkeleton.tsx               # 表格结构骨架；非通用基础 skeleton 库
  components/ExtensionTable/         # 保持实现和独立依赖图
  v3/                               # 原 preview 纯状态 helpers，保持现状
  experimental/                     # 内部 POC 不升级为 V2 公共 API
  index.ts                          # 同一包根入口，保留现有稳定导出
  extension.ts                      # 不导入 Admin/WC runtime/CSS
```

这是目标结构，不要求一次搬迁。公共入口的相对路径同步修改；内部路径不是支持的 deep import。不复制 V1 renderer 到 V2 产物中保留并行运行时：V1 实现由维护分支与 Tag 保留。若 P1 为保持可构建短暂保留旧源，必须明确过渡期，不得宣称 P1 已退出；禁止用排除全部 UI 测试来假装通过。建议把 React 19 升级、旧 Polaris 移除、WC 最小可构建 renderer 放在一个 P1 原子变更内，P2 再验收完整列与状态功能。

## 4. 官方契约核实（不是运行时验收）

查阅官方 `latest` 文档，其 frontmatter 标识 `api_version: v2.0`；下载 npm `@shopify/polaris-types@2.0.0` 到独立临时目录核对声明，没有安装到项目。

- [Table 官方文档](https://shopify.dev/docs/api/app-home/latest/web-components/layout-and-structure/table)：结构为 `s-table` → `s-table-header-row` / `s-table-body` → `s-table-row` → `s-table-cell`。`variant` 仅 `auto | list`，**没有** `table` 值；响应式交给原生 auto，不自建 CSS grid 表格。
- `s-table-header.listSlot` 为 `primary | secondary | kicker | inline | labeled`（默认 labeled）；`format` 为 `base | numeric | currency`。不能凭空传 align/sortDirection/selected 等 IndexTable props。
- Table 分页属性为 `paginate`、`hasNextPage`、`hasPreviousPage`，DOM 事件为 `nextpage`、`previouspage`；类型 JSX 声明提供 `onNextPage`、`onPreviousPage`。**React 19 是否正确连接大小写事件仍需 P1 浏览器 spike**，失败时使用限定类型的 ref + addEventListener 并清理，不改造原生组件。
- `loading` 可能使表格 inert；刷新保留旧 rows，不用 skeleton 替换已有数据。Table 不内置 search/sort/selection；由业务组件组合完成。
- [Search field](https://shopify.dev/docs/api/app-home/latest/web-components/forms/search-field)：受控 `value`；`input` 与 `change` 是不同事件。保留搜索 debounce，外部 URL/view 更新后必须同步并取消过期延迟。
- [Checkbox](https://shopify.dev/docs/api/app-home/latest/web-components/forms/checkbox)：受控 `checked`、`indeterminate`，`change`；页全选不能只传 aria 或 defaultChecked。
- [Select](https://shopify.dev/docs/api/app-home/latest/web-components/forms/select)：`value` 和子元素 `s-option`，单选；页大小需要 string → 正整数转换。
- [Choice list](https://shopify.dev/docs/api/app-home/latest/web-components/forms/choice-list)：`multiple`、`values: string[]` 与 `s-choice`，不是 Polaris React 的 selected/choices props。
- [Clickable chip](https://shopify.dev/docs/api/app-home/latest/web-components/actions/clickable-chip)：`removable`、`remove` 事件（JSX 类型为 onRemove），删除仍由受控 query 决定；外部拒绝更新时需验证 chip 未自行永久隐藏。
- [Popover](https://shopify.dev/docs/api/app-home/latest/web-components/overlays/popover)、[Menu](https://shopify.dev/docs/api/app-home/latest/web-components/actions/menu)、[Modal](https://shopify.dev/docs/api/app-home/latest/web-components/overlays/modal)：使用按钮 `commandFor` / `command` 与唯一 id，不照搬 React Popover active/onClose。Menu children 只用 button/section；Modal footer slot 是 `primary-action`、`secondary-actions`，不是通用教程里其他 surface 的 camelCase slot。异步成功才关闭，失败保留确认上下文。

页面示例有 Preact/remote-dom 内容；不能据此推断 React 19 或 Extension surface 通用兼容。开发每个组件前仍须核对对应 App Home v2 文档、锁定类型与真实 runtime，特别是 badge/image/button/empty-state 属性，不在 P0 臆造 API。

### Runtime 与类型依赖

[官方版本说明](https://shopify.dev/docs/api/app-home/latest/web-components/versioning)：`polaris.js` 只跟随 1.x，`polaris-2.js` 跟随稳定 2.x，`polaris-2.0.js` 固定 2.0。建议测试使用固定 2.0 Runtime，并记录浏览器/资源哈希；生产宿主可按官方建议跟随 2.x，但与类型保持一致。

库不插入 script、不注册 custom elements、不 import CDN、不加载 App Bridge。Storybook 和实际宿主各自加载 Runtime。SSR import/render 不访问 window/document/customElements；浏览器注册前后的 property upgrade、hydrate 和复杂数组属性都要测。

P1 建议 React / React DOM peers `>=19 <20`；dev 与 `@types/react` / `@types/react-dom` 锁定 19.x 同代精确版本。删除 `@shopify/polaris` peer/dev 与 CSS/provider 导入（含故事/实验/test mock）。官方 `@shopify/polaris-types@2.0.0` 为 type-only 包，已提供 React JSX augmentation 和 HTMLElementTagNameMap，不手写宽泛 IntrinsicElements 或 any。

禁止在 JS 中保留 `import '@shopify/polaris-types'`：该包根 export 只有 types，无 runtime JS；使用 compilerOptions.types 或纯类型引用加载 augmentation。声明前部映射 React JSX、后部又逐项扩充 React/global JSX，P1 必须以 React 19、精确 Preact、`skipLibCheck:false` 的独立消费者验证声明叠加，不再手写平行声明掩盖冲突。

该声明还引用 Preact 类型，包元数据未声明 dependency；P1 需用隔离消费者确认类型解析，将类型所需依赖显式闭包处理。声明若暴露官方类型，必须保证 tarball 消费者安装可解析（采用类型依赖或明确 peer），不能仅靠项目 devDependencies 和 skipLibCheck 掩盖。若内部使用官方类型但公共声明不引用，则不要强迫 `/extension` 加载 Admin 类型全局扩展。具体依赖归属以 emitted d.ts 与 NodeNext 消费者检查确定。

## 5. 状态与行为设计

- TableQuery/TableDataPage/TableSelection 不变；page 仍 one-based offset，后端查询不进入 Table。
- search/filter/sort/pageSize 的用户变更重置 page=1；仅翻页保留其他条件。Core 与 hook 对 pageSize 的现有差异须明确，不能全量替换 hook 造成回归。
- 列配置沿用 sanitize/reconcile：required columns、至少一列、stale keys、隐藏 sort/filter 清理。listSlot 随可见列映射到 header，不错位。
- selection 沿用 explicit / allMatching + excludedIds；**建议修正 V1 的翻页即清空 token 行为**：仅查询匹配条件变化清除 allMatching，翻页/pageSize 保持 token。该行为变更须确认、写 CHANGELOG，并以服务端 token 绑定规则验收。
- token 签发需 pending、捕获错误、请求序号/查询快照防陈旧响应；normalizedQuery 与宿主 query 的一致性策略需明确（不能静默丢弃服务端规范化）。过期判断仍保留，同时增加执行前校验；不能仅依赖 render 时读取时间。
- bulk 使用同步互斥 ref + pending UI；调用时冻结 selection/query 上下文，独立 intent 生成幂等键，同一 intent 网络重试复用键（真实重试策略由宿主实现）。只按返回 clearSelection 清理，且不要让旧结果清空用户的新 selection。completed/partial/accepted/rejected/expired 均有反馈。
- `destructive` 暂建议自动确认，使用原生 Modal；这将改变 V1 直接执行体验，需确认。Row actions 捕获失败并防重复；不依赖整行 click 触发选择，避免 Actions/links 误选。需要行导航时使用真正可聚焦链接，不能只靠 clickDelegate。
- 初次 loading+无数据：TableSkeleton；loading+旧数据：s-table loading；error+无数据：错误和 Retry；error+旧数据建议保留表格并显示错误/Retry（区别 V1，须记录）；无 loading/error 且无数据：Empty。超页由宿主重新请求正确页，不能在 render 中反复发变更。
- Saved Views 沿用 manager/repository，组件只呈现 CRUD pending/error；鉴权、唯一性、expectedUpdatedAt 冲突由 repository/服务端实现。默认视图持久化不偷偷新增。

## 6. 构建、CSS 与发布

沿用 npm workspaces、现有 package-lock、ESM、tsc + tsc-alias，保持包根与 `/extension` 两个入口。用户现有未跟踪 pnpm lock 不自动取代 npm lock，也不使用 legacy-peer-deps。

优先原生组件布局，不覆盖 shadow DOM。现有 tsc 不复制 CSS；若 skeleton/业务布局确需 CSS，P1 先定义复制步骤、声明、exports 与消费者导入方式，再引入。采用 CSS Modules 则必须有明确产物转换，不能只因 Vite Storybook 可用就认为 npm 包可消费。`sideEffects:false` 仅适用于无样式副作用；若发布 CSS，按文件列入 sideEffects 保留。

文档 workspace 目前 React 18，registry 确认 Docusaurus 3.10.2 peer 支持 React 18/19，可在 P1 同步升级到 19，消除两套类型/provider 混用；不引入新的 UI 库。Vite 8.2.1 engines 为 `^20.19.0 || >=22.12.0`，需将开发环境最低小版本写清，CI 20/22/24 验证受支持 patch，不笼统声称所有 Node20 均能构建。

P7 才改版本至 `2.0.0-beta.1` 并同步 package-lock / README 中英文 / CHANGELOG / API / 迁移文档 / 版本断言 / release scripts。消费者测试改为 React19、不安装 Polaris React 的 Admin 与 Extension，验证 NodeNext、SSR import、类型和无 Runtime 注入。Tree shaking 需真实消费者打包与依赖图验证，单纯 ESM 不等于验收。

## 7. 阶段门禁与依赖

| 阶段 | 退出要求 | 不满足时 |
| --- | --- | --- |
| P0 | 审计/清单/方案评审；基线失败有修复决议 | 不进入实现 |
| P1 | 类型/Lint/测试/Build；19.x 安装无冲突；无 Polaris React；WC 属性事件/注册时序/SSR 最小验证 | 不进入完整 renderer |
| P2 | 动态列/custom/8列类型、listSlot、窄屏、格式回调与行操作 | 不进入查询交互验收 |
| P3 | search/filter/operators/applied/sort/pageSize/内置分页/URL back-forward；分页重置和竞态 | 不进入 selection 验收 |
| P4 | 三态 checkbox、跨页/token/exclusions、pending/双击/过期/partial/accepted/新旧请求隔离 | 不进入高级状态验收 |
| P5 | visibility/views/presets/repository冲突；Skeleton/refresh/Empty/Error/Retry；i18n/a11y | 不进入业务验收 |
| P6 | 全测试、真实Runtime浏览器与视觉、BestSourcing实际三类页面证据 | 示例不能代替生产验收 |
| P7 | beta元数据/文档/产物/tree shaking/安装消费/正式发布清单 | 未获确认不发布 |

每阶段四个基本检查全部执行并记录退出码，另加对应功能验证、变更文件及已知限制。不能以 mock 自定义元素测试代替真实 runtime。

## 8. 主要风险与待确认决策

| 等级 | 风险与触发场景 | 处理方式 | 是否阻塞 |
| --- | --- | --- | --- |
| P1 | 基线类型检查缺 Node 类型，现有 node_modules 是 pnpm 安装树，非干净 npm ci 证据 | P1前置修复明确加 @types/node、test types/node；隔离 npm ci 重现 | 阻塞门禁通过，非技术不可行 |
| P1 | V1 allMatching 翻页清除、签发陈旧响应/未catch、bulk state锁非同步 | 按本提案修正并补回归；服务端token绑定规则确认 | 阻塞P4 |
| P1 | Runtime/类型错配、React事件大小写/受控属性注册时序 | 固定2.0 spike + 真实浏览器；不使用polaris.js冒充2.x | 阻塞P1 |
| P1 | BestSourcing代码/测试租户/API权限及实际契约未提供 | 获取可访问页面或仓库、mock和真实测试数据、后端owner | 阻塞生产场景验收，不阻塞库P1-P5 |
| P2 | align:center 无原生header对应属性，rich标题和列表标签转换 | 保留签名但记录视觉差异；P2选定外层呈现策略/浏览器验证 | 阻塞对应兼容承诺 |
| P2 | 旧发布流程仅main与维护分支冲突 | P7维护者确认发布分支/dist-tag策略 | 阻塞发布 |
| P2 | 现有故事响应式/a11y配置不是执行证据 | P6记录Chrome/Safari/320/375/768/桌面、键盘/读屏/axe结果 | 阻塞最终验收 |

需确认：

1. 是否认可“同包两入口、V1维护分支保留、V2根入口替换renderer、核心渐进复用”的结构？
2. 是否接受 allMatching 仅在匹配条件变化时清除，以及旧数据错误保留、destructive自动确认等明确行为修正？normalizedQuery 若不同，宿主先接受规范化还是拒绝该token并提示重试？
3. BestSourcing仓库/页面、测试店铺、三类列表行模型/筛选字段及操作接口由谁提供？需要哪些Chrome/Safari最低版本与语言/时区基线？

范围按用户P0-P7推进，不扩张为Data Grid项目。当前不足以承诺工期：P1真实Runtime spike和P6业务环境为关键依赖；每阶段完成后才估下一阶段，不以测试数量推断兼容完成。
