import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const css = readFileSync(resolve(ROOT, "src/feedback.css"), "utf8")

describe('the busy meter under reduced motion', () => {
  // Review Focus 1. base.css forces `animation-duration: .01ms` and
  // `animation-iteration-count: 1` under prefers-reduced-motion, which parks
  // an animation at its END state. The busy meter's end state is the fill
  // translated clean off the track - so a reader who turns motion off would
  // be shown a progress bar that displays nothing at all.
  it('parks the fill somewhere visible', () => {
    const block = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'))
    expect(block).toMatch(/\.axi-meter--busy/)
    expect(block).toMatch(/transform:\s*none/)
  })

  it('never animates width', () => {
    const frames = css.slice(css.indexOf('@keyframes axi-meter-busy'))
    expect(frames.slice(0, frames.indexOf('}\n}'))).not.toMatch(/width:/)
  })
})
