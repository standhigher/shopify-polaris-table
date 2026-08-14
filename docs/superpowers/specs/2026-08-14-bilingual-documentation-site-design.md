# Bilingual Documentation Site Design

## Goal

Publish a GitHub Pages documentation site for `@standhigher/shopify-polaris-table` with English as the default language, Simplified Chinese as a translation, task-focused examples, and generated API reference material.

## Audience and publication boundary

The public site serves package consumers and open-source contributors. It contains installation, API reference, runnable-copyable examples, and generic integration contracts. Internal business endpoints, credentials, tenant-specific field mappings, and operational procedures are not published. Those remain in Feishu or another access-controlled internal system.

## Architecture

Use Docusaurus as a static documentation application in `website/`.

- GitHub Pages serves the generated `website/build` output.
- English is the default locale and uses the root route. Simplified Chinese is exposed at `/zh-CN/` through the standard language selector.
- Documentation prose is stored in `website/docs/` for English and `website/i18n/zh-CN/docusaurus-plugin-content-docs/current/` for Chinese translations.
- API source documentation is generated from TypeScript declarations by TypeDoc into `website/docs/api/reference/`. A hand-written API overview links to the generated pages and records behavioural contracts that types alone cannot explain.
- Example source remains in the repository `examples/` directory. Documentation pages link to those source files and include short, copyable fragments. API symbols and all code remain English in both locales.

## Navigation

The English and Chinese documentation trees share the same information architecture:

1. Getting started: installation, Polaris provider setup, first controlled table.
2. Guides: server-side offset querying; filter value protocol; locale, currency, and time-zone formatting; selection tokens and bulk-action idempotency; URL state, saved views, and presets; V3/V4 advanced capabilities.
3. Examples: server query and selection/bulk action source examples, with links to the matching repository file.
4. API: a hand-written index plus generated TypeDoc reference.

The landing page is English and directs readers to the starter guide and server-query example. The Chinese home page provides the same paths in Chinese.

## Documentation contracts

- Offset pagination is one-based and uses `page` plus `pageSize`; applications supply matching `data` and `total`.
- Filter values are JSON-safe typed conditions. Backends must allowlist filter fields and operators.
- Format inputs come from the application context (`locale`, `timeZone`, `defaultCurrencyCode`), not the browser.
- A cross-page selection is represented by a server-issued, query-bound, short-lived `selectionToken`; it does not transfer an unbounded list of IDs to the browser.
- Bulk requests include a client-generated idempotency key, and the service returns structured success/failure results.

## Localization policy

English Markdown is the normative source. Chinese Markdown translates explanations and headings while retaining package names, export names, type names, property names, URLs, and code exactly as written in English. A translation can temporarily lag an English update, but must retain its source page identity and show a localized page description rather than changing technical meaning.

## Deployment and validation

GitHub Actions runs on pushes to the default branch and manual dispatch. It installs dependencies with `npm ci`, builds the library, generates API reference, builds the Docusaurus site, and deploys the resulting Pages artifact using `actions/deploy-pages`. Pull requests run the same build without deployment. The documentation build must fail for broken internal links, broken generated API links, or a missing locale counterpart for required top-level pages.

## Scope exclusions

This change does not publish private business contracts, create a custom domain, add analytics, or build an interactive hosted application demo. Code snippets are repository examples intended for copy-and-adapt usage.
