import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
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
// --axi-shadow-* is in here for the same reason: it is the composed form of
// an offset pair, so a component redeclaring one mints an arbitrary block
// (or a blur) while both halves of the offset check below stay green.
const FORM_TOKEN_DECLARATION = /^(--axi-(border|offset|shadow)-[a-z0-9-]+)\s*:/i

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
// Rule 3, the one exception: a shape made of the line ink names it as a fill.
// ---------------------------------------------------------------------------

// Every property that paints an area rather than an edge. `fill` is in here
// for the SVG the language does not ship today and would paint the same way
// if it did; `border-color` deliberately is NOT - an edge in the line ink is
// the rule, not the exception to it.
const FILL_PROPERTY = /^(background(-color|-image)?|fill)\s*:/i

const isInkLineFill = (text) =>
  FILL_PROPERTY.test(text) && /var\(\s*--axi-ink-line\b/.test(valueOf(text))

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

// The composed blocks. A component no longer assembles a shadow out of an
// offset - it names one of these - so the hard-offset shape is now checked
// once, where the four are defined, and component files are checked for
// naming one of the four. Both halves are needed: without the first, a
// token could be redefined to a blur and every component would inherit it;
// without the second, a component could still write a literal shadow.
const SHADOWS = [
  'var(--axi-shadow-panel)',
  'var(--axi-shadow-control)',
  'var(--axi-shadow-panel-hover)',
  'var(--axi-shadow-control-hover)',
]

// `<offset> <offset> 0 var(--axi-ink-line)`, with the offset drawn from the
// enumerated list - rule 3's shape, unchanged. Extracted so both the token
// definitions and the synthetic tests below judge it identically.
const isHardBlock = (value) => {
  const parts = value.trim().split(/\s+/)
  return (
    parts.length === 4 &&
    OFFSETS.includes(parts[0]) &&
    parts[1] === parts[0] &&
    parts[2] === '0' &&
    parts[3] === 'var(--axi-ink-line)'
  )
}

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

  it('composes every block hard, at a declared offset', () => {
    // The other half of rule 3, and the half docs/RULES.md used to claim was
    // enforced while nothing checked it: a block in this language is always
    // `<offset> <offset> 0 var(--axi-ink-line)`. No blur, no spread, no bare
    // literal offsets - a third offset step is as much a second system as a
    // third border weight is. Checked here, at the four definitions, because
    // that is now the only place the shape is written down.
    const offenders = []
    for (const { text, line } of declarations(read(TOKENS_FILE))) {
      if (!/^--axi-shadow-[a-z0-9-]+\s*:/.test(text)) continue
      if (!isHardBlock(valueOf(text))) {
        offenders.push(`${TOKENS_FILE}:${line}: ${text.trim().replace(/\s+/g, ' ')}`)
      }
    }
    expect(offenders).toEqual([])
    // And all four exist: an empty loop above would otherwise pass.
    const defined = declarations(read(TOKENS_FILE))
      .filter(({ text }) => /^--axi-shadow-[a-z0-9-]+\s*:/.test(text))
      .map(({ text }) => `var(${text.slice(0, text.indexOf(':')).trim()})`)
    expect(defined.sort()).toEqual([...SHADOWS].sort())
  })

  it('raises every component with a named block, never a composed one', () => {
    // A component asks for "the panel block". It does not reassemble one out
    // of an offset - that spelling is what let the shape drift, and it is
    // what a theme cannot reach in to restate.
    const offenders = []
    for (const name of COMPONENT_FILES()) {
      for (const { text, line } of declarations(read(name))) {
        if (!/\bbox-shadow\s*:/.test(text)) continue
        if (!SHADOWS.includes(valueOf(text).trim())) {
          offenders.push(`${name}:${line}: ${text.trim().replace(/\s+/g, ' ')}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it('fills with --axi-ground-deep, never with the line ink itself', () => {
    // The line ink is the colour a shape's EDGE is drawn in. Three shapes are
    // MADE of that tone - the tooltip, the titlebar strip, the switch's slug -
    // and they name it --axi-ground-deep, which holds the line ink today and
    // is a separate decision from it. The split only pays off once: a theme
    // that relights the outline so its page can go near-black leaves the fill
    // dark, and the tooltip stays dark box + light words instead of turning
    // pale on pale. A fourth shape spelled `background: var(--axi-ink-line)`
    // would read correctly right now and silently opt out of that, which is
    // exactly the failure --axi-ink-on-fill was split out to prevent on the
    // other side of the same token.
    const offenders = []
    for (const name of COMPONENT_FILES()) {
      for (const { text, line } of declarations(read(name))) {
        if (isInkLineFill(text)) {
          offenders.push(`${name}:${line}: ${text.trim().replace(/\s+/g, ' ')}`)
        }
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

  it('catches a blurred, spread or foreign-ink block token', () => {
    expect(isHardBlock('var(--axi-offset-panel) var(--axi-offset-panel) 0 var(--axi-ink-line)')).toBe(true)
    // A blur radius in the third slot - the exact softening rule 3 forbids.
    expect(isHardBlock('var(--axi-offset-panel) var(--axi-offset-panel) 12px var(--axi-ink-line)')).toBe(false)
    // A spread, as a fifth part.
    expect(isHardBlock('var(--axi-offset-panel) var(--axi-offset-panel) 0 2px var(--axi-ink-line)')).toBe(false)
    // Mismatched offsets: a block is square or it is a drop shadow.
    expect(isHardBlock('var(--axi-offset-panel) var(--axi-offset-control) 0 var(--axi-ink-line)')).toBe(false)
    // A literal offset, which is how a third step gets minted.
    expect(isHardBlock('6px 6px 0 var(--axi-ink-line)')).toBe(false)
    // Drawn in something other than the outline ink.
    expect(isHardBlock('var(--axi-offset-panel) var(--axi-offset-panel) 0 var(--axi-accent)')).toBe(false)
  })

  it('flags a component redeclaring a block token', () => {
    const css = `.axi-hero { --axi-shadow-panel: 0 0 40px var(--axi-ink-line); }`
    const offenders = declarations(css).filter(({ text }) => FORM_TOKEN_DECLARATION.test(text))
    expect(offenders.length).toBeGreaterThan(0)
  })

  it('catches a fill in the line ink, in every spelling that paints an area', () => {
    const offenders = declarations(`.a { background: var(--axi-ink-line); }
      .b { background-color: var(--axi-ink-line); }
      .c { background-image: linear-gradient(var(--axi-ink-line), #000); }
      .d { fill: var(--axi-ink-line); }`).filter(({ text }) => isInkLineFill(text))
    expect(offenders).toHaveLength(4)
  })

  it('leaves an edge in the line ink, and a fill in the deep ground, alone', () => {
    const offenders = declarations(`.a { border: var(--axi-border-panel) solid var(--axi-ink-line); }
      .b { border-color: var(--axi-ink-line); }
      .c { background: var(--axi-ground-deep); }
      .d { box-shadow: var(--axi-shadow-panel); }`).filter(({ text }) => isInkLineFill(text))
    expect(offenders).toEqual([])
  })

  it('catches filter: drop-shadow() and text-shadow', () => {
    expect(BLUR_PROPERTY.test('filter: drop-shadow(0 0 12px var(--axi-ink-line))')).toBe(true)
    expect(BLUR_PROPERTY.test('text-shadow: 3px 3px 0 var(--axi-ink-line)')).toBe(true)
  })
})

// A floating surface is one the page scrolls BEHIND. Every such surface has to
// read --axi-surface-float rather than --axi-surface or --axi-surface-raised,
// because a theme that goes translucent restates only the float near-opaque and
// a .42-alpha pane over a scrolling table carries text with text behind it.
//
// This list is the check. It shipped as a bug first: --axi-surface-float's own
// comment named the palette, the popovers and the modal as its consumers and
// only the palette had ever been wired to it, so the rest quietly read a
// translucent fill for four releases. A prose list of consumers is not a
// guarantee; asserting on the declaration is. Anything added to the list below
// must also be added to that comment in tokens.css, and both must agree.
describe('the float surface reaches every surface that floats', () => {
  const FLOATING = [
    '.axi-modal',
    '.axi-menu__pop',
    '.axi-picker__pop',
    '.axi-toast',
    '.axi-drawer',
    '.axi-panel--float',
    '.axi-rail--float',
    '.axi-toolbar--float',
    '.axi-dock',
  ]

  const css = COMPONENT_FILES().map(read).map(stripComments).join('\n')

  // The selector's own rule body, not the whole file: a component may legally
  // name a floating surface inside some other rule (a descendant selector, a
  // media query) and only its own block is being judged.
  const bodyOf = (selector) => {
    // Word-boundary the class so .axi-panel--float is not found by .axi-panel,
    // and so .axi-modal does not match .axi-modal__head.
    const re = new RegExp(`(^|[\\s,}])${selector.replace(/[.\-]/g, '\\$&')}(?![\\w-])[^{}]*\\{([^}]*)\\}`, 'm')
    const m = css.match(re)
    return m ? m[2] : null
  }

  for (const selector of FLOATING) {
    it(`${selector} reads --axi-surface-float`, () => {
      const body = bodyOf(selector)
      expect(body, `${selector} has no rule of its own`).not.toBeNull()
      expect(body).toMatch(/background:\s*var\(--axi-surface-float\)/)
    })
  }

  it('names the same consumers in the token comment', () => {
    const comment = read(TOKENS_FILE).match(/FLOATS over content[\s\S]*?\*\//)[0]
    // The five named components are spelled in prose there ("the modal", "the
    // drawer"), so only the classes named literally can be pinned.
    for (const selector of ['.axi-panel--float', '.axi-rail--float', '.axi-toolbar--float', '.axi-dock']) {
      expect(comment, `${selector} missing from the token's consumer list`).toContain(selector)
    }
  })
})

// Rule 6's addendum, as arithmetic rather than prose. The ink and edge layers
// live last in the cascade and weigh one class each, which is what lets a
// consumer write `class="axi-btn axi-ink-danger"` and have it land. A component
// rule that sets the same property at two classes takes it back, and a
// pseudo-class counts: `.axi-btn:hover` is two, so the danger button read plain
// white under the cursor for as long as the ink layer has existed. Nothing told
// anybody - both rules are correct in isolation, and the failure only appears
// while the pointer is down on the element.
//
// Only the generic pressables are judged. A rail item's selected colour, a
// palette row's cursor colour and a pressed pill's fill-contrast ink are the
// state's whole meaning, so an ink reaching them would be the bug instead; they
// are named in RULES.md as staying at full weight, and their absence from this
// list is the same decision written twice.
describe('a generic control does not out-rank the ink layer it sits under', () => {
  const GENERIC = ['.axi-btn', '.axi-pill', '.axi-link']
  // The properties the ink and edge utilities set, and nothing else - a state
  // rule is free to restate background, shadow or transform at any weight.
  const INKED = /(^|[\s;])(color|border-color)\s*:/

  // Specificity of the class column only, which is all that matters against a
  // one-class utility. :where() contributes nothing, which is the fix under
  // test, so its contents come out first.
  const classWeight = (selector) => {
    const bare = selector.replace(/:where\([^()]*\)/g, '')
    return (
      (bare.match(/\.[\w-]+/g) || []).length +
      (bare.match(/\[[^\]]*\]/g) || []).length +
      (bare.match(/:(?!:)[\w-]+/g) || []).length
    )
  }

  // A state on the SAME element as the component class: `.axi-btn:hover`, not
  // `.axi-btn .axi-icon`. A descendant rule cannot be overruled by an ink on
  // the ancestor and is a different question.
  const sameElementStates = (css, base) => {
    const esc = base.replace(/[.\-]/g, '\\$&')
    const named = new RegExp(`(^|[^\\w-])${esc}(?![\\w-])`)
    // Split the selector GROUP first. A rule may name this component in one
    // arm and something else in another - `.axi-link, .axi-prose a` - and
    // judging the group as one string both misses the component and drags an
    // unrelated descendant selector into the verdict. This read as "no inked
    // rule of its own" for the whole of .axi-link's first draft, which is the
    // inert-guard failure the length check below exists to catch.
    return [...css.matchAll(/([^{}]*)\{([^}]*)\}/g)]
      .flatMap(([, sel, body]) => sel.split(',').map((one) => [one.trim(), body]))
      .filter(([sel]) => named.test(sel))
      .filter(([sel]) => !/\s|>|\+|~/.test(sel.replace(/\([^()]*\)/g, '')))
      .filter(([, body]) => INKED.test(body))
  }

  // `--primary` rests on the accent block, so its colour is that fill's
  // contrast pair rather than a default. An ink reaching it would put a status
  // colour on the accent and cost the label its legibility, which is rule 5's
  // reason for the chip. Same for a pressed pill.
  const CONTRAST_PAIRS = /--primary|\[aria-pressed="true"\]/

  const css = COMPONENT_FILES().map(read).map(stripComments).join('\n')

  for (const base of GENERIC) {
    it(`${base}'s state rules leave the ink layer reachable`, () => {
      const rules = sameElementStates(css, base)
      // If the parser stops finding rules the guard is inert, not passing.
      expect(rules.length, `${base} has no inked rule of its own`).toBeGreaterThan(0)
      const overweight = rules
        .filter(([sel]) => !CONTRAST_PAIRS.test(sel))
        .filter(([sel]) => classWeight(sel) > 1)
        .map(([sel]) => sel)
      expect(overweight).toEqual([])
    })
  }

  it('fails a state rule that takes the colour back, and passes the :where() form', () => {
    const bad = '.axi-btn:hover { color: var(--axi-text); }'
    const good = '.axi-btn:where(:hover) { color: var(--axi-text); }'
    const weigh = (css) =>
      sameElementStates(css, '.axi-btn')
        .filter(([sel]) => classWeight(sel) > 1)
        .map(([sel]) => sel)
    expect(weigh(bad)).toEqual(['.axi-btn:hover'])
    expect(weigh(good)).toEqual([])
  })

  it('judges the element, not its descendants or its siblings', () => {
    // A descendant rule is out of scope even at three classes...
    expect(
      sameElementStates('.axi-btn:hover .axi-icon { color: red; }', '.axi-btn'),
    ).toEqual([])
    // ...and a rule that sets no ink is out of scope at any weight.
    expect(
      sameElementStates('.axi-btn:hover:focus { transform: none; }', '.axi-btn'),
    ).toEqual([])
  })
})

