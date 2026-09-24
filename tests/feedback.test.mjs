import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const css = readFileSync(resolve(ROOT, "src/feedback.css"), "utf8")

describe('the busy meter under reduced motion', () => {
  // Review Focus 1. base.css forces `animation-duration: .01ms` and
  // `animation-iteration-count: 1` under prefers-reduced-motion, but never
  // touches `animation-fill-mode`. The `animation` shorthand in this file
  // resets fill-mode to `none`, so once the .01ms run finishes the fill
  // reverts to its specified style - `transform: none` and `width: 25%` -
  // rather than holding wherever the keyframe run left it. That reverted
  // quarter-width bar is already correct to show at rest; this rule states
  // `transform: none` explicitly rather than relying on the revert alone.
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
