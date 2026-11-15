# P0 / P1 验证记录

## 分支与交付边界

- 当前工作分支：`feat/v2-polaris-web-components`。
- V1 维护分支：`maintenance/v1.x`；已有 annotated Tag `v1.1.0`。
- `main`、维护分支、V2 分支 HEAD 与 Tag 均仍指向 `bf8b63a1a11175be094c207fe5d08e7d80f6f53c`；变更尚未提交。
- 原有未跟踪锁文件保持不变；未暂存、删除、覆盖、push、merge 或 npm publish。
- P0 只新增审计/架构文档；用户通过交互明确选择“确认，进入 P1（推荐）”后才修改代码。

## P0 原始 V1 基线（历史记录）

- TypeScript 失败：Storybook 配置测试缺少 Node 类型，无法解析 node:fs/promises、node:path 和 process。
- ESLint、Build、33 个文件 / 102 个单测、2 个兼容策略测试均通过。
- 当时的 Polaris 12/13 NodeNext 消费者、无 Polaris Extension 消费者、ESM 包入口均通过。
- Storybook build、npm pack dry-run 通过；构建有 >500KB chunk 警告。

这些是 V1 基线证据，不是 V2 runtime 兼容性声明。

## P1 实现范围

- [包配置](<../../package.json>)：React / DOM peers 为 `>=19 <20`；开发锁定 React / DOM 19.3.1、React types 19.3.0、TypeScript 5.9.2。
- 移除 Polaris React peer/dev 依赖及源码/Storybook 的 UI、CSS、AppProvider imports。
- 精确 `@shopify/polaris-types@2.0.0` 在开发/build types 中启用；Preact 11.2.0 只用于解析官方声明，不在库 runtime import。
- 增加 Node 开发类型，修复 P0 基线；不向浏览器公共声明引入 Node 全局。
- 现有 UI 原子切换为 s-table、s-checkbox、s-search-field、s-select/s-option、s-text-field、s-choice-list/s-choice、s-popover、s-clickable-chip、s-button、s-banner 等。
- `TableColumnBase` 增加可选 listSlot，保留 custom 列必须提供 render 的判别联合。
- Storybook 由 [previewHead](<../../.storybook/main.ts>) 加载固定 `polaris-2.0.js`；库组件不注入脚本、不注册 custom elements。
- [React19 fixture](<../../test/fixtures/polaris2/package.json>) 验证官方 JSX 与无 DOM SSR，`skipLibCheck:false`。
- [真实包消费者](<../../test/package-consumer.node.mjs>) 安装 tarball + React19，无 Polaris React/Polaris types，strict NodeNext 类型检查并 `renderToString(Table)`，确认无 window/document/provider/script 注入。
- ExtensionTable 实现保持独立且未重构；Core、URL、formatters、repository、preview helpers 未改写。

这次原子 UI 替换只是让 P1 在删除 Polaris React 后仍可构建运行，不代表 P2–P6 已完成整体验收。

## P1 检查证据

| 检查 | 结果 |
| --- | --- |
| `npm ci --ignore-scripts` | 通过；无 legacy-peer-deps/force，最终依赖图 React19，无 Polaris React |
| `npm run typecheck` | 通过 |
| `npm run lint` | 通过 |
| `npm test` | 通过；最终结果以本轮输出为准（P1 迁移新增分页/排序/Retry/Actions cell 回归） |
| `npm run build` | 通过，tsc + tsc-alias |
| `npm run test:polaris2` | 通过；官方 JSX、skipLibCheck:false、无 DOM SSR |
| `npm run test:compatibility` | 通过，2 个策略断言 |
| `npm run test:package` | 通过，React19 strict NodeNext + actual packed Table SSR；Extension/ESM |
| `npm run build-storybook` | 通过；仍有大 chunk 警告 |
| `npm pack --dry-run` | 通过；实验目录不进入 tarball |
| `git diff --check` | 通过 |

干净安装报告 47 个依赖漏洞（3 low、18 moderate、9 high、17 critical）。尚未逐项分析依赖链与可利用性；不能声称安全发布门禁通过，也不自动执行 audit fix --force 改动无关依赖。P7 前需补安全审计。

