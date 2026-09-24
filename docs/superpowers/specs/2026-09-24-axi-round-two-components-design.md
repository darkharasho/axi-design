# axi-design round two: the missing components

**Status:** approved in chat 2026-09-24, pending written review

## Goal

Add the components a person arriving from Bootstrap expects to find and does
not: checkbox, radio, textarea, breadcrumb, pagination, avatar, modal,
accordion, toast, spinner, indeterminate progress, and status variants on the
notice. Every one of them ships with its docs-site entry, its knobs, and its
place in the rules — because the coverage gates make any other order red.

## What this is not

Round one built the docs site. This round adds no site machinery: no new page
type, no generator change, no new build step. The only site-side work is
manifest entries, plus one small addition to the manifest's entry shape
(`aliases`) so search can carry the Bootstrap names.

## The audit that shaped the scope

The original list of twelve was wrong in five places. `src/` already contains
the thing being asked for:

| Asked for | Already present | Decision |
|---|---|---|
| alert | `.axi-notice` — a panel-weight box with an icon slot, no status variants | **Extend**: add `--ok`, `--warn`, `--danger` |
| progress | `.axi-meter` — "a proportion is a length" (rule 9) | **Extend**: add `--busy` for the indeterminate case |
| textarea | `.axi-input` — everything but `resize` and a height | **Extend**: add a `textarea.axi-input` rule |
| modal | `.axi-scrim` at `z-index: 50`, paired with `.axi-drawer` at 51 | **Build new**, as a centred sibling |
| checkbox / radio | `.axi-switch` — the precedent for a styled control with a state | **Build new**, following its conventions |

