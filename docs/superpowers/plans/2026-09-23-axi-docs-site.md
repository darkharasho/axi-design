# axi-design Documentation Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-page pattern gallery with a Bootstrap-style documentation site — per-component pages, narrative guides, search — generated from a component manifest and built entirely out of axi's own components.

**Architecture:** A manifest (`docs/manifest/*.mjs`) declares every component family: its classes, summary, knobs, the RULES.md clauses it answers, and its examples as raw HTML strings. A generator (`scripts/site.mjs`) renders each example twice — raw into a live demo, escaped-and-highlighted into the code block beside it — so copyable markup cannot drift from what it produced. Narrative pages are Markdown rendered through `marked` into `.axi-prose`. Tests make an undocumented class a build failure.

**Tech Stack:** Node 22 ESM, vitest, `marked` (new devDependency, build-time only). No runtime dependencies, no framework, no change to anything a consumer downloads.

**Spec:** `docs/superpowers/specs/2026-09-23-axi-docs-site-design.md`

## Global Constraints

- **Nothing in `src/` changes.** No new components, no edits to existing CSS. Gaps this work exposes are recorded for round two, not filled.
- **No runtime dependency, ever.** The only new dependency is `marked`, in `devDependencies` only. It must not appear in `dependencies`, in `dist/`, or in the npm `files` list.
- **`scripts/build.mjs` is touched in exactly one task** (Task 4, the generated README knob table). Every other task leaves it alone. `dist/axi.css` and `dist/accents.css` are byte-identical before and after this project.
- **Every published `/vN/axi.css` keeps resolving.** Those are staged from git tags in `pages.yml`; the per-tag loop is preserved verbatim.
- **All docs-only CSS is prefixed `.docs-`** and lives in `docs/site/docs.css`. It is never read by `build.mjs` and never enters `dist/`.
- **Base path:** the site is served from `/axi-design/` on Pages and `/` locally. Every emitted link goes through the single `url()` helper from `docs/site/shell.mjs`. A raw `href="/` or `src="/` in emitted output is a test failure.
- **`layer` is declared per manifest entry**, never inferred from which `src/` file the CSS sits in. Known layers: `primitives`, `layout`, `shells`, `data`, `prose`, `utilities`.
- **Test parallelism** is already capped at 2 forks in `vitest.config.mjs`. Run `npm test`; do not add a `--maxWorkers` flag.
- **Commit style:** lowercase `type: subject`, an em-dash clause where it helps, body explaining *why*. End every commit message with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

## Review Focus

Five failure modes the spec implies but that no task's happy-path tests would otherwise exercise. Each line's test is assigned to the task that owns the code.

1. **Example markup containing `<`, `&`, or a literal `</pre>`** — must appear verbatim in the code block and must not terminate it or inject markup. *Test added to Task 5.*
2. **A component `id` colliding with a static route** (`index`, `search`, `start`, `rules`, `theming`, `components`, `gallery`, `llms`) — two pages would write to one path and the survivor is whichever ran last. Must fail the build instead. *Test added to Task 2.*
3. **A manifest `rules: [n]` pointing at a clause number RULES.md does not have** — after a rule is renumbered or removed, every "Rules this answers" link on affected pages goes dead silently. *Test added to Task 2.*
4. **An `<!-- axi:knobs -->` placeholder inside a fenced code block in Markdown** — a guide showing the placeholder as an example would have it substituted instead of displayed; and an unrecognised `axi:` name must be a build error, not a silent passthrough. *Test added to Task 8.*
5. **A persisted accent id in `localStorage` that is no longer in `accents.json`** — a returning visitor gets an unset or invalid `--axi-accent` after the list changes. Must fall back to the first official accent. *Test added to Task 9.*

---

### Task 1: CSS and RULES introspection

The enforcement tests need to know, mechanically, which classes `src/` defines, which custom properties it reads with a fallback, and which rule numbers `docs/RULES.md` declares. Every later enforcement check consumes this module.

**Files:**
- Create: `docs/manifest/introspect.mjs`
- Test: `tests/introspect.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `sources(): string` — every `src/*.css` file concatenated.
  - `definedClasses(css?: string): string[]` — sorted, each entry leading-dot form, e.g. `'.axi-btn'`.
  - `fallbackKnobs(css?: string): string[]` — sorted custom property names read as `var(--axi-x, …)`, e.g. `'--axi-meter-v'`.
  - `ruleNumbers(): number[]` — the `n` of every `## n. …` heading in `docs/RULES.md`.

- [ ] **Step 1: Write the failing test**

Create `tests/introspect.test.mjs`:

```js
import { describe, it, expect } from 'vitest'
import { definedClasses, fallbackKnobs, ruleNumbers } from '../docs/manifest/introspect.mjs'

describe('definedClasses', () => {
  it('takes classes from selector text', () => {
    const css = '.axi-btn, .axi-btn--ghost { color: red; }'
    expect(definedClasses(css)).toEqual(['.axi-btn', '.axi-btn--ghost'])
  })

  it('finds classes nested inside an at-rule', () => {
    const css = '@media (min-width: 700px) { .axi-grid { display: grid; } }'
    expect(definedClasses(css)).toEqual(['.axi-grid'])
  })

  it('ignores a class named inside a declaration value', () => {
    const css = '.axi-card { background: url("sprite-axi-card.png"); }'
    expect(definedClasses(css)).toEqual(['.axi-card'])
  })

  it('ignores a class mentioned only in a comment', () => {
    const css = '/* .axi-ghost was removed in 1.6 */ .axi-btn { color: red; }'
    expect(definedClasses(css)).toEqual(['.axi-btn'])
  })

  it('reads the real stylesheet and finds a known component', () => {
    expect(definedClasses()).toContain('.axi-meter__fill')
  })
})

describe('fallbackKnobs', () => {
  it('takes only properties read with a fallback', () => {
    const css = '.axi-meter { height: var(--axi-meter-h, 12px); color: var(--axi-text); }'
    expect(fallbackKnobs(css)).toEqual(['--axi-meter-h'])
  })

  it('tolerates whitespace inside the var call', () => {
    expect(fallbackKnobs('a { width: var( --axi-switch-w , 46px ); }')).toEqual(['--axi-switch-w'])
  })

  it('reads the real stylesheet and finds a known knob', () => {
    expect(fallbackKnobs()).toContain('--axi-meter-v')
  })
})