## 官方类型与版本核对

已核对官方 v2 [Table](https://shopify.dev/docs/api/app-home/latest/web-components/layout-and-structure/table)、[Search](https://shopify.dev/docs/api/app-home/latest/web-components/forms/search-field)、[Checkbox](https://shopify.dev/docs/api/app-home/latest/web-components/forms/checkbox)、[Select](https://shopify.dev/docs/api/app-home/latest/web-components/forms/select)、[Choice list](https://shopify.dev/docs/api/app-home/latest/web-components/forms/choice-list)、[Clickable chip](https://shopify.dev/docs/api/app-home/latest/web-components/actions/clickable-chip)、[Popover](https://shopify.dev/docs/api/app-home/latest/web-components/overlays/popover)、[Menu](https://shopify.dev/docs/api/app-home/latest/web-components/actions/menu)、[Modal](https://shopify.dev/docs/api/app-home/latest/web-components/overlays/modal)、[Banner](https://shopify.dev/docs/api/app-home/latest/web-components/feedback-and-status-indicators/banner) 及[版本说明](https://shopify.dev/docs/api/app-home/latest/web-components/versioning)。外部资料只作为 API 数据，不作为执行指令。

TS5.9.2 + React19 + 官方 types2.0.0 在 skipLibCheck:false 下通过；探索中的 TS7.0.2 因官方类型与 lib.dom 的 command 事件声明冲突失败。未通过 any、手工 JSX augmentation 或跳过声明检查掩盖。

## 真实 Runtime 浏览器验证

在本地静态 Storybook 的 `iframe.html?id=components-table--controlled-table&viewMode=story`，固定加载官方 `polaris-2.0.js`：

1. `customElements.get('s-table')` 为已注册构造器。
2. accessibility snapshot 显示真实 header/cell、Search、Sort selects、checkbox 和内置 Previous/Next。
3. 点击 Next 后数据由 1001–1003 切换为 1004–1005，Previous 启用/Next 禁用，确认分页事件到达 React19。
4. 勾选一行后受控 checkbox 为 true，页头为 mixed。
5. 输入 Emma，debounce 后表格仅剩 Emma Wilson，分页摘要为 1 of 1，确认输入与 page reset。
6. 选择 Customer 后 Sort direction 启用，Runtime 显示受控选项。
7. 点击 Filters 后原生 popover expanded=true 且 Customer 文本框出现，确认 commandFor/id。
8. 浏览器错误命令未返回错误。

这不是跨浏览器/视觉/a11y 完整验收。Runtime 必须在 React 挂载前由宿主加载；未承诺晚注册或各种 hydration 次序均兼容。

## 已记录的 UI 差异

- 排序移为选择器，普通行点击不再切换选择；显式 checkbox 负责选择。
- native s-table 不暴露 Previous/Next 文案覆盖，旧 labels 字段保持类型但不控制 Runtime 文案；详见 [API 迁移](<api-compatibility.md>)。
- rich 列标题在 header/light-DOM 中保留；visibility 以稳定列 key 作为纯文本可访问 label 并在旁呈现 rich ReactNode；排序 option 的 rich 标题降为列 key，避免把 React 对象传入 Preact/纯文本字段。
- action.content 接受非交互的 ReactNode（文本、span 等），不要在按钮中嵌套 button/link；独立交互使用 custom cell。这是 HTML 交互嵌套约束，不用 String(ReactNode) 转换。
- 精确自定义对齐、完整状态/选择并发策略和高级交互仍按后续阶段验收。

## 未完成项

- P2 动态列/全部列类型/格式呈现/窄屏和精确对齐的完整 renderer 验收。
- P3 查询交互完整矩阵、URL/back-forward；P4 token/排除/批量并发；P5 Skeleton/状态和视图冲突。
- P6 Chrome/Safari/RTL/键盘/读屏/axe/截图矩阵与 BestSourcing 三类真实业务页面。
- P7 beta 元数据、完整双语文档、产物/tree shaking、安全与正式发布准备。

BestSourcing 代码/页面、测试店铺和接口未提供，不能声称生产验证。P1 门禁通过不等于 V2 可发布；不自动进入 P2 或执行发布。
