# Surface Picker Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the `electric-cyan` accent to axi-design 1.43.0, then give axiforge, axiam, axipulse, axivale and axiom an Axi / Flat / Glass surface picker that defaults to Axi.

**Architecture:** axi-design is a CSS-only package, so no shared JavaScript helper is possible. Task 1 publishes 1.43.0. Tasks 2–6 each add `SurfaceId` / `SURFACES` / `DEFAULT_SURFACE_ID` / `resolveSurfaceId` / `applySurface` to that app's existing theme module, import the two theme stylesheets at the renderer entry, and add three buttons to the app's existing appearance UI. The surface persists through whatever mechanism that app already uses for its accent, so the two settings stay siblings.

**Tech Stack:** `@axiapps/axi-design` (CSS + JSON only), Electron, React + TypeScript + Vite (axiam, axipulse, axivale, axiom), vanilla JS ESM (axiforge), vitest (five repos), jest (axiforge).

**Spec:** `docs/superpowers/specs/2026-09-30-surface-picker-rollout-design.md` (this repo)

## Global Constraints

- **Version floor:** every consuming app depends on `@axiapps/axi-design` at `^1.43.0`. Tasks 2–6 cannot start until Task 1 has published.
- **The three surface ids are exactly `'axi' | 'flat' | 'glass'`**, labelled `Axi`, `Flat`, `Glass`, in that order. `DEFAULT_SURFACE_ID` is `'axi'` in every app.
- **`'axi'` removes `data-axi-theme`.** It never sets `data-axi-theme="axi"` — there is no such stylesheet, because the language is not a theme layered over itself.
- **The attribute root is `document.documentElement`** (`<html>`), never `<body>`. Upstream theme selectors are unscoped; at body level they would contest specificity instead of cascading.
- **`resolveSurfaceId` tests membership against the `SURFACES` array**, never a plain-object lookup, so inherited property names (`constructor`, `__proto__`, `toString`) resolve to `'axi'` like any other unknown value.
- **The crossfade timer is shared between accent and surface** — one module-level `transitionTimer`, so changing both at once is one fade.
- **No legacy surface key is read in any of these five apps.** None ever had a surface concept. Only axiroster has a legacy key, and it is not touched by this plan.
- **New accent hex is exactly `#22d3ee`, id `electric-cyan`, label `Electric Cyan`**, appended last in `accents.json`.
- **Vitest runs at `--maxWorkers=2`** (or the repo's config value if already ≤2). Never raise it.
- **Stylesheet import order:** `axi.css`, `accents.css`, `themes/flat.css`, `themes/glass.css`, then the app's own stylesheet(s). The app's CSS always loads last.
- **Colour literals** may only ever be added to `accents.json` in this plan. `dist/` is generated and never hand-edited.
- **Out of scope, do not touch:** axibridge, axitools, axistream (its own plan), axiroster, axiforge's `?t=` share-URL parameters, axivale's `src/share-viewer/main.tsx`.

## Review Focus

These are the input classes the spec implies but that no task's happy path exercises. Each has a test assigned to the task that owns the code.

1. **`localStorage` throws** (private mode, storage disabled by policy). `applySurface` must still set the attribute and return the id; `readSurface` must return `'axi'`. Tested in Tasks 3, 4, 5, and by construction in Tasks 2 and 6 (no storage access there).
2. **Two surface changes inside the 500ms crossfade window.** The shared timer must be cleared and restarted, not left to strip `theme-transitioning` early and leave the second change un-faded. Tested in Task 5 (the reference implementation for the pattern) with fake timers.
3. **An accent and a surface changed in the same tick.** The spec requires one fade, not two. Nothing asserts the timer is genuinely shared. Tested in Task 5.
4. **`prefers-reduced-motion: reduce`.** Two apps (axivale, axiom) are writing the crossfade rule for the first time and could ship the transition without the opt-out. Tested in Tasks 4 and 5 by asserting both halves exist in the stylesheet.
5. **A stale `localStorage` mirror disagreeing with the main-process store** (axipulse, axivale). The mirror is read synchronously at boot; when the store answers it must win, without the user seeing a flip back to the stale value on the next launch. Tested in Tasks 3 and 4.

---

## File Structure

**Task 1 — axi-design**
- Modify: `accents.json` (append one entry), `package.json` (version → 1.43.0)
- Generated: `dist/accents.css` (by `npm run build`; never hand-edited)

**Task 2 — axiam**
- Modify: `src/themes/applyTheme.ts` (add surface functions), `src/main.tsx` (theme imports), `src/types.ts`, `electron/types.ts`, `electron/store.ts`, `electron/main.ts`, `src/App.tsx`, `src/components/SettingsModal.tsx`, `package.json`
- Create: `src/themes/surface.test.ts`

**Task 3 — axipulse**
- Modify: `src/renderer/themes/applyTheme.ts`, `src/renderer/main.tsx`, `src/renderer/store.ts` (the surface lives in the zustand store beside the accent, not in component state), `src/renderer/app/AppLayout.tsx`, `src/renderer/views/SettingsView.tsx`, `src/shared/electronApi.ts`, `src/main/index.ts`, `package.json` (dep + new `test` script)
- Create: `src/renderer/themes/surface.test.ts`

**Task 4 — axivale**
- Modify: `src/renderer/src/themes/applyTheme.ts`, `src/renderer/src/main.tsx`, `src/renderer/src/theme.css`, `src/renderer/src/components/settings/Appearance.tsx`, `src/renderer/src/components/Settings.tsx`, `src/main/secrets.ts`, `package.json`
- Create: `src/renderer/src/themes/surface.test.ts`

**Task 5 — axiom** (largest: no accent system exists yet)
- Create: `src/themes/accents.ts`, `src/themes/applyTheme.ts`, `src/themes/surface.test.ts`
- Modify: `src/main.tsx`, `src/styles/globals.css`, `src/components/SettingsView.tsx`, `package.json`

**Task 6 — axiforge**
- Modify: `src/renderer/modules/accents.js`, `src/renderer/renderer.js`, `src/renderer/modules/settings-modal.js`, `package.json`
- Create: `tests/unit/renderer/surface.test.js`

---

### Task 1: axi-design 1.43.0 — the electric-cyan accent

**Repo:** `axi-design`, branch `surface-picker-rollout` (already exists and holds the spec commit)

**Files:**
- Modify: `accents.json`
- Modify: `package.json` (version field only)
- Test: `tests/accents.test.mjs` (existing — no new file)

**Interfaces:**
- Consumes: nothing.
- Produces: the published package `@axiapps/axi-design@1.43.0`, exporting `./accents.json` with 12 entries and `./accents.css` containing `[data-axi-accent="electric-cyan"] { --axi-accent: #22d3ee; }`. Tasks 2–6 all depend on this.

- [ ] **Step 1: Write the failing test**

Append to `tests/accents.test.mjs`:

```js
test('electric-cyan is the twelfth accent and axistream\'s identity colour', () => {
  const accent = ACCENTS.find((a) => a.id === 'electric-cyan')
  assert.ok(accent, 'electric-cyan must exist in accents.json')
  assert.equal(accent.label, 'Electric Cyan')
  assert.equal(accent.hex, '#22d3ee')
  // Appended last, so the swatch order in six shipped apps does not shuffle.
  assert.equal(ACCENTS[ACCENTS.length - 1].id, 'electric-cyan')
  assert.match(buildAccentsCss(), /\[data-axi-accent="electric-cyan"\] \{ --axi-accent: #22d3ee; \}/)
})
```

If `ACCENTS` or `buildAccentsCss` is not already imported at the top of that file, add them to the existing import from `../scripts/build.mjs`.

- [ ] **Step 2: Run test to verify it fails**

```bash
cd ~/Documents/GitHub/axi-design
npx vitest run tests/accents.test.mjs --maxWorkers=2
```

Expected: FAIL — `electric-cyan must exist in accents.json`.

- [ ] **Step 3: Append the accent**

In `accents.json`, add a twelfth entry after `gold-bronze`:

```json
  { "id": "electric-cyan", "label": "Electric Cyan", "hex": "#22d3ee" }
```

Keep the file's existing formatting. `accents.json` is the sanctioned second home for a colour literal after `tokens.css` — it is build data, not stylesheet source.

- [ ] **Step 4: Rebuild the generated CSS**

```bash
cd ~/Documents/GitHub/axi-design
npm run build
git diff --stat dist/
```

Expected: `dist/accents.css` changed, nothing else. Do not edit `dist/` by hand.

- [ ] **Step 5: Run the full suite**

```bash
cd ~/Documents/GitHub/axi-design
npx vitest run --maxWorkers=2
```

Expected: PASS, including the new assertion and the existing `accents.test.mjs` / `themes.test.mjs` / `tokens.test.mjs` / `build.test.mjs`.

- [ ] **Step 6: Bump the version**

In `package.json`, change `"version": "1.42.0"` to `"version": "1.43.0"`. A new accent is an addition, so minor.

- [ ] **Step 7: Commit**

```bash
cd ~/Documents/GitHub/axi-design
git add accents.json dist/accents.css package.json tests/accents.test.mjs
git commit -m "feat: add the electric-cyan accent

#22d3ee, appended twelfth so no shipped app's swatch order shuffles.
axistream is built around this colour and migrates onto the accent
system in its own plan; without a palette entry that migration would be
a visible regression against refined-cyan's duller #5eadd5.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

- [ ] **Step 8: Tag and publish**

The docs site stages `v1/accents.css` from the highest `v*` tag (`.github/workflows/pages.yml:34`), so the tag is what makes the new accent visible on the documentation site — not the npm publish.

```bash
cd ~/Documents/GitHub/axi-design
git tag v1.43.0
git push origin surface-picker-rollout --tags
npm publish
npm view @axiapps/axi-design version
```

Expected: `1.43.0`. **Tasks 2–6 are blocked until this prints 1.43.0.**

---

### Task 2: axiam — surface picker

**Repo:** `axiam`

**Files:**
- Modify: `src/themes/applyTheme.ts`
- Modify: `src/main.tsx`, `src/types.ts:15`, `electron/types.ts:23`, `electron/store.ts:50`, `electron/main.ts:2211`, `electron/main.ts:2230`, `src/App.tsx:139`, `src/components/SettingsModal.tsx`, `package.json`
- Test: `src/themes/surface.test.ts` (create)

**Interfaces:**
- Consumes: `@axiapps/axi-design@^1.43.0`; `resolveAccentId` from `./accents`.
- Produces, from `src/themes/applyTheme.ts`:
  ```ts
  export type SurfaceId = 'axi' | 'flat' | 'glass'
  export const SURFACES: { id: SurfaceId; label: string }[]
  export const DEFAULT_SURFACE_ID: SurfaceId
  export function resolveSurfaceId(id?: string | null): SurfaceId
  export function applySurface(surfaceId?: string | null): SurfaceId
  ```
  Note: **no `readSurface`.** axiam has no `localStorage` mirror — `applyTheme` there takes its value from the main-process settings and the caller persists. The surface follows that exact shape, so `settings.surfaceId` is the only store and `App.tsx` applies it once settings resolve.

axiam's house style in these files: 4-space indent, semicolons.

- [ ] **Step 1: Write the failing test**

Create `src/themes/surface.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// vitest.config.ts runs the src suite in the node environment, so the one
// browser global this module touches is stubbed rather than pulling in jsdom.
type FakeRoot = {
    attrs: Record<string, string>;
    classes: Set<string>;
    setAttribute: (k: string, v: string) => void;
    removeAttribute: (k: string) => void;
    classList: { add: (c: string) => void; remove: (c: string) => void };
};

function fakeRoot(): FakeRoot {
    const attrs: Record<string, string> = {};
    const classes = new Set<string>();
    return {
        attrs,
        classes,
        setAttribute: (k, v) => { attrs[k] = v; },
        removeAttribute: (k) => { delete attrs[k]; },
        classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c) },
    };
}

