import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { buildCss, ORDER } from '../scripts/build.mjs'

// dist/axi.css is committed, because the release workflow publishes that exact
// file and consumers link it by URL. A committed artifact can go stale the
// moment someone edits a source and forgets to rebuild - and because nothing
// imports dist/, nothing else would ever notice. This test is the only thing
// standing between a source edit and a release that silently ships the old CSS.
describe('dist/axi.css', () => {
  it('matches the concatenation of its sources', () => {
    const built = buildCss()
    const committed = readFileSync(resolve('dist/axi.css'), 'utf8')
    expect(committed).toBe(built)
  })

  it('concatenates sources in the declared order', () => {
    const built = buildCss()
    const positions = ORDER.map((name) => built.indexOf(`/* --- ${name} --- */`))
    expect(positions.every((p) => p !== -1)).toBe(true)
    expect([...positions]).toEqual([...positions].sort((a, b) => a - b))
  })
})
