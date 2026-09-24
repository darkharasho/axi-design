import { byLayer } from '../manifest/index.mjs'
import { knobsFor } from '../manifest/knobs.mjs'
import { highlight, escapeHtml } from './highlight.mjs'
import { url, sidebar, page, LAYER_NAMES } from './shell.mjs'
import { renderMarkdown } from './markdown.mjs'

// The highlighted, copyable half of an example: a code block with its own
// copy button. Shared by example(), which pairs it with a live demo of the
// same string, and by landing(), which wants the block on its own - the
// install snippet must never be rendered live (see task-9-report.md).
export function codeBlock(source, id) {
  return `<div class="docs-code">
    <button class="axi-btn axi-btn--ghost docs-code__copy" type="button" data-copy="${id}">Copy</button>
    <pre><code id="${id}">${highlight(source)}</code></pre>
  </div>`
}

// An example is one string, rendered twice: raw into the demo, escaped and
// highlighted into the code block. There is no second copy of the markup, and
// so no way for the code someone copies to disagree with the thing they are
// looking at. That single-sourcing is the reason the manifest exists at all.
export function example(ex, index, entryId) {
  const codeId = `code-${entryId}-${index}`
  const note = ex.note ? `<span class="docs-ex__note">${escapeHtml(ex.note)}</span>` : ''
  return `<section class="docs-ex" id="ex-${index}">
  <div class="docs-ex__h"><h2>${escapeHtml(ex.title)}</h2>${note}</div>
  <div class="docs-demo">${ex.html}</div>
  ${codeBlock(ex.html, codeId)}
</section>`
}

// Escape first, then substitute: the backtick form is the one piece of
// markup a knob string is allowed to produce, so it has to be applied to text
// that is already safe rather than survive an escape pass afterwards.
const code = (text) => escapeHtml(text).replace(/`([^`]+)`/g, '<code>$1</code>')

function knobTable(names) {
  const knobs = knobsFor(names)
  if (!knobs.length) return ''
  const rows = knobs.map((k) => `<tr><td><code>${k.name}</code></td><td>${code(k.sets)}</td><td>${code(k.fallback)}</td></tr>`).join('\n')
  return `<h2 class="docs-h2" id="knobs">Knobs</h2>
<table class="docs-knobs"><tr><th>Property</th><th>Sets</th><th>Fallback</th></tr>
${rows}
</table>`
}

function ruleNotices(numbers, ruleTitles) {
  if (!numbers.length) return ''
  const items = numbers.map((n) => `<a class="axi-notice" href="${url(`rules/#rule-${n}`)}">
  <span class="axi-notice__icon" aria-hidden="true">${n}</span>
  <div><strong>${escapeHtml(ruleTitles.get(n) ?? `Rule ${n}`)}</strong></div>
</a>`).join('\n')
  return `<h2 class="docs-h2" id="rules">Rules this answers</h2>
<div class="docs-rules">${items}</div>`
}

export function componentPage(entry, ruleTitles) {
  const chips = entry.classes.map((c) => `<span class="axi-chip axi-chip--meta">${c}</span>`).join('\n      ')
  const notes = entry.notes ? `<div class="axi-prose">${renderMarkdown(entry.notes).html}</div>` : ''
  const examples = entry.examples.map((ex, i) => example(ex, i, entry.id)).join('\n')

  const toc = [
    ...entry.examples.map((ex, i) => `<a href="#ex-${i}">${escapeHtml(ex.title)}</a>`),
    entry.knobs.length ? '<a href="#knobs">Knobs</a>' : '',
    entry.rules.length ? '<a href="#rules">Rules this answers</a>' : '',
  ].filter(Boolean).join('')

  const body = `<p class="axi-eyebrow">${LAYER_NAMES[entry.layer]}</p>
<h1 class="docs-title">${entry.name}</h1>
<p class="docs-lede">${escapeHtml(entry.summary)}</p>
<div class="docs-classrow">
      ${chips}
</div>
${notes}
${examples}
${knobTable(entry.knobs)}
${ruleNotices(entry.rules, ruleTitles)}`

  return page({
    title: entry.name,
    nav: 'components/',
    description: entry.summary,
    sidebar: sidebar(entry.id),
    toc,
    body,
  })
}

export function componentsIndex() {
  const groups = byLayer().map(({ layer, items }) => {
    const tiles = items.map((e) => `<a class="axi-card docs-tile" href="${url(`components/${e.id}/`)}">
  <div class="axi-card__head"><h3 class="axi-card__title">${e.name}</h3></div>
  <p class="axi-card__meta">${escapeHtml(e.summary)}</p>
  <div class="docs-tile__demo">${e.examples[0].html}</div>
</a>`).join('\n')
    return `<h2 class="docs-h2" id="${layer}">${LAYER_NAMES[layer]}</h2>
<div class="axi-grid">${tiles}</div>`
  }).join('\n')

  return page({
    title: 'Components',
    nav: 'components/',
    description: 'Every component in the axi design language, grouped by layer.',
    sidebar: sidebar(),
    toc: byLayer().map(({ layer }) => `<a href="#${layer}">${LAYER_NAMES[layer]}</a>`).join(''),
    body: `<p class="axi-eyebrow">Reference</p>
<h1 class="docs-title">Components</h1>
<p class="docs-lede">Every component in the language, grouped by layer. Each page carries live examples, the markup that produced them, its knobs, and the rules it answers.</p>
${groups}`,
  })
}