let root: FakeRoot;

beforeEach(() => {
    vi.resetModules();
    root = fakeRoot();
    vi.stubGlobal('document', { documentElement: root });
});

afterEach(() => {
    vi.unstubAllGlobals();
});

async function load() {
    return import('./applyTheme');
}

describe('resolveSurfaceId', () => {
    it('defaults to the language itself', async () => {
        const { resolveSurfaceId, DEFAULT_SURFACE_ID } = await load();
        expect(DEFAULT_SURFACE_ID).toBe('axi');
        expect(resolveSurfaceId(null)).toBe('axi');
        expect(resolveSurfaceId(undefined)).toBe('axi');
    });

    it('passes through the ids the design language defines', async () => {
        const { resolveSurfaceId } = await load();
        expect(resolveSurfaceId('axi')).toBe('axi');
        expect(resolveSurfaceId('flat')).toBe('flat');
        expect(resolveSurfaceId('glass')).toBe('glass');
    });

    it('falls back to axi for anything else, including inherited property names', async () => {
        const { resolveSurfaceId } = await load();
        expect(resolveSurfaceId('frosted')).toBe('axi');
        expect(resolveSurfaceId('')).toBe('axi');
        expect(resolveSurfaceId('constructor')).toBe('axi');
        expect(resolveSurfaceId('__proto__')).toBe('axi');
        expect(resolveSurfaceId('toString')).toBe('axi');
    });
});

