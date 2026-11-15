# P6 Runtime acceptance

Development-only checks. No browser driver, testing code, fetch logic or CSS is shipped in the library.

## Prerequisites

- Node/npm and installed repository dependencies.
- `agent-browser` 0.38.1 (the tested version) and local Chromium.
- Python 3 with Pillow for PNG comparisons.
- A built Storybook (`npm run build-storybook`).

## Chromium, axe, RTL, visuals, keyboard

```sh
npm run build-storybook
npm run test:visual-helper
npm run test:runtime
```

The runner serves the build on an ephemeral loopback port with `Cache-Control: no-store`, uses its own named browser session, closes it on exit, and writes evidence to ignored `test-results/p6/`.

Coverage:

- Columns / lifecycle / selection stories × LTR/RTL × 320/375/768/1280 widths: 24 axe/layout cases.
- Skeleton axe + inert semantics.
- 8 columns visual goldens plus 1 Skeleton golden.
- Real CDP key events for Columns, selection checkbox and menu/Modal. JavaScript focus is only used to place the starting cursor; synthetic DOM Tab events are not accepted as keyboard evidence.

Visual baselines are committed under `baselines/`. Default execution **does not update** them. Only after reviewing an intentional visual change:

```sh
npm run test:runtime:update
```

Comparison fails on changed dimensions or when over 0.1% of pixels differ by more than 20 in an RGB channel. A fresh capture is compared to the separately stored baseline, not to itself. Layout and fonts/images settle before capture. Baselines are environment-specific, not cross-browser pixel equivalence.

### Known outstanding case

In the tested Chromium automation environment, the production bulk menu can report `expanded=true` without exposing menuitems in its accessibility tree. Its keyboard chain is retained, not bypassed with a pointer click. The report records this outstanding case, marks overall `status: partial`, and exits **2**. This does **not** count as a full P6 pass. Whether it is a runtime integration or automation-environment defect remains to be determined.

Diagnostic commands:

```sh
node test/runtime/p6-runtime.mjs --keyboard-only
node test/runtime/p6-runtime.mjs --keyboard-only --headed
```

Other assertion failures exit nonzero and preserve focus/AX evidence. A headed run is a separate check, not permission to waive failed headless assertions.

## Extension Table

Serve the built Storybook separately (do not rebuild it during a running check):

```sh
python3 -m http.server 6112 --bind 127.0.0.1 --directory website/static/storybook
P6_BASE_URL=http://127.0.0.1:6112 node test/runtime/p6-extension.mjs
```

Checks 8 RTL/viewport combinations, axe and native radio Space/ArrowDown. Radio groups are unique per table instance.

## Real Safari (not simulated WebKit)

The operator must enable **Allow remote automation** in Safari's Developer settings if needed. These scripts never change that setting.

```sh
safaridriver -p 6113
P6_BASE_URL=http://127.0.0.1:6112 node test/runtime/safari-probe.mjs
```

Uses isolated Safari WebDriver automation windows and closes its session afterward. Checks 6 desktop story/direction combinations, snapshots, Columns keyboard opening/Escape/focus, and selection → native menu → Modal → Escape. It is not an iOS test, does not run axe inside Safari, and does not claim real screen-reader speech coverage.

## Screen-reader scope decision

Per the explicit release decision, real VoiceOver/NVDA testing is **out of scope and removed from the release checklist**. It is not a pending P6/P7 blocker and no future automated run should remind or require it. axe, accessibility snapshots and keyboard checks remain the delivered automated evidence; they are not being represented as speech testing.

The P6-01 Chromium production-menu partial is likewise an explicitly accepted non-blocking risk. Safari WebDriver menu/Modal keyboard coverage remains recorded as evidence.

BestSourcing production pages and P7 release/publish are excluded.
