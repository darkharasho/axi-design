import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { byLayer } from '../manifest/index.mjs'
import { knobsFor } from '../manifest/knobs.mjs'
import { buildKnobTable } from '../../scripts/build.mjs'
import { url, LAYER_NAMES, VERSION } from './shell.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

const DESCRIPTION = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8')).description

// Only the numbered clauses are rules; RULES.md also carries a Tokens, Light
// mode, accents and "Adding a component" section under the same `##` level,
// none of which belongs in a rule list.
function rules() {
  const md = readFileSync(resolve(ROOT, 'docs/RULES.md'), 'utf8')
  return [...md.matchAll(/^## (\d+)\. (.+)$/gm)].map((m) => `${m[1]}. ${m[2]}`)
}

function component(entry) {
  const lines = [
    `### ${entry.name}`,
    `id: ${entry.id}`,
    `layer: ${LAYER_NAMES[entry.layer]}`,
    `url: ${url(`components/${entry.id}/`)}`,
    `summary: ${entry.summary}`,
    `classes: ${entry.classes.join(', ')}`,
  ]
  const knobs = knobsFor(entry.knobs)
  if (knobs.length) {
    lines.push('knobs:')
    for (const k of knobs) lines.push(`  ${k.name} - ${k.sets}, fallback ${k.fallback.replace(/`/g, '')}`)
  }
  for (const ex of entry.examples) {
    lines.push(`example: ${ex.title}`)
    lines.push(ex.html)
  }
  return lines.join('\n')
}

// Written for the reader that wants the whole reference in one shot: no
// navigation, no repetition, everything on the page - every component, every
// class, every knob and its fallback, every example verbatim.
export function llmsTxt() {
  const parts = [
    `# axi-design v${VERSION}`,
    '',
    DESCRIPTION,
    '',
    'Install:',
    'npm install @axiapps/axi-design',
    "import '@axiapps/axi-design/axi.css'",
    '',
    '## Rules',
    ...rules(),
  ]

  for (const { layer, items } of byLayer()) {
    parts.push('', `## ${LAYER_NAMES[layer]}`)
    for (const entry of items) parts.push('', component(entry))
  }

  parts.push('', '## Knobs', buildKnobTable())

  return `${parts.join('\n')}\n`
}
