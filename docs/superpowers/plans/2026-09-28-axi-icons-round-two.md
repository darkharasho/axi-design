# axi-icons round two Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Draw the ten glyphs the axi apps reach for most, and make a Lucide name that this set answers under a different name resolve in the sprite instead of rendering an empty box.

**Architecture:** No new machinery. `icons/<name>.svg` stays the source of truth and `tests/icons.test.mjs` stays the enforcer; the ten new drawings are ten new files and ten new manifest rows. The one structural change is in `scripts/build.mjs`: the manifest gains a `lucide` field naming the *other Lucide component names* that land on a drawing, and the sprite gains one `<symbol>` per such name whose body is a `<use>` at the canonical symbol.

**Tech Stack:** Node ≥22, vanilla ESM, vitest. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-28-axi-icons-round-two-design.md`

**Extends:** `docs/superpowers/plans/2026-09-28-axi-icons.md` (round one, complete). Rule 12 and the grammar checker are already in place; nothing here changes either.

## What changed between the spec and this plan

Every drawing below was rendered at 72px and at 20px on the dark surface before
this plan was written, because a glyph that passes rule 12 and does not read is
still a wrong glyph. Three findings, all of which the plan carries rather than
the spec:

1. **`sparkles` does not ship.** The spec flagged it as at-risk and the risk
   landed. Three structurally different attempts: a four-armed cross with equal
   arms reads as `plus`; a cross with a long vertical and short horizontal reads
   as a dagger; an eight-armed burst closes into a solid octagon at 3px. This is
   the `R/√2` floor arriving by a second route, and the spec's own standard — *a
   wrong glyph is worse than an absent one* — rules it out. **The tranche is ten
   icons, 47 → 57, not eleven.**
2. **`star`'s substitution changes.** The spec sent *featured / special* to
   `sparkles`. With `sparkles` gone it goes to **`crown`**, which is in this
   tranche and which three apps already want. *Rating / favourite* still goes to
   a filled `.axi-diamond` (`src/primitives.css:205`).
3. **`circle-help` takes the octagon room, not a square frame.** The spec says
   "square frame". It is wrong about the set as built: `circle-alert`,
   `circle-check` and `circle-x` all wear the eight-sided room added by
   `b6ecfa0 fix(icons): the status marks needed a room, not a diamond`. A
   `circle-help` in a square would be the only `circle-*` that did not sit with
   its family. It gets the same room, and the same dot — `M12 17.5 L12 19`,
   one unit below `circle-alert`'s, because the hook sits lower than the bar.

Two of the spec's three at-risk calls therefore retire: `circle-help` reads
cleanly as a `?` in the room, and `settings` reads as a gear at the spec's own
**four-tooth fallback** — the eight-tooth version renders as a framed target,
so the fallback is what this plan specifies as the drawing.

## Global Constraints

- **Canvas:** `viewBox="0 0 24 24"`, live area inset 1.5 on every side (all geometry within 1.5–22.5).
- **Stroke:** `stroke-width="3"`, `stroke="currentColor"`, `stroke-linejoin="miter"`, butt caps (do not set `stroke-linecap`).
- **Fill:** `fill="none"` on the root `<svg>`. No drawing in this tranche uses the solid-mark exception.
- **Path commands:** `M`, `L`, `H`, `V`, `Z` and their relative forms only. No `A`, `C`, `S`, `Q`, `T` in any `d`.
- **Angles:** every segment axis-aligned or exactly 45° (`|dx| === |dy|`).
- **Coordinates:** every number a multiple of 0.5. Every axis-aligned segment's constant coordinate is an odd half-integer **or** exactly `12`.
- **Names:** Lucide's names, verbatim, kebab-case. `settings` is the gear; `settings-2` is the sliders and is not touched.
- **No new runtime dependency.** `devDependencies` stays `marked` + `vitest`.
- **Test runner:** run vitest with `--maxWorkers=2` per the user's global CLAUDE.md.
- **Generated files are committed.** Every task that changes `icons/` or the manifest ends with `npm run build && npm run docs` and commits `dist/` with the source.

## Review Focus

Five things the spec implies that no task's happy path would catch, most likely first:

1. **A `<use>` inside a `<symbol>`, referenced across documents, may not render.** This is the alias mechanism's entire load-bearing assumption and it fails the same way the round-one `currentColor` risk failed — silently, at the consumer, in a browser we are not looking at. Task 1 Step 7 measures it before anything is built on it, and names the fallback.
2. **An alias pointing at a canonical name that does not exist.** One typo in the manifest and `<use href="#axi-alert-triangle">` resolves to a symbol whose own `<use>` resolves to nothing: a discoverable name that renders an empty box, which the spec calls the worst of both. Pinned in Task 1.
3. **An alias colliding with an icon name, or two entries claiming the same alias.** Duplicate `id`s in one SVG document are not an error; the first wins and the second is silently unreachable. Pinned in Task 1.
4. **`tests/build.test.mjs:122` asserts `sprite.match(/<symbol /g).length === ICONS.length`.** The moment alias symbols exist that assertion is false — and if it is "fixed" by loosening it, the sprite loses its only count check. Task 1 Step 5 re-tightens it against the real total.
5. **`settings` and `settings-2` are two drawings one character apart.** A consumer picker, the site filter and the substitution table all have to keep them apart, and the gear must not inherit the sliders' keywords. Pinned in Task 3.

---

### Task 1: An alias resolves in the sprite

Today `aliases` is search metadata: the docs filter finds `warning` and lands on
`circle-alert`. A Lucide *component name* is a different thing — an app porting
off `lucide-react` writes `AlertTriangle` → `axi-triangle-alert` and expects a
drawing. Mixing the two in one field would put 65 words like `done` and `back`
into the sprite's public id space and add ~10KB to an 11.7KB file. So the field
splits: `aliases` stays words, `lucide` carries Lucide names only.

**Files:**
- Modify: `docs/manifest/icons.mjs` (add a `lucide` field to the entries that need one)
- Modify: `scripts/build.mjs:113-131` (`buildIconSprite`), plus a new exported `aliasPairs`
- Modify: `tests/build.test.mjs:118-138`
- Modify: `tests/icons.test.mjs` (the manifest describe block)

**Interfaces:**
- Consumes: `ICON_ENTRIES` from `docs/manifest/icons.mjs`; `ICONS` and `buildIconSprite` from `scripts/build.mjs`.
- Produces: `aliasPairs(entries = ICON_ENTRIES) => [{ alias, canonical }]`, sorted by `alias`, exported from `scripts/build.mjs`; `buildIconSprite(icons = ICONS, aliases = aliasPairs())`; a `lucide?: string[]` field on a manifest entry.

- [ ] **Step 1: Write the failing manifest tests**

Append to the `describe('the icon manifest', ...)` block in `tests/icons.test.mjs`:

```js
  // `lucide` is a promise that `<use href="#axi-<name>">` draws something.
  // Every way that promise can be broken is silent: a name that matches no
  // drawing renders an empty box, and a name that collides with a real icon
  // or with another entry's claim produces a duplicate id, where the first
  // symbol wins and the second is unreachable with no error anywhere.
  it('points every lucide name at a drawing that exists', () => {
    const names = new Set(ICON_ENTRIES.map((e) => e.name))
    for (const e of ICON_ENTRIES) {
      for (const l of e.lucide ?? []) {
        expect(names.has(l), `${e.name} claims the lucide name "${l}", which is a real icon`).toBe(false)
      }
    }
  })

  it('never lets two entries claim the same lucide name', () => {
    const seen = new Map()
    for (const e of ICON_ENTRIES) {
      for (const l of e.lucide ?? []) {
        expect(seen.has(l), `${l} is claimed by both ${seen.get(l)} and ${e.name}`).toBe(false)
        seen.set(l, e.name)
      }
    }
  })

  it('keeps lucide names out of the search-word field', () => {
    for (const e of ICON_ENTRIES) {
      for (const l of e.lucide ?? []) {
        expect(e.aliases, `${e.name} lists "${l}" as both a lucide name and a search word`).not.toContain(l)
      }
    }
  })

  it('gives triangle-alert to circle-alert', () => {
    const entry = ICON_ENTRIES.find((e) => e.name === 'circle-alert')
    expect(entry.lucide).toContain('triangle-alert')
  })
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/icons.test.mjs --maxWorkers=2 -t "triangle-alert"`
Expected: FAIL — `entry.lucide` is `undefined`, so `.toContain` throws. The three
invariant tests pass vacuously at this point (`e.lucide ?? []` is empty for every
entry); that is expected and they become load-bearing in Step 3.

- [ ] **Step 3: Add the `lucide` field to the manifest**

In `docs/manifest/icons.mjs`, extend the header comment and add `lucide` to the
five entries that answer to a second Lucide name. Replace the comment's last
sentence and the five rows:

```js
// `aliases` carries the word a person might reach for instead of the name -
// Lucide's name is the id, and nothing in the set is renamed to be findable.
// `lucide` is a different thing: the other *Lucide component names* that land
// on this drawing - a deprecated spelling, or a metaphor this grammar draws
// with a shape it already has. Those go in the sprite as real symbols, so an
// app porting off lucide-react can rewrite the name and stop. Search words do
// not; `done` and `back` are not API.
```

Then the rows (leave every other entry untouched):

```js
  { name: 'circle-alert', categories: ['status'], aliases: ['alert', 'warning', 'exclamation'], lucide: ['alert-circle', 'triangle-alert', 'alert-triangle'], keywords: ['danger', 'error', 'caution'] },
  { name: 'circle-check', categories: ['status'], aliases: ['success'], lucide: ['check-circle', 'check-circle-2'], keywords: ['verified', 'passed', 'complete'] },
  { name: 'circle-x', categories: ['status'], aliases: ['failure'], lucide: ['x-circle'], keywords: ['error', 'rejected', 'failed'] },
  { name: 'pencil', categories: ['actions'], aliases: ['edit', 'write'], lucide: ['edit-2', 'square-pen'], keywords: ['rename', 'modify', 'compose'] },
  { name: 'square', categories: ['media'], aliases: ['stop'], lucide: ['circle'], keywords: ['halt', 'end', 'record'] },
