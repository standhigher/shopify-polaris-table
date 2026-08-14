---
id: intro
slug: /
sidebar_position: 1
title: Shopify Polaris Table
---

使用 Shopify Polaris 构建受控、服务端驱动的数据表格。该包根据应用管理的 query、数据、选择状态和格式化状态来渲染表格；它不会假定后端、路由、租户模型或持久化方案。

## 从这里开始

1. [安装包](./getting-started/installation)，并将页面置于 Polaris `AppProvider` 之下。
2. 通过显式的 query、数据、选择和格式化状态构建你的[第一个受控表格](./getting-started/first-table)。
3. 在添加筛选或操作前，先实现[服务端 offset 契约](./guides/server-side-offset-pagination)。

## 版本与层次

- **V1** 提供 `Table`、类型化 offset query、列、格式化、筛选、选择和操作。
- **V2** 增加 URL query 序列化、列显隐、已保存视图、筛选预设和面向领域的预设。
- **V3** 提供按需使用的 cursor、虚拟窗口、列布局、可展开行和行内编辑状态辅助函数。
- **V4** 提供 UI 无关的 core schema/query/action 契约与 Polaris renderer adapter。

英文页面是规范性的公开契约。后端 endpoint、授权校验和持久化实现仍由应用自行负责。
