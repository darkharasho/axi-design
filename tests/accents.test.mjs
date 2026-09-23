import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { buildAccentsCss, ACCENTS } from '../scripts/build.mjs'

// dist/accents.css is committed for the same reason dist/axi.css is: the
// Pages workflow and npm both publish the artifact, and nothing in-repo
// imports it, so staleness would be invisible without this test.
describe('dist/accents.css', () => {
  it('matches the generation from accents.json', () => {
    const committed = readFileSync(resolve('dist/accents.css'), 'utf8')
    expect(committed).toBe(buildAccentsCss())
  })
})

describe('the official accent list', () => {
  it('has exactly the eleven official ids, axi-gold first', () => {
    expect(ACCENTS.map((a) => a.id)).toEqual([
      'axi-gold', 'electric-blue', 'refined-cyan', 'amber-warm',
      'emerald-mint', 'rose-pink', 'violet-purple', 'crimson-red',
      'slate-silver', 'teal-ocean', 'gold-bronze',
    ])
  })

  it('every entry is a kebab id, a label, and a 6-digit hex', () => {
    for (const a of ACCENTS) {
      expect(a.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      expect(a.label.length).toBeGreaterThan(0)
      expect(a.hex).toMatch(/^#[0-9a-f]{6}$/)
    }
  })

  it('generates one data-attribute selector per accent and nothing structural', () => {
    const css = buildAccentsCss()
    for (const a of ACCENTS) {
      expect(css).toContain(`[data-axi-accent="${a.id}"] { --axi-accent: ${a.hex}; }`)
    }
    // Accents may set the accent and nothing else - a second declaration
    // would be a second theming surface.
    expect(css.match(/--axi-/g).length).toBe(ACCENTS.length)
  })
})
