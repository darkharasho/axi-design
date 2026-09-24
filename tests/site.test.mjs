import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { build } from '../scripts/site.mjs'
import { entries, findEntry } from '../docs/manifest/index.mjs'

let out, written
beforeAll(() => {
  out = mkdtempSync(resolve(tmpdir(), 'axi-site-'))
  written = build(out)
})

const read = (p) => readFileSync(resolve(out, p), 'utf8')

describe('build', () => {
  it('writes a page for every component', () => {
    for (const e of entries()) expect(written).toContain(`components/${e.id}/index.html`)
  })

  it('writes the component index and copies the stylesheets', () => {
    expect(written).toContain('components/index.html')
    expect(written).toContain('axi.css')
    expect(written).toContain('accents.css')
    expect(written).toContain('docs.css')
  })
})

describe('a component page', () => {
  const entry = findEntry('meter')
  let html
  beforeAll(() => { html = read('components/meter/index.html') })

  it('leads with the layer, name and summary', () => {
    expect(html).toContain('<p class="axi-eyebrow">Data</p>')
    expect(html).toContain(entry.name)
    expect(html).toContain(entry.summary)
  })

  it('lists its classes as meta chips', () => {
    for (const cls of entry.classes) {
      expect(html).toContain(`<span class="axi-chip axi-chip--meta">${cls}</span>`)
    }
  })

  it('renders each example live and as code', () => {
    for (const ex of entry.examples) {
      expect(html).toContain(ex.title)
      expect(html).toContain(ex.html)                           // the live demo, raw
      expect(html).toContain('<span class="t-tag">div</span>')  // the same markup, highlighted
    }
  })

  it('shows only the knobs its entry cites', () => {
    expect(html).toContain('--axi-meter-v')
    expect(html).not.toContain('--axi-drawer-width')
  })

  it('cites its rules and deep-links to stable anchors', () => {
    for (const n of entry.rules) expect(html).toContain(`/rules/#rule-${n}`)
  })

  it('marks itself current in the sidebar', () => {
    expect(html).toMatch(/href="[^"]*components\/meter\/"[^>]*aria-current="page"/)
  })
})

describe('emitted links', () => {
  it('contains no absolute link that bypassed url()', () => {
    for (const path of written.filter((p) => p.endsWith('.html'))) {
      const html = read(path)
      const offenders = [...html.matchAll(/(?:href|src)="\/(?!axi-design\/)[^"]*"/g)].map((m) => m[0])
      expect(offenders, `${path} has links outside the base path`).toEqual([])
    }
  })
})

describe('narrative pages', () => {
  it('writes start, theming and rules', () => {
    expect(written).toContain('start/index.html')
    expect(written).toContain('theming/index.html')
    expect(written).toContain('rules/index.html')
  })

  it('renders RULES.md with the anchors components link to', () => {
    const html = read('rules/index.html')
    for (const n of [1, 2, 3, 9]) expect(html).toContain(`id="rule-${n}"`)
  })

  // Every "Rules this answers" link on every component page must resolve to a
  // real anchor on /rules/. Nothing else would report a dead fragment.
  it('resolves every rule deep-link a component page emits', () => {
    const rules = read('rules/index.html')
    for (const e of entries()) {
      const html = read(`components/${e.id}/index.html`)
      for (const m of html.matchAll(/rules\/#(rule-\d+)/g)) {
        expect(rules, `${e.id} links #${m[1]}, absent from /rules/`).toContain(`id="${m[1]}"`)
      }
    }
  })
})

afterAll(() => rmSync(out, { recursive: true, force: true }))
