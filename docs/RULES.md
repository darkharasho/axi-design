# The axi design language

Flat and outlined. Every fill is a saturated ink at full strength, every raised
element is drawn with a near-black outline and a hard offset block instead of a
blur.

These are the rules. A component that cannot be justified by one of them either
needs a new rule written for it, or does not belong in the system.

## 1. No gradients on surfaces

Flat fills only. The single exception in the codebase is the select caret,
which uses two `linear-gradient`s to draw a triangle — a shape, not a surface.

## 2. No colour at partial opacity over the ground

If a colour is present it is at full strength. A muted gold over near-black is
just brown, and five muted inks over near-black are five browns. When something
should be quieter, reach for a neutral from the ramp — that is what the ramp is
for.

## 3. Every raised element is outlined and blocked

An `--axi-ink-line` border plus a hard offset shadow, never a blur.

Two weight steps, and only two:

| Step | Border | Offset |
|---|---|---|
| Panel | `--axi-border-panel` (4px) | `--axi-offset-panel` (6px) |
| Control | `--axi-border-control` (3px) | `--axi-offset-control` (3px) |

A third step is how a system stops looking like one system.

There is one weight outside the table, and it is deliberately not a step:
`--axi-border-hairline` (2px), used only inside `.axi-prose` — for inline
code, table rules and the list bullet — where either form step reads as too
heavy for a line of running text. It is a prose rule weight, never an outline
on a raised thing.

**What is mechanically enforced.** `tests/tokens.test.mjs` enforces both
columns:

- *Border* — no literal border/outline weight may appear in any component
  file: not a `px` value, not another length unit (`rem`, `em`, ...), and not
  a `thin`/`medium`/`thick` keyword. A width has to come through
  `--axi-border-panel`, `--axi-border-control` or `--axi-border-hairline`.
  `outline`/`outline-width` are checked the same way as `border`
  (`outline-offset` and `outline-color` are not weight properties and are
  untouched).
- *Offset* — every `box-shadow` in a component file must be exactly
  `<offset> <offset> 0 var(--axi-ink-line)`, with the offset drawn from an
  enumerated list of four tokens: the two resting steps above, plus the two
  hover deepenings rule 4 describes (`--axi-offset-panel-hover` 10px,
  `--axi-offset-control-hover` 6px). That is what rules out a blur, a spread,
  an invented offset and a shadow in any colour but the ink line.
  `filter: drop-shadow(...)` and `text-shadow` — the two other CSS properties
  that can draw the same blurred look — are forbidden outright, since nothing
  in this language legitimately reaches for either.
- *No local escape hatch* — the form tokens themselves
  (`--axi-border-panel`, `--axi-border-control`, `--axi-border-hairline`,
  `--axi-offset-panel`, `--axi-offset-control`, and their `-hover` variants)
  may be **declared** only in `tokens.css`. A component file redeclaring one
  of these on itself would change the value the border/offset checks above
  are silently trusting, without changing the `var()` text those checks read
  — that is the escape hatch, and it is what the mechanical checks above
  cannot see on their own, so it is checked directly instead.

Adding a fifth legal block means adding a token *and* adding it to `OFFSETS`
in the test — there is no escape hatch that admits a bare literal, local
redeclaration included.

**Colour literal scan, precisely.** The colour check in the same file only
scans the *value* of a declaration whose property can legally carry a colour
(an allowlist: `color`, `background`/`background-image`, the `border*-color`
family, `outline-color`, `box-shadow`, `text-shadow`, `filter`, `fill`,
`stroke`, `caret-color`, `column-rule-color`, `text-decoration-color`,
`accent-color`, `scrollbar-color`). A selector (`.card:not(.plum)`) or an
at-rule prelude (`@supports (color: ...)`) never reaches the scan at all,
because neither one's text starts with a colour-carrying property name — this
is why a pseudo-class's colon is harmless. A bare named colour (`gold`,
`tan`, `linen`, ...) is only trusted inside the plain value: never inside a
quoted string or a `url(...)`, since those routinely contain a colour *word*
with no colour *meaning* (a font stack, a `content` string, a texture
filename, a cursor list). Hex and the colour functions (`#fff`, `oklch(...)`,
...) have no other meaning in CSS, so they are still caught even inside a
string or `url(...)` — this is what catches a colour hard-coded into a
data-URI SVG, which would otherwise be a free pass for exactly the same
reason the string/url() exemption exists for named colours. This is a
deliberate asymmetry: it costs the (rare, deliberate) case of a bare named
colour smuggled inside a data-URI SVG, in exchange for never blocking a font
stack, a filename or a `content` string again.

