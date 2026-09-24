# axi-design round two: the missing components — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add checkbox, radio, textarea, breadcrumb, pagination, avatar, modal, accordion, toast, spinner, indeterminate progress and notice status variants to the design language, each with its docs entry, knobs and rule citation.

**Architecture:** Zero JavaScript. Where a native element does the behaviour the component *is* that element (`<input>`, `<details>`, `<dialog>`); toast ships CSS plus a documented consumer contract. Five of the asked-for twelve already exist in `src/` and are extended rather than duplicated, with search aliases carrying the Bootstrap names. Two new source files (`forms.css`, `feedback.css`) keep `primitives.css` and `shells.css` from absorbing whole new layers.

**Tech Stack:** Hand-written CSS with no build step beyond concatenation; Node 22 ESM; vitest 2.1.9 (`pool: 'forks'`, `maxForks: 2` — already set in `vitest.config.mjs`, so plain `npm test` is correct and adding a parallelism flag is itself a defect).

**Spec:** `docs/superpowers/specs/2026-09-24-axi-round-two-components-design.md`

## Global Constraints

- **No colour literal outside `src/tokens.css`.** `tokens.test.mjs` scans both polarities and will fail the build.
- **Only two form steps.** Borders and outlines use `var(--axi-border-panel)` (4px) or `var(--axi-border-control)` (3px); blocks use `var(--axi-offset-panel)` (6px), `var(--axi-offset-control)` (3px), or the two `-hover` deepenings. `--axi-border-hairline` (2px) is a *rule* weight — a line inside content — never an outline on a raised thing.
- **Every corner from the radius scale.** `var(--axi-radius)` for panel-sized surfaces, `var(--axi-radius-sm)` for control-sized. Both are `0` today; a bare `0` is also legal. Never a literal px or `%`.
- **A border weight is paired with its offset weight.** Panel border with panel offset, control border with control offset. Mixing them invents a third step.
- **Every block is hard**: `box-shadow: <offset> <offset> 0 var(--axi-ink-line)`. No blur, and no smuggling one through `filter: drop-shadow()` or `text-shadow`.
- **A `var(--axi-x, fallback)` read makes `--axi-x` a knob**, and every knob needs a row in `docs/manifest/knobs.mjs`. The gate is bidirectional and has no exclusion list.
- **Every class defined in `src/` needs a manifest entry in the same commit.** Also bidirectional, also no exclusion list. This is why source and docs cannot be split into separate tasks.
- **`npm run build` after every source change**, committing `dist/axi.css` and the regenerated README knob table alongside.
- Commit messages end with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

## Review Focus

Five things the components will meet that no happy path exercises. Each has its test assigned to the task that owns the code.

1. **The busy meter under `prefers-reduced-motion`.** `base.css` forces `animation-duration: .01ms` and `animation-iteration-count: 1`, which parks an animation at its *end* state. `.axi-meter--busy`'s end state is `translateX(400%)` — an empty track. A reader who turns motion off would see a progress bar that shows nothing. **Owned by Task 5**, which adds an explicit reduced-motion rule parking the fill visibly.
2. **A `<dialog>` that is never `showModal()`-ed.** With the bare `open` attribute it renders inline, with no backdrop and no top layer. The docs example does exactly this on purpose, so its note must say so. **Owned by Task 4.**
3. **`appearance: none` discarding the native focus ring.** `base.css` has a global `:focus-visible` ring, so the checkbox should inherit it — but "should" is the word that precedes every accessibility regression. **Owned by Task 2**, which asserts no rule in `forms.css` sets `outline: none` or `outline: 0`.
4. **An empty toast region intercepting clicks.** `.axi-toasts` is `position: fixed` and full-height by default; with no toasts in it, it would still swallow pointer events over the page. **Owned by Task 4**, which sets `pointer-events: none` on the region and `auto` on each toast, and asserts it.
5. **`--axi-accent-ink` on the check mark in light mode.** The mark is drawn in the ink that sits *on* an accent fill; light mode swaps the palette, and this is the one new component whose foreground depends on a token pair rather than a single token. **Owned by Task 2**, which asserts the mark reads `--axi-accent-ink` rather than a surface or text token.

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `docs/RULES.md` | Gains a **Layer stack** subsection under Tokens | 1 |
| `src/shells.css:134` | `.axi-tooltip` z-index `99999` → `70` | 1 |
| `tests/motion.test.mjs` (new) | Rule 11 as a gate: `@keyframes` may touch only `transform`/`opacity` | 1 |
| `tests/layers.test.mjs` (new) | Every non-negative `z-index` in `src/` appears in the documented table | 1 |
| `src/forms.css` (new) | `.axi-check`, `.axi-radio`, `textarea.axi-input` | 2 |
| `docs/manifest/forms.mjs` (new) | Docs entries for the form layer | 2 |
| `src/primitives.css` | `.axi-avatar` appended | 3 |
| `src/shells.css` | `.axi-crumbs`, `.axi-pages` appended | 3 |
| `src/shells.css` | `.axi-modal`, `.axi-accordion`, `.axi-toasts`, `.axi-toast` appended | 4 |
| `src/feedback.css` (new) | `.axi-spinner`, `.axi-meter--busy`, `.axi-notice--*` | 5 |
| `docs/manifest/feedback.mjs` (new) | Docs entries for the feedback layer | 5 |
| `docs/site/search.js` | Alias matching in the scan | 6 |
| `scripts/site.mjs:110` | `aliases` projected into `search.json` | 6 |
| `scripts/build.mjs:15` | `ORDER` gains `forms.css` and `feedback.css` | 2, 5 |
| `docs/manifest/knobs.mjs` | Six new knob rows | 2, 3, 4, 5 |
| `docs/manifest/index.mjs` | `forms` and `feedback` registered as layers | 2, 5 |

**Deviation from the spec, and why.** The spec sequences the layer-stack work with batch 3 (overlays), because that is the batch which needs a z-index. This plan moves it to **Task 1** instead. A gate written before the code it governs checks every later task; a gate written in the middle checks only what follows it, and the two batches that ship animations and stacking would land unchecked. The spec's requirement is that the stack be documented and enforced — it is silent on ordering, so this is a strengthening, not a contradiction.

---

### Task 1: The layer stack and the motion gate

Makes two pieces of prose doctrine mechanical before any component relies on them. Nothing in this task adds a component.

**Files:**
- Modify: `docs/RULES.md` (new subsection under `## Tokens`)
- Modify: `src/shells.css:134`
- Create: `tests/motion.test.mjs`
- Create: `tests/layers.test.mjs`

**Interfaces:**
- Produces: the documented layer table that Task 4 reads to pick `z-index: 60` for `.axi-toasts`; the `@keyframes` gate that Task 5's `.axi-spinner` and `.axi-meter--busy` must pass.
- Consumes: `definedClasses` / `sources` from `docs/manifest/introspect.mjs` (existing).

- [ ] **Step 1: Write the failing layer-stack test**

Create `tests/layers.test.mjs`:

```js
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sources } from '../docs/manifest/introspect.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// The documented stack, read out of the table in RULES.md. A row is
// `| <name> | <n> | <what sits here> |`; the modal row says "top layer"
// rather than a number, because the browser puts a showModal()-ed dialog
// above every z-index there is, and writing a number there would be a lie.
export function documentedLayers(md = readFileSync(resolve(ROOT, 'docs/RULES.md'), 'utf8')) {
  const table = md.split('### Layer stack')[1] ?? ''
  return new Set([...table.matchAll(/^\|[^|]+\|\s*(\d+)\s*\|/gm)].map((m) => Number(m[1])))
}

// Every z-index a component actually declares. Negative values are excluded
// deliberately: .axi-sigil's `z-index: -1` sits inside its own `isolation`
// context and is a detail of one component's internals, not a page layer.
export function declaredLayers(css = sources()) {
  return new Set([...css.matchAll(/z-index:\s*(\d+)/g)].map((m) => Number(m[1])))
}

describe('the layer stack', () => {
  it('documents every z-index src/ declares', () => {
    const documented = documentedLayers()
    const undocumented = [...declaredLayers()].filter((z) => !documented.has(z))
    expect(undocumented).toEqual([])
  })

  it('declares no layer the stack does not name', () => {
    expect(documentedLayers().size).toBeGreaterThan(0)
  })

  // Both polarities: the parser must actually find numbers, or the gate
  // above passes by finding nothing on either side.
  it('reads a number out of a table row', () => {
    const md = '### Layer stack\n\n| Layer | z-index | What |\n|---|---|---|\n| Scrim | 50 | .axi-scrim |\n'
    expect(documentedLayers(md)).toEqual(new Set([50]))
  })

  it('ignores a negative z-index', () => {
    expect(declaredLayers('.a { z-index: -1; }')).toEqual(new Set())
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm test -- layers`
Expected: FAIL on "documents every z-index src/ declares" — `undocumented` contains `[40, 41, 50, 51, 99999]`, because `### Layer stack` does not exist yet.

- [ ] **Step 3: Document the stack in RULES.md**

