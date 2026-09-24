import { describe, it, expect } from 'vitest'
import { url, page, sidebar, LAYER_NAMES, VERSION } from '../docs/site/shell.mjs'
import { LAYERS } from '../docs/manifest/index.mjs'

describe('url', () => {
  it('prefixes the base path', () => {
    expect(url('components/meter/')).toBe('/axi-design/components/meter/')
  })

  it('tolerates a leading slash on the argument', () => {
    expect(url('/start/')).toBe('/axi-design/start/')
  })

  it('returns the base itself for the site root', () => {
    expect(url()).toBe('/axi-design/')
  })

  it('never emits a doubled slash', () => {
    expect(url('//components//')).not.toMatch(/\/\//)
  })
})

describe('page', () => {
  const html = page({ title: 'Meter', nav: 'components', body: '<p>hi</p>' })

  it('is a complete document with the title in it', () => {
    expect(html).toMatch(/^<!doctype html>/i)
    expect(html).toContain('<title>Meter · axi-design</title>')
  })

  it('links the stylesheets through url()', () => {
    expect(html).toContain(`href="${url('axi.css')}"`)
    expect(html).toContain(`href="${url('accents.css')}"`)
    expect(html).toContain(`href="${url('docs.css')}"`)
  })

  it('shows the package version in the brand', () => {
    expect(html).toContain(`v${VERSION}`)
  })

  it('marks the current nav item', () => {
    expect(html).toMatch(/<a href="[^"]*components\/"[^>]*aria-current="page"/)
  })

  // Review Focus: a raw absolute link works locally and 404s on Pages, which
  // is the single most likely way this site ships silently broken.
  it('emits no absolute link that bypassed url()', () => {
    expect(html).not.toMatch(/(?:href|src)="\/(?!axi-design\/)/)
  })
})

describe('sidebar', () => {
  it('names every populated layer', () => {
    const html = sidebar()
    for (const layer of LAYERS) {
      if (html.includes(`data-layer="${layer}"`)) expect(html).toContain(LAYER_NAMES[layer])
    }
  })

  it('marks the current component and nothing else', () => {
    const html = sidebar('meter')
    expect([...html.matchAll(/aria-current="page"/g)].length).toBe(1)
    expect(html).toMatch(/href="[^"]*components\/meter\/"[^>]*aria-current="page"/)
  })
})
