import { describe, it, expect } from 'vitest'
import { entries, LAYERS, RESERVED_IDS } from '../docs/manifest/index.mjs'
import { definedClasses, ruleNumbers, fallbackKnobs } from '../docs/manifest/introspect.mjs'
import { KNOBS, knobsFor } from '../docs/manifest/knobs.mjs'
import { buildKnobTable } from '../scripts/build.mjs'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

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

  // Almost every entry is a set of classes, but the language also contains one
  // thing a consumer spells without adding a class: the dead state, which
  // arrives from `disabled` and `aria-disabled` alone. Such an entry names its
  // spellings in `selectors` instead, and the requirement stays the same - an
  // entry must tell the reader something to write.
  it('lists at least one spelling and one example', () => {
    for (const e of ALL) {
      expect(e.classes.length + (e.selectors ?? []).length, `${e.id} names nothing to write`).toBeGreaterThan(0)
      expect(e.examples.length).toBeGreaterThan(0)
    }
  })

  it('never uses selectors as a way around documenting a class', () => {
    for (const e of ALL) {
      for (const sel of e.selectors ?? []) {
        expect(sel, `${e.id} lists a class as a selector`).not.toMatch(/^\./)
      }
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

  // Review Focus 4. The region sets no width or height of its own, so an
  // empty one is zero-area; pointer-events: none exists because the flex
  // gaps between stacked toasts would otherwise eat clicks aimed at the
  // corner beneath them. The region is a layout box, not a surface.
  it('lets clicks through when it is empty', () => {
    expect(region).toMatch(/pointer-events:\s*none/)
  })

  it('takes clicks on the toasts themselves', () => {
    const toast = shells.slice(shells.indexOf('.axi-toast {'))
    expect(toast).toMatch(/pointer-events:\s*auto/)
  })
})

describe('aliases', () => {
  it('never shadows a real entry id', () => {
    const ids = new Set(entries().map((e) => e.id))
    const shadowing = entries().flatMap((e) => (e.aliases ?? []).filter((a) => ids.has(a)))
    expect(shadowing).toEqual([])
  })

  it('uses only lower-case single words', () => {
    const bad = entries().flatMap((e) => (e.aliases ?? []).filter((a) => !/^[a-z]+$/.test(a)))
    expect(bad).toEqual([])
  })
})

// Rule 12 is the icon set's whole justification, and every icon entry cites
// it. A renumbering or a reword that dropped it would leave those citations
// deep-linking to a #rule-12 anchor that no longer exists.
describe('rule 12', () => {
  const md = () => readFileSync(resolve('docs/RULES.md'), 'utf8')

  it('is present in RULES.md and names the icon contract', () => {
    const md = readFileSync(resolve('docs/RULES.md'), 'utf8')
    const titles = new Map([...md.matchAll(/^## (\d+)\. (.+)$/gm)].map((m) => [Number(m[1]), m[2]]))
    expect(titles.get(12)).toMatch(/icon/i)
  })

  it('states the weight, the angles and the curve prohibition', () => {
    const md = readFileSync(resolve('docs/RULES.md'), 'utf8')
    const body = md.split(/^## 12\. /m)[1].split(/^## /m)[0]
    expect(body).toContain('--axi-border-control')
    expect(body).toContain('45')
    expect(body).toMatch(/no curve|curves/i)
  })

  // The enforcement paragraph is a claim about another file, and a claim like
  // that rots silently. It used to say the check catches "a stroke width that
  // is not 3" when stroke-width was only scanned file-wide; it now describes
  // the allowlist that actually runs.
  it('describes the check as an allowlist, which is what it is', () => {
    const body = md().split(/^## 12\. /m)[1].split(/^## /m)[0]
    const enforced = body.split('**What is mechanically enforced.**')[1]
    expect(enforced).toBeDefined()
    expect(enforced).toMatch(/allow-?list/i)
    expect(enforced).toMatch(/<path>/)
  })
})

// The reason the set exists. A Unicode symbol in an example is a glyph drawn
// by whatever font the OS hands Chromium - the one part of this language its
// own rules never reached. The range below is the symbol/dingbat/arrow
// blocks, not punctuation: an ellipsis, an em dash and a non-breaking space
// are typography and stay.
describe('the examples draw their own glyphs', () => {
  const SYMBOL = /[\u2190-\u21FF\u2300-\u23FF\u25A0-\u27BF\u2B00-\u2BFF]/
  // Numeric entities are decoded first rather than pattern-matched, so the test
  // judges the glyph that renders and not the spelling. `&#8230;` is an ellipsis
  // and stays; `&#8981;` is the magnifier this set exists to replace, and the
  // two are three digits apart.
  const borrowed = (html) => SYMBOL.test(html.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))))

  for (const e of entries()) {
    for (const [i, ex] of (e.examples ?? []).entries()) {
      it(`${e.id} example ${i} uses no borrowed symbol glyph`, () => {
        expect(borrowed(ex.html)).toBe(false)
      })
    }
  }
})
