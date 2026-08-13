# @standhigher/shopify-polaris-table

Reusable, controlled data tables for Shopify embedded admin applications.

## Installation

```bash
npm install @standhigher/shopify-polaris-table @shopify/polaris react react-dom
```

The consuming app must load Polaris styles and wrap its UI in `AppProvider` with the shop locale.

## Offset query example

```tsx
import {AppProvider} from '@shopify/polaris';
import en from '@shopify/polaris/locales/en.json';
import {Table, type TableQuery} from '@standhigher/shopify-polaris-table';

const [query, setQuery] = useState<TableQuery>({page: 1, pageSize: 25});
const {data, total, loading, error, reload} = useProducts(query);

<AppProvider i18n={en}>
  <Table
    columns={columns}
    data={data}
    rowId="id"
    query={query}
    pagination={{total}}
    formatOptions={{locale: shop.locale, timeZone: shop.timeZone, defaultCurrencyCode: shop.currencyCode}}
    selection={{mode: 'explicit', ids: []}}
    onSelectionChange={setSelection}
    loading={loading}
    error={error?.message}
    onRetry={reload}
    onQueryChange={setQuery}
  />
</AppProvider>
```

`Table` never sends a request itself. The application receives a complete offset query through `onQueryChange`, loads `{data, total}`, and passes the result back.

## Query and selection contracts

- Offset pages are one-based. `total` is the number of records matching the current query.
- Filter values are JSON-safe typed conditions. Backend services must allowlist fields and operators.
- `formatOptions` is explicit so currency, locale, and time zone never depend on the browser.
- Cross-page selection uses a short-lived server-issued selection token. Bulk callbacks receive an idempotency key and must return the documented structured result.

## Development

```bash
npm install
npm test
npm run typecheck
npm run lint
npm run build
```
