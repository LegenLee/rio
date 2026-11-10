# Conventions

How the Rio repository is organized and how code in it is written. Read this before adding a package, a component, a primitive, or a shared helper.

## Packages

| Package           | Contents                                                                                                                                                 | Depends on                                           |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `@rio-m3e/tokens` | Design tokens: color (via MCU), elevation, motion, shape, typography, and states. Produces CSS variables.                                                | Nothing at runtime (MCU is bundled)                  |
| `@rio-m3e/core`   | Framework-agnostic logic: component prop types, defaults, state, and accessibility attributes, plus DOM behaviors shared across components (primitives). | Nothing                                              |
| `@rio-m3e/styles` | Plain CSS with no build step: component styles, plus shared base styles in `base/`. Uses only `--rio-*` CSS variables.                                   | Nothing (reads the tokens' CSS variables at runtime) |
| `@rio-m3e/vue`    | Thin Vue adapters over `core`, styled by `styles`.                                                                                                       | `core`, `styles`                                     |
| `playground`      | Vite app for trying things out. Not published.                                                                                                           | Everything                                           |

Adapters own state. `core` only reports what should change, and the adapter decides how to store it (`v-model` in Vue, a callback prop in React). See `core/src/switch/switch.ts`.

## Folder layout

Every component has one kebab-case id (`switch`, `button`, `icon-button`, `fab-menu`), and every package uses that same id:

```
packages/
  tokens/src/
    color/color.ts          color roles, MCU integration
    elevation/elevation.ts
    motion/motion.ts
    shape/shape.ts
    state/state.ts          state-layer opacities, focus indicator
    typography/typography.ts
    prefix.ts
    theme.ts                combines every token into CSS variables
    index.ts
  core/src/
    primitives/             DOM behaviors shared across components
      ripple/
        ripple.ts
        ripple.test.ts
    button/                 component logic
      button.ts
      button.test.ts
    switch/
      switch.ts
      switch.test.ts
    index.ts
  styles/src/
    base/                   CSS shared across components
      focus-ring.css
      reduced-motion.css    imported by every component that uses motion tokens
      ripple.css            pairs with core's primitives/ripple
      state-layer.css
    button.css
    switch.css
  vue/src/
    button/
      Button.vue
    ripple/
      ripple.ts             the v-ripple directive
    switch/
      Switch.vue
    menu/                   a component family keeps its parts together
      Menu.vue
      MenuItem.vue
    index.ts
```

- Inside a folder, the main file is named after the folder (`switch/switch.ts`, `color/color.ts`).
- Don't add `index.ts` barrels inside folders. Each package has exactly one, at `src/index.ts`.

## File naming

- TypeScript and CSS files use kebab-case.
- Vue SFCs use PascalCase without the `Rio` prefix (`Switch.vue`). They are exported with the prefix (`RioSwitch`).
- Tests sit next to the code they test: `switch.ts` → `switch.test.ts`.

## Public API

- Each package's only entry point is `src/index.ts`. The `exports` field in `package.json` blocks deep imports.
- Exception: `@rio-m3e/styles` exposes CSS files one by one, including those in `base/` (`@rio-m3e/styles/switch.css`, `@rio-m3e/styles/base/ripple.css`).
- Inside the workspace, the `@rio-m3e/source` export condition points TypeScript and Vite at `src/` instead of `dist/`, so changes show up without a rebuild.

## Primitives

A primitive is a DOM behavior that several components share, such as the press ripple. Primitives live in `core/src/primitives/` and are public API, exported from `core/src/index.ts` for every adapter to use.

- **Only behaviors that need JavaScript.** If CSS alone can do it, it belongs in `styles/src/base/` instead. The state layer and the focus ring turned out to be CSS-only; the ripple needs the press position, and the spring solver will need per-frame math.
- **Shape: `attachX(element)` returns `{ detach() }`.** It takes a real element, adds listeners or animations, and gives back a handle that undoes everything. Adapters attach on mount and detach before unmount.
- **State goes out through `data-*` attributes** on the element (`data-ripple`, `data-pressed`), so CSS can react without knowing about the JavaScript.
- **Visuals go in a paired base stylesheet**: `primitives/ripple/ripple.ts` pairs with `styles/src/base/ripple.css`. The primitive handles behavior, and the stylesheet handles appearance.
- **The stylesheet selects on the primitive's data attribute, not on a class** (`[data-ripple]`, not `.rio-ripple`). Vue rewrites `class` whenever a `:class` binding changes and would drop a class the primitive added, but it leaves attributes it doesn't own alone.
- **Adapters expose primitives in their framework's idiom.** In Vue, that's a directive (`vRipple` → `v-ripple`) that attaches on mount, detaches before unmount, and imports the paired stylesheet. A React adapter would use a hook instead.
- Primitives are tested in a real browser (see Testing).

## Shared helpers

A helper moves up only when a second caller actually needs it.

| Level | When                                       | Where                                                                                                         |
| ----- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| 1     | Used in one file (the default)             | Stays in that file, not exported                                                                              |
| 2     | A second file in the same package needs it | `src/utils/<topic>.ts`, not exported from the package                                                         |
| 3     | A second package needs it                  | `packages/shared`, a private package bundled into each consumer by tsdown. Created the day it's first needed. |

- Don't extract ahead of time. For example, `kebab` in `color/color.ts` stays at level 1 until another file needs it.
- Group helpers by topic (`utils/string.ts`, `utils/math.ts`). No catch-all `utils.ts` or `helpers.ts`.
- Rename on the way up. A short local name like `kebab` becomes `kebabCase` once it's shared.
- Helpers are not public API. Functions users call, such as `colorVar` and `elevationVar`, live in their feature folder and are exported from `index.ts`. Helpers never are.
- Helpers are pure functions. Nothing in `utils/` or `shared` touches the DOM or a framework. DOM behaviors are primitives.
- Helpers get tests, next to the source like everything else.

## Code style

- **Formatting**: oxfmt with single quotes, semicolons, and a 100-column line width (`.oxfmtrc.json`). Run `pnpm fmt` to format and `pnpm fmt:check` to check.
- **Linting**: oxlint with the eslint, typescript, unicorn, oxc, and vue plugins (`.oxlintrc.json`). Run `pnpm lint`. Vue templates aren't linted yet; ESLint may be added for them later if template mistakes become common.
- **Language**: write code comments and everything under `docs/` in English. The README keeps its Korean voice.
- **Version pins**:
  - tsdown, oxfmt, and oxlint are pinned to exact versions because they are pre-1.0 or move fast.
  - Vitest and `@vitest/browser-playwright` are pinned to the same exact version, so the browser provider always matches Vitest.
  - TypeScript stays on 6.x until vue-tsc supports TypeScript 7.
  - Shared versions live in the `catalog` in `pnpm-workspace.yaml`.

## Writing about the spec

`docs/foundations.md` covers the system-wide foundations, and each component gets its own page in `docs/components/<id>.md` (for example `docs/components/button.md`), with Spec, Recommendations, and In Rio sections.

In all of them, keep three kinds of statements apart and label them:

- **Spec**: token values and normative definitions from Google.
- **Recommendations**: guidance prose on m3.material.io (dos, don'ts, "should").
- **In Rio**: what Rio decides on top, with the reason.

Rio's defaults follow the spec. Recommendations become options or component-level practice, and never quietly change a default. Never present a Rio decision as the spec. Where Rio goes against the spec or a recommendation, mark the spot with a quoted note that starts with **Deviation from the spec.** or **Deviation from a recommendation.**, and say what Rio does instead and why. See the ripple's touch delay in `docs/foundations.md`, section 6.

## Testing

Vitest runs three projects, configured in the root `vitest.config.ts`:

| Project   | Covers                                                          | Runs in                              | Command            |
| --------- | --------------------------------------------------------------- | ------------------------------------ | ------------------ |
| `unit`    | `packages/tokens`, `packages/core` (except `primitives`)        | Node                                 | `pnpm test`        |
| `browser` | `packages/vue` (`*.test.ts`) and `packages/core/src/primitives` | Headless Chromium through Playwright | `pnpm test`        |
| `vrt`     | `packages/vue` (`*.vrt.test.ts`)                                | Headless Chromium at 1280×720        | `pnpm test:visual` |

- `pnpm test` watches for changes locally and runs once in CI. Pass `--run` to run once locally.
- First-time setup: `pnpm exec playwright install chromium`.

### Calculations

- Assert exact values for anything transcribed from a spec, and keep a second copy of the spec values in the test, written independently of the source (see `elevation.test.ts`). A typo in the source then fails the test instead of slipping through.
- Use snapshots for output too large to write by hand (see `color.test.ts`). Snapshots live in `__snapshots__/` next to the test and are committed.
- Review snapshot diffs like code. An unexpected diff after a dependency upgrade, such as MCU, is a regression until proven otherwise. Update snapshots with `pnpm test --run -u` only when the change is intended.

### Rendering and behavior

- Render components with `vitest-browser-vue` in real Chromium, and query elements by role (`getByRole('switch')`), not by class name.
- Test the adapter contract: what the component emits, and that the parent owns the state.
- Test primitives on a plain element built in the test, by dispatching the events they listen to (see `ripple.test.ts`).
- Playwright refuses to click elements with `aria-disabled="true"`, but real pointers can still click them. To test a disabled guard, use `click({ force: true })`.

### Visual regression

- Name screenshot tests `*.vrt.test.ts`. Reference images are stored in `__screenshots__/` next to the test and committed.
- Pixels differ across operating systems, fonts, and browser versions, so reference images must come from one fixed environment (CI or a Docker image), never from local machines. Until that environment exists, treat `vrt` results as a local reference only.
- Failure artifacts (actual and diff images) go to `.vitest/`, which is git-ignored.

### Known quirks

- The `unit` project inlines `@material/material-color-utilities` (`server.deps.inline`) because MCU 0.4.0 breaks under Node ESM (upstream #195).
- If Vitest warns that Vite reloaded a test page, add the newly optimized dependency to `optimizeDeps.include` in the browser projects.
- `getAnimations()` doesn't report animations on a pseudo-element that doesn't exist, which is the case when the test loads no CSS that gives it `content`. To check that a primitive animates `::after`, spy on `element.animate` instead.

## Branches and commits

- `dev` is the working branch and GitHub's default. Open pull requests against `dev`.
- `main` moves only on releases.
- Before you commit, run:

  ```sh
  pnpm fmt:check && pnpm lint && pnpm typecheck && pnpm test --run && pnpm build
  ```

- CI (`.github/workflows/ci.yml`) runs the same checks on every push to `dev` and every pull request against `dev` or `main`, on Node 24 with a frozen lockfile. The `vrt` project isn't part of CI yet.
- Commit messages follow Conventional Commits: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `chore:`.