```

`circle` is on `square` because the spec rules it a duplicate, not an absence:
a circle is the one boundary this grammar has decided not to draw.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/icons.test.mjs --maxWorkers=2`
Expected: PASS — including the three invariants, which now have real data to check.

- [ ] **Step 5: Write the failing sprite tests**

In `tests/build.test.mjs`, add `aliasPairs` to the import on line 5, then replace
the symbol-count assertion (currently `expect(sprite.match(/<symbol /g).length).toBe(ICONS.length)`)
and add three tests beside it:

```js
  it('emits one symbol per drawing and one per lucide name', () => {
    const sprite = buildIconSprite()
    expect(sprite.match(/<symbol /g).length).toBe(ICONS.length + aliasPairs().length)
  })

  // The alias symbol is a real symbol with a real body. An `aliases` field
  // that only fed the docs filter left `<use href="#axi-triangle-alert">`
  // resolving to nothing - a name that is discoverable and does not work.
  it('resolves a lucide name to the canonical drawing', () => {
    const sprite = buildIconSprite()
    expect(sprite).toContain('<symbol id="axi-triangle-alert"')
    const symbol = sprite.split('<symbol id="axi-triangle-alert"')[1].split('</symbol>')[0]
    expect(symbol).toContain('<use href="#axi-circle-alert"/>')
  })

  it('gives every symbol in the sprite a unique id', () => {
    const ids = [...buildIconSprite().matchAll(/<symbol id="([^"]+)"/g)].map((m) => m[1])
    expect(ids.length).toBe(new Set(ids).size)
  })

  // A file per alias is real weight for a case - <img src>, mask-image -
  // where the consumer is writing the path by hand and can write the
  // canonical one. The sprite is where the indirection belongs.
  it('writes no standalone file for a lucide name', () => {
    for (const { alias } of aliasPairs()) {
      expect(existsSync(resolve(`dist/icons/${alias}.svg`)), `dist/icons/${alias}.svg`).toBe(false)
    }
  })
```