// `.axi-chip--action` turns a mark into a press, and the whole point of it is
// what it does NOT do: it sets no colour. The fill modifiers - `--accent` and
// the three status fills - each weigh one class and each set their own contrast
// pair. `--action` also weighs one class, so any colour it declared would tie
// with them and win on source order, putting a neutral back on top of a
// saturated ground. There is also nothing for a brighten to add to a filled
// chip. Both reasons point the same way, and neither is visible from the rule
// itself - hence this guard.
describe('a pressable chip changes no colour', () => {
  const css = COMPONENT_FILES().map(read).map(stripComments).join('\n')

  const actionRules = () =>
    [...css.matchAll(/([^{}]*\.axi-chip--action[^{}]*)\{([^}]*)\}/g)]
      .map(([, sel, body]) => [sel.trim(), body])

  it('declares no colour on any .axi-chip--action rule', () => {
    const rules = actionRules()
    // If the parser stops finding the rules the guard is inert, not passing.
    expect(rules.length, 'no .axi-chip--action rule found at all').toBeGreaterThan(0)
    const coloured = rules
      .filter(([, body]) => /(^|[\s;])(color|background|background-color|border-color)\s*:/.test(body))
      .map(([sel]) => sel)
    expect(coloured).toEqual([])
  })

  it('still carries the press affordances it exists for', () => {
    const bodies = actionRules().map(([, body]) => body).join(';')
    expect(bodies).toMatch(/cursor\s*:\s*pointer/)
    expect(bodies).toMatch(/box-shadow\s*:\s*var\(--axi-shadow-control\)/)
    expect(bodies).toMatch(/transform\s*:\s*translate\(/)
  })
})

