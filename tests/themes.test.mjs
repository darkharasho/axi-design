import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, basename } from 'node:path'
import { execSync } from 'node:child_process'
import { THEMES, buildThemeCss } from '../scripts/build.mjs'
import { page } from '../docs/site/shell.mjs'
import { chooseTheme, applyTheme } from '../docs/site/theme.js'
import { build } from '../scripts/site.mjs'

// A theme is a repaint of the language, never an extension of it: see the
// Themes section of docs/RULES.md. The main theme in src/tokens.css is the
// definition, and a theme may only restate tokens that definition already
// has. This file is that obligation as a check rather than a promise, because
// "no glass-only component" is exactly the kind of rule that erodes one
// convenient exception at a time.
//
// The mirror checks are per-theme loops, so they were vacuous when this file
// landed - deliberately, one commit ahead of the first theme, so that theme
// was born under them. The synthetic block at the foot is what kept them
// honest in the meantime and is what keeps them honest if themes/ is ever
// emptied again.

const THEME_DIR = 'dist/themes'

// Same treatment as tokens.test.mjs: a comment routinely mentions a property
// while explaining it, and reading that as a declaration is a false failure
// that teaches people to stop writing the comments. Newlines are preserved so
// an offender is still reported at its true line.
const stripComments = (css) =>
  css.replace(/\/\*[\s\S]*?\*\//g, (m) => '\n'.repeat((m.match(/\n/g) || []).length))

const themeFiles = () =>
  existsSync(THEME_DIR)
    ? readdirSync(THEME_DIR)
        .filter((f) => f.endsWith('.css'))
        .map((f) => ({ id: basename(f, '.css'), path: resolve(THEME_DIR, f) }))
    : []

// Every custom property src/tokens.css declares. This is the vocabulary a
// theme is allowed to speak, and nothing beyond it.
const mainThemeTokens = () => {
  const css = stripComments(readFileSync(resolve('src/tokens.css'), 'utf8'))
  return new Set([...css.matchAll(/(--axi-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
}

// Split a generated theme into its rules. The generator emits
// `<selector> { <declarations> }` and nothing else, so anything this cannot
// parse into that shape is by definition not a theme - which is the point of
// asserting on `rest` below rather than quietly skipping what does not match.
const rules = (css) => {
  const clean = stripComments(css)
  const found = [...clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  return {
    rules: found.map((m) => ({ selector: m[1].trim(), body: m[2] })),
    rest: clean.replace(/[^{}]+\{[^{}]*\}/g, '').trim(),
  }
}

const declarationsIn = (body) =>
  body
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => {
      const i = d.indexOf(':')
      return { property: d.slice(0, i).trim(), value: d.slice(i + 1).trim(), text: d }
    })

describe('a theme mirrors the main theme one-for-one', () => {
  // Nothing added, part one: drawing a theme-only component takes a second
  // selector, so "exactly one rule" is what makes `.axi-panel--glass`
  // impossible rather than merely discouraged.
  it('is one rule, hooked on its own id, with nothing outside it', () => {
    for (const { id, path } of themeFiles()) {
      const { rules: found, rest } = rules(readFileSync(path, 'utf8'))
      expect(rest, `${id}.css has CSS outside a rule`).toBe('')
      expect(found.length, `${id}.css declares ${found.length} rules`).toBe(1)
      expect(found[0].selector).toBe(`[data-axi-theme="${id}"]`)
    }
  })

  // Nothing added, part two: a theme sets values, it does not style. A plain
  // property here would be the theme reaching past the token layer to paint
  // something directly.
  it('sets custom properties and nothing else', () => {
    for (const { id, path } of themeFiles()) {
      for (const { body } of rules(readFileSync(path, 'utf8')).rules) {
        for (const d of declarationsIn(body)) {
          expect(d.property, `${id}.css: ${d.text}`).toMatch(/^--axi-[a-z0-9-]+$/)
        }
      }
    }
  })

  // Nothing added, part three. An invented token is the quiet version of a
  // theme-only component: the theme sets it, some component would have to
  // read it, and the mirror is broken without a single new selector. A new
  // capability has to enter through tokens.css with an inert default first.
  it('restates only tokens the main theme already declares', () => {
    const known = mainThemeTokens()
    for (const { id, path } of themeFiles()) {
      for (const { body } of rules(readFileSync(path, 'utf8')).rules) {
        for (const d of declarationsIn(body)) {
          expect(known.has(d.property), `${id}.css invents ${d.property}`).toBe(true)
        }
      }
    }
  })

  // Nothing dropped. `--axi-surface: ;` is a valid declaration that resolves
  // to nothing, which is how a theme would leave a component unpainted while
  // passing every check above.
  it('never sets a token to nothing', () => {
    for (const { id, path } of themeFiles()) {
      for (const { body } of rules(readFileSync(path, 'utf8')).rules) {
        for (const d of declarationsIn(body)) {
          expect(d.value, `${id}.css empties ${d.property}`).not.toBe('')
        }
      }
    }
  })
})

// dist/themes/ is committed for the same reason dist/accents.css is: npm and
// the Pages workflow publish the artifact, nothing in-repo imports it, and so
// a stale file would have no symptom at all.
describe('the generated theme files', () => {
  it('match the generation from themes/*.json', () => {
    for (const theme of THEMES) {
      const committed = readFileSync(resolve(`dist/themes/${theme.id}.css`), 'utf8')
      expect(committed, `dist/themes/${theme.id}.css is stale`).toBe(buildThemeCss(theme))
    }
  })

  // The dist/ scan the mirror checks run over and the themes/ list the build
  // generates from have to be the same set. A json with no css is a theme the
  // build forgot; a css with no json is a hand-written file the mirror checks
  // would police but nothing regenerates.
  it('are exactly the themes themes/ declares', () => {
    expect(themeFiles().map((t) => t.id).sort()).toEqual(THEMES.map((t) => t.id).sort())
  })

  it('leaves the saturated fills, the measure and the type to the language', () => {
    // Stated as a check because it is the claim the Themes section rests on:
    // a theme repaints, it does not redesign. The five fills carry meaning
    // (rules 5, 6, 9, 10), and a theme that moved one would be a second design
    // language wearing these class names.
    //
    // The `-ink` companions are deliberately NOT on this list. --axi-accent-ink
    // and --axi-ink-on-fill are the colour a WORD is written in when it sits on
    // one of those fills, not the fill itself, and a theme that lightens the
    // outline has to be able to hold them dark - that is the entire reason
    // --axi-ink-on-fill was split out of --axi-ink-line. Forbidding them here
    // would forbid the one case the split exists to serve.
    //
    // This list used to hold the whole form, on the reading that rule 3's hard
    // block and square corner were the language itself. That was too wide, and
    // it is what made the first glass theme a pale sketch of its own mock. What
    // rule 3 actually requires is that a raised element READ as raised and an
    // outlined one as outlined, and a soft drop with an inset highlight is a
    // second answer to that question rather than a refusal of it. So a theme
    // may now restate --axi-shadow-*, --axi-border-* and --axi-radius*: the
    // block and the corner are how a theme says what its material is, and one
    // material drawn in another's block is the component drift this file is
    // here to prevent, not an example of it.
    //
    // What stays the language, and why each one is not the same call:
    //   --axi-offset-*  the step scale the main block is composed FROM. A theme
    //                   restates the composed --axi-shadow-* wholesale or not at
    //                   all; retuning the offsets underneath it would leave the
    //                   two spellings of "the block" disagreeing.
    //   measure         --axi-page, --axi-gutter. Where the text wraps is not a
    //                   look, and a theme that moved it would reflow the page.
    //   type            --axi-sans, --axi-mono, --axi-t-*, --axi-ls-*. Same,
    //                   harder: the type scale is the voice.
    const FILLS = ['--axi-accent', '--axi-meta', '--axi-ok', '--axi-warn', '--axi-danger']
    const FORM = /^--axi-(offset|page|gutter|sans|mono|t|ls)(-|$)/
    for (const theme of THEMES) {
      for (const name of Object.keys(theme.tokens)) {
        expect(FILLS.includes(name), `${theme.id} restates the fill ${name}`).toBe(false)
        expect(FORM.test(name), `${theme.id} restates the language token ${name}`).toBe(false)
      }
    }

    // The loop above only runs over the themes that exist, so it would go on
    // passing if the line were widened until it matched nothing. Pin both
    // edges of where it was just moved to.
    for (const open of ['--axi-shadow-panel', '--axi-border-control', '--axi-radius', '--axi-radius-sm']) {
      expect(FORM.test(open), `${open} should be a theme's to restate`).toBe(false)
    }
    for (const shut of ['--axi-offset-panel', '--axi-page', '--axi-gutter', '--axi-t-body', '--axi-ls-label', '--axi-sans']) {
      expect(FORM.test(shut), `${shut} should be the language's`).toBe(true)
    }
  })
})

describe('theme packaging', () => {
  it('ships the generated themes in the npm tarball', () => {
    const [pack] = JSON.parse(execSync('npm pack --dry-run --json', { encoding: 'utf8' }))
    const paths = pack.files.map((f) => f.path)
    for (const theme of THEMES) {
      expect(paths).toContain(`dist/themes/${theme.id}.css`)
    }
  })

  // A subpath pattern rather than an entry per theme, so adding a theme
  // cannot silently ship an unimportable file.
  it('exports every theme through one subpath pattern', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
    expect(pkg.exports['./themes/*.css']).toBe('./dist/themes/*.css')
  })
})

// The checks above are all "for each theme", so with no themes they are four
// empty loops and would go on passing if the directory scan silently broke.
// These pin the machinery itself against hand-written samples, so the guards
// are known to bite before there is anything for them to bite.
describe('the mirror checks themselves', () => {
  const ID = 'sample'
  const check = (css) => {
    const { rules: found, rest } = rules(css)
    const known = mainThemeTokens()
    if (rest !== '') return 'css outside a rule'
    if (found.length !== 1) return 'not exactly one rule'
    if (found[0].selector !== `[data-axi-theme="${ID}"]`) return 'wrong hook'
    for (const d of declarationsIn(found[0].body)) {
      if (!/^--axi-[a-z0-9-]+$/.test(d.property)) return 'not a custom property'
      if (!known.has(d.property)) return 'invented token'
      if (d.value === '') return 'empty value'
    }
    return 'ok'
  }

  it('accepts a theme that only restates surface tokens', () => {
    expect(check('[data-axi-theme="sample"] { --axi-surface: #123456; }')).toBe('ok')
  })

  it('rejects a theme-only component', () => {
    expect(
      check('[data-axi-theme="sample"] { --axi-surface: #123456; }\n.axi-panel--glass { --axi-surface: #654321; }'),
    ).toBe('not exactly one rule')
  })

  it('rejects a theme that styles directly', () => {
    expect(check('[data-axi-theme="sample"] { background: #123456; }')).toBe('not a custom property')
  })

  it('rejects an invented token', () => {
    expect(check('[data-axi-theme="sample"] { --axi-glass-blur: 12px; }')).toBe('invented token')
  })

  it('rejects a token emptied rather than restated', () => {
    expect(check('[data-axi-theme="sample"] { --axi-surface: ; }')).toBe('empty value')
  })

  it('rejects a hook that is not the file id', () => {
    expect(check('[data-axi-theme="glass"] { --axi-surface: #123456; }')).toBe('wrong hook')
  })

  it('reads the main theme vocabulary out of tokens.css', () => {
    const known = mainThemeTokens()
    expect(known.has('--axi-surface')).toBe(true)
    expect(known.has('--axi-ink-line')).toBe(true)
    expect(known.has('--axi-glass-blur')).toBe(false)
  })
})

// The site is the only place a reader can see a theme before adopting one, and
// the switcher is deliberately not a preview: it sets the same attribute a
// consumer sets, against the same generated stylesheet a consumer imports. So
// what these check is that the site keeps using the published mechanism, not
// that a picker exists.
describe('the docs site switcher', () => {
  const html = page({ title: 'Meter', nav: 'components', body: '<p>hi</p>' })

  it('offers the main theme and every theme, in that order', () => {
    const select = html.match(/<select class="axi-select" id="theme">([\s\S]*?)<\/select>/)
    expect(select, 'no theme select in the masthead').not.toBeNull()
    const values = [...select[1].matchAll(/<option value="([^"]*)">/g)].map((m) => m[1])
    expect(values).toEqual(['', ...THEMES.map((t) => t.id)])
  })

  it('labels the select for a reader who cannot see it', () => {
    expect(html).toContain('<label class="axi-sr-only" for="theme">Theme</label>')
  })

  // Linked on every page rather than fetched on switch: a theme is inert until
  // its attribute matches, so the cost is one small file and the benefit is
  // that switching cannot half-apply while a stylesheet is still in flight.
  it('links every theme stylesheet through url()', () => {
    for (const theme of THEMES) {
      expect(html).toContain(`<link rel="stylesheet" href="/axi-design/themes/${theme.id}.css">`)
    }
    expect(html).toContain('src="/axi-design/theme.js"')
  })

  it('copies every theme into the built site', () => {
    const out = mkdtempSync(resolve(tmpdir(), 'axi-themes-'))
    try {
      const written = build(out)
      for (const theme of THEMES) {
        expect(written).toContain(`themes/${theme.id}.css`)
        expect(readFileSync(resolve(out, `themes/${theme.id}.css`), 'utf8')).toBe(buildThemeCss(theme))
      }
      expect(written).toContain('theme.js')
    } finally {
      rmSync(out, { recursive: true, force: true })
    }
  })
})

describe('chooseTheme', () => {
  const valid = THEMES.map((t) => t.id)

  it('keeps a persisted theme that still exists', () => {
    expect(chooseTheme('glass', valid)).toBe('glass')
  })

  // The accent's fallback exists because an unset accent is an unthemed page.
  // This one is the opposite case and must not be modelled on it: no theme is
  // the main theme, which is the language, so a retired id and a first visit
  // land in the same correct place rather than on whichever theme is first.
  it('falls back to the main theme, not to the first theme', () => {
    expect(chooseTheme('frosted', valid)).toBe('')
    expect(chooseTheme(null, valid)).toBe('')
  })
})

// `[data-axi-theme=""]` matches no theme rule, so an empty attribute renders
// correctly and would pass any screenshot - while telling everything else
// reading the DOM that a theme is on. Assert the attribute is gone.
describe('applyTheme', () => {
  const root = () => {
    const attrs = new Map()
    return {
      attrs,
      setAttribute: (k, v) => attrs.set(k, v),
      removeAttribute: (k) => attrs.delete(k),
    }
  }

  it('sets the attribute for a theme', () => {
    const el = root()
    applyTheme(el, 'glass')
    expect(el.attrs.get('data-axi-theme')).toBe('glass')
  })

  it('removes the attribute for the main theme', () => {
    const el = root()
    applyTheme(el, 'glass')
    applyTheme(el, '')
    expect(el.attrs.has('data-axi-theme')).toBe(false)
  })
})

// --axi-ground-image is a comma-separated list of three gradients under the
// glass theme, and the `background` shorthand only accepts a colour in its
// FINAL layer. `background: var(--axi-ground) var(--axi-ground-image)` puts the
// colour in the first layer, which makes the whole declaration invalid and
// drops it - leaving the element with no fill at all. That shipped once, in
// .axi-sheet, and nothing in this suite noticed: the CSS parses, the token
// resolves, and only a browser computing the value shows the loss.
//
// The rule is the one base.css already follows for body: read the image token
// with the background-image longhand, never the shorthand.
describe('the ground image token', () => {
  const SRC = resolve(process.cwd(), 'src')
  const css = readFileSync(resolve(SRC, 'shells.css'), 'utf8') +
    readFileSync(resolve(SRC, 'base.css'), 'utf8') +
    readFileSync(resolve(SRC, 'primitives.css'), 'utf8') +
    readFileSync(resolve(SRC, 'layout.css'), 'utf8') +
    readFileSync(resolve(SRC, 'data.css'), 'utf8') +
    readFileSync(resolve(SRC, 'feedback.css'), 'utf8') +
    readFileSync(resolve(SRC, 'forms.css'), 'utf8')

  const declarations = (text) =>
    [...text.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([a-z-]+)\s*:\s*([^;}]*--axi-ground-image[^;}]*)/g)]

  it('is only ever read through the background-image longhand', () => {
    for (const [, prop] of declarations(css)) expect(prop).toBe('background-image')
  })

  it('finds the declarations it is meant to guard', () => {
    expect(declarations(css).length).toBeGreaterThan(1)
  })

  it('fails on the shorthand form that shipped broken', () => {
    const bad = declarations('.x { background: var(--axi-ground) var(--axi-ground-image); }')
    expect(bad.map(([, p]) => p)).toEqual(['background'])
  })
})
