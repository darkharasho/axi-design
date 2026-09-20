import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { ORDER } from '../scripts/build.mjs'

const read = (name) => readFileSync(resolve('src', name), 'utf8')

// Strip comments before scanning. Comments routinely mention a hex value while
// explaining why it was chosen, and a naive scan would read that as a
// violation - a false failure that teaches people to stop writing the comments.
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '')

const TOKENS_FILE = 'tokens.css'
const COMPONENT_FILES = () => ORDER.filter((name) => name !== TOKENS_FILE)

// A token reference counts as satisfied if EITHER:
//   - the token is declared (`--name:`) in ANY src/*.css file listed in ORDER, or
//   - that particular reference supplies a fallback (`var(--name, <something>)`).
// tokens.css is deliberately not the only place a declaration counts: later
// layers (menus, drawers, grids, ...) legitimately expose per-instance API
// knobs - e.g. --axi-pill-fill, --axi-grid-min - that a consumer sets inline
// via a style attribute rather than a theme-wide value in tokens.css. Do not
// "fix" this back to reading only tokens.css: that breaks every task that
// adds such a knob. A token with no fallback that is declared nowhere is
// still a failure - that is the typo this test exists to catch.
const declared = () => {
  const found = new Set()
  for (const name of ORDER) {
    for (const m of stripComments(read(name)).matchAll(/(--axi-[a-z0-9-]+)\s*:/g)) {
      found.add(m[1])
    }
  }
  return found
}

// Each match captures the token name plus whether that particular reference
// supplies a fallback (a comma right after the name inside the var() call).
const references = (css) =>
  [...stripComments(css).matchAll(/var\(\s*(--axi-[a-z0-9-]+)\s*(,)?/g)].map((m) => ({
    token: m[1],
    hasFallback: Boolean(m[2]),
  }))

// Hex, rgb()/rgba(), hsl()/hsla(). `transparent` and `currentColor` are
// deliberately absent: they are not themeable values, so tokenising them would
// add indirection without buying anything.
const COLOUR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/

// Matches a border WIDTH declaration (the shorthand or any longhand/logical
// side, optionally with an explicit `-width`), but not `border-radius`,
// `border-color`, `border-style`, `border-collapse` or `border-spacing`, and
// not a `var(...)` reference to one of the two declared form steps.
const BORDER_WEIGHT = /\bborder(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-width)?\s*:\s*[^;{]*?\b\d+(\.\d+)?px/

describe('token contract', () => {
  it('defines every --axi-* token that any source references', () => {
    const known = declared()
    const missing = []
    for (const name of ORDER) {
      for (const { token, hasFallback } of references(read(name))) {
        if (!known.has(token) && !hasFallback) missing.push(`${name}: ${token}`)
      }
    }
    expect(missing).toEqual([])
  })

  it('keeps every colour literal inside tokens.css', () => {
    const offenders = []
    for (const name of COMPONENT_FILES()) {
      stripComments(read(name))
        .split('\n')
        .forEach((line, i) => {
          if (COLOUR_LITERAL.test(line)) offenders.push(`${name}:${i + 1}: ${line.trim()}`)
        })
    }
    expect(offenders).toEqual([])
  })

  it('uses only the two declared form steps for outlines', () => {
    // A third border weight is how a system stops looking like one system.
    // Any literal px border width in a component means a step was invented.
    const offenders = []
    for (const name of COMPONENT_FILES()) {
      stripComments(read(name))
        .split('\n')
        .forEach((line, i) => {
          if (BORDER_WEIGHT.test(line)) {
            offenders.push(`${name}:${i + 1}: ${line.trim()}`)
          }
        })
    }
    expect(offenders).toEqual([])
  })
})