`existsSync` and `resolve` are already imported at the top of
`tests/build.test.mjs` (lines 2 and 4); only `aliasPairs` is new.

- [ ] **Step 6: Run the tests to verify they fail**

Run: `npx vitest run tests/build.test.mjs --maxWorkers=2`
Expected: FAIL — `aliasPairs is not a function` on the import.

- [ ] **Step 7: Measure the nested `<use>` in a real browser before building on it**

The alias symbol's body is a `<use>` at another symbol in the same document,
instantiated by a `<use>` from a *different* document. Round one measured the
outer half of that (an external `<use>` does inherit `currentColor`); the inner
half is unmeasured, and if it does not render, every alias is an empty box —
exactly the failure the spec set out to remove.

Write a scratch page (not committed) that references the built sprite from a
page served over `http://`, with `npm run serve` running:

```html
<!doctype html><meta charset=utf-8>
<style>body{background:#101014;color:#e6e6ea} svg{width:64px;height:64px}</style>
<svg><use href="/icons/sprite.svg#axi-circle-alert"/></svg>
<svg><use href="/icons/sprite.svg#axi-triangle-alert"/></svg>
```

Both must draw the same glyph, in the same ink. **If the second is blank**, the
`<use>` indirection is not viable: change `buildIconSprite` in Step 8 to copy the
canonical `icon.body` into the alias symbol instead of referencing it, keep every
test in Step 5 except the `<use href="#axi-circle-alert"/>` assertion (assert the
body matches the canonical symbol's body instead), and record the measurement in
the comment above `aliasPairs` the way round one recorded its own. Either way the
consumer contract is unchanged.

- [ ] **Step 8: Implement `aliasPairs` and the alias symbols**

In `scripts/build.mjs`, after the `ICONS` definition (around line 98), add:

```js
// A Lucide name this set answers to under another name. `aliases` is search
// metadata and stays out of the sprite - 65 words like `done` and `back` would
// add ~10KB to an 11.7KB file and turn every one of them into public API.
// These are names an app is already holding in its source, and the payoff is
// that porting off lucide-react is a rename rather than a call-site audit.
export function aliasPairs(entries = ICON_ENTRIES) {
  return entries
    .flatMap((e) => (e.lucide ?? []).map((alias) => ({ alias, canonical: e.name })))
    .sort((a, b) => (a.alias < b.alias ? -1 : 1))
}
```

Then change `buildIconSprite` to take the pairs and append their symbols:

```js
export function buildIconSprite(icons = ICONS, aliases = aliasPairs()) {
  const symbol = (id, body) => `  <symbol id="axi-${id}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="miter">
${body}
  </symbol>`
  const drawings = icons.map((icon) =>
    symbol(
      icon.name,
      icon.body
        .split('\n')
        .map((line) => `    ${line.trim()}`)
        .join('\n'),
    ),
  )
  const links = aliases.map(({ alias, canonical }) => symbol(alias, `    <use href="#axi-${canonical}"/>`))
  return `<svg xmlns="http://www.w3.org/2000/svg">
<!-- axi design language - generated by scripts/build.mjs from icons/.
     Edit the files in icons/ and run \`npm run build\`; do not edit this file. -->
${[...drawings, ...links].join('\n')}
</svg>
`
}
```

`staleIconFiles` is deliberately left alone: it claims `sprite.svg`,
`icons.json` and one file per *drawing*, so an alias file that somehow appeared
in `dist/icons/` would be swept — which is what the Step 5 test asserts.

- [ ] **Step 9: Run the tests to verify they pass**

Run: `npm run build && npx vitest run --maxWorkers=2`
Expected: PASS, whole suite. `npm run build` must run first — `tests/build.test.mjs:137`
compares the committed sprite byte-for-byte against `buildIconSprite()`.

- [ ] **Step 10: Commit**

```bash
git add docs/manifest/icons.mjs scripts/build.mjs tests/build.test.mjs tests/icons.test.mjs dist/icons/sprite.svg
git commit -m "feat(icons): a lucide name the set answers to resolves in the sprite"
```

---

### Task 2: The five that came out right

Five drawings that read correctly at 20px on the first attempt: the two
bracket-and-arrow glyphs, the two silhouettes, and the spinner track. They land
together because none of them needs a judgement call — they are transcription.

**Files:**
- Create: `icons/loader-circle.svg`, `icons/shield.svg`, `icons/crown.svg`, `icons/maximize-2.svg`, `icons/message-square.svg`
- Modify: `docs/manifest/icons.mjs`
- Test: `tests/icons.test.mjs` (existing per-icon generator picks the new files up; no new test code)

**Interfaces:**
- Consumes: the `lucide` field from Task 1 (none of these five uses it).
- Produces: five files in `icons/`, five manifest rows, five `<symbol>`s in the sprite.

- [ ] **Step 1: Write the failing test**

There is no new test to write: `tests/icons.test.mjs` generates one `it` per file
in `icons/`, and `describe('the icon manifest')` asserts the manifest and the
directory describe each other exactly. The failing test is the drift check, and
it is made to fail by adding the five manifest rows *before* the drawings.

Add to `docs/manifest/icons.mjs`, each in its alphabetical place:

```js
  { name: 'crown', categories: ['objects'], aliases: ['king', 'best'], keywords: ['rank', 'premium', 'featured', 'top'] },
  { name: 'loader-circle', categories: ['status'], aliases: ['spinner', 'loading'], lucide: ['loader-2'], keywords: ['busy', 'pending', 'wait', 'progress'] },
  { name: 'maximize-2', categories: ['actions'], aliases: ['expand', 'fullscreen'], keywords: ['enlarge', 'grow', 'open'] },
  { name: 'message-square', categories: ['objects'], aliases: ['comment', 'chat'], keywords: ['speech', 'reply', 'thread', 'note'] },
  { name: 'shield', categories: ['status'], aliases: ['secure', 'protected'], keywords: ['guard', 'safety', 'defence', 'trust'] },
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/icons.test.mjs --maxWorkers=2`
Expected: FAIL — `describes exactly the drawings on disk`, with the five names in
the manifest list and absent from the disk list.

- [ ] **Step 3: Draw the five**

Every file has the identical root element:

```
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="miter">
```

`icons/loader-circle.svg` — a square track with one corner open, three sides of
four, running from the top centre anticlockwise to the right centre. Static it
reads as a bracket; spun by the consumer (`animation: spin 1s linear infinite`,
`transform-origin: 50% 50%` — the track is centred on 12,12) it reads as a
spinner. Rule 4 rations motion and the spin is not ours to ship:

```html
  <path d="M12 3.5 L3.5 3.5 L3.5 20.5 L20.5 20.5 L20.5 12"/>
