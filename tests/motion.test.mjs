import { describe, it, expect } from 'vitest'
import { sources } from '../docs/manifest/introspect.mjs'

// Rule 11: an indicator of work may animate only transform and opacity,
// because those are the two the compositor runs off the main thread. A
// keyframe that moves `width` or `left` freezes with the work it reports on,
// and a frozen spinner tells the reader the app crashed at the moment it was
// working hardest.
const COMPOSITED = new Set(['transform', 'opacity'])

// Captures the body between a @keyframes block's outer braces by allowing
// any number of non-nested `{ ... }` frame rules (`from`, `to`, `0%`, …)
// followed by the keyframes block's own closing brace. Keyframe blocks never
// nest deeper than that one level, so this is exact rather than heuristic.
export function illegalKeyframeProps(css) {
  const bad = new Set()
  for (const block of css.matchAll(/@keyframes\s+[\w-]+\s*\{((?:[^{}]*\{[^{}]*\})*[^{}]*)\}/g)) {
    for (const decl of block[1].matchAll(/([a-z-]+)\s*:/g)) {
      if (!COMPOSITED.has(decl[1])) bad.add(decl[1])
    }
  }
  return [...bad].sort()
}

describe('rule 11 - an indicator of work animates a composited property', () => {
  it('lets transform and opacity through', () => {
    expect(illegalKeyframeProps(
      '@keyframes a { from { transform: rotate(0); opacity: 0; } to { transform: rotate(1turn); opacity: 1; } }',
    )).toEqual([])
  })

  it('catches width, left and background-color', () => {
    expect(illegalKeyframeProps(
      '@keyframes a { from { width: 0; left: 0; } to { width: 100%; background-color: red; } }',
    )).toEqual(['background-color', 'left', 'width'])
  })

  it('holds for every keyframe block in src/', () => {
    expect(illegalKeyframeProps(sources())).toEqual([])
  })
})