Radii are the one part of the form that is **not** enforced: `--axi-radius`
and `--axi-radius-sm` exist, but controls carry a literal `8px` (and `9px`,
`5px`, `4px` appear elsewhere). Treat the radius scale as convention, not
contract, until it is tokenised.

## 4. Hover lifts

The lift is per form step, not one universal number: a control has no resting
shadow, so a control's hover both moves it and draws its block for the first
time — `translate(-2px, -2px)` together with gaining the `--axi-offset-control`
(3px) block from nothing. A panel already carries its 6px block at rest, so its
hover only needs to deepen it — `translate(-3px, -3px)` with the block growing
from 6px to 10px (`--axi-offset-panel-hover`). Applying the panel's flat `-3px` to a control would lift it
by exactly the depth of its own 3px block, leaving the lower-right edge where
it started — that reads as the element growing, not lifting.

There is a third case the two-step framing misses: a *control that already
rests on a block* — `.axi-btn--primary`, a pressed `.axi-pill`. Translating it
without deepening its block moves element and block together and leaves the
lower-right edge exactly where it was, which is the same "grows rather than
lifts" failure. Those deepen 3px to 6px (`--axi-offset-control-hover`) while
keeping the control's `translate(-2px, -2px)`.

Nothing in this language fades, glows or pulses. The movement reads in
peripheral vision and costs no colour.

Every lift is turned off under `@media (prefers-reduced-motion: reduce)`, in
`base.css`, once, for every consumer. Resting appearance is untouched: the
diamond still rotates, because a rotation that never changes is geometry and
not motion.

## 5. Filled means status, outlined means annotation

A filled chip asserts a value about the thing. An outlined chip in the cool ink
is commentary *about* the thing — a maintainer's judgment, a source, a caveat.
A reader must be able to tell which they are looking at before reading either.

The same rule governs coloured strips on cards: a strip must encode real data.
A strip that carries "category" is decoration impersonating data, and it takes
the first position the eye lands on.

## 6. One cool ink is reserved for meta

`--axi-meta` marks metadata and annotation, and may never carry a status
meaning. It is the only ink guaranteed not to mean "how bad is this" — which is
what makes it readable as commentary at a glance.

## 7. The diamond is the family motif

A 45°-rotated outlined square. Bullet, status dot, language marker, and scaled
up behind a glyph, the brand sigil.

## Tokens

Three layers, in `src/tokens.css` — the only file permitted to contain a colour
literal.

- **Surface & text** — `--axi-ground`, `--axi-surface`, `--axi-surface-raised`,
  `--axi-ink-line`, `--axi-rule`, `--axi-text`, `--axi-text-dim`,
  `--axi-text-faint`, `--axi-scrim`
- **Accent & status** — `--axi-accent`, `--axi-accent-ink`, `--axi-meta`,
  `--axi-ok`, `--axi-warn`, `--axi-danger`. **This is the per-app override
  surface.** An app that sets `--axi-accent` and nothing else is correctly
  themed.
- **Form** — outline and offset steps, radii, measures (`--axi-page`,
  `--axi-page-narrow`, `--axi-page-wide`, `--axi-gutter`) and the type scale.
  Overriding these means leaving the language, not theming it.

Per-instance knobs (`--axi-pill-fill`, `--axi-grid-min`, `--axi-page-pad`, …)
are a separate surface from these tokens: they are set on one element, or on
an ancestor, with a `style=""` attribute rather than in `:root`. The full list
is [the consumer API table in the README](../README.md#per-instance-knobs).

### Theming an app

```css
:root { --axi-accent: #b06bff; }
```

If an app picks an accent dark enough that near-black text on it fails
contrast, it also sets `--axi-accent-ink: var(--axi-text)`. It should not edit
components.

## Light mode

Not shipped. The system is *structured* for it: no component contains a colour
literal, so a light theme is a second palette block, not a rewrite. It is not
a token swap either — the saturated inks that read as vivid on near-black go
washed out on white and would need retuning.

## Adding a component

1. Which rule justifies it? If none, write the rule first or stop.
2. Build it from the existing primitives. A shell that redefines `.axi-panel`
   instead of using it will drift the first time the panel changes.
3. No colour literals. No third form step.
4. Add it to the gallery, and check it with the accent switcher — if it does
   not follow the accent, it hard-coded something.
5. `npm run build` and commit `dist/axi.css` with your source change.
