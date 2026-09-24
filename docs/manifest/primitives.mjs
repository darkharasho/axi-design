export default [
  {
    id: 'btn',
    name: 'Button',
    layer: 'primitives',
    classes: ['.axi-btn', '.axi-btn--primary', '.axi-btn--ghost', '.axi-btn--dashed'],
    summary: 'The control everything else is measured against: an outlined box at the control weight that gains its block under the cursor. One button per view is the primary.',
    rules: [3, 4],
    knobs: [],
    notes: `A default button rests flat and draws its 3px block for the first time
on hover, which is why the lift reads as a lift. \`--primary\` is the one
button that rests with a block already under it, so its hover deepens that
block to 6px instead - translating alone would move element and block
together and leave the lower-right edge exactly where it was, which reads as
the button growing. \`--ghost\` and \`--dashed\` drop the fill to sit inside a
surface that has already chosen one; dashed is the language's "add
something" affordance.`,
    examples: [
      {
        title: 'The four buttons',
        note: 'Only one of these is the primary',
        html: `<a class="axi-btn axi-btn--primary" href="#">Primary</a>
<a class="axi-btn" href="#">Default</a>
<a class="axi-btn axi-btn--ghost" href="#">Ghost</a>
<a class="axi-btn axi-btn--dashed" href="#">Dashed</a>`,
      },
      {
        title: 'A button carrying a count',
        html: `<button class="axi-btn axi-btn--dashed" type="button">Filters <span class="axi-badge-count">3</span></button>`,
      },
    ],
  },
  {
    id: 'chip',
    name: 'Chip',
    layer: 'primitives',
    classes: [
      '.axi-chip',
      '.axi-chip--accent',
      '.axi-chip--meta',
      '.axi-chip--ok',
      '.axi-chip--warn',
      '.axi-chip--danger',
    ],
    summary: 'A one-word label on a thing. Filled asserts a value about it; the single outlined variant, in the cool ink, is commentary about it instead.',
    rules: [5, 6],
    knobs: [],
    notes: `The unmodified chip is a neutral fact - a platform, a count, a
language. The status modifiers assert, at full ink strength. \`--meta\` is the
only outlined variant and the only one drawn in \`--axi-meta\`, the cool ink
rule 6 keeps clear of every status meaning: that is what lets a reader tell a
maintainer's note from a measurement before reading either word.`,
    examples: [
      {
        title: 'Every chip at once',
        note: 'Five assert; the outlined one annotates',
        html: `<span class="axi-chip">Neutral</span>
<span class="axi-chip axi-chip--accent">Accent</span>
<span class="axi-chip axi-chip--ok">Stable</span>
<span class="axi-chip axi-chip--warn">Beta</span>
<span class="axi-chip axi-chip--danger">Deprecated</span>
<span class="axi-chip axi-chip--meta">Annotation</span>`,
      },
      {
        title: 'Chips describing one thing',
        html: `<div class="axi-row" style="--axi-row-gap: 7px">
  <span class="axi-chip axi-chip--warn">Beta</span>
  <span class="axi-chip">Node</span>
  <span class="axi-chip axi-chip--meta">arcdps</span>
</div>`,
      },
    ],
  },
  {
    id: 'input',
    name: 'Input',
    layer: 'primitives',
    classes: ['.axi-input'],
    summary: 'A single-line text field, drawn on the ground rather than on a surface so it reads as a well cut into the panel it sits in.',
    rules: [],
    knobs: [],
    notes: `It takes the control outline weight and no block: a block would make
it look pressable, and the thing you press is the button next to it. The
placeholder is the faint ink, so an empty field never reads as a filled one.
An input is full-width by default - give the wrapper the measure you want
rather than the field.`,
    examples: [
      {
        title: 'A labelled field',
        html: `<label class="axi-sr-only" for="input-demo">Squad name</label>
<input class="axi-input" id="input-demo" placeholder="Squad name…" style="max-width: 260px">`,
      },
    ],
  },
  {
    id: 'select',
    name: 'Select',
    layer: 'primitives',
    classes: ['.axi-select'],
    summary: 'A native select with its closed box redrawn, caret included, so it sits beside the other controls instead of announcing the operating system.',
    rules: [1],
    knobs: [],
    notes: `The caret is two \`linear-gradient\`s meeting to make a triangle - one
of the two gradients rule 1 sanctions, because it draws a shape and contains
no soft transition anywhere. No image, no icon font. The popup list stays OS
chrome until a browser lets us style it; where one does (Chromium's
\`base-select\`) the list picks up the panel outline and block, so both
dropdown kinds read as one family.`,
    examples: [
      {
        title: 'A sort control',
        html: `<label class="axi-sr-only" for="select-demo">Sort</label>
<select class="axi-select" id="select-demo">
  <option>Sort: name</option>
  <option>Sort: newest</option>
  <option>Sort: score</option>
</select>`,
      },
    ],
  },
  {
    id: 'switch',
    name: 'Switch',
    layer: 'primitives',
    classes: ['.axi-switch', '.axi-switch__knob'],
    summary: 'On or off for one setting, when nothing else is on screen to compare it against. The track fills to assert the state; the slug that moves is the ink line in both states.',
    rules: [5],
    knobs: ['--axi-switch-w', '--axi-switch-h', '--axi-switch-knob', '--axi-switch-fill'],
    notes: `Rule 5 in a slot: on and off differ in what colour is *in* the track,
never in how bright the moving part is. It carries no block - a block belongs
to things you press, and a switch is a slot with something sitting in it -
but it keeps a full ink edge at the control weight, because an off switch
inside a panel is a surface on a surface and without the edge all you can see
is a slug floating in the card. \`--axi-switch-fill\` is read through a
fallback and never declared on the component, so it can be set on the switch
or on any ancestor: a switch that turns something dangerous on can fill in
\`--axi-danger\` and say so. The slug's travel is a \`calc()\` over the same
tokens the track is built from, so resizing it with the three size knobs
stays correct.`,
    examples: [
      {
        title: 'Off, on, dangerous, and compact',
        note: 'Only the colour in the slot changes between the first two',
        html: `<div class="axi-row">
  <button class="axi-switch" type="button" role="switch" aria-checked="false" aria-label="Auto-start"><span class="axi-switch__knob"></span></button>
  <button class="axi-switch" type="button" role="switch" aria-checked="true" aria-label="Notify on updates"><span class="axi-switch__knob"></span></button>
  <button class="axi-switch" type="button" role="switch" aria-checked="true" aria-label="Allow injection" style="--axi-switch-fill: var(--axi-danger)"><span class="axi-switch__knob"></span></button>
  <button class="axi-switch" type="button" role="switch" aria-checked="true" aria-label="Compact" style="--axi-switch-w: 32px; --axi-switch-h: 18px; --axi-switch-knob: 11px"><span class="axi-switch__knob"></span></button>
</div>`,
      },
    ],
  },
  {
    id: 'pill',
    name: 'Pill',
    layer: 'primitives',
    classes: ['.axi-pill'],
    summary: 'A filter toggle. Pressed, it fills with the colour of the thing it filters to, so the control reads as that thing rather than as a generic "selected".',
    rules: [4],
    knobs: ['--axi-pill-fill'],
    notes: `A pill says which of several filters you chose; a switch says what
state one thing is in. State lives in \`aria-pressed\`, not in a modifier
class, so the accessibility tree and the appearance cannot disagree.
\`--axi-pill-fill\` is read through a fallback and never declared on the
component, which is what lets a consumer set it on the pill or on any
ancestor. A pressed pill already rests on a block, so hovering it deepens
that block rather than sliding it - the pressed-and-hovered case is spelled
out in the stylesheet because without it source order decided the answer.`,
    examples: [
      {
        title: 'A row of severity filters',
        note: 'Pressed state is aria-pressed; the fill comes in per instance',
        html: `<div class="axi-row">
  <button class="axi-pill" aria-pressed="false" type="button">Unpressed</button>
  <button class="axi-pill" aria-pressed="true" type="button">Pressed</button>
  <button class="axi-pill" aria-pressed="true" type="button" style="--axi-pill-fill: var(--axi-ok)">Low</button>
  <button class="axi-pill" aria-pressed="true" type="button" style="--axi-pill-fill: var(--axi-warn)">Elevated</button>
  <button class="axi-pill" aria-pressed="true" type="button" style="--axi-pill-fill: var(--axi-danger)">High</button>
</div>`,
      },
    ],
  },
  {
    id: 'search-input',
    name: 'Search input',
    layer: 'primitives',
    classes: ['.axi-search', '.axi-search__icon'],
    summary: 'A wrapper that reserves room inside an input for a magnifier and positions it. The glyph is the consumer\'s; only the room is the language\'s.',
    rules: [],
    knobs: [],
    notes: `Nothing here restyles the field - it is \`.axi-input\` with its left
padding widened, so a search box and a text box stay the same control. The
icon is accent-inked, \`aria-hidden\` and \`pointer-events: none\`, because it
is decoration over a field and must not intercept the click that focuses it.
It sits at the same measure as the input, so give the wrapper the width.`,
    examples: [
      {
        title: 'Search inside a toolbar',
        html: `<div class="axi-search" style="max-width: 260px">
  <span class="axi-search__icon" aria-hidden="true">&#8981;</span>
  <label class="axi-sr-only" for="search-demo">Search</label>
  <input class="axi-input" id="search-demo" placeholder="Search…">
</div>`,
      },
    ],
  },
  {
    id: 'notice',
    name: 'Notice',
    layer: 'primitives',
    classes: ['.axi-notice', '.axi-notice__icon'],
    summary: 'One paragraph the reader is not allowed to miss, raised at the panel weight with a filled glyph tile at its head.',
    rules: [3],
    knobs: [],
    notes: `Both of rule 3's weight steps appear in one component, which is the
clearest place to see the pair: the notice itself takes the panel border and
its 6px block, while the icon tile inside it takes the control border and no
block at all. A third weight between them is exactly what rule 3 refuses.
\`<b>\` inside the copy is accented, so the one phrase that matters can be
marked without a class.`,
    examples: [
      {
        title: 'A theming notice',
        html: `<div class="axi-notice">
  <span class="axi-notice__icon" aria-hidden="true">!</span>
  <p><b>One variable.</b> An app that sets <code>--axi-accent</code> and nothing else is correctly themed. If something ignores the accent switcher, it hard-coded a colour.</p>
</div>`,
      },
    ],
  },
  {
    id: 'tooltip',
    name: 'Tooltip',
    layer: 'primitives',
    classes: ['.axi-tooltip'],
    summary: 'One line of text on the darkest surface in the language, so it reads over anything it lands on. The box is the language\'s; the coordinates are the consumer\'s.',
    rules: [4],
    knobs: [],
    notes: `Two contracts travel with this class, and both come out of rule 4. The
element must be a child of \`<body>\` and never a child of the component it
annotates: \`position: fixed\` re-anchors to any transformed ancestor, and
rule 4 makes every hovered ancestor transformed, so the first hover would
move the tooltip with the thing it is pointing at. And it may never carry
information that exists nowhere else, because a keyboard or touch reader may
never see it. Measuring the trigger and setting \`left\`/\`top\` is the
consumer's half; \`gallery.js\` is the reference wiring.`,
    examples: [
      {
        title: 'The box itself',
        note: 'Dropped into the flow so the box is visible; in a real page it is appended to <body> and positioned by script',
        html: `<span class="axi-tooltip" style="position: static; display: inline-block">Launching (inferred)</span>`,
      },
    ],
  },
  {
    id: 'diamond',
    name: 'Diamond',
    layer: 'primitives',
    classes: [
      '.axi-diamond',
      '.axi-diamond--accent',
      '.axi-diamond--ok',
      '.axi-diamond--warn',
      '.axi-diamond--danger',
      '.axi-diamond--series',
    ],
    summary: 'A 45°-rotated outlined square, and the family motif: bullet, status dot, legend key, and scaled up behind a glyph, the brand sigil.',
    rules: [7, 5],
    knobs: ['--axi-series'],
    notes: `Rule 7 asks every identifying mark in the language to be this one
shape, which is why a legend key, a prose bullet and a status dot are all the
same 9px rotated square rather than three invented glyphs. It is filled in
every variant, so its ink is always asserting something: a state, or - with
\`--series\` - which line of a chart this key stands for. \`--series\` is
opt-in rather than the default because \`--axi-series\` is read from whatever
ancestor sets it, and a chart panel that sets one would otherwise silently
recolour every bullet inside it. The rotation survives
\`prefers-reduced-motion\`: a rotation that never changes is geometry, not
motion.`,
    examples: [
      {
        title: 'The status set',
        html: `<div class="axi-row">
  <span class="axi-diamond"></span>
  <span class="axi-diamond axi-diamond--accent"></span>
  <span class="axi-diamond axi-diamond--ok"></span>
  <span class="axi-diamond axi-diamond--warn"></span>
  <span class="axi-diamond axi-diamond--danger"></span>
</div>`,
      },
      {
        title: 'As a series key',
        note: 'The second key overrides --axi-series per instance',
        html: `<div class="axi-legend">
  <span class="axi-legend__key"><i class="axi-diamond axi-diamond--series"></i> Squad</span>
  <span class="axi-legend__key"><i class="axi-diamond axi-diamond--series" style="--axi-series: var(--axi-text-faint)"></i> Enemy</span>
</div>`,
      },
    ],
  },
  {
    id: 'badge-count',
    name: 'Count badge',
    layer: 'primitives',
    classes: ['.axi-badge-count'],
    summary: 'A small accent-filled number that rides inside another control, saying how many of something that control is holding.',
    rules: [],
    knobs: [],
    notes: `The one filled shape in the language with no outline of its own,
because it is always inside something that has one already - a button, a tab,
a menu trigger - and a second outline 1px inside the first reads as a seam.
It carries a count and never a status, so it takes the accent and none of the
status inks.`,
    examples: [
      {
        title: 'A count on a filter button',
        html: `<button class="axi-btn axi-btn--dashed" type="button" aria-expanded="false">Filters <span class="axi-badge-count">3</span></button>`,
      },
    ],
  },
  {
    id: 'picker',
    name: 'Picker',
    layer: 'primitives',
    classes: ['.axi-picker', '.axi-picker__btn', '.axi-picker__pop', '.axi-picker__pop--fixed', '.axi-picker__opt'],
    summary: 'A button and a popover wearing the closed box and list styling of a select - the dropdown to reach for when the platform will not let the language draw the native one.',
    rules: [3],
    knobs: [],
    notes: `Prefer the native \`<select>\` where it works: it comes with keyboard
handling, typeahead, and a popup that can escape the window. This is what you
use when it does not. On platforms that will not style the open list, what
lands there is a raised surface the language cannot reach - no ink outline, no
offset block, the OS's own selection colour - which is rule 3 broken by a box
we do not own. The fix is to stop asking the OS to draw it.

The popover carries the *panel* weight, not the control weight, because it is
a raised surface rather than a control. It is never narrower than the box it
came out of: a list that shrinks to its text is a list that has moved, and the
eye has to find the column again.

The tick sits in every row and is inked only in the chosen one. Giving it to
the selected row alone shifts every label by its width as the choice moves,
which turns picking an option into the list twitching.

Like the menu and the tooltip, the language ships no script. \`hidden\`,
\`aria-expanded\` and \`aria-selected\` are the whole state and the consumer
toggles them; \`gallery.js\` is the reference wiring, arrow keys and Escape
included. Inside a pane that scrolls or a panel that clips, \`position:
absolute\` puts the list where the overflow can eat it - and the offset block
falls outside the popover's box, so the block is the first thing to go. Add
\`--fixed\`, append the popover to \`<body>\`, and set left/top from script
having measured the trigger: the box is unchanged, only who positions it moves.`,
    examples: [
      {
        title: 'A picker, open',
        note: 'Shown open. The popover hangs below the box, so the margin reserves its room; the width keeps rows off a second line',
        html: `<div class="axi-picker" style="width: 200px; margin-bottom: 110px">
  <button class="axi-picker__btn" type="button" aria-haspopup="listbox" aria-expanded="true" aria-controls="picker-demo">Jul 2026</button>
  <div class="axi-picker__pop" id="picker-demo" role="listbox">
    <button class="axi-picker__opt" type="button" role="option" aria-selected="true">Jul 2026</button>
    <button class="axi-picker__opt" type="button" role="option" aria-selected="false">Jun 2026</button>
    <button class="axi-picker__opt" type="button" role="option" aria-selected="false">May 2026</button>
  </div>
</div>`,
      },
      {
        title: 'The closed box',
        note: 'What a consumer actually ships: state lives on the attributes',
        html: `<div class="axi-picker">
  <button class="axi-picker__btn" type="button" aria-haspopup="listbox" aria-expanded="false" aria-controls="picker-closed">Jul 2026</button>
  <div class="axi-picker__pop" id="picker-closed" role="listbox" hidden>
    <button class="axi-picker__opt" type="button" role="option" aria-selected="true">Jul 2026</button>
  </div>
</div>`,
      },
    ],
  },
]
