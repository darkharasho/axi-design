import { readFileSync, readdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

export function sources() {
  return readdirSync(resolve(ROOT, 'src'))
    .filter((name) => name.endsWith('.css') && !name.startsWith('.'))
    .sort()
    .map((name) => readFileSync(resolve(ROOT, 'src', name), 'utf8'))
    .join('\n')
}

// Every class the stylesheet DEFINES, which means every class appearing in
// selector text. Splitting on braces alternates between selector text and
// declaration lists; a declaration list is told apart by containing a
// semicolon, which selector text never does. That leaves one theoretical
// false positive - a single unterminated declaration whose value contains the
// literal text `.axi-` - and the failure mode is a loud one (the coverage
// test demands a page for a class that does not exist), not a silent miss.
export function definedClasses(css = sources()) {
  const found = new Set()
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '')
  for (const chunk of stripped.split(/[{}]/)) {
    if (chunk.includes(';')) continue
    for (const match of chunk.matchAll(/\.(axi-[a-z0-9_-]+)/g)) found.add(`.${match[1]}`)
  }
  return [...found].sort()
}

// A per-instance knob is, precisely, a custom property the components read
// with a fallback: the fallback is what lets a consumer leave it unset, and
// leaving it unset is what makes it a knob rather than a theme token.
export function fallbackKnobs(css = sources()) {
  const found = new Set()
  for (const match of css.matchAll(/var\(\s*(--axi-[a-z0-9-]+)\s*,/g)) found.add(match[1])
  return [...found].sort()
}

export function ruleNumbers() {
  const md = readFileSync(resolve(ROOT, 'docs/RULES.md'), 'utf8')
  return [...md.matchAll(/^## (\d+)\. /gm)].map((match) => Number(match[1]))
}