```

`icons/shield.svg` — square shoulders, a 45° point at the bottom. The point at
`(12, 21)` sits on the centre axis, which is what keeps the two 45° flanks equal:

```html
  <path d="M5.5 3.5 L18.5 3.5 L18.5 14.5 L12 21 L5.5 14.5 Z"/>
```

`icons/crown.svg` — three points over two valleys and a base rule, as one closed
outline. The middle point is half a unit higher than the outer two, which is the
only thing distinguishing a crown from a letter W:

```html
  <path d="M3.5 8.5 L7.5 12.5 L12 8 L16.5 12.5 L20.5 8.5 L20.5 17.5 L3.5 17.5 Z"/>
```

`icons/maximize-2.svg` — two corner brackets on the leading diagonal with the
shaft between them. Three subpaths rather than one, because the arrowheads are
brackets and not part of the shaft:

```html
  <path d="M14.5 3.5 L20.5 3.5 L20.5 9.5"/>
  <path d="M9.5 20.5 L3.5 20.5 L3.5 14.5"/>
  <path d="M20.5 3.5 L3.5 20.5"/>
```

`icons/message-square.svg` — a square with a 45° tail off the lower left, drawn
as one outline so the tail is part of the bubble rather than stuck to it:

```html
  <path d="M3.5 4.5 L20.5 4.5 L20.5 16.5 L10.5 16.5 L6.5 20.5 L6.5 16.5 L3.5 16.5 Z"/>
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/icons.test.mjs --maxWorkers=2`
Expected: PASS — 52 `obeys rule 12` tests, and the drift check green in both directions.

- [ ] **Step 5: Build and look at them**

Run: `npm run build && npm run docs && npm run serve`
Open `/icons/` and confirm each of the five reads at tile size as well as at
`--axi-icon-size: 2rem`. A glyph that passes rule 12 and does not read is still
a wrong glyph; if one does not read, stop and fix the drawing, not the check.

- [ ] **Step 6: Commit**

```bash
git add icons/ docs/manifest/icons.mjs dist/
git commit -m "feat(icons): the spinner, the shield, the crown, the bubble and the arrows"
```

---

### Task 3: The five that needed the eye

Five drawings whose first geometry was legal and unreadable. Each one below is
the revision that reads; the rejected version is named so nobody re-derives it.

**Files:**
- Create: `icons/activity.svg`, `icons/circle-help.svg`, `icons/settings.svg`, `icons/share-2.svg`, `icons/swords.svg`
- Modify: `docs/manifest/icons.mjs`
- Test: `tests/icons.test.mjs`

**Interfaces:**
- Consumes: the manifest shape from Task 1, the five rows from Task 2.
- Produces: five files in `icons/`, five manifest rows. Takes the set to 57.

- [ ] **Step 1: Write the failing test**

Add the five manifest rows, each in its alphabetical place. Note `settings`
carries the gear's words and **not** the sliders' — `settings-2` keeps
`sliders`, `preferences` and `tune`, and neither entry may borrow the other's,
or a picker search for "sliders" offers the gear:

```js
  { name: 'activity', categories: ['status'], aliases: ['pulse', 'live'], keywords: ['health', 'chart', 'monitor', 'heartbeat'] },
  { name: 'circle-help', categories: ['status'], aliases: ['help', 'question'], lucide: ['help-circle'], keywords: ['what', 'support', 'unknown', 'faq'] },
  { name: 'settings', categories: ['actions'], aliases: ['gear', 'cog'], keywords: ['config', 'options', 'admin'] },
  { name: 'share-2', categories: ['actions'], aliases: ['share'], keywords: ['send', 'distribute', 'network', 'nodes'] },
  { name: 'swords', categories: ['objects'], aliases: ['combat', 'versus'], keywords: ['battle', 'fight', 'pvp', 'duel'] },
