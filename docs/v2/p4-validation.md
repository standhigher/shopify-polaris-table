# P4 Selection / Bulk Actions 验收记录

状态：P4 实现、自动化门禁和真实 Runtime 基础验收完成；不进入 P5，不发布 npm。

过期 token Runtime 证据：[expiry screenshot](<p4-expired.png>)。

## 提交边界

P0–P3 已分批提交：`8cf80de`（审计）、`e9191c3`（React19/Polaris2）、`745ef86`（URL hardening）、`5fb9971`（P2/P3 evidence）。

P4 主实现已提交为 `0e9692e`，快照规范化及 Modal 内错误反馈为 `e9e6fc3`；最终回归测试与文档另批提交。原有未跟踪锁文件始终不纳入提交。

## 实现

- [useTableSelection](<../../src/hooks/useTableSelection.ts>)：explicit/allMatching 选择、稳定 criteria key、page/pageSize 不清 token、excludedIds、selection revision/generation、token 请求 stale/ABA/unmount 防护、normalizedQuery mismatch 拒绝、自然 expiry timer、非法 token/count/date fail closed。
- [TableBulkActions](<../../src/components/Table/TableBulkActions.tsx>)：同步锁、冻结 selection snapshot、同 intent Retry 复用 idempotency key、completed/partial/accepted/rejected/typed expiry、失败项选择、旧结果保护、s-menu/s-modal/s-button 原生组合。
- Table 接入：当前页三态 checkbox、跨页 token、native selection disable、bulk toolbar、destructive confirmation、clear current selection。
- [SelectionWorkflow story](<../../src/stories/SelectionWorkflow.stories.tsx>)：30 条本地库存、延迟 token、Archive/Delete/Export、completed/partial/accepted/reject-once/expired、Reset/Expire/Replace controls 和诊断日志。

## 自动化结果

- selection/core helpers：14 tests。
- `useTableSelection`：9 tests。
- `TableBulkActions`：9 tests。
- 完整最终 suite：**38 files / 201 tests 通过**。
- TypeScript、ESLint、Build、compatibility、React19 package consumer、Extension consumer、Storybook build、pack dry-run 均通过。

## Runtime 验证

固定 Polaris2 Runtime Chromium iframe 已验证：

1. 当前页全选后显示 bulk toolbar 和 Clear selection。
2. Select all matching 安装 allMatching token，`selectedCount=30`。
3. 翻页后 token 保留，下一页行保持选中。
4. 取消当前页一行后保留 token，并产生 `excludedIds`。
5. Archive completed 结果清除 selection。
6. Partial 结果显示失败信息并保留选择；Story fixture 支持失败项选择。
7. Destructive action 由 native modal confirmation 触发。
8. Runtime reject-once 后 Retry 调用两次，日志确认 idempotency key 完全相同，成功后清除选择。
9. Runtime accepted 显示 operationId 与“Processing is not yet complete”，相同 intent 的 Export 按钮禁用，不重复启动。
10. Runtime 原生 More actions 菜单打开 Delete，Modal 冻结选择并经 Confirm 执行；取消/变更 context 的防护由集成测试覆盖。
11. Runtime 自然过期后 selection 变为 explicit 空集，expiry notice 保留，Archive 不再出现，API 调用日志为 0。typed `SELECTION_EXPIRED` 则由单元测试确认清理且不提供原 token 重试。

点击原生 Web Component 时，自动化需要命中 shadowRoot 内的真实 button；`s-button` host 为 `display: contents`，host 坐标为 0，不能用 host 坐标判断事件丢失。

## 未纳入本阶段

- P5 Loading/Skeleton/Error/Empty/Saved Views/Column Visibility 冲突状态。
- P6 Safari/RTL/axe/屏幕阅读器/BestSourcing 生产验证。
- 不自动重试请求、不轮询 accepted operation；请求与服务端幂等仍由宿主负责。
