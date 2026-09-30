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
A gradient across a surface is still forbidden in every component file, and
always will be. The single relief is a *theme* restating the surface tokens
themselves — and `--axi-ground-image`, the page's own light, which is declared
inert in `tokens.css` and read only by `body`; see [Themes](#themes). That is
what lets a glass theme exist without one component ever learning the word
"glass". A component cannot reach for that exception, because it cannot see it:
what it reads is the same surface token it was already reading.

That relief has a consequence worth stating next to it, because it is not
visible from inside this package. A surface token that may hold a gradient can
only ever *be* a background: `fill` takes `<paint>` and not `<image>`,
`color-mix()` takes colours only, `background-color` and `border-color` take a
colour. Every component here paints a surface through the `background`
shorthand and so never meets this — but a consumer wanting a surface-coloured
chart fill, or a surface mixed some way toward the accent, has nothing to ask
for, and the failure is silent: an invalid `fill` drops at computed-value time
and `fill` inherits, so the element takes its ancestor's paint and renders
something plausible. So each surface has a **`-paint` companion** —
`--axi-surface-paint`, `--axi-surface-raised-paint`,
`--axi-surface-float-paint` — holding the same surface as one flat `<color>`.
Paint a surface with the surface token; reach for the companion wherever only a
colour is valid. A theme that grades a surface must restate that surface's
companion, and `themes.test.mjs` asserts it: the companions are aliased to the
surfaces, so a theme that forgets one hands its gradient straight back.

## 2. No colour at partial opacity over the ground

If a colour is present it is at full strength. A muted gold over near-black is
just brown, and five muted inks over near-black are five browns. When something
should be quieter, reach for a neutral from the ramp — that is what the ramp is
for.

A theme gets the same carve-out as rule 1: it may hold the *surface layer* at
partial opacity, because a translucent surface is that surface's own definition
rather than a colour laid over the ground. That layer is the two surfaces and
the lines that bound and divide them — `--axi-ink-line` and `--axi-rule` — for
the same reason: the edge of a translucent panel is as much the panel as its
face, and an opaque hairline around a pane of glass is a picture frame.

The five saturated inks are untouched. A muted `--axi-warn`, a faded accent, a
status ink at 60% — still forbidden, in a theme exactly as in a component,
because the paragraph above is about what happens to meaning when five inks
become five browns, and changing which stylesheet does the muting does not
change that. The neutral text ramp is likewise a theme's to restate but not to
fade: a theme picks where `--axi-text-dim` sits, it does not write text at 60%.

## 3. Every raised element is outlined and blocked

An `--axi-ink-line` border plus a hard offset shadow, never a blur.
A component spells that shadow `var(--axi-shadow-panel)` or
`var(--axi-shadow-control)`; the offsets those compose are in the table below.

Two weight steps, and only two:

| Step | Border | Offset |
|---|---|---|
| Panel | `--axi-border-panel` (4px) | `--axi-offset-panel` (6px) |
| Control | `--axi-border-control` (3px) | `--axi-offset-control` (3px) |

A third step is how a system stops looking like one system.

There is one weight outside the table, and it is deliberately not a step:
`--axi-border-hairline` (2px). It is a **rule** weight — a line drawn inside
content to separate parts of it, where either form step would turn a list of
numbers into a grid of boxes. That covers inline code and the list bullet in
`.axi-prose`, the rules between table rows, and the gridlines inside a plot.
It is never an outline on a raised thing: the two steps in the table above are
what raise a surface, and reaching for the hairline instead is how a panel
stops looking raised.

There is exactly one element drawn in the line ink rather than on a surface,
and it is named here so it stays an exception rather than becoming a habit:
`.axi-tooltip` is filled with the line ink itself. A thing cannot be outlined
in the colour it is already made of, and a block in that same ink under a box
already made of it reads as the box being thicker rather than raised — so the
tooltip takes a hairline in `--axi-rule` to hold its edge against the page, and
carries no block. Nothing else may use that reasoning.

It spells that fill `--axi-ground-deep`, not `--axi-ink-line`, and so do the
two smaller shapes made of the same tone — the titlebar strip and the switch's
slug. The token holds the line ink today and is a different decision from it:
one is the colour a shape's edge is drawn in, the other the colour a shape is
filled with. A theme that outlines in a light colour so its page can go
near-black relights the first and leaves the second, and the tooltip stays a
dark box with light words on it instead of becoming a pale box with pale ones.
Anything else that comes to be made of this tone reads the same token.

**What is mechanically enforced.** `tests/tokens.test.mjs` enforces both
columns:

- *Border* — no literal border/outline weight may appear in any component
  file: not a `px` value, not another length unit (`rem`, `em`, ...), and not
  a `thin`/`medium`/`thick` keyword. A width has to come through
  `--axi-border-panel`, `--axi-border-control` or `--axi-border-hairline`.
  `outline`/`outline-width` are checked the same way as `border`
  (`outline-offset` and `outline-color` are not weight properties and are
  untouched).
- *Offset* — the block is composed once, in `tokens.css`, as one of four
  `--axi-shadow-*` tokens, and each must be exactly
  `<offset> <offset> 0 var(--axi-ink-line)` with the offset drawn from an
  enumerated list of four: the two resting steps above, plus the two hover
  deepenings rule 4 describes (`--axi-offset-panel-hover` 10px,
  `--axi-offset-control-hover` 6px). That is what rules out a blur, a spread,
  an invented offset and a shadow in any colour but the ink line. A component
  file then names one of the four — `box-shadow: var(--axi-shadow-panel)` —
  and may write nothing else in a `box-shadow`. Two checks rather than one,
  because either alone is hollow: the shape check protects the four
  definitions, the naming check stops a component composing its own block
  beside them. `filter: drop-shadow(...)` and `text-shadow` — the two other
  CSS properties that can draw the same blurred look — are forbidden
  outright, since nothing in this language legitimately reaches for either.
- *No local escape hatch* — the form tokens themselves
  (`--axi-border-panel`, `--axi-border-control`, `--axi-border-hairline`,
  `--axi-offset-panel`, `--axi-offset-control`, their `-hover` variants, and
  the four `--axi-shadow-*` blocks composed from them)
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

**The corner is square.** `--axi-radius` and `--axi-radius-sm` are both `0`.
A hard outline, a hard block and a rounded corner are three decisions, and the
rounded one quietly undoes the other two — the corner is the first place a
flat outlined shape starts looking like a button borrowed from some other
system. Nothing in the language rounds.

The two tokens stay because the scale has to be able to come back: a consumer
that wants soft corners sets them once and gets them everywhere. That is only
true now that the components read them. They previously carried a hand-written
`8px` on every control, with `9px`, `5px`, `4px`, `2px` and a `99px` lozenge
scattered elsewhere, and this paragraph used to say to treat the scale as
convention rather than contract. It is a contract now: panel-sized surfaces
read `--axi-radius`, everything control-sized reads `--axi-radius-sm`, and
`tests/tokens.test.mjs` fails on a literal radius in a component file the same
way it fails on a literal border weight.

**A box the OS draws is a box that breaks this.** A native `<select>` popup is
a raised list the language cannot reach: no ink outline, no offset block, and
its own selection colour where the accent belongs. `.axi-select` styles the
closed box and hands the list to `appearance: base-select` where the browser
has it — but most do not yet, and an Electron app is pinned to whatever
Chromium its version shipped. `.axi-picker` is the way out: the same closed
box on a button, and the list drawn as a popover that takes the panel weight
like any other raised surface. Reach for the native select first, because it
brings keyboard handling and a popup that can leave the window; reach for the
picker when the popup it opens is not one this rule can touch.

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

The lift being a transform has one structural consequence: a transformed
element becomes the containing block for any `position: fixed` descendant.
An overlay positioned in viewport coordinates — `.axi-tooltip` is the one
this language ships — must therefore live as a child of `<body>`, never
inside the component it annotates, or the first hover lift re-anchors it.
The class draws only the box (`--axi-ground-deep` ground, hairline rule border, micro
type); measuring the trigger and setting `left`/`top` is the consumer's
half, and `gallery.js` is the reference wiring.

Every lift is turned off under `@media (prefers-reduced-motion: reduce)`, in
`base.css`, once, for every consumer. Resting appearance is untouched: the
diamond still rotates, because a rotation that never changes is geometry and
not motion.

## 5. Filled means status, outlined means annotation

A filled chip asserts a value about the thing. An outlined chip in the cool ink
is commentary *about* the thing — a maintainer's judgment, a source, a caveat.
A reader must be able to tell which they are looking at before reading either.

A chip may be a press. `.axi-chip--action` adds the hand and the block, and
nothing else — the label of a dismissable filter is still data ("DAMAGE"), not
an action ("Clear all"), so this rule is what tells a reader which of the two a
given box is, and a chip that becomes clickable must not stop looking like a
chip.

**Inside a fill, the only inks are that fill's own pair.** A filled chip, a
pressed pill, a primary button and a current tab each set a contrast ink against
a saturated ground, and anything nested inside them inherits that ground whether
it reads the pair or not. A neutral from the ramp there is not quieter, it is
gone: a consumer's dismiss glyph written `--axi-text-dim` measured **1.39:1**
against the accent fill beside a label at 12.24:1, and `.axi-badge-count` inside
`.axi-btn--primary` was the accent on the accent until 1.30.1. The fix in both
cases is to say nothing — `currentColor` is already the pair — and the trap is
that saying nothing looks like an omission while `--axi-text-dim` looks like a
decision.

This is checked by eye and not by a test, deliberately. The obvious static
check — no descendant rule inside a fillable component may set `color` to a
neutral — flags `.axi-tabs .axi-tabs__close`, which is correct: the tab's fill
sits on the anchor and the close control is its *sibling*, so the faint neutral
is against the page ground. Whether a nested element is on the fill is a fact
about the paint chain, and a stylesheet does not contain it.

The same rule governs coloured strips on cards: a strip must encode real data.
A strip that carries "category" is decoration impersonating data, and it takes
the first position the eye lands on.

And where the strip goes is part of the rule. Status colour **caps** the thing
it judges — a short bar across the head of the card, above the value — rather
than framing it down the left edge. A full-height stripe runs the height of the
box, so it reads as the box's border: five cards in a row become five coloured
frames, and the colour stops saying anything about any one number. A cap sits
directly over the reading it is a verdict on, identifies it once, and then gets
out of the way. Under rule 3 both the cap's edge and the card's own outline are
drawn at the panel weight, because the card is a raised surface and rule 3
pairs the panel border with the panel offset the card already carries. A card
outlined at the control weight would pair a 3px border with a 6px offset —
a third step in everything but name — and would put a thin frame around a
heavier bar.

A switch is the same rule in a slot. Its track fills to assert the setting's
status and is empty otherwise; the slug that moves is `--axi-ground-deep` in both
states, so on and off differ in what colour is *in* the slot and never in how
bright the moving part is. It carries no block — a block belongs to things you
press, and a switch is a slot with something sitting in it — but it keeps a
full ink edge at the control weight, because an off switch inside a panel is a
surface on a surface and without the edge the track disappears and all you can
see is a slug floating in the card.

## 6. One cool ink is reserved for meta

`--axi-meta` marks metadata and annotation, and may never carry a status
meaning. It is the only ink guaranteed not to mean "how bad is this" — which is
what makes it readable as commentary at a glance.

### Saying a meaning outside a component

Rules 5 and 6 are about marks, not only about components. A number inside a
sentence, a word in a legend, a value beside its label — each of these can be a
status or can be commentary, and a reader is entitled to see which. So the five
meanings are available as inks: `.axi-ink-ok`, `.axi-ink-warn`,
`.axi-ink-danger`, `.axi-ink-meta`, `.axi-ink-accent`, with the three neutral
steps as `.axi-ink-plain`, `.axi-ink-dim` and `.axi-ink-faint`, and the same
list again as `.axi-edge-*` for a border's colour.

An ink colours a mark. It is not a way to skip the chip or the status cap, which
are what rule 5 asks for when the verdict belongs to a whole object: a shape the
eye finds beats a recoloured word inside a paragraph. Reach for an ink when
there is no object, only a mark.

They live in `src/utilities.css`, last in the cascade, which is how a single
class overrules the component it sits inside without `!important`. That places
an obligation on components in the other direction: **a component's base and
state rules may not out-rank its own modifiers.** A rule written `.axi-table td`
weighs a class and a type, so it silently defeats both `.axi-table__num` and any
ink a consumer puts on the cell — the fix is `:where()` around the element,
which spends no specificity. Where a component holds a consumer's content, wrap
the element part.

A pseudo-class does the same arithmetic. `.axi-btn:hover` weighs two classes, so
a button written `class="axi-btn axi-ink-danger"` was danger red at rest and
plain white under the cursor: the verdict vanishing at the moment the reader
reaches for it. Where a state rule restates a colour the consumer might have
meant to set — a generic control's hover brighten, which applies to whatever has
not been told what it is — wrap the state: `.axi-btn:where(:hover)`. The
brighten becomes the fallback it always was.

Two things this does not apply to. A colour that *is* the state's meaning stays
at full weight, because there is nothing for an ink to add and an ink reaching it
would be wrong: a selected rail item, a palette's cursor row, a pressed pill. And
a colour that is a fill's contrast pair — `.axi-btn--primary`'s accent ink — stays
too, because an ink there would put a status colour on the accent block and cost
the label its legibility, which is rule 5's reason for the chip.

Applying this everywhere it was owed had one consequence worth naming, because
it is the rule arriving rather than a regression: hovering the **current**
breadcrumb used to turn it accent, and now it does not move. `[aria-current]`
outweighs a wrapped hover, which is the rail's stated refusal — the current item
does not brighten further under the cursor — reaching the one component that had
been disagreeing with it by accident of specificity.

Two things about *checking* this, both learned by getting them wrong. Weigh one
compound, never a selector list: a rule that lists two wrapped hovers beside a
state weighs as the state if you measure the list, and reports the two correct
hovers as offenders. And compare a hover only against a resting rule that
matches the **same element**: an `<a>` inside `.axi-prose` takes the container's
colour by inheritance, which no specificity can lose to, so measuring the link's
hover against the container's rule asks a question neither rule is answering.

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

### The counterpart: a short list of things you act on

Rule 8 is about a *reading*. Forty rows of numbers exist to be compared, and
the comparison happens down a column — outlining the rows cuts the column into
boxes and takes away the only reason the table was worth drawing.

A launcher's list is not that. Each row is one thing, with its own name, its
own state and its own verb sitting at the end of it. Nobody scans down such a
list comparing rows; they find the one they came for and press it. There is no
column to protect, and the flat interior treatment actively lies about what the
row is, because the thing you are about to click looks like a line of a table.

So: **a short list of objects you act on is drawn as a stack of cards** —
outline and block, the same as any other raised thing.

Three bounds, and the rule is only sound with all three:

- **Short.** A dozen or so. The block is what says "press me", and past about
  that many the blocks stop reading as depth and start reading as texture — at
  which point the list has become a table again and rule 8 has it back.
- **Control weight, not panel.** These cards sit *inside* a panel that already
  carries a 6px block. A second 6px block nested in the first reads as two
  planes arguing; the 3px control step reads as the contents of a box. This is
  also the honest weight: each row is a control you press, not a surface.
- **Text on a status fill is `--axi-ink-on-fill`, not `--axi-ink-line`.** The
  two hold the same near-black today, which is why this was easy to get wrong:
  a chip that says `color: var(--axi-ink-line)` reads correctly and still means
  the wrong thing. `--axi-ink-line` is *the colour a shape is outlined in*;
  `--axi-ink-on-fill` is *the colour a word is written in when it sits on a
  saturated fill*. They only have to diverge once — a theme that outlines in a
  light colour — for the conflated spelling to put light text on a bright chip.
  `--axi-accent-ink` is the same distinction for the accent fill specifically.
- **The outline stays `--axi-ink-line`.** Status goes on a filled shape inside
  the row — the icon tile, a chip — and never on the row's own edge. Colouring
  the edge is exactly the full-height stripe rule 5 rejects: five states become
  five coloured frames and the colour stops saying anything about any one of
  them.

The test for which rule applies: *does the eye run down a column?* If yes, it
is a table and it is drawn in rules. If every row ends in a button, it is a
stack and it is drawn in cards.

## 9. A quantity is drawn as length, never intensity

A proportion is a bar: the track is the ground, the fill is the value, and the
fill is one ink at full strength. This is rule 2 applied to data — a bar faded
to 30% to mean "30%" encodes the number twice, once legibly and once not, and
the illegible copy is the one the eye reads first.

The corollary is that this language does not draw a heatmap. Intensity-by-tint
is the one chart type that cannot be built without the thing rule 2 forbids, so
a distribution is drawn as bars, or as a table sorted by the value, or not at
all.

The other corollary is that a thing with no quantity gets no length. A run of
yes/no — attended or missed, passed or failed — is a sequence of facts, and a
fact has no magnitude to draw: rendering "no" as a short bar says "a little
bit" as loudly as a faded fill says "30%". That series is a row of marks of
one size, differing only in ink, which is `.axi-ticks`.

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

## 11. An indicator of work animates a composited property

Spinners, progress strips and pulses almost always report on something
expensive — a parse, a build, an upload. If the work blocks the main thread,
anything animated by layout or paint freezes with it, and a frozen spinner is
worse than no spinner: it is the app telling the reader it has crashed at the
exact moment it is working hardest.

So an indicator that reports on work may animate only `transform` and
`opacity`, which the compositor runs off the main thread. No animated `width`,
`left`, `background-position` or `background-color`. This is the one rule here
that is about honesty rather than composition, and it is not negotiable for
anything that claims to show liveness.

Motion elsewhere is still rationed by rule 4.

## 12. An icon is drawn in the language's angles, at control weight

An icon is an object, not a rule. The objects here are outlined at
`--axi-border-control` (3px), so that is the weight a glyph is drawn at — an
icon at the 2px hairline is a *rule* weight on a thing that is not a rule, and
inside a 3px-bordered button it reads as a thin drawing in a heavy frame
rather than as one object.

The contract:

| | |
|---|---|
| Canvas | 24×24 `viewBox`, all geometry inset 1.5 from every edge |
| Stroke | 3px, `currentColor`, mitered joins, butt caps |
| Corners | radius 0, as everywhere else |
| Angles | 0°, 45° and 90°, and nothing between |
| Curves | none |
| Coordinates | multiples of 0.5; an axis-aligned stroke sits on an odd half-integer or on the centre axis at 12 |

**No curve.** This language has no rounded corner (rule 3) and its motif is a
rotated square (rule 7). One arc in the set is one exception in the set, and
the exception is where the eye finds the seam. Where a borrowed metaphor
genuinely needs a circle, the circle becomes a **diamond if it is a node** — a
lens, a head, a dot, a knob — and a **square if it is a boundary** — a clock
face, a frame, a container. The diamond frame reads as a warning sign, so it
is spent only where warning is the meaning. An octagon was considered as a
third frame shape and refused for the reason rule 3 refuses a third weight
step.

**No colour of its own.** An icon inherits `currentColor` and is whatever ink
it sits in. A two-tone glyph with an accent detail would be colour encoding
nothing, which rule 5 refuses on a chip and rule 10 refuses in a chart.

**The centre-axis exemption, precisely.** A 3px stroke centred on a 24 canvas
spans 10.5–13.5: it can be centred or pixel-aligned, never both. For the few
glyphs built around a centre line, symmetry wins. The exemption is one
coordinate wide — `12` — so it cannot spread into a general licence to sit on
whole integers.

**What is mechanically enforced.** `tests/icons.test.mjs` reads every file in
`icons/` and works from an **allowlist**, not a list of prohibitions. A drawing
may contain one root `<svg>` and `<path>` elements, and nothing else — a
`<circle>`, a `<rect>` or a `<polygon>` is rejected for being unlisted rather
than for being round. The root declares exactly the six attributes in the
contract above, at exactly those values; a `<path>` may carry `d`, and `fill`
or `stroke` only at `none` or `currentColor`. Everything else — a
`transform`, an `rx`, a `stroke-linecap`, a per-element `stroke-width="2"`, a
colour of any spelling — is an unlisted attribute and fails on that ground.
A file containing no `<path>` at all fails too, because a drawing with nothing
in it satisfies every geometric check by having nothing to check.

Each `d` is then parsed — tracking the current point through relative
commands, and reading the extra coordinate pairs of an `M` as the implicit
linetos they are — and fails on a curve command, an angle that is neither
axis-aligned nor 45°, a coordinate off the 0.5 grid or outside the live
area, or an axis-aligned stroke off its permitted centerlines. Both ends of
every segment are checked, including the moveto point that starts a subpath and
may never appear as any segment's endpoint.

The checker is itself tested: `tests/icons.test.mjs` feeds it a set of drawings
that must be rejected, one per prohibition. The rule above is therefore a check
rather than a promise — the same treatment rule 3's weights get in
`tests/tokens.test.mjs`.

## 13. A state is an attribute, and the appearance follows it

Every state this language draws is keyed off an attribute the element already
carries, never off a class invented to describe the look. `[aria-current]` on a
rail item, a tab, a table row and a picked panel. `[aria-pressed="true"]` on a
pill. `[aria-selected="true"]` on a listbox option. `[aria-disabled="true"]`
beside `:disabled`, in 26 places. `[aria-sort]` on the sorted column,
`[aria-expanded]` on the thing that opens. One spelling per semantics, and the
semantics decides which — not the appearance, which is why a rail item and a
picked panel share `[aria-current]` while looking nothing alike.

The reason is not tidiness. **A state that exists only as an appearance is not a
state.** A consumer that marks the chosen card with a class has drawn a mark
sighted users can see and told everyone else nothing, and no amount of styling
fixes it from our side — the information was never in the document. Keying the
style off the attribute makes the two inseparable: you cannot get the look
without emitting the state, and you cannot emit the state and fail to get the
look.

This is also what stops the language growing a second vocabulary. An invented
`--selected` modifier would be a synonym for `[aria-current]` that a screen
reader cannot read, and the two would drift the first time one of them got a
tweak. There is no `.axi-panel--selected` for the same reason there is no
`.axi-btn--off`.

Two consequences when adding a component:

- **Find the attribute before writing the rule.** If the state the component
  needs already has an ARIA spelling, use it, even if the look is unlike every
  other user of that attribute. If it genuinely has none, that is the moment to
  ask whether the state is real.
- **A state the markup holds needs no attribute at all.** A `<label>` wrapping
  its own radio is the correct markup for a picker; the input holds the state,
  so the label has nothing to set, and copying it onto the label would be a
  second source of truth that can disagree with the first. That case is matched
  structurally — `:has(> input:checked)`, the language's only `:has()`, with the
  child combinator load-bearing: a descendant match would fire on any checkbox
  buried in the component's content.

`tests/tokens.test.mjs` holds this rule to the components that carry it, so it
is a check rather than a promise.

## Tokens

Three layers, in `src/tokens.css` — the only file permitted to contain a colour
literal.

- **Surface & text** — `--axi-ground`, `--axi-surface`, `--axi-surface-raised`,
  `--axi-surface-float`, their three `-paint` companions (the same surfaces as a
  single `<color>`, for `fill`, `color-mix()` and the `*-color` properties),
  `--axi-ink-line`, `--axi-ground-deep`, `--axi-rule`, `--axi-text`,
  `--axi-text-dim`, `--axi-text-faint`, `--axi-scrim`
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

### Layer stack

Every `z-index` in this language is one of the layers below, and a component
that needs to sit above something picks its layer here rather than inventing a
number. A number not in this table is a component shouting over the stack
instead of joining it.

| Layer | z-index | What sits here |
|---|---|---|
| Pinned column | 1 | `.axi-table--pinned`'s first column |
| Sticky head | 2 | `.axi-table--sticky`'s `thead th` |
| Table corner | 3 | where the two cross |
| Sticky chrome | 40 | `.axi-mast` |
| Popovers | 41 | `.axi-menu__pop`, `.axi-picker__pop` |
| Sheet scrim | 44 | `.axi-scrim--sheet` |
| Sheet | 45 | `.axi-sheet` |
| Scrim | 50 | `.axi-scrim` |
| Drawer | 51 | `.axi-drawer` |
| Toasts | 60 | `.axi-toasts` |
| Tooltip | 70 | `.axi-tooltip` |
| Modal | top layer | `dialog.axi-modal`, promoted by `showModal()` |

The modal has no number on purpose. A `<dialog>` opened with `showModal()` is
promoted to the browser's top layer, which sits above every `z-index` there is;
writing a number in that row would describe a competition the modal is not in.

The first three are sealed rather than low. `.axi-table__scroll` sets
`isolation: isolate`, so those numbers are resolved inside the scroll container
and never compete with the page layers under them - a table's sticky head
cannot climb over a mast, and a table inside a drawer cannot reach out of it.
They are listed because a table needs three orderings among its own cells and a
number that is never written down is a number that drifts; the isolation is
what keeps 1, 2 and 3 from meaning anything outside the table that declares
them.

A negative `z-index` inside a component's own `isolation` context — the sigil's
backing shape — is not a layer and is not listed. It is invisible outside the
component that owns it.

The scrim appears twice, and that is the table saying something rather than
repeating itself. A scrim's rung is not a property of the scrim; it is "directly
below the thing I dismiss", so a language with two dismissible surfaces at two
rungs has two scrims. Reading the single 50 as the scrim's own number is what
makes a sheet impossible to scrim: at 50 over the sheet's 45 the scrim covers
the sheet completely, every click lands on the dismiss handler, and the surface
opens dead. So when you add a dismissible surface, check whether it needs a
scrim rung directly beneath it, and add both rows together.

## Light mode

Not shipped. The system is *structured* for it: no component contains a colour
literal, so a light theme is a second palette block, not a rewrite. It is not
a token swap either — the saturated inks that read as vivid on near-black go
washed out on white and would need retuning.

When it does ship it ships as a theme, under the section below, with the same
1:1 obligation: light mode does not get a component the dark language lacks.

## The official accents

`--axi-accent` is the per-app theming surface, and the family now agrees on
what may go in it. The official accents live in `accents.json` — id, label,
hex — and `dist/accents.css` is generated from it: one
`[data-axi-accent="<id>"]` selector per accent, setting `--axi-accent` and
nothing else. An app opts in by importing `accents.css` alongside `axi.css`
and setting `data-axi-accent` on its root element; an app that renders a
picker reads `accents.json` for the ids and labels.

accents.json is the second sanctioned home for a colour literal, after
tokens.css — sanctioned because it is data the build generates from, not
stylesheet source. Adding an accent means editing accents.json and running
the build; hand-editing dist/accents.css is exactly as wrong as hand-editing
dist/axi.css.

The default remains `#ffc53d` Axi Gold, declared in tokens.css: an app that
sets no `data-axi-accent` is gold, and correctly themed.

## Themes

The palette in `tokens.css` is not "the default theme". It is the language, and
a theme is a repaint of it. Everything rules 1-11 describe — the outline, the
block, what a fill means, what the cool ink is reserved for — is defined once,
there, and a theme inherits all of it. Anything a theme cannot say by restating
a token is not a theme; it is a change to the language, and it goes through the
rules above like any other.

A theme is a generated stylesheet, `dist/themes/<id>.css`, built the way
`dist/accents.css` is: `themes/<id>.json` is the source of truth and the build
emits one `[data-axi-theme="<id>"]` block of custom properties, no structural
CSS. That makes `themes/*.json` the third sanctioned home for a colour literal,
after `tokens.css` and `accents.json`, and for the same reason as the second —
it is data the build generates from, not stylesheet source. Hand-editing
`dist/themes/glass.css` is exactly as wrong as hand-editing `dist/axi.css`. A consumer imports it beside `axi.css` and sets
`data-axi-theme` on its root element. That is the whole integration — which is
the point. A site gets the dark language by default and a different one by
adding an attribute, and in neither case does it author, carry or maintain a
line of theme CSS of its own.

**A theme mirrors the main theme one-for-one.** In both directions:

- **Nothing added.** No token a theme invents, no selector but its own root
  hook, and above all no component that exists only under a theme. There is no
  `.axi-panel--glass`, no glass-only card, no variant that appears when the
  attribute is set. A component that is worth having is worth having in the
  language; one that only makes sense translucent is a component the language
  does not have.
- **Nothing dropped.** A theme may not leave a token unset and a component
  unpainted. Every component renders under every theme, which is what makes the
  attribute a swap rather than a migration — a site can set it, unset it, or
  offer the choice to its users, and no markup changes either way.

The consequence worth stating plainly: **a new theme capability costs a
main-theme token first.** A glass theme wants a `backdrop-filter`; it does not
get to introduce one. `--axi-surface-filter` is declared in `tokens.css` with an
inert default (`none`), the surfaces read it unconditionally, and the theme
restates it. The main theme is unchanged in appearance and the hook is part of
the language rather than part of the theme. `--axi-ground-image` is the second
of these, on the same terms: the page's light, inert at `none`, read by `body`
and nowhere else. Every theme pays this toll, and it is what keeps the mirror
true: a token the theme could set that the main theme had never heard of is the
first step back toward theme-only components.

### What a theme may restate

Rules 1 and 2 name the relief a theme gets in the surface layer: a theme may
put a gradient on a surface and may hold a surface token at partial opacity. It
may not mute an ink. Read those two rules for why. A theme taking the gradient
half of that relief owes the `-paint` companion of every surface it grades —
see rule 1.

The relief is not confined to that layer, though, and the first draft of this
section said it was. **A theme may also restate the block and the corner** —
`--axi-shadow-*`, `--axi-border-*`, `--axi-radius` and `--axi-radius-sm`. Rule 3
requires that a raised element read as raised and an outlined one as outlined.
A hard offset block in the line ink is how the main theme answers that; a soft
drop with an inset top highlight is a different answer to the same question,
and a translucent panel wearing an opaque theme's block does not look like
glass, it looks like a bug. The block and the corner are how a theme says what
its material is.

What is **not** a theme's to restate, and each for its own reason:

- **The five saturated fills.** `--axi-accent`, `--axi-meta`, `--axi-ok`,
  `--axi-warn`, `--axi-danger` carry meaning (rules 5, 6, 9, 10). Their `-ink`
  companions are not on this list: `--axi-accent-ink` and `--axi-ink-on-fill`
  are the colour a word is written in when it sits on a fill, and a theme that
  lightens the outline has to be able to hold them dark.
- **The offset scale.** `--axi-offset-*` is what the main theme's block is
  composed *from*. A theme restates the composed `--axi-shadow-*` wholesale or
  leaves it; retuning the offsets underneath would leave the two spellings of
  "the block" disagreeing.
- **The measure.** `--axi-page`, `--axi-gutter`. Where the text wraps is not a
  look, and moving it would reflow every page rather than repaint it.
- **The type.** `--axi-sans`, `--axi-mono`, `--axi-t-*`, `--axi-ls-*`. The same
  call, harder: the type scale is the voice.

The line to hold is the one-for-one rule above, not a list of layers. A theme
that restates the block still paints every component; a theme that invents one
does not.

### A change to the language is not finished until every theme wears it

The one-for-one rule above is written as an obligation on a *theme* — here is
what a new theme owes the language. Read only that way it has a hole in it, and
the hole is every change that goes the other direction. A token added to
`tokens.css`, a component added to `src/`, a look retuned: each of those is a
change to the thing the themes are mirroring, and none of them is finished when
the main theme looks right. There are three themes — the language itself in
`src/tokens.css`, `flat`, and `glass` — and a change lands in all three or it
has not landed.

That is the symmetric half of the toll already stated above. **A new theme
capability costs a main-theme token first; a change to the main theme costs
every theme a look.** Neither direction is optional, and the second is the one
easy to skip, because the default theme is the one on screen while you work.

What "answered in every theme" means depends on the shape of the change:

- **A new token.** Every theme either restates it or can point at why it does
  not need to. Two reasons count. The default is inert — `--axi-surface-filter`
  and `--axi-ground-image` are `none`, so a theme that wants neither is already
  correct. Or the token aliases one the theme did restate —
  `--axi-surface-float: var(--axi-surface)`, so `flat` restating the surface
  restates the float with it. A token holding a literal of its own is answered
  by neither of those, and every theme has to say it. This is checked; see
  below.
- **A new component.** It renders under all three, and you look at it under all
  three. The gallery's theme switcher is there for exactly the reason the accent
  switcher is: a component that hard-coded something looks fine until you
  change the thing it hard-coded. A panel that reads as a panel on opaque slate
  can vanish on a translucent one.
- **A retuned look.** The `-paint` companions are the case that made this a
  section. Lifting them meant every surface a theme grades needs a flat
  companion beside it, and both themes had to be edited in the same commit as
  the tokens — edit one and the other hands a gradient straight to
  `background-color`, which is not a subtle failure but it is an invisible one
  from the theme you happened to be looking at.

**What is mechanically enforced.** `tests/themes.test.mjs` reads every
`dist/themes/*.css` and checks the mirror rather than trusting it: the file
contains exactly one rule, its selector is `[data-axi-theme="<id>"]` for the
`<id>` in its own filename, every declaration in it is a custom property with a
non-empty value, and every property it declares is already declared in
`tokens.css`. A theme-only component fails the first check, because drawing one
takes a second selector. An invented token fails the last. The suite passes
vacuously while no theme exists, and binds the moment the first file lands.

The section above is checked from the other side by the same file: a token that
*any* theme restates must be restated by *every* theme, unless that theme
inherits an answer already — the main-theme default is inert, or the token
aliases another the theme did restate, and the check follows the alias chain
rather than taking the two reasons on trust. So a token one theme has an opinion
about cannot be a token another theme forgot. What no test can check is the
third bullet, the look you did not look at: a component can paint under all
three themes and still be wrong under two of them, and the only instrument for
that is the theme switcher in the gallery.

## Adding a component

1. Which rule justifies it? If none, write the rule first or stop.
2. Build it from the existing primitives. A shell that redefines `.axi-panel`
   instead of using it will drift the first time the panel changes.
3. No colour literals. No third form step. No theme-only variant — see
   [Themes](#themes).
4. Add it to the gallery, and check it with the accent switcher — if it does
   not follow the accent, it hard-coded something.
5. Then check it with the theme switcher, under all three — the language,
   `flat` and `glass`. Translucent surfaces and a 16px corner break different
   things than opaque ones do, and a component is not done until it reads right
   under each. See [Themes](#themes).
6. `npm run build` and commit `dist/axi.css` with your source change.

### A style only reachable through a layer will be re-invented

If a style lives at `.some-layer .thing` and nowhere else, then it exists for
consumers who adopted that layer and for nobody else. Every other consumer that
needs the same object has to adopt a whole layer to reach one declaration — and
what it does instead is draw its own. That is not a hypothetical: `.axi-prose
code` was the language's only word for a quoted literal, and a consumer with six
literals in its interface copy — none of them in prose — had written three
different boxes for them, the sixth having given up and drawn none.

So when a layer-scoped style names an object that can appear outside that layer,
give the object its own class and put **both selectors on one rule**. Not two
rules that agree: one rule. `.axi-code, .axi-prose code { … }`. Two rules that
agree today are two rules that disagree after the next edit, and that is how the
same object ends up with two appearances inside one language — the defect this
whole section exists to prevent.

The test to write is not "does `.axi-code` exist". It is "are both spellings in
the same rule", because only the second one fails when someone splits them.

This has now happened twice. `.axi-prose a` was the language's only word for a
link, and the same consumer had fifteen hand-spelled ones — a third of them
`<button>`s calling a desktop bridge rather than anchors at all, which is what
made the drift concrete rather than theoretical: an `<a href>` draws its own
underline and a `<button>` does not, so the two spellings were not merely
allowed to come apart, they had already come apart. When you lift a
layer-scoped style out, look for the declarations the layer was getting for
free from its element. Those are the ones the new spelling silently loses.

Two instances is a pattern, so the check belongs at the top of the list when
adding anything: grep `src/` for the component's style living behind a layer
prefix. If it does, it has consumers you cannot see, and they have already
drawn their own.

### A refusal holds at every level, not just the one it was written for

The rail refuses two accent fills inside itself. That is why
`.axi-rail__subitem` is brightened text and not a second filled row: with two
fills the reader has to decide which of them answers "where am I", and the
answer to one question cannot be two things.

Written that way, the refusal sounds like it is about indentation. It is not.
It is about how many times one screen may claim to be a place, and nesting a
whole rail inside a panel is the same arithmetic as nesting a row inside a
rail. A stats page with a category rail down the side and a twenty-row metric
picker inside each section has two rails, both correct on their own, and both
filled — so the screen makes the claim twice and neither wins. The app that
hit this had already reasoned its way to the same conclusion and written the
quiet treatment by hand, in its own stylesheet, with a comment giving exactly
this reason. Two parties deriving the same rule independently is the signal
that the rule belongs in the language, not in either party's override file.

So when adding a component, take every refusal the neighbouring components
state and ask what it is really counting. If the answer is "per screen" rather
than "per box", the component needs a way to stand down — and the modifier is
cheaper than the override every consumer writes instead. `.axi-rail__nav--quiet`
is that: the fill goes, the accent stays as the leading edge, and nothing else
moves.

What the modifier must not do is reach for the weaker treatment that already
exists. A subitem drops the fill *and* the weight, which is right for a few
leaves under an open category and wrong for a picker that is the primary
control of its own panel — there, brightened text loses the selection in the
list. Standing down is one step, not two.
