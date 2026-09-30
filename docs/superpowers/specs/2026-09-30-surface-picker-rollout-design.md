# The surface picker reaches the rest of the suite

**Status:** approved in chat 2026-09-30, pending written review

## Goal

Every axi app lets the reader choose between three surfaces — **Axi**, **Flat**,
**Glass** — from the same control, with Axi the default. Five apps gain that
choice: axiforge, axiam, axipulse, axivale, axiom.

One accent is added to the language, `electric-cyan` `#22d3ee`, so that the
axistream migration (its own spec, in that repo) has a palette entry for the
colour it is built around.

## The gap it closes

The themes already exist. axi-design 1.42.0 ships `themes/glass.json` and
`themes/flat.json`, builds them to `dist/themes/<id>.css`, and exports them
through the `./themes/*.css` subpath. The language itself — `tokens.css` — is
already the default, because a theme only applies when `data-axi-theme` is set
on the root element.

What is missing is consumers. Exactly one app reads those stylesheets:
axiroster, at `src/renderer/src/themes/applyTheme.ts`. Five apps ship a version
of the package that predates the themes entirely (axiom is on `^1.6.0`) and
import only `axi.css`. The work here is adoption, not authorship.

## What this is not

- **Not a change to either theme.** Whether flat's 6px radius or glass's
  `blur(18px) saturate(140%)` is right was settled at 1.42.0 and reviewed
  against `docs/RULES.md` then. Nothing in this round restates a token.
- **Not a shared JavaScript helper.** `package.json`'s `//exports` note is
  explicit that there is no JS in this package to be a default export, and this
  round does not change that. Every export is a stylesheet or JSON. The
  ~40 lines of `applySurface` are therefore **copied per app**, adapted to each
  app's stack and persistence. That duplication is the package's design, not an
  oversight in this plan.
- **Not axibridge.** Excluded by request. It already has a boolean glass toggle
  at `src/shared/applyAxiTheme.ts` and stays as it is.
- **Not axitools.** A static Cloudflare site with no app chrome to theme.
- **Not axistream.** That app needs a full migration onto the language before a
  picker means anything. It depends on this round only for `electric-cyan`, and
  has its own spec in its own repo.
- **Not published pages.** axiforge's share URLs carry an accent in `?t=`
  (`src/site/accent.js`, `accentFromParams()`) and those URLs are immutable once
  posted. No surface parameter is added. The surface is a reader's preference
  about their own app, not a property of a build someone else shared;
  published pages stay on the language.

## Part one — the accent

One entry appended to `accents.json`:

```json
{ "id": "electric-cyan", "label": "Electric Cyan", "hex": "#22d3ee" }
```

Appended rather than inserted, so the swatch order in six shipped apps does not
shuffle under the reader.

`scripts/build.mjs:49` emits the whole rule from that data
(`[data-axi-accent="${a.id}"] { --axi-accent: ${a.hex}; }`), and `:197` writes
`dist/accents.css`. So the change is the JSON line plus `npm run build`.
`tests/accents.test.mjs` already asserts every entry emits a rule, which covers
the new one without a new test.

`accents.json` is the second sanctioned home for a colour literal after
`tokens.css` — it is build data, not stylesheet source. `dist/` is generated and
is never hand-edited.

Version: **1.43.0**. A new accent is an addition, not a fix.

### Why a twelfth accent rather than an existing one

axistream is built around `#22d3ee`. The nearest palette entry is
`refined-cyan` `#5eadd5`, which is visibly duller — adopting it would make the
migration a visible regression in the app's identity colour. One data row is
cheaper than that.

## Part two — the five apps

Each app gets the same four edits.

**1. Bump the dependency to `^1.43.0`.**

**2. Import the themes** at the renderer entry, beside the existing imports:

```ts
import '@axiapps/axi-design/axi.css'
import '@axiapps/axi-design/accents.css'
import '@axiapps/axi-design/themes/flat.css'
import '@axiapps/axi-design/themes/glass.css'
import './index.css'
```

