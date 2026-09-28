import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, basename } from 'node:path'

// A theme is a repaint of the language, never an extension of it: see the
// Themes section of docs/RULES.md. The main theme in src/tokens.css is the
// definition, and a theme may only restate tokens that definition already
// has. This file is that obligation as a check rather than a promise, because
// "no glass-only component" is exactly the kind of rule that erodes one
// convenient exception at a time.
//
// It passes vacuously while dist/themes/ is empty, which is deliberate: it
// lands before the first theme so the first theme is born under it.

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
