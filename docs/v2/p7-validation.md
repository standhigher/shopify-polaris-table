# P7 V2 beta 发布准备验收

状态：P7 beta 准备正在验收；**尚未发布 npm、尚未创建/推送版本 tag、尚未移动 latest**。

本地合并提交：`65af5ea`。P7 准备提交位于本地 `main`；未推送远端。V1 maintenance 与 `v1.1.0` 标签保持原基线。

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
- 旧 `npm:publish` 在 V2 beta 准备线上被明确禁用；raw npm publish 生命周期也会再次运行 preflight。`publishConfig.tag=next`，不会把 beta 默认发到 latest。V1 maintenance 保留原发布流程。

## 消费者和 tree-shaking

新增 `test/tree-shaking.node.mjs` 与 `test/package-bundle.node.mjs`，使用直接声明的 esbuild 0.28.2 验证实际 tarball consumer、metafile contribution graph 和 `sideEffects:false`：

- 纯 formatter consumer 不拉入 Table、Extension 或 experimental 代码，也不注入 Polaris Runtime。
- Table consumer 不拉入 Extension/experimental。
- `/extension` consumer 不拉入 Admin Table/Bulk/Runtime。
- root 与 `/extension` exports、生成声明和 `TableSkeleton` / `ExtensionTable` 保持存在。

## 本轮准备门禁结果

`npm run release:prepare:beta` 已完整通过：ESLint、41 文件/240 项 Vitest、2 项 compatibility policy、TypeScript、Build、Storybook、Typedoc API、Docusaurus 英文/中文构建、pack dry-run、3 项 package consumer、6 项 beta policy、5 项 tree-shaking/installed-tarball consumer checks。

本地实际执行环境为 Node 24.20.0。CI 已配置 Node 20/22/24 的 beta policy 与 bundler 检查；本轮未推送，不能宣称远端矩阵已执行。

`release:preflight:beta` 则按预期返回非零并阻止发布；准备门禁通过不等价于发布放行。

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
