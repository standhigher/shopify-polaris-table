# P2 Table Renderer 验收记录

状态：P2 实现与自动化门禁已完成；P3 查询交互尚未开始，未发布 npm。真实 Runtime 的 320/375/768/1280 布局、动态列、列类型、list slot 和 native shadow action 已验证。

真实 Runtime 证据截图：[320px List](<p2-table-320.png>)、[375px List](<p2-table-375.png>)、[768px Table](<p2-table-768.png>)、[1280px Table](<p2-table-desktop.png>)。

## 实现范围

- 新增独立 presentation-only [TableRenderer](<../../src/components/Table/TableRenderer.tsx>)，Table 继续拥有 query、selection、分页和 action orchestration。
- 动态列按稳定 `column.key` 渲染，避免自定义 Cell 在列插入、删除、重排时按 index 错位复用状态。
- `text`、`number`、`money`、`status`、`datetime`、`image`、`actions`、`custom` 均有 renderer 路径。
- `status` 使用 `s-badge`，tone 通过 `TableStatusTone` 映射；`image` 使用 `s-thumbnail`，支持 `imageAlt` string/function，非法 URL 返回 placeholder。
- `s-table` 使用官方 `variant="auto"`；header 使用 `listSlot` 与 `format`（number=numeric、money=currency、其他=base）。每个 list item 只有一个 primary/secondary/kicker 位置；重复 singleton slot 自动降级为 labeled，避免窄屏丢列。选择列使用 inline，不占用业务 kicker。
- `align` 通过 light-DOM wrapper 的 `text-align`/`inline-size` 显式呈现；官方 Header format 仍负责 native numeric/currency 对齐，复杂 shadow-DOM 组合仍需视觉验证。
- `actions` 列可由 column renderer 显式提供；若使用 `rowActions`，声明 `type: 'actions'` 时不会额外增加重复 Actions 列。
- Storybook 新增 `ColumnsAndResponsiveTypes`，覆盖 8 类列、null/invalid、imageAlt、5 种 listSlot、numeric/currency、custom badge、safe row action。

Renderer 对重复 column keys 和 row IDs 显式抛错；自定义 Cell 和动态列依赖唯一稳定身份。Actions column 与 rowActions 同时存在时合并到同一 cell，不增加重复列。行操作仍使用标准 React onClick；浏览器验证需命中 shadowRoot 内真实 button，Polaris 的 `display:contents` host 坐标为 0，不应误将自动化点到页面左上角视为事件丢失。

## 自动化验证

- `src/columns/renderCell.test.tsx`：10 tests，覆盖 text/false/zero/placeholder、number、money/currency warning、datetime、badge、thumbnail、invalid image、custom、actions。
- `src/components/Table/TableRenderer.test.tsx`：7 tests，覆盖 8 类列、format/listSlot/align、stateful custom 列稳定 key、actions 列去重、动态 visible columns、重复 singleton slot 降级。
- `src/components/Table/Table.test.tsx`：16 tests 通过。
- `src/columns/renderCell.test.tsx`：10 tests 通过。
- P2 focused suite：33 tests 通过；最终完整 Vitest suite：34 files / 119 tests 通过。
- `npm run typecheck`、`lint`、`build`、`test:compatibility`、`test:package`、`build-storybook`、`npm pack --dry-run` 全部通过。

## 官方契约核对

已核对官方 [s-table](https://shopify.dev/docs/api/app-home/latest/web-components/layout-and-structure/table.md)、[s-badge](https://shopify.dev/docs/api/app-home/latest/web-components/feedback-and-status-indicators/badge.md)、[s-thumbnail](https://shopify.dev/docs/api/app-home/latest/web-components/media-and-visuals/thumbnail.md) 与 `@shopify/polaris-types@2.0.0`。

- s-table `variant` 仅 `auto | list`，使用 `auto`。
- s-table header `listSlot` 仅 `primary | secondary | kicker | inline | labeled`。
- header `format` 仅 `base | numeric | currency`。
- Badge tone 使用官方 `success/info/warning/critical/neutral` 等值。
- Thumbnail 使用 `src/alt/size`，不再通过 React `onError` 删除 DOM 节点。

## 真实 Runtime 验收计划/记录

P2 需要在 Storybook iframe 加载固定 `polaris-2.0.js` 后执行以下矩阵并保存截图/结果：

| 场景 | 320px | 375px | 768px | 桌面 | 当前状态 |
|---|---:|---:|---:|---:|---|
| 8 类列与 badge/thumbnail/custom | 通过 | 通过 | 通过 | 通过 | Storybook iframe/accessibility snapshot + screenshots |
| `listSlot` primary/secondary/kicker/inline/labeled | 通过 | 通过 | 通过 | 通过 | 重复 singleton slot 自动降级 labeled |
| numeric/currency/align | 通过 | 通过 | 通过 | 通过 | format 与 light-DOM wrapper |
| image invalid/placeholder | 通过（invalid placeholder） | 通过 | 通过 | 通过 | invalid URL 单测；真实 broken-network fallback 留给 P6 |
| stateful custom column reorder | 不适用 | 不适用 | 不适用 | 通过 | stable key 单测 + dynamic story reverse |

视觉截图、RTL、跨浏览器和 axe 结果仍属于 P6 质量验收；本阶段不进入 P3。
