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

describe('aliases', () => {
  const index = [{
    id: 'notice', name: 'Notice', layer: 'shells', layerName: 'Shells',
    summary: 'A box with an icon.', classes: ['.axi-notice'], aliases: ['alert', 'banner'],
  }]

  it('finds an entry by a name it does not have', () => {
    expect(matches('alert', index).map((e) => e.id)).toEqual(['notice'])
  })

  // An alias is a synonym, not a name. It must never outrank a real name
  // match, or typing "progress" would surface the spinner above the meter.
  it('ranks an alias below a name match', () => {
    const two = [
      { ...index[0], id: 'spinner', name: 'Spinner', aliases: ['progress'] },
      { ...index[0], id: 'meter', name: 'Progress meter', aliases: [] },
    ]
    expect(matches('progress', two).map((e) => e.id)).toEqual(['meter', 'spinner'])
  })

  it('survives an entry with no aliases field', () => {
    expect(matches('notice', [{ ...index[0], aliases: undefined }]).map((e) => e.id)).toEqual(['notice'])
  })
})