// The pill and the button share one scale, and the sharing is the point: the
// only thing a pill has that a button does not is a state, so two of them
// carrying the same label must be the same shape. They were not - the pill sat
// at 10px/9px against the button's 12px/20px, its sides less than half - and
// nothing in either rule said they were meant to match, which is exactly how
// they drifted. This holds them in step.
describe('a pill is a button that holds a state, so it is the same shape', () => {
  const css = COMPONENT_FILES().map(read).map(stripComments).join('\n')

  const knob = (name) => {
    const m = new RegExp(`var\\(${name.replace(/[-]/g, '\\-')},\\s*([^)]*)\\)`).exec(css)
    return m && m[1].trim()
  }
  const step = (selector, knobName) => {
    const rule = new RegExp(`${selector.replace(/[-.]/g, (c) => '\\' + c)}\\s*\\{([^}]*)\\}`).exec(css)
    if (!rule) return null
    const m = new RegExp(`${knobName.replace(/[-]/g, '\\-')}:\\s*([^;]*)`).exec(rule[1])
    return m && m[1].trim()
  }

  it('shares the default padding and label size', () => {
    // Fails loudly rather than quietly comparing null to null.
    expect(knob('--axi-btn-pad'), 'no --axi-btn-pad fallback found').toBeTruthy()
    expect(knob('--axi-pill-pad')).toBe(knob('--axi-btn-pad'))
    expect(knob('--axi-btn-size'), 'no --axi-btn-size fallback found').toBeTruthy()
    expect(knob('--axi-pill-size')).toBe(knob('--axi-btn-size'))
  })

  for (const s of ['sm', 'xs']) {
    it(`--${s} sets the same padding and size on both`, () => {
      const btnPad = step(`.axi-btn--${s}`, '--axi-btn-pad')
      expect(btnPad, `.axi-btn--${s} not found`).toBeTruthy()
      expect(step(`.axi-pill--${s}`, '--axi-pill-pad')).toBe(btnPad)
      const btnSize = step(`.axi-btn--${s}`, '--axi-btn-size')
      expect(btnSize, `.axi-btn--${s} sets no size`).toBeTruthy()
      expect(step(`.axi-pill--${s}`, '--axi-pill-size')).toBe(btnSize)
    })
  }
})

