import { describe, it, expect } from 'vitest'
import { entries, LAYERS, RESERVED_IDS } from '../docs/manifest/index.mjs'
import { definedClasses, ruleNumbers } from '../docs/manifest/introspect.mjs'

const ALL = entries()

describe('manifest entry shape', () => {
  it('gives every entry a unique id', () => {
    const ids = ALL.map((e) => e.id)
    expect(ids).toEqual([...new Set(ids)])
  })

  it('uses only kebab-case ids', () => {
    for (const e of ALL) expect(e.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  // A component id becomes a directory under /components/, but the generator
  // also writes static routes at the site root. An id that collides with one
  // of those means two pages racing for one path, and the survivor is whichever
  // happened to be written last - a silent, ordering-dependent loss.
  it('never takes an id reserved by a static route', () => {
    for (const e of ALL) expect(RESERVED_IDS).not.toContain(e.id)
  })

  it('declares a known layer', () => {
    for (const e of ALL) expect(LAYERS).toContain(e.layer)
  })

  it('has a non-empty name and summary', () => {
    for (const e of ALL) {
      expect(e.name.length).toBeGreaterThan(0)
      expect(e.summary.length).toBeGreaterThan(0)
    }
  })

  it('lists at least one class and one example', () => {
    for (const e of ALL) {
      expect(e.classes.length).toBeGreaterThan(0)
      expect(e.examples.length).toBeGreaterThan(0)
    }
  })

  it('gives every example a title and markup', () => {
    for (const e of ALL) {
      for (const ex of e.examples) {
        expect(ex.title.length).toBeGreaterThan(0)
        expect(ex.html.trim().length).toBeGreaterThan(0)
      }
    }
  })
})

describe('manifest against the stylesheet', () => {
  it('claims only classes src/ actually defines', () => {
    const defined = new Set(definedClasses())
    for (const e of ALL) {
      for (const cls of e.classes) {
        expect(defined.has(cls), `${e.id} claims ${cls}, which src/ does not define`).toBe(true)
      }
    }
  })

  it('never claims one class from two entries', () => {
    const owner = new Map()
    for (const e of ALL) {
      for (const cls of e.classes) {
        expect(owner.has(cls), `${cls} is claimed by both ${owner.get(cls)} and ${e.id}`).toBe(false)
        owner.set(cls, e.id)
      }
    }
  })

  it('uses only classes src/ defines inside example markup', () => {
    const defined = new Set(definedClasses())
    for (const e of ALL) {
      for (const ex of e.examples) {
        for (const match of ex.html.matchAll(/class="([^"]*)"/g)) {
          for (const cls of match[1].split(/\s+/).filter(Boolean)) {
            if (!cls.startsWith('axi-')) continue
            expect(defined.has(`.${cls}`), `${e.id}/"${ex.title}" uses .${cls}, undefined in src/`).toBe(true)
          }
        }
      }
    }
  })

  // "Rules this answers" deep-links to /rules/#rule-<n>. A rule renumbered or
  // removed in RULES.md leaves those links pointing at nothing, on every page
  // that cited it, with no other symptom.
  it('cites only rule numbers RULES.md declares', () => {
    const known = new Set(ruleNumbers())
    for (const e of ALL) {
      for (const n of e.rules) {
        expect(known.has(n), `${e.id} cites rule ${n}, which RULES.md does not declare`).toBe(true)
      }
    }
  })
})
