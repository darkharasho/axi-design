# axi-design documentation site — design

**Date:** 2026-09-23
**Status:** approved, ready for planning
**Scope:** round one of two. This spec covers the documentation site only. Adding
missing elements (modal, alert, breadcrumb, pagination, accordion, checkbox,
radio, textarea, progress, toast, avatar, spinner, …) is round two and gets its
own spec.

## Intent

Today `axi-design` publishes a single `index.html` that scrolls through six
sections of examples. It proves the components exist; it does not explain them,
cannot be deep-linked, and has no mechanism preventing a component from going
undocumented. This project turns that page into a documentation site in the
mould of Bootstrap's — per-component pages, narrative guides, search — built
entirely out of axi's own components.

### Audiences, all three weighted

1. **The author, across the suite.** Building an app, needs the exact class
   names and copyable markup in seconds. Optimises for density, search and
   deep links.
2. **An LLM agent writing axi-styled UI.** Needs the complete class inventory,
   the knob surface, and the rules it must not break. Optimises for
   completeness and machine-readable structure (`llms.txt`).
3. **An outside adopter arriving from npm.** Needs to see what it looks like
   and decide. Optimises for a landing page that shows rather than tells.

### Success criteria

- Every `.axi-*` class in `src/` is reachable from a documentation page, and
  this is enforced by a test rather than by discipline.
- The markup shown in a code block is, by construction, the markup that
  produced the demo beside it. Drift is structurally impossible.
- The site's own chrome uses only axi components plus a quarantined
  `.docs-*` layer. The site is evidence the language can build a real site.
- `docs/RULES.md` remains the single source of truth for the language; the
  site renders it rather than restating it.
- Nothing a consumer downloads changes. `dist/axi.css`, the npm tarball and
  every published `/vN/axi.css` are untouched by this work.

### Non-goals

- No new components, no changes to any file in `src/`. Gaps the work exposes
  are recorded for round two, not filled.
- No light theme, no i18n, no versioned documentation (the site documents the
  current version; only the CSS artifacts are versioned, as today).
- No runtime dependency, ever. The only new dependency is `marked`, build-time
  and `devDependencies` only.

## Approach

Rejected: a static site generator (11ty/VitePress). It would theme the docs in
its own design system, which for a design language forfeits the site's main
argument, and it imports a toolchain into a repo with one devDependency.

Rejected: hand-written HTML per page. No forcing function keeping components
documented, and the shared chrome gets copy-pasted into thirty files — a cost
that compounds exactly when round two doubles the page count.

**Chosen:** a generator owned by this repo, driven by a component manifest, with
Markdown for narrative prose. The manifest gives enforcement and machine-readable
output; Markdown keeps the guides pleasant enough to actually write.

## Site map

```
/                       Landing — the look, the pitch, install in three lines
/start/                 Getting started: the three consumption modes, set an accent
/rules/                 docs/RULES.md, rendered
/theming/               Tokens, the accent list, the per-instance knob table
/components/            Index: every component grouped by layer, with preview tiles
/components/<id>/       One page per component family (~30 pages)
/gallery/               The kitchen sink — today's index.html, everything on one scroll
/llms.txt               Exhaustive machine-readable reference
/search.json            Client-side search index
/vN/axi.css             Unchanged; staged from git tags exactly as today
```

`/gallery/` is retained deliberately. It is the only view in which the system
can be judged as a whole, which thirty separate pages actively obscure. It stops
being the front door and becomes the smoke test.

`/rules/` renders `docs/RULES.md` through `marked` into `.axi-prose`. There is no
second copy. RULES.md continues to ship in the npm tarball and continues to be
what `tests/tokens.test.mjs` is written against.

## The manifest

```
docs/manifest/
  index.mjs        combines the layer modules, validates entry shape
  primitives.mjs   layout.mjs   shells.mjs   data.mjs   prose.mjs   utilities.mjs
  knobs.mjs        the per-instance knob table, as data
```

`.mjs` rather than JSON so example markup can be a readable template literal and
entries can carry comments.

### Entry shape

```js
{
  id: 'meter',                      // URL segment; /components/meter/
  name: 'Meter',
  layer: 'data',                    // sidebar group; see note below
  classes: ['.axi-meter', '.axi-meter__fill', '.axi-meter-list', …],
  summary: 'One or two sentences. Used on the page, the index tile and llms.txt.',
  rules: [1, 2],                    // clause numbers in docs/RULES.md
  knobs: ['--axi-meter-v', '--axi-meter-h', '--axi-series'],
  notes: `Optional Markdown for anything the summary cannot carry.`,
  examples: [
    { title: 'A single meter', note: 'Optional one-liner, right-aligned', html: `…` },
  ],
}
```

