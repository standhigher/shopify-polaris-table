# P7 V2 beta 发布准备验收

状态：P7 准备已开始；**尚未发布 npm、尚未创建/推送版本 tag、尚未移动 latest**。

## 当前 metadata

- 本地合并后的 `main` 已包含 V2 P0–P6 提交。
- package / package-lock root version：`2.0.0-beta.1`。
- 目标 dist-tag：`next`。
- npm registry 现状已核对：`latest` 仍是 `1.1.0`，beta 版本尚不存在。
- 原有未跟踪 `pnpm-lock.yaml` 不属于发布提交，必须在 release preflight 前由维护者处理；本阶段不自动删除或纳入。

## 发布保护

- `npm:publish:beta` 只能通过 `release:check:beta` 和 `release:preflight:beta` 后执行，并使用 `--tag next`。
- beta preflight fail closed：
  - 必须来自 `main`。
  - 必须 clean checkout。
  - version/channel 必须匹配 `2.0.0-beta.1` / `next`。
  - P6 必须是完全通过状态，不能接受 `partial`。
  - 必须有真实读屏风险决策和单独的 publish authorization。
- 当前 readiness 明确是：`p6AutomationAccepted=false`、`screenReaderDecision=pending`、`publishAuthorized=false`，所以 preflight 必须失败。
- `latest` 稳定发布脚本保持独立，P7 不会自动移动它。

## 消费者和 tree-shaking

新增 `test/tree-shaking.node.mjs` 与 `test/package-bundle.node.mjs`，使用直接声明的 esbuild 0.28.2 验证实际 tarball consumer、metafile contribution graph 和 `sideEffects:false`：

- 纯 formatter consumer 不拉入 Table、Extension 或 experimental 代码，也不注入 Polaris Runtime。
- Table consumer 不拉入 Extension/experimental。
- `/extension` consumer 不拉入 Admin Table/Bulk/Runtime。
- root 与 `/extension` exports、生成声明和 `TableSkeleton` / `ExtensionTable` 保持存在。

## 尚未放行

- P6-01 Chromium production `s-menu` keyboard accessibility-tree 问题仍为 partial。
- VoiceOver/NVDA 实际读屏尚未完成。
- `pnpm-lock.yaml` 仍是未跟踪文件，release clean-tree 不成立。
- 尚未执行 `npm run release:check:beta` 的完整放行路径。
- `npm audit --omit=dev` 在 npm workspace 中仍审计 website/Docusaurus production workspace，报告 30 项（3 low / 6 moderate / 6 high / 15 critical）；这不是包 tarball 的 runtime dependency 清单，P7 不在未审计网站依赖时宣称安全。
- 不执行 `npm publish`、不创建 tag、不 push、不移动 latest。

## 复跑

```sh
npm run test:beta-policy
npm run test:tree-shaking
npm run release:preflight:beta   # 当前预期 BLOCKED
npm run release:check:beta       # 仅在所有阻塞项解决后运行
```

P7 只完成发布准备和 fail-closed 证据，不等价于 beta 已发布。BestSourcing 和 P8 不在本任务范围内。
