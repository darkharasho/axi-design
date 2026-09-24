import { page, url } from './shell.mjs'
import { codeBlock } from './render.mjs'

// The front door has about six seconds and one job: show, not tell. Real
// components first, the install second, two ways onward third.
function hero() {
  return `<div class="axi-panel docs-hero">
  <a class="axi-card axi-card--strip" href="${url('components/card/')}" style="--axi-card-strip: var(--axi-ok)">
    <div class="axi-card__head">
      <span class="axi-card__glyph">OM</span>
      <span class="axi-card__title">
        <span class="axi-card__name">AxiOM</span>
        <span class="axi-card__kind">Launcher</span>
      </span>
    </div>
    <p>One launcher for every Axi app. Installs, updates and launches the whole suite.</p>
    <div class="axi-row" style="--axi-row-gap: 6px">
      <span class="axi-chip axi-chip--ok">Stable</span>
      <span class="axi-chip">Desktop</span>
    </div>
    <div class="axi-card__meta">Electron <span class="axi-card__go">Docs &rarr;</span></div>
  </a>

  <div class="axi-meter-list">
    <span class="axi-meter-list__name">Scourge</span>
    <div class="axi-meter"><span class="axi-meter__fill" style="--axi-meter-v: 100%"></span></div>
    <span class="axi-meter-list__value">1.4M</span>

    <span class="axi-meter-list__name">Spellbreaker</span>
    <div class="axi-meter"><span class="axi-meter__fill" style="--axi-meter-v: 63%; --axi-series: var(--axi-text-faint)"></span></div>
    <span class="axi-meter-list__value">884k</span>

    <span class="axi-meter-list__name">Firebrand</span>
    <div class="axi-meter"><span class="axi-meter__fill" style="--axi-meter-v: 41%; --axi-series: var(--axi-text-faint)"></span></div>
    <span class="axi-meter-list__value">571k</span>
  </div>

  <div class="axi-row">
    <span class="axi-chip">Neutral</span>
    <span class="axi-chip axi-chip--accent">Accent</span>
    <span class="axi-chip axi-chip--ok">Stable</span>
    <span class="axi-chip axi-chip--warn">Beta</span>
    <span class="axi-chip axi-chip--danger">Deprecated</span>
  </div>

  <div class="axi-stat axi-stat--ok"><b class="axi-stat__n">38</b><span class="axi-stat__k">Components</span></div>
</div>`
}

const INSTALL = `npm install @axiapps/axi-design
import '@axiapps/axi-design/axi.css'
<link rel="stylesheet" href="https://darkharasho.github.io/axi-design/v1/axi.css">`

export function landing() {
  const body = `${hero()}
<h1 class="docs-title">Flat and outlined, dark, drawn in saturated ink.</h1>
${codeBlock(INSTALL, 'code-install')}
<div class="axi-row">
  <a class="axi-btn axi-btn--primary" href="${url('start/')}">Start</a>
  <a class="axi-btn" href="${url('components/')}">Components</a>
</div>
<p class="docs-lede">One design language for the whole axi suite: eleven accents over a fixed
dark ground, and a small, closed set of primitives instead of an escape hatch for every app that wants
one. What is and is not allowed is not a matter of taste - it is written down, in <a href="${url('rules/')}">the rules</a>.</p>`

  return page({ title: 'axi-design', nav: '', body })
}
