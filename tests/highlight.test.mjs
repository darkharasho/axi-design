import { describe, it, expect } from 'vitest'
import { escapeHtml, highlight } from '../docs/site/highlight.mjs'
import { entries } from '../docs/manifest/index.mjs'

const unhighlight = (html) =>
  html.replace(/<\/?span[^>]*>/g, '')
    .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')

describe('escapeHtml', () => {
  it('escapes the four characters that can break out of a code block', () => {
    expect(escapeHtml('<a href="x">&</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;')
  })
})

describe('highlight', () => {
  it('marks tag names, attribute names, values and punctuation', () => {
    const out = highlight('<div class="axi-meter"></div>')
    expect(out).toContain('<span class="t-tag">div</span>')
    expect(out).toContain('<span class="t-attr">class</span>')
    expect(out).toContain('<span class="t-str">&quot;axi-meter&quot;</span>')
    expect(out).toContain('<span class="t-punc">&lt;</span>')
  })

  it('handles a valueless attribute', () => {
    expect(unhighlight(highlight('<div hidden></div>'))).toBe('<div hidden></div>')
  })

  it('handles a self-closing tag', () => {
    expect(unhighlight(highlight('<input class="axi-input" />'))).toBe('<input class="axi-input" />')
  })

  // The guarantee that makes the code block trustworthy: what is displayed is
  // exactly what the demo was rendered from, character for character.
  it('round-trips every example in the manifest', () => {
    for (const e of entries()) {
      for (const ex of e.examples) {
        expect(unhighlight(highlight(ex.html)), `${e.id}/"${ex.title}"`).toBe(ex.html)
      }
    }
  })

  // Review Focus 1. An example is free to contain markup-ish text; none of it
  // may terminate the code block or inject an element into the page.
  it('neutralises markup that would otherwise break out of the block', () => {
    const nasty = `<p>a &amp; b</p></pre><script>alert(1)</script>`
    const out = highlight(nasty)
    expect(out).not.toContain('</pre>')
    expect(out).not.toContain('<script>')
    expect(unhighlight(out)).toBe(nasty)
  })
})
