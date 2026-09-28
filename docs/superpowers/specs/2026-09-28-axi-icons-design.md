# axi-icons: the language draws its own glyphs

**Status:** approved in chat 2026-09-28, pending written review

## Goal

A first-party icon set for the axi suite: Lucide's vocabulary — its inventory,
its metaphors, its names — redrawn in this language's hand. Forty-eight icons
shipped, built so that four hundred is a matter of adding files rather than of
revisiting any decision here.

The set ships as SVG. No icon font, no JavaScript, no framework components.

## The gap it closes

Every icon in the system today is borrowed. `docs/manifest/primitives.mjs:233`
fills a notice with a literal `!`; the search field at `:207` uses `⌕`; the
notice examples reach for `✓`. These render in whatever font the OS hands
Chromium, which makes them the one part of the language whose appearance the
language does not control — a design system that specifies its border weight
to the pixel and then lets Segoe UI Symbol draw its checkmark.

The shapes the language *does* draw — `.axi-diamond`, the select caret's two
meeting gradients, the search glyph's centring — are each one component's
private solution. They are not a set and cannot be asked for by name.

## What this is not

- **Not a tracing of Lucide.** Lucide's grammar is the opposite of this one:
  2px strokes, round caps, round joins, 2px corner radii, circles everywhere.
  Not one path is copied. What is taken is the part that takes years —
  which shape means "archive", and what that shape is called.
- **Not an icon font.** A font brings a ligature API, a FOUT, and glyphs the
  screen reader may read aloud. The sprite has none of those problems.
- **Not JavaScript.** `package.json`'s `//exports` note is explicit that there
  is no JS here to be a default export, and this does not change that. Static
  assets only, framework-agnostic, identical in Electron and browser.
- **Not two-tone.** An icon carries no colour of its own. It inherits
  `currentColor` and is whatever ink it sits in. A glyph with an accent-ink
  detail would be colour that encodes nothing, which rule 5 rejects on chips
  and rule 10 rejects in charts.

## Doctrine

### Rule 12 — an icon is drawn in the language's angles, at control weight

`docs/RULES.md` states that a component which cannot be justified by one of
the rules needs a new rule written for it. An icon cannot be justified by the
existing eleven, so this round adds the twelfth, and the drawing contract
below is its body. It is added to `docs/RULES.md` as part of this work, not
afterwards.

**The contract:**

