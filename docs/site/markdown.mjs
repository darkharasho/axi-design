import { marked } from 'marked'
import { buildKnobTable } from '../../scripts/build.mjs'
import { ACCENTS } from './shell.mjs'

// Generated content a Markdown page can embed. A guide that needs the knob
// table gets the real one rather than a hand-copied second version, which is
// the same bargain the README markers make.
export const PLACEHOLDERS = {
  knobs: () => marked.parse(buildKnobTable()),
  accents: () => `<table><thead><tr><th>Accent</th><th>Id</th><th>Hex</th></tr></thead><tbody>${
    ACCENTS.map((a) => `<tr><td><span class="axi-diamond axi-diamond--series" style="--axi-series: ${a.hex}"></span> ${a.label}</td><td><code>${a.id}</code></td><td><code>${a.hex}</code></td></tr>`).join('')
  }</tbody></table>`,
}

const slug = (text) => text.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '')

export function renderMarkdown(md, { stableRuleIds = false } = {}) {
  let html = marked.parse(md)
  const toc = []

  // marked does not emit heading ids, which leaves the anchor scheme entirely
  // ours: a numbered RULES clause gets `rule-<n>`, stable across every
  // rewording, and everything else gets a slug.
  html = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_, level, inner) => {
    const text = inner.replace(/<[^>]*>/g, '').trim()
    const numbered = stableRuleIds && text.match(/^(\d+)\./)
    const id = numbered ? `rule-${numbered[1]}` : slug(text)
    if (level === '2') toc.push({ id, text })
    return `<h${level} id="${id}">${inner}</h${level}>`
  })

  // Substitution runs on the RENDERED html on purpose. Inside a fenced code
  // block marked has already escaped the comment to `&lt;!-- axi:knobs --&gt;`,
  // so a guide that shows a placeholder displays it and a guide that uses one
  // gets it filled - with no special-casing of fences anywhere here.
  html = html.replace(/<!--\s*axi:([a-z-]+)\s*-->/g, (_, name) => {
    const render = PLACEHOLDERS[name]
    if (!render) throw new Error(`unknown placeholder axi:${name} — known: ${Object.keys(PLACEHOLDERS).join(', ')}`)
    return render()
  })

  return { html, toc }
}