Insert immediately after the `## Tokens` section's token lists and before `## Light mode`:

```markdown
### Layer stack

Every `z-index` in this language is one of the layers below, and a component
that needs to sit above something picks its layer here rather than inventing a
number. A number not in this table is a component shouting over the stack
instead of joining it.

| Layer | z-index | What sits here |
|---|---|---|
| Sticky chrome | 40 | `.axi-mast` |
| Popovers | 41 | `.axi-menu__pop`, `.axi-picker__pop` |
| Scrim | 50 | `.axi-scrim` |
| Drawer | 51 | `.axi-drawer` |
| Toasts | 60 | `.axi-toasts` |
| Tooltip | 70 | `.axi-tooltip` |
| Modal | top layer | `dialog.axi-modal`, promoted by `showModal()` |

The modal has no number on purpose. A `<dialog>` opened with `showModal()` is
promoted to the browser's top layer, which sits above every `z-index` there is;
writing a number in that row would describe a competition the modal is not in.

A negative `z-index` inside a component's own `isolation` context — the sigil's
backing shape — is not a layer and is not listed. It is invisible outside the
component that owns it.
```

- [ ] **Step 4: Bring the tooltip into the stack**

In `src/shells.css`, change line 134 from `z-index: 99999;` to `z-index: 70;` and replace the comment above it with:

```css
  /* Layer 70: above the drawer and its scrim, above toasts, below a
     showModal()-ed dialog's top layer - which it was below anyway, since the
     top layer is above every z-index. 99999 was not a layer, it was an
     argument with one. */
```

- [ ] **Step 5: Run the layer test and watch it pass**

Run: `npm test -- layers`
Expected: PASS (4 tests).

- [ ] **Step 6: Write the failing motion test**

Create `tests/motion.test.mjs`:

```js
import { describe, it, expect } from 'vitest'
import { sources } from '../docs/manifest/introspect.mjs'

// Rule 11: an indicator of work may animate only transform and opacity,
// because those are the two the compositor runs off the main thread. A
// keyframe that moves `width` or `left` freezes with the work it reports on,
// and a frozen spinner tells the reader the app crashed at the moment it was
// working hardest.
const COMPOSITED = new Set(['transform', 'opacity'])

export function illegalKeyframeProps(css) {
  const bad = new Set()
  for (const block of css.matchAll(/@keyframes\s+[\w-]+\s*\{([\s\S]*?\n\})\s*\}/g)) {
    for (const decl of block[1].matchAll(/([a-z-]+)\s*:/g)) {
      if (!COMPOSITED.has(decl[1])) bad.add(decl[1])
    }
  }
  return [...bad].sort()
}

describe('rule 11 - an indicator of work animates a composited property', () => {
  it('lets transform and opacity through', () => {
    expect(illegalKeyframeProps(
      '@keyframes a { from { transform: rotate(0); opacity: 0; } to { transform: rotate(1turn); opacity: 1; } }',
    )).toEqual([])
  })

  it('catches width, left and background-color', () => {
    expect(illegalKeyframeProps(
      '@keyframes a { from { width: 0; left: 0; } to { width: 100%; background-color: red; } }',
    )).toEqual(['background-color', 'left', 'width'])
  })

  it('holds for every keyframe block in src/', () => {
    expect(illegalKeyframeProps(sources())).toEqual([])
  })
})
```

- [ ] **Step 7: Run it and confirm all three pass**

Run: `npm test -- motion`
Expected: PASS (3 tests). The third passes vacuously today — `src/` contains no `@keyframes` yet — which is exactly why the first two exist: they prove the checker can tell legal from illegal before Task 5 gives it real input.

- [ ] **Step 8: Run the whole suite and rebuild**

Run: `npm test`
Expected: PASS, 147 tests (140 existing + 7 new).

Run: `npm run build`
Expected: `dist/axi.css` changes only in the tooltip's z-index and comment.

- [ ] **Step 9: Commit**

```bash
git add docs/RULES.md src/shells.css dist/axi.css tests/motion.test.mjs tests/layers.test.mjs
git commit -F - <<'MSG'
feat(rules): write the layer stack down and make rule 11 a gate

The stack was four scattered declarations and a tooltip at 99999, which is
not a layer but an argument with one. It comes down to 70 and joins the
table; nothing changes visually, because the top layer was always above it.

Rule 11 is the one rule RULES.md calls non-negotiable and the only one
nothing checked. The keyframe scan tests both polarities, so it cannot
pass by finding nothing.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
```

---

### Task 2: Form controls

**Files:**
- Create: `src/forms.css`
- Create: `docs/manifest/forms.mjs`
- Modify: `scripts/build.mjs:15` (`ORDER`)
- Modify: `docs/manifest/index.mjs` (register the `forms` layer)
- Modify: `docs/manifest/knobs.mjs` (three rows)
- Modify: `tests/manifest.test.mjs` is **not** modified — it reads `LAYERS` from the index.

**Interfaces:**
- Produces: `.axi-check`, `.axi-radio` (both read `--axi-check-size` and `--axi-check-fill`), `textarea.axi-input` (reads `--axi-textarea-h`). Task 4's modal example uses `.axi-check` in its body.
- Consumes: the `ORDER` array in `scripts/build.mjs`, the `LAYERS`/`BY_LAYER` pair in `docs/manifest/index.mjs`, the `KNOBS` array in `docs/manifest/knobs.mjs`.

- [ ] **Step 1: Write the failing form-layer tests**

Append to `tests/manifest.test.mjs` a new describe block at the end of the file:

`readFileSync` is already imported at the top of that file, and it is called there with a bare relative path (`readFileSync('README.md', 'utf8')` at line 155) because vitest runs with the project root as its working directory. Follow that convention — do **not** add a `ROOT`/`fileURLToPath` helper to this file.

```js
describe('the form layer', () => {
  const forms = readFileSync('src/forms.css', 'utf8')

  // Review Focus 3. appearance:none throws away the control the browser was
  // drawing, including its focus ring. base.css draws a page-wide
  // :focus-visible ring, so these inherit one - unless a rule here turns it
  // off, which is the single line that would make them unusable by keyboard.
  it('never turns the focus ring off', () => {
    expect(forms).not.toMatch(/outline:\s*(none|0)\b/)
  })

  // Review Focus 5. The mark sits on an accent fill, so it is drawn in the
  // ink meant for that - not in a text or surface token, which are for
  // things on the ground and would invert in light mode.
  it('draws the check mark in the accent ink', () => {
    const mark = forms.slice(forms.indexOf('.axi-check::after'))
    expect(mark).toMatch(/var\(--axi-accent-ink\)/)
  })

  it('shares one size and one fill knob between checkbox and radio', () => {
    expect(forms).toMatch(/--axi-check-size/)
    expect(forms).toMatch(/--axi-check-fill/)
    expect(forms).not.toMatch(/--axi-radio-(size|fill)/)
  })
})
```

No new imports are needed: `readFileSync` is already imported and `entries` is already in scope.

- [ ] **Step 2: Run it and watch it fail**

Run: `npm test -- manifest`
Expected: FAIL — `ENOENT: no such file or directory, open '.../src/forms.css'`.

- [ ] **Step 3: Write `src/forms.css`**

```css
/* axi design language - forms.
   Real inputs, styled. Every control here is an actual <input> or <textarea>
   with `appearance: none`, never a <div> wearing a class: a checkbox that is
   not an <input> does not submit with its form, does not toggle from the
   keyboard, and is not announced as a checkbox. The language styles controls;
   it does not reimplement them.

   Rule 3's flat case governs the geometry: a control inside a panel is
   outlined and carries no block, exactly as .axi-input and .axi-switch
   already are. Rule 5 governs the state: the fill is what says "on".

   The focus ring is deliberately absent from this file. base.css draws one
   page-wide on :focus-visible, and appearance: none does not remove it - it
   removes the browser's own. Adding `outline: none` anywhere here would make
   every control in it unusable by keyboard. */

/* ---------- checkbox and radio ---------- */
/* One box, two marks. --axi-radius is 0, so both are square and a round radio
   would be the only rounded shape in the language - the first place a flat
   outlined form starts looking like some other framework's. So they are told
   apart by their mark instead: the checkbox gets a check, the radio gets the
   family diamond (rule 7).

   Both read the same two knobs on purpose. A form holding checkboxes and
   radios together should not need two properties set to the same value to
   keep its controls the same size. */
.axi-check,
.axi-radio {
  appearance: none;
  -webkit-appearance: none;
  margin: 0;
  flex: none;
  width: var(--axi-check-size, 22px);
  height: var(--axi-check-size, 22px);
  display: inline-grid;
  place-items: center;
  background: var(--axi-ground);
  border: var(--axi-border-control) solid var(--axi-ink-line);
  border-radius: var(--axi-radius-sm);
  cursor: pointer;
}
/* The mark is always in the DOM and revealed with opacity rather than being
   created on :checked, so the box never changes size as it toggles. */
.axi-check::after {
  content: "";
  width: 55%;
  height: 30%;
  opacity: 0;
  border-left: var(--axi-border-control) solid var(--axi-accent-ink);
  border-bottom: var(--axi-border-control) solid var(--axi-accent-ink);
  transform: translateY(-12%) rotate(-45deg);
}
.axi-check:checked { background: var(--axi-check-fill, var(--axi-accent)); }
.axi-check:checked::after { opacity: 1; }
/* The radio's mark is the diamond itself, so it is drawn in the fill rather
   than on it - there is no filled box underneath it to sit on. */
.axi-radio::after {
  content: "";
  width: 46%;
  height: 46%;
  opacity: 0;
  background: var(--axi-check-fill, var(--axi-accent));
  transform: rotate(45deg);
}
.axi-radio:checked::after { opacity: 1; }
.axi-check:disabled,
.axi-radio:disabled { cursor: not-allowed; opacity: .5; }

/* ---------- textarea ---------- */
/* Not a component: the same .axi-input a single-line field uses, with the two
   things a <textarea> needs that an <input> does not. The font is restated
   because a textarea does not inherit the page font in any browser, and a
   form whose notes field is monospace while its name field is not is a bug
   nobody files and everybody sees.

   Resizing is vertical only. A textarea dragged wider than its field breaks
   the column its form is laid out in, and the reader who did it has no way
   to discover that the layout is not at fault. */
textarea.axi-input {
  min-height: var(--axi-textarea-h, 90px);
  resize: vertical;
  font-family: var(--axi-sans);
  line-height: 1.5;
}
```

