# P3 查询、筛选、排序、分页与 URL 验收记录

状态：P3 实现与自动化门禁完成；不进入 P4，不发布 npm。

真实 Runtime 证据：[筛选与 Applied Chips](<p3-filtered.png>)。

## 实现范围

- `s-search-field`：受控输入、trim、debounce、外部 query/路由恢复、卸载清理和 loading 禁止提交。
- Typed filters：text、select、multi-select、boolean、date-range；operator allowlist、选项值 allowlist、`0`/`false`/partial range 保留。
- Applied filters：`s-clickable-chip removable`，remove 通过受控 query 删除；Clear all 同时清除 search/filters 并重置 page=1。
- Advanced filters：`s-popover` + `commandFor`/stable id；筛选控件从 Table 外部查询模型派生。
- Sorting：字段/方向两个受控 `s-select`，合法字段和 `asc/desc` 校验，变更重置 page=1，空字段删除 sort。
- Pagination：s-table 原生 Previous/Next 由 flags 驱动；loading 时属性和 handler 双重禁用；page-size allowlist 正整数去重，非法值拒绝，合法变化 page=1。
- URL：保持 v=1 编解码、filter/sort allowlist、sensitive filter 排除、无 Router History API 示例；补齐 refresh/back/forward、hash/state/无关 query 参数保留和 popstate cleanup。
- `TableProps.pageSizeOptions` 已接入 Table → TablePagination。

## 自动化验证

- TableFilters：13 tests，覆盖 debounce、trim、路由恢复取消、最新 callback、立即 filter 提交取消 search timer、operator/option allowlist、multi-select 去重、partial range、loading gating、chips/Clear all。
- TablePagination：8 tests，覆盖 total/page/pageSize 非法值、首尾页、allowlist、当前外部 pageSize 展示、loading handler gating。
- useTableQuery：9 tests，覆盖 criteria page reset、safe integer、pageSize allowlist、0/false/partial range、不可变 query。
- URL codec：33 tests，覆盖 malformed/unsafe filters、finite numbers、sort whitespace/control/colon、duplicate version、allowlist fallback。
- History example：5 tests，真实 jsdom back/forward、refresh restore、unrelated params/hash/history.state、listener cleanup、SSR。
- Table query integration：4 tests，覆盖 native pagination、loading rejection、sort/page-size criteria reset、visibility query reconcile。
- 最终 P3 focused suite：68 tests 通过（另有 4 个 Table query integration tests）；最终完整 Vitest suite：36 files / 175 tests 通过。
- `npm run typecheck`、`npm run lint`、`npm run build`、`npm run test:compatibility`、`npm run test:package`、`npm run build-storybook`、`npm pack --dry-run` 全部通过。

## 真实 Runtime 验收

Storybook fixture：[QueryPipeline](<../../src/stories/QueryPipeline.stories.tsx>) 使用 50 条本地库存数据，在宿主侧真实应用 search、5 类 filters、sort、offset/pageSize，并同步 URL v=1。

在固定 Polaris 2 Runtime 的 Chromium iframe 中验证：

1. 初始显示 50 条数据、10 条当前页、native page-size select 和 Previous/Next。
2. Restore query 后 query JSON 更新为 search `Inventory item 2`，page 重置为 1。
3. 搜索后过滤结果、sort controls 和 URL search 参数同步。
4. 打开 Filters popover 显示 text/select/multi-select/boolean/date-range 五类原生控件。
5. 依次选择 draft、Summer、Enabled、Created-at from，最终匹配结果为 1 条；URL 保留 Storybook 的 `host`、`hash` 和外部参数，并写入 v/page/pageSize/search/sort/filters。
6. Escape 关闭 popover；Applied Chips 出现 Title、Status、Tags、Enabled、Created at，并提供 remove 与 Clear all。
7. 浏览器 snapshot 显示 native table headers/cells、checkbox、select、searchbox 和分页控件；无浏览器错误。

## 变更限制与未纳入范围

- 不包含跨页 selectionToken/bulk actions（P4）。
- 不引入 Router、fetch client、缓存或后端请求。
- URL 策略仍是应用拥有；示例只演示 History API。
- P3 未执行正式跨浏览器、RTL、axe、BestSourcing 生产验证；这些属于 P6。
