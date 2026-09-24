import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { byLayer } from '../manifest/index.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

export const VERSION = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8')).version
export const ACCENTS = JSON.parse(readFileSync(resolve(ROOT, 'accents.json'), 'utf8'))

// The site is served from /axi-design/ on Pages and from / by `npm run serve`.
// Every link in every emitted page goes through url(); a hand-written absolute
// href works in exactly one of those two places and fails silently in the
// other, which is why tests/site.test.mjs scans the output for one.
export const BASE = process.env.AXI_BASE ?? '/axi-design/'

export function url(path = '') {
  return `${BASE}/${String(path).replace(/^\/+/, '')}`.replace(/\/{2,}/g, '/')
}

export const LAYER_NAMES = {
  primitives: 'Primitives',
  layout: 'Layout',
  shells: 'Shells',
  data: 'Data',
  prose: 'Prose',
  utilities: 'Utilities',
}

const NAV = [
  ['start/', 'Start'],
  ['rules/', 'Rules'],
  ['theming/', 'Theming'],
  ['components/', 'Components'],
  ['gallery/', 'Gallery'],
]

export function sidebar(currentId) {
  return byLayer().map(({ layer, items }) => {
    const links = items.map((e) => {
      const current = e.id === currentId ? ' aria-current="page"' : ''
      return `<a href="${url(`components/${e.id}/`)}"${current}>${e.name}</a>`
    }).join('\n      ')
    return `    <h3 data-layer="${layer}">${LAYER_NAMES[layer]}</h3>\n      ${links}`
  }).join('\n')
}

function accentSelect() {
  const options = ACCENTS.map((a) => `<option value="${a.id}">${a.label}</option>`).join('')
  return `<label class="axi-sr-only" for="accent">Accent colour</label>
    <select class="axi-select" id="accent">${options}</select>`
}

export function page({ title, nav, body, toc = '', sidebar: side = '', description = '' }) {
  const tabs = NAV.map(([href, label]) => {
    const current = href === `${nav}/` || href === nav ? ' aria-current="page"' : ''
    return `<a href="${url(href)}"${current}>${label}</a>`
  }).join('')

  const columns = [side && `<aside class="docs-side">\n${side}\n  </aside>`, `<main>${body}</main>`,
    toc && `<nav class="docs-toc"><h3>On this page</h3>${toc}</nav>`].filter(Boolean).join('\n  ')

  const shellClass = ['docs-shell', side ? '' : 'docs-shell--plain', toc ? '' : 'docs-shell--notoc']
    .filter(Boolean).join(' ')

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · axi-design</title>
${description ? `<meta name="description" content="${description}">` : ''}
<link rel="stylesheet" href="${url('axi.css')}">
<link rel="stylesheet" href="${url('accents.css')}">
<link rel="stylesheet" href="${url('docs.css')}">
</head>
<body>
<header class="axi-mast"><div class="axi-mast__in">
  <a class="axi-brand" href="${url()}">
    <span class="axi-sigil" aria-hidden="true">A</span>
    <span class="axi-brand__name">axi-design<small>v${VERSION}</small></span>
  </a>
  <nav class="axi-tabs">${tabs}</nav>
  <div class="docs-search">
    <div class="axi-search"><span class="axi-search__icon" aria-hidden="true">&#8981;</span>
      <input class="axi-input" id="q" type="search" placeholder="Search components&#8230;" autocomplete="off"></div>
    <div class="docs-results" id="results" hidden></div>
  </div>
  ${accentSelect()}
</div></header>
<div class="${shellClass}">
  ${columns}
</div>
<script type="module" src="${url('accent.js')}"></script>
<script type="module" src="${url('copy.js')}"></script>
<script type="module" src="${url('search.js')}"></script>
</body>
</html>
`
}