// A code span inside rendered markdown and a code span inside a card are the
// same object. The language spelled it twice - once as `.axi-prose code`, and
// nowhere reachable outside prose, which is why consumers invented boxes. The
// fix was one rule with both selectors, and these are the two facts that fix
// depends on: that both selectors are present, and that they are in the SAME
// rule. Asserting only "both exist" would pass a re-split into two rules with
// drifting values, which is the defect this replaced.
describe('a quoted literal is one object, in or out of prose', () => {
  const css = COMPONENT_FILES().map(read).map(stripComments).join('\n')

  // Every rule whose selector list mentions either spelling of code.
  const rules = [...css.matchAll(/([^{}]*)\{([^}]*)\}/g)]
    .map(([, sel, body]) => ({ sel: sel.trim(), body }))
    .filter(({ sel }) => /(^|,|\s)\.axi-code\b/.test(sel) || /\.axi-prose\s+code\b/.test(sel))

  it('declares both spellings in a single rule', () => {
    // `.axi-prose pre code` legitimately overrides the shared rule inside a
    // block, so it is not a second copy - exclude it by its own selector.
    const shared = rules.filter(({ sel }) => !/pre\s+code/.test(sel))
    expect(shared.length, `expected one shared rule, found ${shared.length}: ${shared.map((r) => r.sel).join(' | ')}`).toBe(1)
    expect(shared[0].sel).toMatch(/\.axi-code/)
    expect(shared[0].sel).toMatch(/\.axi-prose\s+code/)
  })

  it('sizes the literal against the text around it, not in pixels', () => {
    const shared = rules.find(({ sel }) => !/pre\s+code/.test(sel))
    // A code span lands in body copy and in 10px captions alike; a px size
    // would read as a different voice in one of them.
    expect(/font-size:\s*[\d.]+em/.test(shared.body), 'font-size is not in em').toBe(true)
  })

  it('is sunk into its surface, where the key it sits beside is raised off one', () => {
    const shared = rules.find(({ sel }) => !/pre\s+code/.test(sel))
    // Sunk is --axi-well-fill, not --axi-ground. This asserted the page colour
    // for as long as the two were the same value, which is the conflation that
    // turned every flat control into an opaque patch under a glass theme.
    expect(shared.body).toMatch(/background:\s*var\(--axi-well-fill\)/)
    const kbd = [...css.matchAll(/\.axi-kbd\s*\{([^}]*)\}/g)][0]
    expect(kbd, 'no .axi-kbd rule found').toBeTruthy()
    expect(kbd[1]).toMatch(/background:\s*var\(--axi-surface\)/)
  })
})

