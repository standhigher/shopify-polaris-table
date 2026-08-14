---
id: locale-currency-timezone
sidebar_position: 3
title: 语言区域、币种与时区
---

格式化刻意由应用负责。通过 `formatOptions` 传入确定的 `locale` 和 `timeZone`；仅将 `defaultCurrencyCode` 用作有文档说明的 fallback。

```tsx
<Table
  // other controlled props
  formatOptions={{
    locale: viewer.locale,
    timeZone: viewer.timeZone,
    defaultCurrencyCode: shop.currencyCode,
  }}
  columns={[
    {key: 'total', title: 'Total', type: 'money', currencyCode: (row) => row.currencyCode},
    {key: 'createdAt', title: 'Created', type: 'datetime', timeZone: 'UTC'},
  ]}
/>
```

对于 money cells，currency 按此顺序解析：row-level `column.currencyCode`、固定的 `column.currencyCode`，最后是 `formatOptions.defaultCurrencyCode`。如果没有有效 code，表格会将数字格式化为无币种形式，并通过 `onFormatWarning` 发出 `reason: 'missing-currency-code'`。

date-time cells 在提供时使用 column-specific `timeZone`，否则使用 `formatOptions.timeZone`。始终传入明确的 IANA time-zone identifier，例如 `Asia/Shanghai` 或 `America/New_York`；不要假定 browser zone 代表店铺、账户或报表时区。

`createFormatterPreset` 和 `shopifyFormatterPreset` 会从相同的显式 options 生成确定性的 formatter functions。它们不会获取 currency、locale 或 timezone settings。
