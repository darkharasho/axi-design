import { ICON_ENTRIES } from '../manifest/icons.mjs'
import { page, url } from './shell.mjs'
import { escapeHtml } from './highlight.mjs'

// One tile per icon: the glyph, its name, and the terms someone might reach
// for instead of the name. data-keywords carries the aliases into the page so
// the site search finds "magnifier" and lands on `search`.
function tile(entry) {
  const terms = [...entry.aliases, ...entry.keywords].join(' ')
  return `<li class="docs-icon" data-keywords="${escapeHtml(terms)}">
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
  <p>This site inlines <a href="${url('icons/sprite.svg')}">the sprite</a> into every page instead,
  which is why the markup below says <code>#axi-search</code> with no file part.</p>
</div>
<ul class="docs-icons">
${ICON_ENTRIES.map(tile).join('\n')}
</ul>`,
  })
}
