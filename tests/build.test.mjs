import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { buildCss, ORDER, ICONS, aliasPairs, buildIconSprite, buildIconsJson, staleIconFiles } from '../scripts/build.mjs'

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
      if (target.includes('*')) continue
      expect(() => readFileSync(resolve(target), 'utf8')).not.toThrow()
    }
  })

  // A subpath pattern has no single target to stat, so the check above has to
  // skip it - and skipping is how an export stops being checked at all. Every
  // pattern is therefore expanded against what is actually on disk and every
  // expansion resolved, which is the same guarantee for the form of export
  // that would otherwise get a free pass.
  it('every subpath pattern resolves for everything it matches', () => {
    for (const [subpath, target] of Object.entries(pkg.exports)) {
      if (!target.includes('*')) continue
      const [dir, suffix] = target.split('*')
      const matches = readdirSync(resolve(dir)).filter((f) => f.endsWith(suffix))
      expect(matches.length, `${subpath} matches nothing`).toBeGreaterThan(0)
      for (const m of matches) {
        expect(() => readFileSync(resolve(dir, m), 'utf8')).not.toThrow()
      }
    }
  })

  it('ships the tokens without the components', () => {
    const tokens = readFileSync(resolve(pkg.exports['./tokens.css']), 'utf8')
    expect(tokens).toContain('--axi-accent')
    expect(tokens).not.toContain('.axi-btn')
  })
})

// Everything in the suite imports this package, so "what are we allowed to do
// with it" is a question about every app at once. The two halves of the answer
// live in different files, and nothing but this test ties them together.
describe('licensing', () => {
  const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf8'))

  it('declares the same licence the LICENSE file grants', () => {
    expect(pkg.license).toBe('MIT')
    expect(readFileSync(resolve('LICENSE'), 'utf8')).toMatch(/^MIT License/)
  })

  it('publishes the scope publicly', () => {
    // A scoped package is restricted by default, and a restricted design
    // language cannot be installed by the apps that need it.
    expect(pkg.name.startsWith('@')).toBe(true)
    expect(pkg.publishConfig?.access).toBe('public')
  })
})

// dist/ is committed and published, same as dist/axi.css: an icon added to
// icons/ and never built is an icon the docs page lists and the consumer
// cannot render.
describe('dist/icons', () => {
  it('reads every file in icons/', () => {
    const onDisk = readdirSync(resolve('icons'))
      .filter((f) => f.endsWith('.svg') && !f.startsWith('.'))
      .map((f) => f.replace(/\.svg$/, ''))
      .sort()
    expect(ICONS.map((i) => i.name)).toEqual(onDisk)
  })

  it('gives every icon a symbol carrying the canvas', () => {
    const sprite = buildIconSprite()
    for (const icon of ICONS) {
      expect(sprite).toContain(`<symbol id="axi-${icon.name}" viewBox="0 0 24 24"`)
    }
  })

  it('emits one symbol per drawing and one per lucide name', () => {
    const sprite = buildIconSprite()
    expect(sprite.match(/<symbol /g).length).toBe(ICONS.length + aliasPairs().length)
  })

  // The alias symbol is a real symbol with a real body. An `aliases` field
  // that only fed the docs filter left `<use href="#axi-triangle-alert">`
  // resolving to nothing - a name that is discoverable and does not work.
  it('resolves a lucide name to the canonical drawing', () => {
    const sprite = buildIconSprite()
    expect(sprite).toContain('<symbol id="axi-triangle-alert"')
    const symbol = sprite.split('<symbol id="axi-triangle-alert"')[1].split('</symbol>')[0]
    expect(symbol).toContain('<use href="#axi-circle-alert"/>')
  })

  it('gives every symbol in the sprite a unique id', () => {
    const ids = [...buildIconSprite().matchAll(/<symbol id="([^"]+)"/g)].map((m) => m[1])
    expect(ids.length).toBe(new Set(ids).size)
  })

  // A file per alias is real weight for a case - <img src>, mask-image -
  // where the consumer is writing the path by hand and can write the
  // canonical one. The sprite is where the indirection belongs.
  it('writes no standalone file for a lucide name', () => {
    for (const { alias } of aliasPairs()) {
      expect(existsSync(resolve(`dist/icons/${alias}.svg`)), `dist/icons/${alias}.svg`).toBe(false)
    }
  })

  // The stroke attributes live on the symbol, not on the sprite root: a
  // <use> instantiates the symbol, and an attribute on the root would not
  // travel with it.
  it('carries the stroke attributes on each symbol', () => {
    const sprite = buildIconSprite()
    const symbol = sprite.split('<symbol ')[1]
    expect(symbol).toContain('stroke="currentColor"')
    expect(symbol).toContain('stroke-width="3"')
    expect(symbol).toContain('fill="none"')
  })

  it('matches the committed sprite', () => {
    expect(readFileSync(resolve('dist/icons/sprite.svg'), 'utf8')).toBe(buildIconSprite())
  })

  // icons.json is committed and published beside the sprite, and nothing in
  // this repo imports it - so an entry added to docs/manifest/icons.mjs and
  // never rebuilt ships a catalogue that disagrees with the drawings, with a
  // green run to say so. Same guarantee dist/axi.css gets.
  it('matches the committed icons.json', () => {
    expect(readFileSync(resolve('dist/icons/icons.json'), 'utf8')).toBe(buildIconsJson())
  })

  it('writes an individual file per icon', () => {
    for (const icon of ICONS) {
      expect(existsSync(resolve(`dist/icons/${icon.name}.svg`))).toBe(true)
    }
  })
})