```

Then add, to the `describe('the icon manifest', ...)` block in `tests/icons.test.mjs`:

```js
  // Two drawings one character apart. The gear and the sliders are different
  // answers to "settings", and a shared keyword makes a picker offer both -
  // at which point the name stops being the thing that tells them apart.
  it('keeps the gear and the sliders apart', () => {
    const find = (n) => ICON_ENTRIES.find((e) => e.name === n)
    const gear = find('settings')
    const sliders = find('settings-2')
    const shared = [...gear.aliases, ...gear.keywords].filter((w) =>
      [...sliders.aliases, ...sliders.keywords].includes(w),
    )
    expect(shared, `settings and settings-2 share ${shared.join(', ')}`).toEqual([])
  })
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/icons.test.mjs --maxWorkers=2`
Expected: FAIL — `describes exactly the drawings on disk` lists the five as
missing. `keeps the gear and the sliders apart` passes once the rows above are
in, because they were written to pass it; it is there to fail on the next edit
that reaches for `config` in both.

- [ ] **Step 3: Draw the five**

`icons/activity.svg` — the ECG line. Lucide's is `M22 12h-4l-3 9L9 3l-3 9H2`,
whose legs are 3:9 and 6:18 — nowhere near 45°, so the amplitude has to come
down to the run. A baseline at `y=12` (the centre-axis exemption), one trough,
one peak, symmetric about centre:

```html
  <path d="M2.5 12 L6 12 L9.5 15.5 L15.5 9.5 L18 12 L21.5 12"/>
