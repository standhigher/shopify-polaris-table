---
id: installation
sidebar_position: 1
title: 安装
---

连同 peer dependencies 一起安装表格库：

```bash
npm install @standhigher/polaris-data-table @shopify/polaris react react-dom
```

Admin 入口支持 `@shopify/polaris >=12 <14`、React 18 和 React DOM 18。请让 Polaris 版本与应用其余部分保持一致。

仅使用 Extension 的应用可以只安装 React 和 React DOM，并从官方 Extension 入口导入：

```bash
npm install @standhigher/polaris-data-table react react-dom
```

```tsx
import {ExtensionTable} from '@standhigher/polaris-data-table/extension';
```

不支持源码路径或其他深层导入。

渲染表格前，请使用 Polaris provider 包裹应用页面：

```tsx
import {AppProvider} from '@shopify/polaris';
import enTranslations from '@shopify/polaris/locales/en.json';

export function App() {
  return <AppProvider i18n={enTranslations}>{/* routes and table screens */}</AppProvider>;
}
```

表格包不安装 data client 或 router。应用负责请求、认证、URL 集成和错误处理。接着阅读[第一个受控表格](./first-table)。

要本地预览文档，先在仓库根目录执行 `npm run docs:build`，再执行 `npm run docs:start`。公开站点设计为部署到 GitHub Pages，URL 格式为 `https://<organization>.github.io/<repository>/`；私有的运行文档会被刻意排除在构建产物之外。
