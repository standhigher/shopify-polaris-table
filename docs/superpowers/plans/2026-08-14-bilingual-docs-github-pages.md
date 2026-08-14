# Bilingual Docs GitHub Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an English-default, Simplified-Chinese documentation site with generated TypeDoc API reference and GitHub Pages deployment for `@standhigher/shopify-polaris-table`.

**Architecture:** Keep repository examples as the single code source. Add a Docusaurus site under `website/`, use English docs as the normative content and Docusaurus locale files for Chinese translations, and generate API Markdown from the package entry point into the site during the docs build. A GitHub Actions workflow builds and deploys only the public site; no internal documentation is copied into the published tree.

**Tech Stack:** Docusaurus 3, TypeDoc, typedoc-plugin-markdown, React, TypeScript, GitHub Actions, GitHub Pages.

---

### Task 1: Documentation site toolchain and configuration

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `website/package.json`
- Create: `website/docusaurus.config.ts`
- Create: `website/sidebars.ts`
- Create: `website/tsconfig.json`
- Create: `website/src/css/custom.css`
- Create: `website/static/.nojekyll`
- Create: `website/docs/api/reference/.gitkeep`

- [ ] **Step 1: Add the documentation workspace dependencies and scripts**

Add a `website` package with Docusaurus, the classic preset, TypeScript support, and TypeDoc Markdown generation. Add root scripts that run the library build, API generation, and Docusaurus build in a deterministic order:

```json
{
  "scripts": {
    "docs:api": "typedoc --options website/typedoc.json",
    "docs:build": "npm run build && npm run docs:api && npm --prefix website run build",
    "docs:start": "npm --prefix website run start"
  }
}
```

The website package must pin compatible Docusaurus 3 packages and expose `start`, `build`, `serve`, and `typecheck` scripts.

- [ ] **Step 2: Configure Docusaurus for English default and Chinese locale**

Set `i18n.defaultLocale` to `en` and `locales` to `['en', 'zh-CN']`. Configure the GitHub Pages `url`, repository `organizationName`, `projectName`, `baseUrl`, broken-link errors, Prism languages for TypeScript/TSX/JSON/Bash, and a navbar language dropdown. Configure the docs plugin to use `website/docs`, generated API files, and `website/sidebars.ts`.

- [ ] **Step 3: Configure TypeDoc generation**

Create `website/typedoc.json` with entry point `src/index.ts`, `tsconfig.json` from the repository, Markdown output under `website/docs/api/reference`, and options that keep exported types/functions while excluding tests and private members. Generated pages must use stable filenames and be safe to regenerate in CI.

- [ ] **Step 4: Add minimal site styling and static Pages support**

Create `website/src/css/custom.css` with only readable content width, code-block sizing, and a small table-contract callout style. Add `website/static/.nojekyll` so GitHub Pages does not rewrite generated paths.

- [ ] **Step 5: Run the site typecheck and local build**

Run `npm install`, `npm run docs:api`, and `npm run docs:build` from the repository root. Expected result: TypeDoc emits reference pages and Docusaurus produces `website/build` without broken-link errors.

- [ ] **Step 6: Commit the toolchain**

```bash
git add package.json package-lock.json website
git commit -m "docs: scaffold bilingual docusaurus site"
```

### Task 2: English content, examples, and API guidance

**Files:**
- Modify: `README.md`
- Create: `website/docs/intro.md`
- Create: `website/docs/getting-started/installation.md`
- Create: `website/docs/getting-started/first-table.md`
- Create: `website/docs/guides/server-side-offset-pagination.md`
- Create: `website/docs/guides/filters-and-query-contract.md`
- Create: `website/docs/guides/locale-currency-timezone.md`
- Create: `website/docs/guides/selection-and-bulk-actions.md`
- Create: `website/docs/guides/url-state-saved-views-presets.md`
- Create: `website/docs/guides/advanced-v3-v4.md`
- Create: `website/docs/examples/server-query.md`
- Create: `website/docs/examples/selection-and-actions.md`
- Create: `website/docs/api/index.md`

- [ ] **Step 1: Replace the README with an English quick start**

Keep installation, the smallest controlled-table example, the offset/filter/format/selection contracts, development commands, and a link to the docs site. Do not duplicate the complete guide content in the README.

- [ ] **Step 2: Write the getting-started pages**

`installation.md` documents peer dependencies and Polaris `AppProvider`. `first-table.md` uses a complete `TableQuery`, `TableDataPage`, explicit selection state, and `formatOptions` with a fixed locale/time zone. Link to the real repository example files instead of inventing a second implementation.

- [ ] **Step 3: Write the contract guides**

Document the exact V1–V4 semantics already implemented in the package. Include request/response examples for one-based offset pagination, allowlisted typed filters, application-supplied locale/currency/time zone, query-bound selection tokens, idempotency keys, URL encoding, saved views, V3 cursor/virtual APIs, and V4 core/renderer adapters.

