import { describe, it, expect } from 'vitest'
import { entries, LAYERS, RESERVED_IDS } from '../docs/manifest/index.mjs'
import { definedClasses, ruleNumbers, fallbackKnobs } from '../docs/manifest/introspect.mjs'
import { KNOBS, knobsFor } from '../docs/manifest/knobs.mjs'
import { buildKnobTable } from '../scripts/build.mjs'
import { readFileSync } from 'node:fs'

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

// The forcing function. An undocumented component fails the build, which is
// how a component added in round two cannot land without its page. There is
// deliberately no exclusion list: a class that genuinely belongs to no visual
// family gets a real entry under the `utilities` layer. An exclusion list is
// precisely the escape hatch the rest of this repo's tests are written to
// avoid, because it turns "undocumented" into a one-line, unreviewed opt-out.
describe('coverage', () => {
  it('documents every class src/ defines', () => {
    const claimed = new Set(ALL.flatMap((e) => e.classes))
    const undocumented = definedClasses().filter((cls) => !claimed.has(cls))
    expect(undocumented, `undocumented: ${undocumented.join(' ')}`).toEqual([])
  })
})

describe('knobs', () => {
  it('documents every custom property src/ reads with a fallback', () => {
    const named = new Set(KNOBS.map((k) => k.name))
    const undocumented = fallbackKnobs().filter((n) => !named.has(n))
    expect(undocumented, `undocumented knobs: ${undocumented.join(' ')}`).toEqual([])
  })

  it('documents no knob src/ never reads', () => {
    const read = new Set(fallbackKnobs())
    const phantom = KNOBS.map((k) => k.name).filter((n) => !read.has(n))
    expect(phantom, `documented but never read: ${phantom.join(' ')}`).toEqual([])
  })

  it('gives every knob a description, a fallback and an example', () => {
    for (const k of KNOBS) {
      expect(k.sets.length).toBeGreaterThan(0)
      expect(k.fallback.length).toBeGreaterThan(0)
      expect(k.example).toContain(k.name)
    }
  })

  it('only lets an entry cite a knob that exists', () => {
    const named = new Set(KNOBS.map((k) => k.name))
    for (const e of ALL) {
      for (const n of e.knobs) expect(named.has(n), `${e.id} cites unknown knob ${n}`).toBe(true)
    }
  })

  it('returns the requested subset in canonical order', () => {
    const picked = knobsFor([KNOBS[2].name, KNOBS[0].name])
    expect(picked.map((k) => k.name)).toEqual([KNOBS[0].name, KNOBS[2].name])
  })
})

// The README table was hand-maintained and could drift from src/ with no
// symptom. It is generated now, and this is what makes "generated" true.
describe('README knob table', () => {
  it('matches the table generated from knobs.mjs', () => {
    const readme = readFileSync('README.md', 'utf8')
    const section = readme.match(/<!-- axi:knobs -->\n([\s\S]*?)\n<!-- \/axi:knobs -->/)
    expect(section, 'README is missing the axi:knobs markers').not.toBeNull()
    expect(section[1]).toBe(buildKnobTable())
  })
})

describe('the form layer', () => {
  const forms = readFileSync('src/forms.css', 'utf8')

  // Review Focus 3. appearance:none throws away the control the browser was
  // drawing, including its focus ring. base.css draws a page-wide
  // :focus-visible ring, so these inherit one - unless a rule here turns it
  // off, which is the single line that would make them unusable by keyboard.
  it('never turns the focus ring off', () => {
    expect(forms).not.toMatch(/outline:\s*(none|0)\b/)
  })

  // Review Focus 5. The mark sits on an accent fill, so it is drawn in the
  // ink meant for that - not in a text or surface token, which are for
  // things on the ground and would invert in light mode.
  it('draws the check mark in the accent ink', () => {
    const mark = forms.slice(forms.indexOf('.axi-check::after'))
    expect(mark).toMatch(/var\(--axi-accent-ink\)/)
  })

  it('shares one size and one fill knob between checkbox and radio', () => {
    expect(forms).toMatch(/--axi-check-size/)
    expect(forms).toMatch(/--axi-check-fill/)
    expect(forms).not.toMatch(/--axi-radio-(size|fill)/)
  })
})

describe('the toast region', () => {
  const shells = readFileSync('src/shells.css', 'utf8')
  const region = shells.slice(shells.indexOf('.axi-toasts {'), shells.indexOf('.axi-toast {'))

  // Review Focus 4. The region is fixed and full-height, so an empty one
  // would sit invisibly over the page and eat every click aimed at what is
  // underneath it. The region is a layout box, not a surface.
  it('lets clicks through when it is empty', () => {
    expect(region).toMatch(/pointer-events:\s*none/)
  })

  it('takes clicks on the toasts themselves', () => {
    const toast = shells.slice(shells.indexOf('.axi-toast {'))
    expect(toast).toMatch(/pointer-events:\s*auto/)
  })
})
