import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, basename } from 'node:path'
import { ICON_ENTRIES } from '../docs/manifest/icons.mjs'

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

// Both quote styles. A checker that reads only d="..." is blind to d='...',
// and the difference is one character in a file nobody re-reads.
const paths = (source) => [...source.matchAll(/\sd=(?:"([^"]*)"|'([^']*)')/g)].map((m) => m[1] ?? m[2])

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

// An allowlist, not a blocklist. Rule 12 is a short list of what a drawing may
// contain, and the failure this guards against is an element or an attribute
// nobody thought to forbid - a <circle>, a transform, a per-element stroke.
// Listing what is permitted makes the unthought-of case a rejection by
// default, which is the only way a checker stays honest as the set grows.
const ALLOWED_ATTRS = {
  svg: {
    xmlns: ['http://www.w3.org/2000/svg'],
    viewBox: ['0 0 24 24'],
    fill: ['none'],
    stroke: ['currentColor'],
    'stroke-width': ['3'],
    'stroke-linejoin': ['miter'],
  },
  // A solid mark is the one shape that may be filled, and it carries no stroke
  // of its own - the spec's single exception to "outlined, never filled".
  path: { d: null, fill: ['none', 'currentColor'], stroke: ['none'] },
}

const REQUIRED_ROOT = Object.keys(ALLOWED_ATTRS.svg)

const TAG = /<([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[a-zA-Z-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*\/?>/g
const ATTR = /([a-zA-Z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g

// Every way a drawing can break rule 12, as a list of strings. Empty means
// legal. Returned rather than asserted so the same function can be pointed at
// a hostile fixture, which is how this checker is itself tested.
function checkIcon(name, source) {
  const bad = []
  const tags = [...source.matchAll(TAG)]
  const roots = tags.filter((t) => t[1] === 'svg')

  if (roots.length !== 1) bad.push(`${name}: expected exactly one <svg>, found ${roots.length}`)
  for (const [, tag] of tags.map((t) => [t, t[1]])) {
    if (!(tag in ALLOWED_ATTRS)) bad.push(`${name}: <${tag}> is not a permitted element`)
  }

  for (const t of tags) {
    const tag = t[1]
    const allowed = ALLOWED_ATTRS[tag]
    if (!allowed) continue
    const attrs = new Map([...t[2].matchAll(ATTR)].map((a) => [a[1], a[2] ?? a[3]]))
    for (const [key, value] of attrs) {
      if (!(key in allowed)) {
        bad.push(`${name}: <${tag} ${key}=...> is not a permitted attribute`)
        continue
      }
      const values = allowed[key]
      if (values && !values.includes(value)) {
        bad.push(`${name}: <${tag} ${key}="${value}"> is not a permitted value`)
      }
    }
    if (tag === 'svg') {
      for (const key of REQUIRED_ROOT) {
        if (!attrs.has(key)) bad.push(`${name}: the root <svg> does not declare ${key}`)
      }
    }
    if (tag === 'path' && !attrs.has('d')) bad.push(`${name}: a <path> with no d`)
  }

  const ds = paths(source)
  // A file with no drawing in it passes every check there is by having nothing
  // to check - the one shape of vacuous pass an allowlist cannot catch.
  if (ds.length === 0) bad.push(`${name}: contains no <path>`)

  for (const d of ds) {
    if (/[ACSQTacsqt]/.test(d)) {
      bad.push(`${name}: "${d}" uses a curve command`)
      continue
    }
    let segs
    try {
      segs = segments(d)
    } catch (e) {
      bad.push(`${name}: ${e.message}`)
      continue
    }
    for (const { from, to } of segs) {
      const dx = Math.abs(to[0] - from[0])
      const dy = Math.abs(to[1] - from[1])
      if (!(dx === 0 || dy === 0 || Math.abs(dx - dy) < 1e-6)) {
        bad.push(`${name}: ${from} -> ${to} is neither axis-aligned nor 45deg`)
      }
      // `from` as well as `to`: a subpath's moveto point is a coordinate that
      // may never appear as any segment's endpoint, and every subpath has one.
      for (const point of [from, to]) {
        for (const n of point) {
          if (!onGrid(n)) bad.push(`${name}: ${n} is off the 0.5 grid`)
          if (n < LIVE_MIN || n > LIVE_MAX) bad.push(`${name}: ${n} is outside the live area`)
        }
      }
      const vertical = from[0] === to[0] && from[1] !== to[1]
      const horizontal = from[1] === to[1] && from[0] !== to[0]
      if (vertical || horizontal) {
        const c = vertical ? from[0] : from[1]
        if (!(oddHalf(c) || c === 12)) bad.push(`${name}: axis-aligned stroke at ${c}`)
      }
    }
  }
  return [...new Set(bad)]
}

describe('the icon set', () => {
  it('has at least one icon', () => {
    expect(iconFiles().length).toBeGreaterThan(0)
  })

  for (const { name, source } of iconFiles()) {
    it(`${name} obeys rule 12`, () => {
      expect(checkIcon(name, source)).toEqual([])
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

// The commonest placement in the whole set is an icon beside text inside a
// button - which is a flex container. `width: 1.25em` alone loses to
// flex-shrink there, and the glyph arrives squashed into an ellipse-shaped
// nothing. These two declarations are the ones that keep that from happening.
describe('.axi-icon', () => {
  const css = readFileSync(resolve('src/primitives.css'), 'utf8')
  const rule = css.split('.axi-icon {')[1]?.split('}')[0] ?? ''

  it('exists', () => {
    expect(css).toContain('.axi-icon {')
  })

  it('sizes itself from a knob with a fallback', () => {
    expect(rule).toMatch(/var\(--axi-icon-size,\s*1\.25em\)/)
  })

  it('refuses to be squashed by a flex parent', () => {
    expect(rule).toContain('flex: none')
  })

  it('sits on the text baseline', () => {
    expect(rule).toMatch(/vertical-align/)
  })

  it('sets no colour, stroke or fill of its own', () => {
    expect(rule).not.toMatch(/(^|\s)color:/)
    expect(rule).not.toMatch(/stroke/)
    expect(rule).not.toMatch(/fill/)
  })
})

// The drift check, in both directions. A set rots when a file exists that
// nothing lists, or an entry names a drawing nobody made - and both fail
// silently, which is why they are asserted rather than trusted.
describe('the icon manifest', () => {
  const drawn = iconFiles().map((i) => i.name).sort()

  it('describes exactly the drawings on disk', () => {
    expect(ICON_ENTRIES.map((e) => e.name).sort()).toEqual(drawn)
  })

  // The /icons grid renders in manifest order, not sorted - so a row dropped
  // in the wrong place is a glyph filed between the wrong two names on the
  // page, with every other check still green.
  it('is in alphabetical order', () => {
    const names = ICON_ENTRIES.map((e) => e.name)
    expect(names).toEqual([...names].sort())
  })

  it('gives every icon at least one category and one keyword', () => {
    for (const e of ICON_ENTRIES) {
      expect(e.categories.length, `${e.name} has no category`).toBeGreaterThan(0)
      expect(e.keywords.length, `${e.name} has no keyword`).toBeGreaterThan(0)
    }
  })

  it('never lets an alias collide with a real icon name', () => {
    const names = new Set(ICON_ENTRIES.map((e) => e.name))
    for (const e of ICON_ENTRIES) {
      for (const alias of e.aliases) {
        expect(names.has(alias), `${e.name} aliases the real icon "${alias}"`).toBe(false)
      }
    }
  })

  // `lucide` is a promise that `<use href="#axi-<name>">` draws something.
  // Every way that promise can be broken is silent: a name that matches no
  // drawing renders an empty box, and a name that collides with a real icon
  // or with another entry's claim produces a duplicate id, where the first
  // symbol wins and the second is unreachable with no error anywhere.
  it('points every lucide name at a drawing that exists', () => {
    const names = new Set(ICON_ENTRIES.map((e) => e.name))
    for (const e of ICON_ENTRIES) {
      for (const l of e.lucide ?? []) {
        expect(names.has(l), `${e.name} claims the lucide name "${l}", which is a real icon`).toBe(false)
      }
    }
  })

  it('never lets two entries claim the same lucide name', () => {
    const seen = new Map()
    for (const e of ICON_ENTRIES) {
      for (const l of e.lucide ?? []) {
        expect(seen.has(l), `${l} is claimed by both ${seen.get(l)} and ${e.name}`).toBe(false)
        seen.set(l, e.name)
      }
    }
  })

  it('keeps lucide names out of the search-word field', () => {
    for (const e of ICON_ENTRIES) {
      for (const l of e.lucide ?? []) {
        expect(e.aliases, `${e.name} lists "${l}" as both a lucide name and a search word`).not.toContain(l)
      }
    }
  })

  // Two drawings one character apart. The gear and the sliders are different
  // answers to "settings", and a shared keyword makes a picker offer both -
  // at which point the name stops being the thing that tells them apart.
  it('keeps the gear and the sliders apart', () => {
    const find = (n) => ICON_ENTRIES.find((e) => e.name === n)
    const gear = find('settings')
    const sliders = find('settings-2')
    const shared = [...gear.aliases, ...gear.keywords].filter((w) =>
      [...sliders.aliases, ...sliders.keywords].includes(w),
    )
    expect(shared, `settings and settings-2 share ${shared.join(', ')}`).toEqual([])
  })

  it('gives triangle-alert to circle-alert', () => {
    const entry = ICON_ENTRIES.find((e) => e.name === 'circle-alert')
    expect(entry.lucide).toContain('triangle-alert')
  })
})

// The checker's own adversaries. Every drawing in the set is trusted because
// this file rejects what rule 12 forbids - so the thing that most needs
// testing is not the icons but the rejection. Each fixture below is a drawing
// that must not be allowed to ship; a fixture that stops being rejected is the
// checker having quietly gone blind.
describe('the grammar checker rejects', () => {
  const ROOT = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="miter">'
  const icon = (...body) => `${ROOT}\n${body.map((b) => `  ${b}`).join('\n')}\n</svg>\n`
  const rejects = (label, source) =>
    it(label, () => expect(checkIcon('fixture', source)).not.toEqual([]))

  rejects('a circle', icon('<circle cx="12" cy="12" r="9.5"/>'))
  rejects('a rect', icon('<rect x="3.5" y="3.5" width="17" height="17"/>'))
  rejects('a polygon', icon('<polygon points="3.5,3.5 20.5,7.5 9.5,19.5"/>'))
  rejects('a curve hidden in single quotes', icon("<path d='M3.5 3.5 C 5 5 9 9 20.5 19.5'/>"))
  rejects('a per-element stroke width', icon('<path d="M3.5 3.5 L20.5 3.5" stroke-width="2"/>'))
  rejects('a per-element colour', icon('<path d="M3.5 3.5 L20.5 3.5" stroke="red"/>'))
  rejects('a named colour', icon('<path d="M3.5 3.5 L20.5 3.5" fill="rebeccapurple"/>'))
  rejects('a transform', icon('<path d="M3.5 3.5 L20.5 3.5" transform="rotate(45)"/>'))
  rejects('a rounded corner', icon('<path d="M3.5 3.5 L20.5 3.5" rx="2"/>'))
  rejects('a round cap', icon('<path d="M3.5 3.5 L20.5 3.5" stroke-linecap="round"/>'))
  rejects('an empty drawing', icon())
  // The moveto point is the one coordinate a checker that only walks segment
  // endpoints never looks at, and every subpath has one.
  rejects('a start point off the 0.5 grid', icon('<path d="M4.3 3.5 H20.5"/>'))
  rejects('a start point outside the live area', icon('<path d="M0.5 3.5 H20.5"/>'))
  rejects('a start point that puts a stroke off its centerline', icon('<path d="M4 3.5 V20.5"/>'))

  it('and accepts a legal drawing', () => {
    expect(checkIcon('fixture', icon('<path d="M3.5 3.5 L20.5 20.5"/>'))).toEqual([])
  })
})
