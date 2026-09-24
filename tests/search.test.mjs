import { describe, it, expect } from 'vitest'
import { matches } from '../docs/site/search.js'

const index = [
  { id: 'meter', name: 'Meter', layer: 'data', summary: 'A horizontal bar.', classes: ['.axi-meter', '.axi-meter__fill'] },
  { id: 'btn', name: 'Button', layer: 'primitives', summary: 'A control.', classes: ['.axi-btn'] },
]

describe('matches', () => {
  it('finds by name, case-insensitively', () => {
    expect(matches('MET', index).map((e) => e.id)).toEqual(['meter'])
  })

  it('finds by class name, with or without the leading dot', () => {
    expect(matches('.axi-btn', index).map((e) => e.id)).toEqual(['btn'])
    expect(matches('axi-meter__fill', index).map((e) => e.id)).toEqual(['meter'])
  })

  it('finds by summary text', () => {
    expect(matches('horizontal', index).map((e) => e.id)).toEqual(['meter'])
  })

  it('ranks a name match above a summary match', () => {
    const idx = [{ id: 'a', name: 'Alpha', layer: 'data', summary: 'mentions button', classes: [] },
      { id: 'btn', name: 'Button', layer: 'primitives', summary: '', classes: [] }]
    expect(matches('button', idx)[0].id).toBe('btn')
  })

  it('returns nothing for an empty query', () => {
    expect(matches('   ', index)).toEqual([])
  })
})
