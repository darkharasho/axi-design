import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sources } from '../docs/manifest/introspect.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// The documented stack, read out of the table in RULES.md. A row is
// `| <name> | <n> | <what sits here> |`; the modal row says "top layer"
// rather than a number, because the browser puts a showModal()-ed dialog
// above every z-index there is, and writing a number there would be a lie.
export function documentedLayers(md = readFileSync(resolve(ROOT, 'docs/RULES.md'), 'utf8')) {
  const table = md.split('### Layer stack')[1] ?? ''
  return new Set([...table.matchAll(/^\|[^|]+\|\s*(\d+)\s*\|/gm)].map((m) => Number(m[1])))
}

// Every z-index a component actually declares. Negative values are excluded
// deliberately: .axi-sigil's `z-index: -1` sits inside its own `isolation`
// context and is a detail of one component's internals, not a page layer.
// Comments are stripped first, the same way definedClasses strips them in
// introspect.mjs — otherwise a line of prose describing a layer (e.g. "Above
// .axi-mast's z-index: 40") is indistinguishable from a real declaration.
export function declaredLayers(css = sources()) {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '')
  return new Set([...stripped.matchAll(/z-index:\s*(\d+)/g)].map((m) => Number(m[1])))
}

describe('the layer stack', () => {
  it('documents every z-index src/ declares', () => {
    const documented = documentedLayers()
    const undocumented = [...declaredLayers()].filter((z) => !documented.has(z))
    expect(undocumented).toEqual([])
  })

  it('declares no layer the stack does not name', () => {
    expect([...documentedLayers()].filter((z) => !declaredLayers().has(z))).toEqual([])
  })

  // Both polarities: the parser must actually find numbers, or the gate
  // above passes by finding nothing on either side.
  it('reads a number out of a table row', () => {
    const md = '### Layer stack\n\n| Layer | z-index | What |\n|---|---|---|\n| Scrim | 50 | .axi-scrim |\n'
    expect(documentedLayers(md)).toEqual(new Set([50]))
  })

  it('ignores a negative z-index', () => {
    expect(declaredLayers('.a { z-index: -1; }')).toEqual(new Set())
  })

  it('strips comments before scanning for z-index', () => {
    expect(declaredLayers('/* see z-index: 999 */ .a { z-index: 40; }')).toEqual(new Set([40]))
  })
})

// A placement modifier has to cancel BOTH halves of the base class's
// placement, or it leaves a claim the element cannot honour. .axi-tooltip
// declares `position: fixed` and `z-index: 70`; .axi-tooltip--flow says the
// box is laid out by whoever owns its wrapper, so a `z-index` left behind
// would assert layer 70 on a static box - inert, and a lie to the next
// reader. This is a rule about the pair, not about either value.
describe('a placement modifier cancels the placement it modifies', () => {
  const body = (css, selector) =>
    css.replace(/\/\*[\s\S]*?\*\//g, '').match(
      new RegExp(`(^|[},])\\s*${selector.replace(/[.\-]/g, '\\$&')}\\s*\\{([^}]*)\\}`, 'm'),
    )?.[2] ?? ''

  const PAIRS = [['.axi-tooltip', '.axi-tooltip--flow']]

  for (const [base, modifier] of PAIRS) {
    it(`${modifier} answers every placement property ${base} sets`, () => {
      const css = sources()
      const set = (sel) =>
        new Set([...body(css, sel).matchAll(/(^|[\s;])(position|z-index)\s*:/g)].map((m) => m[2]))
      const baseProps = set(base)
      expect(baseProps.size).toBeGreaterThan(1)
      expect([...baseProps].filter((p) => !set(modifier).has(p))).toEqual([])
    })
  }

  // Both polarities: a modifier answering only half must fail.
  it('fails a modifier that leaves a layer behind', () => {
    const css = '.x { position: fixed; z-index: 70; } .x--flow { position: static; }'
    const props = (sel) =>
      new Set([...body(css, sel).matchAll(/(^|[\s;])(position|z-index)\s*:/g)].map((m) => m[2]))
    expect([...props('.x')].filter((p) => !props('.x--flow').has(p))).toEqual(['z-index'])
  })
})

// A scrim's rung is not a property of the scrim, it is "directly below the
// thing I dismiss". This is the guard for that, and it is load-bearing rather
// than tidy: reading the scrim's 50 as its own number is what made a sheet
// impossible to scrim. Both elements are `position: fixed` in one stacking
// context, so a scrim ABOVE its subject covers it completely - measured with
// document.elementFromPoint at the centre of an open sheet, the element
// returned was the scrim, so every click landed on the dismiss handler and the
// surface opened dead.
//
// Two things are asserted per pair, and the second is the one that bites. The
// scrim must be below its subject, AND nothing else may sit between them: a
// layer added in the gap would sink behind the scrim it has no relationship
// with, which is the same defect one rung over.
describe('a scrim sits directly below the surface it dismisses', () => {
  const layerOf = (css, selector) => {
    const body = css.replace(/\/\*[\s\S]*?\*\//g, '').match(
      new RegExp(`(^|[},])\\s*${selector.replace(/[.\-]/g, '\\$&')}\\s*\\{([^}]*)\\}`, 'm'),
    )?.[2] ?? ''
    const m = body.match(/z-index:\s*(\d+)/)
    return m ? Number(m[1]) : undefined
  }

  // [the scrim, the surface it dismisses]
  const PAIRS = [
    ['.axi-scrim', '.axi-drawer'],
    ['.axi-scrim--sheet', '.axi-sheet'],
  ]

  for (const [scrim, subject] of PAIRS) {
    it(`${scrim} is below ${subject} with nothing between them`, () => {
      const css = sources()
      const s = layerOf(css, scrim)
      const t = layerOf(css, subject)
      expect(s, `${scrim} declares no z-index`).toBeTypeOf('number')
      expect(t, `${subject} declares no z-index`).toBeTypeOf('number')
      expect(s, `${scrim} at ${s} is not below ${subject} at ${t}, so it covers it and swallows every click`).toBeLessThan(t)
      const between = [...declaredLayers()].filter((z) => z > s && z < t)
      expect(between, `${between.join(', ')} sits between ${scrim} and ${subject}, so it would sink behind a scrim it has nothing to do with`).toEqual([])
    })
  }

  // Both polarities: the arithmetic must actually reject the defect it names.
  it('fails a scrim declared above its subject', () => {
    const css = '.s { position: fixed; z-index: 50; } .t { position: fixed; z-index: 45; }'
    const z = (sel) => Number(css.match(new RegExp(`\\${sel}\\s*\\{([^}]*)\\}`))[1].match(/z-index:\s*(\d+)/)[1])
    expect(z('.s') < z('.t')).toBe(false)
  })
})
