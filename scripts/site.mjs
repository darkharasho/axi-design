import { mkdirSync, writeFileSync, copyFileSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { entries } from '../docs/manifest/index.mjs'
import { componentPage, componentsIndex } from '../docs/site/render.mjs'
import { renderMarkdown } from '../docs/site/markdown.mjs'
import { page, LAYER_NAMES } from '../docs/site/shell.mjs'
import { landing } from '../docs/site/landing.mjs'
import { llmsTxt } from '../docs/site/llms.mjs'

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

  // The guides open at `##` because their Markdown is also read as Markdown
  // (RULES.md ships in the package). The page title is therefore the shell's
  // job, not the source's: eyebrow + h1, exactly as componentPage() emits it,
  // so every page type on the site has one and only one h1. The h1 carries no
  // id, so it cannot collide with the stable rule-<n> anchors, and the toc is
  // built from the Markdown's h2s alone, so it cannot list the title twice.
  const guide = (rel, source, { title, nav, eyebrow, description, ...opts }) => {
    let { html, toc } = renderMarkdown(readFileSync(resolve(ROOT, source), 'utf8'), opts)
    // RULES.md opens with its own `# ...` because it is also read as Markdown
    // in the package; start.md and theming.md open at `##`. Either way the
    // page ends up with exactly one h1: a source h1 is lifted out of the prose
    // and re-emitted as the page title rather than sitting beside a second one.
    const own = html.match(/^\s*<h1>([\s\S]*?)<\/h1>\s*/)
    if (own) html = html.slice(own[0].length)
    write(rel, page({
      title,
      nav,
      description,
      body: `<p class="axi-eyebrow">${eyebrow}</p>
<h1 class="docs-title">${own ? own[1] : title}</h1>
<div class="axi-prose">${html}</div>`,
      toc: toc.map((h) => `<a href="#${h.id}">${h.text}</a>`).join(''),
    }))
  }

  guide('start/index.html', 'docs/pages/start.md', {
    title: 'Start',
    nav: 'start/',
    eyebrow: 'Guide',
    description: 'Install axi-design, link the one stylesheet, and assemble a first screen from primitives that already agree with each other.',
  })
  guide('theming/index.html', 'docs/pages/theming.md', {
    title: 'Theming',
    nav: 'theming/',
    eyebrow: 'Guide',
    description: 'How far you can move axi-design without writing new CSS: the tokens, the eleven accents, and the per-instance knobs each component exposes.',
  })
  guide('rules/index.html', 'docs/RULES.md', {
    title: 'Rules',
    nav: 'rules/',
    eyebrow: 'Reference',
    description: 'The written constraints every axi component obeys, and what each one buys you - the part of this language that is not a matter of taste.',
    stableRuleIds: true,
  })

  write('index.html', landing())
  write('gallery/index.html', page({
    title: 'Gallery',
    nav: 'gallery/',
    description: 'Every token, accent, primitive and shell rendered on one page - the whole language at a glance, in the arrangements it was designed for.',
    body: `<p class="axi-eyebrow">Reference</p>
<h1 class="docs-title">Gallery</h1>
${readFileSync(resolve(ROOT, 'docs/pages/gallery.html'), 'utf8')}`,
    scripts: ['gallery.js'],
  }))
  copy('gallery.js', 'gallery.js')

  copy('dist/axi.css', 'axi.css')
  copy('dist/accents.css', 'accents.css')
  copy('docs/site/docs.css', 'docs.css')
  copy('docs/site/accent.js', 'accent.js')
  copy('docs/site/copy.js', 'copy.js')
  copy('docs/site/search.js', 'search.js')

  // Six fields, not the five the brief's search client shows: layerName is
  // the projected display name, since search.js is a browser module and
  // cannot import LAYER_NAMES from shell.mjs (which reads process.env at
  // load) - every other surface on the site shows "Data", never "data".
  write('search.json', JSON.stringify(entries().map(({ id, name, layer, summary, classes }) =>
    ({ id, name, layer, layerName: LAYER_NAMES[layer], summary, classes }))))
  write('llms.txt', llmsTxt())

  return written
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = resolve(ROOT, '_site')
  const written = build(out)
  console.log(`built _site from ${entries().length} components (${written.length} files)`)
}
