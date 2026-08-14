# Public Release Metadata Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a release-ready `@standhigher/polaris-data-table@0.2.0` package with clear public repository information, Storybook preview, and a pull-request-first release process.

**Architecture:** Keep the existing TypeScript library build as the only npm runtime artifact and explicitly expose `dist/index.js` plus its declarations through package metadata. Add a small Storybook application whose static output is copied into the existing Docusaurus Pages artifact. Public README and collaboration documents are canonical Markdown files at the repository root, with a Simplified Chinese README companion.

**Tech Stack:** TypeScript, React 18, Shopify Polaris 13, Vitest, Storybook for React/Vite, Docusaurus, GitHub Actions, npmjs.

---

### Task 1: Make the npm package identity and artifact surface publishable

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.gitignore`
- Create: `LICENSE`
- Create: `src/packageMetadata.test-d.ts`

- [ ] **Step 1: Write a failing package entrypoint compile fixture**

Create `src/packageMetadata.test-d.ts` that imports the package through its root export and asserts the public `Table` and `TableQuery` declarations resolve. Run `npm run typecheck` before metadata changes and record the package-entry failure if `main`/`types`/`exports` are absent.

- [ ] **Step 2: Define the public package metadata**

Change `package.json` to these release identity values:

```json
{
  "name": "@standhigher/polaris-data-table",
  "version": "0.2.0",
  "description": "Controlled, server-driven data tables for Shopify Polaris applications.",
  "license": "MIT",
  "author": "StandHigher",
  "homepage": "https://github.com/standhigher/shopify-polaris-table#readme",
  "bugs": {"url": "https://github.com/standhigher/shopify-polaris-table/issues"},
  "repository": {"type": "git", "url": "git+https://github.com/standhigher/shopify-polaris-table.git"},
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {".": {"types": "./dist/index.d.ts", "import": "./dist/index.js"}},
  "files": ["dist", "README.md", "README.zh-CN.md", "LICENSE", "CHANGELOG.md"]
}
```

Use keywords covering `typescript`, `react`, `shopify`, `polaris`, `data-table`, `admin`, `ecommerce`, `server-driven`, `pagination`, `filtering`, `bulk-actions`, and `embedded-app`. Add scripts `build-storybook` and `release:check` without removing current developer scripts.

- [ ] **Step 3: Add MIT license and generated-output ignore rules**

Create the standard MIT text with `Copyright (c) 2026 StandHigher`. Add `.storybook-static/` and `website/static/storybook/` to `.gitignore` so Storybook output cannot enter commits.

- [ ] **Step 4: Regenerate metadata and verify package contents**

Run `npm install --package-lock-only --ignore-scripts`, `npm run build`, `npm run typecheck`, and `npm pack --dry-run --json --registry=https://registry.npmjs.org/`. Verify the resulting file list contains only `dist`, the two READMEs, `LICENSE`, `CHANGELOG.md`, and mandatory npm metadata files; it must not contain `src`, `examples`, `docs`, `website`, or `.github`.

- [ ] **Step 5: Commit package identity**

```bash
git add package.json package-lock.json .gitignore LICENSE src/packageMetadata.test-d.ts
git commit -m "chore: prepare public npm package metadata"
```

### Task 2: Add interactive Storybook examples and Pages integration

**Files:**
- Create: `.storybook/main.ts`
- Create: `.storybook/preview.tsx`
- Create: `src/stories/Table.stories.tsx`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/docs.yml`

- [ ] **Step 1: Write Storybook story input fixtures**

In `src/stories/Table.stories.tsx`, define typed sample rows and controlled query/selection state for a baseline table story. Add stories named `ControlledTable`, `LoadingAndEmptyState`, `Formatting`, and `SelectionAndBulkAction`; each renders the actual exported `Table` component rather than a mock.

- [ ] **Step 2: Configure Storybook with Polaris context**

Create `.storybook/main.ts` using `@storybook/react-vite` and source discovery `../src/**/*.stories.@(ts|tsx)`. Create `.storybook/preview.tsx` importing Polaris styles and wrapping each story in `AppProvider` with the English Polaris locale.

- [ ] **Step 3: Add deterministic static build scripts**

Install the required Storybook/Vite dev dependencies. Set:

```json
{
  "scripts": {
    "build-storybook": "storybook build --output-dir website/static/storybook",
    "release:check": "npm run lint && npm run test && npm run typecheck && npm run build && npm run build-storybook && npm run docs:build && npm pack --dry-run --registry=https://registry.npmjs.org/"
  }
}
```

Make `docs:build` run `build-storybook` before Docusaurus so the Pages artifact includes `/storybook/`.

- [ ] **Step 4: Verify the static Storybook output**

Run `npm run build-storybook`; check `website/static/storybook/index.html` exists and is ignored by git. Run `npm run docs:build`; check `website/build/storybook/index.html` exists.

- [ ] **Step 5: Make CI and Pages validate the demo**

Add `npm run build-storybook` and `npm pack --dry-run --registry=https://registry.npmjs.org/` to CI. Keep Pages deployment PR-safe: pull requests build but do not deploy; `main` builds Storybook as part of docs and uploads one Pages artifact.

