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

### Theming an app

```css
:root { --axi-accent: #b06bff; }
```

If an app picks an accent dark enough that near-black text on it fails
contrast, it also sets `--axi-accent-ink: var(--axi-text)`. It should not edit
components.

### The official accents

`--axi-accent` is the per-app theming surface, and the family agrees on what
may go in it. The official accents live in `accents.json` — id, label, hex —
and `dist/accents.css` is generated from it: one `[data-axi-accent="<id>"]`
selector per accent, setting `--axi-accent` and nothing else. An app opts in
by importing `accents.css` alongside `axi.css` and setting `data-axi-accent`
on its root element; an app that renders a picker reads `accents.json` for the
ids and labels.

<!-- axi:accents -->

The default remains `#ffc53d` Axi Gold, declared in `tokens.css`: an app that
sets no `data-axi-accent` is gold, and correctly themed.

## Knobs are not tokens

Tokens answer "what does the system look like" — they live in `:root`, once,
and every component reads them. Per-instance knobs answer a different
question: "how wide is *this* grid". They are custom properties a component
reads with a fallback and never declares itself, so setting one on a single
element or on any ancestor changes only what it cascades to. Setting most of
them in `:root` is legal and meaningless, because a knob is never asking what
the system looks like — a `--axi-grid-min` set globally does not make sense
the way `--axi-accent` set globally does.

Every knob below is scoped with a `style=""` attribute on the element or an
ancestor, not in a global stylesheet:

```html
<button class="axi-pill" aria-pressed="true" style="--axi-pill-fill: var(--axi-danger)">
```

<!-- axi:knobs -->
