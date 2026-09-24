import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { execSync } from 'node:child_process'
import { buildAccentsCss, ACCENTS } from '../scripts/build.mjs'
import { page } from '../docs/site/shell.mjs'

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

// 1.7.0 shipped ./accents.json as an export but omitted it from the `files`
// allowlist, so the published tarball never contained it and the export
// could not resolve from a real install. This pins the packed file list so
// that regression can't recur silently.
describe('packaging', () => {
  it('includes accents.json and the built stylesheets in the npm tarball', () => {
    const output = execSync('npm pack --dry-run --json', { encoding: 'utf8' })
    const [pack] = JSON.parse(output)
    const paths = pack.files.map((f) => f.path)
    expect(paths).toContain('accents.json')
    expect(paths).toContain('dist/accents.css')
    expect(paths).toContain('dist/axi.css')
  })

  it('ships RULES.md and nothing else from docs/', () => {
    const [pack] = JSON.parse(execSync('npm pack --dry-run --json', { encoding: 'utf8' }))
    const docs = pack.files.map((f) => f.path).filter((p) => p.startsWith('docs/'))
    expect(docs).toEqual(['docs/RULES.md'])
  })

  it('declares no runtime dependencies', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
    expect(pkg.dependencies ?? {}).toEqual({})
    expect(Object.keys(pkg.devDependencies)).toContain('marked')
  })
})

describe('the accent switcher', () => {
  it('offers exactly the official accents, in order', () => {
    const html = page({ title: 'x', nav: '', body: '' })
    const select = html.match(/<select[^>]*id="accent"[\s\S]*?<\/select>/)[0]
    const options = [...select.matchAll(/<option value="([a-z-]+)">([^<]+)<\/option>/g)]
      .map((m) => ({ id: m[1], label: m[2] }))
    expect(options).toEqual(ACCENTS.map((a) => ({ id: a.id, label: a.label })))
  })
})