// The well is the one form in the language used at two scales, and until now
// only one of them had a class - the other was a sentence in a comment telling
// every consumer to write the same declaration inline. This holds the modifier
// to exactly that declaration: a reading-scale well differs from a page-scale
// one in its radius and in nothing else, so a second property appearing here
// means the modifier has started to be a different component.
describe('the well has a class for each of the two scales it is used at', () => {
  const css = COMPONENT_FILES().map(read).map(stripComments).join('\n')
  const body = () => (/\.axi-well--sm\s*\{([^}]*)\}/.exec(css) || [])[1]

  it('sets the control radius and only the radius', () => {
    expect(body(), 'no .axi-well--sm rule found').toBeTruthy()
    const decls = body().split(';').map((d) => d.trim()).filter(Boolean)
    expect(decls).toEqual(['--axi-well-radius: var(--axi-radius-sm)'])
  })

  it('leaves the base well on the panel-scale radius', () => {
    const base = /\.axi-well\s*\{([^}]*)\}/.exec(css)
    expect(base[1]).toMatch(/border-radius:\s*var\(--axi-well-radius,\s*var\(--axi-radius\)\)/)
  })
})

// Two filled rails on one screen name two places. The nested picker's whole
// reason to exist is that the accent is already spent by the pane beside it, so
// the modifier's job is to take the fill away and leave the accent as a mark.
// Both halves are asserted, because either one alone is the bug: keep the fill
// and the modifier does nothing; drop the accent entirely and the selected row
// is only a hover that never ends.
describe('a rail nested under a spent accent marks its selection instead of filling it', () => {
  const css = COMPONENT_FILES().map(read).map(stripComments).join('\n')
  const quiet = () =>
    (/\.axi-rail__nav--quiet\s+\.axi-rail__item\[aria-current\][^{]*\{([^}]*)\}/.exec(css) || [])[1]

  it('does not fill the selected row with the accent', () => {
    expect(quiet(), 'no .axi-rail__nav--quiet rule found').toBeTruthy()
    expect(quiet()).not.toMatch(/background:\s*var\(--axi-accent\)/)
    expect(quiet()).toMatch(/background:\s*var\(--axi-surface-raised\)/)
  })

  it('still spends the accent, as an edge rather than a fill', () => {
    // The item's own border, not a shadow and not a pseudo-element: the base
    // rule already reserves it at the control weight and draws it transparent,
    // so lighting one side costs nothing and moves nothing. Asserting the
    // logical property is the point - a `border-left-color` here would be
    // correct on this page and wrong in the first right-to-left one.
    expect(quiet()).toMatch(/border-inline-start-color:\s*var\(--axi-accent\)/)
    const base = /\.axi-rail__item\s*\{([^}]*)\}/.exec(
      COMPONENT_FILES().map(read).map(stripComments).join('\n')
    )
    expect(base[1], 'the base item does not reserve a border to light').toMatch(
      /border:\s*var\(--axi-border-control\)\s+solid\s+transparent/
    )
  })

  it('overrides the base item, which does fill', () => {
    // The point of the modifier is that the unmodified item is the loud one.
    // If this ever stops being true the modifier is redundant, not working.
    const base = /\.axi-rail__item\[aria-current\],[^{]*\{([^}]*)\}/.exec(css)
    expect(base, 'no base .axi-rail__item[aria-current] rule found').toBeTruthy()
    expect(base[1]).toMatch(/background:\s*var\(--axi-accent\)/)
  })

  it('takes the accent ink off the icon, having taken the accent fill off the row', () => {
    // The base rule paints a selected item's icon --axi-accent-ink because it
    // sits on the accent. With no fill there is nothing for that ink to read
    // against, so leaving this out would put near-black glyphs on a surface.
    const icon = /\.axi-rail__nav--quiet\s+\.axi-rail__item\[aria-current\]\s+\.axi-icon\s*\{([^}]*)\}/.exec(css)
    expect(icon, 'the quiet rail does not correct its icon ink').toBeTruthy()
    expect(icon[1]).not.toMatch(/--axi-accent-ink/)
  })
})


