export default [
  {
    id: 'stat',
    name: 'Stat',
    layer: 'data',
    classes: [
      '.axi-stat',
      '.axi-stat__k',
      '.axi-stat__n',
      '.axi-stat--accent',
      '.axi-stat--meta',
      '.axi-stat--ok',
      '.axi-stat--warn',
      '.axi-stat--danger',
    ],
    summary: 'A single number and its label, flat inside a panel. The number stays in the plain text ink unless it carries a real state.',
    rules: [5],
    knobs: [],
    notes: `A tile takes an ink only when its number has a state, exactly as a chip
does under rule 5 - colour used for emphasis rather than status is the
mistake this component exists to prevent. \`--meta\` is the one modifier that
annotates rather than asserts: a count of something known *about* the data,
not measured from it.`,
    examples: [
      {
        title: 'A row of stat tiles',
        note: 'Only tiles with a real state take an ink',
        html: `<div class="axi-grid" style="--axi-grid-min: 150px;">
  <div class="axi-stat"><b class="axi-stat__n">47</b><span class="axi-stat__k">Fights</span></div>
  <div class="axi-stat axi-stat--ok"><b class="axi-stat__n">31</b><span class="axi-stat__k">Won</span></div>
  <div class="axi-stat axi-stat--danger"><b class="axi-stat__n">12</b><span class="axi-stat__k">Lost</span></div>
  <div class="axi-stat axi-stat--meta"><b class="axi-stat__n">4</b><span class="axi-stat__k">Needs re-parse</span></div>
</div>`,
      },
    ],
  },
  {
    id: 'table',
    name: 'Table',
    layer: 'data',
    classes: [
      '.axi-table',
      '.axi-table__num',
      '.axi-table__rank',
      '.axi-table__rank--top',
      '.axi-table__who',
    ],
    summary: 'A ranked list of rows inside a panel. Rows are separated by rules rather than outlined or blocked, because the panel is the raised thing and the table is its interior.',
    rules: [8],
    knobs: [],
    notes: `Numbers are set right-aligned and names left-aligned on the element
itself, not left to every consumer to remember. \`.axi-table__rank--top\` is
the only fill a table ever gets, and only for a real podium position - a row
number stays outlined.`,
    examples: [
      {
        title: 'A ranked table',
        note: 'The top rank is filled; the rest are outlined',
        html: `<div class="axi-panel" style="--axi-panel-pad: 18px;">
  <p class="axi-eyebrow">Top damage — 47 fights</p>
  <table class="axi-table">
    <thead>
      <tr><th>Player</th><th>Damage</th><th>Down contrib.</th><th>Share</th></tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="axi-table__who"><span class="axi-table__rank axi-table__rank--top">1</span> Skoll.4183</span></td>
        <td class="axi-table__num">412,908</td><td>38</td><td>9.1%</td>
      </tr>
      <tr>
        <td><span class="axi-table__who"><span class="axi-table__rank">2</span> Renna.9021</span></td>
        <td class="axi-table__num">377,140</td><td>31</td><td>8.3%</td>
      </tr>
      <tr>
        <td><span class="axi-table__who"><span class="axi-table__rank">3</span> Oakvale.5567</span></td>
        <td class="axi-table__num">344,602</td><td>29</td><td>7.6%</td>
      </tr>
    </tbody>
  </table>
</div>`,
      },
    ],
  },
  {
    id: 'meter',
    name: 'Meter',
    layer: 'data',
    classes: ['.axi-meter', '.axi-meter__fill', '.axi-meter-list', '.axi-meter-list__name', '.axi-meter-list__value'],
    summary: 'A horizontal bar showing one value against its full extent. Drawn in the series ink, filled to a hard edge.',
    rules: [2, 9],
    knobs: ['--axi-meter-v', '--axi-meter-h', '--axi-series', '--axi-meter-label', '--axi-meter-value'],
    aliases: ['progress', 'progressbar', 'bar'],
    notes: `A meter says *how much*, and a quantity in this language is drawn as
length. Reach for \`--axi-series\` to change which ink a bar is drawn in; never
fade the accent to make a bar quieter.`,
    examples: [
      {
        title: 'A single meter',
        note: 'Fullness comes from --axi-meter-v',
        html: `<div class="axi-meter"><span class="axi-meter__fill" style="--axi-meter-v: 62%"></span></div>`,
      },
      {
        title: 'A ranked list',
        note: 'Leader in accent, the rest in a faint neutral',
        html: `<div class="axi-meter-list">
  <span class="axi-meter-list__name">Scourge</span>
  <div class="axi-meter"><span class="axi-meter__fill" style="--axi-meter-v: 100%"></span></div>
  <span class="axi-meter-list__value">1.4M</span>
  <span class="axi-meter-list__name">Spellbreaker</span>
  <div class="axi-meter"><span class="axi-meter__fill" style="--axi-meter-v: 63%; --axi-series: var(--axi-text-faint)"></span></div>
  <span class="axi-meter-list__value">884k</span>
</div>`,
      },
    ],
  },
  {
    id: 'bars',
    name: 'Bars',
    layer: 'data',
    classes: ['.axi-bars', '.axi-bars__col', '.axi-bars__part'],
    summary: 'A column chart with a hard baseline. Each column can hold a single fill or several stacked parts, both drawn at full ink strength.',
    rules: [9, 10],
    knobs: ['--axi-plot-h', '--axi-bars-gap', '--axi-bar-v', '--axi-bar-part', '--axi-series'],
    notes: `The baseline is drawn at the control weight because it is structure,
not data. Stacked parts are laid out bottom-to-top in source order, so the
markup reads the way the chart does. The series being read is the accent;
the ones it is read against are the neutral ramp, per rule 10.`,
    examples: [
      {
        title: 'Stacked columns with an axis and legend',
        note: 'Squad downs in the accent, enemy downs in the danger ink',
        html: `<div class="axi-bars" style="--axi-plot-h: 150px; --axi-bars-gap: 5px;">
  <div class="axi-bars__col" style="--axi-bar-v: 44%"><span class="axi-bars__part" style="--axi-bar-part: 62%; --axi-series: var(--axi-ok)"></span><span class="axi-bars__part" style="--axi-bar-part: 38%; --axi-series: var(--axi-danger)"></span></div>
  <div class="axi-bars__col" style="--axi-bar-v: 72%"><span class="axi-bars__part" style="--axi-bar-part: 70%; --axi-series: var(--axi-ok)"></span><span class="axi-bars__part" style="--axi-bar-part: 30%; --axi-series: var(--axi-danger)"></span></div>
  <div class="axi-bars__col" style="--axi-bar-v: 31%"><span class="axi-bars__part" style="--axi-bar-part: 30%; --axi-series: var(--axi-ok)"></span><span class="axi-bars__part" style="--axi-bar-part: 70%; --axi-series: var(--axi-danger)"></span></div>
  <div class="axi-bars__col" style="--axi-bar-v: 88%"><span class="axi-bars__part" style="--axi-bar-part: 76%; --axi-series: var(--axi-ok)"></span><span class="axi-bars__part" style="--axi-bar-part: 24%; --axi-series: var(--axi-danger)"></span></div>
</div>
<div class="axi-axis"><span>20:04</span><span>21:47</span></div>
<div class="axi-legend" style="margin-top: 12px;">
  <span class="axi-legend__key"><i class="axi-diamond axi-diamond--ok"></i> Enemy downed</span>
  <span class="axi-legend__key"><i class="axi-diamond axi-diamond--danger"></i> Squad downed</span>
</div>`,
      },
    ],
  },
  {
    id: 'plot',
    name: 'Plot',
    layer: 'data',
    classes: ['.axi-plot', '.axi-plot__svg', '.axi-plot__area', '.axi-plot__line'],
    summary: 'A framed line chart, its horizontal gridlines drawn as hard stops in a repeating gradient. The geometry is the consumer\'s; the ink and weight are the language\'s.',
    rules: [1, 10],
    knobs: ['--axi-plot-h', '--axi-plot-rows', '--axi-series'],
    notes: `The repeating gradient behind the gridlines is a shape, not a
transition, so it does not break rule 1. There is no y-axis component - a
chart's scale belongs in the label above it, in words.`,
    examples: [
      {
        title: 'A line plot with two series',
        note: 'The faint line is comparison; the accent line is what is being read',
        html: `<div class="axi-plot" style="--axi-plot-h: 170px; --axi-plot-rows: 4;">
  <svg class="axi-plot__svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    <polyline class="axi-plot__line" style="--axi-series: var(--axi-text-faint)" points="0,96 8,90 16,88 24,70 32,76 40,62 48,74 56,58 64,72 72,66 80,80 88,74 96,86 100,90"></polyline>
    <polyline class="axi-plot__line" points="0,92 8,78 16,84 24,46 32,52 40,28 48,36 56,20 64,44 72,30 80,58 88,40 96,66 100,70"></polyline>
  </svg>
</div>
<div class="axi-axis"><span>Fight start</span><span>+4:12</span></div>
<div class="axi-legend" style="margin-top: 12px;">
  <span class="axi-legend__key"><i class="axi-diamond axi-diamond--series"></i> Squad</span>
  <span class="axi-legend__key"><i class="axi-diamond axi-diamond--series" style="--axi-series: var(--axi-text-faint)"></i> Enemy</span>
</div>`,
      },
    ],
  },
  {
    id: 'axis',
    name: 'Axis',
    layer: 'data',
    classes: ['.axi-axis'],
    summary: 'Labels under a chart, spread edge to edge. There is no y-axis component - a chart\'s scale is written in words above it, not read off a ruled edge.',
    rules: [2],
    knobs: [],
    notes: `Set in the faint text ink at the micro size, so it reads as
structure rather than as data itself - the same restraint rule 2 asks of
every neutral surface.`,
    examples: [
      {
        title: 'An axis under a chart',
        html: `<div class="axi-axis"><span>Fight start</span><span>+4:12</span></div>`,
      },
    ],
  },
  {
    id: 'legend',
    name: 'Legend',
    layer: 'data',
    classes: ['.axi-legend', '.axi-legend__key'],
    summary: 'A row of keys pairing a diamond swatch with a label, identifying the series drawn in a chart.',
    rules: [5, 7],
    knobs: [],
    notes: `Each key reuses \`.axi-diamond\`, the family motif rule 7 asks every
identifying mark to share - a legend is not a place to invent a second shape
for the same idea. The swatch's ink is a state or a series, never decoration,
per rule 5.`,
    examples: [
      {
        title: 'A legend of two series',
        html: `<div class="axi-legend">
  <span class="axi-legend__key"><i class="axi-diamond axi-diamond--ok"></i> Enemy downed</span>
  <span class="axi-legend__key"><i class="axi-diamond axi-diamond--danger"></i> Squad downed</span>
</div>`,
      },
    ],
  },
  {
    id: 'ticks',
    name: 'Tick strip',
    layer: 'data',
    classes: ['.axi-ticks', '.axi-ticks__tick', '.axi-ticks__tick--on'],
    summary: 'A run of yes/no facts drawn as marks of one size, differing only in ink - the shape rule 9 asks for when a series has no magnitude to draw.',
    rules: [9, 10],
    knobs: ['--axi-tick-w', '--axi-tick-h', '--axi-ticks-gap', '--axi-series'],
    notes: `Rule 9 names this component by hand: attended or missed, passed or
failed, is a sequence of facts, and a fact has no magnitude. Drawing "no" as a
short bar says "a little bit" exactly as loudly as a faded fill says "30%", so
every mark is the same size and only the ink moves.

Marks are a fixed width and never flex. A run of fourteen and a run of three
can share a table column, and the short one has to read as a short run rather
than as fourteen fatter events - which is what a flexing strip would turn it
into. An on mark takes \`--axi-series\` per rule 10, so a second strip compared
against the first costs no new colour.

Do not reach for this to draw a quantity: a strip drawn large enough to outline
is a bar chart, and \`.axi-bars\` already is one.`,
    examples: [
      {
        title: 'A run of fourteen days',
        note: 'Same size throughout; only the ink says yes',
        html: `<div class="axi-ticks">
  <span class="axi-ticks__tick axi-ticks__tick--on"></span>
  <span class="axi-ticks__tick axi-ticks__tick--on"></span>
  <span class="axi-ticks__tick"></span>
  <span class="axi-ticks__tick axi-ticks__tick--on"></span>
  <span class="axi-ticks__tick axi-ticks__tick--on"></span>
  <span class="axi-ticks__tick axi-ticks__tick--on"></span>
  <span class="axi-ticks__tick"></span>
  <span class="axi-ticks__tick"></span>
  <span class="axi-ticks__tick axi-ticks__tick--on"></span>
  <span class="axi-ticks__tick axi-ticks__tick--on"></span>
  <span class="axi-ticks__tick axi-ticks__tick--on"></span>
  <span class="axi-ticks__tick axi-ticks__tick--on"></span>
  <span class="axi-ticks__tick"></span>
  <span class="axi-ticks__tick axi-ticks__tick--on"></span>
</div>`,
      },
      {
        title: 'Two runs compared',
        note: 'The second series is a per-instance --axi-series',
        html: `<div class="axi-ticks">
  <span class="axi-ticks__tick axi-ticks__tick--on"></span>
  <span class="axi-ticks__tick"></span>
  <span class="axi-ticks__tick axi-ticks__tick--on"></span>
  <span class="axi-ticks__tick axi-ticks__tick--on"></span>
  <span class="axi-ticks__tick"></span>
</div>
<div class="axi-ticks" style="--axi-series: var(--axi-danger)">
  <span class="axi-ticks__tick"></span>
  <span class="axi-ticks__tick axi-ticks__tick--on"></span>
  <span class="axi-ticks__tick"></span>
  <span class="axi-ticks__tick"></span>
  <span class="axi-ticks__tick axi-ticks__tick--on"></span>
</div>`,
      },
      {
        title: 'A denser strip',
        note: 'Narrower marks, tighter gap, taller run',
        html: `<div class="axi-ticks" style="--axi-tick-w: 3px; --axi-ticks-gap: 2px; --axi-tick-h: 22px">
  <span class="axi-ticks__tick axi-ticks__tick--on"></span>
  <span class="axi-ticks__tick axi-ticks__tick--on"></span>
  <span class="axi-ticks__tick"></span>
  <span class="axi-ticks__tick axi-ticks__tick--on"></span>
  <span class="axi-ticks__tick"></span>
  <span class="axi-ticks__tick axi-ticks__tick--on"></span>
  <span class="axi-ticks__tick axi-ticks__tick--on"></span>
  <span class="axi-ticks__tick axi-ticks__tick--on"></span>
</div>`,
      },
    ],
  },
]
