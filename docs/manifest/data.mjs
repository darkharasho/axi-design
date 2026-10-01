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
      '.axi-table__scroll',
      '.axi-table--sticky',
      '.axi-table--pinned',
      '.axi-table--dense',
      '.axi-table--fixed',
      '.axi-table__cell--sorted',
      '.axi-table__sort',
      '.axi-table--matrix',
      '.axi-table--ruler',
    ],
    summary: 'A ranked list of rows inside a panel. Rows are separated by rules rather than outlined or blocked, because the panel is the raised thing and the table is its interior.',
    rules: [8, 9],
    knobs: ['--axi-matrix-cell'],
    notes: `Numbers are set right-aligned and names left-aligned on the element
itself, not left to every consumer to remember. \`.axi-table__rank--top\` is
the only fill a table ever gets, and only for a real podium position - a row
number stays outlined.

A table wider or taller than the panel holding it goes in an
\`.axi-table__scroll\` and takes the modifiers it needs: \`--sticky\` keeps the
head in place, \`--pinned\` keeps the first column in place, \`--dense\` steps
the padding and type down for twenty columns instead of four. Both freezing
modifiers switch the table to separate borders, because a collapsed table hands
its cell borders to the table element and a border owned by the table scrolls
away with it - a sticky head under \`collapse\` loses the line that makes it a
lid. There is no scrolled-under state: the head's edge is drawn whether
anything has moved beneath it or not.

A table sharing a pane with something else takes \`--fixed\` instead, and sets
its column proportions in a \`<colgroup>\`. \`width: 100%\` is a floor, not a
cap: under the default auto layout the columns size to their content, and
because every cell is \`nowrap\`, content wins - a three-column table measures
581px inside a 360px pane. A page-width table absorbs that, and
\`.axi-table__scroll\` turns it into a horizontal scrollbar on purpose; a table
beside a selector list has neither option and needs the columns to divide the
room it has. Under \`--fixed\` a cell narrower than its content is the normal
case, so cells clip and ellipsise, and a name cell's label truncates while the
icon beside it keeps its size.

Mark the sorted column with \`aria-sort\` on the \`<th>\` - the attribute a
screen reader needs anyway, rather than a class saying the same thing twice -
and \`.axi-table__cell--sorted\` on that column's cells, which is the one part
CSS cannot work out for itself. Where the sort is something the reader can
change, wrap the heading in an \`.axi-table__sort\` button - a heading that
responds to a click but not to a keyboard is a column nobody tabbing through
the page can sort.

Where picking a row drives something else - a detail pane, a chart, a second
table - mark it with \`aria-current\` on the \`<tr>\`, again the attribute the
announcement already needs.

The mark is the row's leading edge, not its fill, and the reason is worth
knowing: hovering a row already raises it, and there is no neutral step left for
a selection to take. The ramp a theme guarantees is ground, surface,
surface-raised; \`--axi-surface-float\` looks like a fourth rung and is not one -
it promises OPACITY for things sitting over content, which is why the default
theme aliases it to \`--axi-surface\` and glass sets it darker than
\`--axi-surface-raised\`. So selection and hover share the raised fill and are
told apart by an accent edge on the first cell, which every body row reserves as
a transparent control-weight border so that lighting it costs no reflow. One edge
is a mark; the box around a row is what rule 8 refuses.

### The matrix

Two categorical axes with a quantity where they cross — players down the side,
time buckets across, a count in each cell. \`--matrix draws the field and
\`--ruler is for the case where the columns are a timeline rather than a list
of categories.

Rule 9 says a quantity is drawn as length and never as intensity, and this is
the one shape it bounds rather than forbids. The plane is spent: with both axes
spoken for there is no third dimension left to give the quantity a length, a bar
per cell is 2400 bars four pixels wide, and neither axis can be re-sorted by the
value because both are already sorted by something the reader needs. What makes
the intensity admissible is rule 9's own argument rather than an exemption from
it — **the cell prints its number.** The digit is the legible copy, the band is
only what lets the eye find the shape without reading two thousand figures one
at a time. A matrix cell with nothing written in it is a heatmap, and rule 9
refuses it.

It is a MODIFIER and not a component, which is the finding rather than a
convenience. Everything structural a matrix field needs, the table already had:
\`--sticky for a ruler that stays, \`--pinned for names that stay,
\`--dense for sixty columns' padding, \`--fixed with a \`colgroup\` for
proportional cells, \`.axi-table__scroll\` for the frame they move in. The
only thing missing was the quantity.

Set the band with \`data-heat="1"\` to \`"4"\` on the cell. Four steps, each a
\`color-mix()\` of the accent into \`--axi-surface-paint\` so every band is a
computed opaque colour — the accent at 18% alpha over the field would be rule
2's faded ink, and it fails on its own terms too, because the cells a reader
scans for are the quiet ones and an alpha ramp is where those disappear. The
flat companion and not \`--axi-surface\`, because a surface token may hold a
gradient and \`color-mix()\` takes colours only: spell it wrong and the bands do
not fade, they vanish. The top two steps carry \`--axi-accent-ink\`, because past
roughly half strength the field is the accent and the text on it is the accent's
companion.

A cell carrying a band keeps it under hover and under \`aria-current\`. A fill
that is the data has no room for a row state, so the row state is drawn by the
leading edge and by every cell with nothing to say — which is the same
edge-not-fill answer the selection above reaches on its own grounds.

\`--ruler changes two things and only two. Column labels move left, because a
label on a ruler names a MOMENT and centring it puts the text half a cell right
of the instant it points at. And \`data-tick\` on a column draws its division as
the rule at the hairline step — the same line that parts the rows, continued
down the field. Mark only the labelled columns: sixty ruled columns is a
spreadsheet, and the bands are meant to be the figure.

\`data-group-start\` on a \`tr\` rules a change of category down the rows — a
subgroup, a team, a date. Heavier in ink rather than in weight, because going up
a form step would put a control-weight line inside running content, which is rule
8's grid of boxes. It works on any table, not only a matrix.`,
    examples: [
      {
        title: 'A matrix field',
        note: 'Strips taken per player per five seconds. Every cell prints its number — the band is what lets the eye find the shape, not the only copy of it',
        html: `<div class="axi-panel" style="--axi-panel-pad: 0;">
  <div class="axi-table__scroll">
    <table class="axi-table axi-table--dense axi-table--matrix axi-table--ruler axi-table--sticky axi-table--pinned">
      <thead>
        <tr>
        <th>Player</th>
        <th scope="col">0:00</th>
        <th scope="col"></th>
        <th scope="col"></th>
        <th scope="col"></th>
        <th scope="col"></th>
        <th scope="col"></th>
        <th scope="col" data-tick>0:30</th>
        <th scope="col"></th>
        <th scope="col"></th>
        <th scope="col"></th>
        <th scope="col"></th>
        <th scope="col"></th>
        <th scope="col" data-tick>1:00</th>
        <th scope="col"></th>
        <th scope="col"></th>
        <th scope="col"></th>
        </tr>
      </thead>
      <tbody>
        <tr>
        <th scope="row">Skoll.4183</th>
        <td data-heat="3">6</td>
        <td></td>
        <td></td>
        <td data-heat="3">6</td>
        <td data-heat="1">2</td>
        <td></td>
        <td data-tick data-heat="1">1</td>
        <td data-heat="2">3</td>
        <td data-heat="4">8</td>
        <td data-heat="4">7</td>
        <td></td>
        <td></td>
        <td data-tick></td>
        <td data-heat="1">2</td>
        <td data-heat="4">7</td>
        <td data-heat="1">2</td>
        </tr>
        <tr>
        <th scope="row">Renna.9021</th>
        <td data-heat="2">4</td>
        <td data-heat="4">7</td>
        <td data-heat="3">5</td>
        <td data-heat="4">7</td>
        <td></td>
        <td data-heat="2">4</td>
        <td data-tick data-heat="1">1</td>
        <td data-heat="1">1</td>
        <td data-heat="4">8</td>
        <td></td>
        <td></td>
        <td data-heat="1">2</td>
        <td data-tick data-heat="1">1</td>
        <td></td>
        <td data-heat="2">4</td>
        <td></td>
        </tr>
        <tr data-group-start>
        <th scope="row">Oakvale.5567</th>
        <td data-heat="2">3</td>
        <td data-heat="1">1</td>
        <td data-heat="4">8</td>
        <td data-heat="2">4</td>
        <td data-heat="4">7</td>
        <td></td>
        <td data-tick data-heat="2">3</td>
        <td></td>
        <td data-heat="1">1</td>
        <td></td>
        <td data-heat="2">3</td>
        <td data-heat="1">1</td>
        <td data-tick></td>
        <td data-heat="2">4</td>
        <td></td>
        <td data-heat="3">6</td>
        </tr>
        <tr>
        <th scope="row">Bracken.7712</th>
        <td data-heat="4">9</td>
        <td data-heat="1">2</td>
        <td data-heat="1">2</td>
        <td data-heat="3">6</td>
        <td data-heat="4">7</td>
        <td></td>
        <td data-tick data-heat="1">1</td>
        <td></td>
        <td data-heat="1">1</td>
        <td data-heat="2">4</td>
        <td></td>
        <td></td>
        <td data-tick data-heat="3">5</td>
        <td data-heat="1">2</td>
        <td data-heat="1">1</td>
        <td></td>
        </tr>
        <tr data-group-start>
        <th scope="row">Marrow.3098</th>
        <td data-heat="4">7</td>
        <td data-heat="2">4</td>
        <td data-heat="1">2</td>
        <td data-heat="2">4</td>
        <td></td>
        <td data-heat="4">9</td>
        <td data-tick></td>
        <td data-heat="3">6</td>
        <td></td>
        <td></td>
        <td data-heat="3">5</td>
        <td></td>
        <td data-tick data-heat="2">3</td>
        <td></td>
        <td></td>
        <td></td>
        </tr>
        <tr>
        <th scope="row">Thistle.6640</th>
        <td></td>
        <td></td>
        <td data-heat="4">7</td>
        <td></td>
        <td></td>
        <td data-heat="3">5</td>
        <td data-tick></td>
        <td data-heat="2">3</td>
        <td data-heat="4">9</td>
        <td></td>
        <td></td>
        <td></td>
        <td data-tick></td>
        <td data-heat="4">7</td>
        <td data-heat="2">3</td>
        <td data-heat="3">5</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>`,
      },
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
      {
        title: 'Scrolled, pinned and dense',
        note: 'Scroll sideways: the head and the first column stay. Damage is the sorted column',
        html: `<div class="axi-panel" style="--axi-panel-pad: 0;">
  <div class="axi-table__scroll" style="max-height: 148px;">
    <table class="axi-table axi-table--sticky axi-table--pinned axi-table--dense">
      <thead>
        <tr>
          <th>Player</th>
          <th aria-sort="descending">Damage</th><th>Down contrib.</th><th>Cleanses</th>
          <th>Strips</th><th>Stability</th><th>Alacrity</th><th>Quickness</th>
          <th>Dist. to tag</th><th>Deaths</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Skoll.4183</td><td class="axi-table__cell--sorted">412,908</td><td>38</td><td>1,204</td><td>311</td><td>18.4%</td><td>62.1%</td><td>71.0%</td><td>418</td><td>2</td></tr>
        <tr><td>Renna.9021</td><td class="axi-table__cell--sorted">377,140</td><td>31</td><td>988</td><td>274</td><td>21.7%</td><td>59.8%</td><td>68.3%</td><td>502</td><td>4</td></tr>
        <tr><td>Oakvale.5567</td><td class="axi-table__cell--sorted">344,602</td><td>29</td><td>1,451</td><td>190</td><td>16.2%</td><td>64.4%</td><td>66.9%</td><td>377</td><td>1</td></tr>
        <tr><td>Bracken.7712</td><td class="axi-table__cell--sorted">301,885</td><td>24</td><td>742</td><td>408</td><td>29.1%</td><td>55.0%</td><td>70.2%</td><td>611</td><td>3</td></tr>
        <tr><td>Marrow.3098</td><td class="axi-table__cell--sorted">288,043</td><td>22</td><td>1,673</td><td>122</td><td>12.8%</td><td>66.7%</td><td>64.1%</td><td>340</td><td>5</td></tr>
      </tbody>
    </table>
  </div>
</div>`,
      },
      {
        title: 'Sharing a pane',
        note: 'Fixed columns, proportions in a colgroup. The long skill name truncates; the icon beside it does not',
        html: `<div class="axi-panel" style="--axi-panel-pad: 0; max-width: 360px;">
  <div class="axi-table__scroll" style="max-height: 148px;">
    <table class="axi-table axi-table--fixed axi-table--sticky">
      <colgroup><col style="width: 57%;"><col style="width: 23%;"><col style="width: 20%;"></colgroup>
      <thead>
        <tr><th>Skill</th><th aria-sort="descending">Damage</th><th>% Total</th></tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="axi-table__who"><span class="axi-table__rank">1</span> <span>Chapter 4: Scorched Aftermath of the Eternal Vigil</span></span></td>
          <td class="axi-table__cell--sorted">412,908</td><td>41.2%</td>
        </tr>
        <tr>
          <td><span class="axi-table__who"><span class="axi-table__rank">2</span> <span>Ghastly Breach</span></span></td>
          <td class="axi-table__cell--sorted">188,204</td><td>18.8%</td>
        </tr>
        <tr>
          <td><span class="axi-table__who"><span class="axi-table__rank">3</span> <span>Grasping Dead</span></span></td>
          <td class="axi-table__cell--sorted">96,551</td><td>9.6%</td>
        </tr>
      </tbody>
    </table>
  </div>
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
    id: 'readout',
    name: 'Readout',
    layer: 'data',
    classes: ['.axi-readout', '.axi-readout__row', '.axi-readout__k', '.axi-readout__v'],
    summary: 'A short run of labelled readings, one per row, parted by the rule. Two columns of a table without the table.',
    rules: [8],
    knobs: ['--axi-readout-pad'],
    aliases: ['kv', 'dl', 'status', 'settings'],
    notes: `The eye runs down the value column, which is rule 8's test for a
table, so it is drawn as one: rows parted by the rule at the hairline weight,
nothing outlined and nothing blocked inside the panel that already is. The
second cell is as often a control as a figure - a switch beside the setting it
sets is the same object as a count beside its label - and the value slot is
sized for either.

Put the classes on a \`<dl>\`: a \`<dt>\` for the key and a \`<dd>\` for the value,
wrapped so each row is one flex line. Row padding is \`--axi-readout-pad\`; it
falls back tighter inside a tile than in a panel, so a dashboard's side column
of status cards does not have to restate the density of every row in it.`,
    examples: [
      {
        title: 'A status card',
        note: 'Eyebrow, readings and a switch in one tile, with nothing restated',
        html: `<div class="axi-panel axi-panel--tile" style="max-width: 260px">
  <p class="axi-eyebrow">Session</p>
  <dl class="axi-readout">
    <div class="axi-readout__row"><dt class="axi-readout__k">Logs seen</dt><dd class="axi-readout__v">12</dd></div>
    <div class="axi-readout__row"><dt class="axi-readout__k">Uploaded</dt><dd class="axi-readout__v">9</dd></div>
    <div class="axi-readout__row"><dt class="axi-readout__k">Failed</dt><dd class="axi-readout__v axi-ink-danger">1</dd></div>
    <div class="axi-readout__row"><dt class="axi-readout__k">Post to Discord</dt><dd class="axi-readout__v"><button class="axi-switch" type="button" role="switch" aria-checked="true" aria-label="Post to Discord" style="--axi-switch-w: 32px; --axi-switch-h: 18px; --axi-switch-knob: 11px"><span class="axi-switch__knob"></span></button></dd></div>
  </dl>
</div>`,
      },
      {
        title: 'In a panel',
        note: 'The resting density',
        html: `<div class="axi-panel" style="max-width: 320px">
  <p class="axi-eyebrow">Match</p>
  <dl class="axi-readout">
    <div class="axi-readout__row"><dt class="axi-readout__k">Started</dt><dd class="axi-readout__v">21:04</dd></div>
    <div class="axi-readout__row"><dt class="axi-readout__k">Duration</dt><dd class="axi-readout__v">1h 52m</dd></div>
    <div class="axi-readout__row"><dt class="axi-readout__k">Fights</dt><dd class="axi-readout__v">47</dd></div>
  </dl>
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
    summary: 'A row of keys pairing a diamond swatch with a label, identifying the series drawn in a chart. A key that is a button isolates its series.',
    rules: [4, 5, 7, 13],
    knobs: [],
    aliases: ['series', 'isolate'],
    notes: `Each key reuses \`.axi-diamond\`, the family motif rule 7 asks every
identifying mark to share - a legend is not a place to invent a second shape
for the same idea. The swatch's ink is a state or a series, never decoration,
per rule 5.

Make a key a \`<button>\` and it can be pressed to isolate its series. Put
\`aria-pressed="true"\` on the isolated one and nothing on the rest: the legend
works out from that which keys recede, and draws them a step down the neutral
ramp rather than at an opacity, which is rule 4's "nothing fades". A receded
key comes back to plain under the cursor so it can still be found.`,
    examples: [
      {
        title: 'A legend of two series',
        html: `<div class="axi-legend">
  <span class="axi-legend__key"><i class="axi-diamond axi-diamond--ok"></i> Enemy downed</span>
  <span class="axi-legend__key"><i class="axi-diamond axi-diamond--danger"></i> Squad downed</span>
</div>`,
      },
      {
        title: 'A legend with one series isolated',
        note: 'Buttons; the pressed one is plain, the rest recede to the faint step',
        html: `<div class="axi-legend">
  <button class="axi-legend__key" type="button" aria-pressed="true"><i class="axi-diamond axi-diamond--series"></i> Scourge <span class="axi-ink-faint">1.4M</span></button>
  <button class="axi-legend__key" type="button"><i class="axi-diamond axi-diamond--series" style="--axi-series: var(--axi-ok)"></i> Spellbreaker <span class="axi-ink-faint">884k</span></button>
  <button class="axi-legend__key" type="button"><i class="axi-diamond axi-diamond--series" style="--axi-series: var(--axi-meta)"></i> Firebrand <span class="axi-ink-faint">610k</span></button>
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
  {
    id: 'chart',
    name: 'Library chart',
    layer: 'data',
    classes: ['.axi-chart'],
    summary: 'A scope that draws a charting library\'s furniture in the language: grid, axis, ticks, hover band, legend and brush in the neutral ramp, every series kept in its own colour. Bound to recharts.',
    rules: [2, 3, 9, 10],
    knobs: [],
    aliases: ['recharts', 'furniture', 'gridlines', 'brush', 'library'],
    notes: `Wrap a recharts chart (its \`ResponsiveContainer\`, or any ancestor) in
\`.axi-chart\` and the furniture arrives: the grid at \`--axi-grid\`, the axis
as a hairline rule, faint tabular tick labels, the hover band as the raised
step, a point, bar or slice edged in ink and keeping its series fill, and a
brush drawn as a well with the plot's one accent on its two travellers. Rule
10's subsection *A chart's furniture recedes* is the text this binds.

Nothing here is \`!important\`. The library's tooltip is not styled at all:
pass custom content wearing \`.axi-tooltip axi-tooltip--flow\` instead of an
inline \`contentStyle\`, which is a second design the language will not shout
over. Under the main theme the tooltip is that one exception rule 3 names, and
the chart gets it by using it rather than by redrawing it.`,
    examples: [
      {
        title: 'A bar chart\'s furniture, drawn statically',
        note: 'The library emits this structure; the language only colours it. Series fills are the consumer\'s.',
        html: `<div class="axi-chart" style="height: 150px">
  <svg width="100%" height="150" viewBox="0 0 320 150" aria-hidden="true">
    <g class="recharts-cartesian-grid">
      <line x1="40" y1="20" x2="310" y2="20"></line>
      <line x1="40" y1="55" x2="310" y2="55"></line>
      <line x1="40" y1="90" x2="310" y2="90"></line>
    </g>
    <g class="recharts-tooltip-cursor-wrapper"><rect class="recharts-tooltip-cursor" x="128" y="20" width="60" height="105"></rect></g>
    <g class="recharts-bar-rectangle"><path d="M52 60 h36 v65 h-36 z" fill="var(--axi-series, var(--axi-accent))"></path></g>
    <g class="recharts-bar-rectangle"><path d="M140 32 h36 v93 h-36 z" fill="var(--axi-series, var(--axi-accent))"></path></g>
    <g class="recharts-bar-rectangle"><path d="M228 80 h36 v45 h-36 z" fill="var(--axi-text-faint)"></path></g>
    <g class="recharts-reference-line"><line class="recharts-reference-line-line" x1="40" y1="48" x2="310" y2="48"></line></g>
    <g class="recharts-cartesian-axis">
      <line class="recharts-cartesian-axis-line" x1="40" y1="125" x2="310" y2="125"></line>
      <text class="recharts-cartesian-axis-tick-value" x="70" y="141" text-anchor="middle" font-size="10">0:00</text>
      <text class="recharts-cartesian-axis-tick-value" x="158" y="141" text-anchor="middle" font-size="10">1:30</text>
      <text class="recharts-cartesian-axis-tick-value" x="246" y="141" text-anchor="middle" font-size="10">3:00</text>
      <text class="recharts-cartesian-axis-tick-value" x="34" y="24" text-anchor="end" font-size="10">12k</text>
      <text class="recharts-cartesian-axis-tick-value" x="34" y="94" text-anchor="end" font-size="10">4k</text>
    </g>
  </svg>
</div>`,
      },
      {
        title: 'A brush under a plot',
        note: 'A well, a slide at the surface paint, and the plot\'s one accent on the two travellers',
        html: `<div class="axi-chart">
  <svg width="100%" height="40" viewBox="0 0 320 40" aria-hidden="true">
    <g class="recharts-brush">
      <rect x="2" y="2" width="316" height="36"></rect>
      <rect class="recharts-brush-slide" x="96" y="2" width="128" height="36"></rect>
      <g class="recharts-brush-traveller"><rect x="90" y="2" width="8" height="36"></rect><line x1="94" y1="14" x2="94" y2="26"></line></g>
      <g class="recharts-brush-traveller"><rect x="222" y="2" width="8" height="36"></rect><line x1="226" y1="14" x2="226" y2="26"></line></g>
      <text class="recharts-brush-texts" x="86" y="24" text-anchor="end" font-size="10">0:48</text>
      <text class="recharts-brush-texts" x="234" y="24" font-size="10">2:36</text>
    </g>
  </svg>
</div>`,
      },
    ],
  },
]