Import order matters and is load-bearing: the app's own stylesheet comes last.
axipulse's `src/renderer/main.tsx` already carries a comment saying so.

**3. Add the surface functions** beside the app's existing `applyTheme`, ported
from `axiroster/src/renderer/src/themes/applyTheme.ts`:

```ts
export type SurfaceId = 'axi' | 'flat' | 'glass'
export const SURFACES: { id: SurfaceId; label: string }[] = [
  { id: 'axi', label: 'Axi' },
  { id: 'flat', label: 'Flat' },
  { id: 'glass', label: 'Glass' }
]
export const DEFAULT_SURFACE_ID: SurfaceId = 'axi'

export function resolveSurfaceId(id?: string | null): SurfaceId
export function readSurface(): SurfaceId
export function applySurface(surfaceId?: string | null): SurfaceId
```

Three properties of that port are not negotiable:

- **`'axi'` removes the attribute.** `applySurface('axi')` calls
  `root.removeAttribute('data-axi-theme')`. It does not set
  `data-axi-theme="axi"` — there is no such theme file, because the language is
  not one of its own themes.
- **The root is `<html>`**, via `document.documentElement`, never `<body>`.
  Upstream theme selectors are unscoped; at body level they would contest
  specificity with the app's own body rules instead of cascading over them.
- **`resolveSurfaceId` is total.** Any value that is not one of the three ids
  returns `DEFAULT_SURFACE_ID`. Because the input is a stored string, membership
  is tested against the `SURFACES` array, so inherited property names
  (`constructor`, `__proto__`, `toString`) resolve to `'axi'` like any other
  unknown value rather than reaching the prototype chain.

The crossfade is **shared with the accent**, not duplicated: one
`theme-transitioning` class on the root and one timer module-wide, so changing
accent and surface together is a single fade rather than two.

Three apps already have that class and its CSS — axiforge
(`src/renderer/styles/app.css`), axiam (`src/index.css`) and axipulse
(`src/renderer/index.css`). **axivale and axiom have neither** and gain the rule.
The axiroster pair is the model: `src/renderer/src/index.css:135` is a 0.4s
transition on background, border, shadow and outline colour with 0.2s on text,
scoped to the transitioning class, and `:1803` turns it off entirely under
`prefers-reduced-motion`. Both halves are copied; the reduced-motion half is not
optional.

**No legacy key migration.** axiroster needed its versioned
`axiroster.surface.v2` key because `'flat'` changed meaning there: before 1.41.0
it named the language itself. None of these five apps ever had a surface
concept, so each starts clean at an unversioned key and never reads a legacy
one.

**4. Add the control** to the app's existing appearance UI, beside the accent
swatches: three buttons, `axi-btn axi-btn--sm`, the current one also
`axi-btn--primary` and carrying `aria-pressed`. The markup at
`axiroster/src/renderer/src/components/AppSettings.tsx:156` is the model.

### Where the apps differ

| app | stack | entry | surface persisted via | appearance UI |
|---|---|---|---|---|
| axiforge | vanilla JS ESM | `src/renderer/renderer.js` | main-process appearance settings | `src/renderer/modules/settings-modal.js` |
| axiam | React | `src/main.tsx` | main-process settings, sibling of `settings.themeId` | `src/components/SettingsModal.tsx` |
| axipulse | React | `src/renderer/main.tsx` | `localStorage` | `src/renderer/views/SettingsView.tsx` |
| axivale | React | `src/renderer/src/main.tsx` | `localStorage` | `src/renderer/src/components/settings/Appearance.tsx` |
| axiom | React | `src/main.tsx` | `localStorage` (new) | `src/components/SettingsView.tsx` |

