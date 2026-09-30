# axi-design

The design language for the [axi suite](https://axi.wiki) — flat and outlined,
dark, drawn in saturated ink.

One CSS file. No build step for consumers, no dependencies, no JavaScript.

## Use it

On the web, link the published file:

```html
<link rel="stylesheet" href="https://darkharasho.github.io/axi-design/v1/axi.css">
```

In an app that bundles — anything on Vite, and every Electron app in the suite
— install it and import the stylesheet instead:

```bash
npm install @axiapps/axi-design
```

```js
import '@axiapps/axi-design/axi.css'
```

There is a third case: an app that already draws its own components through
its own CSS variables, and wants to point them at ours rather than be
rewritten. That app wants the palette without the components:

```js
import '@axiapps/axi-design/tokens.css'
```

`--bg-card: var(--axi-surface)` and the like is then the whole port, and the
values can never drift — which is what happens the moment the token block is
copied into the consumer by hand.

The two are not interchangeable. A `<link>` to the Pages URL is a network
request at load, which is correct for a site and wrong for a desktop app: an
Electron window opened offline renders unstyled, and one opened online pays a
round-trip before it can paint. Bundling resolves the file at build time, so
the app ships with it.

Either way, set your accent:

```css
:root { --axi-accent: #b06bff; }
```

That is the whole theming surface. See [the documentation
site](https://darkharasho.github.io/axi-design/) for every component, with live
accent and theme switchers in the masthead. `/gallery/` still holds the
everything-at-once view.

### An icon set of its own

Fifty-seven glyphs drawn to [rule 12](docs/RULES.md) — a 24 canvas, a 3px
stroke, mitered joins, square corners, and no angle that is not 0°, 45° or 90°.
They take their ink from whatever they sit in, so a glyph inside an accent
button turns accent-ink with the label and follows every accent and theme
switch with no extra rule.

```html
<svg class="axi-icon"><use href="node_modules/@axiapps/axi-design/dist/icons/sprite.svg#axi-search"/></svg>
```

**One caveat, and it matters for Electron.** A `<use>` pointing into a separate
file is a cross-document reference, and those are same-origin: over `http(s)`
from your own origin it works and the glyph inherits `currentColor` (measured in
Chromium 150). Under `file://` — which is how an Electron window opened with
`loadFile()` runs — the reference resolves to nothing and the icon is silently
absent, no error, no fallback. In that case do one of two things: inline
`dist/icons/sprite.svg` into the document once (a hidden `<svg>` before
`</body>`, which is what this project's own docs site does) and reference bare
fragments like `#axi-search`, or use the standalone `dist/icons/<name>.svg`
files. Serving the renderer over `http://localhost` also works. Note that
alias names resolve only through the sprite — there is no
`dist/icons/triangle-alert.svg` — so the standalone-file route wants the
canonical name.

One sprite holds the set; `dist/icons/<name>.svg` is the same drawing on its own,
and `dist/icons/icons.json` is the catalogue — name, categories, aliases and
keywords — for an app that wants to build a picker. A Lucide name this set
answers to under a different one — `triangle-alert`, `alert-circle`, `loader-2` —
resolves in the sprite too, so porting off `lucide-react` is a rename rather than
a call-site audit. Where the set will not draw a shape at all, the
[icons page](https://darkharasho.github.io/axi-design/icons/#substitutions) says
what to use instead. Size a glyph with `--axi-icon-size`. The vocabulary derives from [Lucide](https://lucide.dev)
under the ISC licence (`icons/LICENSE-LUCIDE`); none of the path data does.
Browse the set at [`/icons/`](https://darkharasho.github.io/axi-design/icons/).

### A different look, without carrying one

If the flat dark ground is not what your app wants, import a theme beside the
stylesheet and set one attribute:

```js
import '@axiapps/axi-design/axi.css'
import '@axiapps/axi-design/themes/glass.css'
```

```html
<html data-axi-theme="glass">
```

`glass` repaints the material: translucent panels lit from the top-left over a
near-black page with three wide colour washes on it, hairline edges, rounded
corners and a soft drop instead of the main theme's hard offset block, with
popovers, drawers and modals blurring what sits behind them. The five saturated
inks, the measure and the type are untouched — they are the language, not the
paint. Remove the attribute and you are back on the main theme with no other
change: a theme restates tokens and never adds a component, so nothing in your
markup knows which one is on. That is the point — the look is maintained here
rather than copied into your app as a custom theme that then has to be kept in
step.

The main theme is the language and a theme is a repaint of it — [the
rules](docs/RULES.md#themes) say what a theme may and may not do.

## Per-instance knobs

These custom properties are read with a fallback and never declared on the
component, so you can set one on a single element or on any ancestor and it
cascades. They are **not** theme tokens: setting them in `:root` is legal but
meaningless for most of them, because they answer "how wide is *this* grid",
not "what does the system look like". Everything else is
[`docs/RULES.md`](docs/RULES.md) territory.

<!-- axi:knobs -->
| Knob | Sets | Fallback | Example |
|---|---|---|---|
| `--axi-pill-fill` | the fill a pressed `.axi-pill` takes | `var(--axi-accent)` | `<button class="axi-pill" aria-pressed="true" style="--axi-pill-fill: var(--axi-danger)">` |
| `--axi-switch-fill` | the fill an on `.axi-switch` takes | `var(--axi-accent)` | `<button class="axi-switch" aria-checked="true" style="--axi-switch-fill: var(--axi-danger)">` |
| `--axi-switch-w` | a `.axi-switch`'s track width | `46px` | `<button class="axi-switch" style="--axi-switch-w: 32px">` |
| `--axi-switch-h` | a `.axi-switch`'s track height | `26px` | `<button class="axi-switch" style="--axi-switch-h: 18px">` |
| `--axi-switch-knob` | a `.axi-switch`'s slug (knob) size | `16px` | `<button class="axi-switch" style="--axi-switch-knob: 11px">` |
| `--axi-check-size` | the size of an `.axi-check` or `.axi-radio` box | `22px` | `<input type="checkbox" class="axi-check" style="--axi-check-size: 16px">` |
| `--axi-check-fill` | the fill a checked `.axi-check` takes, and the colour of a checked `.axi-radio`'s diamond | `var(--axi-accent)` | `<input type="checkbox" class="axi-check" style="--axi-check-fill: var(--axi-danger)">` |
| `--axi-textarea-h` | the minimum height of a `<textarea class="axi-input">` | `90px` | `<textarea class="axi-input" style="--axi-textarea-h: 200px">` |
| `--axi-btn-pad` | the padding inside an `.axi-btn`. The three named steps set it for you; reach for the knob only for a size they do not cover | `12px 20px` | `<button class="axi-btn" style="--axi-btn-pad: 3px 7px">` |
| `--axi-btn-size` | an `.axi-btn`'s text size, which travels with its padding | `13px` | `<button class="axi-btn" style="--axi-btn-size: 10px">` |
| `--axi-pill-pad` | the padding inside an `.axi-pill`. The same scale and the same two named steps as the button, because a pill is a button that holds a state | `12px 20px` | `<button class="axi-pill" style="--axi-pill-pad: 3px 7px">` |
| `--axi-pill-size` | an `.axi-pill`'s text size, which travels with its padding | `13px` | `<button class="axi-pill" style="--axi-pill-size: 10px">` |
| `--axi-input-pad` | the padding inside an `.axi-input`, for a field that is furniture in a header rather than a control on a page | `11px 12px` | `<input class="axi-input" style="--axi-input-pad: 7px 12px">` |
| `--axi-input-size` | an `.axi-input`'s text size, which travels with its padding | `14px` | `<input class="axi-input" style="--axi-input-size: 13px">` |
| `--axi-action-hit` | the hit target of an `.axi-action--glyph`, whose label is one character and gives the pointer nothing to land on | `24px` | `<button class="axi-action axi-action--glyph" style="--axi-action-hit: 32px">` |
| `--axi-well-pad` | the padding inside an `.axi-well` | `10px` | `<div class="axi-well" style="--axi-well-pad: 18px">` |
| `--axi-well-radius` | an `.axi-well`'s corner radius, for a well used at reading scale rather than page scale | `var(--axi-radius)` | `<div class="axi-well" style="--axi-well-radius: var(--axi-radius-sm)">` |
| `--axi-rail-w` | an `.axi-rail`'s width, for labels longer than the default holds | `208px` | `<aside class="axi-rail" style="--axi-rail-w: 260px">` |
| `--axi-rail-pad` | the padding inside an `.axi-rail` | `10px` | `<aside class="axi-rail" style="--axi-rail-pad: 6px">` |
| `--axi-toolbar-pad` | the padding inside an `.axi-toolbar` | `14px` | `<div class="axi-toolbar" style="--axi-toolbar-pad: 4px 7px">` |
| `--axi-dock-pad` | the padding inside an `.axi-dock` | `12px 16px` | `<div class="axi-dock" style="--axi-dock-pad: 6px 10px">` |
| `--axi-avatar-size` | the size of an `.axi-avatar` square | `40px` | `<span class="axi-avatar" style="--axi-avatar-size: 28px">MS</span>` |
| `--axi-modal-width` | the maximum width of an `.axi-modal`, before the viewport clamp | `560px` | `<dialog class="axi-modal" style="--axi-modal-width: 760px">` |
| `--axi-card-strip` | the colour of `.axi-card--strip`'s top strip | `var(--axi-accent)` | `<a class="axi-card axi-card--strip" style="--axi-card-strip: var(--axi-ok)">` |
| `--axi-grid-min` | minimum column width in `.axi-grid` | `300px` | `<div class="axi-grid" style="--axi-grid-min: 240px">` |
| `--axi-split-nav-w` | the width of an `.axi-split`'s picker column | `280px` | `<div class="axi-split" style="--axi-split-nav-w: 180px">` |
| `--axi-split-gap` | the parting between an `.axi-split`'s picker and its body | `10px` | `<div class="axi-split" style="--axi-split-gap: 16px">` |
| `--axi-split-nav-h` | the picker's height cap once an `.axi-split` has stacked under 640px | `200px` | `<div class="axi-split" style="--axi-split-nav-h: 140px">` |
| `--axi-row-gap` | gap between `.axi-row` children | `10px` | `<div class="axi-row" style="--axi-row-gap: 6px">` |
| `--axi-stack-gap` | gap between `.axi-stack` children | `12px` | `<div class="axi-stack" style="--axi-stack-gap: 20px">` |
| `--axi-panel-pad` | `.axi-panel`'s own padding | `26px` | `<div class="axi-panel" style="--axi-panel-pad: 14px">` |
| `--axi-page-pad` | `.axi-page`'s horizontal gutter | `var(--axi-gutter)` | `<div class="axi-page axi-page--narrow" style="--axi-page-pad: 0">` |
| `--axi-palette-w` | the widest an `.axi-palette__panel` gets (it fills the room below that) | `560px` | `<div class="axi-palette__panel" style="--axi-palette-w: 720px">` |
| `--axi-palette-top` | how far down the screen an `.axi-palette` opens | `12vh` | `<div class="axi-scrim axi-palette" style="--axi-palette-top: 6vh">` |
| `--axi-menu-width` | width of `.axi-menu__pop` | `310px` | `<div class="axi-menu__pop" style="--axi-menu-width: 380px">` |
| `--axi-drawer-width` | width of `.axi-drawer` (capped at `100vw`) | `560px` | `<aside class="axi-drawer" style="--axi-drawer-width: 720px">` |
| `--axi-sheet-top` | where an `.axi-sheet`'s top edge sits, for an app whose own chrome starts above it | `0` | `<div class="axi-sheet" style="--axi-sheet-top: 2.5rem">` |
| `--axi-sheet-pad` | the padding inside an `.axi-sheet` | `12px 16px` | `<div class="axi-sheet" style="--axi-sheet-pad: 0">` |
| `--axi-series` | the ink a meter fill, bar, plot line or `.axi-diamond--series` is drawn in | `var(--axi-accent)` | `<span class="axi-meter__fill" style="--axi-series: var(--axi-ok)">` |
| `--axi-meter-v` | how full one `.axi-meter__fill` is | `0%` | `<span class="axi-meter__fill" style="--axi-meter-v: 62%">` |
| `--axi-meter-h` | height of a `.axi-meter` | `12px` | `<div class="axi-meter" style="--axi-meter-h: 18px">` |
| `--axi-meter-label` | the label column width of `.axi-meter-list` | `132px` | `<div class="axi-meter-list" style="--axi-meter-label: 180px">` |
| `--axi-meter-value` | the value column width of `.axi-meter-list` | `62px` | `<div class="axi-meter-list" style="--axi-meter-value: 80px">` |
| `--axi-bar-v` | height of one `.axi-bars__col` | `0%` | `<div class="axi-bars__col" style="--axi-bar-v: 78%">` |
| `--axi-bar-part` | height of one `.axi-bars__part` within its column | `0%` | `<span class="axi-bars__part" style="--axi-bar-part: 40%">` |
| `--axi-bars-gap` | gap between columns in `.axi-bars` | `6px` | `<div class="axi-bars" style="--axi-bars-gap: 2px">` |
| `--axi-plot-h` | height of a `.axi-plot` or `.axi-bars` | `180px` | `<div class="axi-plot" style="--axi-plot-h: 240px">` |
| `--axi-plot-rows` | how many horizontal rules a `.axi-plot` draws | `4` | `<div class="axi-plot" style="--axi-plot-rows: 6">` |
| `--axi-tick-w` | the width of one `.axi-ticks__tick` | `5px` | `<div class="axi-ticks" style="--axi-tick-w: 7px">` |
| `--axi-tick-h` | the height of an `.axi-ticks` strip, and so of every mark in it | `15px` | `<div class="axi-ticks" style="--axi-tick-h: 22px">` |
| `--axi-ticks-gap` | the gap between marks in `.axi-ticks` | `3px` | `<div class="axi-ticks" style="--axi-ticks-gap: 2px">` |
| `--axi-spinner-size` | the size of an `.axi-spinner` | `20px` | `<span class="axi-spinner" style="--axi-spinner-size: 34px"></span>` |
| `--axi-icon-size` | an `.axi-icon`'s box, both dimensions | `1.25em` | `<svg class="axi-icon" style="--axi-icon-size: 2rem"><use href="#axi-search"/></svg>` |
<!-- /axi:knobs -->

`--axi-page-pad: 0` is the one to know about: it is how a measure nested
inside another measure avoids paying the gutter twice.

## Versioning

Published under `v<major>/`, and **`v1/` is append-only** — it will keep
serving for as long as the Pages site exists. Non-breaking fixes republish
`v1/axi.css` in place; anything that would break a consumer goes to `v2/`. No
consumer should ever wake up to a changed class name.

npm carries the exact version instead: `@axiapps/axi-design@1.6.0` is that
build and no other, which is what a lockfile is for. The Pages URL and the
package therefore answer different questions — "the current v1" and "the
version I built against" — and a bundling app should always prefer the second.

## Develop

```bash
npm install
npm run build   # src/*.css -> dist/axi.css
npm test
npm run serve   # builds the docs site and serves it at http://localhost:4173
```

`dist/axi.css` is committed, because the release workflow publishes that exact
file. A test asserts it matches its sources, so a source edit that skips the
rebuild fails rather than shipping stale CSS.

The rules the system is built on are in [docs/RULES.md](docs/RULES.md). Read
them before adding a component.

## Licence

MIT. The suite's apps are GPL; the language they are drawn in is not, so
anything can use it.
