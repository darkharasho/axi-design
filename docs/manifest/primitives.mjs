export default [
  {
    id: 'btn',
    name: 'Button',
    layer: 'primitives',
    classes: ['.axi-btn', '.axi-btn--primary', '.axi-btn--ghost', '.axi-btn--dashed'],
    summary: 'The control everything else is measured against: an outlined box at the control weight that gains its block under the cursor. One button per view is the primary.',
    rules: [3, 4],
    knobs: [],
    aliases: ['button'],
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
    knobs: ['--axi-input-pad', '--axi-input-size', '--axi-textarea-h'],
    aliases: ['textarea', 'field', 'textbox'],
    notes: `It takes the control outline weight and no block: a block would make
it look pressable, and the thing you press is the button next to it. The
placeholder is the faint ink, so an empty field never reads as a filled one.
An input is full-width by default - give the wrapper the measure you want
rather than the field.

It is used at two scales, which is what \`--axi-input-pad\` and
\`--axi-input-size\` are for: the 14px default is a form control standing on a
page, and a filter in a section header or a row in a bar wants the smaller
one, because there it is furniture beside the reading rather than the thing
the page is for. \`.axi-palette__bar\` is the one place upstream needs it, and
it spends the knobs rather than redeclaring the properties.`,
    examples: [
      {
        title: 'A labelled field',
        html: `<label class="axi-sr-only" for="input-demo">Squad name</label>
<input class="axi-input" id="input-demo" placeholder="Squad name…" style="max-width: 260px">`,
      },
      {
        title: 'A multi-line field',
        note: 'Not a separate component - the same class, on a textarea. Resizing is vertical only, so a drag cannot break the form\'s column',
        html: `<textarea class="axi-input" style="--axi-textarea-h: 120px" placeholder="What happened on this pull?"></textarea>`,
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
  <span class="axi-search__icon" aria-hidden="true"><svg class="axi-icon"><use href="#axi-search"/></svg></span>
  <label class="axi-sr-only" for="search-demo">Search</label>
  <input class="axi-input" id="search-demo" placeholder="Search…">
</div>`,
      },
    ],
  },
  {
    id: 'kbd',
    name: 'Keyboard key',
    layer: 'primitives',
    classes: ['.axi-kbd'],
    summary: 'A key on the keyboard, named in the interface. Drawn as a small control, because what it depicts is a thing you press.',
    rules: [3, 5],
    knobs: [],
    notes: `The Esc that closes a palette, the Ctrl K that opens it. Before this
existed, every consumer with a shortcut to show drew its own box for it, which
is how an app ends up with two spellings of a key in the same view.

It takes the control edge and the control radius, so a key is visibly the same
kind of object as a button. Its fill is \`--axi-surface\`, not
\`--axi-ground\`: a key stands out of what it is printed on, and the bars and
fields these appear in are already the recessed thing.

Use the \`<kbd>\` element - one per key, or one for a chord written as
\`Ctrl K\`. The class draws a box and takes no view on which.`,
    examples: [
      {
        title: 'A shortcut and a chord',
        html: `<div class="axi-row" style="align-items: center">
  <span class="axi-eyebrow">Close</span>
  <kbd class="axi-kbd">Esc</kbd>
  <span class="axi-eyebrow">Search</span>
  <kbd class="axi-kbd">Ctrl K</kbd>
</div>`,
      },
    ],
  },
  {
    id: 'notice',
    name: 'Notice',
    layer: 'primitives',
    classes: ['.axi-notice', '.axi-notice__icon', '.axi-notice--ok', '.axi-notice--warn', '.axi-notice--danger'],
    summary: 'One paragraph the reader is not allowed to miss, raised at the panel weight with a filled glyph tile at its head.',
    rules: [3, 5],
    knobs: [],
    aliases: ['alert', 'banner'],
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
  <span class="axi-notice__icon" aria-hidden="true"><svg class="axi-icon"><use href="#axi-info"/></svg></span>
  <p><b>One variable.</b> An app that sets <code>--axi-accent</code> and nothing else is correctly themed. If something ignores the accent switcher, it hard-coded a colour.</p>
</div>`,
      },
      {
        title: 'The three statuses',
        note: 'Rule 5: the icon is the part that asserts, so the status lives there and the paragraph stays in the reading ink',
        html: `<div class="axi-notice axi-notice--ok">
  <span class="axi-notice__icon" aria-hidden="true"><svg class="axi-icon"><use href="#axi-check"/></svg></span>
  <p><b>Parsed.</b> All 14 encounters matched a known boss.</p>
</div>
<div class="axi-notice axi-notice--warn">
  <span class="axi-notice__icon" aria-hidden="true"><svg class="axi-icon"><use href="#axi-circle-alert"/></svg></span>
  <p><b>Partial.</b> Two encounters had no boss agent and were skipped.</p>
</div>
<div class="axi-notice axi-notice--danger">
  <span class="axi-notice__icon" aria-hidden="true"><svg class="axi-icon"><use href="#axi-circle-alert"/></svg></span>
  <p><b>Failed.</b> The archive is missing its header.</p>
</div>`,
      },
    ],
  },
  {
    id: 'tooltip',
    name: 'Tooltip',
    layer: 'primitives',
    classes: ['.axi-tooltip', '.axi-tooltip--anchored', '.axi-tooltip--flow', '.axi-tooltip--wrap'],
    summary: 'One line of text on the darkest surface in the language, so it reads over anything it lands on. The box is the language\'s; the coordinates are the consumer\'s.',
    rules: [4],
    knobs: [],
    notes: `Two contracts travel with the base class, and both come out of rule 4.
The element must be a child of \`<body>\` and never a child of the component it
annotates: \`position: fixed\` re-anchors to any transformed ancestor, and
rule 4 makes every hovered ancestor transformed, so the first hover would
move the tooltip with the thing it is pointing at. And it may never carry
information that exists nowhere else, because a keyboard or touch reader may
never see it. Measuring the trigger and setting \`left\`/\`top\` is the
consumer's half; \`gallery.js\` is the reference wiring.

\`--anchored\` is the other half of that trade. A tooltip belonging to exactly
one trigger can live inside it, and then \`position: absolute\` is what you
want: it measures from the transformed ancestor rather than fighting it, so a
hover lift carries the tooltip along instead of stranding it. The consumer
still supplies the offsets - a positioned trigger and the left/top the
placement needs - and the \`<body>\` contract does not apply.

\`--flow\` is the third placement: the box is laid out by whoever owns its
wrapper, and it positions itself not at all. A charting library is the case
that forces it - recharts places and transforms a wrapper and renders your
content inside it - and the base class deceives here, because a fixed box with
auto insets lands at its static position and so appears to work perfectly. It
scrolls with the chart only because that wrapper is transformed, which is the
containment the \`<body>\` contract exists to escape; set recharts' \`portal\`
prop and the positioning vanishes along with the failure's visibility.

\`--wrap\` is for a tooltip carrying a sentence instead of a reading. nowrap is
right for a value, which is harder to read broken across two lines than run
past its trigger, and wrong for prose; pair it with a width.`,
    examples: [
      {
        title: 'The box itself',
        note: 'Using --flow, which is what this example always needed: in a real page the base class is appended to <body> and positioned by script',
        html: `<span class="axi-tooltip axi-tooltip--flow" style="display: inline-block">Launching (inferred)</span>`,
      },
      {
        title: 'Anchored, wrapping',
        note: 'Inside its trigger rather than appended to <body>, and carrying a sentence, so it takes both modifiers and a width',
        html: `<span style="position: relative; display: inline-block; padding: 6px 10px; border: 1px solid var(--axi-rule)">Coverage
  <span class="axi-tooltip axi-tooltip--anchored axi-tooltip--wrap" style="left: 0; top: calc(100% + 6px); width: 180px">Share of the fight this player was alive and within range of the tag.</span>
</span>`,
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
a raised surface rather than a control, and its fill is
\`--axi-surface-float\` - the list is over the page, which is the case that
token exists for. It said \`--axi-surface-raised\` until the popovers moved:
raised was the only word for "higher than a panel" before the float existed,
but height is carried by the border and the block, and what raised was really
lending here was opacity a translucent theme takes away. It is never narrower than the box it
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
  {
    id: 'icon',
    name: 'Icon',
    layer: 'primitives',
    classes: ['.axi-icon'],
    summary: "A glyph from the axi icon set. The class sizes the box; the drawing brings its own stroke and takes its ink from whatever it sits in.",
    rules: [12],
    knobs: ['--axi-icon-size'],
    aliases: ['glyph', 'symbol', 'pictogram'],
    notes: `The set is drawn to rule 12 - a 24 canvas, a 3px stroke, mitered
joins, square corners, and no angle that is not 0, 45 or 90 degrees. Browse the
whole of it on the [icons page](../../icons/).

The class sets four things and deliberately nothing else: the two dimensions,
\`flex: none\` and the baseline offset. It sets no \`color\`, \`stroke\` or
\`fill\`, because an icon is whatever ink the thing containing it is written
in: put it inside a \`.axi-btn--primary\` and it turns accent-ink with the label.

\`flex: none\` is the load-bearing one. The commonest placement in the whole set
is beside a label inside a button, which is a flex container, and \`width: 1.25em\`
alone loses to \`flex-shrink\` there - the glyph arrives squashed.

The examples below reference \`#axi-<name>\` with no file part, because this site
inlines the sprite into every page. In your own app, point at the file:
\`<use href="node_modules/@axiapps/axi-design/dist/icons/sprite.svg#axi-search">\`,
which inherits \`currentColor\` the same way over \`http(s)\`. A reference into a
separate file is same-origin, so under \`file://\` - an Electron window opened
with \`loadFile()\` - it resolves to nothing instead; inline the sprite once and
use bare fragments there, as this site does.`,
    examples: [
      {
        title: 'On its own, and at a size',
        html: `<span class="axi-row">
  <svg class="axi-icon" aria-hidden="true"><use href="#axi-search"/></svg>
  <svg class="axi-icon" style="--axi-icon-size: 2rem" aria-hidden="true"><use href="#axi-check"/></svg>
</span>`,
      },
      {
        title: 'Beside a label',
        html: `<button class="axi-btn axi-btn--primary" type="button">
  <svg class="axi-icon" aria-hidden="true"><use href="#axi-search"/></svg>
  Search
</button>
<button class="axi-btn" type="button">
  <svg class="axi-icon" aria-hidden="true"><use href="#axi-x"/></svg>
  Dismiss
</button>`,
      },
      {
        title: 'Alone in a button, where the label is the accessible name',
        note: 'An icon-only control still needs a name - the glyph is aria-hidden and the button carries an aria-label',
        html: `<button class="axi-btn" type="button" aria-label="Close">
  <svg class="axi-icon" aria-hidden="true"><use href="#axi-x"/></svg>
</button>`,
      },
    ],
  },
  {
    id: 'avatar',
    name: 'Avatar',
    layer: 'primitives',
    classes: ['.axi-avatar', '.axi-avatar--accent', '.axi-avatar__img'],
    summary: 'A square holding initials or a picture. Square because a circle is the one shape this language does not have.',
    rules: [],
    knobs: ['--axi-avatar-size'],
    aliases: ['gravatar', 'profile', 'userpic'],
    notes: `It follows the radius scale like everything else, so setting
\`--axi-radius-sm\` rounds avatars along with every other control - which is the
honest version of "can the avatars be round".

\`.axi-avatar__img\` uses \`object-fit\` on a real \`<img>\` rather than a background
image, so the alt text survives and a broken source is visible instead of
silently blank.`,
    examples: [
      {
        title: 'Initials',
        html: `<span class="axi-avatar">MS</span>
<span class="axi-avatar axi-avatar--accent">KJ</span>`,
      },
      {
        title: 'A picture',
        note: 'The flat grey fill is placeholder image content standing in for a real photograph, not a styling choice - do not read it as a token',
        html: `<span class="axi-avatar"><img class="axi-avatar__img" src="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2740%27 height=%2740%27%3E%3Crect width=%2740%27 height=%2740%27 fill=%27%23808080%27/%3E%3C/svg%3E" alt="Avatar"></span>`,
      },
      {
        title: 'In a row, at two sizes',
        html: `<div class="axi-row">
  <span class="axi-avatar" style="--axi-avatar-size: 28px">AR</span>
  <span class="axi-avatar">AR</span>
</div>`,
      },
    ],
  },
]