describe('applySurface', () => {
    it('puts a theme on <html>', async () => {
        const { applySurface } = await load();
        expect(applySurface('glass')).toBe('glass');
        expect(root.attrs['data-axi-theme']).toBe('glass');
    });

    it('treats flat as a theme like any other', async () => {
        const { applySurface } = await load();
        expect(applySurface('flat')).toBe('flat');
        expect(root.attrs['data-axi-theme']).toBe('flat');
    });

    it('removes the attribute for axi rather than naming the language', async () => {
        const { applySurface } = await load();
        applySurface('glass');
        expect(applySurface('axi')).toBe('axi');
        expect(root.attrs['data-axi-theme']).toBeUndefined();
    });

    it('crossfades so the whole app repaints together', async () => {
        const { applySurface } = await load();
        applySurface('glass');
        expect(root.classes.has('theme-transitioning')).toBe(true);
    });

    it('shares one fade with the accent (Review Focus 3)', async () => {
        vi.useFakeTimers();
        const { applySurface, applyTheme } = await load();
        applyTheme('electric-cyan');
        vi.advanceTimersByTime(300);
        applySurface('glass');
        // The accent's timer must have been cleared, not left to strip the class
        // 200ms into the surface's own fade.
        vi.advanceTimersByTime(300);
        expect(root.classes.has('theme-transitioning')).toBe(true);
        vi.advanceTimersByTime(250);
        expect(root.classes.has('theme-transitioning')).toBe(false);
        vi.useRealTimers();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd ~/Documents/GitHub/axiam
npx vitest run src/themes/surface.test.ts
```

Expected: FAIL — `resolveSurfaceId` is not exported from `./applyTheme`.

- [ ] **Step 3: Add the surface functions**

In `src/themes/applyTheme.ts`, append after the existing `applyTheme`, and extract the crossfade so both functions share one timer:

```ts
/**
 * The surfaces the design language paints. 'axi' is the language itself, drawn
 * with no `data-axi-theme` at all. 'flat' and 'glass' are repaints of it
 * shipped as `@axiapps/axi-design/themes/<id>.css`.
 */
export type SurfaceId = 'axi' | 'flat' | 'glass';

export const SURFACES: { id: SurfaceId; label: string }[] = [
    { id: 'axi', label: 'Axi' },
    { id: 'flat', label: 'Flat' },
    { id: 'glass', label: 'Glass' },
];

/** AxiAM has always been drawn in the language itself, so that stays the default. */
export const DEFAULT_SURFACE_ID: SurfaceId = 'axi';

/** Always returns one of the three ids. Membership is tested against the array
 *  rather than an object, so inherited property names are unknown values like
 *  any other. */
export function resolveSurfaceId(id?: string | null): SurfaceId {
    return SURFACES.some((s) => s.id === id) ? (id as SurfaceId) : DEFAULT_SURFACE_ID;
}

/**
 * Puts a surface on <html>. 'axi' removes the attribute rather than naming
 * itself: the language is not a theme layered over itself, and axi-design's own
 * rule is that removing `data-axi-theme` leaves you back on it unchanged.
 *
 * Does not persist — the main-process settings store is the source of truth and
 * the caller writes it, exactly as it does for the accent.
 */
export function applySurface(surfaceId?: string | null): SurfaceId {
    const id = resolveSurfaceId(surfaceId);
    const root = document.documentElement;

    crossfade(root);

    if (id === 'axi') root.removeAttribute('data-axi-theme');
    else root.setAttribute('data-axi-theme', id);

    return id;
}
```

And replace the inline crossfade in the existing `applyTheme` with a call to a shared helper. The file becomes:

```ts
import { resolveAccentId } from './accents';

let transitionTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Holds the crossfade class on <html> for the length of the transition so the
 * whole app changes together. Shared by the accent and the surface: changing
 * both at once should still be one fade, so the timer is not per-attribute.
 */
function crossfade(root: Element): void {
    root.classList.add('theme-transitioning');
    if (transitionTimer) clearTimeout(transitionTimer);
    transitionTimer = setTimeout(() => {
        root.classList.remove('theme-transitioning');
        transitionTimer = null;
    }, 500);
}

export function applyTheme(themeId?: string): string {
    const id = resolveAccentId(themeId);
    const root = document.documentElement;

    crossfade(root);

    root.setAttribute('data-axi-accent', id);
    return id;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd ~/Documents/GitHub/axiam
npx vitest run src/themes/surface.test.ts
```

Expected: PASS, 8 tests.

- [ ] **Step 5: Bump the dependency and import the themes**

In `package.json`, change `"@axiapps/axi-design": "^1.8.0"` to `"^1.43.0"`, then:

```bash
cd ~/Documents/GitHub/axiam
npm install
```

In `src/main.tsx`, the imports become:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import '@axiapps/axi-design/axi.css';
import '@axiapps/axi-design/accents.css';
import '@axiapps/axi-design/themes/flat.css';
import '@axiapps/axi-design/themes/glass.css';
import './index.css'
```

- [ ] **Step 6: Add `surfaceId` to the settings store**

`src/types.ts:15` and `electron/types.ts:23` each declare `themeId: string;`. Add beside each:

```ts
    surfaceId: string;
```

`electron/store.ts:50` has `themeId: 'crimson-red',` in the defaults. Add beside it:

```ts
            surfaceId: 'axi',
```

`electron/main.ts:2211` declares `themeId?: string;` in a settings shape and `:2230` has `themeId: 'blood_legion',` in a fallback. Add `surfaceId?: string;` and `surfaceId: 'axi',` respectively. `'blood_legion'` there is a pre-redesign lore theme id that `resolveAccentId` maps forward; the surface has no such history, so its fallback is the plain default.

- [ ] **Step 7: Apply the surface at boot**

`src/App.tsx:139` currently reads:

```tsx
            const resolved = applyTheme(settings?.themeId);
```

Add immediately after it:

```tsx
            applySurface(settings?.surfaceId);
```

and extend that file's import from `./themes/applyTheme` to include `applySurface`.

- [ ] **Step 8: Add the control to the settings modal**

`src/components/SettingsModal.tsx` holds the accent grid under a `{/* Theme */}` comment ending at the `<p style={hintStyle}>` that names the current accent. Add a new block immediately after that closing `</div>`:

```tsx
                {/* Surface */}
                <div>
                    <div className="axi-eyebrow">Surface</div>
                    <div className="flex flex-wrap gap-2">
                        {SURFACES.map((s) => (
                            <button
                                key={s.id}
                                type="button"
                                aria-pressed={s.id === surfaceId}
                                className={`axi-btn axi-btn--sm${s.id === surfaceId ? ' axi-btn--primary' : ''}`}
                                onClick={() => { setSurfaceId(s.id); applySurface(s.id); onSurfaceChange?.(s.id); }}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>
```

Wire it the same way `themeId` is wired in that file:
- add `surfaceId: string;` to the props interface beside `themeId: string;` (line 16), and an optional `onSurfaceChange?: (id: string) => void;` beside `onThemeChange`
- `const [surfaceId, setSurfaceId] = useState<SurfaceId>(DEFAULT_SURFACE_ID);` beside line 32's `themeId` state
- include `surfaceId` in the two settings objects at lines 63 and 149 that already list `themeId`
- at line 109, beside `themeId: resolveAccentId(settings?.themeId),` add `surfaceId: resolveSurfaceId(settings?.surfaceId),`
- at line 114, beside `setThemeId(normalized.themeId);` add `setSurfaceId(resolveSurfaceId(normalized.surfaceId));`
- extend the import from `../themes/applyTheme` to `{ applyTheme, applySurface, resolveSurfaceId, SURFACES, DEFAULT_SURFACE_ID }` and the type import to include `SurfaceId`

`src/App.tsx:749-758` holds `cycleTheme`, which persists the accent by reading the settings back and writing the whole object:

```tsx
    const cycleTheme = () => {
        const currentIndex = ACCENTS.findIndex((t) => t.id === currentThemeId);
        const nextIndex = (currentIndex + 1) % ACCENTS.length;
        const next = ACCENTS[nextIndex];
        setCurrentThemeId(next.id);
        applyTheme(next.id);
        // Also persist via settings
        window.api.getSettings().then((settings) => {
            window.api.saveSettings({ ...settings, themeId: next.id } as any);
        });
    };
```

Add the surface's equivalent beside it, and pass it to `SettingsModal` as `onSurfaceChange`:

```tsx
    const persistSurface = (id: string) => {
        window.api.getSettings().then((settings) => {
            window.api.saveSettings({ ...settings, surfaceId: id } as any);
        });
    };
```

There is no surface equivalent of `cycleTheme`'s cycling — that is a titlebar affordance for the accent only, and the surface is not added to it.

- [ ] **Step 9: Verify the whole suite and the build**

```bash
cd ~/Documents/GitHub/axiam
npx vitest run
npm run build
```

Expected: all tests PASS, build succeeds. A TypeScript error about `surfaceId` missing from a settings object means Step 6 missed a declaration site — fix it rather than casting.

- [ ] **Step 10: Manual three-surface pass**

```bash
cd ~/Documents/GitHub/axiam
npm run dev
```

Open Settings, click each of Axi / Flat / Glass. Check: the whole window repaints together (one fade, not a stagger); glass shows the radial ground image and translucent panels; flat rounds corners to 6px; the choice survives a restart; and nothing in axiam's own `src/index.css` keeps a colour that fails to follow the surface. Fix any local literal you find as part of this task.

- [ ] **Step 11: Commit**

```bash
cd ~/Documents/GitHub/axiam
git add -A
git commit -m "feat: add the Axi/Flat/Glass surface picker

Ports the pattern from axiroster. The surface persists as settings.surfaceId
beside the accent's themeId, so the two stay siblings in one store. 'axi'
removes data-axi-theme rather than naming itself, and the crossfade timer is
now shared with the accent so changing both is one fade.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: axipulse — surface picker

**Repo:** `axipulse`

**Files:**
- Modify: `src/renderer/themes/applyTheme.ts`, `src/renderer/main.tsx`, `src/renderer/store.ts:87-88,171-172`, `src/renderer/app/AppLayout.tsx:48`, `src/renderer/views/SettingsView.tsx:55-56,123-142`, `src/shared/electronApi.ts:29-30`, `src/main/index.ts:148,152,159`, `package.json`
- Test: `src/renderer/themes/surface.test.ts` (create)

**Interfaces:**
- Consumes: `@axiapps/axi-design@^1.43.0`; `resolveAccentId` from `./accents`.
- Produces, from `src/renderer/themes/applyTheme.ts`:
  ```ts
  export const SURFACE_STORAGE_KEY = 'axipulse.surfaceId'
  export type SurfaceId = 'axi' | 'flat' | 'glass'
  export const SURFACES: { id: SurfaceId; label: string }[]
  export const DEFAULT_SURFACE_ID: SurfaceId
  export function resolveSurfaceId(id?: unknown): SurfaceId
  export function readStoredSurfaceId(): string | undefined
  export function applySurface(surfaceId?: unknown): SurfaceId
  ```
  This mirrors the accent's existing shape exactly: electron-store is the source of truth, `localStorage` is a synchronous boot mirror so a non-default choice does not flash on launch.

axipulse's house style in these files: 4-space indent, semicolons. Its vitest config sets `globals: true`, but existing files import from `vitest` explicitly; do the same.

**Note:** axipulse has `vitest.config.ts` but **no `test` script and no test files at all**. This task adds the script and the repo's first test.

- [ ] **Step 1: Add the test script**

In `package.json`, add to `scripts`:

```json
    "test": "vitest run",
```

The config already pins `maxForks: 2` / `maxWorkers: 2`, which satisfies the parallelism constraint without a CLI flag.

- [ ] **Step 2: Write the failing test**

Create `src/renderer/themes/surface.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// The renderer suite runs in the node environment, so the two browser globals
// this module touches are stubbed here rather than pulling in jsdom.
type FakeRoot = {
    attrs: Record<string, string>;
    classes: Set<string>;
    setAttribute: (k: string, v: string) => void;
    removeAttribute: (k: string) => void;
    classList: { add: (c: string) => void; remove: (c: string) => void };
};

function fakeRoot(): FakeRoot {
    const attrs: Record<string, string> = {};
    const classes = new Set<string>();
    return {
        attrs,
        classes,
        setAttribute: (k, v) => { attrs[k] = v; },
        removeAttribute: (k) => { delete attrs[k]; },
        classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c) },
    };
}

let root: FakeRoot;
let store: Map<string, string>;

beforeEach(() => {
    vi.resetModules();
    root = fakeRoot();
    store = new Map();
    vi.stubGlobal('document', { documentElement: root });
    vi.stubGlobal('localStorage', {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
    });
});

afterEach(() => {
    vi.unstubAllGlobals();
});

async function load() {
    return import('./applyTheme');
}

describe('resolveSurfaceId', () => {
    it('defaults to the language itself', async () => {
        const { resolveSurfaceId, DEFAULT_SURFACE_ID } = await load();
        expect(DEFAULT_SURFACE_ID).toBe('axi');
        expect(resolveSurfaceId(null)).toBe('axi');
        expect(resolveSurfaceId(undefined)).toBe('axi');
    });

    it('passes through the ids the design language defines', async () => {
        const { resolveSurfaceId } = await load();
        expect(resolveSurfaceId('axi')).toBe('axi');
        expect(resolveSurfaceId('flat')).toBe('flat');
        expect(resolveSurfaceId('glass')).toBe('glass');
    });

    it('falls back to axi for anything else, including inherited names and non-strings', async () => {
        const { resolveSurfaceId } = await load();
        expect(resolveSurfaceId('frosted')).toBe('axi');
        expect(resolveSurfaceId('')).toBe('axi');
        expect(resolveSurfaceId('constructor')).toBe('axi');
        expect(resolveSurfaceId('__proto__')).toBe('axi');
        expect(resolveSurfaceId(42)).toBe('axi');
        expect(resolveSurfaceId({})).toBe('axi');
    });
});

describe('readStoredSurfaceId', () => {
    it('is undefined when the mirror is empty, so the store decides', async () => {
        const { readStoredSurfaceId } = await load();
        expect(readStoredSurfaceId()).toBeUndefined();
    });

    it('reads back a mirrored surface', async () => {
        store.set('axipulse.surfaceId', 'glass');
        const { readStoredSurfaceId } = await load();
        expect(readStoredSurfaceId()).toBe('glass');
    });

    // Review Focus 1
    it('is undefined when storage is unavailable', async () => {
        vi.stubGlobal('localStorage', {
            getItem: () => { throw new Error('storage disabled'); },
            setItem: () => { throw new Error('storage disabled'); },
        });
        const { readStoredSurfaceId } = await load();
        expect(readStoredSurfaceId()).toBeUndefined();
    });
});

describe('applySurface', () => {
    it('puts a theme on <html> and mirrors it', async () => {
        const { applySurface } = await load();
        expect(applySurface('glass')).toBe('glass');
        expect(root.attrs['data-axi-theme']).toBe('glass');
        expect(store.get('axipulse.surfaceId')).toBe('glass');
    });

    it('treats flat as a theme like any other', async () => {
        const { applySurface } = await load();
        expect(applySurface('flat')).toBe('flat');
        expect(root.attrs['data-axi-theme']).toBe('flat');
    });

    it('removes the attribute for axi rather than naming the language', async () => {
        const { applySurface } = await load();
        applySurface('glass');
        expect(applySurface('axi')).toBe('axi');
        expect(root.attrs['data-axi-theme']).toBeUndefined();
        expect(store.get('axipulse.surfaceId')).toBe('axi');
    });

    it('crossfades so the whole app repaints together', async () => {
        const { applySurface } = await load();
        applySurface('glass');
        expect(root.classes.has('theme-transitioning')).toBe(true);
    });

    // Review Focus 1
    it('still applies the surface when storage is unavailable', async () => {
        vi.stubGlobal('localStorage', {
            getItem: () => null,
            setItem: () => { throw new Error('storage disabled'); },
        });
        const { applySurface } = await load();
        expect(applySurface('glass')).toBe('glass');
        expect(root.attrs['data-axi-theme']).toBe('glass');
    });

    // Review Focus 5 — the store wins over a stale mirror, and the write-through
    // updates the mirror so the next boot agrees.
    it('overwrites a stale mirror when the store answers with something else', async () => {
        store.set('axipulse.surfaceId', 'glass');
        const { readStoredSurfaceId, applySurface } = await load();
        expect(readStoredSurfaceId()).toBe('glass');
        applySurface('flat');
        expect(root.attrs['data-axi-theme']).toBe('flat');
        expect(store.get('axipulse.surfaceId')).toBe('flat');
    });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd ~/Documents/GitHub/axipulse
npx vitest run src/renderer/themes/surface.test.ts
```

Expected: FAIL — `resolveSurfaceId` is not exported.

- [ ] **Step 4: Add the surface functions**

Rewrite `src/renderer/themes/applyTheme.ts` so both settings share one crossfade timer:

```ts
import { resolveAccentId } from './accents';

export const ACCENT_STORAGE_KEY = 'axipulse.accentId';

// The surface rides alongside the accent and for the same reason: electron-store
// is the source of truth but getSettings() resolves after first paint, so a
// synchronous mirror is what stops a non-default surface flashing on launch.
export const SURFACE_STORAGE_KEY = 'axipulse.surfaceId';

export type SurfaceId = 'axi' | 'flat' | 'glass';

/** 'axi' is the language itself, drawn with no `data-axi-theme` at all. 'flat'
 *  and 'glass' are repaints of it shipped as
 *  `@axiapps/axi-design/themes/<id>.css`. */
export const SURFACES: { id: SurfaceId; label: string }[] = [
    { id: 'axi', label: 'Axi' },
    { id: 'flat', label: 'Flat' },
    { id: 'glass', label: 'Glass' },
];

/** AxiPulse has always been drawn in the language itself, so that stays the default. */
export const DEFAULT_SURFACE_ID: SurfaceId = 'axi';

let transitionTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Holds the crossfade class on <html> for the length of the transition so the
 * whole app changes together. Shared by the accent and the surface: changing
 * both at once should still be one fade, so the timer is not per-attribute.
 */
function crossfade(root: Element): void {
    root.classList.add('theme-transitioning');
    if (transitionTimer) clearTimeout(transitionTimer);
    transitionTimer = setTimeout(() => {
        root.classList.remove('theme-transitioning');
        transitionTimer = null;
    }, 500);
}

// electron-store is the source of truth, but getSettings() is async and
// resolves after first paint. This mirror is read synchronously at bootstrap
// so a non-default accent does not flash emerald on every launch.
export function readStoredAccentId(): string | undefined {
    try {
        return localStorage.getItem(ACCENT_STORAGE_KEY) ?? undefined;
    } catch {
        return undefined;
    }
}

export function applyTheme(themeId?: unknown): string {
    const id = resolveAccentId(themeId);
    const root = document.documentElement;

    crossfade(root);

    root.setAttribute('data-axi-accent', id);

    // Storage can be disabled; the accent still applied, so swallow.
    try {
        localStorage.setItem(ACCENT_STORAGE_KEY, id);
    } catch {
        /* the mirror is a cache, not the source of truth */
    }

    return id;
}

/** Always returns one of the three ids. Membership is tested against the array
 *  rather than an object, so inherited property names are unknown values like
 *  any other. */
export function resolveSurfaceId(id?: unknown): SurfaceId {
    return SURFACES.some((s) => s.id === id) ? (id as SurfaceId) : DEFAULT_SURFACE_ID;
}

export function readStoredSurfaceId(): string | undefined {
    try {
        return localStorage.getItem(SURFACE_STORAGE_KEY) ?? undefined;
    } catch {
        return undefined;
    }
}

/**
 * Puts a surface on <html> and mirrors it. 'axi' removes the attribute rather
 * than naming itself: the language is not a theme layered over itself, and
 * axi-design's own rule is that removing `data-axi-theme` leaves you back on it
 * unchanged.
 */
export function applySurface(surfaceId?: unknown): SurfaceId {
    const id = resolveSurfaceId(surfaceId);
    const root = document.documentElement;

    crossfade(root);

    if (id === 'axi') root.removeAttribute('data-axi-theme');
    else root.setAttribute('data-axi-theme', id);

    try {
        localStorage.setItem(SURFACE_STORAGE_KEY, id);
    } catch {
        /* the mirror is a cache, not the source of truth */
    }

    return id;
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd ~/Documents/GitHub/axipulse
npm test
```

Expected: PASS, 12 tests.

- [ ] **Step 6: Bump the dependency and import the themes**

In `package.json`, change `"@axiapps/axi-design": "^1.8.0"` to `"^1.43.0"`, then `npm install`.

In `src/renderer/main.tsx`, the stylesheet block becomes — note the existing comment says "these four stylesheets", which is now six:

```tsx
// These six stylesheets must be imported before anything that might read a
// token off them at module scope (e.g. BoonPerformanceChart's SERIES ramp).
// ES modules evaluate in import-declaration order, and the static chain
// App -> AppLayout -> PulseView -> BoonsSubview -> BoonPerformanceChart runs
// synchronously, so importing App first would run that module body before
// any stylesheet is evaluated in `npm run dev` (Vite's dev server serves CSS
// imports as JS side effects in declaration order; only the production
// build emits a <link rel=stylesheet> ahead of the module script, which is
// why this bug did not show up under `npm run build`).
import '@axiapps/axi-design/axi.css';
import '@axiapps/axi-design/accents.css';
import '@axiapps/axi-design/themes/flat.css';
import '@axiapps/axi-design/themes/glass.css';
import './index.css'
import './themes/series.css'
import App from './App.tsx'
import { applyTheme, readStoredAccentId, applySurface, readStoredSurfaceId } from './themes/applyTheme'

// electron-store is the source of truth, but getSettings() resolves after
// first paint. Bootstrapping from the synchronous localStorage mirrors keeps
// a non-default accent or surface from flashing on every launch.
applyTheme(readStoredAccentId())
applySurface(readStoredSurfaceId())
```

`themes/series.css` aliases onto `--axi-*` tokens, so it follows the surface without change. Confirm that during the manual pass rather than assuming it.

- [ ] **Step 7: Plumb `surfaceId` through the store**

`src/shared/electronApi.ts:29-30` declares the settings shape twice. Add `surfaceId: string;` to the `getSettings` return type and `surfaceId?: string;` to the `saveSettings` parameter:

```ts
    getSettings: () => Promise<{ logDirectory: string; devMinFileSize: number; accentId: string; surfaceId: string }>;
    saveSettings: (settings: { logDirectory?: string; devMinFileSize?: number; accentId?: string; surfaceId?: string }) => void;
```

`src/main/index.ts:148` builds the settings reply. Add beside the `accentId` line:

```ts
            surfaceId: store.get('surfaceId', 'axi') as string,
```

`src/main/index.ts:152` types the `save-settings` payload — add `surfaceId?: string` to it. And beside the `settings.accentId !== undefined` guard at `:159`:

```ts
        if (settings.surfaceId !== undefined) {
            store.set('surfaceId', settings.surfaceId);
        }
```

- [ ] **Step 8: Add the control to the settings view**

`src/renderer/views/SettingsView.tsx` has an `{/* Accent */}` `SectionCard` ending at line 142's `</SectionCard>`. Add immediately after it:

```tsx
                {/* Surface */}
                <SectionCard label="Surface">
                    <div className="flex flex-wrap gap-2">
                        {SURFACES.map((s) => (
                            <button
                                key={s.id}
                                type="button"
                                aria-pressed={s.id === surfaceId}
                                className={`axi-btn axi-btn--sm${s.id === surfaceId ? ' axi-btn--primary' : ''}`}
                                onClick={() => {
                                    // setSurfaceId applies and mirrors via the
                                    // store; calling applySurface here too would
                                    // double the crossfade.
                                    setSurfaceId(s.id);
                                    window.electronAPI?.saveSettings({ surfaceId: s.id });
                                }}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </SectionCard>
```

The accent is **not** local state here — it lives in the zustand store. `src/renderer/store.ts:87-88` declares it and `:171-172` implement it:

```ts
    accentId: string;
    setAccentId: (id: string) => void;
```
```ts
    accentId: resolveAccentId(readStoredAccentId()),
    setAccentId: (id) => set({ accentId: applyTheme(id) }),
```

The surface goes in the same place, so add to the store's type:

```ts
    surfaceId: SurfaceId;
    setSurfaceId: (id: string) => void;
```

and to its initialiser:

```ts
    surfaceId: resolveSurfaceId(readStoredSurfaceId()),
    setSurfaceId: (id) => set({ surfaceId: applySurface(id) }),
```

extending that file's import from `./themes/applyTheme` to include `applySurface`, `readStoredSurfaceId`, `resolveSurfaceId` and the `SurfaceId` type. Note `setSurfaceId` takes the store's value from `applySurface`'s **return**, so an unrecognised id resolves once and the store never holds a surface the DOM does not have — matching how `setAccentId` uses `applyTheme`'s return.

`src/renderer/app/AppLayout.tsx:48` reconciles the accent once IPC answers with `useAppStore.getState().setAccentId(s.accentId)`. Add beside it:

```tsx
                useAppStore.getState().setSurfaceId(s.surfaceId);
```

In `SettingsView.tsx`, read both from the store beside line 55-56:

```tsx
    const surfaceId = useAppStore(s => s.surfaceId);
    const setSurfaceId = useAppStore(s => s.setSurfaceId);
```

and import `{ SURFACES }` from `../themes/applyTheme`. The `onClick` in the block above calls `setSurfaceId(s.id)` — which applies and mirrors through the store — then `saveSettings`, exactly as the accent's handler does at lines 136-137.

- [ ] **Step 9: Verify the suite and the build**

```bash
cd ~/Documents/GitHub/axipulse
npm test
npm run build
```

Expected: both PASS.

- [ ] **Step 10: Manual three-surface pass**

```bash
cd ~/Documents/GitHub/axipulse
npm run dev
```

Click each surface in Settings. Check the whole window fades together, the choice survives a restart, and — specifically for this app — that the boon/series charts painted from `themes/series.css` follow the surface rather than keeping Axi's colours. Fix any literal in `src/renderer/index.css` or `series.css` that does not follow.

- [ ] **Step 11: Commit**

```bash
cd ~/Documents/GitHub/axipulse
git add -A
git commit -m "feat: add the Axi/Flat/Glass surface picker

The surface follows the accent's architecture exactly: electron-store is
the source of truth, localStorage is a synchronous boot mirror so a
non-default choice does not flash on launch. Adds the repo's first test
and the test script to run it.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: axivale — surface picker

**Repo:** `axivale`

**Files:**
- Modify: `src/renderer/src/themes/applyTheme.ts`, `src/renderer/src/main.tsx`, `src/renderer/src/theme.css`, `src/renderer/src/components/settings/Appearance.tsx`, `src/renderer/src/components/Settings.tsx:122,448,759`, `src/main/secrets.ts:35-37`, `package.json`
- Test: `src/renderer/src/themes/surface.test.ts` (create)

**Interfaces:**
- Consumes: `@axiapps/axi-design@^1.43.0`; `DEFAULT_ACCENT_ID`, `resolveAccentId` from `./accents`.
- Produces, from `src/renderer/src/themes/applyTheme.ts`:
  ```ts
  export const SURFACE_STORAGE_KEY = 'axivale.surface'
  export type SurfaceId = 'axi' | 'flat' | 'glass'
  export const SURFACES: { id: SurfaceId; label: string }[]
  export const DEFAULT_SURFACE_ID: SurfaceId
  export function resolveSurfaceId(id?: string | null): SurfaceId
  export function readSurface(): SurfaceId
  export function applySurface(id: string): void
  export function applySurfaceSetting(
    id: string, previous: string, persist: (id: string) => Promise<unknown>
  ): Promise<string>
  ```
  `applySurfaceSetting` parallels the existing `applyAccent`: optimistic write with rollback, because the settings store is encrypted and answers over IPC, and a picker that waits for the round-trip feels broken.
- Also produces: `AppearanceProps` grows `surface: string` and `onSelectSurface: (id: string) => void`.

axivale's house style: 2-space indent, no semicolons.

**This app has no `theme-transitioning` rule at all**, so Step 6 writes it — both halves, including the `prefers-reduced-motion` opt-out.

- [ ] **Step 1: Write the failing test**

Create `src/renderer/src/themes/surface.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// The renderer suite runs in the node environment, so the two browser globals
// this module touches are stubbed rather than pulling in jsdom for one file.
type FakeRoot = {
  attrs: Record<string, string>
  classes: Set<string>
  setAttribute: (k: string, v: string) => void
  removeAttribute: (k: string) => void
  classList: { add: (c: string) => void; remove: (c: string) => void }
}

function fakeRoot(): FakeRoot {
  const attrs: Record<string, string> = {}
  const classes = new Set<string>()
  return {
    attrs,
    classes,
    setAttribute: (k, v) => {
      attrs[k] = v
    },
    removeAttribute: (k) => {
      delete attrs[k]
    },
    classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c) }
  }
}

let root: FakeRoot
let store: Map<string, string>

beforeEach(() => {
  vi.resetModules()
  root = fakeRoot()
  store = new Map()
  vi.stubGlobal('document', { documentElement: root })
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k)
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function load() {
  return import('./applyTheme')
}

describe('resolveSurfaceId', () => {
  it('defaults to the language itself', async () => {
    const { resolveSurfaceId, DEFAULT_SURFACE_ID } = await load()
    expect(DEFAULT_SURFACE_ID).toBe('axi')
    expect(resolveSurfaceId(null)).toBe('axi')
    expect(resolveSurfaceId(undefined)).toBe('axi')
  })

  it('passes through the ids the design language defines', async () => {
    const { resolveSurfaceId } = await load()
    expect(resolveSurfaceId('axi')).toBe('axi')
    expect(resolveSurfaceId('flat')).toBe('flat')
    expect(resolveSurfaceId('glass')).toBe('glass')
  })

  it('falls back to axi for anything else, including inherited property names', async () => {
    const { resolveSurfaceId } = await load()
    expect(resolveSurfaceId('frosted')).toBe('axi')
    expect(resolveSurfaceId('')).toBe('axi')
    expect(resolveSurfaceId('constructor')).toBe('axi')
    expect(resolveSurfaceId('__proto__')).toBe('axi')
  })
})

describe('readSurface', () => {
  it('is axi when nothing has been mirrored', async () => {
    const { readSurface } = await load()
    expect(readSurface()).toBe('axi')
  })

  it('reads back a mirrored surface', async () => {
    store.set('axivale.surface', 'glass')
    const { readSurface } = await load()
    expect(readSurface()).toBe('glass')
  })

  // Review Focus 1
  it('is axi when storage is unavailable', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('storage disabled')
      },
      setItem: () => {
        throw new Error('storage disabled')
      }
    })
    const { readSurface } = await load()
    expect(readSurface()).toBe('axi')
  })
})

describe('applySurface', () => {
  it('puts a theme on <html> and mirrors it', async () => {
    const { applySurface } = await load()
    applySurface('glass')
    expect(root.attrs['data-axi-theme']).toBe('glass')
    expect(store.get('axivale.surface')).toBe('glass')
  })

  it('treats flat as a theme like any other', async () => {
    const { applySurface } = await load()
    applySurface('flat')
    expect(root.attrs['data-axi-theme']).toBe('flat')
  })

  it('removes the attribute for axi rather than naming the language', async () => {
    const { applySurface } = await load()
    applySurface('glass')
    applySurface('axi')
    expect(root.attrs['data-axi-theme']).toBeUndefined()
    expect(store.get('axivale.surface')).toBe('axi')
  })

  it('crossfades so the whole app repaints together', async () => {
    const { applySurface } = await load()
    applySurface('glass')
    expect(root.classes.has('theme-transitioning')).toBe(true)
  })

  // Review Focus 1
  it('still applies the surface when storage is unavailable', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {
        throw new Error('storage disabled')
      }
    })
    const { applySurface } = await load()
    applySurface('glass')
    expect(root.attrs['data-axi-theme']).toBe('glass')
  })
})

describe('applySurfaceSetting', () => {
  it('keeps the new surface when the store accepts it', async () => {
    const { applySurfaceSetting } = await load()
    const settled = await applySurfaceSetting('glass', 'axi', async () => undefined)
    expect(settled).toBe('glass')
    expect(root.attrs['data-axi-theme']).toBe('glass')
  })

  // Review Focus 5 — a refused write must not leave the window showing a
  // surface the store does not hold, or it reads as the app forgetting.
  it('rolls back to the previous surface when the store refuses', async () => {
    const { applySurfaceSetting } = await load()
    const settled = await applySurfaceSetting('glass', 'flat', async () => {
      throw new Error('store locked')
    })
    expect(settled).toBe('flat')
    expect(root.attrs['data-axi-theme']).toBe('flat')
    expect(store.get('axivale.surface')).toBe('flat')
  })

  it('rolls back to axi by removing the attribute, not by naming it', async () => {
    const { applySurfaceSetting } = await load()
    const settled = await applySurfaceSetting('glass', 'axi', async () => {
      throw new Error('store locked')
    })
    expect(settled).toBe('axi')
    expect(root.attrs['data-axi-theme']).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd ~/Documents/GitHub/axivale
npx vitest run src/renderer/src/themes/surface.test.ts
```

Expected: FAIL — `resolveSurfaceId` is not exported.

- [ ] **Step 3: Add the surface functions**

Append to `src/renderer/src/themes/applyTheme.ts`, and add the shared crossfade that the file currently lacks entirely:

```ts
/** The synchronous boot mirror for the surface, for the same reason as the
 *  accent's: the settings store answers over async IPC, long after first paint. */
export const SURFACE_STORAGE_KEY = 'axivale.surface'

/** 'axi' is the language itself, drawn with no `data-axi-theme` at all. 'flat'
 *  and 'glass' are repaints of it shipped as
 *  `@axiapps/axi-design/themes/<id>.css`. */
export type SurfaceId = 'axi' | 'flat' | 'glass'

export const SURFACES: { id: SurfaceId; label: string }[] = [
  { id: 'axi', label: 'Axi' },
  { id: 'flat', label: 'Flat' },
  { id: 'glass', label: 'Glass' }
]

/** AxiVale has always been drawn in the language itself, so that stays the default. */
export const DEFAULT_SURFACE_ID: SurfaceId = 'axi'

/** Always returns one of the three ids. Membership is tested against the array
 *  rather than an object, so inherited property names are unknown values like
 *  any other. */
export function resolveSurfaceId(id?: string | null): SurfaceId {
  return SURFACES.some((s) => s.id === id) ? (id as SurfaceId) : DEFAULT_SURFACE_ID
}

export function readSurface(): SurfaceId {
  try {
    return resolveSurfaceId(localStorage.getItem(SURFACE_STORAGE_KEY))
  } catch {
    return DEFAULT_SURFACE_ID
  }
}

/** Sets the surface on <html> and mirrors it. 'axi' removes the attribute
 *  rather than naming itself: the language is not a theme layered over itself,
 *  and axi-design's own rule is that removing `data-axi-theme` leaves you back
 *  on it unchanged. */
export function applySurface(id: string): void {
  const resolved = resolveSurfaceId(id)
  const root = document.documentElement

  crossfade(root)

  if (resolved === 'axi') root.removeAttribute('data-axi-theme')
  else root.setAttribute('data-axi-theme', resolved)

  try {
    localStorage.setItem(SURFACE_STORAGE_KEY, resolved)
  } catch {
    /* no mirror this run; the store still holds the truth */
  }
}

/**
 * The surface's counterpart to applyAccent: optimistic, with rollback. Same
 * reasoning — the store is encrypted and answers over IPC, so waiting for the
 * round trip feels broken, and leaving the window on a surface the store does
 * not hold would silently revert at the next boot and read as forgetting.
 */
export async function applySurfaceSetting(
  id: string,
  previous: string,
  persist: (id: string) => Promise<unknown>
): Promise<string> {
  applySurface(id)
  try {
    await persist(id)
    return resolveSurfaceId(id)
  } catch {
    applySurface(previous)
    return resolveSurfaceId(previous)
  }
}
```

Add the shared crossfade helper near the top of the file, after the imports:

```ts
let transitionTimer: ReturnType<typeof setTimeout> | null = null

/** Holds the crossfade class on <html> for the length of the transition so the
 *  whole window changes together. Shared by the accent and the surface:
 *  changing both at once should still be one fade. */
function crossfade(root: Element): void {
  root.classList.add('theme-transitioning')
  if (transitionTimer) clearTimeout(transitionTimer)
  transitionTimer = setTimeout(() => {
    root.classList.remove('theme-transitioning')
    transitionTimer = null
  }, 500)
}
```

and add `crossfade(document.documentElement)` as the first statement of the existing `applyTheme`, so the accent uses the same timer.

- [ ] **Step 4: Run test to verify it passes**

```bash
cd ~/Documents/GitHub/axivale
npx vitest run src/renderer/src/themes/surface.test.ts
```

Expected: PASS, 13 tests.

- [ ] **Step 5: Bump the dependency and import the themes**

In `package.json`, change `"@axiapps/axi-design": "^1.10.0"` to `"^1.43.0"`, then `npm install`.

`src/renderer/src/main.tsx` becomes:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
// Order matters: axi.css declares the tokens, accents.css overrides --axi-accent
// per [data-axi-accent], the two theme files restate the token set per
// [data-axi-theme], and theme.css (imported by App) aliases onto all of them and
// must come last to win at :root.
import '@axiapps/axi-design/axi.css'
import '@axiapps/axi-design/accents.css'
import '@axiapps/axi-design/themes/flat.css'
import '@axiapps/axi-design/themes/glass.css'
import App from './App'
import { applyTheme, readAccent, applySurface, readSurface } from './themes/applyTheme'

// Synchronous, from the mirrors — the store reconciles in Settings once IPC
// answers. This runs before render so the first paint is already correct.
applyTheme(readAccent())
applySurface(readSurface())
```

`theme.css` only *aliases* (`--bg: var(--axi-ground)`), so it does not collide with the theme files even at equal specificity — it never declares an `--axi-*` token itself. Do not change that.

**Do not touch `src/share-viewer/main.tsx`.** Published pages stay on the language.

- [ ] **Step 6: Write the crossfade rule and fix the glass ground**

`src/renderer/src/theme.css` has no `theme-transitioning` rule. Add after the `:root` block:

```css
/* --- accent and surface crossfade --- */
/* One class, held for 500ms by applyTheme/applySurface, so the whole window
   repaints together instead of each element snapping on its own next frame. */
.theme-transitioning *,
.theme-transitioning *::before,
.theme-transitioning *::after {
  transition:
    background-color 0.4s ease,
    border-color 0.4s ease,
    color 0.2s ease,
    box-shadow 0.4s ease,
    outline-color 0.4s ease !important;
}

@media (prefers-reduced-motion: reduce) {
  .theme-transitioning *,
  .theme-transitioning *::before,
  .theme-transitioning *::after {
    transition: none !important;
  }
}
```

Both halves. A surface change repaints every element on screen at once, which is exactly the motion a reader who asked for less of it does not want.

Line 32 of that file is `body{color:var(--ink);overflow:hidden;background:var(--axi-ground)}`. Glass paints its atmosphere through `--axi-ground-image`, which a `background` colour shorthand discards. Change it to:

```css
body{color:var(--ink);overflow:hidden;background-color:var(--axi-ground);background-image:var(--axi-ground-image)}
```

`--axi-ground-image` is `none` in the language and in flat, so this is inert except under glass.

- [ ] **Step 7: Add the reduced-motion assertion**

Append to `src/renderer/src/themes/surface.test.ts` (Review Focus 4):

```ts
describe('the crossfade stylesheet', () => {
  it('transitions on the class and turns itself off under reduced motion', async () => {
    const { readFileSync } = await import('node:fs')
    const css = readFileSync(new URL('../theme.css', import.meta.url), 'utf8')
    expect(css).toMatch(/\.theme-transitioning \*/)
    expect(css).toMatch(/prefers-reduced-motion: reduce/)
    // The opt-out must apply to the crossfade, not merely exist somewhere in
    // the file.
    const reduced = css.slice(css.indexOf('prefers-reduced-motion: reduce'))
    expect(reduced).toMatch(/\.theme-transitioning \*[\s\S]*transition: none/)
  })

  it('paints the glass ground image on body, not just the ground colour', async () => {
    const { readFileSync } = await import('node:fs')
    const css = readFileSync(new URL('../theme.css', import.meta.url), 'utf8')
    expect(css).toMatch(/background-image:\s*var\(--axi-ground-image\)/)
  })
})
```

Run it:

```bash
cd ~/Documents/GitHub/axivale
npx vitest run src/renderer/src/themes/surface.test.ts
```

Expected: PASS, 15 tests.

- [ ] **Step 8: Add `surface` to the settings store key union**

`src/main/secrets.ts:35-37` has a key union including `'accent'`, with a comment reading "One of @axiapps/axi-design's 11 accent ids". Change the count to 12 and add the surface key:

```ts
  /** One of @axiapps/axi-design's 12 accent ids; unknown values resolve to
   *  the default. */
  | 'accent'
  /** One of 'axi' | 'flat' | 'glass'; unknown values resolve to 'axi'. */
  | 'surface'
```

Keep the surrounding formatting of that union exactly as it is.

- [ ] **Step 9: Add the control to Appearance**

`src/renderer/src/components/settings/Appearance.tsx` becomes:

```tsx
import type { ReactElement } from 'react'
import { Pane, Card, Field } from '../panelui'
import { ACCENTS } from '../../themes/accents'
import { SURFACES } from '../../themes/applyTheme'

export interface AppearanceProps {
  /** The accent id currently in force. */
  accent: string
  onSelect: (id: string) => void
  /** The surface id currently in force: 'axi', 'flat' or 'glass'. */
  surface: string
  onSelectSurface: (id: string) => void
}

export default function Appearance({
  accent,
  onSelect,
  surface,
  onSelectSurface
}: AppearanceProps): ReactElement {
  return (
    <Pane
      no="08"
      title="Appearance"
      sub="The ink this edition is printed in, and the stock it is printed on. Shared with every other axi application."
    >
      <Card title="Accent">
        <Field
          label="Accent colour"
          help="Applies immediately and is remembered between sessions."
        >
          <div className="accent-grid">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                type="button"
                className="accent-swatch"
                data-accent-id={a.id}
                aria-pressed={a.id === accent}
                aria-label={a.label}
                title={a.label}
                // The swatch has to show the colour it selects, which is the one
                // place in this file a value comes from data rather than a token.
                style={{ '--swatch': a.hex } as React.CSSProperties}
                onClick={() => onSelect(a.id)}
              >
                <span className="accent-swatch__chip" />
                <span className="accent-swatch__name">{a.label}</span>
              </button>
            ))}
          </div>
        </Field>
      </Card>

      <Card title="Surface">
        <Field
          label="Surface"
          help="Axi is the design language itself. Flat softens the block and rounds the corners; Glass makes the panels translucent."
        >
          <div className="flex flex-wrap gap-2">
            {SURFACES.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`axi-btn axi-btn--sm${s.id === surface ? ' axi-btn--primary' : ''}`}
                data-surface-id={s.id}
                aria-pressed={s.id === surface}
                onClick={() => onSelectSurface(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </Field>
      </Card>
    </Pane>
  )
}
```

- [ ] **Step 10: Wire it in Settings.tsx**

`src/renderer/src/components/Settings.tsx:124` seeds the accent from the mirror with `const [accent, setAccent] = useState(readAccent)`, and `:442-452` holds `chooseAccent`:

```tsx
  async function chooseAccent(id: string): Promise<void> {
    // Optimistic with rollback: the store is encrypted and answers over IPC,
    // so waiting for it feels broken, but a UI left ahead of the store would
    // silently revert at the next boot.
    const previous = chosenAccent.current ?? accent
    chosenAccent.current = id
    const settled = await applyAccent(id, previous, (next) =>
      window.officer.setSetting('accent', next)
    )
    chosenAccent.current = settled
    setAccent(settled)
  }
```

The `chosenAccent` ref is the latch that stops the load effect's dozen serial IPC calls from reverting a swatch clicked while they are still in flight (see the comment at `:125-128`). The surface needs the same latch for the same reason.

Add beside them:

```tsx
  const [surface, setSurface] = useState(readSurface)
  // Same latch as chosenAccent: the load effect awaits a dozen serial IPC calls
  // before it reads the surface, so a button clicked in that window would
  // otherwise be reverted by a store value that is already stale.
  const chosenSurface = useRef<string | null>(null)

  async function chooseSurface(id: string): Promise<void> {
    const previous = chosenSurface.current ?? surface
    chosenSurface.current = id
    const settled = await applySurfaceSetting(id, previous, (next) =>
      window.officer.setSetting('surface', next)
    )
    chosenSurface.current = settled
    setSurface(settled)
  }
```

Wherever the load effect reconciles `accent` against the store behind the `chosenAccent` latch, reconcile `surface` the same way behind `chosenSurface`, resolving the stored value through `resolveSurfaceId`.

Then:
- extend the import from `../themes/applyTheme` to include `applySurfaceSetting`, `readSurface` and `resolveSurfaceId`
- line 759 becomes:
  ```tsx
  {section === 'appearance' && (
    <Appearance
      accent={accent}
      onSelect={chooseAccent}
      surface={surface}
      onSelectSurface={chooseSurface}
    />
  )}
  ```

`src/renderer/src/components/settings/Appearance.test.tsx` exists and will fail to compile against the new required props. Add a surface case to it:

```tsx
it('marks the current surface pressed and reports a click', async () => {
  const onSelectSurface = vi.fn()
  render(
    <Appearance accent="crimson-red" onSelect={() => {}} surface="flat" onSelectSurface={onSelectSurface} />
  )
  const flat = screen.getByRole('button', { name: 'Flat' })
  expect(flat).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('button', { name: 'Glass' })).toHaveAttribute('aria-pressed', 'false')
  await userEvent.click(screen.getByRole('button', { name: 'Glass' }))
  expect(onSelectSurface).toHaveBeenCalledWith('glass')
})
```

Match that file's existing import and render helpers rather than introducing new ones.

- [ ] **Step 11: Verify the suite and the build**

```bash
cd ~/Documents/GitHub/axivale
npm test
npm run build
```

Expected: both PASS. `Settings.accent.test.tsx` and `applyTheme.test.ts` must still pass — if `applyTheme.test.ts` fails because of the new `crossfade` call, the test is asserting on a document stub that lacks `classList`; extend the stub rather than removing the crossfade.

- [ ] **Step 12: Manual three-surface pass**

```bash
cd ~/Documents/GitHub/axivale
npm run dev
```

Click each surface. Check the fade covers the whole window, glass shows the radial ground through `body`, the choice survives a restart, and `--accent-b` (the `color-mix` local extension at `theme.css:25`) still reads correctly against each surface's text ink. Open the share viewer and confirm it is **unchanged** — still on the language, no `data-axi-theme`.

- [ ] **Step 13: Commit**

```bash
cd ~/Documents/GitHub/axivale
git add -A
git commit -m "feat: add the Axi/Flat/Glass surface picker

Mirrors the accent's architecture: encrypted store as the source of
truth, localStorage as the synchronous boot mirror, and an optimistic
write with rollback so a refused write does not leave the window showing
a surface the store does not hold.

Also writes the crossfade rule this app never had, including the
prefers-reduced-motion opt-out, and paints --axi-ground-image on body so
glass shows its atmosphere.

The share viewer is deliberately untouched: published pages stay on the
language.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: axiom — accent system and surface picker

**Repo:** `axiom`

This is the largest task: axiom has no appearance system at all. `src/main.tsx` imports `axi.css` and nothing else, there is no themes module, and `SettingsView.tsx` has no appearance section. It gets the accent picker *and* the surface picker.

**Files:**
- Create: `src/themes/accents.ts`, `src/themes/applyTheme.ts`, `src/themes/surface.test.ts`
- Modify: `src/main.tsx`, `src/styles/globals.css`, `src/components/SettingsView.tsx`, `package.json`

**Interfaces:**
- Consumes: `@axiapps/axi-design@^1.43.0` (`accents.css`, `accents.json`, both theme files).
- Produces, from `src/themes/accents.ts`:
  ```ts
  export type AccentDefinition = { id: string; label: string; hex: string }
  export const ACCENTS: AccentDefinition[]
  export const DEFAULT_ACCENT_ID = 'axi-gold'
  export function resolveAccentId(id?: string | null): string
  ```
  and from `src/themes/applyTheme.ts`:
  ```ts
  export const ACCENT_STORAGE_KEY = 'axiom.accent'
  export const SURFACE_STORAGE_KEY = 'axiom.surface'
  export type SurfaceId = 'axi' | 'flat' | 'glass'
  export const SURFACES: { id: SurfaceId; label: string }[]
  export const DEFAULT_SURFACE_ID: SurfaceId
  export function resolveSurfaceId(id?: string | null): SurfaceId
  export function readAccent(): string
  export function readSurface(): SurfaceId
  export function applyTheme(accentId?: string | null): string
  export function applySurface(surfaceId?: string | null): SurfaceId
  ```

`localStorage` is the store for both, not axiom's `useConfig`. `useConfig` answers asynchronously, and appearance is renderer-only here — there is nothing in the main process that needs to know the accent. A synchronous read before first render is worth more than symmetry with the other settings in that panel.

axiom's house style: 2-space indent, no semicolons. Its vitest config is `environment: 'jsdom'`, `globals: true`, with `setupFiles: ['./src/__tests__/setup.ts']` — so **real** `document` and `localStorage` exist and the test does not stub globals.

- [ ] **Step 1: Write the failing test**

Create `src/themes/surface.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  ACCENT_STORAGE_KEY,
  SURFACE_STORAGE_KEY,
  SURFACES,
  DEFAULT_SURFACE_ID,
  resolveSurfaceId,
  readAccent,
  readSurface,
  applyTheme,
  applySurface
} from './applyTheme'
import { DEFAULT_ACCENT_ID } from './accents'

// jsdom gives a real <html> and a real localStorage, so nothing is stubbed.
beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-axi-accent')
  document.documentElement.removeAttribute('data-axi-theme')
  document.documentElement.classList.remove('theme-transitioning')
})

describe('resolveSurfaceId', () => {
  it('defaults to the language itself', () => {
    expect(DEFAULT_SURFACE_ID).toBe('axi')
    expect(resolveSurfaceId(null)).toBe('axi')
    expect(resolveSurfaceId(undefined)).toBe('axi')
  })

  it('passes through the ids the design language defines', () => {
    expect(SURFACES.map((s) => s.id)).toEqual(['axi', 'flat', 'glass'])
    expect(SURFACES.map((s) => s.label)).toEqual(['Axi', 'Flat', 'Glass'])
    expect(resolveSurfaceId('axi')).toBe('axi')
    expect(resolveSurfaceId('flat')).toBe('flat')
    expect(resolveSurfaceId('glass')).toBe('glass')
  })

  it('falls back to axi for anything else, including inherited property names', () => {
    expect(resolveSurfaceId('frosted')).toBe('axi')
    expect(resolveSurfaceId('')).toBe('axi')
    expect(resolveSurfaceId('constructor')).toBe('axi')
    expect(resolveSurfaceId('__proto__')).toBe('axi')
    expect(resolveSurfaceId('toString')).toBe('axi')
  })
})

describe('readSurface and readAccent', () => {
  it('are the defaults when nothing has been stored', () => {
    expect(readSurface()).toBe('axi')
    expect(readAccent()).toBe(DEFAULT_ACCENT_ID)
  })

  it('read back what was stored', () => {
    localStorage.setItem(SURFACE_STORAGE_KEY, 'glass')
    localStorage.setItem(ACCENT_STORAGE_KEY, 'electric-cyan')
    expect(readSurface()).toBe('glass')
    expect(readAccent()).toBe('electric-cyan')
  })

  it('are the defaults when storage holds a value they do not recognise', () => {
    localStorage.setItem(SURFACE_STORAGE_KEY, 'frosted')
    localStorage.setItem(ACCENT_STORAGE_KEY, 'ultraviolet')
    expect(readSurface()).toBe('axi')
    expect(readAccent()).toBe(DEFAULT_ACCENT_ID)
  })

  // Review Focus 1
  it('are the defaults when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled')
    })
    expect(readSurface()).toBe('axi')
    expect(readAccent()).toBe(DEFAULT_ACCENT_ID)
    vi.restoreAllMocks()
  })
})

describe('applySurface', () => {
  it('puts a theme on <html> and remembers it', () => {
    expect(applySurface('glass')).toBe('glass')
    expect(document.documentElement.getAttribute('data-axi-theme')).toBe('glass')
    expect(localStorage.getItem(SURFACE_STORAGE_KEY)).toBe('glass')
  })

  it('treats flat as a theme like any other', () => {
    expect(applySurface('flat')).toBe('flat')
    expect(document.documentElement.getAttribute('data-axi-theme')).toBe('flat')
  })

  it('removes the attribute for axi rather than naming the language', () => {
    applySurface('glass')
    expect(applySurface('axi')).toBe('axi')
    expect(document.documentElement.hasAttribute('data-axi-theme')).toBe(false)
    expect(localStorage.getItem(SURFACE_STORAGE_KEY)).toBe('axi')
  })

  // Review Focus 1
  it('still applies the surface when storage refuses the write', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded')
    })
    expect(applySurface('glass')).toBe('glass')
    expect(document.documentElement.getAttribute('data-axi-theme')).toBe('glass')
    vi.restoreAllMocks()
  })
})

describe('applyTheme', () => {
  it('puts an accent on <html> and remembers it', () => {
    expect(applyTheme('electric-cyan')).toBe('electric-cyan')
    expect(document.documentElement.getAttribute('data-axi-accent')).toBe('electric-cyan')
    expect(localStorage.getItem(ACCENT_STORAGE_KEY)).toBe('electric-cyan')
  })

  it('falls back to the default for an accent it does not know', () => {
    expect(applyTheme('ultraviolet')).toBe(DEFAULT_ACCENT_ID)
    expect(document.documentElement.getAttribute('data-axi-accent')).toBe(DEFAULT_ACCENT_ID)
  })
})

describe('the shared crossfade', () => {
  it('holds the class for the length of the transition', () => {
    vi.useFakeTimers()
    applySurface('glass')
    expect(document.documentElement.classList.contains('theme-transitioning')).toBe(true)
    vi.advanceTimersByTime(500)
    expect(document.documentElement.classList.contains('theme-transitioning')).toBe(false)
    vi.useRealTimers()
  })

  // Review Focus 2 — a second change inside the window must restart the timer,
  // not let the first one strip the class mid-fade.
  it('restarts the timer when a second surface is chosen inside the window', () => {
    vi.useFakeTimers()
    applySurface('glass')
    vi.advanceTimersByTime(400)
    applySurface('flat')
    vi.advanceTimersByTime(200)
    expect(document.documentElement.classList.contains('theme-transitioning')).toBe(true)
    vi.advanceTimersByTime(350)
    expect(document.documentElement.classList.contains('theme-transitioning')).toBe(false)
    vi.useRealTimers()
  })

  // Review Focus 3 — the accent and the surface share one timer, so changing
  // both is one fade rather than two overlapping ones.
  it('is shared between the accent and the surface', () => {
    vi.useFakeTimers()
    applyTheme('electric-cyan')
    vi.advanceTimersByTime(300)
    applySurface('glass')
    vi.advanceTimersByTime(300)
    expect(document.documentElement.classList.contains('theme-transitioning')).toBe(true)
    vi.advanceTimersByTime(250)
    expect(document.documentElement.classList.contains('theme-transitioning')).toBe(false)
    vi.useRealTimers()
  })
})

// Review Focus 4
describe('the crossfade stylesheet', () => {
  it('transitions on the class and turns itself off under reduced motion', async () => {
    const { readFileSync } = await import('node:fs')
    const css = readFileSync(new URL('../styles/globals.css', import.meta.url), 'utf8')
    expect(css).toMatch(/\.theme-transitioning \*/)
    const reduced = css.slice(css.indexOf('prefers-reduced-motion: reduce'))
    expect(reduced).toMatch(/\.theme-transitioning \*[\s\S]*transition: none/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd ~/Documents/GitHub/axiom
npx vitest run src/themes/surface.test.ts
```

Expected: FAIL — cannot resolve `./applyTheme`.

- [ ] **Step 3: Bump the dependency**

In `package.json`, change `"@axiapps/axi-design": "^1.6.0"` to `"^1.43.0"`, then `npm install`.

- [ ] **Step 4: Create the accents module**

Create `src/themes/accents.ts`:

```ts
import accentsJson from '@axiapps/axi-design/accents.json'

export type AccentDefinition = { id: string; label: string; hex: string }

/** The palette is the design language's, read from the package rather than
 *  restated here — a copy would drift the first time an accent is added. */
export const ACCENTS: AccentDefinition[] = accentsJson as AccentDefinition[]

/** AxiOM is the suite's toolbox, so it wears the house colour. */
export const DEFAULT_ACCENT_ID = 'axi-gold'

/** Always returns an id that exists in ACCENTS. AxiOM has never persisted an
 *  accent before this, so there is no legacy vocabulary to translate. */
export function resolveAccentId(id?: string | null): string {
  return ACCENTS.some((a) => a.id === id) ? (id as string) : DEFAULT_ACCENT_ID
}
```

If TypeScript rejects the JSON import, add `"resolveJsonModule": true` to `tsconfig.json`'s `compilerOptions` — the other four apps all import this same file, so the pattern is established.

- [ ] **Step 5: Create the theme module**

Create `src/themes/applyTheme.ts`:

```ts
import { DEFAULT_ACCENT_ID, resolveAccentId } from './accents'

// Renderer-side rather than in the config store: the config answers
// asynchronously and appearance is renderer-only, so a synchronous read before
// first render is worth more than symmetry with the settings around it.
export const ACCENT_STORAGE_KEY = 'axiom.accent'
export const SURFACE_STORAGE_KEY = 'axiom.surface'

/**
 * The surfaces the design language paints. 'axi' is the language itself, drawn
 * with no `data-axi-theme` at all. 'flat' and 'glass' are repaints of it
 * shipped as `@axiapps/axi-design/themes/<id>.css`.
 */
export type SurfaceId = 'axi' | 'flat' | 'glass'

export const SURFACES: { id: SurfaceId; label: string }[] = [
  { id: 'axi', label: 'Axi' },
  { id: 'flat', label: 'Flat' },
  { id: 'glass', label: 'Glass' }
]

/** AxiOM has always been drawn in the language itself, so that stays the default. */
export const DEFAULT_SURFACE_ID: SurfaceId = 'axi'

let transitionTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Holds the crossfade class on <html> for the length of the transition so the
 * whole window changes together instead of each element snapping on its own
 * next repaint. Shared by the accent and the surface: changing both at once
 * should still be one fade, so the timer is deliberately not per-attribute.
 */
function crossfade(root: Element): void {
  root.classList.add('theme-transitioning')
  if (transitionTimer) clearTimeout(transitionTimer)
  transitionTimer = setTimeout(() => {
    root.classList.remove('theme-transitioning')
    transitionTimer = null
  }, 500)
}

export function readAccent(): string {
  try {
    return resolveAccentId(localStorage.getItem(ACCENT_STORAGE_KEY))
  } catch {
    return DEFAULT_ACCENT_ID
  }
}

/** Puts an accent on <html>, where accents.css's [data-axi-accent] rules hang,
 *  and remembers it. */
export function applyTheme(accentId?: string | null): string {
  const id = resolveAccentId(accentId)
  const root = document.documentElement

  crossfade(root)

  root.setAttribute('data-axi-accent', id)
  try {
    localStorage.setItem(ACCENT_STORAGE_KEY, id)
  } catch {
    // Storage disabled: the accent still applies for the life of the session,
    // only the memory of it is lost.
  }
  return id
}

/** Always returns one of the three ids. Membership is tested against the array
 *  rather than an object, so inherited property names are unknown values like
 *  any other. */
export function resolveSurfaceId(id?: string | null): SurfaceId {
  return SURFACES.some((s) => s.id === id) ? (id as SurfaceId) : DEFAULT_SURFACE_ID
}

export function readSurface(): SurfaceId {
  try {
    return resolveSurfaceId(localStorage.getItem(SURFACE_STORAGE_KEY))
  } catch {
    return DEFAULT_SURFACE_ID
  }
}

/**
 * Puts a surface on <html> and remembers it. 'axi' removes the attribute rather
 * than naming itself: the language is not a theme layered over itself, and
 * axi-design's own rule is that removing `data-axi-theme` leaves you back on it
 * with no other change.
 */
export function applySurface(surfaceId?: string | null): SurfaceId {
  const id = resolveSurfaceId(surfaceId)
  const root = document.documentElement

  crossfade(root)

  if (id === 'axi') root.removeAttribute('data-axi-theme')
  else root.setAttribute('data-axi-theme', id)

  try {
    localStorage.setItem(SURFACE_STORAGE_KEY, id)
  } catch {
    // Same bargain as the accent: applied now, just not remembered.
  }
  return id
}
```

- [ ] **Step 6: Write the crossfade rule**

Append to `src/styles/globals.css`:

```css
/* --- accent and surface crossfade --- */
/* One class, held for 500ms by applyTheme/applySurface, so the whole window
   repaints together instead of each element snapping on its own next frame. */
.theme-transitioning *,
.theme-transitioning *::before,
.theme-transitioning *::after {
  transition:
    background-color 0.4s ease,
    border-color 0.4s ease,
    color 0.2s ease,
    box-shadow 0.4s ease,
    outline-color 0.4s ease !important;
}

@media (prefers-reduced-motion: reduce) {
  .theme-transitioning *,
  .theme-transitioning *::before,
  .theme-transitioning *::after {
    transition: none !important;
  }
}
```

- [ ] **Step 7: Run test to verify it passes**

```bash
cd ~/Documents/GitHub/axiom
npx vitest run src/themes/surface.test.ts
```

Expected: PASS, 16 tests.

- [ ] **Step 8: Import the stylesheets and apply at boot**

`src/main.tsx` becomes:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
// Order matters: axi.css declares the tokens, accents.css overrides
// --axi-accent per [data-axi-accent], the two theme files restate the token set
// per [data-axi-theme], and this app's own stylesheet comes last.
import '@axiapps/axi-design/axi.css'
import '@axiapps/axi-design/accents.css'
import '@axiapps/axi-design/themes/flat.css'
import '@axiapps/axi-design/themes/glass.css'
import './styles/globals.css'
import App from './App'
import { applyTheme, readAccent, applySurface, readSurface } from './themes/applyTheme'

// Before render, so the first paint is already correct.
applyTheme(readAccent())
applySurface(readSurface())

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 9: Add both pickers to the settings view**

`src/components/SettingsView.tsx` renders a list of `<SettingRow label=...>` inside `<div className="ax-scroll">`. Add two rows at the top of that list, before `Auto-start on login` — appearance belongs first because it is the setting a reader is most likely to have come for.

Add to the component body:

```tsx
  const [accent, setAccent] = useState(readAccent)
  const [surface, setSurface] = useState<SurfaceId>(readSurface)
```

and to the imports:

```tsx
import { applyTheme, readAccent, applySurface, readSurface, SURFACES } from '../themes/applyTheme'
import type { SurfaceId } from '../themes/applyTheme'
import { ACCENTS } from '../themes/accents'
```

Then the two rows:

```tsx
        <SettingRow label="Accent">
          <div className="flex flex-wrap gap-1">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                type="button"
                title={a.label}
                aria-label={a.label}
                aria-pressed={a.id === accent}
                onClick={() => { setAccent(applyTheme(a.id)) }}
                style={{
                  width: 20,
                  height: 20,
                  background: a.hex,
                  border: 'var(--axi-border-hairline) solid var(--axi-ink-line)',
                  outline: a.id === accent ? 'var(--axi-border-control) solid var(--axi-text)' : 'none',
                  outlineOffset: 2,
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </SettingRow>

        <SettingRow label="Surface">
          <div className="flex flex-wrap gap-2">
            {SURFACES.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={s.id === surface}
                className={`axi-btn ax-sm${s.id === surface ? ' axi-btn--primary' : ''}`}
                onClick={() => { setSurface(applySurface(s.id)) }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </SettingRow>
```

`ax-sm` is the size class this file already pairs with `axi-btn` (see its GitHub sign-in button); keep it for consistency with the rest of the view. `applyTheme` and `applySurface` both persist and both return the resolved id, so the state is set from the return value rather than from the clicked id.

- [ ] **Step 10: Verify the suite and the build**

```bash
cd ~/Documents/GitHub/axiom
npx vitest run
npm run build
```

Expected: both PASS. The existing `src/__tests__/*.test.tsx` files must still pass; if one renders `SettingsView` and now fails on a missing `localStorage`, note that the jsdom environment provides it and the failure is more likely a missing `resolveJsonModule` — check the error before changing a test.

- [ ] **Step 11: Manual pass**

```bash
cd ~/Documents/GitHub/axiom
npm run dev
```

Open Settings. Click through several accents and all three surfaces. This is the app most likely to surface local literals, because nothing here has ever been accent-aware: check the app list rows, the tray-adjacent chrome, the update states, and the `ax-ink-accent` / `ax-ink-danger` classes. Any hardcoded colour in `src/styles/globals.css` that does not follow the surface is fixed as part of this task.

- [ ] **Step 12: Commit**

```bash
cd ~/Documents/GitHub/axiom
git add -A
git commit -m "feat: add the accent and Axi/Flat/Glass surface pickers

AxiOM had no appearance system at all: axi.css and nothing else, no
themes module, no appearance section in Settings. This adds the accent
palette, both pickers, the crossfade rule with its reduced-motion
opt-out, and localStorage for both settings.

localStorage rather than useConfig because the config answers
asynchronously and appearance is renderer-only — a synchronous read
before first render beats symmetry with the settings beside it.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: axiforge — surface picker

**Repo:** `axiforge`

**Files:**
- Modify: `src/renderer/modules/accents.js`, `src/renderer/renderer.js:5-6,73,86`, `src/renderer/modules/settings-modal.js:158,371-380`, `package.json`
- Test: `tests/unit/renderer/surface.test.js` (create)

**Interfaces:**
- Consumes: `@axiapps/axi-design@^1.43.0`.
- Produces, from `src/renderer/modules/accents.js`:
  ```js
  export const SURFACES        // [{ id, label }] for axi | flat | glass
  export const DEFAULT_SURFACE_ID  // "axi"
  export function resolveSurfaceId(id)          // -> one of the three ids
  export function applySurface(id, { transition = true } = {})  // -> resolved id
  ```
  No persistence inside, exactly like the existing `applyAccent`: the settings modal writes `appearance.surface` through `window.desktopApi.setSetting`.

axiforge is **jest**, not vitest, and the test style in `tests/` is CommonJS `require` with bare `test()` / `expect()`. But `accents.js` is ESM under `src/renderer/`, which `jest.config`'s `transform` already routes through babel-jest, and `collectCoverageFrom` already lists `src/renderer/modules/**/*.js`. So an ESM `import` in the test file works; `tests/unit/shared/professions.test.js` is the precedent.

axiforge's house style: 2-space indent, semicolons, JSDoc on exported functions.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/renderer/surface.test.js`:

```js
import {
  SURFACES,
  DEFAULT_SURFACE_ID,
  resolveSurfaceId,
  applySurface,
} from "../../../src/renderer/modules/accents.js";

// jest.config sets testEnvironment: "node", so <html> is stubbed here rather
// than pulling jsdom in for one file.
function fakeRoot() {
  const attrs = {};
  const classes = new Set();
  return {
    attrs,
    classes,
    setAttribute: (k, v) => { attrs[k] = v; },
    removeAttribute: (k) => { delete attrs[k]; },
    classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c) },
  };
}

let root;

beforeEach(() => {
  root = fakeRoot();
  global.document = { documentElement: root };
});

afterEach(() => {
  delete global.document;
  jest.useRealTimers();
});

test("the three surfaces are axi, flat and glass, in that order", () => {
  expect(SURFACES.map((s) => s.id)).toEqual(["axi", "flat", "glass"]);
  expect(SURFACES.map((s) => s.label)).toEqual(["Axi", "Flat", "Glass"]);
  expect(DEFAULT_SURFACE_ID).toBe("axi");
});

test("resolveSurfaceId passes through the ids the design language defines", () => {
  expect(resolveSurfaceId("axi")).toBe("axi");
  expect(resolveSurfaceId("flat")).toBe("flat");
  expect(resolveSurfaceId("glass")).toBe("glass");
});

test("resolveSurfaceId falls back to axi for anything else", () => {
  expect(resolveSurfaceId(null)).toBe("axi");
  expect(resolveSurfaceId(undefined)).toBe("axi");
  expect(resolveSurfaceId("")).toBe("axi");
  expect(resolveSurfaceId("frosted")).toBe("axi");
  // AxiForge's LEGACY_THEME_TO_ACCENT exists because its share URLs are
  // immutable. There is no such history for the surface, so a legacy accent id
  // is just an unknown value here rather than something to translate.
  expect(resolveSurfaceId("blood_legion")).toBe("axi");
});

test("resolveSurfaceId does not reach the prototype chain", () => {
  expect(resolveSurfaceId("constructor")).toBe("axi");
  expect(resolveSurfaceId("__proto__")).toBe("axi");
  expect(resolveSurfaceId("toString")).toBe("axi");
});

test("applySurface puts a theme on <html>", () => {
  expect(applySurface("glass")).toBe("glass");
  expect(root.attrs["data-axi-theme"]).toBe("glass");
});

test("applySurface treats flat as a theme like any other", () => {
  expect(applySurface("flat")).toBe("flat");
  expect(root.attrs["data-axi-theme"]).toBe("flat");
});

test("applySurface removes the attribute for axi rather than naming the language", () => {
  applySurface("glass");
  expect(applySurface("axi")).toBe("axi");
  expect(root.attrs["data-axi-theme"]).toBeUndefined();
});

test("applySurface crossfades by default", () => {
  applySurface("glass");
  expect(root.classes.has("theme-transitioning")).toBe(true);
});

test("applySurface skips the crossfade when asked, so startup does not flash", () => {
  applySurface("glass", { transition: false });
  expect(root.classes.has("theme-transitioning")).toBe(false);
  expect(root.attrs["data-axi-theme"]).toBe("glass");
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd ~/Documents/GitHub/axiforge
npx jest tests/unit/renderer/surface.test.js
```

Expected: FAIL — `SURFACES` is not exported from `accents.js`.

- [ ] **Step 3: Add the surface functions**

Append to `src/renderer/modules/accents.js`:

```js
/**
 * The surfaces the design language paints. "axi" is the language itself, drawn
 * with no `data-axi-theme` at all. "flat" and "glass" are repaints of it
 * shipped as `@axiapps/axi-design/themes/<id>.css`.
 */
export const SURFACES = [
  { id: "axi", label: "Axi" },
  { id: "flat", label: "Flat" },
  { id: "glass", label: "Glass" },
];

/** AxiForge has always been drawn in the language itself, so that stays the default. */
export const DEFAULT_SURFACE_ID = "axi";

/**
 * Always returns one of the three ids. Membership is tested against the array
 * rather than an object, so inherited property names are unknown values like
 * any other.
 *
 * There is deliberately no legacy map here. LEGACY_THEME_TO_ACCENT exists
 * because published share URLs carry an accent forever; the surface has never
 * been persisted or shared, so it has no vocabulary to translate.
 */
export function resolveSurfaceId(id) {
  return SURFACES.some((s) => s.id === id) ? id : DEFAULT_SURFACE_ID;
}

/**
 * Sets the surface on <html>. Returns the resolved id.
 * Crossfades for 500ms unless { transition: false } - startup passes that,
 * so the first paint doesn't visibly flash against an unthemed page.
 *
 * "axi" removes the attribute rather than naming itself: the language is not a
 * theme layered over itself, and axi-design's own rule is that removing
 * `data-axi-theme` leaves you back on it with no other change.
 */
export function applySurface(id, { transition = true } = {}) {
  const resolved = resolveSurfaceId(id);
  const root = document.documentElement;

  if (transition) _startCrossfade(root);

  if (resolved === "axi") root.removeAttribute("data-axi-theme");
  else root.setAttribute("data-axi-theme", resolved);

  return resolved;
}
```

Extract the crossfade out of `applyAccent` so both share the one `_transitionTimer` already declared in that file. Replace the `if (transition) { ... }` block inside `applyAccent` with `if (transition) _startCrossfade(root);` and add, above `applyAccent`:

```js
/**
 * Holds the crossfade class on <html> for 500ms so the whole page changes
 * together. Shared by the accent and the surface: changing both at once should
 * still be one fade, so the timer is deliberately not per-attribute.
 */
function _startCrossfade(root) {
  root.classList.add("theme-transitioning");
  if (_transitionTimer) clearTimeout(_transitionTimer);
  _transitionTimer = setTimeout(() => {
    root.classList.remove("theme-transitioning");
    _transitionTimer = null;
  }, 500);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd ~/Documents/GitHub/axiforge
npx jest tests/unit/renderer/surface.test.js
```

Expected: PASS, 9 tests.

- [ ] **Step 5: Bump the dependency and import the themes**

In `package.json`, change `"@axiapps/axi-design": "^1.10.0"` to `"^1.43.0"`, then `npm install`.

`src/renderer/renderer.js` lines 5-6 become:

```js
import "@axiapps/axi-design/axi.css";
import "@axiapps/axi-design/accents.css";
import "@axiapps/axi-design/themes/flat.css";
import "@axiapps/axi-design/themes/glass.css";
```

Line 73 imports `applyAccent`; extend it:

```js
import { applyAccent, applySurface } from "./modules/accents.js";
```

**Do not add `applySurface` to `createAccentTinting`** at line 85. That factory exists so the profession-tinting state machine can stash and restore the *accent* when a build opens; the surface has nothing to do with professions and must not be stashed or restored by it.

Lines 662-668 apply the stored accent at startup:

```js
  // Apply the saved accent. No crossfade here - transitioning against an
  // unthemed first paint would be visible as a flash.
  try {
    _accentTinting.setUserAccent(await window.desktopApi.getSetting("appearance.theme"), { transition: false });
  } catch {
    _accentTinting.setUserAccent(undefined, { transition: false }); // first run
  }
```

Add the surface immediately after that block, on its own `try` so a failure to read one setting does not lose the other:

```js
  // Same reasoning as the accent above: no crossfade against the first paint.
  try {
    applySurface(await window.desktopApi.getSetting("appearance.surface"), { transition: false });
  } catch {
    applySurface(undefined, { transition: false }); // first run
  }
```

**Do not touch `src/site/accent.js`.** Published pages read the accent from the immutable `?t=` parameter and stay on the language; no surface parameter is added, and `accentFromParams()` is not changed.

- [ ] **Step 6: Add the control to the settings modal**

`src/renderer/modules/settings-modal.js:158` caches `themeGrid: document.getElementById("sm-theme-grid")`. Add beside it:

```js
    surfaceRow:     document.getElementById("sm-surface-row"),
```

Add the container to the settings modal's HTML template, immediately after the element with id `sm-theme-grid`, matching the markup style of the section around it:

```html
<div class="af-field">
  <label class="af-label">Surface</label>
  <div id="sm-surface-row" class="af-surface-row"></div>
</div>
```

Add the paint-and-bind pair beside `_renderThemeGrid` / `_paintAccentGrid` (lines 371-380):

```js
async function _renderSurfaceRow() {
  const storedId = (await window.desktopApi.getSetting("appearance.surface")) || "";
  _paintSurfaceRow(storedId);
}

function _paintSurfaceRow(storedId) {
  const active = resolveSurfaceId(storedId);
  _el.surfaceRow.innerHTML = "";

  for (const surface of SURFACES) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `axi-btn axi-btn--sm${surface.id === active ? " axi-btn--primary" : ""}`;
    btn.dataset.surface = surface.id;
    btn.setAttribute("aria-pressed", String(surface.id === active));
    btn.textContent = surface.label;
    btn.addEventListener("click", () => _applySurface(surface.id));
    _el.surfaceRow.appendChild(btn);
  }
}

async function _applySurface(surfaceId) {
  const resolved = applySurface(surfaceId);
  await window.desktopApi.setSetting("appearance.surface", resolved);
  _paintSurfaceRow(resolved);
}
```

`textContent` rather than `innerHTML` because the label goes in as text; the accent grid needs `escapeHtml` only because it interpolates into an `innerHTML` template.

Extend line 11's import:

```js
import { ACCENTS, resolveAccentId, SURFACES, resolveSurfaceId, applySurface } from "./accents.js";
```

and call `_renderSurfaceRow()` wherever `_renderThemeGrid()` is called when the modal opens.

- [ ] **Step 7: Verify the suite and the build**

```bash
cd ~/Documents/GitHub/axiforge
npm test
npm run build
```

Expected: both PASS. In particular `tests/web/share.test.js`, `share-shortlink.test.js` and `settings.test.js` must be unaffected — if any of them changed behaviour, the share path was touched and must be reverted.

- [ ] **Step 8: Manual three-surface pass**

```bash
cd ~/Documents/GitHub/axiforge
npm run dev
```

Open the settings modal, click each surface. Check the fade covers the whole page, the choice survives a restart, and that the profession-accent tinting in `src/renderer/modules/accent-tinting.js` still reads correctly on each surface. Then **bake and open a share page** and confirm it renders on the language with no `data-axi-theme` and no new URL parameter.

- [ ] **Step 9: Commit**

```bash
cd ~/Documents/GitHub/axiforge
git add -A
git commit -m "feat: add the Axi/Flat/Glass surface picker

Persists as the appearance.surface setting beside appearance.theme, so
the two stay siblings in one store, and applies at startup with
{ transition: false } so the first paint does not flash. The crossfade
timer is now shared with the accent, so changing both is one fade.

No legacy surface map and no share-URL parameter: unlike the accent, the
surface has never been persisted or published, and a reader's choice of
surface is not a property of a build they shared.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Verification checklist

Run after all six tasks. Each line is a claim the plan makes that should be independently true.

```bash
# 1. The accent shipped.
npm view @axiapps/axi-design version          # -> 1.43.0
npm view @axiapps/axi-design dist.tarball > /dev/null && echo published

# 2. Every app is on it.
for p in axiforge axiam axipulse axivale axiom; do
  printf '%-10s ' "$p"
  node -e "console.log(require('$HOME/Documents/GitHub/'+'$p'+'/package.json').dependencies['@axiapps/axi-design'])"
done                                           # -> ^1.43.0 five times

# 3. Every app imports both themes.
for p in axiforge axiam axipulse axivale axiom; do
  printf '%-10s %s\n' "$p" "$(grep -rl 'themes/glass.css' $HOME/Documents/GitHub/$p/src | grep -v node_modules | head -1)"
done

# 4. Nobody set data-axi-theme="axi".
grep -rn "data-axi-theme., *.axi." $HOME/Documents/GitHub/{axiforge,axiam,axipulse,axivale,axiom}/src 2>/dev/null | grep -v node_modules
# -> no output

# 5. Every app's suite passes.
(cd ~/Documents/GitHub/axiam     && npx vitest run)
(cd ~/Documents/GitHub/axipulse  && npm test)
(cd ~/Documents/GitHub/axivale   && npm test)
(cd ~/Documents/GitHub/axiom     && npx vitest run)
(cd ~/Documents/GitHub/axiforge  && npm test)
```

Then the one thing no command can check: **open all five apps and look at all three surfaces.** A passing suite proves the attribute is set correctly; it says nothing about whether flat reads right or whether some local literal in an app's own stylesheet has stayed behind on Axi's colours while everything around it moved. That sweep is the acceptance criterion for this plan.
