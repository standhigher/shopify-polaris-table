# Changelog

All notable changes to this project are documented in this file.

This project follows [Semantic Versioning](https://semver.org/). Release notes use the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) categories where applicable.

## [Unreleased]

No unreleased changes.

## [1.1.0] - 2026-09-09

### Added

- Added Storybook Docs, axe-based accessibility checks, and 320px, 375px, and 768px responsive preview presets.
- Added English-first Storybook language switching with Simplified Chinese preview copy for key component and internal-experiment scenarios.
- Added controlled Storybook examples for `TableColumnVisibility`, `TableFilterPresets`, and `TableViews`, plus Table and Extension Table playground controls.
- Added Extension Table state coverage for loading, empty, retry, Load More failure, and row-action failure, and added host-overridable `ExtensionTableLabels` for built-in UI copy.
- Added a bilingual StandHigher product-discovery section and website page for BestTrack, BestUpsell, BestFeed AI, and BestBundle.

### Changed

- Reorganized Storybook navigation around components, integration features, presets, advanced helpers, and explicitly labeled internal experiments.

## [1.0.0] - 2026-09-09

### Added

- Added the official `@standhigher/polaris-data-table/extension` entrypoint, so Extension-only consumers can use `ExtensionTable` without installing the Admin Polaris renderer.
- Added a documented API stability/support policy, compatibility matrix, and Node.js 20/22/24 CI verification matrix.
- Added packed-consumer verification for Polaris 12/13 Admin consumers and Polaris-free Extension consumers.

### Changed

- Formalized the public package boundary: only the root and `/extension` entrypoints are supported; internal experiments are excluded from the npm tarball.
- Declared Node.js 20+, React 18, and Polaris 12/13 as the supported compatibility baseline. React 19 and Polaris 14 are excluded because the currently published Polaris React majors require React 18 and Polaris 14 is not published.

## [0.8.0] - 2026-09-09

### Added

- Added internal, non-exported POCs for virtual scrolling, sticky header/edge columns, controlled column resize/reorder, expandable rows with versioned inline editing, and cursor-based Load More.
- Added focused React tests, Storybook scenarios, acceptance records, rollback guidance, and a cross-POC validation matrix for the 0.8 experiments.

### Changed

- Recorded local Chrome and Safari validation for the POCs, including bounded 10,000-row virtual-window scrolling and Safari sticky, layout, editing, and cursor interaction checks.
- These experiments remain outside the package public entrypoint; real host, assistive-technology, performance-trace, and server-contract validation remain required before any stable API proposal.

## [0.7.0] - 2026-09-09

### Added

- Added `ExtensionTable`, a standalone narrow-host renderer with a three-column maximum and no dependency on Admin URL state, Saved Views, bulk selection, filters, or V1 offset pagination.
- Added explicit Extension host locale, time zone, shop context, and capability flags for safe read-only, single-selection, row-action, and Load More degradation.
- Added loading, empty, error, retry, action-failure, and Load More failure states; Storybook coverage; and English/Chinese Extension integration guidance.

## [0.6.1] - 2026-09-09

### Added

- Added versioned, allowlisted URL query-state helpers and a router-independent History API example for restoring query state on refresh, back, and forward navigation.
- Added controlled `TableViews` and `TableFilterPresets` components for saved-view workflows and filter-only shortcuts.
- Added overridable table UI labels and formatter-preset overrides for money, date-time, and status formatting.

### Changed

- Consolidated the roadmap into continuous `0.6.x` and `0.7.x` development tracks rather than preassigning work to individual patch versions.

## [0.6.0] - 2026-09-09

### Added

- Added controlled column visibility to `Table` with `visibleColumnKeys`, `onVisibleColumnsChange`, and `requiredColumnKeys`.
- Added the accessible `TableColumnVisibility` control for showing, hiding, and resetting declared columns.
- Added schema reconciliation for stale visibility preferences, including invalid keys, required columns, and hidden sort/filter fields.
- Added column-visibility Storybook coverage and English/Chinese usage documentation.

## [0.5.0] - 2026-09-04

### Changed

- Completed the 0.5 Admin table stability pass for typed filter controls, including partial date ranges and definition-driven operator allowlists.
- Isolated row actions from row selection and preserved `ReactNode` action content in the Actions column.
- Added bulk-action feedback for completed, partial-failure, accepted, rejected, and expired-selection states, with per-invocation idempotency keys.
- Added controlled table-state labels for loading, error retry, empty, selection-expired, and pagination copy.

## [0.4.0] - 2026-08-14

### Added

- Added Storybook overview entries for Components, Features, Presets, and Advanced groups.
- Added richer Storybook sample navigation so every top-level group leads with a visible example, not only configuration-oriented stories.

### Changed

- Reordered the Storybook sidebar to `Components`, `Features`, `Presets`, and `Advanced`.
- Expanded Storybook mock datasets to 50 rows for every published domain example.
- Redirected the documentation homepage to the Storybook `Presets / OrderTable` example.

## [0.3.0] - 2026-08-14

### Added

- Added CampaignTable and OfferTable preset column factories.
- Expanded Storybook examples for all domain presets, table states, selection, query state, V3 helpers, and V4 schema/adapter usage.
- Added Storybook coverage tests to guard the published example set.

## [0.2.1] - 2026-08-14

### Changed

- Clarified manual npm publishing with interactive web authentication.
- Added GitHub Pages verification guidance and Pages workflow configuration.

## [0.2.0] - 2026-08-14

### Added

- Initial public release of the controlled Polaris data-table library.
- Controlled server-side querying with offset pagination, typed filters and sorting.
- Cell formatting, selection and bulk-action primitives, URL query helpers, views and presets.
- Advanced V3 state primitives and V4 core-schema/Polaris-renderer adapter.
- Public documentation, Storybook preview, API reference, and GitHub Pages deployment.

[Unreleased]: https://github.com/standhigher/shopify-polaris-table/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/standhigher/shopify-polaris-table/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/standhigher/shopify-polaris-table/compare/v0.8.0...v1.0.0
[0.8.0]: https://github.com/standhigher/shopify-polaris-table/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/standhigher/shopify-polaris-table/compare/v0.6.1...v0.7.0
[0.6.1]: https://github.com/standhigher/shopify-polaris-table/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/standhigher/shopify-polaris-table/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/standhigher/shopify-polaris-table/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/standhigher/shopify-polaris-table/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/standhigher/shopify-polaris-table/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/standhigher/shopify-polaris-table/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/standhigher/shopify-polaris-table/releases/tag/v0.2.0
