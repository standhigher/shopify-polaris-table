# Contributing

Thanks for contributing to Polaris Data Table. By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Before you start

- Search existing issues and pull requests before opening a new one.
- For bug reports and feature ideas, use the provided GitHub issue forms.
- Do not include credentials, customer data, access tokens, or other sensitive information in issues, commits, examples, or pull requests.
- Report security vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

## Development setup

```bash
git clone https://github.com/standhigher/shopify-polaris-table.git
cd shopify-polaris-table
npm ci
```

Make changes on a focused branch. Keep public API changes documented and include tests when behavior changes.

## Verification

Run the checks relevant to your change; run the complete release check for release-affecting work:

```bash
npm run lint
npm test
npm run typecheck
npm run build
npm run build-storybook
npm run docs:build
npm pack --dry-run --registry=https://registry.npmjs.org/
```

## Pull requests

- Keep each pull request focused and explain the user-visible impact.
- Update tests, documentation, and `CHANGELOG.md` when applicable.
- Ensure CI passes and resolve review feedback before merge.
- Maintainers manage versions, npm publication, release tags, and GitHub releases from merged `main`.
