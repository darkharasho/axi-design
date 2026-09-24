import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { build } from '../scripts/site.mjs'
import { entries, findEntry } from '../docs/manifest/index.mjs'
import { LAYER_NAMES } from '../docs/site/shell.mjs'

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

// R-30: every short prose field in the manifest is plain text, escaped at the
// render boundary. These three entries were the ones visibly broken by
// interpolating it raw, and they are asserted against the built page rather
// than against escapeHtml(), which would only prove the escaper escapes.
describe('manifest prose reaches the page as text', () => {
  it('keeps a summary with an embedded quote whole in the meta description', () => {
    const summary = findEntry('pill').summary
    expect(summary).toContain('"selected"')
    const m = read('components/pill/index.html').match(/<meta name="description" content="([^"]*)">/)
    expect(m[1]).toBe(summary.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'))
  })

  it('shows a tag name in a lede instead of rendering the tag', () => {
    const html = read('components/brand/index.html')
    expect(html).toContain('<p class="docs-lede">The sigil and the wordmark, as one link home. A nested &lt;small&gt; becomes')
    expect(html).not.toContain('A nested <small> becomes')
  })

  it('keeps a tag name in an example note', () => {
    const html = read('components/tooltip/index.html')
    const note = html.match(/<span class="docs-ex__note">([^<]*)/)[1]
    expect(note).toContain('&lt;body&gt;')
  })
})

// The reviewer found the gallery's nested <main> and its duplicate id="q" by
// scanning all 44 emitted pages by hand. These make that scan permanent, and
// they run over every page rather than the handful someone remembered.
describe('every emitted page', () => {
  const pages = () => written.filter((p) => p.endsWith('.html'))

  it('has exactly one <main>', () => {
    for (const path of pages()) {
      const count = [...read(path).matchAll(/<main[\s>]/g)].length
      expect(count, `${path} has ${count} <main> elements`).toBe(1)
    }
  })

  it('uses every id at most once', () => {
    for (const path of pages()) {
      const ids = [...read(path).matchAll(/ id="([^"]*)"/g)].map((m) => m[1])
      const seen = new Set()
      const dupes = [...new Set(ids.filter((id) => seen.has(id) || !seen.add(id)))]
      expect(dupes, `${path} repeats an id`).toEqual([])
    }
  })

  // Scoped to the page title rather than to `<h1` in general: the prose
  // component's example deliberately renders an h1 inside its demo, on its own
  // page and in its index tile, and that markup belongs to the manifest. What
  // must hold is that every page has one page title and that it comes first -
  // which is what /start/, /theming/ and /gallery/ were missing entirely.
  it('has exactly one page-title h1, ahead of any demo h1', () => {
    for (const path of pages()) {
      const html = read(path)
      const titles = [...html.matchAll(/<h1 class="docs-title">/g)]
      expect(titles.length, `${path} has ${titles.length} page titles`).toBe(1)
      expect(html.indexOf('<h1'), `${path} opens with an h1 that is not its title`).toBe(titles[0].index)
    }
  })

  it('carries a non-empty meta description', () => {
    for (const path of pages()) {
      const m = read(path).match(/<meta name="description" content="([^"]*)">/)
      expect(m, `${path} has no meta description`).not.toBeNull()
      expect(m[1].trim().length, `${path} has an empty meta description`).toBeGreaterThan(20)
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

describe('landing and gallery', () => {
  it('writes the landing page at the site root', () => {
    expect(written).toContain('index.html')
  })

  // Asserting the hrefs alone is satisfied by the shell's top nav, which is on
  // every page - the landing page could lose both its calls to action and the
  // test would still pass. Match the buttons themselves.
  it('shows the install snippet and routes onward', () => {
    const html = read('index.html')
    expect(html).toContain('@axiapps/axi-design')
    expect(html).toMatch(/<a class="axi-btn axi-btn--primary" href="\/axi-design\/start\/">/)
    expect(html).toMatch(/<a class="axi-btn" href="\/axi-design\/components\/">/)
  })

  it('writes the gallery and its script', () => {
    expect(written).toContain('gallery/index.html')
    expect(written).toContain('gallery.js')
  })
})

describe('machine-readable output', () => {
  it('writes the search index with an entry per component', () => {
    expect(written).toContain('search.json')
    const index = JSON.parse(read('search.json'))
    expect(index.length).toBe(entries().length)
    expect(index[0]).toHaveProperty('classes')
  })

  // Every other surface shows a layer's display name, not its raw id - a
  // search result showing "data" instead of "Data" would be the one place
  // this site leaks an internal identifier at a reader. search.js is a
  // browser module and cannot import LAYER_NAMES itself (shell.mjs reads
  // process.env), so the index carries the display name pre-projected.
  it('projects the layer display name onto each search entry', () => {
    const index = JSON.parse(read('search.json'))
    for (const item of index) expect(item.layerName).toBe(LAYER_NAMES[item.layer])
  })

  it('writes llms.txt naming every component, class and knob', () => {
    expect(written).toContain('llms.txt')
    const txt = read('llms.txt')
    for (const e of entries()) {
      expect(txt).toContain(e.name)
      for (const cls of e.classes) expect(txt).toContain(cls)
    }
  })
})

afterAll(() => rmSync(out, { recursive: true, force: true }))
