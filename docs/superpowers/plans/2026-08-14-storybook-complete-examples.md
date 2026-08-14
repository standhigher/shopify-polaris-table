# Storybook Complete Examples Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand Storybook so external developers can discover every preset table and the main table/query/selection/V3/V4 usage patterns.

**Architecture:** Keep library presets as exported, tested API when they represent reusable domains. Keep Storybook examples under `src/stories/` with small shared fixtures/helpers so each story remains readable and stable.

**Tech Stack:** TypeScript, React 18, Shopify Polaris, Storybook React/Vite, Vitest.

---

### Task 1: Add missing Campaign and Offer presets

**Files:**
- Create: `src/presets/campaign.ts`
- Create: `src/presets/offer.ts`
- Modify: `src/presets/domains.test.ts`
- Modify: `src/index.ts`

- [ ] Write failing tests that assert `createCampaignColumns` and `createOfferColumns` exist, have stable first columns, and accept overrides.
- [ ] Implement the minimal exported row types, override types, and column factories.
- [ ] Export the new factories and types from `src/index.ts`.
- [ ] Run `npm test src/presets/domains.test.ts src/index.test.ts`.

### Task 2: Split Storybook examples by topic

**Files:**
- Create: `src/stories/storyData.ts`
- Create: `src/stories/storyTableHelpers.tsx`
- Create: `src/stories/Presets.stories.tsx`
- Create: `src/stories/TableFeatures.stories.tsx`
- Create: `src/stories/Selection.stories.tsx`
- Create: `src/stories/QueryState.stories.tsx`
- Create: `src/stories/AdvancedV3.stories.tsx`
- Create: `src/stories/AdvancedV4.stories.tsx`
- Modify: `src/stories/Table.stories.tsx`

- [ ] Move shared mock data and controlled offset paging helpers into focused story helper files.
- [ ] Add `Presets/*` stories for Product, Order, Customer, Campaign, and Offer tables.
- [ ] Add `Components/Table/*` stories for server offset pagination, search/sort/filter protocols, loading/empty/error/retry, format warnings, and row actions.
- [ ] Add `Features/Selection/*` stories for explicit selection, all matching selection, exclusion, completed/accepted bulk results, and expired token state.
- [ ] Add `Features/Query State/*` stories for URL query encoding, saved views, filter presets, and visible columns.
- [ ] Add `Advanced/V3/*` stories for cursor infinite state, virtual window, column layout, expandable rows, and inline edit state.
- [ ] Add `Advanced/V4/*` stories for core schema, core query normalization, Polaris adapter, and adapter validation.

### Task 3: Verify Storybook coverage

**Files:**
- Modify: `src/stories/storybook-config.test.ts`

- [ ] Add a test that imports Storybook index expectations or statically checks all required story files exist.
- [ ] Run `npm test src/stories/storybook-config.test.ts`.
- [ ] Run `npm run build-storybook`.
- [ ] Run `npm run docs:build`.

### Task 4: Final release-quality verification

**Files:**
- No source changes expected.

- [ ] Run `git diff --check`.
- [ ] Run `npm run lint`.
- [ ] Run `npm test`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] Run `npm run build-storybook`.
- [ ] Commit and push `codex/storybook-complete-examples`.
