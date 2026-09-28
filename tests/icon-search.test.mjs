import { describe, it, expect } from 'vitest'
import { iconMatches } from '../docs/site/icon-search.js'

// A reader arrives with the word their last framework used, not with Lucide's
// name. Finding `search` by typing "magnifier" is the whole reason the
// manifest carries aliases and keywords at all - an attribute in the markup
// that nothing reads would have been a promise, not a feature.
const index = [
  { name: 'search', keywords: 'magnifier find filter lookup query' },
  { name: 'trash-2', keywords: 'delete bin remove destroy discard' },
  { name: 'circle-alert', keywords: 'alert warning exclamation danger error' },
]

describe('iconMatches', () => {
  it('finds an icon by its own name', () => {
    expect(iconMatches('trash', index).map((e) => e.name)).toEqual(['trash-2'])
  })

  it('finds an icon by a word it is not called', () => {
    expect(iconMatches('magnifier', index).map((e) => e.name)).toEqual(['search'])
  })

  it('is case- and whitespace-insensitive', () => {
    expect(iconMatches('  DELETE ', index).map((e) => e.name)).toEqual(['trash-2'])
  })

  it('ranks a name match above a keyword match', () => {
    // "filter" is search's keyword; were there an icon named filter it would
    // have to come first, or typing a name would not find it.
    const idx = [...index, { name: 'filter', keywords: 'funnel narrow refine' }]
    expect(iconMatches('filter', idx)[0].name).toBe('filter')
  })

  it('returns everything for an empty query, so clearing the box restores the grid', () => {
    expect(iconMatches('   ', index)).toEqual(index)
  })

  it('returns nothing when nothing matches', () => {
    expect(iconMatches('zzzz', index)).toEqual([])
  })
})
