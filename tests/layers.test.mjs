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
