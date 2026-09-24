// The per-instance knob surface: custom properties the components read with a
// fallback, so a consumer can set one on a single element or any ancestor.
// Not theme tokens - setting most of these in :root is legal and meaningless,
// because they answer "how wide is *this* grid", not "what does the system
// look like". This file is the source of truth: the README table is generated
// from it, and each component page shows the subset its entry cites.
export const KNOBS = [
  {
    name: '--axi-pill-fill',
    sets: 'the fill a pressed `.axi-pill` takes',
    fallback: '`var(--axi-accent)`',
    example: '<button class="axi-pill" aria-pressed="true" style="--axi-pill-fill: var(--axi-danger)">',
  },
  {
    name: '--axi-switch-fill',
    sets: 'the fill an on `.axi-switch` takes',
    fallback: '`var(--axi-accent)`',
    example: '<button class="axi-switch" aria-checked="true" style="--axi-switch-fill: var(--axi-danger)">',
  },
  {
    name: '--axi-switch-w',
    sets: "a `.axi-switch`'s track width",
    fallback: '`46px`',
    example: '<button class="axi-switch" style="--axi-switch-w: 32px">',
  },
  {
    name: '--axi-switch-h',
    sets: "a `.axi-switch`'s track height",
    fallback: '`26px`',
    example: '<button class="axi-switch" style="--axi-switch-h: 18px">',
  },
  {
    name: '--axi-switch-knob',
    sets: "a `.axi-switch`'s slug (knob) size",
    fallback: '`16px`',
    example: '<button class="axi-switch" style="--axi-switch-knob: 11px">',
  },
  {
    name: '--axi-card-strip',
    sets: "the colour of `.axi-card--strip`'s top strip",
    fallback: '`var(--axi-accent)`',
    example: '<a class="axi-card axi-card--strip" style="--axi-card-strip: var(--axi-ok)">',
  },
  {
    name: '--axi-grid-min',
    sets: 'minimum column width in `.axi-grid`',
    fallback: '`300px`',
    example: '<div class="axi-grid" style="--axi-grid-min: 240px">',
  },
  {
    name: '--axi-row-gap',
    sets: 'gap between `.axi-row` children',
    fallback: '`10px`',
    example: '<div class="axi-row" style="--axi-row-gap: 6px">',
  },
  {
    name: '--axi-stack-gap',
    sets: 'gap between `.axi-stack` children',
    fallback: '`12px`',
    example: '<div class="axi-stack" style="--axi-stack-gap: 20px">',
  },
  {
    name: '--axi-panel-pad',
    sets: "`.axi-panel`'s own padding",
    fallback: '`26px`',
    example: '<div class="axi-panel" style="--axi-panel-pad: 14px">',
  },
  {
    name: '--axi-page-pad',
    sets: "`.axi-page`'s horizontal gutter",
    fallback: '`var(--axi-gutter)`',
    example: '<div class="axi-page axi-page--narrow" style="--axi-page-pad: 0">',
  },
  {
    name: '--axi-menu-width',
    sets: 'width of `.axi-menu__pop`',
    fallback: '`310px`',
    example: '<div class="axi-menu__pop" style="--axi-menu-width: 380px">',
  },
  {
    name: '--axi-drawer-width',
    sets: 'width of `.axi-drawer` (capped at `100vw`)',
    fallback: '`560px`',
    example: '<aside class="axi-drawer" style="--axi-drawer-width: 720px">',
  },
  {
    name: '--axi-series',
    sets: 'the ink a meter fill, bar, plot line or `.axi-diamond--series` is drawn in',
    fallback: '`var(--axi-accent)`',
    example: '<span class="axi-meter__fill" style="--axi-series: var(--axi-ok)">',
  },
  {
    name: '--axi-meter-v',
    sets: 'how full one `.axi-meter__fill` is',
    fallback: '`0%`',
    example: '<span class="axi-meter__fill" style="--axi-meter-v: 62%">',
  },
  {
    name: '--axi-meter-h',
    sets: 'height of a `.axi-meter`',
    fallback: '`12px`',
    example: '<div class="axi-meter" style="--axi-meter-h: 18px">',
  },
  {
    name: '--axi-meter-label',
    sets: 'the label column width of `.axi-meter-list`',
    fallback: '`132px`',
    example: '<div class="axi-meter-list" style="--axi-meter-label: 180px">',
  },
  {
    name: '--axi-meter-value',
    sets: 'the value column width of `.axi-meter-list`',
    fallback: '`62px`',
    example: '<div class="axi-meter-list" style="--axi-meter-value: 80px">',
  },
  {
    name: '--axi-bar-v',
    sets: 'height of one `.axi-bars__col`',
    fallback: '`0%`',
    example: '<div class="axi-bars__col" style="--axi-bar-v: 78%">',
  },
  {
    name: '--axi-bar-part',
    sets: 'height of one `.axi-bars__part` within its column',
    fallback: '`0%`',
    example: '<span class="axi-bars__part" style="--axi-bar-part: 40%">',
  },
  {
    name: '--axi-bars-gap',
    sets: 'gap between columns in `.axi-bars`',
    fallback: '`6px`',
    example: '<div class="axi-bars" style="--axi-bars-gap: 2px">',
  },
  {
    name: '--axi-plot-h',
    sets: 'height of a `.axi-plot` or `.axi-bars`',
    fallback: '`180px`',
    example: '<div class="axi-plot" style="--axi-plot-h: 240px">',
  },
  {
    name: '--axi-plot-rows',
    sets: 'how many horizontal rules a `.axi-plot` draws',
    fallback: '`4`',
    example: '<div class="axi-plot" style="--axi-plot-rows: 6">',
  },
  {
    name: '--axi-tick-w',
    sets: 'the width of one `.axi-ticks__tick`',
    fallback: '`5px`',
    example: '<div class="axi-ticks" style="--axi-tick-w: 7px">',
  },
  {
    name: '--axi-tick-h',
    sets: 'the height of an `.axi-ticks` strip, and so of every mark in it',
    fallback: '`15px`',
    example: '<div class="axi-ticks" style="--axi-tick-h: 22px">',
  },
  {
    name: '--axi-ticks-gap',
    sets: 'the gap between marks in `.axi-ticks`',
    fallback: '`3px`',
    example: '<div class="axi-ticks" style="--axi-ticks-gap: 2px">',
  },
]

export function knobsFor(names) {
  const wanted = new Set(names)
  return KNOBS.filter((k) => wanted.has(k.name))
}