| | |
|---|---|
| Canvas | 24×24 `viewBox`, live area inset 1.5px on every side |
| Stroke | 3px — `--axi-border-control`, the weight of the button the icon sits in |
| Colour | `currentColor`, always; `fill="none"` unless the shape is a solid mark |
| Terminals | butt caps (SVG's default), mitered joins |
| Corners | radius 0, matching `--axi-radius` |
| Angles | 0°, 45° and 90° only |
| Curves | none — no `A`, `C`, `S`, `Q` or `T` in any path |
| Coordinates | every coordinate a multiple of 0.5; an axis-aligned stroke's centerline on an odd half-integer, or on the centre axis at 12 |

**Why 3px and not 2px.** 2px is `--axi-border-hairline`, which rule 3 reserves
for a line drawn *inside* content — the rules between table rows, a plot's
gridlines — and says explicitly is never the outline on a raised thing. An
icon is an object, not a rule. The objects in this language are outlined at
`--axi-border-control`, and an icon at 3px sits inside a 3px-bordered button
as one drawing rather than as a thin thing inside a heavy frame.

**Why half-integers.** A 3px stroke is centred on its path, so a centerline at
`x = 3.5` puts its edges at 2 and 5 — whole pixels, no straddle, no grey fringe
at 1× on the 24px rendering the set is tuned for. A centerline on a whole
integer would put both edges on half-pixels.

The rule has two deliberate limits, and stating them is what makes it
enforceable rather than aspirational:

- **It binds only axis-aligned strokes.** A 45° segment is antialiased at any
  offset, so demanding a particular one buys nothing and would forbid
  legitimate geometry.
- **The centre axis at 12 is exempt.** On a 24 canvas a centred stroke spans
  10.5–13.5 — a stroke can be centred or aligned, not both, and for the
  handful of glyphs built around a centre line (`plus`, the bang in `alert`,
  the hands of `clock`) symmetry is the more valuable of the two. The
  exemption is exactly one coordinate wide so it cannot spread.

This is the one part of the contract that is about rendering rather than form,
and it is why the set reads crisp without `shape-rendering: crispEdges` — which
would wreck every 45° segment in the set.

**Why no curves.** This language has no rounded corner anywhere (rule 3, "the
corner is square"), and its family motif is a rotated square (rule 7). A set
with an arc in it would be a set with an exception in it, and the exception is
the first place the eye finds the seam. The absence is also what makes the set
mechanically checkable — see Testing.

### The translation rules

Lucide's vocabulary reaches this grammar through seven mechanical moves.
Mechanical is the point: four hundred icons stay one set only if the
translation is a procedure rather than a series of judgements.

1. **A circle becomes a diamond when it is a node** — a lens, a head, a dot,
   a knob, a joint. This is rule 7's motif doing real work rather than
   decorating.
2. **A circle becomes a square when it is a boundary** — a clock face, a
   frame, a container, an avatar ring. The diamond frame reads as a warning
   sign, so it is spent only where warning is the meaning: `circle-alert` and
   its status siblings take the diamond, `clock` and `circle-user` take the
   square. The octagon was considered as a third frame shape and rejected —
   it is a form the language has never used, and rule 3's argument against a
   third weight step applies to shapes for the same reason.
3. **Every corner radius goes to zero.**
4. **Round caps and joins become butt and miter.** This single move does most
   of the work of making the set read as one family.
5. **2px becomes 3px.**
6. **Every angle snaps to 0°, 45° or 90°.** An arbitrary angle is the tell
   that a glyph came from another system.
7. **The name stays Lucide's.** `trash-2` stays `trash-2`. An app moving off
   Lucide changes an import, not every call site, and a developer who knows
   Lucide's names already knows this set's.

Where a translation costs the metaphor rather than only the geometry — where
the honest shape genuinely is round and no square or diamond says the same
thing — the icon is **not shipped**. A wrong glyph is worse than an absent
one, and the absence is a design note for the next round rather than a
failure.

**Not shipped, and why**

- **`star`.** A star's edges are the one shape this grammar genuinely cannot
  approximate. A five-point star needs 36° and 72°; a four-point star drawn at
  45° has a mathematical floor on how deep its concave vertices can go — the
  inner radius cannot fall below `R/√2`, which is exactly an octagon. Every
  version of it read as a lumpy diamond rather than a star. Nothing in the axi
  suite currently needs a favourite/rating mark; when something does, the
  answer is likely to be the existing `.axi-diamond` filled, which is already
  how rule 5 says status is drawn, rather than a star at all.

The working set is therefore **47 icons**, not the 48 the goal named. The
missing one is named here rather than made up elsewhere.

### Licensing

Lucide is ISC-licensed and permits derivative works provided the copyright
notice is retained. Deriving the vocabulary this way is squarely within that,
and the notice ships as `icons/LICENSE-LUCIDE` with a line in the icons
docs page stating the derivation. Cheap, and not the kind of thing to
discover after publishing.

## Structure

### Source

One SVG per icon, in `icons/<name>.svg`, hand-written, hand-checked, no build
tooling in the source. Each file is the naked drawing:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="3" stroke-linejoin="miter">
  <path d="M9.5 3.5 L15.5 9.5 L9.5 15.5 L3.5 9.5 Z"/>
  <path d="M13.5 13.5 L20.5 20.5"/>
</svg>
```

A flat directory, not a categorised tree. The categories live in the manifest,
where they can change without renaming a file and breaking a consumer's
`<use>`.

### Build

`scripts/build.mjs` gains an icons step, following the shape the accents and
themes steps already have — data in the repo, artifact in `dist/`, generation
the only way the artifact comes to exist:

- `dist/icons/sprite.svg` — every icon as a `<symbol id="axi-<name>">`. One
  request, cached once, and `<use>` is the whole consumer API.
- `dist/icons/<name>.svg` — the individual files, for the cases a sprite does
  not serve: an `<img>` src, a CSS `mask-image`, an Electron tray icon.
- `dist/icons/icons.json` — `{ name, categories, aliases, keywords }` per
  icon, generated from `docs/manifest/icons.mjs`. This is what the docs page
  and any consumer-side picker read.

`package.json` `exports` gains three entries: `./icons/sprite.svg`,
`./icons/*.svg`, `./icons.json`. `files` gains `icons` and `dist/icons`.

### The consumer API

```html
<svg class="axi-icon" aria-hidden="true"><use href="…/sprite.svg#axi-search"/></svg>
```

`.axi-icon` is added to `src/primitives.css` and does two things: sizes the box
(`1.25em` square by default, overridable per instance with `--axi-icon-size`,
which joins the knob table) and keeps it from being squashed by a flex parent
(`flex: none`) or sitting off the text baseline (`vertical-align`). It sets no
colour, no stroke and no fill — the colour is inherited and the other two are
the drawing's, and a component that wants to change them is asking for a
different icon.

Sizing is by the box, not by a second drawing. **16px is the floor, not a
target**: below about 16 the 3px stroke starts to close up the interior of a
dense glyph like `trash-2`. A second optical drawing per icon was considered
and rejected — it doubles the drawing cost of every icon forever, which is
exactly the cost that makes a four-hundred-icon set unaffordable. Where a
consumer genuinely needs 12px, the answer is a simpler icon, not a second
drawing of a complex one.

### Docs

A new page, `/icons`, generated from `icons.json`: the full grid, searchable
by name, alias and keyword through the machinery `docs/site/` already has, with
the copyable `<use>` snippet per icon. `'icons'` joins `RESERVED_IDS` in
`docs/manifest/index.mjs` so no component can take the route.

The drawing contract is documented twice, deliberately: rule 12 in
`docs/RULES.md` is the law, and the icons page carries the practical version —
the grid, the translation table, and what to do when a shape resists.

## Testing

The grammar is mechanically enforceable, which is the strongest argument for
the constraints being this tight. `tests/icons.test.mjs` parses every path in
`icons/*.svg` and asserts:

- **No curves.** No `A`, `C`, `S`, `Q` or `T` command in any `d` attribute.
  One regex, and it is the whole no-arc rule.
- **Every angle legal.** Each segment's `dx`/`dy` is either axis-aligned or
  `|dx| == |dy|`. This is rule 12's 0°/45°/90° as an assertion rather than an
  aspiration, and it is the check that would have caught every icon I have
  ever seen drift out of a set.
- **Every coordinate on the 0.5 grid and inside the live area**, and every
  axis-aligned segment's constant coordinate on an odd half-integer or at 12.
- **Uniform attributes.** `viewBox` is `0 0 24 24`, `stroke` is
  `currentColor`, `stroke-width` is `3`, joins are mitered. A solid mark — the
  diamond knob on `settings`, a filled dot — is the one shape permitted to
  carry `fill="currentColor"`, and it carries no stroke.
- **No colour literal anywhere in the set.** The same prohibition
  `tests/tokens.test.mjs` enforces on component CSS, applied to the drawings —
  an icon with a hex in it is an icon that ignores its theme.
- **Sprite and manifest agree with the directory.** Every file has a manifest
  entry and a symbol; no entry names a file that does not exist. This is the
  check that keeps the docs page honest as the set grows.

`tests/build.test.mjs` gains the sprite generation; `tests/site.test.mjs` gains
the `/icons` route.

## Milestones

**M1 — the set proves itself on the repo's own glyphs.** Ten icons: `search`,
`check`, `circle-alert` (diamond), `info`, `x`, `chevron-down`,
`chevron-right`, `plus`, `trash-2`, `folder`. The build step, the sprite, the
test file, rule 12, and the replacement of every borrowed Unicode glyph in
`docs/manifest/`. At the end of M1 nothing in this repo renders an icon in a
system font, and the machinery is proven on a set small enough to redraw if
the grammar turns out wrong.

**M2 — the working set.** Out to forty-eight, covering what an axi app
actually reaches for: files and folders, users, settings, media transport,
arrows and chevrons in four directions, external link, copy, download, upload,
edit, filter, sort, calendar, clock, lock, refresh, and the status family.
Plus the `/icons` docs page and the manifest.

**M3 — the door to a full set.** No new icons. A `CONTRIBUTING` section in the
icons docs covering the grid, the seven translation moves and what the test
enforces, so the next hundred can be drawn by someone who was not in this
conversation. This milestone is what makes the set a project rather than a
batch, and it is small precisely because the constraints did the work.

## Out of scope

- Framework component wrappers (`<AxiIcon>`). If the apps want them, they are
  a separate package that reads `icons.json`; adding React to this package's
  dependency graph is a different decision from adding icons to it.
- A solid/filled variant of the set. The earlier exploration drew one and it
  is genuinely the best thing on a status tile, but it is a second drawing per
  icon — the same cost the optical-size variant was rejected for. It comes
  back as its own round if the tile case proves it necessary.
- Animated icons. Rule 11 would govern them and rule 4 rations motion; neither
  question needs answering to ship a static set.
- Brand/logo marks. The sigil is a shell concern and already exists.
