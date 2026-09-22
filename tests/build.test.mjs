import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { buildCss, ORDER } from '../scripts/build.mjs'

// dist/axi.css is committed, because the release workflow publishes that exact
// file and consumers link it by URL. A committed artifact can go stale the
// moment someone edits a source and forgets to rebuild - and because nothing
// imports dist/, nothing else would ever notice. This test is the only thing
// standing between a source edit and a release that silently ships the old CSS.
describe('dist/axi.css', () => {
  it('matches the concatenation of its sources', () => {
    const built = buildCss()
    const committed = readFileSync(resolve('dist/axi.css'), 'utf8')
    expect(committed).toBe(built)
  })

  it('concatenates sources in the declared order', () => {
    const built = buildCss()
    const positions = ORDER.map((name) => built.indexOf(`/* --- ${name} --- */`))
    expect(positions.every((p) => p !== -1)).toBe(true)
    expect([...positions]).toEqual([...positions].sort((a, b) => a - b))
  })

  // ORDER is hand-maintained, and every check in this suite - the concatenation
  // above, the colour-literal scan, the form-step scan - iterates ORDER rather
  // than the directory. A source file missing from ORDER is therefore both
  // absent from the published CSS and exempt from every rule, with a green
  // run to say so. Assert the two sets match in both directions: a new file
  // nobody listed fails, and a listed file nobody wrote fails too.
  it('lists exactly the files in src/', () => {
    // Dotfiles (an editor lockfile such as Emacs's `.#base.css`) end in
    // `.css` too, so `endsWith('.css')` alone still takes them - and unlike
    // a real orphan, a dotfile can't be satisfied by adding it to ORDER: the
    // build would try to read it as a source. Ignore anything starting with
    // `.`; a genuine orphan `.css` file is still caught.
    const onDisk = readdirSync(resolve('src'))
      .filter((name) => name.endsWith('.css') && !name.startsWith('.'))
      .sort()
    expect(onDisk).toEqual([...ORDER].sort())
  })
})

// The exports map is the only thing standing between a consumer's import and
// a resolution error, and nothing in this repo imports either path - so a
// typo'd or renamed target is invisible here and fails in someone else's
// build. Check every declared entry point points at a file that exists, and
// that the tokens entry really is the tokens rather than, say, the whole
// artifact: a consumer asking for the palette without the components would
// otherwise get the components and never know why their app changed shape.
describe('package exports', () => {
  const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf8'))

  it('every entry point resolves to a file that exists', () => {
    for (const target of Object.values(pkg.exports)) {
      expect(() => readFileSync(resolve(target), 'utf8')).not.toThrow()
    }
  })

  it('ships the tokens without the components', () => {
    const tokens = readFileSync(resolve(pkg.exports['./tokens.css']), 'utf8')
    expect(tokens).toContain('--axi-accent')
    expect(tokens).not.toContain('.axi-btn')
  })
})
