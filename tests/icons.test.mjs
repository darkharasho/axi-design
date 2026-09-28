import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, basename } from 'node:path'

// Rule 12 as a check rather than a promise. The grammar is narrow enough to
// parse with a tokenizer this small precisely because it forbids curves: the
// only commands that can legally appear are M, L, H, V, Z and their relative
// forms, so "parse the path" and "reject anything else" are the same pass.

const DIR = 'icons'
const LIVE_MIN = 1.5
const LIVE_MAX = 22.5

const iconFiles = () =>
  existsSync(DIR)
    ? readdirSync(DIR)
        .filter((f) => f.endsWith('.svg') && !f.startsWith('.'))
        .map((f) => ({ name: basename(f, '.svg'), source: readFileSync(resolve(DIR, f), 'utf8') }))
    : []

const paths = (source) => [...source.matchAll(/\sd="([^"]+)"/g)].map((m) => m[1])

// Every segment a path draws, as {from:[x,y], to:[x,y]}. Tracks the current
// point across relative commands and treats the extra coordinate pairs of an
// M as the implicit linetos the SVG spec says they are - both of which are
// how a parser silently stops checking most of a set.
function segments(d) {
  const chunks = d.match(/[A-Za-z][^A-Za-z]*/g) || []
  const out = []
  let cur = [0, 0]
  let start = [0, 0]
  for (const chunk of chunks) {
    const cmd = chunk[0]
    const nums = (chunk.slice(1).trim().match(/-?\d*\.?\d+/g) || []).map(Number)
    const rel = cmd === cmd.toLowerCase() && cmd !== 'Z'
    switch (cmd.toUpperCase()) {
      case 'M': {
        for (let i = 0; i < nums.length; i += 2) {
          const to = rel ? [cur[0] + nums[i], cur[1] + nums[i + 1]] : [nums[i], nums[i + 1]]
          if (i === 0) start = to
          else out.push({ from: cur, to })
          cur = to
        }
        break
      }
      case 'L': {
        for (let i = 0; i < nums.length; i += 2) {
          const to = rel ? [cur[0] + nums[i], cur[1] + nums[i + 1]] : [nums[i], nums[i + 1]]
          out.push({ from: cur, to })
          cur = to
        }
        break
      }
      case 'H': {
        for (const n of nums) {
          const to = [rel ? cur[0] + n : n, cur[1]]
          out.push({ from: cur, to })
          cur = to
        }
        break
      }
      case 'V': {
        for (const n of nums) {
          const to = [cur[0], rel ? cur[1] + n : n]
          out.push({ from: cur, to })
          cur = to
        }
        break
      }
      case 'Z': {
        out.push({ from: cur, to: start })
        cur = start
        break
      }
      default:
        throw new Error(`illegal path command "${cmd}"`)
    }
  }
  return out
}

const onGrid = (n) => Number.isInteger(Math.round(n * 2 * 1e6) / 1e6)
const oddHalf = (n) => Math.abs(n % 1) === 0.5

describe('the icon set', () => {
  it('has at least one icon', () => {
    expect(iconFiles().length).toBeGreaterThan(0)
  })

  for (const { name, source } of iconFiles()) {
    describe(name, () => {
      it('declares the canvas, the ink and the weight', () => {
        expect(source).toContain('viewBox="0 0 24 24"')
        expect(source).toContain('stroke="currentColor"')
        expect(source).toContain('stroke-width="3"')
        expect(source).toContain('stroke-linejoin="miter"')
        expect(source).toContain('fill="none"')
        expect(source).not.toContain('stroke-linecap')
      })

      it('uses no curve command', () => {
        for (const d of paths(source)) expect(d).not.toMatch(/[ACSQTacsqt]/)
      })

      it('has no rounded corner', () => {
        expect(source).not.toMatch(/\srx="/)
        expect(source).not.toMatch(/\sry="/)
      })

      it('carries no colour literal', () => {
        expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
        expect(source).not.toMatch(/\b(rgba?|hsla?|oklch|oklab|color-mix)\s*\(/)
      })

      it('draws every segment at 0, 45 or 90 degrees', () => {
        for (const d of paths(source)) {
          for (const { from, to } of segments(d)) {
            const dx = Math.abs(to[0] - from[0])
            const dy = Math.abs(to[1] - from[1])
            const legal = dx === 0 || dy === 0 || Math.abs(dx - dy) < 1e-6
            expect(legal, `${name}: ${from} -> ${to} is neither axis-aligned nor 45deg`).toBe(true)
          }
        }
      })

      it('keeps every coordinate on the 0.5 grid, inside the live area', () => {
        for (const d of paths(source)) {
          for (const { to } of segments(d)) {
            for (const n of to) {
              expect(onGrid(n), `${name}: ${n} is off the 0.5 grid`).toBe(true)
              expect(n).toBeGreaterThanOrEqual(LIVE_MIN)
              expect(n).toBeLessThanOrEqual(LIVE_MAX)
            }
          }
        }
      })

      // The pixel-alignment half of rule 12. Only axis-aligned strokes are
      // bound by it - a 45deg segment is antialiased at any offset - and the
      // centre axis at 12 is the one stated exemption.
      it('puts every axis-aligned stroke on a permitted centerline', () => {
        for (const d of paths(source)) {
          for (const { from, to } of segments(d)) {
            const vertical = from[0] === to[0] && from[1] !== to[1]
            const horizontal = from[1] === to[1] && from[0] !== to[0]
            if (!vertical && !horizontal) continue
            const c = vertical ? from[0] : from[1]
            expect(oddHalf(c) || c === 12, `${name}: axis-aligned stroke at ${c}`).toBe(true)
          }
        }
      })
    })
  }
})

// The parser is load-bearing: if it quietly mis-reads a form, every check
// above passes vacuously on the paths that use it. These pin the two forms
// that break a naive implementation.
describe('the path parser', () => {
  it('tracks the current point across relative commands', () => {
    expect(segments('M3.5 6.5 h17')).toEqual([{ from: [3.5, 6.5], to: [20.5, 6.5] }])
    expect(segments('M4.5 2.5 v3 l3 3')).toEqual([
      { from: [4.5, 2.5], to: [4.5, 5.5] },
      { from: [4.5, 5.5], to: [7.5, 8.5] },
    ])
  })

  it('reads the extra pairs of an M as implicit linetos', () => {
    expect(segments('M2.5 2.5 8.5 8.5')).toEqual([{ from: [2.5, 2.5], to: [8.5, 8.5] }])
  })

  it('closes a subpath back to its start, not to the origin', () => {
    const segs = segments('M3.5 3.5 H20.5 V20.5 Z')
    expect(segs.at(-1)).toEqual({ from: [20.5, 20.5], to: [3.5, 3.5] })
  })

  it('rejects a curve command outright', () => {
    expect(() => segments('M3 3 C 4 4 5 5 6 6')).toThrow(/illegal path command/)
  })
})