// An external <use> is a cross-document reference, and cross-document means
// same-origin: under file:// - which is exactly how an Electron app loading
// with loadFile() runs, and Electron is half of what this language is for -
// the reference resolves to nothing and the glyph is silently absent. The
// pattern the README hands a consumer cannot be the one that fails on the
// platform the spec promises. This lives in build.test.mjs because the README
// is where a consumer meets the sprite.
describe('the documented consumer pattern', () => {
  const readme = readFileSync(resolve('README.md'), 'utf8')
  const section = readme.slice(readme.indexOf('### An icon set of its own'))

  it('warns that an external sprite is same-origin only', () => {
    expect(section).toMatch(/file:\/\//)
    expect(section).toMatch(/same-origin|same origin/i)
  })

  it('names what to do instead', () => {
    expect(section).toMatch(/inline|dist\/icons\/&lt;name&gt;\.svg|dist\/icons\/<name>\.svg/)
  })

  // The one number in the README that no test read, in a file nothing imports.
  it('states the real size of the set', () => {
    const words = ['Forty-seven', 'Forty-eight', 'Forty-nine', 'Fifty', 'Fifty-one', 'Fifty-two',
      'Fifty-three', 'Fifty-four', 'Fifty-five', 'Fifty-six', 'Fifty-seven', 'Fifty-eight',
      'Fifty-nine', 'Sixty']
    expect(words[ICONS.length - 47], `no word for ${ICONS.length}`).toBeDefined()
    expect(section).toContain(`${words[ICONS.length - 47]} glyphs drawn to`)
  })
})

// The drift test above only runs one way: it asserts every icon in icons/ has
// a file in dist/icons/. Nothing asserted the reverse, and the build never
// cleaned the directory - so renaming `folder-open.svg` leaves the old
// `folder-open.svg` in dist/, committed and published, a glyph the catalogue
// does not list and no test would ever mention again. A generated directory
// that only ever grows is not generated, it is accumulated.
describe('dist/icons is generated, not accumulated', () => {
  it('names the files that no longer belong', () => {
    const present = ['sprite.svg', 'icons.json', 'search.svg', 'folder-open.svg']
    const icons = [{ name: 'search' }]
    expect(staleIconFiles(present, icons)).toEqual(['folder-open.svg'])
  })

  it('keeps the sprite and the catalogue', () => {
    expect(staleIconFiles(['sprite.svg', 'icons.json'], [])).toEqual([])
  })

  it('leaves nothing in the committed directory that the set does not claim', () => {
    const expected = new Set(['sprite.svg', 'icons.json', ...ICONS.map((i) => `${i.name}.svg`)])
    const extra = readdirSync(resolve('dist/icons')).filter((f) => !expected.has(f))
    expect(extra).toEqual([])
  })

  // The helper is only worth anything if the build actually calls it.
  it('removes a stale file on the next build', () => {
    const stale = resolve('dist/icons/zz-not-an-icon.svg')
    writeFileSync(stale, '<svg/>\n')
    execFileSync('node', ['scripts/build.mjs'], { stdio: 'pipe' })
    expect(existsSync(stale)).toBe(false)
  })
})
