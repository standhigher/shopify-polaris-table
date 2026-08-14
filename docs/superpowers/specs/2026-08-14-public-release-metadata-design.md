# Public Release Metadata Design

## Goal

Prepare `@standhigher/polaris-data-table` version `0.2.0` for a public npm release and a GitHub pull request by making its package metadata, repository documentation, Storybook demo, release guide, and contribution surface clear to external developers.

## Public identity

- Package: `@standhigher/polaris-data-table`
- Repository: `https://github.com/standhigher/shopify-polaris-table`
- License: MIT
- Stable release tag: `latest`
- Pre-release tag: `next`
- Documentation: `https://standhigher.github.io/shopify-polaris-table/`
- Storybook: `https://standhigher.github.io/shopify-polaris-table/storybook/`

The existing `@standhigher/shopify-polaris-table` name is not published on npmjs. The new package name is also unclaimed, so `0.2.0` is the first public release of the selected identity.

## Package contents and metadata

The root package remains the library package. `package.json` receives a concise public description, repository/homepage/bugs links, maintainer author information, MIT license, domain-and-ecosystem keywords, and a restrictive `files` allowlist containing the compiled library and top-level public artifacts. Workspace, test, documentation, and Storybook source files do not go into the tarball.

The library version becomes `0.2.0`. The lockfile follows the package metadata update. Type declarations, JavaScript build output, `README.md`, `README.zh-CN.md`, `LICENSE`, and `CHANGELOG.md` are published alongside the package output.

## Developer-facing documentation

The English README is the canonical npm landing page. It contains standard badges, a short purpose statement, resource links, install and basic controlled-table usage, feature overview, compatibility range, links to examples/Storybook/docs, quality checks, local development, and release preparation.

`README.zh-CN.md` is a complete Chinese companion. The two files preserve code and API names, while prose and navigation labels are localized. Badge and link URLs use the new npm package name and the public GitHub repository.

The public repository adds concise `CHANGELOG.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, and release documentation. GitHub issue and pull request templates collect reproducible information without requesting private tenant, customer, credential, or service details.

## Storybook and Pages

Add a minimal Storybook configuration with a Polaris `AppProvider` decorator and stories for the controlled table’s baseline, empty/loading state, money/date formatting, and selection/bulk action behaviour. It is a real browser-rendered preview, not a screenshot-only example.

`build-storybook` builds static Storybook assets into `website/static/storybook`. The documentation build copies that directory into the existing GitHub Pages artifact so the documented `/storybook/` URL remains valid. Generated Storybook output is ignored by git.

CI validates the same publish-facing surface: lint, tests, typecheck, library build, Storybook build, documentation build, and npm tarball dry run against the official npm registry. The Pages workflow builds Storybook before documentation and deploys only from `main`.

## Release and integration flow

All work lands on `codex/public-release-metadata`, which is pushed to the configured GitHub repository and proposed to `main` with a pull request. After the PR is merged, checkout the merged `main`, verify the release checks, create annotated tag `v0.2.0`, push main and the tag, authenticate to npmjs via `npm login --auth-type=web` against `https://registry.npmjs.org/`, and publish with `npm publish --access public --tag latest --registry=https://registry.npmjs.org/`.

The release guide documents this exact flow, including `npm pack --dry-run`, `npm view` registry inspection, and use of `next` for prerelease builds. Publishing is not performed from the feature branch.

## Verification

Before creating the PR, run `git diff --check`, `npm run lint`, `npm run test`, `npm run typecheck`, `npm run build`, `npm run build-storybook`, `npm run docs:build`, and `npm pack --dry-run --registry=https://registry.npmjs.org/`. Inspect the tarball file list to confirm it excludes source-only and internal materials.

## Exclusions

This change does not introduce analytics, customer telemetry, private endpoint documentation, a custom domain, or a separate demo backend. GitHub and npm authentication occur only for pushing, opening/merging the PR, and publishing after merge.
