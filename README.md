# axi-design

The design language for the [axi suite](https://axi.wiki) — flat and outlined,
dark, drawn in saturated ink.

One CSS file. No build step for consumers, no dependencies, no JavaScript.

## Use it

```html
<link rel="stylesheet" href="https://darkharasho.github.io/axi-design/v1/axi.css">
```

Then set your accent:

```css
:root { --axi-accent: #b06bff; }
```

That is the whole theming surface. See [the pattern
gallery](https://darkharasho.github.io/axi-design/) for every component, with a
live accent switcher.

## Versioning

Published under `v<major>/`, and **`v1/` is append-only** — it will keep
serving for as long as the Pages site exists. Non-breaking fixes republish
`v1/axi.css` in place; anything that would break a consumer goes to `v2/`. No
consumer should ever wake up to a changed class name.

## Develop

```bash
npm install
npm run build          # src/*.css -> dist/axi.css
npx vitest run --maxWorkers=2
python3 -m http.server # then open the gallery at /
```

`dist/axi.css` is committed, because the release workflow publishes that exact
file. A test asserts it matches its sources, so a source edit that skips the
rebuild fails rather than shipping stale CSS.

The rules the system is built on are in [docs/RULES.md](docs/RULES.md). Read
them before adding a component.
