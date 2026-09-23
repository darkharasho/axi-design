import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { ORDER } from '../scripts/build.mjs'

const read = (name) => readFileSync(resolve('src', name), 'utf8')

// Strip comments before scanning. Comments routinely mention a hex value while
// explaining why it was chosen, and a naive scan would read that as a
// violation - a false failure that teaches people to stop writing the comments.
// Each comment is replaced by the newlines it spanned rather than by nothing,
// so every offender is still reported at its true file:line. (Collapsing a
// block comment to "" used to drift the reported line by however many lines
// the comment occupied - measured at 14 in shells.css.)
const stripComments = (css) =>
  css.replace(/\/\*[\s\S]*?\*\//g, (m) => '\n'.repeat((m.match(/\n/g) || []).length))

const TOKENS_FILE = 'tokens.css'
const COMPONENT_FILES = () => ORDER.filter((name) => name !== TOKENS_FILE)

// CSS is not line-oriented, so no check here may be either: `border:\n  7px
// solid ...` is the same declaration as its one-line form and must be judged
// identically. Split the comment-stripped stylesheet on the only three
// characters that end a declaration or a selector - `;`, `{`, `}` - and carry
// each chunk's true starting line along with it.
//
// Note this produces one chunk per SELECTOR too (the text up to its `{`), not
// just one per property:value pair. That is deliberate: the colour and
// weight checks below only act on chunks whose text starts with a
// colour/weight-carrying property name, so a selector chunk (which never
// does) is inert rather than something that has to be filtered out here.
const declarations = (css) => {
  const clean = stripComments(css)
  const out = []
  let start = 0
  let line = 1
  for (let i = 0; i <= clean.length; i++) {
    const ch = clean[i]
    if (i === clean.length || ch === ';' || ch === '{' || ch === '}') {
      const raw = clean.slice(start, i)
      // Skip the leading whitespace so the reported line is the line the
      // declaration actually starts on, not the line the previous one ended.
      const lead = raw.match(/^\s*/)[0]
      const text = raw.slice(lead.length)
      if (text.trim()) {
        out.push({ text, line: line + (lead.match(/\n/g) || []).length })
      }
      start = i + 1
      line += (raw.match(/\n/g) || []).length
      continue
    }
  }
  return out
}

// A declaration's value: everything after the first colon. Only called on
// chunks a property-name check has already confirmed are a real declaration
// (see COLOUR_PROPERTY / WEIGHT_PROPERTY / FORM_TOKEN_DECLARATION below), so
// a selector's pseudo-class colon never reaches here.
const valueOf = (text) => {
  const i = text.indexOf(':')
  return i === -1 ? '' : text.slice(i + 1)
}

// A token reference counts as satisfied if EITHER:
//   - the token is declared (`--name:`) in ANY src/*.css file listed in ORDER, or
//   - that particular reference supplies a fallback (`var(--name, <something>)`).
// tokens.css is deliberately not the only place a declaration counts: later
// layers (menus, drawers, grids, ...) legitimately expose per-instance API
// knobs - e.g. --axi-pill-fill, --axi-grid-min - that a consumer sets inline
// via a style attribute rather than a theme-wide value in tokens.css. Do not
// "fix" this back to reading only tokens.css: that breaks every task that
// adds such a knob. A token with no fallback that is declared nowhere is
// still a failure - that is the typo this test exists to catch.
const declared = () => {
  const found = new Set()
  for (const name of ORDER) {
    for (const m of stripComments(read(name)).matchAll(/(--axi-[a-z0-9-]+)\s*:/g)) {
      found.add(m[1])
    }
  }
  return found
}

// Each match captures the token name plus whether that particular reference
// supplies a fallback (a comma right after the name inside the var() call).
const references = (css) =>
  [...stripComments(css).matchAll(/var\(\s*(--axi-[a-z0-9-]+)\s*(,)?/g)].map((m) => ({
    token: m[1],
    hasFallback: Boolean(m[2]),
  }))

// ---------------------------------------------------------------------------
// Rule 3, column 1 and 2: the form tokens are theme surface, defined once.
// ---------------------------------------------------------------------------

// Form tokens (`--axi-border-*`, `--axi-offset-*`) may be DEFINED only in
// tokens.css. A component file is free to REFERENCE one through var() - that
// is a value, not a declaration, and this regex only matches when the
// property itself (the text before the colon) is one of these custom
// properties. Left unchecked, a component could locally redeclare
// `--axi-border-panel` or `--axi-offset-panel` on itself: the border/offset
// checks below only read the var() name a declaration spells, never what
// that name is worth at the point of use, so a local redeclaration mints an
// arbitrary third form step (and a blur, via a redefined offset) while both
// checks stay green. Anchored at the start of the chunk, so
// `border: var(--axi-border-panel) ...` (a reference) never matches.
const FORM_TOKEN_DECLARATION = /^(--axi-(border|offset)-[a-z0-9-]+)\s*:/i

// ---------------------------------------------------------------------------
// Rule 3, column 1: only two border/outline weight steps, ever.
// ---------------------------------------------------------------------------

// Matches a border- or outline-WEIGHT property: the shorthand, `-width`, or
// any longhand/logical border side - but not `-radius`, `-color`, `-style`,
// `-collapse`, `-spacing`, or outline's own `-offset` (a position knob, not a
// weight). Case-insensitive, because CSS property names, units and keywords
// all are - `BORDER: 7PX` is exactly as much a violation as `border: 7px`.
const WEIGHT_PROPERTY =
  /^(border(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-width)?|outline(-width)?)\s*:/i

// Every length unit CSS has, not just px - `border-width: 0.5rem` is a third
// form step exactly as much as a literal `7px` is.
const WEIGHT_LENGTH = /\b\d+(\.\d+)?(px|rem|em|ex|ch|pt|pc|cm|mm|in|q|vh|vw|vmin|vmax)\b/i
// The three keyword weights are a literal border weight with no digits at
// all - `border: thick solid ...` is a third step the length regex alone
// would miss entirely.
const WEIGHT_KEYWORD = /\b(thin|medium|thick)\b/i

const isThirdFormStep = (text) => {
  if (!WEIGHT_PROPERTY.test(text)) return false
  const value = valueOf(text)
  return WEIGHT_LENGTH.test(value) || WEIGHT_KEYWORD.test(value)
}

// ---------------------------------------------------------------------------
// Rule 3, the corner: it comes from the scale or it does not exist.
// ---------------------------------------------------------------------------

// Every spelling of the property, including the two-axis longhands and the
// logical forms. `border-radius` itself, `border-top-left-radius`, and
// `border-start-end-radius` are all the same decision written three ways.
const RADIUS_PROPERTY =
  /^border(-(top|bottom)-(left|right)|-(start|end)-(start|end))?-radius\s*:/i

// Percentages count. `border-radius: 50%` is a circle, which is a corner
// decision made locally exactly as much as a literal `8px` is - and it is the
// spelling a contributor reaches for when px has been blocked.
const RADIUS_LENGTH =
  /\b\d+(\.\d+)?(px|rem|em|ex|ch|pt|pc|cm|mm|in|q|vh|vw|vmin|vmax|%)/i

// A bare unitless `0` is deliberately legal: it is not a value from the
// scale, it is the absence of a corner, and a component that means "never
// round this one, whatever the consumer sets" has no token to say it with.
const isLiteralRadius = (text) =>
  RADIUS_PROPERTY.test(text) && RADIUS_LENGTH.test(valueOf(text))

// ---------------------------------------------------------------------------
// Rule 3, column 2: every raised block is hard, never a blur.
// ---------------------------------------------------------------------------

// The offsets a component may draw a block at. The two resting steps are
// rule 3's table; the two -hover steps are rule 4's documented deepenings
// (panel 6 -> 10, control 3 -> 6), tokenised precisely so that they are an
// enumerated allowlist here rather than an escape hatch for any literal.
const OFFSETS = [
  'var(--axi-offset-panel)',
  'var(--axi-offset-control)',
  'var(--axi-offset-panel-hover)',
  'var(--axi-offset-control-hover)',
]

// box-shadow's hard-offset shape is enforced structurally (below). filter and
// text-shadow are the other two CSS properties that can draw the exact
// blurred look rule 3 forbids - `filter: drop-shadow(...)` is a direct
// substitute for a blurred box-shadow, and `text-shadow` is the same idea
// applied to glyphs. Nothing in this codebase legitimately reaches for
// either today, so both are forbidden outright rather than pattern-matched
// for a specific blur radius.
const BLUR_PROPERTY = /^text-shadow\s*:|^filter\s*:\s*[^;]*\bdrop-shadow\s*\(/i

// ---------------------------------------------------------------------------
// Rule "no colour literal outside tokens.css".
// ---------------------------------------------------------------------------

// The 148 CSS named colours, minus the two documented exemptions:
// `transparent` and `currentColor` are not themeable values, so tokenising
// them would add indirection without buying anything. `background: black`
// reads as harmless, which is exactly why it has to be caught here.
const NAMED_COLOURS = [
  'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige', 'bisque', 'black',
  'blanchedalmond', 'blue', 'blueviolet', 'brown', 'burlywood', 'cadetblue', 'chartreuse',
  'chocolate', 'coral', 'cornflowerblue', 'cornsilk', 'crimson', 'cyan', 'darkblue', 'darkcyan',
  'darkgoldenrod', 'darkgray', 'darkgreen', 'darkgrey', 'darkkhaki', 'darkmagenta',
  'darkolivegreen', 'darkorange', 'darkorchid', 'darkred', 'darksalmon', 'darkseagreen',
  'darkslateblue', 'darkslategray', 'darkslategrey', 'darkturquoise', 'darkviolet', 'deeppink',
  'deepskyblue', 'dimgray', 'dimgrey', 'dodgerblue', 'firebrick', 'floralwhite', 'forestgreen',
  'fuchsia', 'gainsboro', 'ghostwhite', 'gold', 'goldenrod', 'gray', 'green', 'greenyellow',
  'grey', 'honeydew', 'hotpink', 'indianred', 'indigo', 'ivory', 'khaki', 'lavender',
  'lavenderblush', 'lawngreen', 'lemonchiffon', 'lightblue', 'lightcoral', 'lightcyan',
  'lightgoldenrodyellow', 'lightgray', 'lightgreen', 'lightgrey', 'lightpink', 'lightsalmon',
  'lightseagreen', 'lightskyblue', 'lightslategray', 'lightslategrey', 'lightsteelblue',
  'lightyellow', 'lime', 'limegreen', 'linen', 'magenta', 'maroon', 'mediumaquamarine',
  'mediumblue', 'mediumorchid', 'mediumpurple', 'mediumseagreen', 'mediumslateblue',
  'mediumspringgreen', 'mediumturquoise', 'mediumvioletred', 'midnightblue', 'mintcream',
  'mistyrose', 'moccasin', 'navajowhite', 'navy', 'oldlace', 'olive', 'olivedrab', 'orange',
  'orangered', 'orchid', 'palegoldenrod', 'palegreen', 'paleturquoise', 'palevioletred',
  'papayawhip', 'peachpuff', 'peru', 'pink', 'plum', 'powderblue', 'purple', 'rebeccapurple',
  'red', 'rosybrown', 'royalblue', 'saddlebrown', 'salmon', 'sandybrown', 'seagreen', 'seashell',
  'sienna', 'silver', 'skyblue', 'slateblue', 'slategray', 'slategrey', 'snow', 'springgreen',
  'steelblue', 'tan', 'teal', 'thistle', 'tomato', 'turquoise', 'violet', 'wheat', 'white',
  'whitesmoke', 'yellow', 'yellowgreen',
]

const HEX = /#[0-9a-fA-F]{3,8}\b/
// Every colour function CSS has, not just the three from 1996. A 2026
// contributor reaches for oklch() or color-mix() before rgb(). `lab`/`lch`
// carry a word boundary so they do not also match inside `oklab`/`oklch`.
const COLOUR_FUNCTION = /\b(rgba?|hsla?|hwb|oklch|oklab|lch|lab|color|color-mix)\s*\(/i
// A named colour only counts as a value token: bounded by neither a word
// character nor a hyphen on either side, so no identifier or custom-property
// segment can trip it.
const NAMED_COLOUR = new RegExp(`(?<![\\w-])(${NAMED_COLOURS.join('|')})(?![\\w-])`, 'i')

// Only properties whose value syntax can legally carry a colour are ever
// scanned. This is an ALLOWLIST rather than a blocklist of known-safe
// properties on purpose: an unrecognised property is presumed NOT to carry
// colour, so the scan never has to be taught about the next non-colour
// property (font-family, content, grid-template-areas, grid-area,
// animation-name, will-change, cursor's non-colour half, ...) one at a time.
// Anchored at the start of the chunk, so a SELECTOR chunk never matches: a
// pseudo-class has a colon (`:not(.plum)`), but `.q-a:not(.plum)` does not
// start with a property name from this list, so `valueOf` is never even
// called on it. Same for an at-rule prelude (`@supports (color: ...)`) -
// `@supports` is not a property name either.
const COLOUR_PROPERTY = new RegExp(
  '^(' +
    [
      'color',
      'background(-color|-image)?',
      'border(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-color)?',
      'outline(-color)?',
      'box-shadow',
      'text-shadow',
      'filter',
      'fill',
      'stroke',
      'caret-color',
      'column-rule(-color)?',
      'text-decoration(-color)?',
      'accent-color',
      'scrollbar-color',
    ].join('|') +
    ')\\s*:',
  'i',
)

// Pull the contents of every url(...) call and every quoted string out of a
// value, replacing each with a space so the "bare value" scan below never
// sees the words inside them. Returns the opaque contents separately so they
// can still be checked for UNAMBIGUOUS colour syntax (see colourLiteralIn).
const extractOpaque = (value) => {
  const opaque = []
  let rest = value.replace(/url\(\s*(['"]?)([\s\S]*?)\1\s*\)/gi, (_m, _q, inner) => {
    opaque.push(inner)
    return ' '
  })
  rest = rest.replace(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/g, (m) => {
    opaque.push(m.slice(1, -1))
    return ' '
  })
  return { rest, opaque }
}

// A bare named colour ("gold", "tan", "linen", ...) is ambiguous with an
// ordinary word, which is exactly what makes a font name, a `content`
// string, a filename or a `grid-template-areas` template full of false
// positives for it. It is therefore only trusted as a colour when it sits
// directly in a declaration's value - never inside a quoted string or a
// url(). Hex and the colour functions are UNAMBIGUOUS: nothing else in CSS
// looks like `#fff` or `oklch(...)`, so they are still caught even inside a
// string or url() - a data-URI SVG (`url("data:image/svg+xml,...
// fill='#000'...")`) is the standard way this codebase would hide a real
// colour literal, and letting quotes launder it would reopen the hole rule 3
// exists to close. This is a deliberate asymmetry, not an oversight: see
// docs/RULES.md.
const colourLiteralIn = (value) => {
  const { rest, opaque } = extractOpaque(value)
  // Custom property NAMES are stripped before the bare-value scan so a token
  // name can never be read as a value - `--axi-ink-line` and friends are
  // names, not colours.
  const bare = rest.replace(/--[\w-]+/g, '')
  if (HEX.test(bare) || COLOUR_FUNCTION.test(bare) || NAMED_COLOUR.test(bare)) return true
  return opaque.some((s) => HEX.test(s) || COLOUR_FUNCTION.test(s))
}

// Shared by the real-file scan below and the synthetic regression test: scan
// one stylesheet's text and return every colour-literal offender as
// `${line}: ${declaration text}`.
const colourOffendersIn = (css) => {
  const offenders = []
  for (const { text, line } of declarations(css)) {
    if (!COLOUR_PROPERTY.test(text)) continue
    if (colourLiteralIn(valueOf(text))) {
      offenders.push(`${line}: ${text.trim().replace(/\s+/g, ' ')}`)
    }
  }
  return offenders
}

describe('token contract', () => {
  it('defines every --axi-* token that any source references', () => {
    const known = declared()
    const missing = []
    for (const name of ORDER) {
      for (const { token, hasFallback } of references(read(name))) {
        if (!known.has(token) && !hasFallback) missing.push(`${name}: ${token}`)
      }
    }
    expect(missing).toEqual([])
  })

  it('defines the form tokens only in tokens.css', () => {
    const offenders = []
    for (const name of COMPONENT_FILES()) {
      for (const { text, line } of declarations(read(name))) {
        if (FORM_TOKEN_DECLARATION.test(text)) {
          offenders.push(`${name}:${line}: ${text.trim().replace(/\s+/g, ' ')}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it('keeps every colour literal inside tokens.css', () => {
    const offenders = []
    for (const name of COMPONENT_FILES()) {
      for (const entry of colourOffendersIn(read(name))) offenders.push(`${name}:${entry}`)
    }
    expect(offenders).toEqual([])
  })

  it('uses only the two declared form steps for borders and outlines', () => {
    // A third border/outline weight is how a system stops looking like one
    // system. Any literal weight (px or otherwise, or a thin/medium/thick
    // keyword) on a border or outline property in a component means a step
    // was invented.
    const offenders = []
    for (const name of COMPONENT_FILES()) {
      for (const { text, line } of declarations(read(name))) {
        if (isThirdFormStep(text)) {
          offenders.push(`${name}:${line}: ${text.trim().replace(/\s+/g, ' ')}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it('takes every corner from the radius scale', () => {
    // docs/RULES.md used to concede this one: the tokens existed but the
    // components carried a hand-written 8px, so setting --axi-radius did
    // nothing to a button and the scale was convention rather than contract.
    // It is a contract now, and this is what holds it.
    const offenders = []
    for (const name of COMPONENT_FILES()) {
      for (const { text, line } of declarations(read(name))) {
        if (isLiteralRadius(text)) {
          offenders.push(`${name}:${line}: ${text.trim().replace(/\s+/g, ' ')}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it('draws every block hard, at a declared offset', () => {
    // The other half of rule 3, and the half docs/RULES.md used to claim was
    // enforced while nothing checked it: a box-shadow in this language is
    // always `<offset> <offset> 0 var(--axi-ink-line)`. No blur, no spread,
    // no bare literal offsets - a third offset step is as much a second
    // system as a third border weight is.
    const offenders = []
    for (const name of COMPONENT_FILES()) {
      for (const { text, line } of declarations(read(name))) {
        if (!/\bbox-shadow\s*:/.test(text)) continue
        const parts = valueOf(text).trim().split(/\s+/)
        const ok =
          parts.length === 4 &&
          OFFSETS.includes(parts[0]) &&
          parts[1] === parts[0] &&
          parts[2] === '0' &&
          parts[3] === 'var(--axi-ink-line)'
        if (!ok) offenders.push(`${name}:${line}: ${text.trim().replace(/\s+/g, ' ')}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('never smuggles a blur through filter or text-shadow', () => {
    const offenders = []
    for (const name of COMPONENT_FILES()) {
      for (const { text, line } of declarations(read(name))) {
        if (BLUR_PROPERTY.test(text)) {
          offenders.push(`${name}:${line}: ${text.trim().replace(/\s+/g, ' ')}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })
})

describe('colour literal scan - both polarities', () => {
  // Ten legal, colour-free declarations that a real contributor would write.
  // Every one of these false-positived on the previous version of the scan
  // (pseudo-class selectors, a font stack, url() filenames, a content
  // string, a cursor list, grid-template-areas, and an @supports prelude).
  // A checker that rejects legal CSS gets deleted by whoever it blocks, so
  // this direction is asserted with the same weight as the catch direction
  // below.
  const LEGAL = {
    'pseudo-class selector (:not)': `.q-a:not(.plum) { color: var(--axi-text); }`,
    'font stack with a colour word in it': `.q-b { font-family: 'Tan Pearl', Georgia, serif; }`,
    'url() filename with a colour word in it': `.q-c { background-image: url(/img/linen.png); }`,
    'content string with a colour word in it': `.q-d::before { content: "Gold"; }`,
    'cursor url() list': `.q-e { cursor: url(cursors/snow.cur), pointer; }`,
    'quoted url() filename with a colour word in it': `.q-f { background-image: url("./textures/tan.png"); }`,
    'pseudo-class selector (:is)': `.q-g:is(.a, .tan) { color: var(--axi-text); }`,
    '@supports prelude': `@supports (color: oklch(0 0 0)) { .q-h { color: var(--axi-text); } }`,
    'grid-template-areas with a colour word in it': `.q-i { grid-template-areas: "nav gold"; }`,
    'transparent stop in a gradient': `.q-j { background: linear-gradient(to bottom, transparent 50%, var(--axi-accent) 50%); }`,
  }

  it.each(Object.entries(LEGAL))('passes: %s', (_label, css) => {
    expect(colourOffendersIn(css)).toEqual([])
  })

  it('all ten legal inputs pass together', () => {
    const offenders = Object.values(LEGAL).flatMap((css) => colourOffendersIn(css))
    expect(offenders).toEqual([])
  })

  // The known-bad counterparts: real colour literals, including the case a
  // naive string/url()-blind fix would let back in (a hex literal inside a
  // data-URI SVG, after a `;`, with no colon in its own split fragment).
  const CAUGHT = {
    'bare named colour': `.p-a { background: black; }`,
    'uppercase named colour': `.p-b { color: WHITE; }`,
    'named colour in a longhand': `.p-c { border-color: rebeccapurple; }`,
    'modern colour function as a box-shadow ink': `.p-d { box-shadow: var(--axi-offset-panel) var(--axi-offset-panel) 0 oklch(0.72 0.19 142); }`,
    'hex literal inside a data-URI SVG inside url()': `.p-e { background: url("data:image/svg+xml,<svg><path fill='#000'/></svg>"); }`,
  }

  it.each(Object.entries(CAUGHT))('catches: %s', (_label, css) => {
    expect(colourOffendersIn(css).length).toBeGreaterThan(0)
  })
})

describe('form-token and weight escape hatches', () => {
  it('flags a component redeclaring a form token', () => {
    const css = `.axi-hero { --axi-offset-panel: 11px; box-shadow: var(--axi-offset-panel) var(--axi-offset-panel) 0 var(--axi-ink-line); }`
    const offenders = declarations(css).filter(({ text }) => FORM_TOKEN_DECLARATION.test(text))
    expect(offenders.length).toBeGreaterThan(0)
  })

  it('does not flag a var() reference to a form token', () => {
    const css = `.axi-panel { border: var(--axi-border-panel) solid var(--axi-ink-line); }`
    const offenders = declarations(css).filter(({ text }) => FORM_TOKEN_DECLARATION.test(text))
    expect(offenders).toEqual([])
  })

  it('catches an uppercase unit, a non-px unit, and a keyword weight', () => {
    expect(isThirdFormStep('border: 7PX solid var(--axi-ink-line)')).toBe(true)
    expect(isThirdFormStep('border-width: 0.5rem')).toBe(true)
    expect(isThirdFormStep('border: thick solid var(--axi-ink-line)')).toBe(true)
  })

  it('catches a literal outline weight but leaves outline-offset and outline-color alone', () => {
    expect(isThirdFormStep('outline: 7px solid var(--axi-ink-line)')).toBe(true)
    expect(isThirdFormStep('outline-offset: -3px')).toBe(false)
    expect(isThirdFormStep('outline-color: var(--axi-accent)')).toBe(false)
  })

  it('leaves the real focus ring legal', () => {
    // src/base.css's focus ring: a var() reference, no literal weight.
    expect(isThirdFormStep('outline: var(--axi-border-control) solid var(--axi-accent)')).toBe(false)
    expect(isThirdFormStep('outline-offset: 2px')).toBe(false)
  })

  it('catches a literal radius in every spelling, including a percentage', () => {
    expect(isLiteralRadius('border-radius: 8px')).toBe(true)
    expect(isLiteralRadius('border-top-left-radius: 0.5rem')).toBe(true)
    expect(isLiteralRadius('border-start-end-radius: 9PX')).toBe(true)
    expect(isLiteralRadius('border-radius: 50%')).toBe(true)
    expect(isLiteralRadius('border-radius: 6px 6px 0 0')).toBe(true)
  })

  it('leaves the token, a bare zero, and the other border properties alone', () => {
    expect(isLiteralRadius('border-radius: var(--axi-radius-sm)')).toBe(false)
    expect(isLiteralRadius('border-radius: var(--axi-radius) var(--axi-radius) 0 0')).toBe(false)
    expect(isLiteralRadius('border-radius: 0')).toBe(false)
    expect(isLiteralRadius('border: var(--axi-border-control) solid var(--axi-ink-line)')).toBe(false)
    expect(isLiteralRadius('border-spacing: 4px')).toBe(false)
  })

  it('catches filter: drop-shadow() and text-shadow', () => {
    expect(BLUR_PROPERTY.test('filter: drop-shadow(0 0 12px var(--axi-ink-line))')).toBe(true)
    expect(BLUR_PROPERTY.test('text-shadow: 3px 3px 0 var(--axi-ink-line)')).toBe(true)
  })
})
