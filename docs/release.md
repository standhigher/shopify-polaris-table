# Release guide

This guide applies only to releases from the merged `main` branch. Do not publish from a feature branch, an unmerged pull request, or a working tree with unrelated changes.

## Preflight

1. Confirm the checkout is on the latest merged `main` and is clean:

   ```bash
   git switch main
   git pull --ff-only
   git status --short
   ```

2. Inspect the official npm registry before choosing a version. This avoids reusing an existing version:

   ```bash
   npm view @standhigher/polaris-data-table version --registry=https://registry.npmjs.org/
   npm view @standhigher/polaris-data-table dist-tags --json --registry=https://registry.npmjs.org/
   ```

   A `404` means the scoped package has not been published yet. Do not treat a network or authentication error as proof that a version is free.

3. Update the version, changelog, and any version assertions in the same pull request. Use semantic versioning: patch for compatible fixes, minor for compatible features, and major for breaking changes.

4. Run the complete verification suite and inspect the publish payload:

   ```bash
   git diff --check
   npm run release:check
   npm pack --dry-run --registry=https://registry.npmjs.org/
   ```

   Confirm the tarball includes only the intended public files and never credentials or local build artifacts.

## Authenticate with npmjs

Use npm's browser-based authentication against the official registry:

```bash
npm login --auth-type=web --registry=https://registry.npmjs.org/
npm whoami --registry=https://registry.npmjs.org/
```

Complete the browser flow before continuing. Do not paste or commit auth tokens. Confirm that the authenticated account can publish to the `@standhigher` scope.

## Publish a stable release

From the verified, merged `main` commit:

```bash
npm publish --access public --tag latest --registry=https://registry.npmjs.org/
npm view @standhigher/polaris-data-table version dist-tags --json --registry=https://registry.npmjs.org/
```

`latest` is the default install channel and is reserved for stable releases. Publishing a scoped package publicly requires `--access public`.

After npm confirms the publish, create and push an annotated tag for that exact commit:

```bash
git tag -a v0.2.0 -m "Release v0.2.0"
git push origin main --follow-tags
```

Replace `0.2.0` with the released package version. Create the corresponding GitHub Release from the tag and link its notes to `CHANGELOG.md`.

## Publish a prerelease

Prereleases must use a semantic prerelease version and the `next` dist-tag, for example:

```bash
npm publish --access public --tag next --registry=https://registry.npmjs.org/
npm view @standhigher/polaris-data-table dist-tags --json --registry=https://registry.npmjs.org/
```

`next` is for opt-in prerelease consumers. Do not move `latest` to a prerelease. Tag the exact merged commit with its matching annotated version tag after publishing.

## Release checklist

- [ ] The release pull request is merged into `main`.
- [ ] `package.json`, `package-lock.json`, source version constants, tests, and `CHANGELOG.md` agree on the version.
- [ ] `git diff --check` and `npm run release:check` pass.
- [ ] `npm pack --dry-run` has been reviewed.
- [ ] The official registry has been checked for the selected version.
- [ ] npm web authentication is complete and `npm whoami` is the intended publisher.
- [ ] The package was published with the intended `latest` or `next` dist-tag.
- [ ] The published version and dist-tags were verified from the official registry.
- [ ] An annotated `v<version>` tag and GitHub Release point at the published `main` commit.
