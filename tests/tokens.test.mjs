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
// The same set, used to find where a function STARTS so its arguments can be
// scanned with balanced parens. Kept beside its twin so the two lists cannot
// drift apart.
const COLOUR_FUNCTION_OPEN = /\b(?:rgba?|hsla?|hwb|oklch|oklab|lch|lab|color|color-mix)\s*\(/i
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
// A colour FUNCTION is unambiguous SYNTAX, and syntax is not the same thing as
// a literal. `color-mix(in srgb, var(--axi-accent) 18%, var(--axi-surface-paint))`
// spells no colour anywhere: both operands are tokens and the percentage is a
// ratio, not an ink. That shape is how this language derives a colour it cannot
// store - the matrix's heat bands, rule 9's "the matrix is the bound on not at
// all" - and no token could hold the result, because the mix depends on
// whichever accent is live.
//
// So: a colour function is a literal UNLESS every colour-valued argument in it
// is a bare `var(--token)`. Beside those, only the colour-space clause
// (`in srgb`, `in oklch shorter hue`), percentages and separators may remain.
// Anything else - a hex, a named colour, a bare numeric channel, or a literal
// hiding in a var() FALLBACK - leaves residue and still fails. The CAUGHT cases
// below pin each of those.
//
// A bare alpha (`rgba(var(--x), 0.5)`) is deliberately not in the allowed
// residue. It is left failing because a token at partial opacity is rule 2, so
// the two checks agree rather than one excusing the other.
//
// Balanced-paren scanning, not a non-greedy match: a colour function's
// arguments hold parens of their own, and `var(--x, #fff)` is exactly the case
// a lazy `\)` would launder.
const stripTokenOnlyColourFunctions = (value) => {
  let out = value
  // Bounded rather than `while (true)`: a malformed value must not hang the
  // suite. Ten nested colour functions is far past anything this language has.
  for (let pass = 0; pass < 10; pass += 1) {
    const open = COLOUR_FUNCTION_OPEN.exec(out)
    if (!open) return out
    const from = open.index + open[0].length - 1
    let depth = 0
    let end = -1
    for (let i = from; i < out.length; i += 1) {
      if (out[i] === '(') depth += 1
      else if (out[i] === ')') {
        depth -= 1
        if (depth === 0) {
          end = i
          break
        }
      }
    }
    if (end < 0) return out
    // Innermost first, by resolving the arguments before measuring them. A
    // token-only mix of a token-only mix is still token-only, and scanning
    // outside-in would see the inner function's own name as residue and give up
    // on the outer one. Bounded by the arguments being strictly shorter.
    const residue = stripTokenOnlyColourFunctions(out.slice(from + 1, end))
      .replace(/var\(\s*--[\w-]+\s*\)/g, ' ')
      .replace(/\bin\s+[\w-]+(\s+(shorter|longer|increasing|decreasing)\s+hue)?/gi, ' ')
      .replace(/-?[\d.]+%/g, ' ')
      .replace(/[,\s]+/g, '')
    // A real literal is in there. Leave the function in place so the scan below
    // fails on it, which is the whole point.
    if (residue !== '') return out
    out = `${out.slice(0, open.index)} ${out.slice(end + 1)}`
  }
  return out
}

const colourLiteralIn = (value) => {
  const { rest: raw, opaque } = extractOpaque(value)
  // Token-only colour functions are removed first, while the `var()` calls
  // that prove them token-only are still intact - the name-stripping below
  // would erase the evidence.
  const rest = stripTokenOnlyColourFunctions(raw)
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
    // The matrix's heat band: a colour function spelling no colour. Both
    // operands are tokens, and the 18% is a ratio.
    'color-mix() of two tokens': `.q-k { background-color: color-mix(in srgb, var(--axi-accent) 18%, var(--axi-surface-paint)); }`,
    // The polar form, whose colour-space clause carries a hue method.
    'color-mix() in a polar space': `.q-l { background-color: color-mix(in oklch shorter hue, var(--axi-accent) 42%, var(--axi-surface-paint)); }`,
    // Nested, to prove the balanced-paren scan does not stop at the inner
    // close paren.
    'color-mix() of a color-mix()': `.q-m { background-color: color-mix(in srgb, color-mix(in srgb, var(--axi-accent) 50%, var(--axi-surface-paint)) 70%, var(--axi-ground)); }`,
  }

  it.each(Object.entries(LEGAL))('passes: %s', (_label, css) => {
    expect(colourOffendersIn(css)).toEqual([])
  })

  it('all thirteen legal inputs pass together', () => {
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
    // The four ways a colour function stops being token-only. Each is the
    // reason stripTokenOnlyColourFunctions inspects the arguments instead of
    // trusting the function name.
    'color-mix() with one hex operand': `.p-f { background-color: color-mix(in srgb, #ff00aa 18%, var(--axi-surface-paint)); }`,
    'color-mix() with a named operand': `.p-g { background-color: color-mix(in srgb, var(--axi-accent) 18%, white); }`,
    // A literal in a var() FALLBACK, which is where one would hide from a
    // check that only looked for `var(`.
    'color-mix() with a literal in a var() fallback': `.p-h { background-color: color-mix(in srgb, var(--axi-accent, #ff00aa) 18%, var(--axi-surface-paint)); }`,
    // Bare numeric channels, the ordinary hand-written colour.
    'rgb() with numeric channels': `.p-i { color: rgb(12, 14, 18); }`,
    // A token faded, which rule 2 forbids - left failing so this check and
    // rule 2 agree rather than one excusing the other.
    'a token at partial alpha': `.p-j { background-color: rgba(var(--axi-accent-rgb), 0.5); }`,
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
    // `:where(a)` and `a` are the same spelling for this guard's purpose - the
    // wrapper sets the weight, not the subject - so the pattern tolerates it.
    .filter(({ sel }) => /\.axi-link\b/.test(sel) || /\.axi-prose :?w?h?e?r?e?\(?a\b/.test(sel))

  // `:disabled` joins `:hover` as a state rather than an appearance: the dead
  // state is declared once, in utilities.css, for every interactive object at
  // once, so the rule that carries it names both spellings without being a
  // second place the link's look is written down.
  //
  // The state is what excludes a rule here, not the `:where()` around it. The
  // at-rest rule now carries a `:where()` of its own - `.axi-prose :where(a)`,
  // so an ink class on a prose link is not outweighed by it - and excluding
  // every `:where` left this guard with no resting rule to find at all.
  const rest = () => rules.find(({ sel }) => !/:hover|:disabled/.test(sel))

  it('declares both spellings in a single rule', () => {
    const r = rest()
    expect(r, 'no at-rest link rule found').toBeTruthy()
    expect(r.sel).toMatch(/\.axi-link\s*,\s*\.axi-prose :where\(a\)/)
    // And nowhere else: a second rule naming either spelling on its own is the
    // drift this is here to prevent.
    expect(rules.filter(({ sel }) => !/:hover|:disabled/.test(sel))).toHaveLength(1)
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
    const hover = bodyOf('tbody tr:hover')
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

// A hover may not put a component's colour further out of the ink layer's
// reach than the component's own resting rule already does. That is the exact
// invariant .axi-btn was fixed for - `axi-btn axi-ink-danger` went white under
// the cursor because `.axi-btn:hover` weighed two classes against the ink's
// one - and stating it as arithmetic rather than as "wrap your hovers in
// :where()" is what makes it check the cases nobody has met yet. Derived: the
// rules come out of the stylesheets, and the set is asserted non-empty.
//
// It deliberately does NOT claim the ink layer reaches every component. Two of
// them address their children by element (`.axi-tabs a`, `.axi-crumbs a`), so
// an ink class loses to them at REST, hover or no hover - a real defect, and a
// different one from this. Widening this test to cover it would have it fail
// for a reason it cannot diagnose.
describe('a hover does not put a colour further out of reach than rest does', () => {
  const RULES = () =>
    ORDER.flatMap((name) => {
      const css = stripComments(read(name))
      return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, sel, body]) => ({
        file: name,
        sel: sel.trim().replace(/\s+/g, ' '),
        body
      }))
    })

  // `:where()` contributes nothing; an element name still counts.
  const weigh = (sel) => {
    const bare = sel.replace(/:where\((?:[^()]|\([^()]*\))*\)/g, '')
    const classes = (bare.match(/\.[a-zA-Z][\w-]*|\[[^\]]+\]|:(?:hover|focus|is)\b/g) || []).length
    const elements = (bare.match(/(?:^|[\s>+~(,])(a|button|td|th|tr|thead|tbody|option|input|label|svg|img|span)\b/g) || []).length
    return classes * 100 + elements
  }

  // The component a selector belongs to: its first class. That is the rule an
  // ink class competes with, and the one a hover must not outweigh.
  const owner = (sel) => (sel.match(/\.[a-zA-Z][\w-]*/) || [null])[0]

  // Judged one compound at a time, never a whole selector list. A rule that
  // lists two hovers and a state - `.axi-select:where(:hover),
  // .axi-picker__btn:where(:hover), .axi-picker__btn[aria-expanded='true']` -
  // weighs as its heaviest member if you measure the list, so two correctly
  // wrapped hovers were reported as offenders on account of the state beside
  // them.
  const splitTop = (list) => {
    const out = []
    let depth = 0
    let cur = ''
    for (const ch of list) {
      if (ch === '(') depth++
      else if (ch === ')') depth--
      if (ch === ',' && depth === 0) { out.push(cur); cur = '' } else cur += ch
    }
    if (cur.trim()) out.push(cur)
    return out.map((x) => x.trim())
  }
  const COMPOUNDS = () =>
    RULES().flatMap((r) => splitTop(r.sel).map((sel) => ({ ...r, sel })))

  const colourHovers = () =>
    COMPOUNDS().filter((r) => /:hover/.test(r.sel) && /(^|[\s;])color:/.test(r.body))

  // Colours that ARE the state rather than a default the consumer might mean to
  // replace. Both are argued at length beside their rules: an ink reaching the
  // accent fill or a pressed pill's fill would put a status colour on top of a
  // block and the label would stop being legible.
  const STATE_COLOUR = [
    /^\.axi-btn--primary:hover$/,
    /^\.axi-pill\[aria-pressed="true"\]:hover$/,
    // A current rail item, whose colour is the same statement the pressed pill
    // makes: this one is on. The rule pairs rest and hover deliberately so the
    // current item does not brighten further under the cursor.
    /^\.axi-rail__item\[aria-current\]:hover$/,
    /^\.axi-rail__nav--quiet \.axi-rail__item\[aria-current\]:hover$/
  ]

  it('finds the hover rules to check', () => {
    expect(colourHovers().length).toBeGreaterThan(2)
  })

  it('never weighs more than the resting rule of the class it belongs to', () => {
    const all = COMPOUNDS()
    const offenders = []
    for (const h of colourHovers()) {
      if (STATE_COLOUR.some((re) => re.test(h.sel))) continue
      const cls = owner(h.sel)
      if (!cls) continue
      // The resting rule: the lightest rule naming this class that sets a
      // colour on the SAME element and is not itself a state. Same element
      // matters - `.axi-prose` colours the container and an <a> inside it
      // inherits that, which no specificity can lose to, so comparing a link's
      // hover against the container's rule asks the wrong question and reports
      // a correctly wrapped hover as an offender.
      const subject = (sel) => {
        const last = sel.trim().split(/[\s>+~]+/).pop()
        return (last.match(/^(?:[\w-]+|\.[\w-]+|\*)/) || [''])[0]
      }
      const subj = subject(h.sel)
      const resting = all
        .filter((r) => r.sel.includes(cls) && /(^|[\s;])color:/.test(r.body))
        .filter((r) => !/:hover|:focus|\[aria-|\[data-/.test(r.sel))
        .filter((r) => subject(r.sel) === subj)
        .map((r) => weigh(r.sel))
      if (!resting.length) continue
      const lightest = Math.min(...resting)
      if (weigh(h.sel) > lightest) offenders.push(`${h.file} ${h.sel}`)
    }
    // There is no allowlist. There used to be one, holding sixteen rules that
    // predated the invariant; every one of them is now wrapped, so the guard is
    // simply "none", which is the only version of it that cannot be added to.
    expect(
      offenders,
      'this hover outweighs its own resting rule, so an ink class that reaches the component at rest loses it under the cursor'
    ).toEqual([])
  })

  it('never names a colour outside the token set', () => {
    const literal = colourHovers().filter((r) =>
      /(^|[\s;])color:\s*(#|rgb|hsl|\b(?:white|black|gray|grey|slate|red|blue|amber|yellow|green)\b)/.test(r.body)
    )
    expect(
      literal.map((r) => `${r.file} ${r.sel}`),
      'a literal colour on hover leaves the theme at the moment the cursor arrives'
    ).toEqual([])
  })
})

describe('the quiet action is a control that is only its label', () => {
  const css = stripComments(read('primitives.css'))
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, sel, body]) => ({
    sel: sel.trim().replace(/\s+/g, ' '),
    body
  }))
  const bodyOf = (sel) => (rules.find((r) => r.sel === sel) || {}).body

  it('draws no box at all - that is the whole of what makes it quiet', () => {
    const base = bodyOf('.axi-action')
    expect(base, 'no .axi-action rule').toBeTruthy()
    expect(base).toMatch(/border:\s*0/)
    expect(base).toMatch(/background:\s*none/)
    expect(base).toMatch(/padding:\s*0/)
  })

  it('inherits its type, because it lands at 10px and at 14px', () => {
    expect(bodyOf('.axi-action')).toMatch(/font:\s*inherit/)
  })

  it('keeps a second hover signal, since the colour change is a fallback', () => {
    // An inked action's colour is held by the ink layer, which beats the
    // :where() hover by design - so a hover that offered only colour would
    // offer an inked action nothing.
    const hover = bodyOf('.axi-action:where(:hover)')
    expect(hover, 'no .axi-action hover rule').toBeTruthy()
    expect(hover).toMatch(/text-decoration:\s*underline/)
  })

  it('gives a glyph a hit target and takes back the underline it cannot use', () => {
    const glyph = bodyOf('.axi-action--glyph')
    expect(glyph, 'no glyph modifier').toBeTruthy()
    expect(glyph).toMatch(/min-width:/)
    expect(glyph).toMatch(/min-height:/)
    expect(bodyOf('.axi-action--glyph:where(:hover)')).toMatch(/text-decoration:\s*none/)
  })
})

describe('every interactive object says so when it is dead', () => {
  // Derived, not listed. The interactive surface is whatever declares
  // `cursor: pointer` plus the field class - so adding a new interactive
  // component upstream fails this guard until the component gets a disabled
  // state, and no hand-maintained list can rot out of step with the language.
  const all = COMPONENT_FILES().map(read).join('\n')
  const rules = [...stripComments(all).matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, sel, body]) => ({
    sel: sel.trim().replace(/\s+/g, ' '),
    body
  }))

  // A comma inside :is() is not a selector boundary, so the list is split at
  // depth zero only - splitting on every comma reported ":is(:disabled" and
  // "[aria-disabled=\"true\"])" as two selectors apiece.
  const splitTop = (list) => {
    const out = []
    let depth = 0
    let cur = ''
    for (const ch of list) {
      if (ch === '(') depth++
      else if (ch === ')') depth--
      if (ch === ',' && depth === 0) { out.push(cur); cur = '' } else cur += ch
    }
    if (cur.trim()) out.push(cur)
    return out.map((s) => s.trim())
  }

  // A comma inside :where() is not a selector boundary either. `.axi-tabs
  // :where(a, button)` split naively yielded ".axi-tabs :where(a" and
  // "button)", neither of which is a selector, and both of which then read as
  // interactive objects with no dead state.
  const POINTER = rules
    .filter((r) => /cursor:\s*pointer/.test(r.body))
    .flatMap((r) => splitTop(r.sel))
  // `.axi-input` is the twenty-fourth: a field is interactive without being a
  // pointer, and the textarea wears the same class.
  const INTERACTIVE = [...new Set([...POINTER, '.axi-input'])].sort()


  const disabledRule = rules.find((r) => /:is\(:disabled, \[aria-disabled="true"\]\)/.test(r.sel))
  const covered = splitTop(disabledRule ? disabledRule.sel : '')
    .map((s) => s.replace(/:is\(:disabled, \[aria-disabled="true"\]\)$/, ''))

  it('covers every selector that offers a pointer, and the field', () => {
    expect(disabledRule, 'no disabled-state rule at all').toBeTruthy()
    const missing = INTERACTIVE.filter((sel) => !covered.includes(sel))
    expect(missing, `interactive with no dead state: ${missing.join(', ')}`).toEqual([])
  })

  it('names nothing that is not interactive, so the list cannot drift wide', () => {
    const extra = covered.filter((sel) => !INTERACTIVE.includes(sel))
    expect(extra, `dead state on a non-interactive selector: ${extra.join(', ')}`).toEqual([])
  })

  it('fades the control instead of recolouring it, so an ink survives', () => {
    // A colour swap is the defect the ink layer exists to prevent: a disabled
    // .axi-action.axi-ink-danger must fade with its verdict, not lose it.
    expect(disabledRule.body).toMatch(/opacity:\s*\.5/)
    expect(disabledRule.body).toMatch(/cursor:\s*not-allowed/)
    expect(disabledRule.body).not.toMatch(/(^|[;{\s])(color|background|border|fill)[-a-z]*\s*:/i)
  })

  it('leaves pointer events alone, so a dead control can still be read', () => {
    expect(disabledRule.body).not.toMatch(/pointer-events/)
  })

  it('lives where a state can overrule a component without !important', () => {
    expect(read('utilities.css')).toMatch(/:is\(:disabled, \[aria-disabled="true"\]\)/)
    expect(ORDER[ORDER.length - 1]).toBe('utilities.css')
    expect(disabledRule.body).not.toMatch(/!important/)
  })
})

// "This one is picked" is one thing a surface says, and the language spells it
// with three attributes chosen by semantics - aria-current for a place,
// aria-pressed for a toggle, aria-selected for a listbox option - plus the
// label-wrapping-a-radio shape, where the input holds the state and the label
// has nothing to set. The consumer that motivated this rule had marked ten
// sites across six bases by appending a border utility, announcing selection
// to nobody. These are the facts that fix depends on.
describe('a picked surface says so on the surface and to the reader', () => {
  const css = COMPONENT_FILES().map(read).map(stripComments).join('\n')
  const rules = [...css.matchAll(/([^{}]*)\{([^}]*)\}/g)]
    .map(([, sel, body]) => ({ sel: sel.trim().replace(/\s+/g, ' '), body }))

  // The mark rule is the one that puts the accent on a card or panel edge for
  // a selection attribute. Found by shape, not by a hard-coded selector, so
  // reformatting it is allowed and splitting it is not.
  //
  // Judged per compound, never per selector list. base.css's reduced-motion
  // reset names `.axi-card:hover` and `.axi-pill[aria-pressed="true"]:hover`
  // in one list, so a whole-list scan sees a card AND a selection attribute
  // and reads that rule as the mark - which is how the first version of this
  // guard passed while asserting things about `transform: none !important`.
  const compounds = (sel) => {
    const out = []
    let cur = '', depth = 0
    for (const ch of sel) {
      if (ch === '(') depth++
      else if (ch === ')') depth--
      if (ch === ',' && depth === 0) { out.push(cur); cur = '' } else cur += ch
    }
    if (cur.trim()) out.push(cur)
    return out.map((s) => s.trim())
  }
  const isMark = (c) => /\.axi-(card|panel)\b/.test(c) && /aria-(current|pressed|selected)/.test(c)
  const marks = rules.filter(({ sel }) => compounds(sel).some(isMark))

  it('is a single rule, so the card and the panel cannot drift apart', () => {
    // Two rules that agree today are two rules that disagree after the next
    // edit - and a consumer marking one of them must not have to find out
    // which file its selected state was written in.
    expect(marks.length, `expected one mark rule, found ${marks.length}: ${marks.map((r) => r.sel).join(' | ')}`).toBe(1)
    expect(marks[0].sel).toMatch(/\.axi-card\b/)
    expect(marks[0].sel).toMatch(/\.axi-panel\b/)
  })

  it('takes every spelling of selection the language already uses', () => {
    // A fourth spelling invented here would be a fourth thing a reader has to
    // learn, and the three below are each already correct for their semantics.
    const sel = marks[0].sel
    for (const arm of ['[aria-current]', "[aria-pressed='true']", "[aria-selected='true']"]) {
      expect(sel.includes(arm), `mark rule does not cover ${arm}`).toBe(true)
    }
  })

  it('reads a checked radio as a mark, but only its own', () => {
    // <label class="axi-panel"><input type=radio> is the correct markup for a
    // picker of panels. The child combinator is the load-bearing half: a
    // descendant match would light a panel up for any checkbox in its content.
    expect(marks[0].sel).toMatch(/:has\(\s*>\s*input:checked\s*\)/)
  })

  it('lifts the surface with the shorthand, because two themes make it a gradient', () => {
    // Measured: --axi-surface-raised is `linear-gradient(...)` under both flat
    // and glass. The -paint companion is for colour-only properties, so using
    // it here would leave the picked surface unchanged under two of the three
    // themes - visible in neither, and only in the main theme at all.
    expect(marks[0].body).toMatch(/background:\s*var\(--axi-surface-raised\)/)
    expect(marks[0].body).not.toMatch(/-paint\)/)
  })

  it('puts the accent on the whole edge, and spends no fill on it', () => {
    // A rail item is a word and can be printed on the accent; a panel carries
    // content, which an accent fill drowns. The whole edge rather than the
    // leading one because a grid is read in two directions.
    expect(marks[0].body).toMatch(/border-color:\s*var\(--axi-accent\)/)
    expect(marks[0].body).not.toMatch(/background:\s*var\(--axi-accent\)/)
  })

  it('survives a hover, which is when a picked surface is most often looked at', () => {
    // The mark is a background and a border-colour; the lift is a transform and
    // a shadow. If a :hover on either base ever reaches for one of the mark's
    // two properties, pointing at the picked card would un-pick it on screen.
    const hovers = rules.filter(({ sel }) => compounds(sel).some((c) =>
      /\.axi-(card|panel)\b/.test(c) && /:hover/.test(c) && !/aria-/.test(c)))
    expect(hovers.length, 'no hover rules found at all - this guard has stopped guarding').toBeGreaterThan(0)
    for (const h of hovers) {
      expect(h.body, `${h.sel} overrides the mark`).not.toMatch(/(^|[;{\s])(background|border-color)\s*:/)
    }
  })
})

// A scrollbar down the side of a narrow strip is a channel, not information.
// The language had decided that once, inline on .axi-palette__list, and the
// argument written there was about a CATEGORY - a strip - while the selector
// named one member of it. Every other strip had nowhere to look, and the first
// consumer to need the same thing wrote the rule five more times in its own
// stylesheet, twice with a `*` descendant arm. These tests pin the remedy:
// one rule, every spelling in it, a class a consumer can spend, and no
// descendant reach.
describe('a strip scrolls quietly, and says so in one place', () => {
  const css = COMPONENT_FILES().map(read).map(stripComments).join('\n')
  const rules = [...css.matchAll(/([^{}]*)\{([^}]*)\}/g)]
    .map(([, sel, body]) => ({ sel: sel.trim().replace(/\s+/g, ' '), body }))

  const compounds = (sel) => {
    const out = []
    let cur = '', depth = 0
    for (const ch of sel) {
      if (ch === '(') depth++
      else if (ch === ')') depth--
      if (ch === ',' && depth === 0) { out.push(cur); cur = '' } else cur += ch
    }
    if (cur.trim()) out.push(cur)
    return out.map((s) => s.trim())
  }

  const hides = rules.filter(({ body }) => /scrollbar-width\s*:\s*none/.test(body))
  const zeroes = rules.filter(({ sel, body }) =>
    /::-webkit-scrollbar/.test(sel) && /width\s*:\s*0/.test(body))

  // The strips the language ships. A part added here without being added to
  // the rule fails the next test, which is the point: the list is the contract.
  const STRIPS = ['.axi-palette__list', '.axi-rail', '.axi-rail__nav', '.axi-split__nav']

  it('hides the bar in exactly one rule, not once per component', () => {
    // Two rules that agree today are two rules that disagree after the next
    // edit, and that is how one decision ends up with two spellings. The
    // palette used to hold its own copy; collapsing it into the shared rule is
    // what this test protects.
    expect(hides.map((r) => r.sel)).toHaveLength(1)
    expect(zeroes.map((r) => r.sel)).toHaveLength(1)
  })

  it('names the consumer class and every strip the language ships', () => {
    const say = compounds(hides[0].sel)
    const zero = compounds(zeroes[0].sel).map((c) => c.replace('::-webkit-scrollbar', ''))
    // The class is what a consumer spends on its own scroller. Without it the
    // decision is unreachable again and the next consumer writes it by hand.
    expect(say).toContain('.axi-scroll-quiet')
    expect(zero).toContain('.axi-scroll-quiet')
    for (const part of STRIPS) {
      expect(say, `${part} is not in the quiet-scroll rule`).toContain(part)
      expect(zero, `${part} has no ::-webkit-scrollbar arm`).toContain(part)
    }
    // Both arms cover the same set. A part in one and not the other is quiet in
    // Firefox and loud in Chromium, which is the bug this pairing exists for.
    expect(new Set(zero)).toEqual(new Set(say))
  })

  it('reaches no descendant, so a table in a rail keeps its bar', () => {
    // The consumer's `__sidebar *` arm is the sledgehammer a missing name
    // produces. .axi-table__scroll keeps a horizontal bar ON PURPOSE - there it
    // is the only thing saying a column is off-screen - so a descendant reach
    // here would take that away the moment a table landed in a strip.
    for (const c of [...compounds(hides[0].sel), ...compounds(zeroes[0].sel)]) {
      const target = c.replace('::-webkit-scrollbar', '')
      expect(target, `${c} reaches past the strip itself`).not.toMatch(/[\s>+~*]/)
    }
    expect(compounds(hides[0].sel)).not.toContain('.axi-table__scroll')
  })
})

