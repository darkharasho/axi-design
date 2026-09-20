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

A third step is how a system stops looking like one system. This is enforced by
`tests/tokens.test.mjs`.

## 4. Hover lifts

The lift is per form step, not one universal number: a control has no resting
shadow, so a control's hover both moves it and draws its block for the first
time — `translate(-2px, -2px)` together with gaining the `--axi-offset-control`
(3px) block from nothing. A panel already carries its 6px block at rest, so its
hover only needs to deepen it — `translate(-3px, -3px)` with the block growing
from 6px to 10px. Applying the panel's flat `-3px` to a control would lift it
by exactly the depth of its own 3px block, leaving the lower-right edge where
it started — that reads as the element growing, not lifting.

Nothing in this language fades, glows or pulses. The movement reads in
peripheral vision and costs no colour.

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
