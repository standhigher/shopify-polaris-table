# Polaris Data Table

[![npm version](https://img.shields.io/npm/v/%40standhigher%2Fpolaris-data-table?style=flat-square)](https://www.npmjs.com/package/@standhigher/polaris-data-table)
[![npm downloads](https://img.shields.io/npm/dm/%40standhigher%2Fpolaris-data-table?style=flat-square)](https://www.npmjs.com/package/@standhigher/polaris-data-table)
[![CI](https://github.com/standhigher/shopify-polaris-table/actions/workflows/ci.yml/badge.svg)](https://github.com/standhigher/shopify-polaris-table/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Documentation](https://img.shields.io/badge/docs-GitHub%20Pages-222?style=flat-square&logo=githubpages)](https://standhigher.github.io/shopify-polaris-table/)
[![Storybook](https://img.shields.io/badge/Storybook-preview-FF4785?style=flat-square&logo=storybook&logoColor=white)](https://standhigher.github.io/shopify-polaris-table/storybook/)

**中文** · [English](README.md)

`@standhigher/polaris-data-table` 是用于 Shopify Polaris 应用的受控、服务端驱动数据表格基础组件。

它提供熟悉的 Polaris 表格界面，同时由你的应用掌控数据请求、查询状态、权限、URL 状态和持久化。

## 链接

- [npm 包](https://www.npmjs.com/package/@standhigher/polaris-data-table)
- [GitHub 仓库](https://github.com/standhigher/shopify-polaris-table)
- [文档](https://standhigher.github.io/shopify-polaris-table/)
- [Storybook 示例](https://standhigher.github.io/shopify-polaris-table/storybook/)
- [API Reference](https://standhigher.github.io/shopify-polaris-table/api/)
- [使用指南](https://standhigher.github.io/shopify-polaris-table/getting-started/first-table)
- [更新日志](https://github.com/standhigher/shopify-polaris-table/blob/main/CHANGELOG.md)

## 安装

```bash
npm install @standhigher/polaris-data-table @shopify/polaris react react-dom
```

该表格需要 `@shopify/polaris >=12 <15`、React 18 或更高版本，以及 React DOM 18 或更高版本。请在 Polaris `AppProvider` 下渲染表格；详见[安装指南](https://standhigher.github.io/shopify-polaris-table/getting-started/installation)。

## 基础用法

`Table` 是受控组件。请在拥有该表格的页面中保留当前 query、分页数据与 selection。

```tsx
import {useState} from 'react';
import {
  Table,
  type TableDataPage,
  type TableQuery,
  type TableSelection,
} from '@standhigher/polaris-data-table';

type Product = {
  id: string;
  title: string;
  price: number;
  currencyCode: string;
  createdAt: string;
};

export function ProductsTable({page}: {page: TableDataPage<Product>}) {
  const [query, setQuery] = useState<TableQuery>({page: 1, pageSize: 25});
  const [selection, setSelection] = useState<TableSelection>({
    mode: 'explicit',
    ids: [],
  });

  return (
    <Table
      columns={[
        {key: 'title', title: 'Product', sortable: true},
        {
          key: 'price',
          title: 'Price',
          type: 'money',
          currencyCode: (product: Product) => product.currencyCode,
        },
        {key: 'createdAt', title: 'Created', type: 'datetime'},
      ]}
      data={page.data}
      rowId="id"
      query={query}
      pagination={{total: page.total}}
      formatOptions={{
        locale: 'en-US',
        timeZone: 'America/New_York',
        defaultCurrencyCode: 'USD',
      }}
      selection={selection}
      onSelectionChange={setSelection}
      onQueryChange={setQuery}
    />
  );
}
```

当 `onQueryChange` 收到新的 query 时，在服务端加载对应分页，并将返回的 `{data, total}` 传回 `Table`。完整数据流约定见[第一个受控表格](https://standhigher.github.io/shopify-polaris-table/getting-started/first-table)。

## 能力概览

| 范畴 | 提供的能力 |
| --- | --- |
| 受控 query 与分页 | 基于页码、兼容 offset 的分页；带类型的 search、sort 与 filter 状态。 |
| Polaris 列与格式化 | text、number、money、status、date/time、image、actions 和 custom renderer。 |
| Selection 与批量操作 | 显式 selection，或由服务端签发且绑定 query 的跨页 selection token。 |
| URL 状态与视图 | query 编解码、可见列状态、filter preset 和 saved-view 辅助工具。 |
| 高级表格基础能力 | cursor 数据模型、虚拟窗口、列布局、展开行与行内编辑状态。 |
| 渲染器抽象 | 框架无关的 core schema 与 Polaris renderer adapter。 |

## 兼容性

| 依赖 | 支持版本 |
| --- | --- |
| Node.js | 20 或更高（开发和 CI） |
| React / React DOM | 18 或更高 |
| `@shopify/polaris` | `>=12 <15` |

本包仅支持 ESM，并发布 TypeScript 类型声明。peer dependencies 不会被打包进产物。

## 示例、Storybook 与演示

- 浏览交互式 [Storybook 示例](https://standhigher.github.io/shopify-polaris-table/storybook/)。
- 阅读 [server query example](https://standhigher.github.io/shopify-polaris-table/examples/server-query)，了解 offset 分页和格式化。
- 阅读 [selection and bulk actions example](https://standhigher.github.io/shopify-polaris-table/examples/selection-and-actions)，了解服务端 selection token。
- 使用 [API Reference](https://standhigher.github.io/shopify-polaris-table/api/) 查阅导出的类型和函数。

## 包质量

每次修改均由 CI 运行测试、类型检查、lint、包入口验证、生产构建、Storybook 构建和 `npm pack --dry-run`。

提交 Pull Request 前，请运行：

```bash
npm run lint
npm test
npm run typecheck
npm run build
npm run build-storybook
npm run docs:build
npm pack --dry-run --registry=https://registry.npmjs.org/
```

## 本地开发

```bash
git clone https://github.com/standhigher/shopify-polaris-table.git
cd shopify-polaris-table
npm ci
npm run docs:start
```

使用 `npm test` 运行测试，使用 `npm run build-storybook` 生成预览，使用 `npm run docs:build` 生成完整文档站。贡献要求请见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 发布准备

发布只能从已合并的 `main` 进行。发布前验证包内容与全部检查：

```bash
npm run release:check
npm login --auth-type=web --registry=https://registry.npmjs.org/
npm publish --access public --tag latest --registry=https://registry.npmjs.org/
```

完整的 registry 检查、版本升级、annotated tag、预发布 tag 和发布后验证流程见[发布指南](docs/release.md)。

## 贡献与支持

欢迎贡献；开始前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)、[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) 与 [SECURITY.md](SECURITY.md)。可复现的问题请通过 [GitHub Issues](https://github.com/standhigher/shopify-polaris-table/issues) 反馈；安全漏洞请使用[私密安全公告](https://github.com/standhigher/shopify-polaris-table/security/advisories/new)。

## 许可证

[MIT](LICENSE) © StandHigher
