export default [
  {
    id: 'page',
    name: 'Page',
    layer: 'layout',
    classes: ['.axi-page', '.axi-page--narrow', '.axi-page--wide'],
    summary: 'The centred column every view sits in, at one of three measures. The default suits a browsing view; the two modifiers exist because prose and dense catalogs genuinely disagree about width.',
    rules: [],
    knobs: ['--axi-page-pad'],
    notes: `Beyond \`--narrow\` a line of body text gets hard to track back to the
start of the next one, and \`--wide\` is for grids where width spent on
margins is a column not shown. Hard-coding either default made one of the two
wrong, which is why there are three.

The gutter is a knob because measures nest: a \`--narrow\` prose column inside
a page that has already paid the gutter would otherwise pay it twice, with no
way to say so but an inline \`padding-inline: 0\`. Set
\`--axi-page-pad: 0\` on the inner one.`,
    examples: [
      {
        title: 'A narrow column nested in a page',
        note: 'The inner measure sets --axi-page-pad: 0 so the gutter is paid once',
        html: `<div class="axi-page">
  <div class="axi-page axi-page--narrow" style="--axi-page-pad: 0">
    <div class="axi-panel">
      <p class="axi-eyebrow">Narrow measure</p>
      <p style="margin: 0; font: var(--axi-t-small); color: var(--axi-text-dim)">Reading width, inside a page that has already paid its gutter.</p>
    </div>
  </div>
</div>`,
      },
    ],
  },
  {
    id: 'grid',
    name: 'Grid',
    layer: 'layout',
    classes: ['.axi-grid'],
    summary: 'An auto-filling card grid whose minimum column width is per-instance, because a grid of ten app cards and a grid of sixty catalog entries are the same component with different minimums.',
    rules: [],
    knobs: ['--axi-grid-min'],
    notes: `\`repeat(auto-fill, minmax(var(--axi-grid-min, 300px), 1fr))\` and the
page gutter for its gap - the column count is a consequence of the measure
and the minimum, never a number a consumer types. Under 640px it collapses to
a single column. Anything this does not cover is plain CSS grid: a layout
system large enough to express any page is a framework.`,
    examples: [
      {
        title: 'A grid of stat tiles',
        note: 'A small minimum packs many columns; raise it for cards',
        html: `<div class="axi-grid" style="--axi-grid-min: 150px">
  <div class="axi-stat"><b class="axi-stat__n">47</b><span class="axi-stat__k">Fights</span></div>
  <div class="axi-stat"><b class="axi-stat__n">31</b><span class="axi-stat__k">Won</span></div>
  <div class="axi-stat"><b class="axi-stat__n">12</b><span class="axi-stat__k">Lost</span></div>
  <div class="axi-stat"><b class="axi-stat__n">4</b><span class="axi-stat__k">Re-parsed</span></div>
</div>`,
      },
    ],
  },
  {
    id: 'row',
    name: 'Row',
    layer: 'layout',
    classes: ['.axi-row'],
    summary: 'A horizontal run of controls or chips that wraps rather than overflowing, with a per-instance gap.',
    rules: [],
    knobs: ['--axi-row-gap'],
    notes: `Wrapping is the default and not an option, because the thing a row
holds is usually a variable number of chips and a narrow viewport is where
that number bites. Items are centred on the cross axis; a row of controls of
differing height needs \`align-items: stretch\` set on the instance.`,
    examples: [
      {
        title: 'A row of chips',
        html: `<div class="axi-row" style="--axi-row-gap: 7px">
  <span class="axi-chip axi-chip--ok">Stable</span>
  <span class="axi-chip">Desktop</span>
  <span class="axi-chip">Electron</span>
  <span class="axi-chip axi-chip--meta">arcdps</span>
</div>`,
      },
    ],
  },
  {
    id: 'stack',
    name: 'Stack',
    layer: 'layout',
    classes: ['.axi-stack'],
    summary: 'Vertical rhythm between siblings, set once on the parent instead of as a margin on every child.',
    rules: [],
    knobs: ['--axi-stack-gap'],
    notes: `The gap is a knob rather than a scale step because the two honest
spacings - a stack of controls and a stack of panels - differ by more than
one step, and a modifier class per spacing is how a layout helper turns into
a framework. Setting the gap on the container means the last child never
leaves a trailing margin behind.`,
    examples: [
      {
        title: 'Three demo rows in a stack',
        html: `<div class="axi-stack" style="--axi-stack-gap: 20px">
  <div class="axi-row"><a class="axi-btn axi-btn--primary" href="#">Primary</a><a class="axi-btn" href="#">Default</a></div>
  <div class="axi-row"><button class="axi-pill" aria-pressed="true" type="button">Pressed</button><button class="axi-pill" aria-pressed="false" type="button">Unpressed</button></div>
  <div class="axi-row"><span class="axi-chip axi-chip--ok">Stable</span><span class="axi-chip axi-chip--meta">Annotation</span></div>
</div>`,
      },
    ],
  },
  {
    id: 'panel',
    name: 'Panel',
    layer: 'layout',
    classes: ['.axi-panel'],
    summary: 'The raised surface every larger component is built on, and the canonical panel weight: a 4px ink outline and a hard 6px block.',
    rules: [3],
    knobs: ['--axi-panel-pad'],
    notes: `This is the component that defines rule 3's heavier step, and the one
to reach for when a consumer needs to raise an arbitrary block of content
into the language without waiting for us to ship a component for it. It owns
its padding so no consumer has to invent one; \`--axi-panel-pad\` tightens or
loosens a single instance without a modifier class.

A panel is the raised thing, which means what goes *inside* it usually is
not: a table, a meter and a plot all sit flat in a panel and carry no block
of their own.`,
    examples: [
      {
        title: 'Two panels, one tightened',
        note: 'Per-instance padding, no modifier class',
        html: `<div class="axi-row" style="--axi-row-gap: 12px; align-items: stretch">
  <div class="axi-panel" style="flex: 1 1 240px">
    <p class="axi-eyebrow">Panel — default padding</p>
    <p style="margin: 0; font: var(--axi-t-small); color: var(--axi-text-dim)">A panel owns its padding so no consumer has to invent one.</p>
  </div>
  <div class="axi-panel" style="flex: 1 1 240px; --axi-panel-pad: 13px">
    <p class="axi-eyebrow">Panel — tighter</p>
    <p style="margin: 0; font: var(--axi-t-small); color: var(--axi-text-dim)">Set --axi-panel-pad: 13px on the instance.</p>
  </div>
</div>`,
      },
    ],
  },
]
