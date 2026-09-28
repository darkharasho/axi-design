import { ICON_ENTRIES } from '../manifest/icons.mjs'
import { page, url } from './shell.mjs'
import { escapeHtml } from './highlight.mjs'

// One tile per icon: the glyph, its name, and the terms someone might reach
// for instead of the name. data-keywords carries the aliases into the page so
// the site search finds "magnifier" and lands on `search`.
function tile(entry) {
  const terms = [...entry.aliases, ...entry.keywords].join(' ')
  return `<li class="docs-icon" data-name="${escapeHtml(entry.name)}" data-keywords="${escapeHtml(terms)}">
  <svg class="axi-icon" style="--axi-icon-size: 2rem" aria-hidden="true"><use href="#axi-${entry.name}"/></svg>
  <code>${escapeHtml(entry.name)}</code>
</li>`
}

export function iconsPage() {
  return page({
    title: 'Icons',
    nav: 'icons/',
    description:
      "The axi icon set: Lucide's vocabulary redrawn at control weight, in this language's angles, with no curve anywhere.",
    body: `<p class="axi-eyebrow">Reference</p>
<h1 class="docs-title">Icons</h1>
<div class="axi-prose">
  <p>Every glyph is drawn to <a href="${url('rules/')}#rule-12">rule 12</a>: a 24 canvas, a 3px
  stroke in <code>currentColor</code>, mitered joins, square corners, and no angle that is not
  0&deg;, 45&deg; or 90&deg;. Size one with <code>--axi-icon-size</code>; it takes its ink from
  whatever it sits in.</p>
  <p>The vocabulary &mdash; which shapes mean what, and what they are called &mdash; derives from
  <a href="https://lucide.dev">Lucide</a>, used under the ISC licence. No path data is Lucide's;
  every drawing is this language's own.</p>
  <p>Point a <code>&lt;use&gt;</code> at the sprite and the glyph inherits the ink around it:</p>
  <pre><code>&lt;svg class="axi-icon"&gt;&lt;use href="node_modules/@axiapps/axi-design/dist/icons/sprite.svg#axi-search"/&gt;&lt;/svg&gt;</code></pre>
  <p>That is a cross-document reference, so it is <strong>same-origin</strong>: over
  <code>http(s)</code> it works and the glyph inherits the ink around it, but under
  <code>file://</code> &mdash; an Electron window opened with <code>loadFile()</code> &mdash; it
  resolves to nothing and the icon is silently absent. There, inline
  <a href="${url('icons/sprite.svg')}">the sprite</a> into the document once and reference bare
  fragments (<code>#axi-search</code>), or use the standalone
  <code>dist/icons/&lt;name&gt;.svg</code> files.</p>
  <p>This site takes the inlining route on every page, which is why the markup below says
  <code>#axi-search</code> with no file part.</p>
</div>
<div class="docs-icons__filter">
  <label class="axi-sr-only" for="icon-q">Filter icons</label>
  <div class="axi-search">
    <span class="axi-search__icon" aria-hidden="true"><svg class="axi-icon"><use href="#axi-search"/></svg></span>
    <input class="axi-input" id="icon-q" type="search" data-icon-filter placeholder="Filter by name, alias or keyword&hellip;" autocomplete="off">
  </div>
</div>
<p class="docs-icons__empty" data-icon-empty hidden>Nothing in the set answers to that. If the metaphor you want is missing, the section below says what to do about it.</p>
<ul class="docs-icons">
${ICON_ENTRIES.map(tile).join('\n')}
</ul>
<div class="axi-prose">
  <h2 id="drawing">Drawing a new icon</h2>
  <ol>
    <li>Find the metaphor in <a href="https://lucide.dev/icons">Lucide</a> and keep its name.</li>
    <li>Re-draw it on the 24 canvas: 3px stroke, mitered joins, butt caps, everything inset 1.5
    from the edge. A circle becomes a <strong>diamond</strong> if it is a node &mdash; a lens, a
    head, a dot &mdash; and a <strong>square</strong> if it is a boundary. Every angle is
    0&deg;, 45&deg; or 90&deg;.</li>
    <li>Put axis-aligned strokes on an odd half-integer (<code>3.5</code>, <code>6.5</code>&hellip;),
    or on <code>12</code> if the glyph is built around its centre line.</li>
    <li>Save it as <code>icons/&lt;name&gt;.svg</code> and add a row to
    <code>docs/manifest/icons.mjs</code> with its categories, aliases and keywords.</li>
    <li>Run <code>npx vitest run tests/icons.test.mjs</code>. It checks all of the above. If it
    fails, the drawing is wrong &mdash; not the check.</li>
    <li>Run <code>npm run build</code> to regenerate the sprite, and commit the drawing with its
    artifact.</li>
  </ol>
  <p>If the metaphor genuinely needs a curve and neither a square nor a diamond says it, do not
  ship it. A wrong glyph costs more than an absent one &mdash; <code>star</code> is the one this
  set has so far refused, because a star drawn at 45&deg; has an inner radius it cannot go below
  and comes out an octagon. Open an issue describing what the shape needed instead.</p>
</div>`,
    scripts: ['icon-search.js'],
  })
}