```

`icons/circle-help.svg` — the same eight-sided room as `circle-alert`,
`circle-check` and `circle-x`, verbatim, so the four sit together. The hook is a
blocky `?`: a 45° shoulder into a top bar, down the right, back to the centre
axis, and a short stem. The first attempt put the bar at `y=8.5` and the stem to
`y=13.5`; it read as a filled blob at tile size because the hook was too small
for the room. Raising the bar to `y=7.5` and lengthening the stem is what makes
it a question mark. The dot is `circle-alert`'s dot, moved down one unit:

```html
  <path d="M8.5 1.5 L15.5 1.5 L22.5 8.5 L22.5 15.5 L15.5 22.5 L8.5 22.5 L1.5 15.5 L1.5 8.5 Z"/>
  <path d="M7 9 L8.5 7.5 L14.5 7.5 L14.5 11.5 L12 11.5 L12 14.5"/>
  <path d="M12 17.5 L12 19"/>
```

`icons/settings.svg` — the gear, at the spec's four-tooth fallback, which is not
a concession but the drawing. Eight teeth plus a solid hub was drawn and
rejected: at 3px the corner teeth blur the silhouette and the hub closes, and it
renders as a framed target rather than a gear. Four axis teeth on the centre
lines and a hollow diamond hub:

```html
  <path d="M5.5 5.5 L18.5 5.5 L18.5 18.5 L5.5 18.5 Z"/>
  <path d="M12 9 L15 12 L12 15 L9 12 Z"/>
  <path d="M12 5.5 L12 2.5"/>
  <path d="M12 18.5 L12 21.5"/>
  <path d="M5.5 12 L2.5 12"/>
  <path d="M18.5 12 L21.5 12"/>
```

`icons/share-2.svg` — three diamond nodes joined by two 45° connectors. The
constraint that sets the whole layout: a 45° connector needs `|dx| = |dy|`, so
with the outer nodes as far apart vertically as a radius-2 diamond allows
(`y = 3.5` and `y = 20.5`, ±2 landing exactly on the live edge), the horizontal
separation is forced to 8.5 as well. The first attempt ran the connectors right
up to the node edges and the whole glyph merged into a lightning bolt; the
connectors here stop 1.5 short at each end, and the gap is what makes three
nodes read as three nodes:

```html
  <path d="M7 10 L9 12 L7 14 L5 12 Z"/>
  <path d="M15.5 1.5 L17.5 3.5 L15.5 5.5 L13.5 3.5 Z"/>
  <path d="M15.5 18.5 L17.5 20.5 L15.5 22.5 L13.5 20.5 Z"/>
  <path d="M9.5 9.5 L13 6"/>
  <path d="M9.5 14.5 L13 18"/>
```

`icons/swords.svg` — two crossed blades on the diagonals with a guard across
each hilt. Each guard is itself a 45° segment, perpendicular to the blade it
crosses, centred on it:

```html
  <path d="M4.5 19.5 L19.5 4.5"/>
  <path d="M4.5 4.5 L19.5 19.5"/>
  <path d="M3.5 16.5 L7.5 20.5"/>
  <path d="M16.5 20.5 L20.5 16.5"/>
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/icons.test.mjs --maxWorkers=2`
Expected: PASS — 57 `obeys rule 12` tests, drift green both ways, the gear and
the sliders sharing nothing.

- [ ] **Step 5: Build and look at them**

Run: `npm run build && npm run docs && npm run serve`
Open `/icons/`. These five are the ones with a legibility risk; check each at
tile size specifically, not just enlarged. `circle-help` must read as a `?` and
not a blob, `settings` as a gear and not a target, `share-2` as three nodes and
not one shape.

- [ ] **Step 6: Run the whole suite and commit**

Run: `npx vitest run --maxWorkers=2`
Expected: PASS.

```bash
git add icons/ docs/manifest/icons.mjs tests/icons.test.mjs dist/
git commit -m "feat(icons): the pulse, the question, the gear, the graph and the blades"
```

---

### Task 4: What the set will not draw, said on the page

The set now answers 57 of the 165 names the apps import. The other 108 are not
going away, and an app that hits one and finds no answer either invents a
substitution alone or abandons the migration. This task is the spec's *Adoption*
section: a substitution table, and an explicit statement that importing from
both is sanctioned.

**Files:**
- Modify: `docs/site/icons.mjs:56-79` (the "Drawing a new icon" prose block)
- Test: `tests/site.test.mjs` (the `describe('the icons page', ...)` block at line 339)

**Interfaces:**
- Consumes: `aliasPairs` is not used here; the table is prose.
- Produces: an `#substitutions` section on `/icons/`.

- [ ] **Step 1: Write the failing test**

Add to `describe('the icons page', ...)` in `tests/site.test.mjs`:

