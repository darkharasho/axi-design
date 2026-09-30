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
    classes: ['.axi-panel', '.axi-panel--float', '.axi-panel--tile'],
    summary: 'The raised surface every larger component is built on, and the canonical panel weight: a 4px ink outline and a hard 6px block.',
    rules: [3, 13],
    knobs: ['--axi-panel-pad'],
    notes: `This is the component that defines rule 3's heavier step, and the one
to reach for when a consumer needs to raise an arbitrary block of content
into the language without waiting for us to ship a component for it. It owns
its padding so no consumer has to invent one; \`--axi-panel-pad\` tightens or
loosens a single instance without a modifier class.

A panel is the raised thing, which means what goes *inside* it usually is
not: a table, a meter and a plot all sit flat in a panel and carry no block
of their own.

\`--float\` is for a panel over moving content rather than one in the page - a
readout pinned to a chart, a popover over a scrolling table. Under a theme
like glass \`--axi-surface\` is a translucent tint, which reads as a pane only
while what is behind it holds still; the moment the content scrolls it shows
through. \`--axi-surface-float\` is the surface for that case, and
\`.axi-rail--float\` says the same thing about the other surface that needs
it.

\`--tile\` is for a panel standing in a grid of its own kind rather than alone
in the page. It drops the border, the block and the corner one step, to the
control weight, so a row of six does not read as six page regions arguing with the
page that holds them - and because the ramp has two steps, a plain
\`.axi-panel\` among tiles outranks them. That is how a grid of readings says
"this one is first" without a hue: the accent is not available for it anyway,
since gold means the thing *you* picked and nobody picks a winner. A tile that
is also a button or a link lifts under the press with no extra class, keyed
off the element.

A panel in a set where one is chosen says so by its own state, not by a
modifier: \`[aria-current]\`, \`[aria-pressed="true"]\`, \`[aria-selected="true"]\`,
or a checked radio it directly contains. The surface rises to
\`--axi-surface-raised\` and the accent moves to the edge - not an accent fill,
which is right for a rail item (a word can be printed on the accent) and wrong
for a panel (content cannot). \`.axi-card\` takes the same state from the same
rule, so it does not matter which of the two you are marking.

Which attribute is not a style choice - each is already correct for one
semantics, and the state you set is the one a screen reader reads. The failure
this replaces is a consumer that appended an accent-border utility at ten
sites: it looked picked and announced nothing.`,
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
      {
        title: 'Floating',
        note: 'Switch to the glass theme to see the difference: the default panel goes translucent, the floating one stays a surface',
        html: `<div class="axi-row" style="--axi-row-gap: 12px; align-items: stretch">
  <div class="axi-panel" style="flex: 1 1 240px; --axi-panel-pad: 13px">
    <p class="axi-eyebrow">Panel — in the page</p>
    <p style="margin: 0; font: var(--axi-t-small); color: var(--axi-text-dim)">Content behind it holds still, so a tint is fine.</p>
  </div>
  <div class="axi-panel axi-panel--float" style="flex: 1 1 240px; --axi-panel-pad: 13px">
    <p class="axi-eyebrow">Panel — floating</p>
    <p style="margin: 0; font: var(--axi-t-small); color: var(--axi-text-dim)">Content scrolls behind it, so the surface has to be opaque.</p>
  </div>
</div>`,
      },
      {
        title: 'A picker of panels, one of them chosen',
        note: 'The state is on the markup, not in a class: a label wrapping its own radio. Tab into it and use the arrow keys — the mark follows the radio, because the radio is what holds it',
        html: `<div class="axi-row" style="--axi-row-gap: 12px; align-items: stretch" role="radiogroup" aria-label="Surface treatment">
  <label class="axi-panel axi-panel--tile" style="flex: 1 1 200px; cursor: pointer">
    <input type="radio" name="axi-demo-surface" class="axi-sr-only" checked>
    <p class="axi-eyebrow">The language</p>
    <p style="margin: 0; font: var(--axi-t-small); color: var(--axi-text-dim)">Opaque surfaces, square corners.</p>
  </label>
  <label class="axi-panel axi-panel--tile" style="flex: 1 1 200px; cursor: pointer">
    <input type="radio" name="axi-demo-surface" class="axi-sr-only">
    <p class="axi-eyebrow">Flat</p>
    <p style="margin: 0; font: var(--axi-t-small); color: var(--axi-text-dim)">No blocks, hairline rules.</p>
  </label>
  <label class="axi-panel axi-panel--tile" style="flex: 1 1 200px; cursor: pointer">
    <input type="radio" name="axi-demo-surface" class="axi-sr-only">
    <p class="axi-eyebrow">Glass</p>
    <p style="margin: 0; font: var(--axi-t-small); color: var(--axi-text-dim)">Translucent, blurred, rounded.</p>
  </label>
</div>`,
      },
      {
        title: 'A grid of tiles, one of them first',
        note: 'Rank said with the form ramp: the winner is a plain panel among tiles, no colour spent',
        html: `<div class="axi-row" style="--axi-row-gap: 12px; align-items: stretch">
  <div class="axi-panel" style="flex: 1 1 150px; --axi-panel-pad: 12px">
    <p class="axi-eyebrow">First</p>
    <p class="axi-ink-plain" style="margin: 0; font: var(--axi-t-h3)">1,284</p>
  </div>
  <div class="axi-panel axi-panel--tile" style="flex: 1 1 150px">
    <p class="axi-eyebrow">Second</p>
    <p class="axi-ink-dim" style="margin: 0; font: var(--axi-t-h3)">1,102</p>
  </div>
  <div class="axi-panel axi-panel--tile" style="flex: 1 1 150px">
    <p class="axi-eyebrow">Third</p>
    <p class="axi-ink-dim" style="margin: 0; font: var(--axi-t-h3)">998</p>
  </div>
</div>`,
      },
    ],
  },
  {
    id: 'well',
    name: 'Well',
    layer: 'layout',
    classes: ['.axi-well', '.axi-well--sm'],
    summary: "The panel's inverse: a field sunk into the surface around it rather than raised off it. Ground fill, the internal rule for an edge, and no block.",
    rules: [3],
    knobs: ['--axi-well-pad', '--axi-well-radius'],
    notes: `Rule 3 gives the language two steps up off the page. This is the step
*down*, and it exists because every consumer that needed one reached for a
second \`.axi-panel\` inside the first - two identical fills parted by a line,
which reads as one field with a stray rule through it rather than as two
objects.

Both of a well's departures from a panel follow from the same fact. Its edge is
\`--axi-rule\` and not \`--axi-ink-line\`, because ink only reads against a fill
lighter than itself and a well is at ground level - an ink outline round one is
a black line on a black field. And it carries no block, because a recess casts
nothing.

Its fill is \`--axi-well-fill\`, which defaults to the ground. That default is a
subtraction rather than a colour: a hole in an opaque panel really does show
the page, but an opaque page colour inside a *translucent* pane is a black
patch rather than a recess, so a glass theme restates it as a darkening at
alpha and lets the pane's own tint carry through.

Reach for a well wherever the content standing in it brings its own edges: a
picker list beside a table, a column of cards, a trough a meter fills.

A well is the one form here used at two scales - a field the size of a page
column, and a recess the size of a single reading - and \`--sm\` is the second
one. At reading scale the panel radius is the wrong one; it is the radius
everything else that small already declines. The modifier sets that and nothing
else, because the two scales differ in their corner and in nothing else: a small
well still holds objects carrying their own padding, so \`--axi-well-pad\` is
still how you say anything about its inside.`,
    examples: [
      {
        title: 'The two scales, side by side',
        note: 'The page-column well takes the panel radius; the reading-scale one declines it',
        html: `<div class="axi-row" style="--axi-row-gap: 12px; align-items: stretch">
  <div class="axi-well" style="flex: 1">
    <p class="axi-eyebrow">Page scale</p>
  </div>
  <div class="axi-well axi-well--sm" style="flex: 1">
    <p class="axi-eyebrow">Reading scale</p>
  </div>
</div>`,
      },
      {
        title: 'A well inside a panel',
        note: 'The picker is sunk, the cards in it are raised',
        html: `<div class="axi-panel">
  <p class="axi-eyebrow">Sections</p>
  <div class="axi-well">
    <div class="axi-stack" style="--axi-stack-gap: 8px">
      <div class="axi-card"><p class="axi-card__title">Offense</p></div>
      <div class="axi-card"><p class="axi-card__title">Defense</p></div>
    </div>
  </div>
</div>`,
      },
    ],
  },
  {
    id: 'split',
    name: 'Split pane',
    layer: 'layout',
    classes: ['.axi-split', '.axi-split__nav', '.axi-split__body'],
    summary: 'A picker choosing what the surface beside it shows. Two objects on one plane — the list is sunk into the panel, the thing it picked stands out of it — rather than two panels parted by a hairline.',
    rules: [3, 8],
    knobs: ['--axi-split-nav-w', '--axi-split-gap', '--axi-split-nav-h'],
    notes: `The nav slot **is** a well, declared in the same rule as
\`.axi-well\` in \`src/primitives.css\` rather than left to the consumer to
remember a second class. The well's own comment already named this case — "a
picker list beside a table" is the first of the three things it says to reach
for — and a slot that is a well by convention is a slot a consumer can forget.

The body carries the **control** step, not the panel's. A split pane lives
inside a panel that has already paid a 6px block, and rule 8's counterpart
settles what a second one nested in it reads as: two planes arguing. The
consumer that derived this shape by hand got the outline and left the block out
entirely, which fails rule 3 from the other side — a boundary drawn around
content that is meant to be standing on the surface behind it. The radius
follows the form step rather than the footprint, which is the same way
\`.axi-panel--tile\` settled it.

\`minmax(0, 1fr)\` for the body track, not \`1fr\`. \`1fr\` is
\`minmax(auto, 1fr)\` and \`auto\` is a content floor: every cell in
\`.axi-table\` is \`nowrap\`, so a table in a \`1fr\` track sizes to its
content and takes the pane's width with it. The body element repeats
\`min-width: 0\` for itself, because the track's minimum and the item's
minimum are two different things and an ellipsis inside the body is fighting
the second one.

No breakpoint of its own. Under 640px — layout.css's one breakpoint, and
deliberately still its only one — the picker becomes the row above the thing it
picks and keeps a height cap, because a picker that grows to twenty rows pushes
the result you picked off the screen. A pane narrow enough to want a second
breakpoint is one \`.axi-table--fixed\` was written for; it makes a 360px pane
work.

The nav's scrollbar is hidden by the language's quiet-scroll rule, not by
anything here — see **Quiet scroll** in the utilities layer.`,
    examples: [
      {
        title: 'A picker beside a table',
        note: 'The list is recessed, the table stands on the panel at control weight',
        html: `<div class="axi-panel">
  <p class="axi-eyebrow">Damage by skill</p>
  <div class="axi-split" style="height: 240px">
    <div class="axi-split__nav">
      <div class="axi-rail__nav axi-rail__nav--quiet">
        <button class="axi-rail__item" aria-current="true">Meteor Shower</button>
        <button class="axi-rail__item">Lava Font</button>
        <button class="axi-rail__item">Flame Burst</button>
        <button class="axi-rail__item">Glyph of Storms</button>
      </div>
    </div>
    <div class="axi-split__body">
      <table class="axi-table axi-table--fixed" style="width: 100%">
        <colgroup><col style="width: 55%"><col style="width: 45%"></colgroup>
        <thead><tr><th>Player</th><th>Damage</th></tr></thead>
        <tbody>
          <tr><td>Aera</td><td>184,204</td></tr>
          <tr><td>Bram</td><td>151,880</td></tr>
          <tr><td>Cade</td><td>98,415</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div>`,
      },
      {
        title: 'A wider picker',
        note: '--axi-split-nav-w is the one number a consumer sets',
        html: `<div class="axi-split" style="--axi-split-nav-w: 180px; height: 120px">
  <div class="axi-split__nav">
    <div class="axi-rail__nav axi-rail__nav--quiet">
      <button class="axi-rail__item" aria-current="true">Boons</button>
      <button class="axi-rail__item">Conditions</button>
    </div>
  </div>
  <div class="axi-split__body" style="padding: 14px">
    <p class="axi-eyebrow">Boons</p>
    <p style="margin: 0; font: var(--axi-t-small); color: var(--axi-text-dim)">The body is a surface; what goes in it is the consumer's.</p>
  </div>
</div>`,
      },
    ],
  },
]
