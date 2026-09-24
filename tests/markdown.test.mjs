import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { renderMarkdown } from '../docs/site/markdown.mjs'

describe('renderMarkdown', () => {
  it('renders headings with slug ids and collects a toc', () => {
    const { html, toc } = renderMarkdown('## Getting started\n\ntext')
    expect(html).toContain('<h2 id="getting-started">Getting started</h2>')
    expect(toc).toEqual([{ id: 'getting-started', text: 'Getting started' }])
  })

  // marked derives an id from the heading TEXT. Every component page deep-links
  // to /rules/#rule-<n>, so deriving the anchor from the wording would break
  // every one of those links the moment a rule is reworded - silently, since a
  // dead fragment does not 404.
  it('gives numbered RULES headings a stable rule-<n> id', () => {
    const { html } = renderMarkdown('## 2. No colour at partial opacity', { stableRuleIds: true })
    expect(html).toContain('<h2 id="rule-2">')
  })

  it('leaves unnumbered headings on slug ids even in rules mode', () => {
    const { html } = renderMarkdown('## Tokens', { stableRuleIds: true })
    expect(html).toContain('<h2 id="tokens">')
  })

  // The placeholder's whole point is a generated table a guide can embed, not
  // a raw markdown fragment pasted into already-rendered HTML — that would
  // show literal pipe characters on the page instead of a table. So the
  // substitution is checked against the rendered <table>, not against
  // buildKnobTable()'s markdown source.
  it('substitutes a known placeholder', () => {
    const { html } = renderMarkdown('before\n\n<!-- axi:knobs -->\n\nafter')
    expect(html).toContain('<th>Knob</th>')
    expect(html).not.toContain('axi:knobs')
  })

  // Review Focus: a guide that SHOWS the placeholder must display it, not have
  // it substituted. Substitution runs on rendered HTML, where a fenced block's
  // contents are already escaped, so the raw comment only survives outside one.
  it('leaves a placeholder inside a fenced code block alone', () => {
    const { html } = renderMarkdown('```\n<!-- axi:knobs -->\n```')
    expect(html).toContain('&lt;!-- axi:knobs --&gt;')
    expect(html).not.toContain('<th>Knob</th>')
  })

  it('throws on an unrecognised placeholder rather than passing it through', () => {
    expect(() => renderMarkdown('<!-- axi:nonsense -->')).toThrow(/axi:nonsense/)
  })

  it('renders the real RULES.md without throwing', () => {
    const md = readFileSync('docs/RULES.md', 'utf8')
    const { html, toc } = renderMarkdown(md, { stableRuleIds: true })
    expect(html).toContain('id="rule-1"')
    expect(html).toContain('id="rule-11"')
    expect(toc.length).toBeGreaterThan(10)
  })
})