```js
  // 165 distinct lucide names across the suite against a set that will reach
  // 60-70. The apps import from both for the foreseeable future, and a
  // migration that answers a third of its own questions gets abandoned. The
  // page has to say what to use instead, and that the hybrid is fine.
  it('says what to use where the set will not draw the shape', () => {
    const html = read('icons/index.html')
    expect(html).toMatch(/id="substitutions"/)
    for (const name of ['star', 'sparkles', 'circle', 'triangle-alert']) {
      expect(html, `no substitution row for ${name}`).toContain(`<code>${name}</code>`)
    }
  })

  it('sanctions importing from lucide alongside the set', () => {
    expect(read('icons/index.html')).toMatch(/lucide-react/)
  })

  it('tells a porting app that a lucide name resolves in the sprite', () => {
    expect(read('icons/index.html')).toContain('#axi-triangle-alert')
  })
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run docs && npx vitest run tests/site.test.mjs --maxWorkers=2 -t "icons page"`
Expected: FAIL — no `id="substitutions"` in the page.

- [ ] **Step 3: Write the section**

In `docs/site/icons.mjs`, insert before the `<h2 id="drawing">Drawing a new icon</h2>`
block, inside the same `axi-prose` div:

```html
  <h2 id="substitutions">When the set does not have it</h2>
  <p>The suite imports 165 distinct Lucide names. This set draws 57 of them and will
  realistically reach sixty or seventy &mdash; so an app importing from
  <code>lucide-react</code> <em>and</em> from here is the expected arrangement, not a
  failure of the migration. The vocabulary was always borrowed; only the drawings are
  ours. Port what this set answers, leave the rest on Lucide, and do not re-decide it
  app by app.</p>
  <p>Some names this set answers under a different one. Those resolve in the sprite, so
  the port is a rename:</p>
  <pre><code>&lt;svg class="axi-icon"&gt;&lt;use href="#axi-triangle-alert"/&gt;&lt;/svg&gt;</code></pre>
  <p>And some it will not draw at all, because the shape needs a curve this grammar does
  not have. Those need a decision, and here it is:</p>
  <table>
    <thead><tr><th>Lucide name</th><th>Use</th><th>Why</th></tr></thead>
    <tbody>
      <tr><td><code>star</code></td><td><code>crown</code>, or a filled <code>.axi-diamond</code></td>
      <td>Five points need 36&deg; and 72&deg;. The four-point substitute cannot have
      concave vertices closer in than <code>R/&radic;2</code> &mdash; which is an octagon
      &mdash; so it comes out a lumpy diamond. Use <code>crown</code> where it means
      <em>featured</em> or <em>best</em>, and the diamond where it means <em>rating</em>.</td></tr>
      <tr><td><code>sparkles</code></td><td><code>crown</code></td>
      <td>The same floor by another route. A four-armed twinkle with equal arms reads as
      <code>plus</code>, with unequal arms as a dagger, and with eight arms it closes into
      a solid octagon at 3px. Three drawings, none of them the word.</td></tr>
      <tr><td><code>circle</code></td><td><code>square</code></td>
      <td>A circle is the one boundary this grammar has decided not to draw. It resolves
      in the sprite as an alias.</td></tr>
      <tr><td><code>triangle-alert</code></td><td><code>circle-alert</code></td>
      <td>Not an absence &mdash; a duplicate. A 45&deg;-only isoceles triangle is forced to
      2:1 tall-to-wide, which is a spike rather than a warning sign, and the eight-sided
      room already <em>is</em> the warning sign. It resolves in the sprite as an alias.</td></tr>
      <tr><td>anything else</td><td>stay on Lucide</td>
      <td>If the metaphor needs a curve and neither a square nor a diamond says it, an
      absent glyph beats a wrong one. Open an issue describing what the shape needed.</td></tr>
    </tbody>
  </table>
```

Then update the closing paragraph of the "Drawing a new icon" list, which
currently names `star` as the only refusal, to point at the table instead:

```html
  <p>If the metaphor genuinely needs a curve and neither a square nor a diamond says it, do
  not ship it. A wrong glyph costs more than an absent one &mdash;
  <a href="#substitutions">the table above</a> lists what this set has refused and what to
  reach for instead. Open an issue describing what the shape needed.</p>
```

A bare `<table>` is correct here: `src/prose.css:73` styles `.axi-prose table`,
and the block above is inside that div. Do not reach for `.axi-table`
(`src/data.css:55`) — it right-aligns every cell and sets `white-space: nowrap`,
which is a data grid, not a prose table with a sentence in the last column.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run docs && npx vitest run tests/site.test.mjs --maxWorkers=2`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add docs/site/icons.mjs tests/site.test.mjs _site/
git commit -m "docs(icons): what to use where the set will not draw it"
```

---

### Task 5: Fifty-seven, and the version that carries them

**Files:**
- Modify: `README.md:56-84`
- Modify: `package.json` (version)
- Test: `tests/site.test.mjs`, `tests/build.test.mjs` (existing)

**Interfaces:**
- Consumes: everything above.
- Produces: a tree ready to publish. **Publishing itself is not in this plan** — it is a side effect outside the worktree and belongs to the human.

- [ ] **Step 1: Write the failing test**