**`layer` is a documentation concern, not a source-file fact.** The `src/` split
is by cascade order, not by category, and the two genuinely differ:

| Class | Lives in | Documented under |
|---|---|---|
| `.axi-panel` | `primitives.css` | Layout |
| `.axi-quote` | `shells.css` | Prose |
| `.axi-notice`, `.axi-tooltip`, `.axi-eyebrow`, `.axi-sigil` | `shells.css` | Primitives |
| `.axi-sr-only` | `base.css` | Utilities |

`layer` is therefore declared per entry and never inferred from the file. A
`utilities` group exists for classes that are real and documented but belong to
no visual family.

### Single-sourcing of examples

Each `examples[].html` string is rendered twice by the generator: raw into the
live demo, and HTML-escaped-then-highlighted into the code block beneath it.
This is the central mechanism of the design — the copyable code cannot drift
from the rendered demo because there is only one string.

## The generator

`scripts/site.mjs`, new, separate from `scripts/build.mjs`. `build.mjs` continues
to build the shipped artifact and is not modified except where noted under
"README knob table". Different lifecycles, and nothing in the site generator can
affect what a consumer downloads.

```
docs/site/
  shell.mjs      page chrome: mast, sidebar, TOC, footer
  render.mjs     component-page and index-page renderers
  markdown.mjs   marked wrapper → .axi-prose
  highlight.mjs  build-time HTML tokeniser
  docs.css       docs-only chrome, .docs-* prefix
  search.js      client-side search over search.json
  copy.js        code-block copy buttons
```

Markdown pages may embed generated content through a placeholder line — a
lone `<!-- axi:knobs -->` or `<!-- axi:accents -->` in the source — which the
generator replaces with the rendered table. This is how `/theming/` shows the
knob and accent tables without a hand-maintained second copy, and it is the
same mechanism as the README markers. An unrecognised `axi:` placeholder is a
build error rather than a silent passthrough.

Outputs to `_site/`: directory-style URLs (`_site/components/meter/index.html`),
plus `search.json`, `llms.txt`, and copies of `dist/` and `docs/site/*.{css,js}`.

### Base-path handling

The site is served from `darkharasho.github.io/axi-design/`, not from a domain
root, while local preview is served from `/`. The generator takes a single
`BASE` constant (`/axi-design/` for Pages, `/` for `npm run serve`) and every
emitted href passes through one `url()` helper. A test asserts no emitted page
contains a raw `href="/` or `src="/` outside that helper. This is the most
likely thing to ship silently broken, so it is checked directly.

### Syntax highlighting

Build-time, hand-rolled in `highlight.mjs`, roughly 30 lines. HTML only — the
one language the samples are written in. Four token classes, coloured from
existing tokens:

| Token | Class | Ink |
|---|---|---|
| Tag name | `.t-tag` | `--axi-meta` |
| Attribute name | `.t-attr` | `--axi-accent` |
| Attribute value | `.t-str` | `--axi-ok` |
| Punctuation | `.t-punc` | `--axi-text-faint` |

A Prism/Shiki dependency is not justified for HTML, and would be a runtime cost
paid by every visitor for a transform that can happen once at build time.

### Docs-only CSS is quarantined

`docs/site/docs.css` holds the sidebar, TOC, code block and example-block
styles under a `.docs-*` prefix. It is never read by `build.mjs`, never enters
`dist/`, and is not in the npm `files` list.

Deliberate side effect: **`docs.css` is the shopping list for round two.**
Anything in it that proves generally useful becomes a candidate for promotion
into `src/`, having earned its place by being needed rather than by appearing
on another framework's feature list.

## Page anatomy

### Component page

Three columns: sidebar (grouped by `layer`, current page filled solid in the
accent — the language has no soft states, so "selected" is a block of ink),
content, and an "On this page" TOC. Below the layout breakpoint the TOC is
dropped and the sidebar collapses into a disclosure in the mast.

Content order:

1. `.axi-eyebrow` with the layer name
2. Title
3. Lede — the `summary` field
4. Class list as `.axi-chip--meta` chips, so the names being looked for appear
   immediately below the title
5. `notes`, if present, rendered as `.axi-prose`
6. Examples — for each: title, optional right-aligned note, demo in a
   panel-weight block, code block tucked against the panel's offset so the two
   read as one object, copy button in the code block's corner
7. **Knobs** — table sourced from `knobs.mjs`, filtered to this entry's `knobs`
8. **Rules this answers** — each clause in `rules` rendered as `.axi-notice`
   with the clause number in the icon slot, deep-linking to `/rules/#rule-<n>`.
   `marked` derives heading ids from heading text, which would make the anchor
   depend on the wording of a rule's title and break the link whenever a rule
   is reworded. The Markdown renderer therefore overrides heading ids for
   `## <n>. …` headings in RULES.md to the stable form `rule-<n>`.

