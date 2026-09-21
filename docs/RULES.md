# The axi design language

Flat and outlined. Every fill is a saturated ink at full strength, every raised
element is drawn with a near-black outline and a hard offset block instead of a
blur.

These are the rules. A component that cannot be justified by one of them either
needs a new rule written for it, or does not belong in the system.

## 1. No gradients on surfaces

Flat fills only. The two exceptions in the codebase are both a gradient used
to draw a *shape*, with no soft transition anywhere in them: the select caret
(two `linear-gradient`s meeting to make a triangle) and `.axi-plot`'s
gridlines (a `repeating-linear-gradient` of hard stops, which is how N evenly
spaced rules get drawn without asking every consumer to emit N empty divs).
A gradient across a surface is still forbidden, and always will be.

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

## 8. A table is the panel's interior

Forty rows of numbers are not forty raised things. A table is drawn in rules —
`--axi-rule` for the row lines, `--axi-border-hairline` for their weight — and
never in outlines or blocks: the panel around it is the raised element, and the
rows are what is inside it. Outlining the rows turns a list into a grid of
boxes and costs the eye the vertical run down a column that makes a table worth
using.

One fill is allowed, in the rank column, and only where the rank is real — a
podium position the data earned. A row *number* is not a rank, and filling it
spends the brightest thing on screen on the fact that a list has a first line.

The hover on a row is the neutral ramp, not an ink, for the same reason: moving
the cursor down a table is not a series of status changes.

## 9. A quantity is drawn as length, never intensity

A proportion is a bar: the track is the ground, the fill is the value, and the
fill is one ink at full strength. This is rule 2 applied to data — a bar faded
to 30% to mean "30%" encodes the number twice, once legibly and once not, and
the illegible copy is the one the eye reads first.

The corollary is that this language does not draw a heatmap. Intensity-by-tint
is the one chart type that cannot be built without the thing rule 2 forbids, so
a distribution is drawn as bars, or as a table sorted by the value, or not at
all.

## 10. A chart's ink is the accent

One series is the accent. A second, for comparison, is the neutral ramp —
`--axi-text-faint` against the accent reads instantly as "this one, versus
that one", and costs no new colour.

Beyond two, stop and ask whether the data owns its own palette. A profession,
a team, a map colour is domain data: it comes in per-instance through
`--axi-series`, the way a card strip does, and it is the data's colour rather
than the system's. If the data does *not* own a palette, a nine-colour chart is
nine arbitrary inks competing with the five that already mean something —
`--axi-ok`, `--axi-warn`, `--axi-danger`, `--axi-meta` and the accent keep
their meanings inside a chart, so nothing else may borrow them for a category.

The status inks still mean status inside a plot: a line drawn in `--axi-danger`
is asserting that the quantity is bad, not that it is the third series.

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
