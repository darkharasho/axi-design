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
    name: '--axi-check-size',
    sets: 'the size of an `.axi-check` or `.axi-radio` box',
    fallback: '`22px`',
    example: '<input type="checkbox" class="axi-check" style="--axi-check-size: 16px">',
  },
  {
    name: '--axi-check-fill',
    sets: 'the fill a checked `.axi-check` takes, and the colour of a checked `.axi-radio`\'s diamond',
    fallback: '`var(--axi-accent)`',
    example: '<input type="checkbox" class="axi-check" style="--axi-check-fill: var(--axi-danger)">',
  },
  {
    name: '--axi-textarea-h',
    sets: 'the minimum height of a `<textarea class="axi-input">`',
    fallback: '`90px`',
    example: '<textarea class="axi-input" style="--axi-textarea-h: 200px">',
  },
  {
    name: '--axi-btn-pad',
    sets: 'the padding inside an `.axi-btn`. The three named steps set it for you; reach for the knob only for a size they do not cover',
    fallback: '`12px 20px`',
    example: '<button class="axi-btn" style="--axi-btn-pad: 3px 7px">',
  },
  {
    name: '--axi-btn-size',
    sets: "an `.axi-btn`'s text size, which travels with its padding",
    fallback: '`13px`',
    example: '<button class="axi-btn" style="--axi-btn-size: 10px">',
  },
  {
    name: '--axi-pill-pad',
    sets: 'the padding inside an `.axi-pill`. The same scale and the same two named steps as the button, because a pill is a button that holds a state',
    fallback: '`12px 20px`',
    example: '<button class="axi-pill" style="--axi-pill-pad: 3px 7px">',
  },
  {
    name: '--axi-pill-size',
    sets: "an `.axi-pill`'s text size, which travels with its padding",
    fallback: '`13px`',
    example: '<button class="axi-pill" style="--axi-pill-size: 10px">',
  },
  {
    name: '--axi-input-pad',
    sets: 'the padding inside an `.axi-input`, for a field that is furniture in a header rather than a control on a page',
    fallback: '`11px 12px`',
    example: '<input class="axi-input" style="--axi-input-pad: 7px 12px">',
  },
  {
    name: '--axi-input-size',
    sets: "an `.axi-input`'s text size, which travels with its padding",
    fallback: '`14px`',
    example: '<input class="axi-input" style="--axi-input-size: 13px">',
  },
  {
    name: '--axi-action-hit',
    sets: "the hit target of an `.axi-action--glyph`, whose label is one character and gives the pointer nothing to land on",
    fallback: '`24px`',
    example: '<button class="axi-action axi-action--glyph" style="--axi-action-hit: 32px">',
  },
  {
    name: '--axi-well-pad',
    sets: 'the padding inside an `.axi-well`',
    fallback: '`10px`',
    example: '<div class="axi-well" style="--axi-well-pad: 18px">',
  },
  {
    name: '--axi-well-radius',
    sets: "an `.axi-well`'s corner radius, for a well used at reading scale rather than page scale",
    fallback: '`var(--axi-radius)`',
    example: '<div class="axi-well" style="--axi-well-radius: var(--axi-radius-sm)">',
  },
  {
    name: '--axi-rail-w',
    sets: "an `.axi-rail`'s width, for labels longer than the default holds",
    fallback: '`208px`',
    example: '<aside class="axi-rail" style="--axi-rail-w: 260px">',
  },
  {
    name: '--axi-rail-pad',
    sets: 'the padding inside an `.axi-rail`',
    fallback: '`10px`',
    example: '<aside class="axi-rail" style="--axi-rail-pad: 6px">',
  },
  {
    name: '--axi-toolbar-pad',
    sets: 'the padding inside an `.axi-toolbar`',
    fallback: '`14px`',
    example: '<div class="axi-toolbar" style="--axi-toolbar-pad: 4px 7px">',
  },
  {
    name: '--axi-dock-pad',
    sets: 'the padding inside an `.axi-dock`',
    fallback: '`12px 16px`',
    example: '<div class="axi-dock" style="--axi-dock-pad: 6px 10px">',
  },
  {
    name: '--axi-avatar-size',
    sets: 'the size of an `.axi-avatar` square',
    fallback: '`40px`',
    example: '<span class="axi-avatar" style="--axi-avatar-size: 28px">MS</span>',
  },
  {
    name: '--axi-modal-width',
    sets: 'the maximum width of an `.axi-modal`, before the viewport clamp',
    fallback: '`560px`',
    example: '<dialog class="axi-modal" style="--axi-modal-width: 760px">',
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
    name: '--axi-palette-w',
    sets: "the widest an `.axi-palette__panel` gets (it fills the room below that)",
    fallback: '`560px`',
    example: '<div class="axi-palette__panel" style="--axi-palette-w: 720px">',
  },
  {
    name: '--axi-palette-top',
    sets: 'how far down the screen an `.axi-palette` opens',
    fallback: '`12vh`',
    example: '<div class="axi-scrim axi-palette" style="--axi-palette-top: 6vh">',
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
    name: '--axi-sheet-top',
    sets: "where an `.axi-sheet`'s top edge sits, for an app whose own chrome starts above it",
    fallback: '`0`',
    example: '<div class="axi-sheet" style="--axi-sheet-top: 2.5rem">',
  },
  {
    name: '--axi-sheet-pad',
    sets: 'the padding inside an `.axi-sheet`',
    fallback: '`12px 16px`',
    example: '<div class="axi-sheet" style="--axi-sheet-pad: 0">',
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
  {
    name: '--axi-spinner-size',
    sets: 'the size of an `.axi-spinner`',
    fallback: '`20px`',
    example: '<span class="axi-spinner" style="--axi-spinner-size: 34px"></span>',
  },
  {
    name: '--axi-icon-size',
    sets: "an `.axi-icon`'s box, both dimensions",
    fallback: '`1.25em`',
    example: '<svg class="axi-icon" style="--axi-icon-size: 2rem"><use href="#axi-search"/></svg>',
  },
]

export function knobsFor(names) {
  const wanted = new Set(names)
  return KNOBS.filter((k) => wanted.has(k.name))
}