// The second component pulled out of a layer-scoped style, and the check is the
// same one .axi-code gets: not "does .axi-link exist" but "are both spellings
// in the same rule", because only that fails when someone splits them.
describe('a link is one object, in or out of prose', () => {
  const css = COMPONENT_FILES().map(read).map(stripComments).join('\n')
  const rules = [...css.matchAll(/([^{}]*)\{([^}]*)\}/g)]
    .map(([, sel, body]) => ({ sel: sel.trim(), body }))
    .filter(({ sel }) => /\.axi-link\b/.test(sel) || /\.axi-prose a\b/.test(sel))

  const rest = () => rules.find(({ sel }) => !/:where|:hover/.test(sel))

  it('declares both spellings in a single rule', () => {
    const r = rest()
    expect(r, 'no at-rest link rule found').toBeTruthy()
    expect(r.sel).toMatch(/\.axi-link\s*,\s*\.axi-prose a/)
    // And nowhere else: a second rule naming either spelling on its own is the
    // drift this is here to prevent.
    expect(rules.filter(({ sel }) => !/:where|:hover/.test(sel))).toHaveLength(1)
  })

  it('states the underline rather than inheriting it from the anchor', () => {
    // The declaration does nothing on an <a> and is the whole thing on a
    // <button>. Leaving it out is how the two spellings come apart.
    expect(rest().body).toMatch(/text-decoration:\s*underline/)
  })

  it('resets the chrome a button brings and an anchor does not', () => {
    for (const d of [/background:\s*none/, /border:\s*0/, /padding:\s*0/]) {
      expect(rest().body).toMatch(d)
    }
  })

  it('inherits the face but not the weight', () => {
    // `font: inherit` would be shorter and would silently drop the 600.
    expect(rest().body).not.toMatch(/font:\s*inherit/)
    expect(rest().body).toMatch(/font-weight:\s*600/)
  })

  it('keeps its hover under the ink layer', () => {
    const hover = rules.find(({ sel }) => /hover/.test(sel))
    expect(hover, 'no hover rule found').toBeTruthy()
    expect(hover.sel).toMatch(/\.axi-link:where\(:hover\)/)
  })
})

