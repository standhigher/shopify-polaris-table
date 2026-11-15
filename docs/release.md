# Release guide

## Current state: V2 stable preparation, not published

Local `main` contains the reviewed V2 development history. The target version is **2.0.0**, with the future stable channel **latest**. The official registry was checked during P7 preparation: **latest remains 1.1.0** and `2.0.0` is unclaimed. No package, Git tag or push has been created by preparation or local merge.

P6 Chromium bulk-menu keyboard remains `partial` but is explicitly accepted as a non-blocking risk. VoiceOver/NVDA is intentionally out of scope and is no longer a release blocker. Dependency audit review is still pending. See [P7 readiness](<v2/p7-validation.md>) and [the readiness record](<v2/release-readiness.json>).

## Branch and channel policy

| Line | Release source | Version | Channel |
|---|---|---|---|
| V1 fixes | `maintenance/v1.x` | compatible 1.x | maintain the approved V1/stable policy; do not overwrite a future V2 latest |
| V2 beta | merged `main` | `2.0.0-beta.N` | `next` only |
| V2 stable | future reviewed merged `main` | `2.x.y` without prerelease | `latest`, only after separate approval |

Prereleases must use a semantic prerelease version and the `next` dist-tag. Do not move `latest` to a prerelease. The legacy `npm:publish` entrypoint is deliberately disabled on this V2 beta line. The V1 maintenance branch retains its own release process.

## Preparation checks (safe, no publish)

Use a supported build runtime: Vite 8 requires Node **20.19+**, **22.12+**, or a supported newer release such as Node 24. The package's `node >=20` runtime declaration is not a claim that every Node 20 minor can build the development workspace.

```sh
npm ci
npm run release:prepare:beta
npm run release:preflight:beta
```

Preparation runs lint/unit/type/build/docs/pack checks, actual installed tarball NodeNext and SSR consumers, release-policy tests, and esbuild tree-shaking/contribution-graph verification. These checks can run on a working preparation branch and do not log in or publish.

**Preflight is expected to fail today.** It requires:

- A merged `main` checkout for beta.
- A clean working tree, including untracked files. Do not silently delete or stage unrelated files such as an existing pnpm lockfile.
- Matching package/lock/readiness versions and `next` channel.
- P6 automation passed, or only the explicitly excluded P6-01 menu/real-screen-reader cases remain. Other automation failures still block release.
- VoiceOver/NVDA and P6-01 decisions are already recorded as accepted/out of scope; no further testing is required for these two items.
- An accepted dependency audit risk decision.
- A separate human authorization to publish.

The readiness record explicitly records the P6-01 and screen-reader risk decisions, but still requires dependency-audit acceptance and publish authorization. It is not a bypass switch: do not mark unrelated reports passed just to satisfy preflight.

## Registry and authentication (only when publication is separately authorized)

First inspect npmjs, not a mirror:

```sh
npm view @standhigher/polaris-data-table versions dist-tags --json --registry=https://registry.npmjs.org/
```

A network/authentication error is not evidence that a version is free. Versions are immutable; never reuse an existing version.

After approval, authenticate interactively:

```sh
npm run npm:login
npm run npm:whoami
```

Do not paste or commit tokens. Confirm the publisher has access to the `@standhigher` scope. Complete any npm browser/passkey challenge in an interactive terminal; do not bypass OTP or authentication requirements.

## Guarded stable publication (not executed in this session)

After the separate P6/manual-readiness/dependency approvals and a clean final `main` commit, the manual command is:

```sh
npm publish --access public --tag latest --auth-type=web --registry=https://registry.npmjs.org/
```

Before running it, execute:

```sh
npm run release:check:stable
npm run release:preflight:stable
npm view @standhigher/polaris-data-table versions dist-tags --json --registry=https://registry.npmjs.org/
```

`prepublishOnly` runs the same release policy again. It still blocks on unrelated automation failures, pending dependency audit, a dirty checkout or missing publish authorization. The explicitly accepted P6-01 partial result and excluded VoiceOver/NVDA test no longer trigger release-blocking reminders. Do not use `--ignore-scripts` to bypass it.

## Guarded beta publication (not executed in P7 preparation)

Only after all blockers and approvals are resolved:

```sh
npm run release:check:beta
npm run npm:publish:beta
```

The guarded command uses `--tag next`. `publishConfig.tag` defaults to `next`, and `prepublishOnly` rechecks policy for a raw npm lifecycle. Do not use `--ignore-scripts` or direct tag overrides to bypass the gate.

After a separately authorized successful publish, verify the exact beta and registry tags, then create an annotated version tag for that exact clean release commit and push it only with explicit authorization. Preparation itself creates no release tag and performs no push.

## Tarball review

```sh
npm pack --dry-run --registry=https://registry.npmjs.org/
```

The payload should contain the package metadata, license, bilingual documentation, changelog and intended ESM/declaration files. Root and `/extension` are the only formal entrypoints. No experiments, test/browser tools, secrets, generated Storybook, Runtime loader or CSS injection belongs in the package. `sideEffects:false` is supported by the current no-CSS/no-runtime-injection design and real bundler tests; revisit it if CSS or module initialization is introduced.

## Website / GitHub Pages

The documentation workflow builds the static site separately from the library's published runtime dependencies. Its dependencies and security advisories need independent review. Enabling Pages or pushing a merge is not authorization to publish npm. Never equate a local docs build with a deployed site.

## Release checklist

- [ ] Release source and channel are approved.
- [ ] Package/lock/changelog/docs agree on the exact version.
- [ ] Source, consumer, SSR, bundle and tarball checks pass on the final commit.
- [x] P6-01 partial and VoiceOver/NVDA out-of-scope decisions are recorded by explicit user instruction.
- [ ] Dependency audit findings are triaged/accepted or fixed.
- [ ] Working tree is clean; unrelated user files were preserved.
- [ ] Official registry confirms version availability and expected tags.
- [ ] Separate publication authorization and npm authentication are complete.
- [ ] Publication used next for beta; latest was not moved.
- [ ] Published metadata and exact release commit are verified before tagging/pushing.