- [ ] **Step 4: Write example pages around user tasks**

Explain when to use `server-side-query.tsx` and `selection-and-actions.tsx`, show the API surface used by each, and include copyable excerpts. Mark backend functions such as `createSelectionToken` and `archiveOrders` as application-owned integrations.

- [ ] **Step 5: Add the hand-written API index**

Group exports into Table/query, columns/formatters, selection/actions, URL state/views/presets, V3, and V4. Link to generated TypeDoc pages and explicitly call out behavioural rules that are not visible from signatures.

- [ ] **Step 6: Validate all English links and examples**

Run `npm run docs:build`. Confirm every local Markdown link resolves, every referenced example path exists, and the build fails on a broken link.

- [ ] **Step 7: Commit English content**

```bash
git add README.md website/docs
git commit -m "docs: add english guides and api usage examples"
```

### Task 3: Simplified Chinese locale and GitHub Pages workflow

**Files:**
- Create: `website/i18n/zh-CN/docusaurus-plugin-content-docs/current/intro.md`
- Create: `website/i18n/zh-CN/docusaurus-plugin-content-docs/current/getting-started/installation.md`
- Create: `website/i18n/zh-CN/docusaurus-plugin-content-docs/current/getting-started/first-table.md`
- Create: `website/i18n/zh-CN/docusaurus-plugin-content-docs/current/guides/server-side-offset-pagination.md`
- Create: `website/i18n/zh-CN/docusaurus-plugin-content-docs/current/guides/filters-and-query-contract.md`
- Create: `website/i18n/zh-CN/docusaurus-plugin-content-docs/current/guides/locale-currency-timezone.md`
- Create: `website/i18n/zh-CN/docusaurus-plugin-content-docs/current/guides/selection-and-bulk-actions.md`
- Create: `website/i18n/zh-CN/docusaurus-plugin-content-docs/current/guides/url-state-saved-views-presets.md`
- Create: `website/i18n/zh-CN/docusaurus-plugin-content-docs/current/guides/advanced-v3-v4.md`
- Create: `website/i18n/zh-CN/docusaurus-plugin-content-docs/current/examples/server-query.md`
- Create: `website/i18n/zh-CN/docusaurus-plugin-content-docs/current/examples/selection-and-actions.md`
- Create: `website/i18n/zh-CN/docusaurus-plugin-content-docs/current/api/index.md`
- Create: `website/i18n/zh-CN/docusaurus-plugin-content-docs/current.json`
- Create: `.github/workflows/docs.yml`

- [ ] **Step 1: Add Chinese translations with identical document IDs**

Translate explanatory prose, headings, labels, and admonitions. Keep TypeScript code, API symbols, paths, URLs, and JSON field names unchanged. Keep the same frontmatter IDs and sidebar order as English.

- [ ] **Step 2: Configure locale labels and translated navbar text**

Add `current.json` translations for site title, tagline, navbar labels, footer labels, and language names. The default root remains English; `/zh-CN/` is the Chinese site.

- [ ] **Step 3: Add the GitHub Pages workflow**

Create a least-privilege workflow triggered by pushes to the default branch and manual dispatch. Use `actions/checkout`, `actions/setup-node` with npm cache, `npm ci`, `npm run docs:build`, `actions/upload-pages-artifact` with `website/build`, and `actions/deploy-pages`. Grant only `contents: read`, `pages: write`, and `id-token: write` as needed. Pull requests run build validation without deployment.

- [ ] **Step 4: Add a repository link and deployment notes**

Document the Pages URL pattern and local preview commands in the English and Chinese getting-started pages. State that internal Feishu documents are intentionally excluded from the public build.

- [ ] **Step 5: Build both locales and inspect the output**

Run `npm run docs:build`, then serve `website/build` and verify `/`, `/zh-CN/`, the language switcher, generated API links, and the two example pages. Expected result: both locales render and no broken-link warnings are emitted.

- [ ] **Step 6: Commit locale and deployment support**

```bash
git add website/i18n .github/workflows/docs.yml website/docs README.md
git commit -m "docs: add chinese locale and github pages deployment"
```

### Task 4: Final repository verification and handoff

**Files:**
- Modify: `package.json` only if the final verification exposes a script mismatch.
- Modify: documentation files only if link or locale checks expose an issue.

- [ ] **Step 1: Run the complete validation suite**

Run `npm test -- --reporter=dot`, `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run docs:build`. All commands must pass.

- [ ] **Step 2: Check generated-site cleanliness**

Run `git status --short` and confirm generated `website/build` and TypeDoc output are ignored or intentionally excluded from commits. Confirm no internal-only paths, tokens, or Feishu links are present in public docs.

- [ ] **Step 3: Commit any final fixes**

```bash
git add .
git commit -m "docs: verify github pages documentation build"
```

- [ ] **Step 4: Report the branch and local preview commands**

Provide the branch name, key files, validation results, and commands:

```bash
npm run docs:build
npm --prefix website run start
```