// A picked row has to be told apart from the row under the cursor, and the table
// is the one component where those two states land on the same box.
//
// The first version of this rule filled the selection from --axi-surface-float on
// the theory that it was the step past --axi-surface-raised. It is not: it is a
// promise of OPACITY for things over content, and the themes prove it -- the
// default theme sets it EQUAL to --axi-surface and glass sets it darker than
// --axi-surface-raised, so the selection was invisible in one theme and a step
// backwards in the other. The check that let it through compared token NAMES
// against a ramp written into the test, which is the vacuous-guard failure in its
// purest form: it asserted the author's assumption rather than the themes.
//
// So the check now reads the themes. The mark is the leading edge, and what has
// to hold is that it is an edge and not a fill -- see .axi-rail__nav--quiet,
// which reached the same answer for the same reason.
describe('a picked row is marked by its edge, not by a step no theme has', () => {
  const css = stripComments(read('data.css'))
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, sel, body]) => ({ sel: sel.trim().replace(/\s+/g, ' '), body }))
  const bodyOf = (needle) => (rules.find((r) => r.sel.includes(needle)) || {}).body

  const current = () => bodyOf('tbody tr[aria-current] :is(td, th)')
  const edge = () => bodyOf('tbody tr[aria-current] > :is(td, th):first-child')
  const reserve = () => bodyOf(':where(tbody tr) > :where(td, th):first-child')

  it('draws the selection and its edge', () => {
    expect(current(), 'no aria-current fill rule').toBeTruthy()
    expect(edge(), 'no aria-current edge rule').toBeTruthy()
  })

  it('marks it with the accent on the leading edge', () => {
    expect(edge()).toMatch(/border-inline-start-color:\s*var\(--axi-accent\)/)
  })

  it('reserves that border on every body row, so lighting it costs no reflow', () => {
    expect(reserve(), 'no reserved leading border').toBeTruthy()
    expect(reserve()).toMatch(/border-inline-start:\s*var\(--axi-border-control\) solid transparent/)
  })

  it('lights only the leading edge, never boxes the row', () => {
    // Rule 8 refuses an outline around a row; one edge is a mark.
    expect(edge()).not.toMatch(/border-(top|bottom|inline-end)-color:\s*var\(--axi-accent\)/)
    expect(edge()).not.toMatch(/border:\s/)
  })

  it('does not try to out-fill the hover, because no theme has a step for it', () => {
    // Both states sit on the raised step on purpose. If this ever diverges, the
    // themes below are what decides whether the new value is visible at all.
    const hover = bodyOf('tbody tr:hover :is(td, th)')
    const fill = (b) => (b.match(/background:\s*var\((--axi-surface[a-z-]*)\)/) || [])[1]
    expect(fill(current())).toBe(fill(hover))
  })

  it('is not drawn from a token the themes disagree about the direction of', () => {
    // The measurement the first version of this rule skipped. Read
    // --axi-surface-float out of the default and out of every shipped theme and
    // it does not keep a consistent side of --axi-surface-raised: the default
    // aliases it straight to --axi-surface, and glass sets it darker and nearly
    // opaque. It is a promise about opacity, not a rung on the neutral ramp, so
    // nothing that needs to read as "one step further forward" may be drawn
    // from it.
    const defaults = read('tokens.css')
    expect(defaults).toMatch(/--axi-surface-float:\s*var\(--axi-surface\)/)

    const themed = readdirSync(resolve('themes'))
      .filter((f) => f.endsWith('.json'))
      .map((f) => JSON.parse(readFileSync(resolve('themes', f), 'utf8')).tokens || {})
      .filter((t) => t['--axi-surface-float'])
    expect(themed.length, 'no themed --axi-surface-float to check').toBeGreaterThan(0)
    for (const t of themed) {
      expect(t['--axi-surface-float']).not.toBe(t['--axi-surface-raised'])
    }

    expect(current()).not.toMatch(/--axi-surface-float/)
  })

  it('does not spend the accent twice', () => {
    expect(current()).not.toMatch(/--axi-accent/)
  })
})