The README's glyph count is a number a human maintains and nothing reads, which
is exactly how it goes stale. Add to `tests/build.test.mjs`, beside the other
README assertions:

```js
  // The one number in the README that no test read, in a file nothing imports.
  it('states the real size of the set', () => {
    const readme = readFileSync(resolve('README.md'), 'utf8')
    const words = ['Forty-seven', 'Forty-eight', 'Forty-nine', 'Fifty', 'Fifty-one', 'Fifty-two',
      'Fifty-three', 'Fifty-four', 'Fifty-five', 'Fifty-six', 'Fifty-seven', 'Fifty-eight',
      'Fifty-nine', 'Sixty']
    expect(words[ICONS.length - 47], `no word for ${ICONS.length}`).toBeDefined()
    expect(readme).toContain(`${words[ICONS.length - 47]} glyphs drawn to`)
  })
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/build.test.mjs --maxWorkers=2 -t "real size"`
Expected: FAIL — the README says `Forty-seven glyphs drawn to`, the set is 57.

- [ ] **Step 3: Update the README**

In `README.md`, change the count on line 58 to `Fifty-seven`, and add a sentence
to the paragraph at line 79 about the alias symbols:

```markdown
One sprite holds the set; `dist/icons/<name>.svg` is the same drawing on its own,
and `dist/icons/icons.json` is the catalogue — name, categories, aliases and
keywords — for an app that wants to build a picker. A Lucide name this set
answers to under a different one — `triangle-alert`, `alert-circle`, `loader-2` —
resolves in the sprite too, so porting off `lucide-react` is a rename rather than
a call-site audit. Size a glyph with `--axi-icon-size`.
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/build.test.mjs --maxWorkers=2`
Expected: PASS.

- [ ] **Step 5: Build everything and run the whole suite**

Run: `npm run build && npm run docs && npx vitest run --maxWorkers=2`
Expected: PASS, whole suite, working tree containing the regenerated `dist/` and `_site/`.

- [ ] **Step 6: Bump the version**

Ten additive drawings and one additive sprite feature; no export path moves and
no existing symbol id changes. Minor:

```bash
npm version minor --no-git-tag-version
```

- [ ] **Step 7: Commit**

```bash
git add README.md package.json package-lock.json tests/build.test.mjs dist/ _site/
git commit -m "feat(icons): fifty-seven"
```

---

## What the final review changed

The whole-branch review found three things this plan got wrong, all of them
about ink rather than coordinates. Recorded here because the plan asserts the
opposite above:

1. **`tests/icons.test.mjs` checked coordinates, not where the stroke lands.**
   The live-area inset of 1.5 holds a stroke square-on to the edge and nothing
   else: a mitered vertex reaches `1.5/sin(theta/2)`, which is 2.12 at a right
   angle and 3.92 at the 45° corner this grammar makes constantly. Five drawings
   were green with ink outside the viewBox, where it is clipped — `share-2` and
   `message-square` from this tranche, and `filter`, `folder-open` and
   `volume-2` from round one. The checker now models the miter and all five were
   redrawn. Task 3's reasoning that `y = 1.5` and `y = 22.5` were "exactly the
   live edge" and therefore safe is the error, stated in full.
2. **`settings` shipped as the framed target it was supposed to avoid.** The
   four-tooth fallback has the same two defects the plan cites against eight
   teeth: at radius 3 with a 3px stroke the hub's interior is 0.88 units — a
   pinhole — and its miter reaches past the ring's inner edge, so hub and frame
   are one connected shape. The teeth were 1.5 units against a 3px stroke. It is
   now a notched-square silhouette with a solid diamond hub, which is a gear at
   20px.
3. **`swords` was indistinguishable from `x` at 20px.** Both were a full-width
   X. The cross now sits low, with blades roughly twice the hilts and a guard
   across each hilt.

Two documentation errors, both mine: the icons page said the set "draws 57 of"
the 165 names, conflating the size of the set with its coverage — it is 57
drawings answering **47** of them — and the page's own filter matched on
`aliases + keywords` only, so typing `triangle-alert` returned *"Nothing in the
set answers to that"* on a page whose inlined sprite contains that exact id.

## Not in this plan

- **`sparkles` and `star`.** Ruled out above and documented in the substitution table.
- **Publishing.** There is no npm-publish workflow in this repo; a release is `npm publish` from a logged-in shell, and that is the human's call, not a plan step.
- **Animating `loader-circle`.** The drawing is static; the spin is the consumer's `animation`. Rule 4 rations motion and rule 11 would govern it.
- **The 21 two-app icons and the 94-icon single-app tail.** A later tranche. 60% of the tail is axibridge alone.
- **The apps.** Nothing here rewrites an import in any `axi*` repo. Availability is this repo's job and adoption is theirs; Task 4 is what this repo owes them.
- **axistream.** It imports lucide and does not depend on this package. Whether it joins the suite is a question for the suite.