describe('ruleNumbers', () => {
  it('returns the numbered clauses of RULES.md, in order', () => {
    expect(ruleNumbers()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/introspect.test.mjs`
Expected: FAIL — `Failed to load ../docs/manifest/introspect.mjs`.

- [ ] **Step 3: Write the implementation**

Create `docs/manifest/introspect.mjs`:

```js
import { readFileSync, readdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

export function sources() {
  return readdirSync(resolve(ROOT, 'src'))
    .filter((name) => name.endsWith('.css') && !name.startsWith('.'))
    .sort()
    .map((name) => readFileSync(resolve(ROOT, 'src', name), 'utf8'))
    .join('\n')
}

// Every class the stylesheet DEFINES, which means every class appearing in
// selector text. Splitting on braces alternates between selector text and
// declaration lists; a declaration list is told apart by containing a
// semicolon, which selector text never does. That leaves one theoretical
// false positive - a single unterminated declaration whose value contains the
// literal text `.axi-` - and the failure mode is a loud one (the coverage
// test demands a page for a class that does not exist), not a silent miss.
export function definedClasses(css = sources()) {
  const found = new Set()
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '')
  for (const chunk of stripped.split(/[{}]/)) {
    if (chunk.includes(';')) continue
    for (const match of chunk.matchAll(/\.(axi-[a-z0-9_-]+)/g)) found.add(`.${match[1]}`)
  }
  return [...found].sort()
}

// A per-instance knob is, precisely, a custom property the components read
// with a fallback: the fallback is what lets a consumer leave it unset, and
// leaving it unset is what makes it a knob rather than a theme token.
export function fallbackKnobs(css = sources()) {
  const found = new Set()
  for (const match of css.matchAll(/var\(\s*(--axi-[a-z0-9-]+)\s*,/g)) found.add(match[1])
  return [...found].sort()
}

export function ruleNumbers() {
  const md = readFileSync(resolve(ROOT, 'docs/RULES.md'), 'utf8')
  return [...md.matchAll(/^## (\d+)\. /gm)].map((match) => Number(match[1]))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/introspect.test.mjs`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add docs/manifest/introspect.mjs tests/introspect.test.mjs
git commit -m "$(cat <<'EOF'
feat(docs): read the stylesheet mechanically — classes, knobs, rule numbers

Every enforcement check the documentation site is about to grow needs to know
what src/ actually defines, and asking a human to keep a second list in sync is
the thing being designed out. One module, three functions, consumed by all of
them.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Manifest loader, entry validation, and the data layer

Establishes the manifest format and validates it, seeded with the `data` layer. The global class-coverage check comes in Task 3, once every layer exists — turning it on here would fail for the five layers not yet written, which is noise rather than signal.

**Files:**
- Create: `docs/manifest/index.mjs`, `docs/manifest/data.mjs`
- Test: `tests/manifest.test.mjs`

**Interfaces:**
- Consumes: `definedClasses`, `ruleNumbers` from `docs/manifest/introspect.mjs`.
- Produces:
  - `LAYERS: string[]` — `['primitives', 'layout', 'shells', 'data', 'prose', 'utilities']`, in sidebar order.
  - `RESERVED_IDS: string[]` — static route segments a component id may not take.
  - `entries(): Entry[]` — every manifest entry, flattened, in layer order.
  - `Entry` — `{ id, name, layer, classes: string[], summary, rules: number[], knobs: string[], notes?: string, examples: { title, note?, html }[] }`.

- [ ] **Step 1: Write the failing test**

Create `tests/manifest.test.mjs`:

```js
import { describe, it, expect } from 'vitest'
import { entries, LAYERS, RESERVED_IDS } from '../docs/manifest/index.mjs'
import { definedClasses, ruleNumbers } from '../docs/manifest/introspect.mjs'

const ALL = entries()

describe('manifest entry shape', () => {
  it('gives every entry a unique id', () => {
    const ids = ALL.map((e) => e.id)
    expect(ids).toEqual([...new Set(ids)])
  })

  it('uses only kebab-case ids', () => {
    for (const e of ALL) expect(e.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  // A component id becomes a directory under /components/, but the generator
  // also writes static routes at the site root. An id that collides with one
  // of those means two pages racing for one path, and the survivor is whichever
  // happened to be written last - a silent, ordering-dependent loss.
  it('never takes an id reserved by a static route', () => {
    for (const e of ALL) expect(RESERVED_IDS).not.toContain(e.id)
  })

  it('declares a known layer', () => {
    for (const e of ALL) expect(LAYERS).toContain(e.layer)
  })

  it('has a non-empty name and summary', () => {
    for (const e of ALL) {
      expect(e.name.length).toBeGreaterThan(0)
      expect(e.summary.length).toBeGreaterThan(0)
    }
  })

  it('lists at least one class and one example', () => {
    for (const e of ALL) {
      expect(e.classes.length).toBeGreaterThan(0)
      expect(e.examples.length).toBeGreaterThan(0)
    }
  })

  it('gives every example a title and markup', () => {
    for (const e of ALL) {
      for (const ex of e.examples) {
        expect(ex.title.length).toBeGreaterThan(0)
        expect(ex.html.trim().length).toBeGreaterThan(0)
      }
    }
  })
})

describe('manifest against the stylesheet', () => {
  it('claims only classes src/ actually defines', () => {
    const defined = new Set(definedClasses())
    for (const e of ALL) {
      for (const cls of e.classes) {
        expect(defined.has(cls), `${e.id} claims ${cls}, which src/ does not define`).toBe(true)
      }
    }
  })

  it('never claims one class from two entries', () => {
    const owner = new Map()
    for (const e of ALL) {
      for (const cls of e.classes) {
        expect(owner.has(cls), `${cls} is claimed by both ${owner.get(cls)} and ${e.id}`).toBe(false)
        owner.set(cls, e.id)
      }
    }
  })

  it('uses only classes src/ defines inside example markup', () => {
    const defined = new Set(definedClasses())
    for (const e of ALL) {
      for (const ex of e.examples) {
        for (const match of ex.html.matchAll(/class="([^"]*)"/g)) {
          for (const cls of match[1].split(/\s+/).filter(Boolean)) {
            if (!cls.startsWith('axi-')) continue
            expect(defined.has(`.${cls}`), `${e.id}/"${ex.title}" uses .${cls}, undefined in src/`).toBe(true)
          }
        }
      }
    }
  })

  // "Rules this answers" deep-links to /rules/#rule-<n>. A rule renumbered or
  // removed in RULES.md leaves those links pointing at nothing, on every page
  // that cited it, with no other symptom.
  it('cites only rule numbers RULES.md declares', () => {
    const known = new Set(ruleNumbers())
    for (const e of ALL) {
      for (const n of e.rules) {
        expect(known.has(n), `${e.id} cites rule ${n}, which RULES.md does not declare`).toBe(true)
      }
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/manifest.test.mjs`
Expected: FAIL — `Failed to load ../docs/manifest/index.mjs`.

- [ ] **Step 3: Write the loader**

Create `docs/manifest/index.mjs`:

```js
import data from './data.mjs'

// Sidebar order. Not the order of src/ - that file split is by cascade
// order, not by category, and the two genuinely differ (.axi-panel is defined
// in primitives.css and documented under Layout).
export const LAYERS = ['primitives', 'layout', 'shells', 'data', 'prose', 'utilities']

// Static routes the generator writes. A component id may not take one.
export const RESERVED_IDS = [
  'index', 'start', 'rules', 'theming', 'components', 'gallery', 'search', 'llms',
]

const BY_LAYER = { primitives: [], layout: [], shells: [], data, prose: [], utilities: [] }

export function entries() {
  return LAYERS.flatMap((layer) => BY_LAYER[layer] ?? [])
}

export function byLayer() {
  return LAYERS.map((layer) => ({ layer, items: BY_LAYER[layer] ?? [] })).filter((g) => g.items.length)
}

export function findEntry(id) {
  return entries().find((e) => e.id === id)
}
```

- [ ] **Step 4: Write the data layer manifest**

Create `docs/manifest/data.mjs`. Port the markup from the `#data` section of `index.html` (lines 241–351) rather than inventing new examples — it is already written and already correct. Seven entries, in this order: `stat`, `table`, `meter`, `bars`, `plot`, `axis`, `legend`. Between them they must claim every class `definedClasses()` reports from `src/data.css`:

`.axi-stat .axi-stat__k .axi-stat__n .axi-stat--accent .axi-stat--meta .axi-stat--ok .axi-stat--warn .axi-stat--danger .axi-table .axi-table__num .axi-table__rank .axi-table__rank--top .axi-table__who .axi-meter .axi-meter__fill .axi-meter-list .axi-meter-list__name .axi-meter-list__value .axi-bars .axi-bars__col .axi-bars__part .axi-plot .axi-plot__svg .axi-plot__area .axi-plot__line .axi-axis .axi-legend .axi-legend__key`

The `meter` entry in full, as the pattern for the other six:

```js
export default [
  // …stat, table…
  {
    id: 'meter',
    name: 'Meter',
    layer: 'data',
    classes: ['.axi-meter', '.axi-meter__fill', '.axi-meter-list', '.axi-meter-list__name', '.axi-meter-list__value'],
    summary: 'A horizontal bar showing one value against its full extent. Drawn in the series ink, filled to a hard edge.',
    rules: [1, 2, 9],
    knobs: ['--axi-meter-v', '--axi-meter-h', '--axi-series', '--axi-meter-label', '--axi-meter-value'],
    notes: `A meter says *how much*, and a quantity in this language is drawn as
length. Reach for \`--axi-series\` to change which ink a bar is drawn in; never
fade the accent to make a bar quieter.`,
    examples: [
      {
        title: 'A single meter',
        note: 'Fullness comes from --axi-meter-v',
        html: `<div class="axi-meter"><span class="axi-meter__fill" style="--axi-meter-v: 62%"></span></div>`,
      },
      {
        title: 'A ranked list',
        note: 'Leader in accent, the rest in a faint neutral',
        html: `<div class="axi-meter-list">
  <span class="axi-meter-list__name">Scourge</span>
  <div class="axi-meter"><span class="axi-meter__fill" style="--axi-meter-v: 100%"></span></div>
  <span class="axi-meter-list__value">1.4M</span>
  <span class="axi-meter-list__name">Spellbreaker</span>
  <div class="axi-meter"><span class="axi-meter__fill" style="--axi-meter-v: 63%; --axi-series: var(--axi-text-faint)"></span></div>
  <span class="axi-meter-list__value">884k</span>
</div>`,
      },
    ],
  },
  // …bars, plot, axis, legend…
]
```

Rule citations for the other six, from `docs/RULES.md`: `stat` → `[5, 3]`; `table` → `[8, 3]`; `bars` → `[9, 10]`; `plot` → `[1, 10]`; `axis` → `[2]`; `legend` → `[5, 7]`.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/manifest.test.mjs`
Expected: PASS. If "claims only classes src/ actually defines" fails, a class name in an entry is a typo. If "never claims one class from two entries" fails, two entries both list a shared class — decide which family owns it.

- [ ] **Step 6: Verify the data layer is complete**

Run:

```bash
node -e "
import('./docs/manifest/index.mjs').then(async (m) => {
  const { definedClasses } = await import('./docs/manifest/introspect.mjs')
  const { readFileSync } = await import('node:fs')
  const inData = new Set(definedClasses(readFileSync('src/data.css', 'utf8')))
  const claimed = new Set(m.entries().flatMap((e) => e.classes))
  const missing = [...inData].filter((c) => !claimed.has(c))
  console.log(missing.length ? 'UNDOCUMENTED: ' + missing.join(' ') : 'data layer complete')
})"
```

Expected: `data layer complete`. Anything listed needs an entry or needs adding to an existing entry's `classes`.

- [ ] **Step 7: Commit**

```bash
git add docs/manifest/index.mjs docs/manifest/data.mjs tests/manifest.test.mjs
git commit -m "$(cat <<'EOF'
feat(docs): the component manifest, validated, seeded with the data layer

One entry per component family: its classes, its knobs, the RULES clauses it
answers, and its examples as markup. The examples are the point - the generator
renders each string twice, once as the demo and once as the code beside it, so
the code cannot drift from what produced it.

Validation lands with the format rather than after it: unique ids, no id
colliding with a static route, no class claimed twice, no class that src/ does
not define, no citation of a rule RULES.md does not declare.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: The remaining five layers, and the coverage gate

Every layer written, then the check that makes an undocumented class a build failure. **This is the task where the gaps in the system surface.**

**Files:**
- Create: `docs/manifest/primitives.mjs`, `layout.mjs`, `shells.mjs`, `prose.mjs`, `utilities.mjs`
- Modify: `docs/manifest/index.mjs` (import and wire the five new layers into `BY_LAYER`)
- Modify: `tests/manifest.test.mjs` (add the coverage gate)

**Interfaces:**
- Consumes: the `Entry` shape from Task 2.
- Produces: `entries()` now covering all six layers.

- [ ] **Step 1: Write the failing coverage test**

Append to `tests/manifest.test.mjs`:

```js
// The forcing function. An undocumented component fails the build, which is
// how a component added in round two cannot land without its page. There is
// deliberately no exclusion list: a class that genuinely belongs to no visual
// family gets a real entry under the `utilities` layer. An exclusion list is
// precisely the escape hatch the rest of this repo's tests are written to
// avoid, because it turns "undocumented" into a one-line, unreviewed opt-out.
describe('coverage', () => {
  it('documents every class src/ defines', () => {
    const claimed = new Set(ALL.flatMap((e) => e.classes))
    const undocumented = definedClasses().filter((cls) => !claimed.has(cls))
    expect(undocumented, `undocumented: ${undocumented.join(' ')}`).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to see exactly which classes are undocumented**

Run: `npx vitest run tests/manifest.test.mjs -t coverage`
Expected: FAIL, listing roughly 64 classes — everything outside `src/data.css`. That list is the work of this task.

- [ ] **Step 3: Write the five layer manifests**

Same entry shape as Task 2. Port example markup from the matching sections of `index.html`. Grouping — note that `layer` deliberately diverges from the source file in five places:

```
primitives.mjs   btn (.axi-btn --primary --ghost --dashed)
                 chip (.axi-chip --accent --meta --ok --warn --danger)
                 input (.axi-input)         select (.axi-select)
                 switch (.axi-switch __knob) pill (.axi-pill)
                 search (.axi-search __icon)
                 notice (.axi-notice __icon)        [defined in shells.css]
                 tooltip (.axi-tooltip)             [defined in shells.css]
                 diamond (.axi-diamond --accent --ok --warn --danger --series)
                 badge-count (.axi-badge-count)

layout.mjs       page (.axi-page --narrow --wide)
                 grid (.axi-grid)   row (.axi-row)   stack (.axi-stack)
                 panel (.axi-panel)                  [defined in primitives.css]

shells.mjs       card (.axi-card __head __title __meta __glyph __go --strip)
                 window (.axi-window __body)   titlebar (.axi-titlebar __btns)
                 drawer (.axi-drawer __head __body __close)   scrim (.axi-scrim)
                 menu (.axi-menu __pop)   toolbar (.axi-toolbar)
                 mast (.axi-mast __in)    brand (.axi-brand __name)
                 sigil (.axi-sigil)       tabs (.axi-tabs)

prose.mjs        prose (.axi-prose)
                 quote (.axi-quote)                 [defined in shells.css]
                 eyebrow (.axi-eyebrow)             [defined in shells.css]

utilities.mjs    sr-only (.axi-sr-only)             [defined in base.css]
```

**Choosing each entry's `rules`.** Cite the clauses a reader would need in order to understand why the component looks as it does — normally two, never more than three, most specific first. The eleven clause titles, for reference:

| n | Clause |
|---|---|
| 1 | No gradients on surfaces |
| 2 | No colour at partial opacity over the ground |
| 3 | Every raised element is outlined and blocked |
| 4 | Hover lifts |
| 5 | Filled means status, outlined means annotation |
| 6 | One cool ink is reserved for meta |
| 7 | The diamond is the family motif |
| 8 | A table is the panel's interior |
| 9 | A quantity is drawn as length, never intensity |
| 10 | A chart's ink is the accent |
| 11 | An indicator of work animates a composited property |

So: `btn` → `[3, 4]`; `chip` → `[5, 2]`; `diamond` → `[7, 5]`; `panel` → `[3]`; `card` → `[3, 4]`; `drawer` → `[3]`; `prose` → `[3]`. An entry with no applicable clause — `sr-only`, `page`, `grid`, `row`, `stack` — takes `[]` rather than a stretched citation; an unconvincing rule reference is worse than none, because it teaches the reader that the section is decorative.

`sr-only` is the case the "no exclusion list" rule exists for. It gets a real entry:

```js
export default [
  {
    id: 'sr-only',
    name: 'Screen-reader only',
    layer: 'utilities',
    classes: ['.axi-sr-only'],
    summary: 'Hides an element visually while leaving it in the accessibility tree. Use it for a label whose meaning is already carried visually by an icon.',
    rules: [],
    knobs: [],
    notes: `Not a visual component and not themed. It exists because several
components - the accent switcher's \`<label>\`, a close button's name - need a
name a screen reader can read and a sighted reader does not need to see.`,
    examples: [
      {
        title: 'Naming an icon-only control',
        html: `<label class="axi-sr-only" for="accent-demo">Accent colour</label>
<select class="axi-select" id="accent-demo"><option>Axi Gold</option></select>`,
      },
    ],
  },
]
```

- [ ] **Step 4: Wire the layers into the loader**

Modify `docs/manifest/index.mjs` — replace the import and `BY_LAYER`:

```js
import primitives from './primitives.mjs'
import layout from './layout.mjs'
import shells from './shells.mjs'
import data from './data.mjs'
import prose from './prose.mjs'
import utilities from './utilities.mjs'

const BY_LAYER = { primitives, layout, shells, data, prose, utilities }
```

- [ ] **Step 5: Run the full manifest suite**

Run: `npx vitest run tests/manifest.test.mjs`
Expected: PASS, including `documents every class src/ defines`.

- [ ] **Step 6: Record what the gate exposed**

The classes that were awkward to place are round two's input. Append a short section to the spec's risks — or, if there is nothing awkward, note that explicitly so round two does not re-litigate it. Create `docs/superpowers/specs/2026-09-23-round-two-notes.md` with one line per component that had no natural home, and one line per gap noticed while writing examples (a form has no checkbox, a dialog has no modal, and so on).

- [ ] **Step 7: Commit**

```bash
git add docs/manifest tests/manifest.test.mjs docs/superpowers/specs/2026-09-23-round-two-notes.md
git commit -m "$(cat <<'EOF'
feat(docs): manifest every layer, and make an undocumented class a failure

All six layers, and the gate that gives the manifest its teeth: a class defined
in src/ and claimed by no entry fails the build. No exclusion list - a class
belonging to no visual family gets a real entry under `utilities`, which is
what .axi-sr-only now has. An exclusion list would make "undocumented" a
one-line unreviewed opt-out, which is the thing being designed out.

Note that `layer` is declared, not inferred: .axi-panel is defined in
primitives.css and documented under Layout, .axi-quote is defined in shells.css
and documented under Prose. The src/ split is by cascade order, not category.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: The knob table, generated into the README

`knobs.mjs` becomes the source of truth for the per-instance knob surface, feeding both each component page and the README table that can currently drift from `src/` in silence. This is the only task that touches `scripts/build.mjs`.

**Files:**
- Create: `docs/manifest/knobs.mjs`
- Modify: `scripts/build.mjs` (add `buildKnobTable`, write it into README on direct run)
- Modify: `README.md` (wrap the existing table in markers)
- Modify: `tests/manifest.test.mjs` (knob coverage + README sync)

**Interfaces:**
- Consumes: `fallbackKnobs` from `introspect.mjs`; `entries()` from `index.mjs`.
- Produces:
  - `KNOBS: Knob[]` where `Knob` is `{ name, sets, fallback, example }` — all four strings, `name` the `--axi-…` property.
  - `knobsFor(names: string[]): Knob[]` — the subset, in `KNOBS` order.
  - From `build.mjs`: `buildKnobTable(knobs?): string` — the Markdown table, no surrounding markers.

- [ ] **Step 1: Write the failing tests**

Append to `tests/manifest.test.mjs`:

```js
import { KNOBS, knobsFor } from '../docs/manifest/knobs.mjs'
import { fallbackKnobs } from '../docs/manifest/introspect.mjs'
import { buildKnobTable } from '../scripts/build.mjs'
import { readFileSync } from 'node:fs'

describe('knobs', () => {
  it('documents every custom property src/ reads with a fallback', () => {
    const named = new Set(KNOBS.map((k) => k.name))
    const undocumented = fallbackKnobs().filter((n) => !named.has(n))
    expect(undocumented, `undocumented knobs: ${undocumented.join(' ')}`).toEqual([])
  })

  it('documents no knob src/ never reads', () => {
    const read = new Set(fallbackKnobs())
    const phantom = KNOBS.map((k) => k.name).filter((n) => !read.has(n))
    expect(phantom, `documented but never read: ${phantom.join(' ')}`).toEqual([])
  })

  it('gives every knob a description, a fallback and an example', () => {
    for (const k of KNOBS) {
      expect(k.sets.length).toBeGreaterThan(0)
      expect(k.fallback.length).toBeGreaterThan(0)
      expect(k.example).toContain(k.name)
    }
  })

  it('only lets an entry cite a knob that exists', () => {
    const named = new Set(KNOBS.map((k) => k.name))
    for (const e of ALL) {
      for (const n of e.knobs) expect(named.has(n), `${e.id} cites unknown knob ${n}`).toBe(true)
    }
  })

  it('returns the requested subset in canonical order', () => {
    const picked = knobsFor([KNOBS[2].name, KNOBS[0].name])
    expect(picked.map((k) => k.name)).toEqual([KNOBS[0].name, KNOBS[2].name])
  })
})

// The README table was hand-maintained and could drift from src/ with no
// symptom. It is generated now, and this is what makes "generated" true.
describe('README knob table', () => {
  it('matches the table generated from knobs.mjs', () => {
    const readme = readFileSync('README.md', 'utf8')
    const section = readme.match(/<!-- axi:knobs -->\n([\s\S]*?)\n<!-- \/axi:knobs -->/)
    expect(section, 'README is missing the axi:knobs markers').not.toBeNull()
    expect(section[1]).toBe(buildKnobTable())
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/manifest.test.mjs`
Expected: FAIL — cannot resolve `docs/manifest/knobs.mjs`.

- [ ] **Step 3: Write knobs.mjs**

Create `docs/manifest/knobs.mjs`. **One entry per knob — 23 of them.** The README's table has only 20 rows because several document a related group in one line (`--axi-switch-w` / `--axi-switch-h` / `--axi-switch-knob` share a row, as do `--axi-meter-label` / `--axi-meter-value`). A component page needs to show knobs individually, so the manifest splits them and the generated table will have 23 rows where the hand-written one had 20. Port the wording of each row verbatim otherwise — the README is accurate today, and this task removes the *possibility* of drift rather than rewriting the content.

The 23, from `fallbackKnobs()`: `--axi-bar-part`, `--axi-bar-v`, `--axi-bars-gap`, `--axi-card-strip`, `--axi-drawer-width`, `--axi-grid-min`, `--axi-menu-width`, `--axi-meter-h`, `--axi-meter-label`, `--axi-meter-v`, `--axi-meter-value`, `--axi-page-pad`, `--axi-panel-pad`, `--axi-pill-fill`, `--axi-plot-h`, `--axi-plot-rows`, `--axi-row-gap`, `--axi-series`, `--axi-stack-gap`, `--axi-switch-fill`, `--axi-switch-h`, `--axi-switch-knob`, `--axi-switch-w`. Shape:

```js
// The per-instance knob surface: custom properties the components read with a
// fallback, so a consumer can set one on a single element or any ancestor.
// Not theme tokens - setting most of these in :root is legal and meaningless,
// because they answer "how wide is *this* grid", not "what does the system
// look like". This file is the source of truth: the README table is generated
// from it, and each component page shows the subset its entry cites.
export const KNOBS = [
  {
    name: '--axi-meter-v',
    sets: 'how full one `.axi-meter__fill` is',
    fallback: '`0%`',
    example: '<span class="axi-meter__fill" style="--axi-meter-v: 62%">',
  },
  // …17 more, in the README's existing order…
]

export function knobsFor(names) {
  const wanted = new Set(names)
  return KNOBS.filter((k) => wanted.has(k.name))
}
```

- [ ] **Step 4: Add the generator to build.mjs**

Modify `scripts/build.mjs`. Add after `buildAccentsCss`:

```js
// The knob table is generated into README.md between markers. It is the one
// table in this repo describing src/ that a human used to maintain by hand,
// and the one that could therefore go stale with no symptom at all - nothing
// imports a README.
import { KNOBS } from '../docs/manifest/knobs.mjs'

export function buildKnobTable(knobs = KNOBS) {
  const rows = knobs.map((k) => `| \`${k.name}\` | ${k.sets} | ${k.fallback} | \`${k.example}\` |`)
  return ['| Knob | Sets | Fallback | Example |', '|---|---|---|---|', ...rows].join('\n')
}

export function writeKnobTable(readme) {
  return readme.replace(
    /(<!-- axi:knobs -->\n)[\s\S]*?(\n<!-- \/axi:knobs -->)/,
    (_, open, close) => `${open}${buildKnobTable()}${close}`,
  )
}
```

And inside the direct-run block, after the accents write:

```js
  const readmePath = resolve(ROOT, 'README.md')
  writeFileSync(readmePath, writeKnobTable(readFileSync(readmePath, 'utf8')))
  console.log(`wrote the knob table into README.md (${KNOBS.length} knobs)`)
```

- [ ] **Step 5: Add the markers to README.md**

In `README.md`, wrap the existing knob table — the `| Knob | Sets | …` header through its last row — like this, leaving the surrounding prose alone:

```markdown
<!-- axi:knobs -->
| Knob | Sets | Fallback | Example |
|---|---|---|---|
...
<!-- /axi:knobs -->
```

- [ ] **Step 6: Regenerate and review the diff by eye**

Run: `npm run build && git diff README.md`

Expected: the three grouped rows split into individual ones — 20 rows become 23 — and **nothing else changes**. Any other difference in wording, fallback or example means a row in `knobs.mjs` disagrees with what the README already said; the README is the accurate one today, so reconcile toward it before continuing.

- [ ] **Step 7: Run the full suite**

Run: `npm test`
Expected: PASS. `tests/build.test.mjs` and `tests/accents.test.mjs` must still pass untouched — `dist/` is byte-identical.

- [ ] **Step 8: Commit**

```bash
git add docs/manifest/knobs.mjs scripts/build.mjs README.md tests/manifest.test.mjs
git commit -m "$(cat <<'EOF'
feat(docs): the knob table becomes data, and the README's copy becomes generated

Eighteen per-instance knobs, maintained in one place and read from two: each
component page shows the subset its entry cites, and README.md's table is
written between markers by the build.

That table described src/ and was maintained by hand, which made it the one
piece of documentation in this repo that could go stale in complete silence -
nothing imports a README, so nothing would ever have noticed. Now a knob read
with a fallback in src/ and absent from knobs.mjs fails, a knob documented and
never read fails, and a README out of sync with the manifest fails.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Escaping and build-time syntax highlighting

Turns an example's markup string into the highlighted code block shown beside its demo. No dependency: HTML is the only language in the samples.

**Files:**
- Create: `docs/site/highlight.mjs`
- Test: `tests/highlight.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `escapeHtml(s: string): string`
  - `highlight(source: string): string` — escaped HTML with `<span class="t-tag|t-attr|t-str|t-punc">` wrappers.

- [ ] **Step 1: Write the failing test**

Create `tests/highlight.test.mjs`:

```js
import { describe, it, expect } from 'vitest'
import { escapeHtml, highlight } from '../docs/site/highlight.mjs'
import { entries } from '../docs/manifest/index.mjs'

const unhighlight = (html) =>
  html.replace(/<\/?span[^>]*>/g, '')
    .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')

describe('escapeHtml', () => {
  it('escapes the four characters that can break out of a code block', () => {
    expect(escapeHtml('<a href="x">&</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;')
  })
})

describe('highlight', () => {
  it('marks tag names, attribute names, values and punctuation', () => {
    const out = highlight('<div class="axi-meter"></div>')
    expect(out).toContain('<span class="t-tag">div</span>')
    expect(out).toContain('<span class="t-attr">class</span>')
    expect(out).toContain('<span class="t-str">&quot;axi-meter&quot;</span>')
    expect(out).toContain('<span class="t-punc">&lt;</span>')
  })

  it('handles a valueless attribute', () => {
    expect(unhighlight(highlight('<div hidden></div>'))).toBe('<div hidden></div>')
  })

  it('handles a self-closing tag', () => {
    expect(unhighlight(highlight('<input class="axi-input" />'))).toBe('<input class="axi-input" />')
  })

  // The guarantee that makes the code block trustworthy: what is displayed is
  // exactly what the demo was rendered from, character for character.
  it('round-trips every example in the manifest', () => {
    for (const e of entries()) {
      for (const ex of e.examples) {
        expect(unhighlight(highlight(ex.html)), `${e.id}/"${ex.title}"`).toBe(ex.html)
      }
    }
  })

  // Review Focus 1. An example is free to contain markup-ish text; none of it
  // may terminate the code block or inject an element into the page.
  it('neutralises markup that would otherwise break out of the block', () => {
    const nasty = `<p>a &amp; b</p></pre><script>alert(1)</script>`
    const out = highlight(nasty)
    expect(out).not.toContain('</pre>')
    expect(out).not.toContain('<script>')
    expect(unhighlight(out)).toBe(nasty)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/highlight.test.mjs`
Expected: FAIL — cannot resolve `../docs/site/highlight.mjs`.

- [ ] **Step 3: Write the implementation**

Create `docs/site/highlight.mjs`:

```js
const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }

export function escapeHtml(source) {
  return String(source).replace(/[&<>"]/g, (ch) => ESCAPES[ch])
}

const ATTR = /(\s*)([a-zA-Z_:][\w:.-]*)(?:(\s*=\s*)("[^"]*"|'[^']*'))?/g

// A build-time tokeniser for HTML, and only HTML - the one language the
// samples are written in. A Prism or Shiki dependency would buy support for
// languages that never appear here, and would make every visitor pay at
// runtime for a transform that can happen once, here.
//
// The invariant, pinned by the round-trip test: every character of the input
// reaches the output exactly once, escaped. Highlighting may add spans; it may
// never add, drop or reorder source text. A `>` inside an attribute value
// would break the tag scan, so it is left unhighlighted as plain text rather
// than mis-parsed - the round-trip still holds.
export function highlight(source) {
  let out = ''
  let i = 0
  const text = (s) => { out += escapeHtml(s) }
  const span = (cls, s) => { out += `<span class="${cls}">${escapeHtml(s)}</span>` }

  while (i < source.length) {
    const lt = source.indexOf('<', i)
    if (lt === -1) { text(source.slice(i)); break }
    if (lt > i) text(source.slice(i, lt))

    const gt = source.indexOf('>', lt)
    const inner = gt === -1 ? null : source.slice(lt + 1, gt)
    const head = inner && inner.match(/^(\/?)([a-zA-Z][\w-]*)([\s\S]*)$/)
    if (!head) { text(source.slice(lt, lt + 1)); i = lt + 1; continue }

    const [, slash, name, rest] = head
    span('t-punc', `<${slash}`)
    span('t-tag', name)

    ATTR.lastIndex = 0
    let cursor = 0
    let match
    while ((match = ATTR.exec(rest)) !== null) {
      if (match[0] === '') { ATTR.lastIndex += 1; continue }
      if (match.index > cursor) text(rest.slice(cursor, match.index))
      text(match[1])
      span('t-attr', match[2])
      if (match[3]) span('t-punc', match[3])
      if (match[4]) span('t-str', match[4])
      cursor = ATTR.lastIndex
    }
    if (cursor < rest.length) {
      const tail = rest.slice(cursor)
      const selfClosing = tail.match(/^(\s*)(\/)$/)
      if (selfClosing) { text(selfClosing[1]); span('t-punc', '/') } else text(tail)
    }

    span('t-punc', '>')
    i = gt + 1
  }
  return out
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/highlight.test.mjs`
Expected: PASS, 6 tests. If the round-trip fails for one example, the tokeniser mis-parsed it — fix the tokeniser, never the example.

- [ ] **Step 5: Commit**

```bash
git add docs/site/highlight.mjs tests/highlight.test.mjs
git commit -m "$(cat <<'EOF'
feat(docs): escape and highlight example markup at build time

Four token classes drawn from existing inks - tag in meta, attribute in accent,
value in ok, punctuation in faint. HTML only, because HTML is the only language
the samples are written in, and a highlighter dependency would make every
visitor pay at runtime for a transform that belongs in the build.

The invariant is the round-trip: stripping the spans and unescaping returns the
source character for character, asserted against every example in the manifest.
That is what lets the code block be trusted as the thing the demo was rendered
from, rather than a retyped approximation of it.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Page shell, the `url()` helper, and docs-only CSS

Every page's chrome, built from axi's own components, plus the single place a link is made. This is where the base-path trap is closed.

**Files:**
- Create: `docs/site/shell.mjs`, `docs/site/docs.css`, `docs/site/accent.js`, `docs/site/copy.js`
- Test: `tests/shell.test.mjs`

**Interfaces:**
- Consumes: `byLayer`, `LAYERS` from `docs/manifest/index.mjs`.
- Produces:
  - `BASE: string` — `process.env.AXI_BASE ?? '/axi-design/'`.
  - `url(path?: string): string` — the only way a link is built.
  - `VERSION: string` — read from `package.json`.
  - `LAYER_NAMES: Record<string, string>` — `{ primitives: 'Primitives', … }`.
  - `page({ title, nav, body, toc?, sidebar?, description? }): string` — a full HTML document.
  - `sidebar(currentId?: string): string` — the layer-grouped component nav.

- [ ] **Step 1: Write the failing test**

Create `tests/shell.test.mjs`:

```js
import { describe, it, expect } from 'vitest'
import { url, page, sidebar, LAYER_NAMES, VERSION } from '../docs/site/shell.mjs'
import { LAYERS } from '../docs/manifest/index.mjs'

describe('url', () => {
  it('prefixes the base path', () => {
    expect(url('components/meter/')).toBe('/axi-design/components/meter/')
  })

  it('tolerates a leading slash on the argument', () => {
    expect(url('/start/')).toBe('/axi-design/start/')
  })

  it('returns the base itself for the site root', () => {
    expect(url()).toBe('/axi-design/')
  })

  it('never emits a doubled slash', () => {
    expect(url('//components//')).not.toMatch(/\/\//)
  })
})

describe('page', () => {
  const html = page({ title: 'Meter', nav: 'components', body: '<p>hi</p>' })

  it('is a complete document with the title in it', () => {
    expect(html).toMatch(/^<!doctype html>/i)
    expect(html).toContain('<title>Meter · axi-design</title>')
  })

  it('links the stylesheets through url()', () => {
    expect(html).toContain(`href="${url('axi.css')}"`)
    expect(html).toContain(`href="${url('accents.css')}"`)
    expect(html).toContain(`href="${url('docs.css')}"`)
  })

  it('shows the package version in the brand', () => {
    expect(html).toContain(`v${VERSION}`)
  })

  it('marks the current nav item', () => {
    expect(html).toMatch(/<a href="[^"]*components\/"[^>]*aria-current="page"/)
  })

  // Review Focus: a raw absolute link works locally and 404s on Pages, which
  // is the single most likely way this site ships silently broken.
  it('emits no absolute link that bypassed url()', () => {
    expect(html).not.toMatch(/(?:href|src)="\/(?!axi-design\/)/)
  })
})

describe('sidebar', () => {
  it('names every populated layer', () => {
    const html = sidebar()
    for (const layer of LAYERS) {
      if (html.includes(`data-layer="${layer}"`)) expect(html).toContain(LAYER_NAMES[layer])
    }
  })

  it('marks the current component and nothing else', () => {
    const html = sidebar('meter')
    expect([...html.matchAll(/aria-current="page"/g)].length).toBe(1)
    expect(html).toMatch(/href="[^"]*components\/meter\/"[^>]*aria-current="page"/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/shell.test.mjs`
Expected: FAIL — cannot resolve `../docs/site/shell.mjs`.

- [ ] **Step 3: Write shell.mjs**

Create `docs/site/shell.mjs`:

```js
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { byLayer } from '../manifest/index.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

export const VERSION = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8')).version
export const ACCENTS = JSON.parse(readFileSync(resolve(ROOT, 'accents.json'), 'utf8'))

// The site is served from /axi-design/ on Pages and from / by `npm run serve`.
// Every link in every emitted page goes through url(); a hand-written absolute
// href works in exactly one of those two places and fails silently in the
// other, which is why tests/site.test.mjs scans the output for one.
export const BASE = process.env.AXI_BASE ?? '/axi-design/'

export function url(path = '') {
  return `${BASE}/${String(path).replace(/^\/+/, '')}`.replace(/\/{2,}/g, '/')
}

export const LAYER_NAMES = {
  primitives: 'Primitives',
  layout: 'Layout',
  shells: 'Shells',
  data: 'Data',
  prose: 'Prose',
  utilities: 'Utilities',
}

const NAV = [
  ['start/', 'Start'],
  ['rules/', 'Rules'],
  ['theming/', 'Theming'],
  ['components/', 'Components'],
  ['gallery/', 'Gallery'],
]

export function sidebar(currentId) {
  return byLayer().map(({ layer, items }) => {
    const links = items.map((e) => {
      const current = e.id === currentId ? ' aria-current="page"' : ''
      return `<a href="${url(`components/${e.id}/`)}"${current}>${e.name}</a>`
    }).join('\n      ')
    return `    <h3 data-layer="${layer}">${LAYER_NAMES[layer]}</h3>\n      ${links}`
  }).join('\n')
}

function accentSelect() {
  const options = ACCENTS.map((a) => `<option value="${a.id}">${a.label}</option>`).join('')
  return `<label class="axi-sr-only" for="accent">Accent colour</label>
    <select class="axi-select" id="accent">${options}</select>`
}

export function page({ title, nav, body, toc = '', sidebar: side = '', description = '' }) {
  const tabs = NAV.map(([href, label]) => {
    const current = href === `${nav}/` || href === nav ? ' aria-current="page"' : ''
    return `<a href="${url(href)}"${current}>${label}</a>`
  }).join('')

  const columns = [side && `<aside class="docs-side">\n${side}\n  </aside>`, `<main>${body}</main>`,
    toc && `<nav class="docs-toc"><h3>On this page</h3>${toc}</nav>`].filter(Boolean).join('\n  ')

  const shellClass = ['docs-shell', side ? '' : 'docs-shell--plain', toc ? '' : 'docs-shell--notoc']
    .filter(Boolean).join(' ')

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · axi-design</title>
${description ? `<meta name="description" content="${description}">` : ''}
<link rel="stylesheet" href="${url('axi.css')}">
<link rel="stylesheet" href="${url('accents.css')}">
<link rel="stylesheet" href="${url('docs.css')}">
</head>
<body>
<header class="axi-mast"><div class="axi-mast__in">
  <a class="axi-brand" href="${url()}">
    <span class="axi-sigil" aria-hidden="true">A</span>
    <span class="axi-brand__name">axi-design<small>v${VERSION}</small></span>
  </a>
  <nav class="axi-tabs">${tabs}</nav>
  <div class="axi-search"><span class="axi-search__icon" aria-hidden="true">&#8981;</span>
    <input class="axi-input" id="q" type="search" placeholder="Search components&#8230;" autocomplete="off"></div>
  <div class="docs-results" id="results" hidden></div>
  ${accentSelect()}
</div></header>
<div class="${shellClass}">
  ${columns}
</div>
<script type="module" src="${url('accent.js')}"></script>
<script type="module" src="${url('copy.js')}"></script>
<script type="module" src="${url('search.js')}"></script>
</body>
</html>
`
}
```

- [ ] **Step 4: Write accent.js**

Create `docs/site/accent.js`. It is an ES module so the selection logic can be imported by a test and still run in the browser:

```js
// The accent is applied as a data attribute, which is exactly what
// dist/accents.css already selects on. The docs site therefore themes itself
// through the same published mechanism a consumer uses, rather than through a
// bespoke inline style only this site knows about.
const KEY = 'axi-accent'

// A persisted id can outlive the accent list: accents.json is versioned data
// and a returning visitor's localStorage is not. An unrecognised id must fall
// back to the first official accent rather than leave --axi-accent unset,
// because an unset accent is not a degraded page, it is an unthemed one.
export function chooseAccent(saved, validIds, fallbackId) {
  return validIds.includes(saved) ? saved : fallbackId
}

if (typeof document !== 'undefined') {
  const select = document.getElementById('accent')
  if (select) {
    const valid = [...select.options].map((o) => o.value)
    const chosen = chooseAccent(localStorage.getItem(KEY), valid, valid[0])
    document.documentElement.setAttribute('data-axi-accent', chosen)
    select.value = chosen
    select.addEventListener('change', () => {
      document.documentElement.setAttribute('data-axi-accent', select.value)
      localStorage.setItem(KEY, select.value)
    })
  }
}
```

- [ ] **Step 5: Write copy.js**

Create `docs/site/copy.js`:

```js
for (const button of document.querySelectorAll('[data-copy]')) {
  button.addEventListener('click', async () => {
    const code = document.getElementById(button.dataset.copy)
    await navigator.clipboard.writeText(code.textContent)
    const previous = button.textContent
    button.textContent = 'Copied'
    setTimeout(() => { button.textContent = previous }, 1200)
  })
}
```

- [ ] **Step 6: Write docs.css**

Create `docs/site/docs.css` with exactly this. Every selector is `.docs-*` or one of the four `.t-*` highlight classes — nothing here may be a bare `.axi-*` rule, because this file is not part of the design language and never reaches `dist/`. Every colour and every weight resolves through an existing `--axi-*` token; there are no literals but layout measures.

```css
/* axi-design documentation site — chrome only.
   Not part of the design language. Never concatenated into dist/axi.css,
   never published to npm. Anything in here that turns out to be generally
   useful is a candidate for promotion into src/, having earned its way in by
   being needed rather than by being on some other framework's feature list. */

body { margin: 0; }

.docs-shell {
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr) 200px;
  gap: 34px;
  max-width: var(--axi-page-wide);
  margin: 0 auto;
  padding: 26px var(--axi-gutter) 80px;
}
.docs-shell--notoc { grid-template-columns: 250px minmax(0, 1fr); }
.docs-shell--plain { grid-template-columns: minmax(0, 1fr); max-width: var(--axi-page); }

.docs-side { position: sticky; top: 20px; align-self: start; max-height: calc(100vh - 40px); overflow: auto; }
.docs-side h3 {
  font: var(--axi-t-eyebrow); letter-spacing: var(--axi-ls-eyebrow);
  text-transform: uppercase; color: var(--axi-text-faint); margin: 22px 0 8px;
}
.docs-side h3:first-child { margin-top: 0; }
.docs-side a {
  display: block; padding: 5px 10px; text-decoration: none;
  font: var(--axi-t-small); color: var(--axi-text-dim);
  border-left: var(--axi-border-control) solid transparent;
}
.docs-side a:hover { color: var(--axi-text); background: var(--axi-surface); }
.docs-side a[aria-current] { color: var(--axi-accent-ink); background: var(--axi-accent); font-weight: 800; }

.docs-toc { position: sticky; top: 20px; align-self: start; }
.docs-toc h3 {
  font: var(--axi-t-micro); letter-spacing: var(--axi-ls-micro);
  text-transform: uppercase; color: var(--axi-text-faint); margin: 0 0 10px;
}
.docs-toc a { display: block; padding: 4px 0; text-decoration: none; font: var(--axi-t-small); color: var(--axi-text-dim); }
.docs-toc a:hover { color: var(--axi-accent); }

.docs-title { font: var(--axi-t-display); letter-spacing: var(--axi-ls-display); margin: 2px 0 10px; }
.docs-lede { font: 400 17px/1.5 var(--axi-sans); color: var(--axi-text-dim); max-width: 60ch; margin: 0 0 18px; }
.docs-h2 { font: var(--axi-t-h2); letter-spacing: var(--axi-ls-h2); margin: 38px 0 14px; }
.docs-classrow { display: flex; flex-wrap: wrap; gap: 7px; margin: 0 0 30px; }

.docs-ex { margin: 0 0 34px; }
.docs-ex__h { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin: 0 0 12px; }
.docs-ex__h h2 { font: var(--axi-t-h3); letter-spacing: var(--axi-ls-h3); margin: 0; }
.docs-ex__note { font: var(--axi-t-small); color: var(--axi-text-faint); }

.docs-demo {
  background: var(--axi-surface);
  border: var(--axi-border-panel) solid var(--axi-ink-line);
  box-shadow: var(--axi-offset-panel) var(--axi-offset-panel) 0 var(--axi-ink-line);
  padding: 28px;
}

/* Tucked against the demo's own offset so the pair reads as one object rather
   than two stacked panels. */
.docs-code {
  position: relative;
  margin-top: calc(var(--axi-offset-panel) + 12px);
  background: var(--axi-ink-line);
  border: var(--axi-border-control) solid var(--axi-ink-line);
}
.docs-code pre { margin: 0; padding: 16px 18px; overflow: auto; font: 13px/1.65 var(--axi-mono); color: var(--axi-text-dim); }
.docs-code__copy { position: absolute; top: 8px; right: 8px; }

.t-tag { color: var(--axi-meta); }
.t-attr { color: var(--axi-accent); }
.t-str { color: var(--axi-ok); }
.t-punc { color: var(--axi-text-faint); }

.docs-knobs { width: 100%; border-collapse: collapse; margin: 0 0 30px; }
.docs-knobs th {
  text-align: left; font: var(--axi-t-micro); letter-spacing: var(--axi-ls-micro);
  text-transform: uppercase; color: var(--axi-text-faint); padding: 0 14px 9px 0;
}
.docs-knobs td {
  padding: 9px 14px 9px 0; vertical-align: top;
  border-top: var(--axi-border-hairline) solid var(--axi-rule);
  font: var(--axi-t-small); color: var(--axi-text-dim);
}
.docs-knobs code { font: 12.5px/1.5 var(--axi-mono); color: var(--axi-accent); }

.docs-rules { display: flex; flex-direction: column; gap: 10px; }
.docs-rules a { text-decoration: none; }

.docs-tile__demo { margin-top: 14px; pointer-events: none; }
.docs-section { margin: 0 0 56px; }

/* Search results, anchored under the mast's input. */
.docs-results {
  position: absolute; top: 100%; z-index: 20; width: 320px;
  background: var(--axi-surface-raised);
  border: var(--axi-border-control) solid var(--axi-ink-line);
  box-shadow: var(--axi-offset-control) var(--axi-offset-control) 0 var(--axi-ink-line);
}
.docs-results a {
  display: flex; justify-content: space-between; align-items: baseline; gap: 10px;
  padding: 9px 12px; text-decoration: none; color: var(--axi-text); font: var(--axi-t-small);
}
.docs-results a:hover { background: var(--axi-accent); color: var(--axi-accent-ink); }
.docs-results small { color: var(--axi-text-faint); font: var(--axi-t-micro); letter-spacing: var(--axi-ls-micro); text-transform: uppercase; }

@media (max-width: 1100px) {
  .docs-shell, .docs-shell--notoc { grid-template-columns: minmax(0, 1fr); }
  .docs-toc { display: none; }
  .docs-side { position: static; max-height: none; overflow: visible; }
}
```

Note the `.docs-results` positioning depends on `.axi-search` establishing a containing block. If it does not, wrap the search input and results in a `<div style="position: relative">` in `shell.mjs` rather than adding a `position` rule for `.axi-search` here — this file may not restyle an axi component.

- [ ] **Step 7: Run test to verify it passes**

Run: `npx vitest run tests/shell.test.mjs`
Expected: PASS, 10 tests.

- [ ] **Step 8: Commit**

```bash
git add docs/site tests/shell.test.mjs
git commit -m "$(cat <<'EOF'
feat(docs): the page shell, in axi's own components, behind one url() helper

Mast, brand, sigil, tabs, search, select - the site's chrome is the design
language, which is the strongest argument the site can make for it. Everything
the language does not ship lives in docs.css under a .docs- prefix and never
touches dist/.

Every link goes through url(). The site is served from /axi-design/ on Pages
and from / locally, so a hand-written absolute href works in exactly one of the
two and 404s in the other with no other symptom - the shell test scans for one.

The accent applies as a data attribute, which is what dist/accents.css already
selects on: the site themes itself through the published mechanism rather than
a bespoke one. A persisted id that is no longer in accents.json falls back to
the first official accent instead of leaving the page unthemed.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Component pages, the component index, and the generator entry point

The first task that produces a browsable site.

**Files:**
- Create: `docs/site/render.mjs`, `scripts/site.mjs`
- Modify: `package.json` (add the `docs` script), `.gitignore` (add `_site/`)
- Test: `tests/site.test.mjs`

**Interfaces:**
- Consumes: `entries`, `byLayer` (Task 2/3); `knobsFor` (Task 4); `highlight` (Task 5); `page`, `sidebar`, `url`, `LAYER_NAMES` (Task 6).
- Produces:
  - `componentPage(entry): string`
  - `componentsIndex(): string`
  - `example(ex, index, entryId): string`
  - From `scripts/site.mjs`: `build(outDir: string): string[]` — writes the site, returns every path written, relative to `outDir`.

- [ ] **Step 1: Write the failing test**

Create `tests/site.test.mjs`:

```js
import { describe, it, expect, beforeAll } from 'vitest'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { build } from '../scripts/site.mjs'
import { entries, findEntry } from '../docs/manifest/index.mjs'

let out, written
beforeAll(() => {
  out = mkdtempSync(resolve(tmpdir(), 'axi-site-'))
  written = build(out)
})

const read = (p) => readFileSync(resolve(out, p), 'utf8')

describe('build', () => {
  it('writes a page for every component', () => {
    for (const e of entries()) expect(written).toContain(`components/${e.id}/index.html`)
  })

  it('writes the component index and copies the stylesheets', () => {
    expect(written).toContain('components/index.html')
    expect(written).toContain('axi.css')
    expect(written).toContain('accents.css')
    expect(written).toContain('docs.css')
  })
})

describe('a component page', () => {
  const entry = findEntry('meter')
  let html
  beforeAll(() => { html = read('components/meter/index.html') })

  it('leads with the layer, name and summary', () => {
    expect(html).toContain('<p class="axi-eyebrow">Data</p>')
    expect(html).toContain(entry.name)
    expect(html).toContain(entry.summary)
  })

  it('lists its classes as meta chips', () => {
    for (const cls of entry.classes) {
      expect(html).toContain(`<span class="axi-chip axi-chip--meta">${cls}</span>`)
    }
  })

  it('renders each example live and as code', () => {
    for (const ex of entry.examples) {
      expect(html).toContain(ex.title)
      expect(html).toContain(ex.html)                           // the live demo, raw
      expect(html).toContain('<span class="t-tag">div</span>')  // the same markup, highlighted
    }
  })

  it('shows only the knobs its entry cites', () => {
    expect(html).toContain('--axi-meter-v')
    expect(html).not.toContain('--axi-drawer-width')
  })

  it('cites its rules and deep-links to stable anchors', () => {
    for (const n of entry.rules) expect(html).toContain(`/rules/#rule-${n}`)
  })

  it('marks itself current in the sidebar', () => {
    expect(html).toMatch(/href="[^"]*components\/meter\/"[^>]*aria-current="page"/)
  })
})

describe('emitted links', () => {
  it('contains no absolute link that bypassed url()', () => {
    for (const path of written.filter((p) => p.endsWith('.html'))) {
      const html = read(path)
      const offenders = [...html.matchAll(/(?:href|src)="\/(?!axi-design\/)[^"]*"/g)].map((m) => m[0])
      expect(offenders, `${path} has links outside the base path`).toEqual([])
    }
  })
})

afterAll(() => rmSync(out, { recursive: true, force: true }))
```

Add `afterAll` to the vitest import.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/site.test.mjs`
Expected: FAIL — cannot resolve `../scripts/site.mjs`.

- [ ] **Step 3: Write render.mjs**

Create `docs/site/render.mjs`:

```js
import { byLayer } from '../manifest/index.mjs'
import { knobsFor } from '../manifest/knobs.mjs'
import { highlight } from './highlight.mjs'
import { url, sidebar, page, LAYER_NAMES } from './shell.mjs'
import { renderMarkdown } from './markdown.mjs'

// An example is one string, rendered twice: raw into the demo, escaped and
// highlighted into the code block. There is no second copy of the markup, and
// so no way for the code someone copies to disagree with the thing they are
// looking at. That single-sourcing is the reason the manifest exists at all.
export function example(ex, index, entryId) {
  const codeId = `code-${entryId}-${index}`
  const note = ex.note ? `<span class="docs-ex__note">${ex.note}</span>` : ''
  return `<section class="docs-ex" id="ex-${index}">
  <div class="docs-ex__h"><h2>${ex.title}</h2>${note}</div>
  <div class="docs-demo">${ex.html}</div>
  <div class="docs-code">
    <button class="axi-btn axi-btn--ghost docs-code__copy" type="button" data-copy="${codeId}">Copy</button>
    <pre><code id="${codeId}">${highlight(ex.html)}</code></pre>
  </div>
</section>`
}

function knobTable(names) {
  const knobs = knobsFor(names)
  if (!knobs.length) return ''
  const rows = knobs.map((k) => `<tr><td><code>${k.name}</code></td><td>${k.sets.replace(/`([^`]+)`/g, '<code>$1</code>')}</td><td>${k.fallback.replace(/`([^`]+)`/g, '<code>$1</code>')}</td></tr>`).join('\n')
  return `<h2 class="docs-h2" id="knobs">Knobs</h2>
<table class="docs-knobs"><tr><th>Property</th><th>Sets</th><th>Fallback</th></tr>
${rows}
</table>`
}

function ruleNotices(numbers, ruleTitles) {
  if (!numbers.length) return ''
  const items = numbers.map((n) => `<a class="axi-notice" href="${url(`rules/#rule-${n}`)}">
  <span class="axi-notice__icon" aria-hidden="true">${n}</span>
  <div><strong>${ruleTitles.get(n) ?? `Rule ${n}`}</strong></div>
</a>`).join('\n')
  return `<h2 class="docs-h2" id="rules">Rules this answers</h2>
<div class="docs-rules">${items}</div>`
}

export function componentPage(entry, ruleTitles) {
  const chips = entry.classes.map((c) => `<span class="axi-chip axi-chip--meta">${c}</span>`).join('\n      ')
  const notes = entry.notes ? `<div class="axi-prose">${renderMarkdown(entry.notes).html}</div>` : ''
  const examples = entry.examples.map((ex, i) => example(ex, i, entry.id)).join('\n')

  const toc = [
    ...entry.examples.map((ex, i) => `<a href="#ex-${i}">${ex.title}</a>`),
    entry.knobs.length ? '<a href="#knobs">Knobs</a>' : '',
    entry.rules.length ? '<a href="#rules">Rules this answers</a>' : '',
  ].filter(Boolean).join('')

  const body = `<p class="axi-eyebrow">${LAYER_NAMES[entry.layer]}</p>
<h1 class="docs-title">${entry.name}</h1>
<p class="docs-lede">${entry.summary}</p>
<div class="docs-classrow">
      ${chips}
</div>
${notes}
${examples}
${knobTable(entry.knobs)}
${ruleNotices(entry.rules, ruleTitles)}`

  return page({
    title: entry.name,
    nav: 'components/',
    description: entry.summary,
    sidebar: sidebar(entry.id),
    toc,
    body,
  })
}

export function componentsIndex() {
  const groups = byLayer().map(({ layer, items }) => {
    const tiles = items.map((e) => `<a class="axi-card docs-tile" href="${url(`components/${e.id}/`)}">
  <div class="axi-card__head"><h3 class="axi-card__title">${e.name}</h3></div>
  <p class="axi-card__meta">${e.summary}</p>
  <div class="docs-tile__demo">${e.examples[0].html}</div>
</a>`).join('\n')
    return `<h2 class="docs-h2" id="${layer}">${LAYER_NAMES[layer]}</h2>
<div class="axi-grid">${tiles}</div>`
  }).join('\n')

  return page({
    title: 'Components',
    nav: 'components/',
    description: 'Every component in the axi design language, grouped by layer.',
    sidebar: sidebar(),
    toc: byLayer().map(({ layer }) => `<a href="#${layer}">${LAYER_NAMES[layer]}</a>`).join(''),
    body: `<p class="axi-eyebrow">Reference</p>
<h1 class="docs-title">Components</h1>
<p class="docs-lede">Every component in the language, grouped by layer. Each page carries live examples, the markup that produced them, its knobs, and the rules it answers.</p>
${groups}`,
  })
}
```

Note: `renderMarkdown` arrives in Task 8. For this task, stub it at the top of `render.mjs` as `const renderMarkdown = (md) => ({ html: `<p>${md}</p>` })` and replace the stub with the real import in Task 8.

- [ ] **Step 4: Write scripts/site.mjs**

Create `scripts/site.mjs`:

```js
import { mkdirSync, writeFileSync, copyFileSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { entries } from '../docs/manifest/index.mjs'
import { componentPage, componentsIndex } from '../docs/site/render.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// The titles behind the rule numbers a component cites, so a "Rules this
// answers" notice can name the rule rather than only number it. Read from
// RULES.md so a reworded rule reads correctly everywhere without a second edit.
function ruleTitles() {
  const md = readFileSync(resolve(ROOT, 'docs/RULES.md'), 'utf8')
  return new Map([...md.matchAll(/^## (\d+)\. (.+)$/gm)].map((m) => [Number(m[1]), m[2]]))
}

export function build(outDir) {
  const written = []
  const write = (rel, contents) => {
    const target = resolve(outDir, rel)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, contents)
    written.push(rel)
  }
  const copy = (from, rel) => {
    const target = resolve(outDir, rel)
    mkdirSync(dirname(target), { recursive: true })
    copyFileSync(resolve(ROOT, from), target)
    written.push(rel)
  }

  const titles = ruleTitles()
  for (const entry of entries()) {
    write(`components/${entry.id}/index.html`, componentPage(entry, titles))
  }
  write('components/index.html', componentsIndex())

  copy('dist/axi.css', 'axi.css')
  copy('dist/accents.css', 'accents.css')
  copy('docs/site/docs.css', 'docs.css')
  copy('docs/site/accent.js', 'accent.js')
  copy('docs/site/copy.js', 'copy.js')
  copy('docs/site/search.js', 'search.js')

  return written
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = resolve(ROOT, '_site')
  const written = build(out)
  console.log(`built _site from ${entries().length} components (${written.length} files)`)
}
```

`search.js` is created in Task 10; until then create `docs/site/search.js` as an empty file so the copy resolves.

- [ ] **Step 5: Add the npm script and ignore the output**

In `package.json`, add to `scripts`: `"docs": "node scripts/site.mjs"`.
In `.gitignore`, add a line: `_site/`.

- [ ] **Step 6: Run the tests**

Run: `npx vitest run tests/site.test.mjs`
Expected: PASS.

- [ ] **Step 7: Build and eyeball it**

Run: `npm run docs && ls _site/components`
Expected: one directory per component, plus `index.html`.

- [ ] **Step 8: Commit**

```bash
git add docs/site/render.mjs docs/site/search.js scripts/site.mjs package.json .gitignore tests/site.test.mjs
git commit -m "$(cat <<'EOF'
feat(docs): generate a page per component, and the index that gathers them

Each page: the layer, the name, the summary, the class names as chips right
under the title where they are being looked for, then the examples - each one
rendered live and, immediately beneath, the exact markup that produced it.
Knobs filtered to the ones the entry cites. Then the rules the component
answers, each deep-linked into RULES.md.

That last section is what makes this a design language rather than a component
list: every page ends by pointing at the clauses that dictate why the thing
looks the way it does.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Markdown pipeline and the three narrative pages

`/start/`, `/theming/` and `/rules/`. RULES.md is rendered, never copied.

**Files:**
- Create: `docs/site/markdown.mjs`, `docs/pages/start.md`, `docs/pages/theming.md`
- Modify: `docs/site/render.mjs` (replace the `renderMarkdown` stub with the real import), `scripts/site.mjs` (emit the three pages), `package.json` (add `marked`)
- Test: `tests/markdown.test.mjs`

**Interfaces:**
- Consumes: `buildKnobTable` (Task 4); `ACCENTS` from `shell.mjs`.
- Produces:
  - `renderMarkdown(md: string, { stableRuleIds?: boolean } = {}): { html: string, toc: { id, text }[] }`
  - `PLACEHOLDERS: Record<string, () => string>` — `knobs`, `accents`.

- [ ] **Step 1: Install marked**

Run: `npm install --save-dev marked`
Then confirm it landed in `devDependencies` only: `node -e "const p=require('./package.json'); console.log(p.dependencies ?? 'no dependencies block', Object.keys(p.devDependencies))"`
Expected: no `dependencies` block, `marked` present in `devDependencies`.

- [ ] **Step 2: Write the failing test**

Create `tests/markdown.test.mjs`:

```js
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { renderMarkdown } from '../docs/site/markdown.mjs'
import { buildKnobTable } from '../scripts/build.mjs'

describe('renderMarkdown', () => {
  it('renders headings with slug ids and collects a toc', () => {
    const { html, toc } = renderMarkdown('## Getting started\n\ntext')
    expect(html).toContain('<h2 id="getting-started">Getting started</h2>')
    expect(toc).toEqual([{ id: 'getting-started', text: 'Getting started' }])
  })

  // marked derives an id from the heading TEXT. Every component page deep-links
  // to /rules/#rule-<n>, so deriving the anchor from the wording would break
  // every one of those links the moment a rule is reworded - silently, since a
  // dead fragment does not 404.
  it('gives numbered RULES headings a stable rule-<n> id', () => {
    const { html } = renderMarkdown('## 2. No colour at partial opacity', { stableRuleIds: true })
    expect(html).toContain('<h2 id="rule-2">')
  })

  it('leaves unnumbered headings on slug ids even in rules mode', () => {
    const { html } = renderMarkdown('## Tokens', { stableRuleIds: true })
    expect(html).toContain('<h2 id="tokens">')
  })

  it('substitutes a known placeholder', () => {
    const { html } = renderMarkdown('before\n\n<!-- axi:knobs -->\n\nafter')
    expect(html).toContain(buildKnobTable().split('\n')[0].slice(0, 12))
    expect(html).not.toContain('axi:knobs')
  })

  // Review Focus: a guide that SHOWS the placeholder must display it, not have
  // it substituted. Substitution runs on rendered HTML, where a fenced block's
  // contents are already escaped, so the raw comment only survives outside one.
  it('leaves a placeholder inside a fenced code block alone', () => {
    const { html } = renderMarkdown('```\n<!-- axi:knobs -->\n```')
    expect(html).toContain('&lt;!-- axi:knobs --&gt;')
    expect(html).not.toContain('<th>Knob</th>')
  })

  it('throws on an unrecognised placeholder rather than passing it through', () => {
    expect(() => renderMarkdown('<!-- axi:nonsense -->')).toThrow(/axi:nonsense/)
  })

  it('renders the real RULES.md without throwing', () => {
    const md = readFileSync('docs/RULES.md', 'utf8')
    const { html, toc } = renderMarkdown(md, { stableRuleIds: true })
    expect(html).toContain('id="rule-1"')
    expect(html).toContain('id="rule-11"')
    expect(toc.length).toBeGreaterThan(10)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/markdown.test.mjs`
Expected: FAIL — cannot resolve `../docs/site/markdown.mjs`.

- [ ] **Step 4: Write markdown.mjs**

Create `docs/site/markdown.mjs`:

```js
import { marked } from 'marked'
import { buildKnobTable } from '../../scripts/build.mjs'
import { ACCENTS } from './shell.mjs'

// Generated content a Markdown page can embed. A guide that needs the knob
// table gets the real one rather than a hand-copied second version, which is
// the same bargain the README markers make.
export const PLACEHOLDERS = {
  knobs: () => marked.parse(buildKnobTable()),
  accents: () => `<table class="docs-knobs"><tr><th>Accent</th><th>Id</th><th>Hex</th></tr>${
    ACCENTS.map((a) => `<tr><td><span class="axi-diamond" style="--axi-series: ${a.hex}"></span> ${a.label}</td><td><code>${a.id}</code></td><td><code>${a.hex}</code></td></tr>`).join('')
  }</table>`,
}

const slug = (text) => text.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '')

export function renderMarkdown(md, { stableRuleIds = false } = {}) {
  let html = marked.parse(md, { mangle: false, headerIds: false })
  const toc = []

  // marked does not emit heading ids, which leaves the anchor scheme entirely
  // ours: a numbered RULES clause gets `rule-<n>`, stable across every
  // rewording, and everything else gets a slug.
  html = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_, level, inner) => {
    const text = inner.replace(/<[^>]*>/g, '').trim()
    const numbered = stableRuleIds && text.match(/^(\d+)\./)
    const id = numbered ? `rule-${numbered[1]}` : slug(text)
    if (level === '2') toc.push({ id, text })
    return `<h${level} id="${id}">${inner}</h${level}>`
  })

  // Substitution runs on the RENDERED html on purpose. Inside a fenced code
  // block marked has already escaped the comment to `&lt;!-- axi:knobs --&gt;`,
  // so a guide that shows a placeholder displays it and a guide that uses one
  // gets it filled - with no special-casing of fences anywhere here.
  html = html.replace(/<!--\s*axi:([a-z-]+)\s*-->/g, (_, name) => {
    const render = PLACEHOLDERS[name]
    if (!render) throw new Error(`unknown placeholder axi:${name} — known: ${Object.keys(PLACEHOLDERS).join(', ')}`)
    return render()
  })

  return { html, toc }
}
```

- [ ] **Step 5: Replace the stub in render.mjs**

In `docs/site/render.mjs`, delete the `const renderMarkdown = …` stub added in Task 7 and keep the real `import { renderMarkdown } from './markdown.mjs'`.

- [ ] **Step 6: Write the two Markdown guides**

Create `docs/pages/start.md` — the three consumption modes, ported from `README.md`'s "Use it" section: the Pages `<link>`, the npm install with `axi.css`, and the `tokens.css`-only case, including the paragraph explaining why a `<link>` is right for a site and wrong for an Electron window. End with setting `--axi-accent`.

Create `docs/pages/theming.md` — the token layers from `docs/RULES.md`'s "Tokens" section, then `<!-- axi:accents -->`, then the per-instance knob surface introduced in prose and `<!-- axi:knobs -->`. Make the distinction explicit: tokens are the system, knobs answer "how wide is *this* grid".

- [ ] **Step 7: Emit the three pages from site.mjs**

In `scripts/site.mjs`, add above the `copy(...)` calls:

```js
  const guide = (rel, source, title, nav, opts = {}) => {
    const { html, toc } = renderMarkdown(readFileSync(resolve(ROOT, source), 'utf8'), opts)
    write(rel, page({
      title,
      nav,
      body: `<div class="axi-prose">${html}</div>`,
      toc: toc.map((h) => `<a href="#${h.id}">${h.text}</a>`).join(''),
    }))
  }

  guide('start/index.html', 'docs/pages/start.md', 'Start', 'start/')
  guide('theming/index.html', 'docs/pages/theming.md', 'Theming', 'theming/')
  guide('rules/index.html', 'docs/RULES.md', 'Rules', 'rules/', { stableRuleIds: true })
```

with `import { renderMarkdown } from '../docs/site/markdown.mjs'` and `import { page } from '../docs/site/shell.mjs'` at the top.

- [ ] **Step 8: Add the coverage assertion to site.test.mjs**

Append to `tests/site.test.mjs`:

```js
describe('narrative pages', () => {
  it('writes start, theming and rules', () => {
    expect(written).toContain('start/index.html')
    expect(written).toContain('theming/index.html')
    expect(written).toContain('rules/index.html')
  })

  it('renders RULES.md with the anchors components link to', () => {
    const html = read('rules/index.html')
    for (const n of [1, 2, 3, 9]) expect(html).toContain(`id="rule-${n}"`)
  })

  // Every "Rules this answers" link on every component page must resolve to a
  // real anchor on /rules/. Nothing else would report a dead fragment.
  it('resolves every rule deep-link a component page emits', () => {
    const rules = read('rules/index.html')
    for (const e of entries()) {
      const html = read(`components/${e.id}/index.html`)
      for (const m of html.matchAll(/rules\/#(rule-\d+)/g)) {
        expect(rules, `${e.id} links #${m[1]}, absent from /rules/`).toContain(`id="${m[1]}"`)
      }
    }
  })
})
```

- [ ] **Step 9: Run the suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add docs/site/markdown.mjs docs/site/render.mjs docs/pages scripts/site.mjs package.json package-lock.json tests/markdown.test.mjs tests/site.test.mjs
git commit -m "$(cat <<'EOF'
feat(docs): render the guides from Markdown, and RULES.md from RULES.md

/rules/ reads docs/RULES.md itself. There is no second copy to drift, and the
file stays what ships in the tarball and what tests/tokens.test.mjs is written
against.

Heading anchors are ours rather than marked's, because marked derives an id
from the heading text and every component page deep-links to /rules/#rule-<n>:
anchoring on wording would break every one of those links the moment a rule was
reworded, and a dead fragment does not 404, so nothing would say so.

Generated tables reach a guide through an <!-- axi:knobs --> placeholder,
substituted on the rendered HTML. Inside a fenced block marked has already
escaped the comment, so a guide that demonstrates a placeholder displays it and
a guide that uses one gets it filled, with no fence special-casing at all. An
unknown placeholder throws.

marked is a devDependency: build-time only, never in dist/, never in the tarball.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Landing page, and the gallery moves

`/` becomes the pitch; today's `index.html` becomes `/gallery/`.

**Files:**
- Create: `docs/site/landing.mjs`
- Modify: `index.html` (strip the old mast, keep the sections), `gallery.js` (remove the accent switcher), `scripts/site.mjs`, `tests/accents.test.mjs` (the gallery accent-select assertion moves)
- Test: `tests/site.test.mjs`, `tests/accent.test.mjs`

**Interfaces:**
- Consumes: `page`, `url`, `ACCENTS` (Task 6); `findEntry` (Task 2).
- Produces: `landing(): string`.

- [ ] **Step 1: Write the failing tests**

Create `tests/accent.test.mjs`:

```js
import { describe, it, expect } from 'vitest'
import { chooseAccent } from '../docs/site/accent.js'
import { ACCENTS } from '../docs/site/shell.mjs'

describe('chooseAccent', () => {
  const valid = ACCENTS.map((a) => a.id)

  it('keeps a persisted accent that is still official', () => {
    expect(chooseAccent('violet-purple', valid, valid[0])).toBe('violet-purple')
  })

  // Review Focus: accents.json is versioned data and a returning visitor's
  // localStorage is not. An id dropped from the list must not leave
  // --axi-accent unset - that is not a degraded page, it is an unthemed one.
  it('falls back when the persisted accent has been retired', () => {
    expect(chooseAccent('sunset-tangerine', valid, valid[0])).toBe('axi-gold')
  })

  it('falls back when nothing was ever persisted', () => {
    expect(chooseAccent(null, valid, valid[0])).toBe('axi-gold')
  })
})
```

Append to `tests/site.test.mjs`:

```js
describe('landing and gallery', () => {
  it('writes the landing page at the site root', () => {
    expect(written).toContain('index.html')
  })

  it('shows the install snippet and routes onward', () => {
    const html = read('index.html')
    expect(html).toContain('@axiapps/axi-design')
    expect(html).toContain(`href="${'/axi-design/start/'}"`)
    expect(html).toContain(`href="${'/axi-design/components/'}"`)
  })

  it('writes the gallery and its script', () => {
    expect(written).toContain('gallery/index.html')
    expect(written).toContain('gallery.js')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/accent.test.mjs tests/site.test.mjs`
Expected: FAIL — `chooseAccent` import resolves (Task 6 wrote it) but the landing assertions fail on missing `index.html`.

- [ ] **Step 3: Write landing.mjs**

Create `docs/site/landing.mjs` exporting `landing()`, built with `page({ title: 'axi-design', nav: '', … })` and no sidebar or TOC. Body, in order:

1. A hero `<div class="axi-panel">` containing real components — a `.axi-card axi-card--strip`, a `.axi-meter-list` of three rows, a `.axi-row` of `.axi-chip` variants, a `.axi-stat` — so the first thing on screen is the language rather than a description of it.
2. `<h1 class="docs-title">` with the tagline: flat and outlined, dark, drawn in saturated ink.
3. The three-line install, through `example()` from `render.mjs` so it gets the same highlighting and copy button as every other code block on the site.
4. A `.axi-row` of two buttons: `.axi-btn axi-btn--primary` to `url('start/')` and `.axi-btn` to `url('components/')`.
5. One paragraph on the philosophy, ending in a link to `url('rules/')`.

- [ ] **Step 4: Split the accent switcher out of gallery.js**

In `gallery.js`, delete the accent `<select>` listener — `docs/site/accent.js` owns it for every page now, including the gallery. Leave the menu, drawer and tooltip behaviour alone.

- [ ] **Step 5: Convert index.html into a gallery fragment**

`index.html` keeps its `<section class="g-section">` blocks and drops its own `<!doctype>`, `<head>`, `.axi-mast` header and `<script>` tags — the shell supplies all four now. Move its `.g-section` rules into `docs/site/docs.css`, renamed `.docs-section`.

Simplest mechanical route: extract everything between `<main class="axi-page">` and its closing `</main>`, plus the trailing `.axi-scrim` and `.axi-drawer` elements, into `docs/pages/gallery.html`, and delete `index.html`.

- [ ] **Step 6: Emit both from site.mjs**

```js
  write('index.html', landing())
  write('gallery/index.html', page({
    title: 'Gallery',
    nav: 'gallery/',
    body: readFileSync(resolve(ROOT, 'docs/pages/gallery.html'), 'utf8'),
  }))
  copy('gallery.js', 'gallery.js')
```

and add `<script type="module" src="${url('gallery.js')}"></script>` to the gallery page only — extend `page()` with an optional `scripts = []` parameter rather than loading it on all thirty-odd component pages.

- [ ] **Step 7: Move the stale gallery assertion**

`tests/accents.test.mjs`'s `describe('gallery accent switcher')` reads `index.html` for a hard-coded `<option>` list that no longer exists. Replace that block with an assertion against the generated shell:

```js
describe('the accent switcher', () => {
  it('offers exactly the official accents, in order', () => {
    const html = page({ title: 'x', nav: '', body: '' })
    const select = html.match(/<select[^>]*id="accent"[\s\S]*?<\/select>/)[0]
    const options = [...select.matchAll(/<option value="([a-z-]+)">([^<]+)<\/option>/g)]
      .map((m) => ({ id: m[1], label: m[2] }))
    expect(options).toEqual(ACCENTS.map((a) => ({ id: a.id, label: a.label })))
  })
})
```

with `page` imported from `../docs/site/shell.mjs`.

- [ ] **Step 8: Run the suite and look at the site**

Run: `npm test && npm run docs`
Expected: PASS. Then serve it and click through `/`, `/components/`, `/components/meter/`, `/rules/`, `/gallery/`, and switch the accent on each.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat(docs): a landing page that shows the language, and the gallery keeps its job

The front door has about six seconds and one job: show, not tell. Real
components in the hero, the three-line install under them, and two ways
onward - Start and Components.

The old single-page gallery becomes /gallery/ rather than disappearing. It is
the only view in which the system can be judged as a whole, which thirty
separate component pages actively obscure, and losing it would cost something
no per-component page gives back.

gallery.js gives up the accent switcher - accent.js owns it on every page now -
and keeps the menu, drawer and tooltip behaviour that only the gallery has.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Search and llms.txt

The last two audiences: the author who wants a component in two keystrokes, and the agent that needs everything at once.

**Files:**
- Modify: `docs/site/search.js` (written empty in Task 7), `scripts/site.mjs`
- Create: `docs/site/llms.mjs`
- Test: `tests/site.test.mjs`, `tests/search.test.mjs`

**Interfaces:**
- Consumes: `entries` (Task 2/3); `KNOBS` (Task 4).
- Produces:
  - `matches(query, index): entry[]` — exported from `docs/site/search.js` so it is testable in node.
  - `llmsTxt(): string` — exported from `docs/site/llms.mjs`.
  - The search index itself is built inline in `scripts/site.mjs` (five fields projected off `entries()`); it needs no module of its own.

- [ ] **Step 1: Write the failing tests**

Create `tests/search.test.mjs`:

```js
import { describe, it, expect } from 'vitest'
import { matches } from '../docs/site/search.js'

const index = [
  { id: 'meter', name: 'Meter', layer: 'data', summary: 'A horizontal bar.', classes: ['.axi-meter', '.axi-meter__fill'] },
  { id: 'btn', name: 'Button', layer: 'primitives', summary: 'A control.', classes: ['.axi-btn'] },
]

describe('matches', () => {
  it('finds by name, case-insensitively', () => {
    expect(matches('MET', index).map((e) => e.id)).toEqual(['meter'])
  })

  it('finds by class name, with or without the leading dot', () => {
    expect(matches('.axi-btn', index).map((e) => e.id)).toEqual(['btn'])
    expect(matches('axi-meter__fill', index).map((e) => e.id)).toEqual(['meter'])
  })

  it('finds by summary text', () => {
    expect(matches('horizontal', index).map((e) => e.id)).toEqual(['meter'])
  })

  it('ranks a name match above a summary match', () => {
    const idx = [{ id: 'a', name: 'Alpha', layer: 'data', summary: 'mentions button', classes: [] },
      { id: 'btn', name: 'Button', layer: 'primitives', summary: '', classes: [] }]
    expect(matches('button', idx)[0].id).toBe('btn')
  })

  it('returns nothing for an empty query', () => {
    expect(matches('   ', index)).toEqual([])
  })
})
```

Append to `tests/site.test.mjs`:

```js
describe('machine-readable output', () => {
  it('writes the search index with an entry per component', () => {
    expect(written).toContain('search.json')
    const index = JSON.parse(read('search.json'))
    expect(index.length).toBe(entries().length)
    expect(index[0]).toHaveProperty('classes')
  })

  it('writes llms.txt naming every component, class and knob', () => {
    expect(written).toContain('llms.txt')
    const txt = read('llms.txt')
    for (const e of entries()) {
      expect(txt).toContain(e.name)
      for (const cls of e.classes) expect(txt).toContain(cls)
    }
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/search.test.mjs tests/site.test.mjs`
Expected: FAIL — `matches` is not exported from the empty `search.js`; `search.json` and `llms.txt` are not written.

- [ ] **Step 3: Write search.js**

Replace `docs/site/search.js`:

```js
// Ranked: a name match beats a class match beats a summary match. The index is
// thirty-odd entries, so there is no call for anything cleverer than a scan -
// and a dependency-free scan is one less thing between a keystroke and a result.
export function matches(query, index) {
  const q = query.trim().toLowerCase().replace(/^\./, '')
  if (!q) return []
  const scored = []
  for (const entry of index) {
    const name = entry.name.toLowerCase()
    const cls = entry.classes.join(' ').toLowerCase()
    let score = 0
    if (name.startsWith(q)) score = 3
    else if (name.includes(q)) score = 2
    else if (cls.includes(q)) score = 1.5
    else if (entry.summary.toLowerCase().includes(q)) score = 1
    if (score) scored.push({ entry, score })
  }
  return scored.sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name))
    .map((s) => s.entry)
}

if (typeof document !== 'undefined') {
  const input = document.getElementById('q')
  const results = document.getElementById('results')
  if (input && results) {
    const base = document.documentElement.dataset.base ?? '/'
    const loaded = fetch(`${base}search.json`).then((r) => r.json())
    input.addEventListener('input', async () => {
      const found = matches(input.value, await loaded).slice(0, 8)
      results.innerHTML = found.map((e) =>
        `<a href="${base}components/${e.id}/"><strong>${e.name}</strong><small>${e.layer}</small></a>`).join('')
      results.hidden = found.length === 0
    })
    input.addEventListener('blur', () => setTimeout(() => { results.hidden = true }, 150))
  }
}
```

The client reads the base path from `document.documentElement.dataset.base`, so add `data-base="${BASE}"` to the `<html>` tag in `shell.mjs`'s `page()` — the one place a script may learn the base without hard-coding it.

- [ ] **Step 4: Write llms.mjs**

Create `docs/site/llms.mjs` exporting `llmsTxt()`: a plain-text reference beginning with what axi is and the one-line install, then the complete rule list from RULES.md's headings, then — per component, grouped by layer — the name, id, URL, summary, every class, every knob with its fallback, and every example's markup verbatim. It closes with the full knob table. Written for an agent, so no ceremony: no navigation, no repetition, everything on the page.

- [ ] **Step 5: Emit both from site.mjs**

```js
  write('search.json', JSON.stringify(entries().map(({ id, name, layer, summary, classes }) =>
    ({ id, name, layer, summary, classes }))))
  write('llms.txt', llmsTxt())
```

- [ ] **Step 6: Run the suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add docs/site/search.js docs/site/llms.mjs scripts/site.mjs tests/search.test.mjs tests/site.test.mjs
git commit -m "$(cat <<'EOF'
feat(docs): search for the author, llms.txt for the agent

Both fall out of the manifest, which is the argument for having built one. The
search index is the same thirty entries with the prose dropped; the scan is
ranked name over class over summary and takes no dependency, because at this
size anything cleverer is a dependency between a keystroke and a result.

llms.txt is the whole reference on one page with no navigation and no
repetition: every component, every class, every knob and its fallback, every
example verbatim. Written for the reader that wants all of it at once.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: Local preview, deploy, and packaging

Ship it, and close the packaging regression this project introduced.

**Files:**
- Create: `scripts/serve.mjs`
- Modify: `.github/workflows/pages.yml`, `package.json` (`files`, `serve` script), `README.md` (point at the site), `tests/accents.test.mjs` (packaging assertions)

**Interfaces:**
- Consumes: `build` from `scripts/site.mjs`.
- Produces: `npm run serve`.

- [ ] **Step 1: Write the failing packaging test**

`package.json`'s `files` list contains `"docs"`. Before this project that meant one file, `docs/RULES.md`. It now means the manifest, the generator, the guides and the spec directory — all shipped to every consumer, none of any use to them.

Append to `tests/accents.test.mjs`'s `describe('packaging')`:

```js
  it('ships RULES.md and nothing else from docs/', () => {
    const [pack] = JSON.parse(execSync('npm pack --dry-run --json', { encoding: 'utf8' }))
    const docs = pack.files.map((f) => f.path).filter((p) => p.startsWith('docs/'))
    expect(docs).toEqual(['docs/RULES.md'])
  })

  it('declares no runtime dependencies', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
    expect(pkg.dependencies ?? {}).toEqual({})
    expect(Object.keys(pkg.devDependencies)).toContain('marked')
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/accents.test.mjs -t packaging`
Expected: FAIL — `docs/` contains the manifest, site and spec directories.

- [ ] **Step 3: Narrow the files list**

In `package.json`, change `"docs"` to `"docs/RULES.md"` in `files`, and update the adjacent `//files` comment: `docs/RULES.md` rides along because it is the reason any of it is shaped the way it is; the manifest, the generator and the guides build the site and are no use to a consumer.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/accents.test.mjs -t packaging`
Expected: PASS.

- [ ] **Step 5: Write serve.mjs**

Create `scripts/serve.mjs`:

```js
import { createServer } from 'node:http'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { resolve, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// Local preview serves from / while Pages serves from /axi-design/, so the
// site is rebuilt here with AXI_BASE set to the root. Building rather than
// serving _site as-is is deliberate: a preview of a stale build is worse than
// no preview, because it looks like a preview.
process.env.AXI_BASE = '/'
const { build } = await import('./site.mjs')

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(ROOT, '_site')
build(OUT)

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.txt': 'text/plain', '.svg': 'image/svg+xml' }

createServer((req, res) => {
  let path = resolve(OUT, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, ''))
  if (!path.startsWith(OUT)) { res.writeHead(403).end(); return }
  if (existsSync(path) && statSync(path).isDirectory()) path = resolve(path, 'index.html')
  if (!existsSync(path)) { res.writeHead(404).end('not found'); return }
  res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' })
  res.end(readFileSync(path))
}).listen(4173, () => console.log('axi-design docs on http://localhost:4173'))
```

Add to `package.json` scripts: `"serve": "node scripts/serve.mjs"`.

- [ ] **Step 6: Update the Pages workflow**

In `.github/workflows/pages.yml`, replace the staging step's first two lines:

```yaml
      - name: Build the site and stage every published version
        run: |
          npm run docs
          for tag in $(git tag -l 'v*' | sort -V); do
```

Delete `mkdir -p _site` and the `cp -r index.html gallery.js dist _site/` line — `npm run docs` creates `_site` and writes everything into it. Leave the per-tag loop, the `ls -R _site`, and every step after it exactly as they are: that loop is the promise that `/v1/axi.css` keeps resolving, and it reads from git tags, not from the site build.

- [ ] **Step 7: Verify the deploy staging locally**

Run:

```bash
rm -rf _site && npm run docs && for tag in $(git tag -l 'v*' | sort -V); do
  major="${tag%%.*}"; mkdir -p "_site/$major"; git show "$tag:dist/axi.css" > "_site/$major/axi.css"; done
ls _site && ls _site/v1
```

Expected: `_site` holds `index.html`, `components/`, `start/`, `rules/`, `theming/`, `gallery/`, `llms.txt`, `search.json`, the stylesheets — and `_site/v1/axi.css` exists.

- [ ] **Step 8: Update the README**

In `README.md`, change "See [the pattern gallery](…) for every component, with a live accent switcher" to point at the documentation site, and mention that `/gallery/` still holds the everything-at-once view. Leave the install instructions and the generated knob table alone.

- [ ] **Step 9: Run everything**

Run: `npm run build && npm run docs && npm test`
Expected: PASS, and `git diff --stat dist/` shows **no change** — the shipped artifact is byte-identical to where this project started.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
ci+pkg: deploy the site, preview it locally, and stop shipping docs/ wholesale

pages.yml builds the site instead of copying one page into place. The per-tag
staging loop is untouched: every published /vN/axi.css is still rebuilt from
its own tag on every deploy, which is the one promise consumers actually rely
on.

`npm run serve` rebuilds with AXI_BASE=/ and serves on 4173. Rebuilding rather
than serving _site as it stands is deliberate - a stale preview is worse than
none, because it still looks like a preview.

The files allowlist said "docs", which meant one file until this project gave
docs/ a manifest, a generator, guides and a spec directory. It now says
docs/RULES.md, and a test pins it so the tarball cannot quietly grow again.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```