- [ ] **Step 4: Add the two knob rows for the shared knobs**

In `docs/manifest/knobs.mjs`, insert after the `--axi-switch-knob` entry:

```js
  {
    name: '--axi-check-size',
    sets: 'the size of an `.axi-check` or `.axi-radio` box',
    fallback: '`22px`',
    example: '<input type="checkbox" class="axi-check" style="--axi-check-size: 16px">',
  },
  {
    name: '--axi-check-fill',
    sets: 'the fill a checked `.axi-check` takes, and the colour of a checked `.axi-radio`\'s diamond',
    fallback: '`var(--axi-accent)`',
    example: '<input type="checkbox" class="axi-check" style="--axi-check-fill: var(--axi-danger)">',
  },
  {
    name: '--axi-textarea-h',
    sets: 'the minimum height of a `<textarea class="axi-input">`',
    fallback: '`90px`',
    example: '<textarea class="axi-input" style="--axi-textarea-h: 200px">',
  },
```

- [ ] **Step 5: Add `forms.css` to the build order**

In `scripts/build.mjs:15`, change:

```js
export const ORDER = ['tokens.css', 'base.css', 'primitives.css', 'layout.css', 'shells.css', 'data.css', 'prose.css']
```

to:

```js
// forms.css follows primitives.css because `textarea.axi-input` restyles a
// primitive defined there, and a later file may restyle an earlier one.
export const ORDER = ['tokens.css', 'base.css', 'primitives.css', 'forms.css', 'layout.css', 'shells.css', 'data.css', 'prose.css']
```

- [ ] **Step 6: Create `docs/manifest/forms.mjs`**

```js
export default [
  {
    id: 'check',
    name: 'Checkbox and radio',
    layer: 'forms',
    classes: ['.axi-check', '.axi-radio'],
    summary: 'Real checkbox and radio inputs with the browser control painted out. They submit, tab and toggle with no script, because they are the control rather than a picture of one.',
    rules: [5, 7],
    knobs: ['--axi-check-size', '--axi-check-fill'],
    aliases: ['checkbox', 'toggle'],
    notes: `Both are square. \`--axi-radius\` is \`0\`, so a round radio would be
the only rounded shape in the language - they are told apart by their mark
instead, and the radio's is the family diamond. Set \`--axi-radius-sm\` and both
round together, along with every other control.

They share \`--axi-check-size\` and \`--axi-check-fill\` deliberately: a form
holding both should not need two properties set to the same value to keep its
controls even.

There is no focus style in \`forms.css\`. The page-wide \`:focus-visible\` ring in
\`base.css\` covers these, and \`appearance: none\` does not remove it.`,
    examples: [
      {
        title: 'A set of checkboxes',
        html: `<label class="axi-row"><input type="checkbox" class="axi-check" checked> Parsed</label>
<label class="axi-row"><input type="checkbox" class="axi-check"> Uploaded</label>
<label class="axi-row"><input type="checkbox" class="axi-check" disabled> Archived</label>`,
      },
      {
        title: 'A radio group',
        note: 'The mark is the diamond, which is what tells a radio from a checkbox at this radius',
        html: `<label class="axi-row"><input type="radio" name="cadence" class="axi-radio" checked> Daily</label>
<label class="axi-row"><input type="radio" name="cadence" class="axi-radio"> Weekly</label>`,
      },
      {
        title: 'A checkbox for something destructive',
        note: 'The fill is read through a fallback, so it can be set on the control or any ancestor',
        html: `<label class="axi-row"><input type="checkbox" class="axi-check" checked style="--axi-check-fill: var(--axi-danger)"> Delete the source file too</label>`,
      },
    ],
  },
  {
    id: 'textarea',
    name: 'Textarea',
    layer: 'forms',
    classes: [],
    summary: 'A multi-line field. Not its own component: the same .axi-input a single-line field uses, with a minimum height and vertical-only resizing.',
    rules: [3],
    knobs: ['--axi-textarea-h'],
    aliases: ['textarea', 'multiline'],
    notes: `Resizing is vertical only. A textarea dragged wider than its field
breaks the column its form is laid out in, and the reader who did it has no way
to tell that the layout is not at fault.

The font family is restated on the element because a \`<textarea>\` inherits the
browser's monospace default rather than the page font.`,
    examples: [
      {
        title: 'A notes field',
        html: `<textarea class="axi-input" placeholder="What happened on this pull?"></textarea>`,
      },
      {
        title: 'A taller one',
        html: `<textarea class="axi-input" style="--axi-textarea-h: 160px" placeholder="Paste the log header"></textarea>`,
      },
    ],
  },
]
```

**Note on `classes: []` for the textarea entry.** The manifest shape test asserts "lists at least one class and one example". The textarea defines no class of its own — it is a selector on an existing one — so this entry will fail that assertion. Do **not** weaken the shape test. Instead give the entry `classes: ['.axi-input']`, and the "never claims one class from two entries" test will then fail against the existing `input` entry in `primitives.mjs`. **The ruling:** fold the textarea into the existing `input` entry in `docs/manifest/primitives.mjs` rather than creating a second entry — add a third example showing the textarea, add `--axi-textarea-h` to that entry's `knobs`, and add `'textarea'` to its `aliases` in Task 6. Delete the `textarea` entry above. The `forms.mjs` file ships with the `check` entry only.

- [ ] **Step 7: Register the forms layer**

In `docs/manifest/index.mjs`: add `import forms from './forms.mjs'`, add `'forms'` to `LAYERS` immediately after `'primitives'`, and add `forms` to `BY_LAYER`.

Check `docs/site/shell.mjs` for a `LAYER_NAMES` map and add `forms: 'Forms'` to it — the sidebar and `search.json` both read the display name from there, and a missing key renders the raw layer id.

- [ ] **Step 8: Add the textarea to the existing input entry**

In `docs/manifest/primitives.mjs`, find the entry with `id: 'input'`. Add `'--axi-textarea-h'` to its `knobs` array and append this example:

```js
      {
        title: 'A multi-line field',
        note: 'Not a separate component - the same class, on a textarea. Resizing is vertical only, so a drag cannot break the form\'s column',
        html: `<textarea class="axi-input" style="--axi-textarea-h: 120px" placeholder="What happened on this pull?"></textarea>`,
      },
```

- [ ] **Step 9: Run the full suite**

Run: `npm test`
Expected: PASS. If the coverage gate reports `.axi-check` or `.axi-radio` undocumented, the `forms` layer is not registered in `index.mjs`. If it reports a knob undocumented, a `knobs.mjs` row is missing.

- [ ] **Step 10: Build and verify the generated artefacts**

Run: `npm run build`
Expected: console reports the knob table written with **29 knobs** (26 + 3). `dist/axi.css` gains `forms.css` between `primitives.css` and `layout.css`. `README.md`'s generated block gains three rows.

- [ ] **Step 11: Render the form controls and look at them**

Run: `AXI_BASE=/ node scripts/site.mjs` then open `_site/components/check/` in the SAI renderer with `path`, so the real CSS resolves.

Check with your eyes, not the markup: the check mark is centred and not clipped; the radio's diamond is centred; the disabled control is visibly disabled; the three examples do not overflow their demo panels. Round one shipped a broken menu example past three reviews that all read the markup and none of which looked at it.

- [ ] **Step 12: Commit**

```bash
git add src/forms.css docs/manifest/forms.mjs docs/manifest/index.mjs docs/manifest/knobs.mjs docs/manifest/primitives.mjs docs/site/shell.mjs scripts/build.mjs tests/manifest.test.mjs dist/axi.css README.md
git commit -F - <<'MSG'
feat(forms): checkbox, radio and textarea

