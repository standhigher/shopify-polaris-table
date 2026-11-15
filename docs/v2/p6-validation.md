# P6 库内自动化验收报告

**交付状态：自动化执行和证据已交付；P6 Chromium 菜单项保留 partial 记录，但用户已明确接受该风险，不再将其作为后续发布阻塞项。**

按用户选择，VoiceOver/NVDA 不在本次验收范围，也不再作为后续发布闸门。BestSourcing 生产页面不在范围内。

## 结果矩阵

| 范围 | 实际结果 | 证据 |
|---|---|---|
| Chromium 157：Columns / Lifecycle / Selection，LTR+RTL，320/375/768/1280 | 24 组 axe/layout 通过，无横向 document overflow | [Chromium report](<p6-evidence/chromium.json>) |
| Chromium Skeleton | axe、status、aria-hidden/inert、3 行占位通过 | [Chromium report](<p6-evidence/chromium.json>) |
| ExtensionTable，LTR+RTL，四种宽度 | 8 组 axe/layout 通过，radio Space/ArrowDown 通过 | [Extension report](<p6-evidence/extension.json>) |
| axe-core 4.12.1 | 上述 33 组全部 0 violations / 0 incomplete | 同上 |
| 视觉回归 | 9 张独立新截图对比保存的 golden，全部 0 changed pixels | [Chromium report](<p6-evidence/chromium.json>)、[基线](<../../test/runtime/baselines/columns-ltr-320.png>) |
| Safari 18.6，真实 WebDriver | 3 个 stories × LTR/RTL 的 6 组桌面布局通过；图片完成加载，无横向溢出 | [Safari report](<p6-evidence/safari.json>) |
| Safari 键盘 | Columns Enter→Popover→Escape→焦点回 Columns；selection Space→menu→Modal→Escape→焦点回 More actions 通过 | [Safari report](<p6-evidence/safari.json>) |
| Chromium 键盘 | Columns Tab/Escape/focus return、selection Space、Skeleton 隐藏占位通过；bulk menu 见 P6-01 | [Chromium report](<p6-evidence/chromium.json>) |
| VoiceOver/NVDA 实际语音 | 未执行；用户选择留人工 | [人工清单](<../../test/runtime/README.md#manual-screen-reader-handoff-not-performed>) |

### 源码与包门禁

- TypeScript、ESLint、**41 个 Vitest 文件 / 240 项测试**通过。
- Build、compatibility policy、React 19 NodeNext consumer、Table/TableSkeleton SSR、Extension consumer、Storybook build、npm pack dry-run 通过。
- 视觉比较器有 3 项 Python 单测：相同像素通过、真实差异失败、尺寸变化失败。
- 源码门禁通过不等于 Runtime 整体验收通过；默认 Runtime 综合报告保留 `status: partial` 并返回 **exit 2**。

## 本阶段修复

1. **Storybook 宿主语义**：首轮 axe 的 landmark-one-main、page-has-heading-one、region 三项问题，补 main 和可访问隐藏 h1 后消失。Docs 模式不重复嵌套 main；这些语义不强加到库的 Table 上。
2. **RTL 可重复入口**：新增 Storybook direction toolbar；harness 断言实际表格宿主 computed direction，而不是仅修改 html dir。
3. **诊断区布局**：Selection Workflow 的长诊断说明改用原生 paragraph，消除 320px 下 overlap 导致的 color-contrast incomplete；未关闭该规则。
4. **Extension radio 组**：使用每个实例独立的 useId/name，让原生 Space/ArrowDown 生效且多个表格不串组；公共 props 不变。
5. **复现性**：harness 使用独立浏览器 session、随机 loopback 端口、no-store 静态响应、字体/图片与布局稳定检查；不会将缓存的旧 Storybook 误当新构建。

## P6-01：Chromium bulk menu 键盘用例尚未通过

在本机自动化环境，生产 Selection Workflow 中按 Enter 后 More actions 可报告 expanded=true，但 accessibility tree 未出现 Delete/Export menuitem，焦点停在 More actions。

- 测试仍保留真实 focus/Enter/ArrowDown 与 Modal Tab/Shift+Tab/Escape 断言。
- 未用 pointer click 或隐藏源按钮的 programmatic click 替代失败的键盘断言来伪报通过。
- 相同版本原生最小 menu fixture 的 Enter/ArrowDown 可通过；Safari 中相同业务 menu/Modal 键盘链也通过。
- 仍不能据此断定仅为 CDP 工具问题；Chromium runtime 集成与自动化环境的差异需要继续定位。headed 诊断还观察到 Columns Escape 的焦点异常，未计入通过。
- 当前结论：**已知待调查项，不能宣称完整 Chromium 菜单键盘验收通过。** 默认命令返回 partial/nonzero，已保存证据，不自动放行 P7。

## 视觉回归范围

保存 8 张 Columns（4 viewport × 2 direction）和 1 张 Skeleton golden。默认执行只比较，不更新基线；更新必须显式使用 `--update-baselines` 并先人工 review。阈值是 RGB 单通道差值 >20 的像素占比不超过 0.1%，尺寸变化直接失败。

现有 P2 baseline 保留，未覆盖。P2 部分截图的交互状态/故事控制区不同，不能视作严格同条件像素对照；P6 goldens 使用同一 story/globals/viewport，从全新页面另行捕获再比较。

代表图：[LTR 320](<p6-table-320.png>)、[LTR 375](<p6-table-375.png>)、[LTR 768](<p6-table-768.png>)、[desktop](<p6-table-desktop.png>)、[RTL 320](<p6-rtl-320.png>)、[Lifecycle RTL](<p6-advanced-rtl-320.png>)。

Safari 保存的是桌面截图和结构验收，不是 Safari 像素 golden gate，也不是 iOS/Safari Responsive Design Mode 验收。

## 复跑与人工交接

命令、前置依赖、exit code、基线更新规则及完整人工读屏清单见 [Runtime README](<../../test/runtime/README.md>)。

Safari 初次 probe 因 Remote Automation 未允许而失败，后续环境可用后才完成实际会话。脚本从未运行 safaridriver --enable 或修改系统安全设置。该报告以已保存的实际 Safari 会话结果为准。

真实读屏需要人工记录版本、预期公告、实际语音、pass/fail 和证据，尤其是表头关联、listSlot 顺序、Banner/Modal 公告、Skeleton 仅读一次、过滤 chip 和 load-more 状态。axe、AX snapshot、DOM focus 不替代真实读屏。

## 边界

- 未执行 BestSourcing 生产页面验证。
- 未执行 VoiceOver/NVDA 语音验收。
- 未进入 P7，未 push、merge 或 npm publish。
