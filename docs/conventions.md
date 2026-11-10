# Conventions

How the Rio repository is organized and how code in it is written. Read this before adding a package, a component, or a shared helper.

## Packages

| Package           | Contents                                                                                                          | Depends on                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `@rio-m3e/tokens` | Design tokens: color (via MCU) and elevation, with motion, shape, and typography to come. Produces CSS variables. | Nothing at runtime (MCU is bundled)                  |
| `@rio-m3e/core`   | Framework-agnostic component logic: prop types and defaults, state, accessibility attributes, DOM behaviors.      | Nothing                                              |
| `@rio-m3e/styles` | Component CSS. Plain CSS with no build step. Uses only `--rio-*` CSS variables.                                   | Nothing (reads the tokens' CSS variables at runtime) |
| `@rio-m3e/vue`    | Thin Vue adapters over `core`, styled by `styles`.                                                                | `core`, `styles`                                     |
| `playground`      | Vite app for trying things out. Not published.                                                                    | Everything                                           |

Adapters own state. `core` only reports what should change, and the adapter decides how to store it (`v-model` in Vue, a callback prop in React). See `core/src/switch/switch.ts`.

## Folder layout

Every component has one kebab-case id (`switch`, `button`, `icon-button`, `fab-menu`), and every package uses that same id:

```
packages/
  tokens/src/
    color/color.ts        color roles, MCU integration
    elevation/elevation.ts
    motion/               (planned)
    shape/                (planned)
    typography/           (planned)
    prefix.ts
    theme.ts              combines every token into CSS variables
    index.ts
  core/src/
    primitives/           behaviors not tied to one component: springs, state layers, focus rings
    switch/
      switch.ts
      switch.test.ts
    index.ts
  styles/src/
    base/                 CSS shared by several components
    switch.css
  vue/src/
    switch/
      Switch.vue
    menu/                 a component family keeps its parts together
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
- Exception: `@rio-m3e/styles` exposes CSS files one by one (`@rio-m3e/styles/switch.css`).
- Inside the workspace, the `@rio-m3e/source` export condition points TypeScript and Vite at `src/` instead of `dist/`, so changes show up without a rebuild.

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
- Helpers are pure functions. Nothing in `utils/` or `shared` touches the DOM or a framework. DOM behaviors belong in `core/src/primitives/`.
- Helpers get tests, next to the source like everything else.

## Code style

- **Formatting**: oxfmt with single quotes, semicolons, and a 100-column line width (`.oxfmtrc.json`). Run `pnpm fmt` to format and `pnpm fmt:check` to check.
- **Linting**: oxlint with the eslint, typescript, unicorn, oxc, and vue plugins (`.oxlintrc.json`). Run `pnpm lint`. Vue templates aren't linted yet; ESLint may be added for them later if template mistakes become common.
- **Language**: write code comments and everything under `docs/` in English. The README keeps its Korean voice.
- **Version pins**: tsdown, oxfmt, and oxlint are pinned to exact versions because they are pre-1.0 or move fast. TypeScript stays on 6.x until vue-tsc supports TypeScript 7. Shared versions live in the `catalog` in `pnpm-workspace.yaml`.

## Testing

Vitest runs three projects, configured in the root `vitest.config.ts`:

| Project   | Covers                             | Runs in                              | Command            |
| --------- | ---------------------------------- | ------------------------------------ | ------------------ |
| `unit`    | `packages/tokens`, `packages/core` | Node                                 | `pnpm test`        |
| `browser` | `packages/vue` (`*.test.ts`)       | Headless Chromium through Playwright | `pnpm test`        |
| `vrt`     | `packages/vue` (`*.vrt.test.ts`)   | Headless Chromium at 1280×720        | `pnpm test:visual` |

- `pnpm test` watches for changes locally and runs once in CI. Pass `--run` to run once locally.
- First-time setup: `pnpm exec playwright install chromium`.

### Calculations

- Assert exact values for anything transcribed from a spec, and keep a second copy of the spec values in the test, written independently of the source (see `elevation.test.ts`). A typo in the source then fails the test instead of slipping through.
- Use snapshots for output too large to write by hand (see `color.test.ts`). Snapshots live in `__snapshots__/` next to the test and are committed.
- Review snapshot diffs like code. An unexpected diff after a dependency upgrade, such as MCU, is a regression until proven otherwise. Update snapshots with `pnpm test --run -u` only when the change is intended.

### Rendering and behavior

- Render components with `vitest-browser-vue` in real Chromium, and query elements by role (`getByRole('switch')`), not by class name.
- Test the adapter contract: what the component emits, and that the parent owns the state.
- Playwright refuses to click elements with `aria-disabled="true"`, but real pointers can still click them. To test a disabled guard, use `click({ force: true })`.

### Visual regression

- Name screenshot tests `*.vrt.test.ts`. Reference images are stored in `__screenshots__/` next to the test and committed.
- Pixels differ across operating systems, fonts, and browser versions, so reference images must come from one fixed environment (CI or a Docker image), never from local machines. Until that environment exists, treat `vrt` results as a local reference only.
- Failure artifacts (actual and diff images) go to `.vitest/`, which must stay out of git.

### Known quirks

- The `unit` project inlines `@material/material-color-utilities` (`server.deps.inline`) because MCU 0.4.0 breaks under Node ESM (upstream #195).
- If Vitest warns that Vite reloaded a test page, add the newly optimized dependency to `optimizeDeps.include` in the browser projects.

## Before you commit

```sh
pnpm fmt:check && pnpm lint && pnpm typecheck && pnpm test --run && pnpm build
```

Commit messages follow Conventional Commits: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `chore:`.
