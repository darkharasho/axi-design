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
npm install github:darkharasho/axi-design#v1.4
```

```js
import 'axi-design/axi.css'
```

The two are not interchangeable. A `<link>` to the Pages URL is a network
request at load, which is correct for a site and wrong for a desktop app: an
Electron window opened offline renders unstyled, and one opened online pays a
round-trip before it can paint. Bundling resolves the file at build time, so
the app ships with it.

Either way, set your accent:

```css
:root { --axi-accent: #b06bff; }
```

That is the whole theming surface. See [the pattern
gallery](https://darkharasho.github.io/axi-design/) for every component, with a
live accent switcher.

## Per-instance knobs

These custom properties are read with a fallback and never declared on the
component, so you can set one on a single element or on any ancestor and it
cascades. They are **not** theme tokens: setting them in `:root` is legal but
meaningless for most of them, because they answer "how wide is *this* grid",
not "what does the system look like". Everything else is
[`docs/RULES.md`](docs/RULES.md) territory.

| Knob | Sets | Fallback | Example |
|---|---|---|---|
| `--axi-pill-fill` | the fill a pressed `.axi-pill` takes | `var(--axi-accent)` | `<button class="axi-pill" aria-pressed="true" style="--axi-pill-fill: var(--axi-danger)">` |
| `--axi-switch-fill` | the fill an on `.axi-switch` takes | `var(--axi-accent)` | `<button class="axi-switch" aria-checked="true" style="--axi-switch-fill: var(--axi-danger)">` |
| `--axi-switch-w` / `--axi-switch-h` / `--axi-switch-knob` | a `.axi-switch`'s track and slug size | `46px` / `26px` / `16px` | `<button class="axi-switch" style="--axi-switch-w: 32px; --axi-switch-h: 18px; --axi-switch-knob: 11px">` |
| `--axi-card-strip` | the colour of `.axi-card--strip`'s top strip | `var(--axi-accent)` | `<a class="axi-card axi-card--strip" style="--axi-card-strip: var(--axi-ok)">` |
| `--axi-grid-min` | minimum column width in `.axi-grid` | `300px` | `<div class="axi-grid" style="--axi-grid-min: 240px">` |
| `--axi-row-gap` | gap between `.axi-row` children | `10px` | `<div class="axi-row" style="--axi-row-gap: 6px">` |
| `--axi-stack-gap` | gap between `.axi-stack` children | `12px` | `<div class="axi-stack" style="--axi-stack-gap: 20px">` |
| `--axi-panel-pad` | `.axi-panel`'s own padding | `26px` | `<div class="axi-panel" style="--axi-panel-pad: 14px">` |
| `--axi-page-pad` | `.axi-page`'s horizontal gutter | `var(--axi-gutter)` | `<div class="axi-page axi-page--narrow" style="--axi-page-pad: 0">` |
| `--axi-menu-width` | width of `.axi-menu__pop` | `310px` | `<div class="axi-menu__pop" style="--axi-menu-width: 380px">` |
| `--axi-drawer-width` | width of `.axi-drawer` (capped at `100vw`) | `560px` | `<aside class="axi-drawer" style="--axi-drawer-width: 720px">` |
| `--axi-series` | the ink a meter fill, bar, plot line or `.axi-diamond--series` is drawn in | `var(--axi-accent)` | `<span class="axi-meter__fill" style="--axi-series: var(--axi-ok)">` |
| `--axi-meter-v` | how full one `.axi-meter__fill` is | `0%` | `<span class="axi-meter__fill" style="--axi-meter-v: 62%">` |
| `--axi-meter-h` | height of a `.axi-meter` | `12px` | `<div class="axi-meter" style="--axi-meter-h: 18px">` |
| `--axi-meter-label` / `--axi-meter-value` | the outer column widths of `.axi-meter-list` | `132px` / `62px` | `<div class="axi-meter-list" style="--axi-meter-label: 180px">` |
| `--axi-bar-v` | height of one `.axi-bars__col` | `0%` | `<div class="axi-bars__col" style="--axi-bar-v: 78%">` |
| `--axi-bar-part` | height of one `.axi-bars__part` within its column | `0%` | `<span class="axi-bars__part" style="--axi-bar-part: 40%">` |
| `--axi-bars-gap` | gap between columns in `.axi-bars` | `6px` | `<div class="axi-bars" style="--axi-bars-gap: 2px">` |
| `--axi-plot-h` | height of a `.axi-plot` or `.axi-bars` | `180px` | `<div class="axi-plot" style="--axi-plot-h: 240px">` |
| `--axi-plot-rows` | how many horizontal rules a `.axi-plot` draws | `4` | `<div class="axi-plot" style="--axi-plot-rows: 6">` |

`--axi-page-pad: 0` is the one to know about: it is how a measure nested
inside another measure avoids paying the gutter twice.

## Versioning

Published under `v<major>/`, and **`v1/` is append-only** — it will keep
serving for as long as the Pages site exists. Non-breaking fixes republish
`v1/axi.css` in place; anything that would break a consumer goes to `v2/`. No
consumer should ever wake up to a changed class name.

## Develop

```bash
npm install
npm run build          # src/*.css -> dist/axi.css
npx vitest run --pool=forks --poolOptions.forks.maxForks=2
python3 -m http.server # then open the gallery at /
```

`dist/axi.css` is committed, because the release workflow publishes that exact
file. A test asserts it matches its sources, so a source edit that skips the
rebuild fails rather than shipping stale CSS.

The rules the system is built on are in [docs/RULES.md](docs/RULES.md). Read
them before adding a component.