Real inputs with appearance: none, so they submit, tab and toggle without
a line of script. Both boxes are square because --axi-radius is 0 and a
round radio would be the only rounded shape in the language; the radio is
told apart by its mark being the family diamond instead.

The textarea is not a component. It is the same .axi-input on a different
element, so it folds into that entry rather than claiming a class it does
not define.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
```

---

### Task 3: Navigation — breadcrumb, pagination, avatar

**Files:**
- Modify: `src/shells.css` (append `.axi-crumbs` and `.axi-pages`)
- Modify: `src/primitives.css` (append `.axi-avatar`)
- Modify: `docs/manifest/shells.mjs`, `docs/manifest/primitives.mjs`
- Modify: `docs/manifest/knobs.mjs` (one row)

**Interfaces:**
- Consumes: nothing from Task 2.
- Produces: `.axi-avatar` (reads `--axi-avatar-size`), used by Task 4's toast example.

- [ ] **Step 1: Append the navigation CSS to `src/shells.css`**

```css
/* ---------- breadcrumbs ---------- */
/* A path, not a control strip. The separator is the family diamond (rule 7)
   drawn in the rule ink, so it reads as punctuation rather than as a third
   link the reader could click.
   The current crumb is NOT filled. Rule 5 reserves a fill for a state
   something is in - pressed, on, current-as-in-selected - and the last crumb
   is a position, not a control that is on. It takes the full text ink and the
   label weight instead. */
.axi-crumbs {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font: var(--axi-t-small);
}
.axi-crumbs a { color: var(--axi-text-dim); text-decoration: none; }
.axi-crumbs a:hover { color: var(--axi-accent); }
.axi-crumbs__sep {
  width: 6px; height: 6px; flex: none;
  background: var(--axi-rule);
  transform: rotate(45deg);
}
.axi-crumbs [aria-current="page"] { color: var(--axi-text); font-weight: 800; }

/* ---------- pagination ---------- */
/* The same idea .axi-tabs already expresses, applied to a row of pages: the
   current one is filled and blocked, because "this one is on" is what a fill
   means here. Written as its own component rather than as a tabs modifier
   because a pager sits under content and a tab strip sits in a titlebar, and
   the two disagree about everything except that treatment. */
.axi-pages { display: flex; gap: 7px; align-items: center; flex-wrap: wrap; }
.axi-pages__n {
  min-width: 36px;
  padding: 8px 10px;
  text-align: center;
  font: var(--axi-t-label);
  letter-spacing: var(--axi-ls-label);
  color: var(--axi-text-dim);
  text-decoration: none;
  background: var(--axi-surface-raised);
  border: var(--axi-border-control) solid var(--axi-ink-line);
  border-radius: var(--axi-radius-sm);
}
.axi-pages__n:hover { color: var(--axi-text); }
.axi-pages__n[aria-current="page"] {
  background: var(--axi-accent);
  color: var(--axi-accent-ink);
  box-shadow: var(--axi-offset-control) var(--axi-offset-control) 0 var(--axi-ink-line);
}
/* The elided run between two page numbers. Not a control and never focusable:
   it is the only thing in the row a reader cannot go to. */
.axi-pages__gap { color: var(--axi-text-faint); padding: 0 2px; }
```

- [ ] **Step 2: Append the avatar to `src/primitives.css`**

```css
/* ---------- avatar ---------- */
/* A square, because a circle is the one shape this language does not have:
   --axi-radius is 0, and a round avatar would be the only rounded thing on
   the page. It follows the radius scale like everything else, so a consumer
   who wants round avatars sets --axi-radius-sm and gets rounded controls
   everywhere - which is the honest version of the request.
   Flat: outlined, no block. An avatar is content inside a panel, the same as
   .axi-stat and .axi-table__rank, not a thing raised off it. */
.axi-avatar {
  width: var(--axi-avatar-size, 40px);
  height: var(--axi-avatar-size, 40px);
  flex: none;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: var(--axi-ground);
  color: var(--axi-text-dim);
  border: var(--axi-border-control) solid var(--axi-ink-line);
  border-radius: var(--axi-radius-sm);
  font: var(--axi-t-label);
  letter-spacing: var(--axi-ls-label);
  text-transform: uppercase;
}
.axi-avatar--accent { background: var(--axi-accent); color: var(--axi-accent-ink); }
/* object-fit rather than a background-image, so the <img>'s alt text survives
   and a broken source is visible rather than silently blank. */
.axi-avatar__img { width: 100%; height: 100%; object-fit: cover; display: block; }
```

- [ ] **Step 3: Add the avatar knob**

In `docs/manifest/knobs.mjs`, after the `--axi-textarea-h` row:

```js
  {
    name: '--axi-avatar-size',
    sets: 'the size of an `.axi-avatar` square',
    fallback: '`40px`',
    example: '<span class="axi-avatar" style="--axi-avatar-size: 28px">MS</span>',
  },
```

- [ ] **Step 4: Add the three manifest entries**

Append to `docs/manifest/shells.mjs`:

```js
  {
    id: 'crumbs',
    name: 'Breadcrumbs',
    layer: 'shells',
    classes: ['.axi-crumbs', '.axi-crumbs__sep'],
    summary: 'The path to the page you are on. The separator is the family diamond, and the last crumb is marked with aria-current rather than filled.',
    rules: [7],
    knobs: [],
    aliases: ['breadcrumb', 'breadcrumbs'],
    notes: `The current crumb is not filled. Rule 5 reserves a fill for a state
a thing is in, and the last crumb is a position rather than a control that is
on - so it takes the full text ink and the label weight instead.`,
    examples: [
      {
        title: 'A three-level path',
        html: `<nav class="axi-crumbs" aria-label="Breadcrumb">
  <a href="#">Raids</a>
  <i class="axi-crumbs__sep"></i>
  <a href="#">Wing 4</a>
  <i class="axi-crumbs__sep"></i>
  <span aria-current="page">Deimos</span>
</nav>`,
      },
      {
        title: 'One level up',
        html: `<nav class="axi-crumbs" aria-label="Breadcrumb">
  <a href="#">Logs</a>
  <i class="axi-crumbs__sep"></i>
  <span aria-current="page">2026-09-24</span>
</nav>`,
      },
    ],
  },
  {
    id: 'pages',
    name: 'Pagination',
    layer: 'shells',
    classes: ['.axi-pages', '.axi-pages__n', '.axi-pages__gap'],
    summary: 'A row of page links. The current page is filled and blocked, the same treatment the current tab gets, because it is the same idea: this one is on.',
    rules: [5],
    knobs: [],
    aliases: ['pagination', 'pager', 'paging'],
    notes: `\`.axi-pages__gap\` is the elided run between two page numbers. It is
the only thing in the row that is not a link, and it is never focusable.

Mark the current page with \`aria-current="page"\`, which is what draws the fill
- there is no \`--current\` modifier class to keep in sync with it.`,
    examples: [
      {
        title: 'A long run with an elision',
        html: `<nav class="axi-pages" aria-label="Pagination">
  <a class="axi-pages__n" href="#" aria-label="Previous">‹</a>
  <a class="axi-pages__n" href="#">1</a>
  <a class="axi-pages__n" href="#" aria-current="page">2</a>
  <a class="axi-pages__n" href="#">3</a>
  <span class="axi-pages__gap">…</span>
  <a class="axi-pages__n" href="#">9</a>
  <a class="axi-pages__n" href="#" aria-label="Next">›</a>
</nav>`,
      },
      {
        title: 'A short run',
        html: `<nav class="axi-pages" aria-label="Pagination">
  <a class="axi-pages__n" href="#" aria-current="page">1</a>
  <a class="axi-pages__n" href="#">2</a>
  <a class="axi-pages__n" href="#">3</a>
</nav>`,
      },
    ],
  },
```

Append to `docs/manifest/primitives.mjs`:

```js
  {
    id: 'avatar',
    name: 'Avatar',
    layer: 'primitives',
    classes: ['.axi-avatar', '.axi-avatar--accent', '.axi-avatar__img'],
    summary: 'A square holding initials or a picture. Square because a circle is the one shape this language does not have.',
    rules: [3],
    knobs: ['--axi-avatar-size'],
    aliases: ['gravatar', 'profile', 'userpic'],
    notes: `It follows the radius scale like everything else, so setting
\`--axi-radius-sm\` rounds avatars along with every other control - which is the
honest version of "can the avatars be round".

\`.axi-avatar__img\` uses \`object-fit\` on a real \`<img>\` rather than a background
image, so the alt text survives and a broken source is visible instead of
silently blank.`,
    examples: [
      {
        title: 'Initials',
        html: `<span class="axi-avatar">MS</span>
<span class="axi-avatar axi-avatar--accent">KJ</span>`,
      },
      {
        title: 'A picture',
        html: `<span class="axi-avatar"><img class="axi-avatar__img" src="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2740%27 height=%2740%27%3E%3Crect width=%2740%27 height=%2740%27 fill=%27%23ffc53d%27/%3E%3C/svg%3E" alt="Avatar"></span>`,
      },
      {
        title: 'In a row, at two sizes',
        html: `<div class="axi-row">
  <span class="axi-avatar" style="--axi-avatar-size: 28px">AR</span>
  <span class="axi-avatar">AR</span>
</div>`,
      },
    ],
  },