// An ellipsis takes three declarations, not one, and the two that do the work
// are easy to leave off - `text-overflow` alone is inert, and on a flex child
// so is `overflow: hidden` without `min-width: 0`. Both omissions fail
// silently: the text simply paints across whatever is beside it. So the checks
// here are derived from the stylesheet rather than from a list written here.
// Every rule that asks for an ellipsis is found by reading the CSS, and each
// one has to carry what an ellipsis actually requires.
describe('an ellipsis is three declarations, and the silent two are checked', () => {
  const RULES = () =>
    ORDER.flatMap((name) => {
      const css = stripComments(read(name))
      return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, sel, body]) => ({
        file: name,
        sel: sel.trim().replace(/\s+/g, ' '),
        body,
      }))
    })

  const ellipsisRules = () => RULES().filter((r) => /text-overflow:\s*ellipsis/.test(r.body))

  it('finds the ellipsis rules to check', () => {
    // If this ever reads 0 the two checks below pass vacuously, which is the
    // failure mode the 1.37.0 ramp guard shipped with.
    expect(ellipsisRules().length).toBeGreaterThan(3)
  })

  it('clips wherever it ellipsises - text-overflow alone does nothing', () => {
    const inert = ellipsisRules()
      .filter((r) => !/overflow:\s*hidden/.test(r.body))
      .map((r) => `${r.file} ${r.sel}`)
    expect(inert).toEqual([])
  })

  it('lets the box shrink wherever it is a flex child, or the ellipsis never appears', () => {
    // A flex item's default min-width is its content, so a child rule that
    // clips without min-width: 0 clips a box that never got narrower than its
    // text. Only child selectors are judged: a rule on a block element in
    // normal flow shrinks without being asked.
    const unshrinkable = ellipsisRules()
      .filter((r) => r.sel.includes('>'))
      .filter((r) => !/min-width:\s*0/.test(r.body))
      .map((r) => `${r.file} ${r.sel}`)
    expect(unshrinkable).toEqual([])
  })
})

describe('a table in a pane divides the room it has', () => {
  const css = stripComments(read('data.css'))
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, sel, body]) => ({ sel: sel.trim().replace(/\s+/g, ' '), body }))
  const bodyOf = (needle) => (rules.find((r) => r.sel.includes(needle)) || {}).body

  it('offers a fixed layout, because width: 100% is a floor and the cells are nowrap', () => {
    expect(bodyOf('.axi-table--fixed'), 'no fixed-layout modifier').toBeTruthy()
    expect(bodyOf('.axi-table--fixed')).toMatch(/table-layout:\s*fixed/)
  })

  it('states no column widths itself - those are one table\'s facts, set in a colgroup', () => {
    const fixed = rules.filter((r) => r.sel.includes('axi-table--fixed'))
    for (const r of fixed) expect(r.body).not.toMatch(/(^|[\s;])width:/)
  })

  it('shrinks the label in a name cell and not the mark beside it', () => {
    // The pair that made this necessary: a 417px skill name in a 183px column.
    // `flex: none` on the mark is the load-bearing half - without it the icon
    // squashes toward zero before the text gives up any room.
    const label = bodyOf('.axi-table__who > :where(span')
    const mark = bodyOf('.axi-table__who > :where(img, svg)')
    expect(label, 'no truncating label rule in the name cell').toBeTruthy()
    expect(label).toMatch(/text-overflow:\s*ellipsis/)
    expect(mark, 'nothing protects the mark from shrinking').toBeTruthy()
    expect(mark).toMatch(/flex:\s*none/)
    const container = (rules.find((r) => r.sel === '.axi-table__who') || {}).body
    expect(container, 'no bare .axi-table__who rule').toBeTruthy()
    expect(container).toMatch(/min-width:\s*0/)
  })
})