Section 8 is what distinguishes this from a component list: every page closes by
pointing at the clauses that dictate why the component looks the way it does.

### Chrome

The mast is `.axi-mast` / `.axi-brand` / `.axi-sigil` / `.axi-tabs` /
`.axi-search` / `.axi-select`, entirely existing components. The package version
sits in `.axi-brand__name`'s `<small>`, read from `package.json` at build time.
The accent switcher is the existing `gallery.js` behaviour, generalised to
every page and driven by `accents.json`. `gallery.js` is split accordingly: the
accent-switching portion moves to `docs/site/accent.js` and is loaded by every
page, while the demo-specific behaviour (menu, drawer, tooltip positioning)
stays in `gallery.js`, which is loaded only by `/gallery/`.

### Landing page

One job: show, not tell. A hero composed of real components — panel, card with
its strip, meter, chip row — with the live accent switcher, the three-line
install directly beneath, and two buttons: "Get started" and "Components". The
philosophy gets one paragraph and a link to `/rules/`, not a wall of text.

## The README knob table becomes generated

`docs/manifest/knobs.mjs` becomes the source of truth for the per-instance knob
table. `README.md` carries the table between HTML comment markers, regenerated
by the build, with a test asserting the file on disk matches what the manifest
produces. Today that table can drift from `src/` silently; after this it cannot.
This is the one place the work touches `build.mjs`.

## Enforcement

New `tests/manifest.test.mjs`:

1. Every `.axi-*` class defined in `src/` appears in some entry's `classes`.
   An undocumented component fails the build. In round two, a new element
   cannot land without its page.
2. Every class used in any example's `html` exists in `src/`. Catches typos in
   the docs and doc pages that outlive their CSS.
3. Every `--axi-*` custom property read with a fallback in `src/` appears in
   `knobs.mjs`.
4. `README.md`'s knob table matches the table generated from `knobs.mjs`.
5. Entry shape: unique `id`s, non-empty `summary`, `layer` from the known set,
   `rules` referencing clause numbers that exist in `RULES.md`.

New `tests/site.test.mjs`:

6. The generator emits every expected page for a given manifest.
7. Example HTML is escaped in code blocks and never executed as markup there.
8. Highlighting round-trips: stripping the emitted `<span>`s and unescaping
   returns the original source string exactly.
9. No emitted page contains a raw absolute `href="/` or `src="/`.

Existing `tests/tokens.test.mjs`, `tests/build.test.mjs` and
`tests/accents.test.mjs` are unchanged.

Per repository convention, vitest runs with `--maxWorkers=2`.

## Build and deploy

```
npm run build    scripts/build.mjs   src/*.css       → dist/axi.css, dist/accents.css
npm run docs     scripts/site.mjs    manifest + md   → _site/
npm run serve    scripts/serve.mjs   ~25 lines, no dependency, local preview at /
npm test         vitest run
```

`.github/workflows/pages.yml`: the current
`cp -r index.html gallery.js dist _site/` is replaced by `npm run docs`, which
builds `_site/` itself. The existing per-tag staging loop follows unchanged.
The guarantee that every published `/vN/axi.css` keeps resolving is untouched,
because those artifacts are read from git tags and not from the site build.

`.gitignore` gains `_site/`.

## Implementation sequence

Each step is independently verifiable, and the second is expected to fail
loudly — that is its purpose.

1. Generator skeleton, shell, `docs.css`, one hardcoded component page.
2. `data.mjs` manifest + enforcement test 1. **Expect failures** naming
   undocumented classes (`.axi-axis`, `.axi-legend`, `.axi-badge-count`,
   `.axi-sigil`, `.axi-eyebrow` are the anticipated ones). Group them rather
   than forcing them into a layer they do not belong to.
3. Remaining manifest layers: primitives, layout, shells, prose, utilities.
4. `knobs.mjs`, the knobs section, and the generated README table.
5. Markdown pipeline: `/start/`, `/theming/`, `/rules/`.
6. Landing page; move `index.html` to `/gallery/`.
7. Search index and client search; `llms.txt`.
8. `pages.yml`, `.gitignore`, `npm run serve`.

## Risks

- **Base-path breakage** — the site works locally and 404s on Pages. Mitigated
  by the single `url()` helper and test 9.
- **Manifest tedium** — thirty entries with examples is the bulk of the work.
  Mitigated by porting the existing markup out of `index.html`, which is
  already written and already correct.
- **Enforcement test 1 becoming an obstacle** — if a class legitimately should
  not be documented, the answer is an explicit `utilities` entry, never an
  exclusion list in the test. An exclusion list is the escape hatch this
  repository's existing tests are written specifically to avoid.