- [ ] **Step 6: Commit Storybook**

```bash
git add .storybook src/stories package.json package-lock.json .github/workflows .gitignore
git commit -m "feat: add storybook preview and release checks"
```

### Task 3: Publish-quality README and repository collaboration surface

**Files:**
- Modify: `README.md`
- Create: `README.zh-CN.md`
- Create: `CHANGELOG.md`
- Create: `CONTRIBUTING.md`
- Create: `SECURITY.md`
- Create: `CODE_OF_CONDUCT.md`
- Create: `docs/release.md`
- Create: `.github/ISSUE_TEMPLATE/bug_report.yml`
- Create: `.github/ISSUE_TEMPLATE/feature_request.yml`
- Create: `.github/ISSUE_TEMPLATE/config.yml`
- Create: `.github/pull_request_template.md`

- [ ] **Step 1: Replace the English README with the npm landing page**

Use Shields badges for npm version/downloads, CI, MIT license, documentation, and Storybook. Link every badge and the Links section to the new package name, the public repository, published Pages docs, `/storybook/`, API reference, usage guide, and changelog. Include the installation command:

```bash
npm install @standhigher/polaris-data-table @shopify/polaris react react-dom
```

Use a complete controlled `Table` example imported from the new package name. Document feature overview, peer-dependency compatibility, examples/demo, quality commands, local development, and release preparation.

- [ ] **Step 2: Create a matched Chinese README**

Translate every explanatory README section while preserving package names, commands, links, API symbols, JSON fields, and code. Add language links at the top of both README files.

- [ ] **Step 3: Add public collaboration documents**

Write a Keep-a-Changelog-style `CHANGELOG.md` beginning with `0.2.0`, a concise contribution guide with setup/test/PR expectations, a security policy directing reports to GitHub private vulnerability reporting or repository maintainers without promising an SLA, and a Contributor Covenant-derived code of conduct. Create YAML issue forms requiring reproducible, non-sensitive reports and a PR template covering change/test/checklist fields.

- [ ] **Step 4: Add release instructions**

Create `docs/release.md` documenting official-registry lookup, `npm pack --dry-run`, web login, public access publishing, `latest` versus `next`, annotated `vX.Y.Z` tags, full preflight commands, and the rule that npm publish happens only from merged `main`.

- [ ] **Step 5: Validate Markdown links and public-content boundary**

Run `npm run docs:build`; use `rg` to confirm no private endpoints, credentials, Feishu URLs, or internal hostnames appear in new public files. Verify all README badge URLs and relative links resolve to intended public paths.

- [ ] **Step 6: Commit public documentation**

```bash
git add README.md README.zh-CN.md CHANGELOG.md CONTRIBUTING.md SECURITY.md CODE_OF_CONDUCT.md docs/release.md .github
git commit -m "docs: add public package and contribution information"
```

### Task 4: Final release-candidate verification and pull request handoff

**Files:**
- Modify: documentation or configuration files only if a release check reports a concrete failure.

- [ ] **Step 1: Run all requested release checks**

```bash
git diff --check
npm run lint
npm run test
npm run typecheck
npm run build
npm run build-storybook
npm run docs:build
npm pack --dry-run --registry=https://registry.npmjs.org/
```

Expected result: all commands exit 0, Storybook is included in the Pages build but excluded from git and npm, and the npm dry-run file list is limited to the allowlist.

- [ ] **Step 2: Inspect release metadata**

Run:

```bash
npm view @standhigher/polaris-data-table version --registry=https://registry.npmjs.org/ || true
node -e "const p=require('./package.json'); console.log(p.name, p.version, p.license, p.repository.url)"
```

Expected result: npmjs has no existing version before first publication, while local metadata reports `@standhigher/polaris-data-table 0.2.0 MIT` and the public repository URL.

- [ ] **Step 3: Commit final corrections and push the feature branch**

```bash
git add -A
git commit -m "chore: verify public release candidate"
git push -u origin codex/public-release-metadata
```

If SSH authentication is unavailable, authenticate GitHub using the web flow and switch `origin` to the repository HTTPS URL before retrying; do not force-push.

- [ ] **Step 4: Create the pull request**

Create a PR from `codex/public-release-metadata` to `main` titled `chore: prepare public npm release 0.2.0`, with summary bullets for package identity, Storybook/docs, and collaboration/release files; include the release check outputs in the PR test plan.

- [ ] **Step 5: Publish only after merge**

After the PR merges, update local `main`, rerun `npm run release:check`, create and push annotated tag `v0.2.0`, then use:

```bash
npm_config_registry=https://registry.npmjs.org npm login --auth-type=web
npm publish --access public --tag latest --registry=https://registry.npmjs.org/
```

Verify with `npm view @standhigher/polaris-data-table@0.2.0 version --registry=https://registry.npmjs.org/`.
