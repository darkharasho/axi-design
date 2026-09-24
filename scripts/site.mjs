import { mkdirSync, writeFileSync, copyFileSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { entries } from '../docs/manifest/index.mjs'
import { componentPage, componentsIndex } from '../docs/site/render.mjs'
import { renderMarkdown } from '../docs/site/markdown.mjs'
import { page } from '../docs/site/shell.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// The titles behind the rule numbers a component cites, so a "Rules this
// answers" notice can name the rule rather than only number it. Read from
// RULES.md so a reworded rule reads correctly everywhere without a second edit.
function ruleTitles() {
  const md = readFileSync(resolve(ROOT, 'docs/RULES.md'), 'utf8')
  return new Map([...md.matchAll(/^## (\d+)\. (.+)$/gm)].map((m) => [Number(m[1]), m[2]]))
}

export function build(outDir) {
  const written = []
  const write = (rel, contents) => {
    const target = resolve(outDir, rel)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, contents)
    written.push(rel)
  }
  const copy = (from, rel) => {
    const target = resolve(outDir, rel)
    mkdirSync(dirname(target), { recursive: true })
    copyFileSync(resolve(ROOT, from), target)
    written.push(rel)
  }

  const titles = ruleTitles()
  for (const entry of entries()) {
    write(`components/${entry.id}/index.html`, componentPage(entry, titles))
  }
  write('components/index.html', componentsIndex())

  const guide = (rel, source, title, nav, opts = {}) => {
    const { html, toc } = renderMarkdown(readFileSync(resolve(ROOT, source), 'utf8'), opts)
    write(rel, page({
      title,
      nav,
      body: `<div class="axi-prose">${html}</div>`,
      toc: toc.map((h) => `<a href="#${h.id}">${h.text}</a>`).join(''),
    }))
  }

  guide('start/index.html', 'docs/pages/start.md', 'Start', 'start/')
  guide('theming/index.html', 'docs/pages/theming.md', 'Theming', 'theming/')
  guide('rules/index.html', 'docs/RULES.md', 'Rules', 'rules/', { stableRuleIds: true })

  copy('dist/axi.css', 'axi.css')
  copy('dist/accents.css', 'accents.css')
  copy('docs/site/docs.css', 'docs.css')
  copy('docs/site/accent.js', 'accent.js')
  copy('docs/site/copy.js', 'copy.js')
  copy('docs/site/search.js', 'search.js')

  return written
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = resolve(ROOT, '_site')
  const written = build(out)
  console.log(`built _site from ${entries().length} components (${written.length} files)`)
}