```

- [ ] **Step 5: Run the suite**

Run: `npm test`
Expected: PASS. A failure naming `.axi-crumbs__sep` in "uses only classes src/ defines inside example markup" means the CSS append in Step 1 did not land.

- [ ] **Step 6: Build**

Run: `npm run build`
Expected: knob table written with **30 knobs**.

- [ ] **Step 7: Render all three and look at them**

Run: `AXI_BASE=/ node scripts/site.mjs`, then render `_site/components/crumbs/`, `_site/components/pages/` and `_site/components/avatar/`.

Check: the separator diamond is vertically centred against the text baseline (a rotated square often is not); the pagination's current page block does not clip against the next item's border; the avatar image fills its square without letterboxing; the two-size avatar row is bottom-aligned, not stretched.

- [ ] **Step 8: Commit**

```bash
git add src/shells.css src/primitives.css docs/manifest/shells.mjs docs/manifest/primitives.mjs docs/manifest/knobs.mjs dist/axi.css README.md
git commit -F - <<'MSG'
feat(nav): breadcrumbs, pagination and the avatar

Pagination is .axi-tabs' "this one is on" applied to a row of pages, so it
reuses the treatment rather than inventing a second one. The breadcrumb's
last item is deliberately not filled: rule 5 reserves a fill for a state,
and the end of a path is a position.

