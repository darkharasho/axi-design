import { describe, it, expect } from 'vitest'
import { chooseAccent } from '../docs/site/accent.js'
import { ACCENTS } from '../docs/site/shell.mjs'

describe('chooseAccent', () => {
  const valid = ACCENTS.map((a) => a.id)

  it('keeps a persisted accent that is still official', () => {
    expect(chooseAccent('violet-purple', valid, valid[0])).toBe('violet-purple')
  })

  // Review Focus: accents.json is versioned data and a returning visitor's
  // localStorage is not. An id dropped from the list must not leave
  // --axi-accent unset - that is not a degraded page, it is an unthemed one.
  it('falls back when the persisted accent has been retired', () => {
    expect(chooseAccent('sunset-tangerine', valid, valid[0])).toBe('axi-gold')
  })

  it('falls back when nothing was ever persisted', () => {
    expect(chooseAccent(null, valid, valid[0])).toBe('axi-gold')
  })
})
