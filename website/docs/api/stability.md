---
id: api-stability
sidebar_position: 2
title: API stability and support policy
slug: /api/stability
---

The package root (`@standhigher/polaris-data-table`) is the only supported import path. This page records the 1.0 API-freeze boundary and the support level of each capability.

## Stable API candidates

The controlled V1 table API, formatters, selection primitives, URL-query codecs, views, filter presets, column-visibility controls, domain column factories, `ExtensionTable`, and the V4 Core/Polaris adapter contracts are public API candidates for 1.0. Their signatures and documented behavior need compatibility review before a 1.0 release.

## Advanced public helpers

The V3 cursor, virtual-window, column-layout, expandable-row, and inline-edit helpers are public pure-state helpers. They do not render UI, fetch data, or persist state. Until their host and accessibility contracts have production evidence, consumers should wrap them behind their own integration boundary and avoid treating them as complete table renderers.

## Internal experiments

Components under `src/experimental` and their Storybook scenarios are internal validation artifacts. They are neither root exports nor npm package contents. Their purpose is to collect implementation and accessibility evidence for a future opt-in API; they may be changed or removed without a migration path.

## Compatibility commitment

Before 1.0, every public root export must have a documented support level, a consumer-package test, and a migration note for any breaking change. Internal experiments and undocumented deep imports are not covered by this commitment.
