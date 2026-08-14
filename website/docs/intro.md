---
id: intro
slug: /
sidebar_position: 1
title: Shopify Polaris Table
---

Build controlled, server-driven tables with Shopify Polaris. The package renders a table from application-owned query, data, selection, and formatting state; it never assumes a backend, router, tenant model, or persistence layer.

## Start here

1. [Install the package](./getting-started/installation) and put your screen below Polaris `AppProvider`.
2. Build a [first controlled table](./getting-started/first-table) with explicit query, data, selection, and formatting state.
3. Implement the [server-side offset contract](./guides/server-side-offset-pagination) before adding filters or actions.

## Versions and layers

- **V1** provides `Table`, typed offset queries, columns, formatting, filtering, selection, and actions.
- **V2** adds URL query serialization, column visibility, saved views, filter presets, and domain-oriented presets.
- **V3** exposes opt-in cursor, virtual-window, column-layout, expandable-row, and inline-edit state helpers.
- **V4** exposes UI-neutral core schema/query/action contracts and a Polaris renderer adapter.

The English pages are the normative public contract. Backend endpoints, authorization checks, and persistence implementations remain application-owned.
