import { describe, it, expect } from 'vitest'
import { definedClasses, fallbackKnobs, ruleNumbers } from '../docs/manifest/introspect.mjs'

describe('definedClasses', () => {
  it('takes classes from selector text', () => {
    const css = '.axi-btn, .axi-btn--ghost { color: red; }'
    expect(definedClasses(css)).toEqual(['.axi-btn', '.axi-btn--ghost'])
  })

  it('finds classes nested inside an at-rule', () => {
    const css = '@media (min-width: 700px) { .axi-grid { display: grid; } }'
    expect(definedClasses(css)).toEqual(['.axi-grid'])
  })

  it('ignores a class named inside a declaration value', () => {
    const css = '.axi-card { background: url("sprite-axi-card.png"); }'
    expect(definedClasses(css)).toEqual(['.axi-card'])
  })

  it('ignores a class mentioned only in a comment', () => {
    const css = '/* .axi-ghost was removed in 1.6 */ .axi-btn { color: red; }'
    expect(definedClasses(css)).toEqual(['.axi-btn'])
  })

  it('reads the real stylesheet and finds a known component', () => {
    expect(definedClasses()).toContain('.axi-meter__fill')
  })
})

describe('fallbackKnobs', () => {
  it('takes only properties read with a fallback', () => {
    const css = '.axi-meter { height: var(--axi-meter-h, 12px); color: var(--axi-text); }'
    expect(fallbackKnobs(css)).toEqual(['--axi-meter-h'])
  })

  it('tolerates whitespace inside the var call', () => {
    expect(fallbackKnobs('a { width: var( --axi-switch-w , 46px ); }')).toEqual(['--axi-switch-w'])
  })

  it('reads the real stylesheet and finds a known knob', () => {
    expect(fallbackKnobs()).toContain('--axi-meter-v')
  })
})

describe('ruleNumbers', () => {
  it('returns the numbered clauses of RULES.md, in order', () => {
    expect(ruleNumbers()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
  })
})