**Ruling: extend rather than duplicate.** A second component that renders the
same box is precisely the drift `docs/RULES.md` step 2 warns about ("a shell
that redefines `.axi-panel` instead of using it will drift the first time the
panel changes"). Bootstrap familiarity is served by search aliases, not by a
second class.

## Doctrine

### Zero JavaScript, via native elements

The language ships no script and will not start now. Where a native element
does the behaviour, the component is that element:

- checkbox and radio are real `<input>`s with `appearance: none`, styled on
  `:checked`. They submit with a form and work from the keyboard because they
  *are* the control, not a picture of one.
- the accordion is `<details>` / `<summary>`.
- the modal is `<dialog>`. Focus trapping, `Esc`, inertness and the top layer
  come from the browser.

The cost is accepted explicitly: `<dialog>` brings its own `::backdrop`, so the
modal **styles `::backdrop` rather than reusing `.axi-scrim`**. Two things that
look identical and are not the same element. This is the one inconsistency in
the round, and it is the right trade — reusing `.axi-scrim` would mean
abandoning `<dialog>` and hand-rolling a focus trap in a language with no JS.

**Toast is the exception**, and does not break the rule. A toast has a
lifecycle — appear, stack, leave on a timer — and no native element provides
it. The CSS ships the stacking region and the toast's appearance; inserting and
removing nodes is the consumer's job. This is the same contract `.axi-menu`
already publishes for its open state, so it introduces no new kind of promise.

### No new rules are required

Every component below is justified by a rule that already exists. Step 1 of
"Adding a component" is satisfied without amending doctrine:

- checkbox, radio, pagination, toast, notice variants — **rule 5**, filled
  means status / "this one is on".
- the radio's mark, the breadcrumb separator, the accordion cue, the spinner,
  the toast dot — **rule 7**, the diamond is the family motif.
- modal, accordion, toast — **rule 3**, every raised element is outlined and
  blocked.
- spinner and the busy meter — **rule 11**, an indicator of work animates a
  composited property.
- avatar, textarea — **rule 3**'s flat case: content inside a panel takes an
  outline and no block, as `.axi-stat` and `.axi-table__rank` already do.

### The radio cannot be round, and the avatar cannot either

`--axi-radius` is `0`. A round radio or a round avatar would be the only
rounded shape in the language, and would be the first place a flat outlined
form starts looking like some other framework — the exact failure the radius
tokens' comment already names.

So the radio and the checkbox are the same square box, **told apart by their
mark**: the checkbox gets a check, the radio gets the diamond. The avatar is a
square. Both follow the radius scale, so a consumer who sets
`--axi-radius-sm` gets rounded controls everywhere at once, including these.

### The z-index stack becomes doctrine

Today the stack is undocumented and inferred from four scattered declarations,
one of which (`.axi-tooltip` at `z-index: 99999`) is not participating in a
stack so much as shouting over it. Toast needs a number and there is nowhere to
read what number is free.

`docs/RULES.md` gains a short **Layer stack** subsection under the Tokens
section, naming every layer:

| Layer | z-index | What sits here |
|---|---|---|
| Sticky chrome | 40 | `.axi-mast` |
| Popovers | 41 | `.axi-menu__pop`, `.axi-picker__pop` |
| Scrim | 50 | `.axi-scrim` |
| Drawer | 51 | `.axi-drawer` |
| Toasts | 60 | `.axi-toasts` |
| Tooltip | 70 | `.axi-tooltip` |
| Modal | top layer | `dialog.axi-modal`, promoted by `showModal()` |

`.axi-tooltip` drops from `99999` to `70`. This is a **behaviour change to a
shipped component** and is called out as such: a tooltip still sits above every
in-page layer including toasts, but no longer above a `<dialog>`'s top layer —
which it never actually did, since the top layer is above all z-index.

## File structure

`src/primitives.css` is already 407 lines and `src/shells.css` 325. A whole
form layer and a whole feedback layer do not belong in either.

- **`src/forms.css`** (new) — `.axi-check`, `.axi-radio`, `textarea.axi-input`
- **`src/feedback.css`** (new) — `.axi-spinner`, `.axi-toasts`, `.axi-toast`,
  `.axi-meter--busy`, `.axi-notice--*`
- **`src/shells.css`** (extend) — `.axi-modal`, `.axi-accordion`,
  `.axi-crumbs`, `.axi-pages`
- **`src/primitives.css`** (extend) — `.axi-avatar` only

Two consequences the build test enforces, both of which are work items, not
side effects:

1. `dist/axi.css` "lists exactly the files in `src/`" and "concatenates sources
   in the declared order" — `ORDER` in `scripts/build.mjs` is currently
   `tokens, base, primitives, layout, shells, data, prose` and must gain both
   new files at deliberate positions: `tokens, base, primitives, forms, layout,
   shells, data, feedback, prose`. Forms follow primitives because
   `textarea.axi-input` restyles a primitive; feedback follows data because
   `.axi-meter--busy` modifies a data component. Both placements obey the
   file's own stated invariant — later files may restyle earlier ones.
2. `package.json` `exports` and `files` are per-package, not per-source-file,
   so they need no change — but the build test's "every entry point resolves to
   a file that exists" must still be green after the concatenation order moves.

## The components

Every class listed here needs a manifest entry in the same commit that defines
it, and every knob needs a `knobs.mjs` row — the coverage gates are
bidirectional and carry no exclusion list.

### Batch 1 — form controls (`src/forms.css`)

**`.axi-check`** — `input[type="checkbox"]` with `appearance: none`. A square at
`--axi-check-size` (22px), ground fill, control-weight outline, no block: it is
content inside a panel, not a raised thing. `:checked` fills with
`--axi-check-fill` defaulting to `--axi-accent`, and reveals a check drawn as
two borders on `::after` rotated -45°. Rule 5: the fill is the state.

**`.axi-radio`** — `input[type="radio"]`, the same box, marked with a diamond
(`::after`, `rotate(45deg)`, filled `--axi-check-fill`). Shares
`--axi-check-size` and `--axi-check-fill` with the checkbox deliberately: a form
with both should not need two knobs set to the same value to stay even.

**`textarea.axi-input`** — `min-height: var(--axi-textarea-h, 90px)`,
`resize: vertical`, and `font-family: var(--axi-sans)` because a textarea does
not inherit the page font. Horizontal resize is not offered: a textarea wider
than its field breaks the form's column.

Knobs: `--axi-check-size`, `--axi-check-fill`, `--axi-textarea-h`.

### Batch 2 — navigation (`src/shells.css`, `src/primitives.css`)

**`.axi-crumbs`** — a flex row of links in `--axi-text-dim`, hovering to the
accent. `.axi-crumbs__sep` is a 6px diamond in `--axi-rule` (rule 7). The
current crumb takes `aria-current="page"` and is drawn in `--axi-text` at
weight 800 — **not** filled: a breadcrumb's last item is a position, not a
control that is on.

**`.axi-pages`** — a row of `.axi-pages__n`, each a control-weight outlined box
on `--axi-surface-raised`. `aria-current="page"` fills with the accent and takes
the control block, exactly as `.axi-tabs a[aria-current="page"]` does, because
it is the same idea. `.axi-pages__gap` is the unstyled ellipsis between runs.

**`.axi-avatar`** — a square at `--axi-avatar-size` (40px), outlined at the
control weight, no block. Initials in `--axi-t-label`, uppercased.
`.axi-avatar--accent` fills it; `.axi-avatar__img` is the `object-fit: cover`
image case. Lives in `primitives.css` because it is a primitive that a table
row, a toast and a mast all use.

Knobs: `--axi-avatar-size`.

### Batch 3 — overlays (`src/shells.css`)

**`.axi-modal`** — `dialog.axi-modal`. Panel weight, panel block, `--axi-surface`,
`max-width: min(var(--axi-modal-width, 560px), calc(100vw - 32px))`.
`::backdrop` takes `--axi-scrim`. Three parts, each separated by a
control-weight rule in `--axi-rule` (rule 8's reading: a line inside a raised
thing is a rule, not an outline): `__head`, `__body`, `__foot`.

**`.axi-accordion`** — `details.axi-accordion`, panel weight and block.
`.axi-accordion__head` is the `<summary>`, with the native marker removed and a
diamond `::before` in the accent that rotates from 45° to 180° on `[open]`. The
rotation is a `transform`, so it is legal under rule 4's rationing and does not
need rule 11. `.axi-accordion__body` is indented to clear the marker.

**`.axi-toasts` / `.axi-toast`** — the region is `position: fixed`, bottom-right,
`z-index: 60`, a column of toasts. Each toast is control weight and control
block on `--axi-surface-raised` — a chip-sized raised thing, not a panel, because
a stack of four panels over the page is a wall. `.axi-toast__dot` is the diamond;
`--ok` and `--danger` recolour it under rule 5.

Knobs: `--axi-modal-width`.

### Batch 4 — feedback (`src/feedback.css`)

**`.axi-spinner`** — a square outlined in the accent at `--axi-spinner-size`
(20px), rotating `45deg → 405deg` on a linear 1.1s loop, so it reads as a
spinning diamond. Animates `transform` only, per rule 11.

**`.axi-meter--busy`** — the indeterminate meter. The fill keeps a fixed
`width: 25%` and travels with `translateX`; **`width` is never animated**, which
is the whole of rule 11. The knob-driven `--axi-meter-v` is ignored in this
mode, and the docs say so.

**`.axi-notice--ok` / `--warn` / `--danger`** — recolour `.axi-notice__icon`'s
fill and the `<b>` accent text. Rule 5: the notice's icon is the thing
asserting a status, so the status lives there.

Knobs: `--axi-spinner-size`.

## Docs-site work

### Manifest entries

One entry per component, in the layer manifest matching its source file. New
manifest modules `docs/manifest/forms.mjs` and `docs/manifest/feedback.mjs`,
registered in `docs/manifest/index.mjs`, with layers `forms` and `feedback`
added to the known-layer list the shape test checks.

Each entry carries at least two examples. The examples for modal, accordion
and toast must account for what round one learned the hard way: **a popover or
overlay in a demo panel escapes it unless the example reserves room correctly**
— and room for a thing anchored below is reserved with `margin-bottom` on the
container, never `height`. The modal example renders the `<dialog>` with the
`open` attribute and `position: static` so it sits in the demo rather than
over the page, with a note saying a real one is opened with `showModal()`.

### Search aliases

`docs/manifest/*.mjs` entries gain an optional `aliases: string[]`. The search
index includes them in the haystack so "alert" finds `.axi-notice`, "progress"
finds `.axi-meter`, "dialog" finds `.axi-modal`, "loading"/"loader" find
`.axi-spinner`, "snackbar" finds `.axi-toast`.

Aliases to ship: notice → `alert`; meter → `progress`, `progressbar`; input →
`textarea` (on the input entry, since the textarea is a variant of it); modal →
`dialog`, `popup`; spinner → `loader`, `loading`; toast → `snackbar`,
`notification`; crumbs → `breadcrumb`; pages → `pagination`, `pager`;
accordion → `collapse`, `disclosure`; check → `checkbox`; avatar → `gravatar`.

A test asserts no alias collides with an existing entry `id`, so an alias can
never shadow a real page.

### Generated artefacts

`npm run build` regenerates the README knob table; the six new knobs appear
there automatically and the README table test compares against `knobs.mjs`.
`dist/axi.css` is rebuilt and committed with the source change, per "Adding a
component" step 5.

## Testing

No new test *machinery*. The existing gates cover almost all of this the moment
the code lands, which is the point of having built them:

- `tokens.test.mjs` — no colour literal outside `tokens.css`, no third form
  step, every radius from the scale, every block hard and at a declared offset.
  The new CSS is written to pass these, not to be excepted from them.
- `manifest.test.mjs` — bidirectional class coverage, bidirectional knob
  coverage, rule citations that resolve, example markup using only real classes.
- `build.test.mjs` — `dist/axi.css` matches the concatenation of `src/` in the
  declared order, and lists exactly the files present.

Three new assertions are required, each pinning something the existing gates
cannot see:

1. **The layer stack is the documented one.** Parse the z-index table out of
   `RULES.md` and assert every `z-index` in `src/` appears in it with the same
   number. This is what stops the next overlay from guessing, and it fails
   today until `.axi-tooltip` comes down from 99999.
2. **Rule 11 is mechanically enforced.** Scan every `@keyframes` block in
   `src/` and assert its declarations touch only `transform` and `opacity`. The
   rule is currently prose that a reviewer has to remember; this makes it a
   gate. Written as a new `tests/motion.test.mjs`.
3. **No alias shadows an id** (above).

Assertion 2 is the highest-value test in this round: it is the one rule in
`RULES.md` described as "not negotiable", and it has never been checked by
anything but a human reading a diff.

## Review focus

Input classes and failure modes the components will meet that no task's happy
path exercises, most likely first:

1. **A `<dialog>` that is never `showModal()`-ed.** Opened with `.open = true`
   or the `open` attribute, it renders inline with no backdrop and no top
   layer. The docs example deliberately does this, so the note must say it.
2. **A checkbox inside a `<label>` versus one next to a `for=`-linked label.**
   Both must have a usable hit target and visible focus; `appearance: none`
   discards the native focus ring, so the focus style is not optional.
3. **`prefers-reduced-motion`.** The spinner and the busy meter animate
   indefinitely. Both must degrade — the spinner to a static diamond, the busy
   meter to a static fill — or the language ships something that cannot be
   turned off by a reader who needs it off.
4. **A toast region with no toasts in it.** A `position: fixed` empty flex
   column must not intercept pointer events over the page beneath it;
   `pointer-events: none` on the region with `auto` on each toast.
5. **Light mode.** Every new component resolves through tokens, so it should
   follow the light palette for free — but `--axi-accent-ink` on a check mark
   and `::backdrop` over a light ground are the two places that assumption is
   most likely to be wrong, and both need looking at, not reasoning about.

## Sequencing

Four batches, in the order above. Each is independently reviewable and leaves
the tree green: source, manifest entry, knobs, `dist/` rebuild, tests passing.
The layer-stack documentation and the `.axi-tooltip` z-index change land with
batch 3, which is the batch that needs the stack to exist.

Version bump and tag are a release decision taken after all four batches are
merged, not per batch.
