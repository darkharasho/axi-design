import { ICON_ENTRIES } from '../manifest/icons.mjs'
import { page, url } from './shell.mjs'
import { escapeHtml } from './highlight.mjs'

// One tile per icon: the glyph, its name, and the terms someone might reach
// for instead of the name. data-keywords carries the aliases into the page so
// the site search finds "magnifier" and lands on `search` - and the lucide
// names too, so an app porting off lucide-react types the name it already has
// and finds the drawing rather than "Nothing in the set answers to that".
function tile(entry) {
  const terms = [...entry.aliases, ...(entry.lucide ?? []), ...entry.keywords].join(' ')
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
  <h2 id="substitutions">When the set does not have it</h2>
  <p>The suite imports 165 distinct Lucide names.
  This set is 57 drawings and answers 47 of them; it will realistically reach sixty or
  seventy &mdash; so an app importing from <code>lucide-react</code> <em>and</em> from
  here is the expected arrangement, not a failure of the migration. The vocabulary was always borrowed; only the drawings are
  ours. Port what this set answers, leave the rest on Lucide, and do not re-decide it
  app by app.</p>
  <p>Some names this set answers under a different one. Those resolve in the sprite, so
  the port is a rename:</p>
  <pre><code>&lt;svg class="axi-icon"&gt;&lt;use href="#axi-triangle-alert"/&gt;&lt;/svg&gt;</code></pre>
  <p>And some it will not draw at all, because the shape needs a curve this grammar does
  not have. Those need a decision, and here it is:</p>
  <table>
    <thead><tr><th>Lucide name</th><th>Use</th><th>Why</th></tr></thead>
    <tbody>
      <tr><td><code>star</code></td><td><code>crown</code>, or a filled <code>.axi-diamond</code></td>
      <td>Five points need 36&deg; and 72&deg;. The four-point substitute cannot have
      concave vertices closer in than <code>R/&radic;2</code> &mdash; which is an octagon
      &mdash; so it comes out a lumpy diamond. Use <code>crown</code> where it means
      <em>featured</em> or <em>best</em>, and the diamond where it means <em>rating</em>.</td></tr>
      <tr><td><code>sparkles</code></td><td><code>crown</code></td>
      <td>The same floor by another route. A four-armed twinkle with equal arms reads as
      <code>plus</code>, with unequal arms as a dagger, and with eight arms it closes into
      a solid octagon at 3px. Three drawings, none of them the word.</td></tr>
      <tr><td><code>circle</code></td><td><code>square</code></td>
      <td>A circle is the one boundary this grammar has decided not to draw. It resolves
      in the sprite as an alias.</td></tr>
      <tr><td><code>triangle-alert</code></td><td><code>circle-alert</code></td>
      <td>Not an absence &mdash; a duplicate. A 45&deg;-only isoceles triangle is forced to
      2:1 tall-to-wide, which is a spike rather than a warning sign, and the eight-sided
      room already <em>is</em> the warning sign. It resolves in the sprite as an alias.</td></tr>
      <tr><td>anything else</td><td>stay on Lucide</td>
      <td>If the metaphor needs a curve and neither a square nor a diamond says it, an
      absent glyph beats a wrong one. Open an issue describing what the shape needed.</td></tr>
    </tbody>
  </table>
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
  ship it. A wrong glyph costs more than an absent one &mdash;
  <a href="#substitutions">the table above</a> lists what this set has refused and what to reach
  for instead. Open an issue describing what the shape needed.</p>
</div>`,
    scripts: ['icon-search.js'],
  })
}