The avatar is square. A circle is the one shape this language does not
have, and it follows the radius scale like everything else.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
```

---

### Task 4: Overlays — modal, accordion, toast

**Files:**
- Modify: `src/shells.css` (append)
- Modify: `docs/manifest/shells.mjs`
- Modify: `docs/manifest/knobs.mjs` (one row)
- Modify: `tests/layers.test.mjs` is **not** modified — it reads the table Task 1 wrote, which already lists 60.

**Interfaces:**
- Consumes: the layer table from Task 1 (`.axi-toasts` takes `z-index: 60`); `.axi-avatar` from Task 3 and `.axi-check` from Task 2, both used in examples.
- Produces: `.axi-modal` (reads `--axi-modal-width`).

- [ ] **Step 1: Write the failing pointer-events test**

Append to `tests/manifest.test.mjs`:

```js
describe('the toast region', () => {
  const shells = readFileSync('src/shells.css', 'utf8')
  const region = shells.slice(shells.indexOf('.axi-toasts {'), shells.indexOf('.axi-toast {'))

  // Review Focus 4. The region is fixed and full-height, so an empty one
  // would sit invisibly over the page and eat every click aimed at what is
  // underneath it. The region is a layout box, not a surface.
  it('lets clicks through when it is empty', () => {
    expect(region).toMatch(/pointer-events:\s*none/)
  })

  it('takes clicks on the toasts themselves', () => {
    const toast = shells.slice(shells.indexOf('.axi-toast {'))
    expect(toast).toMatch(/pointer-events:\s*auto/)
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm test -- manifest`
Expected: FAIL — `indexOf` returns `-1`, so `region` is the whole file sliced oddly and the match fails. (If it passes, `.axi-toasts` already exists and Step 3 has been run out of order.)

- [ ] **Step 3: Append the overlay CSS to `src/shells.css`**

```css
/* ---------- modal ---------- */
/* A real <dialog>. Focus trapping, Esc-to-close, inertness for everything
   behind it and promotion to the top layer all come from the browser, and
   none of them can be had from CSS - so the alternative was a <div> plus a
   focus trap this language has no script to write.
   That choice has one visible cost, and it is named here rather than left to
   be discovered: a <dialog> brings its own ::backdrop, so the modal styles
   that instead of reusing .axi-scrim. The two look identical and are not the
   same element. Reusing .axi-scrim would have meant giving up <dialog>.
   Panel weight and panel block: it is the most raised thing on the page. */
.axi-modal {
  padding: 0;
  max-width: min(var(--axi-modal-width, 560px), calc(100vw - 32px));
  background: var(--axi-surface);
  color: var(--axi-text);
  border: var(--axi-border-panel) solid var(--axi-ink-line);
  border-radius: var(--axi-radius);
  box-shadow: var(--axi-offset-panel) var(--axi-offset-panel) 0 var(--axi-ink-line);
}
.axi-modal::backdrop { background: var(--axi-scrim); }
/* The head and foot are divided from the body by rules, not by outlines: they
   are parts of one raised thing, and rule 8's reading applies - a line inside
   a raised surface separates its parts, it does not raise them. */
.axi-modal__head {
  display: flex; align-items: center; gap: 12px;
  padding: 15px 18px;
  border-bottom: var(--axi-border-control) solid var(--axi-rule);
}
.axi-modal__head h2 { font: var(--axi-t-h3); letter-spacing: var(--axi-ls-h3); margin: 0; }
.axi-modal__body { padding: 18px; font: var(--axi-t-small); color: var(--axi-text-dim); }
.axi-modal__foot {
  display: flex; justify-content: flex-end; gap: 9px;
  padding: 15px 18px;
  border-top: var(--axi-border-control) solid var(--axi-rule);
}

/* ---------- accordion ---------- */
/* <details>/<summary>, so it opens and closes with no script and is
   announced as a disclosure. The native marker is removed and replaced with
   the family diamond, which rotates a quarter turn on [open] - a transform,
   so it is inside rule 4's rationing without needing rule 11. */
.axi-accordion {
  background: var(--axi-surface);
  border: var(--axi-border-panel) solid var(--axi-ink-line);
  border-radius: var(--axi-radius);
  box-shadow: var(--axi-offset-panel) var(--axi-offset-panel) 0 var(--axi-ink-line);
}
/* Stacked accordions need the gap the block occupies, or each one's block
   lands on the next one's outline. */
.axi-accordion + .axi-accordion { margin-top: calc(var(--axi-offset-panel) + 8px); }
.axi-accordion__head {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 18px;
  cursor: pointer;
  list-style: none;
  font: var(--axi-t-label);
  letter-spacing: var(--axi-ls-label);
  color: var(--axi-text);
}
.axi-accordion__head::-webkit-details-marker { display: none; }
.axi-accordion__head::before {
  content: "";
  width: 8px; height: 8px; flex: none;
  background: var(--axi-accent);
  transform: rotate(45deg);
  transition: transform .12s;
}
.axi-accordion[open] .axi-accordion__head::before { transform: rotate(180deg); }
.axi-accordion__body {
  padding: 0 18px 16px 38px;
  font: var(--axi-t-small);
  color: var(--axi-text-dim);
}

/* ---------- toasts ---------- */
/* Layer 60, between the drawer and the tooltip.
   The region is a layout box and nothing else: it is fixed and full-height,
   so without pointer-events: none an empty one would sit invisibly over the
   page and swallow every click aimed at what is underneath. The toasts
   themselves take their events back.
   This language ships no script, so appearing, stacking and leaving on a
   timer are the consumer's: insert a .axi-toast into the region and remove it
   when it is done. That is the same contract .axi-menu already publishes for
   its open state, not a new kind of promise. */
.axi-toasts {
  position: fixed;
  right: var(--axi-gutter);
  bottom: var(--axi-gutter);
  z-index: 60;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: calc(var(--axi-offset-control) + 9px);
  pointer-events: none;
}
/* Control weight and control block, not panel: a stack of four panels over
   the page is a wall. A toast is a chip-sized raised thing. */
.axi-toast {
  pointer-events: auto;
  display: flex; align-items: center; gap: 12px;
  padding: 12px 15px;
  background: var(--axi-surface-raised);
  border: var(--axi-border-control) solid var(--axi-ink-line);
  border-radius: var(--axi-radius-sm);
  box-shadow: var(--axi-offset-control) var(--axi-offset-control) 0 var(--axi-ink-line);
  font: var(--axi-t-small);
  color: var(--axi-text);
}
.axi-toast__dot {
  width: 10px; height: 10px; flex: none;
  background: var(--axi-accent);
  transform: rotate(45deg);
}
.axi-toast--ok .axi-toast__dot { background: var(--axi-ok); }
.axi-toast--warn .axi-toast__dot { background: var(--axi-warn); }
.axi-toast--danger .axi-toast__dot { background: var(--axi-danger); }
```

- [ ] **Step 4: Add the modal knob**

In `docs/manifest/knobs.mjs`, after `--axi-avatar-size`:

```js
  {
    name: '--axi-modal-width',
    sets: 'the maximum width of an `.axi-modal`, before the viewport clamp',
    fallback: '`560px`',
    example: '<dialog class="axi-modal" style="--axi-modal-width: 760px">',
  },
```

- [ ] **Step 5: Add the three manifest entries**

Append to `docs/manifest/shells.mjs`. **The modal example is the one to get right** — round one shipped a menu example whose popover escaped its demo panel past three reviews:

```js
  {
    id: 'modal',
    name: 'Modal',
    layer: 'shells',
    classes: ['.axi-modal', '.axi-modal__head', '.axi-modal__body', '.axi-modal__foot'],
    summary: 'A real <dialog>. Focus trapping, Esc-to-close, inertness and the top layer come from the browser rather than from a script this language does not ship.',
    rules: [3],
    knobs: ['--axi-modal-width'],
    aliases: ['dialog', 'popup', 'lightbox'],
    notes: `Open it with \`el.showModal()\`, not by setting the \`open\` attribute.
Only \`showModal()\` promotes the dialog to the top layer, makes the rest of the
page inert and draws the backdrop; the bare attribute renders it inline with
none of that, which is what the examples below do so they can sit in the page.

A \`<dialog>\` brings its own \`::backdrop\`, so the modal styles that rather than
reusing \`.axi-scrim\`. They look identical and are not the same element - the
alternative was giving up \`<dialog>\` and hand-rolling a focus trap.

The head and foot are divided from the body by rules rather than outlines:
they are parts of one raised thing.`,
    examples: [
      {
        title: 'A confirmation',
        note: 'Shown inline with the open attribute so it sits in the page; a real one is opened with showModal() and draws a backdrop over everything',
        html: `<dialog class="axi-modal" open style="position: static; margin: 0">
  <div class="axi-modal__head">
    <span class="axi-diamond axi-diamond--danger"></span>
    <h2>Delete this log?</h2>
  </div>
  <div class="axi-modal__body">This removes the parsed encounter and its shareable link. The file on disk is untouched.</div>
  <div class="axi-modal__foot">
    <button class="axi-btn axi-btn--ghost">Cancel</button>
    <button class="axi-btn axi-btn--primary">Delete</button>
  </div>
</dialog>`,
      },
      {
        title: 'A wider one, with a form in it',
        note: 'The width knob is clamped against the viewport, so a wide modal still fits a narrow window',
        html: `<dialog class="axi-modal" open style="position: static; margin: 0; --axi-modal-width: 680px">
  <div class="axi-modal__head"><h2>Upload settings</h2></div>
  <div class="axi-modal__body">
    <label class="axi-row"><input type="checkbox" class="axi-check" checked> Parse on upload</label>
    <label class="axi-row"><input type="checkbox" class="axi-check"> Make the link public</label>
  </div>
  <div class="axi-modal__foot"><button class="axi-btn axi-btn--primary">Save</button></div>
</dialog>`,
      },
    ],
  },
  {
    id: 'accordion',
    name: 'Accordion',
    layer: 'shells',
    classes: ['.axi-accordion', '.axi-accordion__head', '.axi-accordion__body'],
    summary: 'A disclosure built on <details> and <summary>, so it opens and closes with no script and is announced as a disclosure.',
    rules: [3, 7],
    knobs: [],
    aliases: ['collapse', 'disclosure', 'expander'],
    notes: `The native marker is removed and replaced with the family diamond,
which turns a quarter on \`[open]\`. The turn is a \`transform\`, so it sits inside
rule 4's rationing of motion.

Stacked accordions are spaced by the block's own depth plus a gap, or each
one's block lands on the next one's outline.`,
    examples: [
      {
        title: 'A short FAQ',
        note: 'The first is open; open is a native attribute, not a class',
        html: `<details class="axi-accordion" open>
  <summary class="axi-accordion__head">What counts as an attempt?</summary>
  <div class="axi-accordion__body">Any pull with at least one damage event, whether or not the boss reached a phase change.</div>
</details>
<details class="axi-accordion">
  <summary class="axi-accordion__head">Why is my DPS different here?</summary>
  <div class="axi-accordion__body">Target damage only, measured over the active window rather than the whole pull.</div>
</details>`,
      },
      {
        title: 'One on its own',
        html: `<details class="axi-accordion">
  <summary class="axi-accordion__head">Advanced parser options</summary>
  <div class="axi-accordion__body">Everything here changes how a log is read, not how it is displayed.</div>
</details>`,
      },
    ],
  },
  {
    id: 'toast',
    name: 'Toast',
    layer: 'shells',
    classes: ['.axi-toasts', '.axi-toast', '.axi-toast__dot', '.axi-toast--ok', '.axi-toast--warn', '.axi-toast--danger'],
    summary: 'A stack of transient messages in the corner of the page. The CSS ships the region and the message; appearing and leaving on a timer are the consumer’s, because this language ships no script.',
    rules: [3, 5],
    knobs: [],
    aliases: ['snackbar', 'notification', 'flash'],
    notes: `Insert a \`.axi-toast\` into the region and remove it when it is done.
There is no timer here and no animation: that is the same contract \`.axi-menu\`
publishes for its open state, not a new kind of promise.

The region is \`pointer-events: none\` and each toast takes its events back. The
region is fixed and full-height, so without that an empty one would sit
invisibly over the page and swallow every click aimed underneath it.

A toast is control weight, not panel: four panels stacked over the page is a
wall.

The region lives at layer 60 - above the drawer, below the tooltip. See the
layer stack in the rules.`,
    examples: [
      {
        title: 'A stack of three',
        note: 'Shown in flow rather than fixed to the corner, so the demo can hold it',
        html: `<div class="axi-toasts" style="position: static">
  <div class="axi-toast"><i class="axi-toast__dot"></i> Link copied to clipboard</div>
  <div class="axi-toast axi-toast--ok"><i class="axi-toast__dot"></i> Upload finished — 3 logs parsed</div>
  <div class="axi-toast axi-toast--danger"><i class="axi-toast__dot"></i> Could not reach the server</div>
</div>`,
      },
      {
        title: 'One with a name on it',
        html: `<div class="axi-toasts" style="position: static">
  <div class="axi-toast axi-toast--warn">
    <span class="axi-avatar" style="--axi-avatar-size: 24px">KJ</span>
    Kay left the squad
  </div>
</div>`,
      },
    ],
  },
```

- [ ] **Step 6: Run the suite**

Run: `npm test`
Expected: PASS, including `tests/layers.test.mjs` — `60` is already in the table Task 1 wrote. If layers fails, the table is missing the Toasts row.

- [ ] **Step 7: Build**

Run: `npm run build`
Expected: knob table written with **31 knobs**.

- [ ] **Step 8: Render all three and look at them**

Run: `AXI_BASE=/ node scripts/site.mjs`, then render `_site/components/modal/`, `_site/components/accordion/` and `_site/components/toast/`.

Check, and this is the step round one's failure was hiding in: **no example escapes its demo panel or covers the code block beneath it.** The `position: static` overrides on the dialog and the toast region are what keep them in flow — confirm they actually do. Also confirm the accordion's diamond visibly changes orientation between the open and closed items, and that stacked accordions do not overlap each other's blocks.

- [ ] **Step 9: Commit**

```bash
git add src/shells.css docs/manifest/shells.mjs docs/manifest/knobs.mjs tests/manifest.test.mjs dist/axi.css README.md
git commit -F - <<'MSG'
feat(overlays): modal, accordion and toast

The modal is a real <dialog> and the accordion is <details>, so focus
trapping, Esc, inertness and open/close all come from the browser instead
of from a script this language does not ship. The cost is named in the
CSS: <dialog> brings its own ::backdrop, so the modal styles that rather
than reusing .axi-scrim.

Toast is the exception and does not break the rule - the CSS ships the
region and the message, and the lifecycle is the consumer's, exactly as
.axi-menu's open state already is. The region is pointer-events: none so
an empty one does not swallow clicks aimed at the page under it.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
```

---

### Task 5: Feedback — spinner, busy meter, notice variants

**Files:**
- Create: `src/feedback.css`
- Create: `docs/manifest/feedback.mjs`
- Modify: `scripts/build.mjs:15` (`ORDER` gains `feedback.css`)
- Modify: `docs/manifest/index.mjs` (register the `feedback` layer)
- Modify: `docs/manifest/knobs.mjs` (one row)
- Modify: `docs/site/shell.mjs` (`LAYER_NAMES`)
- Modify: `docs/manifest/shells.mjs` (the existing `notice` entry gains the variants)

**Interfaces:**
- Consumes: the `@keyframes` gate from Task 1 — this is the first task that gives it real input.
- Produces: `.axi-spinner` (reads `--axi-spinner-size`), `.axi-meter--busy`, `.axi-notice--ok|--warn|--danger`.

- [ ] **Step 1: Write the failing reduced-motion test**

Create `tests/feedback.test.mjs`:

```js
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const css = readFileSync(resolve(ROOT, "src/feedback.css"), "utf8")

describe('the busy meter under reduced motion', () => {
  // Review Focus 1. base.css forces `animation-duration: .01ms` and
  // `animation-iteration-count: 1` under prefers-reduced-motion, which parks
  // an animation at its END state. The busy meter's end state is the fill
  // translated clean off the track - so a reader who turns motion off would
  // be shown a progress bar that displays nothing at all.
  it('parks the fill somewhere visible', () => {
    const block = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'))
    expect(block).toMatch(/\.axi-meter--busy/)
    expect(block).toMatch(/transform:\s*none/)
  })

  it('never animates width', () => {
    const frames = css.slice(css.indexOf('@keyframes axi-meter-busy'))
    expect(frames.slice(0, frames.indexOf('}\n}'))).not.toMatch(/width:/)
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm test -- feedback`
Expected: FAIL — `ENOENT` on `src/feedback.css`.

- [ ] **Step 3: Write `src/feedback.css`**

```css
/* axi design language - feedback.
   Things that report on work, and things that report on how work went. Rule
   11 governs the first kind and is the one rule in this language described as
   non-negotiable: an indicator of work may animate only `transform` and
   `opacity`, because those are the two the compositor runs off the main
   thread. A spinner animated by layout freezes with the work it reports on,
   and a frozen spinner tells the reader the app crashed at the exact moment
   it was working hardest. tests/motion.test.mjs enforces it. */

/* ---------- spinner ---------- */
/* The family motif, turning. A square rotated 45deg is the diamond, so the
   loop runs 45deg -> 405deg: one full turn that begins and ends on the
   motif rather than on a square.
   That start and end also make it correct under reduced motion for free.
   base.css collapses every animation to one .01ms iteration, which parks it
   at 405deg - visually identical to the 45deg it started at. */
@keyframes axi-spin { from { transform: rotate(45deg); } to { transform: rotate(405deg); } }
.axi-spinner {
  display: inline-block;
  flex: none;
  width: var(--axi-spinner-size, 20px);
  height: var(--axi-spinner-size, 20px);
  border: var(--axi-border-control) solid var(--axi-accent);
  border-radius: var(--axi-radius-sm);
  transform: rotate(45deg);
  animation: axi-spin 1.1s linear infinite;
}

/* ---------- indeterminate meter ---------- */
/* The .axi-meter that does not know how far along it is. The fill keeps a
   fixed width and travels; `width` is never animated, which is the whole of
   rule 11. --axi-meter-v is ignored in this mode - there is no value to
   express, which is what indeterminate means. */
@keyframes axi-meter-busy {
  from { transform: translateX(-100%); }
  to { transform: translateX(400%); }
}
.axi-meter--busy .axi-meter__fill {
  width: 25%;
  animation: axi-meter-busy 1.3s ease-in-out infinite;
}
/* Unlike the spinner, this one's end state is not its start state: base.css
   would park the fill clean off the right-hand end of the track, and a reader
   who turns motion off would be shown an empty bar. So it is parked
   deliberately, at rest and in view - a bar that says "working, and not
   telling you how far" without moving. */
@media (prefers-reduced-motion: reduce) {
  .axi-meter--busy .axi-meter__fill { transform: none; width: 100%; }
}

/* ---------- notice status ---------- */
/* Rule 5: the icon is the part of a notice that asserts something, so the
   status lives there. The body text stays in the reading ink at every status
   - a whole paragraph in the danger ink is the tinted-everything failure rule
   2 exists to prevent, and it is unreadable besides. */
.axi-notice--ok .axi-notice__icon { background: var(--axi-ok); }
.axi-notice--warn .axi-notice__icon { background: var(--axi-warn); }
.axi-notice--danger .axi-notice__icon { background: var(--axi-danger); }
.axi-notice--ok b { color: var(--axi-ok); }
.axi-notice--warn b { color: var(--axi-warn); }
.axi-notice--danger b { color: var(--axi-danger); }
```

- [ ] **Step 4: Add `feedback.css` to the build order**

In `scripts/build.mjs:15`, `ORDER` becomes:

```js
// forms.css follows primitives.css because `textarea.axi-input` restyles a
// primitive defined there; feedback.css follows data.css because
// `.axi-meter--busy` modifies a data component. A later file may restyle an
// earlier one, never the reverse.
export const ORDER = ['tokens.css', 'base.css', 'primitives.css', 'forms.css', 'layout.css', 'shells.css', 'data.css', 'feedback.css', 'prose.css']
```

- [ ] **Step 5: Add the spinner knob**

```js
  {
    name: '--axi-spinner-size',
    sets: 'the size of an `.axi-spinner`',
    fallback: '`20px`',
    example: '<span class="axi-spinner" style="--axi-spinner-size: 34px"></span>',
  },
```

- [ ] **Step 6: Create `docs/manifest/feedback.mjs`**

```js
export default [
  {
    id: 'spinner',
    name: 'Spinner',
    layer: 'feedback',
    classes: ['.axi-spinner'],
    summary: 'The family diamond, turning. It animates transform only, so it keeps moving when the main thread is blocked by the work it is reporting on.',
    rules: [7, 11],
    knobs: ['--axi-spinner-size'],
    aliases: ['loader', 'loading', 'busy', 'progress'],
    notes: `Rule 11 is why this is a rotation and not a growing bar. A spinner
animated by layout or paint freezes with the work it reports on, and a frozen
spinner tells the reader the app has crashed at the exact moment it is working
hardest.

The loop runs \`45deg\` to \`405deg\` - one full turn that starts and ends on the
motif. That also makes it correct under \`prefers-reduced-motion\` for free:
\`base.css\` collapses the animation to a single instant iteration, parking it at
405deg, which looks exactly like the 45deg it started at.`,
    examples: [
      {
        title: 'Beside a label',
        html: `<div class="axi-row"><span class="axi-spinner"></span> Parsing…</div>`,
      },
      {
        title: 'Larger, on its own',
        html: `<span class="axi-spinner" style="--axi-spinner-size: 34px"></span>`,
      },
    ],
  },
  {
    id: 'meter-busy',
    name: 'Indeterminate meter',
    layer: 'feedback',
    classes: ['.axi-meter--busy'],
    summary: 'The meter that does not know how far along it is. The fill keeps a fixed width and travels, because rule 11 forbids animating width.',
    rules: [9, 11],
    knobs: [],
    aliases: ['progress', 'progressbar', 'indeterminate', 'loading'],
    notes: `\`--axi-meter-v\` is ignored in this mode. There is no value to
express, which is what indeterminate means - use a plain \`.axi-meter\` the moment
you know the proportion.

Under \`prefers-reduced-motion\` the fill parks full and still. Without that it
would park where the animation ends, which is clean off the right-hand end of
the track: a reader who turns motion off would be shown an empty bar.`,
    examples: [
      {
        title: 'Working, with no idea how far',
        html: `<div class="axi-meter axi-meter--busy"><div class="axi-meter__fill"></div></div>`,
      },
      {
        title: 'Beside the determinate meter it becomes',
        note: 'The same component; the busy one simply has no value yet',
        html: `<div class="axi-stack">
  <div class="axi-meter axi-meter--busy"><div class="axi-meter__fill"></div></div>
  <div class="axi-meter"><div class="axi-meter__fill" style="--axi-meter-v: 62%"></div></div>
</div>`,
      },
    ],
  },
]
```

- [ ] **Step 7: Register the feedback layer**

In `docs/manifest/index.mjs`: import it, add `'feedback'` to `LAYERS` after `'data'`, add it to `BY_LAYER`. In `docs/site/shell.mjs`, add `feedback: 'Feedback'` to `LAYER_NAMES`.

- [ ] **Step 8: Add the status variants to the existing notice entry**

In `docs/manifest/shells.mjs`, find the entry with `id: 'notice'`. Add `'.axi-notice--ok'`, `'.axi-notice--warn'` and `'.axi-notice--danger'` to its `classes`, add `'alert'` and `'banner'` to `aliases` (Task 6 adds the field; if it does not exist yet, add it here and Task 6 will find it), and append:

```js
      {
        title: 'The three statuses',
        note: 'Rule 5: the icon is the part that asserts, so the status lives there and the paragraph stays in the reading ink',
        html: `<div class="axi-notice axi-notice--ok">
  <div class="axi-notice__icon">✓</div>
  <p><b>Parsed.</b> All 14 encounters matched a known boss.</p>
</div>
<div class="axi-notice axi-notice--warn">
  <div class="axi-notice__icon">!</div>
  <p><b>Partial.</b> Two encounters had no boss agent and were skipped.</p>
</div>
<div class="axi-notice axi-notice--danger">
  <div class="axi-notice__icon">!</div>
  <p><b>Failed.</b> The archive is missing its header.</p>
</div>`,
      },
```

- [ ] **Step 9: Run the suite**

Run: `npm test`
Expected: PASS. `tests/motion.test.mjs`'s third assertion now has real input — two `@keyframes` blocks, both touching only `transform`. If it fails, something in `feedback.css` animates a non-composited property and rule 11 has caught it, which is the gate working.

- [ ] **Step 10: Build**

Run: `npm run build`
Expected: knob table written with **32 knobs**. `dist/axi.css` gains `feedback.css` between `data.css` and `prose.css`.

- [ ] **Step 11: Render, and check the reduced-motion path deliberately**

Run: `AXI_BASE=/ node scripts/site.mjs`, then render `_site/components/spinner/`, `_site/components/meter-busy/` and `_site/components/notice/`.

Then render the busy meter **again with motion reduced** — add `<meta>`-independent proof by rendering a copy of the page with `@media (prefers-reduced-motion: reduce)` forced on, or by temporarily setting the media query's contents as unconditional rules in a scratch copy. The whole point of Review Focus 1 is that this path is invisible in the default render: confirm the bar is full and still rather than empty.

- [ ] **Step 12: Commit**

```bash
git add src/feedback.css docs/manifest/feedback.mjs docs/manifest/index.mjs docs/manifest/knobs.mjs docs/manifest/shells.mjs docs/site/shell.mjs scripts/build.mjs tests/feedback.test.mjs dist/axi.css README.md
git commit -F - <<'MSG'
feat(feedback): spinner, indeterminate meter and notice statuses

Both indicators animate transform only, which rule 11 requires and
tests/motion.test.mjs now enforces - this is the first source these gates
have had real input from.

The busy meter needed an explicit reduced-motion rule. base.css parks an
animation at its end state, and this one's end state is the fill clean off
the track: a reader who turns motion off would have been shown an empty
bar. It parks full and still instead. The spinner needs no such rule
because its loop ends where it starts.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
```

---

### Task 6: Search aliases

**Files:**
- Modify: `docs/site/search.js` (scoring)
- Modify: `scripts/site.mjs:110` (project `aliases` into `search.json`)
- Modify: `tests/search.test.mjs`
- Modify: `tests/manifest.test.mjs` (the collision gate)
- Modify: the manifest files, for any entry that did not get its `aliases` in Tasks 2-5

**Interfaces:**
- Consumes: `aliases: string[]` on manifest entries, added in Tasks 2-5.
- Produces: nothing later tasks use. This is the last task.

- [ ] **Step 1: Write the failing tests**

Append to `tests/search.test.mjs`:

```js
describe('aliases', () => {
  const index = [{
    id: 'notice', name: 'Notice', layer: 'shells', layerName: 'Shells',
    summary: 'A box with an icon.', classes: ['.axi-notice'], aliases: ['alert', 'banner'],
  }]

  it('finds an entry by a name it does not have', () => {
    expect(matches('alert', index).map((e) => e.id)).toEqual(['notice'])
  })

  // An alias is a synonym, not a name. It must never outrank a real name
  // match, or typing "progress" would surface the spinner above the meter.
  it('ranks an alias below a name match', () => {
    const two = [
      { ...index[0], id: 'spinner', name: 'Spinner', aliases: ['progress'] },
      { ...index[0], id: 'meter', name: 'Progress meter', aliases: [] },
    ]
    expect(matches('progress', two).map((e) => e.id)).toEqual(['meter', 'spinner'])
  })

  it('survives an entry with no aliases field', () => {
    expect(matches('notice', [{ ...index[0], aliases: undefined }]).map((e) => e.id)).toEqual(['notice'])
  })
})
```

Append to `tests/manifest.test.mjs`:

```js
describe('aliases', () => {
  it('never shadows a real entry id', () => {
    const ids = new Set(entries().map((e) => e.id))
    const shadowing = entries().flatMap((e) => (e.aliases ?? []).filter((a) => ids.has(a)))
    expect(shadowing).toEqual([])
  })

  it('uses only lower-case single words', () => {
    const bad = entries().flatMap((e) => (e.aliases ?? []).filter((a) => !/^[a-z]+$/.test(a)))
    expect(bad).toEqual([])
  })
})
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npm test -- search manifest`
Expected: FAIL on "finds an entry by a name it does not have" — `matches` returns `[]`, because nothing reads `aliases` yet.

- [ ] **Step 3: Score aliases in `docs/site/search.js`**

Replace the scoring block inside the loop with:

```js
    const name = entry.name.toLowerCase()
    const cls = entry.classes.join(' ').toLowerCase()
    // An alias is a synonym a reader arrives with from another framework -
    // "alert" for the notice, "progress" for the meter. It scores below every
    // class match and above a summary match: a synonym is a better signal
    // than a word that happens to appear in a sentence, and a worse one than
    // the component's actual name.
    const alias = (entry.aliases ?? []).join(' ').toLowerCase()
    let score = 0
    if (name.startsWith(q)) score = 3
    else if (name.includes(q)) score = 2
    else if (cls.includes(q)) score = 1.5
    else if (alias.split(' ').includes(q)) score = 1.25
    else if (entry.summary.toLowerCase().includes(q)) score = 1
```

The alias match is `.split(' ').includes(q)` rather than `.includes(q)` on purpose: a substring test would let "og" match "banner"-adjacent aliases and generally make short queries match everything.

- [ ] **Step 4: Project aliases into `search.json`**

In `scripts/site.mjs:110`:

```js
  write('search.json', JSON.stringify(entries().map(({ id, name, layer, summary, classes, aliases }) =>
    ({ id, name, layer, layerName: LAYER_NAMES[layer], summary, classes, aliases: aliases ?? [] }))))
```

- [ ] **Step 5: Add the remaining aliases**

Every entry that did not receive `aliases` in Tasks 2-5 gets it now. At minimum:

- `docs/manifest/data.mjs` → `meter`: `['progress', 'progressbar', 'bar']`
- `docs/manifest/primitives.mjs` → `input`: `['textarea', 'field', 'textbox']`
- `docs/manifest/primitives.mjs` → `btn`: `['button']`
- `docs/manifest/shells.mjs` → `menu`: `['dropdown']`
- `docs/manifest/shells.mjs` → `notice`: `['alert', 'banner']` (if Task 5 did not add it)

Check each against the collision gate: no alias may equal any entry's `id`. `'progress'` is safe because the meter's id is `meter` and the indeterminate one's is `meter-busy`; `'button'` is safe because the id is `btn`.

- [ ] **Step 6: Run the suite**

Run: `npm test`
Expected: PASS. A failure in "never shadows a real entry id" names the offending alias — rename it rather than removing the gate.

- [ ] **Step 7: Verify search end to end**

Run: `AXI_BASE=/ node scripts/site.mjs`, then:

```bash
node -e "const i=require('./_site/search.json');const {matches}=await import('./docs/site/search.js');" 2>/dev/null || true
node --input-type=module -e "
import { readFileSync } from 'node:fs'
import { matches } from './docs/site/search.js'
const index = JSON.parse(readFileSync('_site/search.json', 'utf8'))
for (const q of ['alert', 'dialog', 'checkbox', 'breadcrumb', 'pagination', 'snackbar', 'loader', 'progress', 'textarea']) {
  console.log(q.padEnd(12), matches(q, index).slice(0, 2).map((e) => e.id).join(', ') || 'NOTHING')
}
"
```

Expected: every query returns at least one result, and none returns `NOTHING`. `progress` should return `meter` before `spinner` or `meter-busy`.

- [ ] **Step 8: Build and commit**

Run: `npm run build && npm test`

```bash
git add docs/site/search.js scripts/site.mjs docs/manifest/ tests/search.test.mjs tests/manifest.test.mjs dist/axi.css README.md
git commit -F - <<'MSG'
feat(docs): search aliases, so the Bootstrap names find the right page

Round two extended .axi-notice and .axi-meter rather than shipping
.axi-alert and .axi-progress beside them, on the grounds that a second
component rendering the same box is exactly the drift the rules warn
about. This is the other half of that bargain: someone who types "alert"
or "progress" lands on the component that does the job.

An alias scores below a class match and above a summary match - a synonym
beats a word that happens to appear in a sentence, and loses to the
component's actual name. A gate asserts no alias shadows a real id.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
```

---

## Self-review notes

**Spec coverage.** Every section of the spec maps to a task: the audit and the extend-don't-duplicate ruling drive Tasks 2, 5 and 6; zero-JS-via-native-elements is Tasks 2 and 4; the rules-already-cover-it argument is carried in each entry's `rules` array; the radius/square reasoning is in Tasks 2 and 3; the layer stack is Task 1; the file structure and `ORDER` changes are Tasks 2 and 5; docs entries, aliases and generated artefacts are spread across all six.

**One spec requirement was dropped deliberately.** The spec's Testing section lists three new assertions; this plan ships five (the two above plus the focus-ring, accent-ink and pointer-events assertions pulled from Review Focus). Nothing was removed.

**One spec instruction was overridden.** The spec sequences the layer stack with batch 3; the plan moves it to Task 1 so it gates the batches that follow. Recorded at the end of the File Structure section.

**One structural defect was found while writing Task 2 and fixed inline.** A standalone `textarea` manifest entry cannot satisfy the shape test — it defines no class of its own, and claiming `.axi-input` collides with the existing `input` entry under "never claims one class from two entries". The textarea folds into the `input` entry instead. The ruling is recorded in Task 2 Step 6 rather than left for an implementer to rediscover at the point of failure.

**Knob count runs 26 → 29 → 30 → 31 → 32** across Tasks 2, 3, 4, 5. Each task's build step states the expected number, so a missed `knobs.mjs` row fails loudly at the build rather than quietly at review.
