---
id: locale-currency-timezone
sidebar_position: 3
title: Locale, currency, and time zone
---

Formatting is deliberately application-owned. Pass a known `locale` and `timeZone` through `formatOptions`; use `defaultCurrencyCode` only as a documented fallback.

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

For money cells, the currency resolves in this order: row-level `column.currencyCode`, fixed `column.currencyCode`, then `formatOptions.defaultCurrencyCode`. If no valid code exists, the table formats the number without a currency and emits `onFormatWarning` with `reason: 'missing-currency-code'`.

Date-time cells use a column-specific `timeZone` when provided and otherwise use `formatOptions.timeZone`. Always send an explicit IANA time-zone identifier such as `Asia/Shanghai` or `America/New_York`; do not assume the browser zone represents a shop, account, or report zone.

`createFormatterPreset` and `shopifyFormatterPreset` produce deterministic formatter functions from the same explicit options. They do not fetch currency, locale, or timezone settings.