**Surface persistence follows each app's existing accent persistence.** The two
settings are siblings in one panel; storing the accent in main-process settings
and the surface in `localStorage` within the same app would be the actual
inconsistency. axiforge and axiam therefore extend their appearance settings
payload; axipulse and axivale add a key beside their accent key.

axiforge's module layout means the surface functions land in
`src/renderer/modules/accents.js` beside `DEFAULT_ACCENT_ID` and the permanent
`LEGACY_THEME_TO_ACCENT` map, as plain ESM rather than TypeScript.

### axiom is the outlier

axiom has no accent wiring at all: `src/main.tsx` imports `axi.css` and nothing
else, there is no themes module, and `SettingsView.tsx` has no appearance
section. It needs, in this order:

1. `accents.css` imported and an `accents.ts` module listing the palette
2. `applyTheme` / `readAccent` and the accent's `localStorage` key
3. the `theme-transitioning` rule in its stylesheet
4. an accent picker section in `SettingsView.tsx`
5. then everything the other four get

Roughly double the work of any other app, and it is the one app where the
picker is a new feature rather than an addition to an existing panel.

### axivale's share viewer

axivale has a second entry, `src/share-viewer/main.tsx`. It is a published-page
renderer and is covered by the "not published pages" exclusion above: no theme
imports, no picker, no attribute. It stays on the language.

## Testing

**axi-design.** `npm run build`, then the existing suite.
`tests/accents.test.mjs` covers the new entry. Vitest runs with
`--maxWorkers=2`.

**All five apps.** `axiroster/src/renderer/src/themes/surface.test.ts` is the
file to port. Each app has a runner already, though not the same one:

| app | runner | existing neighbour |
|---|---|---|
| axiam | vitest | `src/themes/accents.test.ts` |
| axivale | vitest | `src/renderer/src/themes/accents.test.ts`, `applyTheme.test.ts` |
| axiom | vitest | `src/__tests__/` (no theme tests — this is the first) |
| axipulse | vitest config present, **no `test` script and no test files** | none |
| axiforge | jest | `tests/unit/`, `tests/web/` |

Two of those need setup before a test can run. **axipulse** has
`vitest.config.ts` but no `test` script in `package.json` and not a single test
file; adding the script is part of its commit. **axiforge** is jest, not vitest,
but its config already transforms `src/renderer/**/*.js` through babel-jest and
already lists `src/renderer/modules/**/*.js` under `collectCoverageFrom`, so
`accents.js` is testable there today with no config change — the test goes in
`tests/unit/`.

Three assertions per app:

- `resolveSurfaceId` returns `'axi'` for `null`, `''`, `'nope'`,
  `'constructor'`, `'__proto__'`, and returns each real id unchanged
- `applySurface('axi')` leaves `document.documentElement` with no
  `data-axi-theme`; `applySurface('glass')` sets it to `glass`
- `applySurface` then `readSurface` round-trips through the app's persistence

axivale additionally has `src/renderer/src/components/settings/Appearance.test.tsx`,
so the control itself gets a test there: clicking each button sets the
attribute and marks that button `aria-pressed`. That is the only app where the
picker's markup is covered by a test rather than by eye; the other four rely on
the visual pass below.

Vitest runs at `--maxWorkers=2` in every app, not just axi-design.

**Visual.** No test can tell you whether flat looks right. Each of the five apps
gets a manual pass across all three surfaces, checking in particular that the
app's *own* stylesheet — the one that loads last — has no colour that fails to
follow the surface. That sweep is the real acceptance criterion for this round,
and any local literal it turns up is fixed as part of the app's commit.

## Done when

- `accents.json` has twelve entries, `dist/accents.css` has a rule for
  `electric-cyan`, and axi-design is at 1.43.0
- all five apps depend on `^1.43.0`, import both theme stylesheets, and offer
  Axi / Flat / Glass in their settings
- each app opens on Axi for a reader who has never chosen, and reopens on the
  surface a reader did choose
- the manual three-surface pass is clean in all five