// The split pane: a picker choosing what the surface beside it shows. Two
// objects on one plane, not two panels parted by a hairline. The consumer that
// derived this shape by hand is what these tests are measured against - it got
// the outline and left the block out, which fails rule 3 from the other side.
describe('a split pane is a recess beside a raised thing', () => {
  const layout = stripComments(read('layout.css'))
  const primitives = stripComments(read('primitives.css'))
  const rules = (css) => [...css.matchAll(/([^{}]*)\{([^}]*)\}/g)]
    .map(([, sel, body]) => ({ sel: sel.trim().replace(/\s+/g, ' '), body }))

  it("declares the picker slot as a well in the well's own rule", () => {
    // One rule, both spellings - the remedy docs/RULES.md prescribes for a
    // style two selectors have to agree about. Restating --axi-well-fill beside
    // .axi-split would be two rules that agree today.
    const well = rules(primitives).find(({ sel }) => /(^|,\s*)\.axi-well\s*$/.test(sel))
    expect(well, 'no rule whose last compound is .axi-well').toBeTruthy()
    expect(well.sel).toMatch(/\.axi-split__nav/)
  })

  it('gives the body track a zero floor, so a nowrap table cannot blow it out', () => {
    // `1fr` is `minmax(auto, 1fr)` and `auto` is a CONTENT floor. Every cell in
    // .axi-table is nowrap, so a table in a `1fr` track sizes to its content
    // and takes the pane's width with it.
    const split = rules(layout).find(({ sel }) => sel === '.axi-split')
    expect(split, 'no .axi-split rule').toBeTruthy()
    expect(split.body).toMatch(/grid-template-columns:[^;]*minmax\(\s*0\s*,\s*1fr\s*\)/)
    // The item's minimum is a different thing from the track's, and an ellipsis
    // inside the body is fighting the item's.
    const body = rules(layout).find(({ sel }) => sel === '.axi-split__body')
    expect(body.body).toMatch(/min-width:\s*0/)
  })

  it('outlines AND blocks the body, at the control step', () => {
    // Rule 3: every raised element is both. The consumer drew the outline and
    // no block - a boundary around content that was meant to be standing on the
    // surface behind it. Control weight rather than panel, because a split pane
    // lives inside a panel that has already paid a 6px block and rule 8's
    // counterpart settles what a second one nested in it reads as.
    const body = rules(layout).find(({ sel }) => sel === '.axi-split__body')
    expect(body.body).toMatch(/border:\s*var\(--axi-border-control\)/)
    expect(body.body).toMatch(/box-shadow:\s*var\(--axi-shadow-control\)/)
  })

  it('stacks under the one breakpoint, and the stacked arm actually wins', () => {
    // Specificity is equal, so order decides. Written below the base rule the
    // media query is live; written above it - which is where appending to the
    // file puts it, and where the first draft of this component put it - it
    // parses, passes every other check here, and does nothing. Measured in the
    // built sheet rather than in one source file, because that is the cascade a
    // consumer actually gets.
    const dist = stripComments(readFileSync(resolve('dist/axi.css'), 'utf8'))
    const base = dist.search(/\.axi-split\s*\{/)
    const stacked = dist.search(/@media[^{]*640px[\s\S]*?\.axi-split\s*\{/)
    expect(base, '.axi-split is not in the built sheet').toBeGreaterThan(-1)
    expect(stacked, 'no 640px arm for .axi-split').toBeGreaterThan(-1)
    expect(stacked, 'the stacked arm is declared before the base rule and loses')
      .toBeGreaterThan(base)
    // The picker keeps a cap once stacked: one that grows to twenty rows pushes
    // the result it picked off the screen.
    expect(dist).toMatch(/\.axi-split__nav\s*\{\s*max-height:\s*var\(--axi-split-nav-h/)
  })
})

// A strip with more tabs than room scrolls rather than losing them. The
// language believed that twice and could say it in neither place a consumer
// could reach: once behind .axi-mast, once at the 640px breakpoint. The fourth
// arrival of "A style only reachable through a layer will be re-invented".
describe('a tab strip that outgrows its room scrolls, and any strip can say so', () => {
  const shells = stripComments(read('shells.css'))
  const all = [...shells.matchAll(/([^{}]*)\{([^{}]*)\}/g)]
    .map(([, sel, body]) => ({ sel: sel.trim().replace(/\s+/g, ' '), body }))
  const rules = all.filter((r) => !r.sel.startsWith('@'))
  const decls = (body) => Object.fromEntries(
    body.split(';').map((d) => d.split(':')).filter((p) => p.length >= 2)
      .map(([k, ...v]) => [k.trim(), v.join(':').trim()]))

  const scrollRule = rules.find(({ sel }) => /\.axi-tabs--scroll/.test(sel))

  it('says it once, for the modifier and the masthead together', () => {
    // Two rules that agree today are two rules that disagree after the next
    // edit. The masthead's own statement - margin-left: auto - stays its own,
    // because where the strip sits in that row is not the scroll behaviour.
    expect(scrollRule, 'no .axi-tabs--scroll rule').toBeTruthy()
    expect(scrollRule.sel).toMatch(/\.axi-mast\s+\.axi-tabs/)
    expect(scrollRule.body).toMatch(/overflow-x:\s*auto/)
    expect(scrollRule.body).toMatch(/min-width:\s*0/)
    expect(scrollRule.body, 'the mast margin is not scroll behaviour')
      .not.toMatch(/margin-left/)
  })

  it('leaves the base strip alone, so no strip clips what it is not scrolling', () => {
    // `overflow-x: auto` computes `overflow-y` from `visible` to `auto`. Folded
    // into .axi-tabs, every strip would clip a focus ring, a badge hanging off
    // a tab, or a popover anchored to one - paid by every strip to fix the few
    // that are too long.
    const base = rules.find(({ sel }) => sel === '.axi-tabs')
    expect(base, 'no bare .axi-tabs rule').toBeTruthy()
    expect(base.body).not.toMatch(/overflow/)
  })

  it('keeps the 640px arm pinned to the modifier it cannot share a rule with', () => {
    // A media-query rule and an unconditional one are different rules by
    // construction, so the arm restates the declarations. It may not drift:
    // everything it says about scrolling must also be said by the modifier, at
    // the same value. `width` is the arm's own and is exempt - it is about a
    // phone's layout, not about scrolling.
    const media = shells.slice(shells.search(/@media[^{]*640px/))
    const arm = [...media.matchAll(/([^{}]*)\{([^{}]*)\}/g)]
      .map(([, sel, body]) => ({ sel: sel.trim().replace(/\s+/g, ' '), body }))
      .find(({ sel }) => sel === '.axi-tabs')
    expect(arm, 'no .axi-tabs arm at 640px').toBeTruthy()
    const shared = decls(scrollRule.body)
    for (const [prop, value] of Object.entries(decls(arm.body))) {
      if (prop === 'width') continue
      expect(shared, `the 640px arm declares ${prop}, which the modifier does not`)
        .toHaveProperty(prop)
      expect(shared[prop], `the 640px arm's ${prop} has drifted from the modifier`)
        .toBe(value)
    }
  })

  it('keeps its scrollbar, because nothing else says there are more tabs', () => {
    // The quiet-scroll rule is about a bar drawn DOWN the side of a narrow
    // strip, where the object's own edge is already a vertical line and a
    // count elsewhere already gives the number. A strip scrolling sideways has
    // no second signal - the same reason .axi-table__scroll keeps its bar.
    const css = COMPONENT_FILES().map(read).map(stripComments).join('\n')
    const quiet = [...css.matchAll(/([^{}]*)\{([^{}]*)\}/g)]
      .map(([, sel, body]) => ({ sel: sel.trim().replace(/\s+/g, ' '), body }))
      .find(({ body }) => /scrollbar-width\s*:\s*none/.test(body))
    expect(quiet.sel).not.toMatch(/\.axi-tabs/)
  })
})

// Icon over label, for a bar of equal actions on a phone. Four icon+label
// actions side by side want 387px of the 337px available at 393px wide, and
// every label is one unbreakable word - so flex-shrink has nothing to give and
// the last action runs off the screen.
describe('a stacked button can shrink, and so can its label', () => {
  const primitives = stripComments(read('primitives.css'))
  const rules = [...primitives.matchAll(/([^{}]*)\{([^{}]*)\}/g)]
    .map(([, sel, body]) => ({ sel: sel.trim().replace(/\s+/g, ' '), body }))

  it('stacks, and gives up its content-sized minimum', () => {
    const stack = rules.find(({ sel }) => sel === '.axi-btn--stack')
    expect(stack, 'no .axi-btn--stack rule').toBeTruthy()
    expect(stack.body).toMatch(/flex-direction:\s*column/)
    // A flex item's default min-width is its content, so without this the
    // button refuses to shrink below its own label however the row is told to
    // divide the space - which is half of the failure --stack exists for.
    expect(stack.body).toMatch(/min-width:\s*0/)
  })

  it('addresses its label without out-ranking the ink layer', () => {
    // The label is an element and not a named part: a stacked button has two
    // children and only one of them is words, so naming a part would make
    // every consumer add a class to say what the span already says. :where()
    // is what keeps that from costing specificity the ink layer is owed.
    const label = rules.find(({ sel }) => /^\.axi-btn--stack\s*>/.test(sel))
    expect(label, 'no rule for the stacked label').toBeTruthy()
    expect(label.sel).toMatch(/:where\(/)
    expect(label.body).toMatch(/text-overflow:\s*ellipsis/)
  })
})

// ---------------------------------------------------------------------------
// Rule 9's matrix bound. The ruling came first and these hold both halves of
// it: that the bands are an opaque derived ramp rather than a faded ink, and
// that the digit rule 9 demands is never washed away by a row state.
// ---------------------------------------------------------------------------
describe('a matrix draws its quantity in opaque steps, over a number', () => {
  const data = () => read('data.css')

  // Declaration body for one exact selector, from the source rather than the
  // bundle, so a failure points at a line someone can edit.
  const bodyOf = (css, selector) => {
    const hit = [...stripComments(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
      ([, sel]) => sel.trim().replace(/\s+/g, ' ') === selector,
    )
    return hit ? hit[2] : null
  }

  const STEPS = [
    ['1', 18, false],
    ['2', 42, false],
    ['3', 70, true],
    ['4', 100, true],
  ]

  it.each(STEPS)('band %s mixes the accent into the flat companion at %i%%', (step, pct) => {
    const body = bodyOf(data(), `.axi-table--matrix :is(td, tbody th)[data-heat='${step}']`)
    expect(body, `no rule for data-heat='${step}'`).not.toBeNull()
    // The companion and not --axi-surface. color-mix() takes colours only, a
    // surface token may hold a gradient, and an invalid color-mix() is dropped
    // silently - so getting this wrong does not fade the band, it deletes it.
    expect(body).toMatch(
      new RegExp(
        `background-color:\\s*color-mix\\(in srgb, var\\(--axi-accent\\) ${pct}%, var\\(--axi-surface-paint\\)\\)`,
      ),
    )
    expect(body).not.toMatch(/var\(--axi-surface\)/)
  })

  it('flips to the accent ink on the two loudest bands and no others', () => {
    for (const [step, , inked] of STEPS) {
      const body = bodyOf(data(), `.axi-table--matrix :is(td, tbody th)[data-heat='${step}']`)
      const hasInk = /color:\s*var\(--axi-accent-ink\)/.test(body)
      expect(hasInk, `data-heat='${step}' ink flip`).toBe(inked)
    }
  })

  it('never fades the accent with an alpha, on any band', () => {
    // Rule 2, and rule 9's own reason: the cells a reader scans for are the
    // quiet ones, which is exactly where an alpha ramp loses them. The
    // consumer this was lifted from had a continuous `rgba(accent, a)` ramp
    // AND this discrete one, fighting, with !important to settle it.
    // Comments are stripped, so the section header cannot be the end anchor -
    // the next component's own selector is.
    const matrix = stripComments(data()).match(/\.axi-table--matrix[\s\S]*?(?=\.axi-meter\s*\{)/)
    expect(matrix, 'the matrix block moved or was renamed').not.toBeNull()
    expect(matrix[0]).not.toMatch(/rgba?\(/)
    expect(matrix[0]).not.toMatch(/opacity\s*:/)
    expect(matrix[0]).not.toMatch(/!important/)
  })

  it('leaves a data cell its fill under hover and under selection', () => {
    // The band IS the value. A row state that filled over it would delete the
    // reading on the way past the row you wanted.
    const css = stripComments(data())
    const stateRules = [...css.matchAll(/([^{}]*(?::hover|\[aria-current\])[^{}]*)\{([^{}]*)\}/g)]
      .map(([, sel, body]) => ({ selector: sel.trim().replace(/\s+/g, ' '), body }))
      .filter(({ selector, body }) => /\.axi-table\b/.test(selector) && /background/.test(body))
    // Inert-guard: if the table's row states are renamed this must fail, not pass.
    expect(stateRules.length).toBeGreaterThan(0)
    for (const { selector } of stateRules) {
      expect(selector, `${selector} can still wash a data cell`).toMatch(/:not\(\[data-heat\]\)/)
    }
  })

  it('spends no specificity saying so', () => {
    // The `:not()` has to sit inside a `:where()`. Outside one it would add a
    // class-level weight to the hover rule, and the table's own comment
    // promises that an ink class in utilities.css - one class, later file -
    // out-ranks it. A guard, because the fix and the regression look identical
    // at a glance.
    const css = stripComments(data())
    for (const [, sel] of css.matchAll(/([^{}]+)\{[^{}]*\}/g)) {
      const selector = sel.trim().replace(/\s+/g, ' ')
      if (!selector.includes(':not([data-heat])')) continue
      // Every occurrence must be enclosed by a :where(...) group.
      const stripped = selector.replace(/:where\([^()]*(\([^()]*\)[^()]*)*\)/g, ' ')
      expect(stripped, `${selector} pays specificity for its exclusion`).not.toContain('data-heat')
    }
  })

  it('centres a matrix cell hard enough to beat the base table', () => {
    // `.axi-table td { text-align: right }` is (0,1,1) with no :where() around
    // its element, so a modifier written the obvious way - `.axi-table--matrix
    // :where(td)` at (0,1,0) - loses and the field silently stays a column of
    // right-aligned numbers. Measured in the BUILT sheet, because the cascade
    // is the one a consumer gets.
    const built = readFileSync(resolve(process.cwd(), 'dist/axi.css'), 'utf8')
    // One ARM of a selector list, not the list: specificity is a property of the
    // compound that matched, and weighing `.axi-table th, .axi-table td` whole
    // double-counts the class and makes the base look twice as strong as it is.
    // Split on TOP-LEVEL commas only. `:where(td, tbody th)` holds a comma that
    // is not a list separator, and splitting on it produces the fragment
    // `.axi-table--matrix :where(td` - whose unbalanced `:where(` then reads as
    // a class and scores the arm one weight too high, which is enough to hide
    // exactly the defect this check exists for.
    const arms = (list) => {
      const out = []
      let depth = 0
      let start = 0
      for (let i = 0; i < list.length; i += 1) {
        if (list[i] === '(') depth += 1
        else if (list[i] === ')') depth -= 1
        else if (list[i] === ',' && depth === 0) {
          out.push(list.slice(start, i).trim())
          start = i + 1
        }
      }
      out.push(list.slice(start).trim())
      return out
    }
    const arm = (list, forElement) =>
      arms(list).find((one) =>
        new RegExp(`(^|[\\s>+~(])${forElement}(?=$|[\\s>+~,):.[])`).test(one),
      )
    // `:is()` and `:not()` take their argument's weight; `:where()` takes none.
    // That difference is the whole subject of this check, so it is spelled out
    // rather than folded together.
    const weigh = (sel) => {
      const flat = sel.replace(/:where\([^()]*(\([^()]*\)[^()]*)*\)/g, ' ').replace(/:(?:is|not)\(/g, '(')
      const ids = (flat.match(/#[\w-]+/g) || []).length
      const classes = (flat.match(/\.[\w-]+|\[[^\]]+\]|:[\w-]+/g) || []).length
      const types = (flat.match(/(^|[\s>+~(,])[a-z][\w-]*/g) || []).length
      return ids * 10000 + classes * 100 + types
    }
    // Both selectors are READ from the sheet, not written here. A guard that
    // weighs its own string literal measures nothing: rewriting the modifier
    // with `:where()` - which is exactly the mistake - would leave this
    // passing.
    const selectorOf = (needle) => {
      const hit = [...built.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(([, sel]) =>
        sel.includes(needle),
      )
      return hit ? hit[1].trim().replace(/\s+/g, ' ') : null
    }
    const baseSel = selectorOf('.axi-table td')
    const modSel = [...built.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .map(([, sel, body]) => [sel.trim().replace(/\s+/g, ' '), body])
      .find(([sel, body]) => sel.startsWith('.axi-table--matrix') && /text-align:\s*center/.test(body) && !sel.includes('thead'))
    expect(baseSel, 'the base alignment rule moved').not.toBeNull()
    expect(modSel, 'the matrix cell rule no longer centres anything').toBeTruthy()
    const baseArm = arm(baseSel, 'td')
    const modArm = arm(modSel[0], 'td') || modSel[0]
    expect(baseArm, `no td arm in ${baseSel}`).toBeTruthy()
    expect(weigh(modArm), `${modArm} is weaker than ${baseArm}`).toBeGreaterThanOrEqual(weigh(baseArm))
    // And it is later in the sheet, which is what settles a tie.
    expect(built.indexOf(modSel[0])).toBeGreaterThan(built.indexOf(baseSel))
  })

  it('draws a ruler division only under --ruler, on the rule', () => {
    const css = stripComments(data())
    const tickRules = [...css.matchAll(/([^{}]*\[data-tick\][^{}]*)\{([^{}]*)\}/g)]
    expect(tickRules.length).toBe(1)
    const [, selector, body] = tickRules[0]
    // Under the modifier, so a matrix of categories does not get verticals it
    // has no ruler to justify.
    expect(selector).toContain('.axi-table--ruler')
    // The rule, at the hairline step: the same line that parts the rows,
    // continued down the field. A control-weight line here is rule 8's grid.
    expect(body).toMatch(/border-left:\s*var\(--axi-border-hairline\) solid var\(--axi-rule\)/)
  })

  it('rules a change of category in ink rather than in weight', () => {
    const body = bodyOf(data(), '.axi-table tbody tr[data-group-start] > :is(td, th)')
    expect(body, 'the group boundary moved or was renamed').not.toBeNull()
    // Hairline weight, ink colour. Going up a form step would put a
    // control-weight line inside running content.
    expect(body).toMatch(/border-top:\s*var\(--axi-border-hairline\) solid var\(--axi-ink-line\)/)
    expect(body).not.toMatch(/--axi-border-control/)
  })

  it('cannot exist without the ruling that allows it', () => {
    // The component is an exception to a written rule. If someone deletes the
    // exception from RULES.md the CSS is no longer justified by anything, and
    // this is the check that says so - checklist item 1, made mechanical.
    const rules = readFileSync(resolve(process.cwd(), 'docs/RULES.md'), 'utf8')
    const section = rules.match(/### The matrix is the bound on "not at all"[\s\S]*?(?=\n## )/)
    expect(section, 'rule 9 no longer bounds the matrix').not.toBeNull()
    // The bound itself, not just the heading: intensity is admissible only
    // because the cell prints its value.
    expect(section[0]).toMatch(/A matrix cell prints its value/)
    expect(section[0]).toMatch(/A matrix cell with no number in it is a heatmap/)
  })
})

describe('a readout is drawn in rules, and a tile reads its own density', () => {
  const data = () => read('data.css')
  const shells = () => read('shells.css')

  const bodyOf = (css, selector) => {
    const hit = [...stripComments(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
      ([, sel]) => sel.trim().replace(/\s+/g, ' ') === selector,
    )
    return hit ? hit[2] : null
  }
  // The fallback figure a declaration reads a knob at: `var(--x, 14px)` -> 14.
  const fallbackOf = (body, knob) => {
    const m = body && body.match(new RegExp(`var\\(${knob},\\s*([\\d.]+)px\\)`))
    return m ? Number(m[1]) : null
  }

  it('sets the gap under an eyebrow through a knob, not a figure', () => {
    const body = bodyOf(shells(), '.axi-eyebrow')
    expect(body).not.toBeNull()
    expect(fallbackOf(body, '--axi-eyebrow-gap')).toBe(14)
    // A margin written as a literal is an eyebrow that cannot stand in a row
    // without an inline style, which is what the sheet's head had been doing.
    expect(body).not.toMatch(/margin:\s*0 0 \d/)
  })

  // Both densities are read under ONE knob name at two fallbacks, which is how
  // .axi-panel--tile already reads --axi-panel-pad: a consumer setting the knob
  // wins in either context, and does not have to know which one it is in.
  it.each([
    ['the eyebrow', () => shells(), '.axi-eyebrow', '.axi-panel--tile .axi-eyebrow', '--axi-eyebrow-gap'],
    ['the readout row', () => data(), '.axi-readout__row', '.axi-panel--tile .axi-readout__row', '--axi-readout-pad'],
  ])('%s reads the same knob tighter inside a tile', (_, css, resting, tile, knob) => {
    const rest = fallbackOf(bodyOf(css(), resting), knob)
    const tight = fallbackOf(bodyOf(css(), tile), knob)
    expect(rest, `${resting} does not read ${knob}`).not.toBeNull()
    expect(tight, `${tile} does not read ${knob}`).not.toBeNull()
    expect(tight).toBeLessThan(rest)
  })

  it('parts the rows with the rule, at the hairline, and only between them', () => {
    const body = bodyOf(data(), '.axi-readout__row + .axi-readout__row')
    expect(body, 'the divider is no longer a sibling rule').not.toBeNull()
    expect(body).toMatch(/border-top:\s*var\(--axi-border-hairline\) solid var\(--axi-rule\)/)
    // The first row has no line above it: the panel's own edge is there.
    const first = bodyOf(data(), '.axi-readout__row')
    expect(first).not.toMatch(/border/)
  })

  it('raises nothing inside the panel: no outline, no block, no fill on any row', () => {
    const css = stripComments(data())
    const section = css.slice(css.indexOf('.axi-readout {'), css.indexOf('.axi-bars {'))
    expect(section.length).toBeGreaterThan(0)
    for (const rule of section.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const [, sel, body] = rule
      expect(body, sel.trim()).not.toMatch(/box-shadow|background|outline/)
      // Rule 8: never a control-weight line between rows of a reading.
      expect(body, sel.trim()).not.toMatch(/--axi-border-control|--axi-border-panel/)
    }
  })

  it('sets the value in tabular figures, ranged right', () => {
    const body = bodyOf(data(), '.axi-readout__v')
    expect(body).toMatch(/font-variant-numeric:\s*tabular-nums/)
    expect(body).toMatch(/text-align:\s*right/)
  })

  it('has no eyebrow in the gallery zeroing its margin inline now that the knob exists', () => {
    const dir = resolve(process.cwd(), 'docs/manifest')
    for (const file of readdirSync(dir)) {
      const text = readFileSync(resolve(dir, file), 'utf8')
      expect(text, file).not.toMatch(/class="axi-eyebrow"[^>]*style="[^"]*margin/)
    }
  })
})

describe('a hover reveals no control, and a legend key recedes rather than fades', () => {
  const data = () => read('data.css')
  const bodyOf = (css, selector) => {
    const hit = [...stripComments(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
      ([, sel]) => sel.trim().replace(/\s+/g, ' ') === selector,
    )
    return hit ? hit[2] : null
  }

  it('is written into rule 4', () => {
    const rules = readFileSync(resolve(process.cwd(), 'docs/RULES.md'), 'utf8')
    const section = rules.match(/### A hover reveals no control[\s\S]*?(?=\n## )/)
    expect(section, 'rule 4 no longer rules on hover reveals').not.toBeNull()
    expect(section[0]).toMatch(/never\s+its presence/)
    expect(section[0]).toMatch(/Receding is a step down the neutral ramp/)
  })

  it('has no hover anywhere in src/ that brings something into existence', () => {
    // A rule keyed on :hover may move, block, brighten or underline. It may not
    // set the three properties that make a thing exist or not.
    for (const name of COMPONENT_FILES()) {
      const css = stripComments(read(name))
      for (const [, sel, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        if (!/:hover/.test(sel)) continue
        expect(body, `${name}: ${sel.trim()}`).not.toMatch(/\b(opacity|display|visibility)\s*:/)
      }
    }
  })

  it('recedes an unpressed key to the faint step, not to an opacity', () => {
    const css = stripComments(data())
    const block = css.slice(css.indexOf('.axi-legend {'), css.indexOf('.axi-legend__key:where(button:hover)') + 200)
    expect(block).not.toMatch(/opacity/)
    const dim = bodyOf(data(), '.axi-legend:has([aria-pressed="true"]) .axi-legend__key:where(:not([aria-pressed="true"], :hover))')
    expect(dim, 'the receded rule moved or lost its hover escape').not.toBeNull()
    expect(dim).toMatch(/color:\s*var\(--axi-text-faint\)/)
    expect(bodyOf(data(), '.axi-legend__key[aria-pressed="true"]')).toMatch(/color:\s*var\(--axi-text\)/)
  })

  it('keys the state on aria-pressed alone, with no second attribute for the rest', () => {
    // Rule 13: the consumer says which key is pressed, and nothing else. If a
    // `data-dim` or similar appears here, the consumer has been handed a
    // derived state to keep in step.
    const css = stripComments(data())
    const block = css.slice(css.indexOf('.axi-legend {'), css.indexOf('.axi-bars {') > 0 ? css.length : css.length)
    const legendRules = [...block.matchAll(/([^{}]*axi-legend[^{}]*)\{/g)].map((m) => m[1])
    expect(legendRules.length).toBeGreaterThan(3)
    for (const sel of legendRules) expect(sel).not.toMatch(/\[data-/)
    expect(legendRules.some((s) => s.includes(':has([aria-pressed="true"])'))).toBe(true)
  })

  it('wraps the button reset and the hover so an inked key keeps its ink', () => {
    const css = stripComments(data())
    const keyRules = [...css.matchAll(/([^{}]*\.axi-legend__key[^{}]*)\{/g)].map((m) => m[1].trim())
    const reset = keyRules.find((s) => s.includes('button') && !s.includes('hover'))
    const hover = keyRules.find((s) => s.includes('hover') && !s.includes(':has'))
    expect(reset).toMatch(/^\.axi-legend__key:where\(button\)$/)
    expect(hover).toMatch(/^\.axi-legend__key:where\(button:hover\)$/)
  })
})

describe('a chart\'s furniture recedes, and a library chart is bound rather than shouted over', () => {
  const chartBlock = () => {
    const css = stripComments(read('data.css'))
    const i = css.indexOf('.axi-chart {')
    expect(i, 'the library-chart binding has left data.css').toBeGreaterThan(-1)
    return css.slice(i)
  }
  const rulesIn = (css) => [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, sel, body]) => ({ sel: sel.trim().replace(/\s+/g, ' '), body }))

  it('is written into rule 10', () => {
    const rules = readFileSync(resolve(process.cwd(), 'docs/RULES.md'), 'utf8')
    const section = rules.match(/### A chart's furniture recedes[\s\S]*?(?=\n## )/)
    expect(section, 'rule 10 no longer rules on furniture').not.toBeNull()
    expect(section[0]).toMatch(/a step below the rule/)
    expect(section[0]).toMatch(/One accent is spent inside a plot/)
    expect(section[0]).toMatch(/without `!important`/)
  })

  it('declares the gridline as a token derived from the rule, so a theme has nothing to restate', () => {
    const tokens = stripComments(read('tokens.css'))
    const decl = tokens.match(/--axi-grid:\s*([^;]+);/)
    expect(decl, '--axi-grid is not a token').not.toBeNull()
    expect(decl[1]).toMatch(/color-mix\(in srgb, var\(--axi-rule\) \d+%, transparent\)/)
    // Derived: no theme may pin it, or the grid stops following a relit rule.
    for (const name of ['glass', 'flat']) {
      const theme = readFileSync(resolve(process.cwd(), `themes/${name}.json`), 'utf8')
      expect(theme, `${name} restates --axi-grid`).not.toMatch(/--axi-grid"/)
    }
    const grid = rulesIn(chartBlock()).find((r) => r.sel === '.axi-chart .recharts-cartesian-grid line')
    expect(grid, 'the grid rule is gone').toBeDefined()
    expect(grid.body).toMatch(/stroke:\s*var\(--axi-grid\)/)
    expect(grid.body).toMatch(/stroke-dasharray:\s*none/)
  })

  it('shouts over nothing: no !important, and no rule for the library\'s own tooltip', () => {
    const block = chartBlock()
    expect(block).not.toMatch(/!important/)
    expect(block).not.toMatch(/recharts-default-tooltip|recharts-tooltip-wrapper/)
  })

  it('scopes every rule to .axi-chart and dashes nothing', () => {
    for (const { sel, body } of rulesIn(chartBlock())) {
      expect(sel.startsWith('.axi-chart'), `${sel} escapes the scope`).toBe(true)
      const dash = body.match(/stroke-dasharray:\s*([^;]+)/)
      if (dash) expect(dash[1].trim(), `${sel} dashes a line`).toBe('none')
    }
  })

  it('edges a point, a bar and a slice in ink and never sets their fill', () => {
    // Rule 10: the fill is which series it belongs to, and it is the consumer's.
    const marks = rulesIn(chartBlock()).filter((r) => /line-dot|scatter-symbol|pie-sector|bar-rectangle >|active-dot/.test(r.sel))
    expect(marks.length).toBeGreaterThan(1)
    for (const { sel, body } of marks) {
      expect(body, `${sel} paints a series`).not.toMatch(/(^|[^-])fill\s*:/)
      expect(body, `${sel} has no ink edge`).toMatch(/stroke:\s*var\(--axi-ink-line\)/)
    }
  })

  it('spends the accent once, on the brush travellers', () => {
    const accented = rulesIn(chartBlock()).filter((r) => /var\(--axi-accent\)/.test(r.body))
    expect(accented.map((r) => r.sel)).toEqual(['.axi-chart .recharts-brush-traveller > rect'])
  })

  it('fills the hover band and the brush slide with a paint companion, never a surface that may be a gradient', () => {
    for (const { sel, body } of rulesIn(chartBlock())) {
      const fill = body.match(/(^|[^-])fill:\s*var\((--axi-surface[a-z-]*)\)/)
      if (fill) expect(fill[2], `${sel} fills with ${fill[2]}`).toMatch(/-paint$/)
    }
  })
})

describe('the scrollbar is chrome drawn in the language, and a quiet strip still wins', () => {
  const base = () => stripComments(read('base.css'))
  const rulesIn = (css) => [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, sel, body]) => ({ sel: sel.trim().replace(/\s+/g, ' '), body }))

  it('draws the thumb in the rule ink, as a rectangle, with no channel colour named', () => {
    const thumb = rulesIn(base()).find((r) => r.sel === '::-webkit-scrollbar-thumb')
    expect(thumb, 'base.css no longer draws the thumb').toBeDefined()
    expect(thumb.body).toMatch(/background:\s*var\(--axi-rule\)/)
    expect(thumb.body).toMatch(/border-radius:\s*0/)
    const track = rulesIn(base()).find((r) => /::-webkit-scrollbar-track/.test(r.sel))
    expect(track.body).toMatch(/background:\s*transparent/)
    expect(base()).toMatch(/scrollbar-color:\s*var\(--axi-rule\) transparent/)
  })

  it('scopes the standard pair to engines without the pseudo-element, because Chromium cannot hold both', () => {
    // Chromium 121+ disables ::-webkit-scrollbar once scrollbar-color or
    // scrollbar-width is set, and its standard bar is the capsule with arrows
    // this language refuses. The pair is for Firefox; the pseudo-elements are
    // the design everywhere that reads them.
    const css = base()
    const scoped = css.match(/@supports not selector\(::-webkit-scrollbar\)\s*\{([\s\S]*?)\}\s*\}/)
    expect(scoped, 'the standard pair is not scoped').not.toBeNull()
    expect(scoped[1]).toMatch(/scrollbar-color:\s*var\(--axi-rule\) transparent/)
    expect(scoped[1]).toMatch(/scrollbar-width:\s*thin/)
    const outside = css.replace(scoped[0], '')
    expect(outside, 'a standard scrollbar property escaped the scope').not.toMatch(/scrollbar-(color|width)\s*:/)
  })

  it('carries no class, so the quiet-scroll rule outranks it wherever a strip asks for no bar', () => {
    for (const { sel } of rulesIn(base()).filter((r) => /scrollbar/.test(r.sel))) {
      expect(sel, `${sel} would out-rank .axi-scroll-quiet`).not.toMatch(/\./)
    }
    const quiet = rulesIn(stripComments(read('utilities.css'))).find((r) => r.sel.includes('.axi-scroll-quiet::-webkit-scrollbar'))
    expect(quiet, 'the quiet-scroll rule is gone').toBeDefined()
    expect(quiet.body).toMatch(/width:\s*0/)
  })
})

describe('a status cap is an attribute on the head of the thing it judges', () => {
  const prim = () => stripComments(read('primitives.css'))
  const rulesIn = (css) => [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, sel, body]) => ({ sel: sel.trim().replace(/\s+/g, ' '), body }))
  const caps = () => rulesIn(prim()).filter((r) => /\[data-status=/.test(r.sel))

  it('is rule 5 as written: the head, in the status ink, at the element\'s own weight', () => {
    const found = caps()
    expect(found).toHaveLength(4)
    for (const { sel, body } of found) {
      // Recolours the edge the element already has; adds no width, no bar, no
      // left stripe. A `border-top-width` here would be rule 5's third step.
      expect(body.trim(), sel).toMatch(/^border-top-color:\s*var\(--axi-(ok|warn|danger|meta)\);?$/)
      expect(sel).not.toMatch(/left/)
    }
  })

  it('reads the attribute on the three objects a reading lives in, and offers no accent value', () => {
    const sels = caps().map((r) => r.sel).join('\n')
    for (const status of ['ok', 'warn', 'danger', 'meta']) {
      expect(sels).toMatch(new RegExp(`\\.axi-panel\\[data-status="${status}"\\]`))
      expect(sels).toMatch(new RegExp(`\\.axi-stat\\[data-status="${status}"\\]`))
    }
    expect(sels).not.toMatch(/accent/)
    expect(caps().map((r) => r.body).join('')).not.toMatch(/--axi-accent/)
  })

  it('stands before the picked state, so the thing you picked still owns its whole outline', () => {
    const css = prim()
    expect(css.indexOf('[data-status="ok"]')).toBeLessThan(css.indexOf('[aria-current]'))
  })
})

// The split button's whole claim is that it reads as one control on all three
// surfaces, and the surfaces disagree about every number involved:
// --axi-border-control is 3px on axi and 1px on flat and glass,
// --axi-radius-sm is 0, 4px and 10px. So "joined" cannot be a value anyone
// tuned - it has to be the same expression as the border it is cancelling,
// and the corners have to be the surface's. The consumer that prompted this
// component had written a 1px seam and a 10px corner, which was right on
// exactly one of the three.
describe('the split button is joined by construction', () => {
  const prim = () => stripComments(read('primitives.css'))
  const rulesIn = (css) => [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, sel, body]) => ({ sel: sel.trim().replace(/\s+/g, ' '), body }))
  const split = () => rulesIn(prim()).filter((r) => /\.axi-btn-split/.test(r.sel))

  it('cancels exactly the border it shares, rather than spacing the halves apart', () => {
    const seam = split().find((r) => /\.axi-btn \+ \.axi-btn/.test(r.sel))
    expect(seam, 'no seam rule found').toBeDefined()
    // Negative, and equal to the border width on whatever surface is active:
    // the second half's border lands on its sibling's and the two become one
    // stroke. Any positive margin leaves two borders and a sliver of
    // background between them - 7px of edge on the default surface.
    expect(seam.body).toMatch(/margin-inline-start:\s*calc\(var\(--axi-border-control\) \* -1\)/)
    expect(split().map((r) => r.body).join('')).not.toMatch(/margin[^:]*:\s*\d/)
  })

  it('takes its outer corners from the surface and squares the inner ones', () => {
    const bodies = split().map((r) => r.body).join('')
    // Four logical corners, each set once, each from the token. The shorthand
    // is what made the hand-written version need a comment saying the rule
    // above it had already squared both right corners.
    for (const corner of ['start-start', 'end-start', 'start-end', 'end-end']) {
      expect(bodies, corner).toMatch(new RegExp(`border-${corner}-radius:\\s*var\\(--axi-radius-sm\\)`))
    }
    // The only whole-shorthand radius in the component is the square it
    // starts from; every other corner is named and tokenised above.
    const shorthands = [...bodies.matchAll(/(?<![-\w])border-radius:\s*([^;]+)/g)].map((m) => m[1].trim())
    expect(shorthands).toEqual(['0'])
  })

  it('moves the hover lift to the wrapper, so neither half can leave the other behind', () => {
    const wrapper = split().find((r) => r.sel === '.axi-btn-split:where(:hover)')
    const half = split().find((r) => r.sel === '.axi-btn-split > .axi-btn:where(:hover)')
    expect(wrapper.body).toMatch(/transform:\s*translate\(-2px, -2px\)/)
    expect(half.body).toMatch(/transform:\s*none/)
    // And it must stay below the button section it adjusts: these rules weigh
    // the same as .axi-btn--primary:hover and win on source order alone.
    const css = prim()
    expect(css.indexOf('.axi-btn--primary:hover')).toBeLessThan(css.indexOf('.axi-btn-split'))
  })
})
