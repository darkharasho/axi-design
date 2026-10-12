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

describe('the skeleton', () => {
  // The rule block for one selector, from its opening brace to its close.
  const block = (sel) => {
    const start = css.indexOf(`${sel} {`)
    expect(start, `${sel} is not defined`).toBeGreaterThan(-1)
    return css.slice(start, css.indexOf('}', start) + 1)
  }

  it('takes its height from the font of the element it sits in', () => {
    expect(block('.axi-skeleton')).toMatch(/height:\s*\.62em/)
    expect(block('.axi-skeleton')).toMatch(/width:\s*var\(--axi-skeleton-w,\s*100%\)/)
    expect(block('.axi-skeleton--figure')).toMatch(/height:\s*\.78em/)
  })

  it('fills with a neutral, never a saturated ink', () => {
    expect(block('.axi-skeleton')).toMatch(/color-mix\(in srgb,\s*var\(--axi-text\)/)
  })

  // Rule 1 has no exception for a soft transition, so the sweep is a flat
  // band travelling by transform - the indeterminate meter's shape.
  it('sweeps a flat band, not a gradient', () => {
    const after = block('.axi-skeleton::after')
    expect(after).not.toMatch(/gradient\(/)
    expect(after).toMatch(/animation:\s*axi-skeleton-sweep/)
    const frames = css.slice(css.indexOf('@keyframes axi-skeleton-sweep'))
    expect(frames.slice(0, frames.indexOf('}'))).toMatch(/transform:/)
  })

  it('draws no sweep under reduced motion', () => {
    const media = css.slice(css.lastIndexOf('@media (prefers-reduced-motion: reduce)'))
    expect(media).toMatch(/\.axi-skeleton::after\s*\{\s*display:\s*none;/)
  })
})
