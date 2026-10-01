export default [
  {
    id: 'btn',
    name: 'Button',
    layer: 'primitives',
    classes: [
      '.axi-btn',
      '.axi-btn--primary',
      '.axi-btn--ghost',
      '.axi-btn--dashed',
      '.axi-btn--sm',
      '.axi-btn--xs',
      '.axi-btn--icon',
      '.axi-btn--stack',
    ],
    summary: 'The control everything else is measured against: an outlined box at the control weight that gains its block under the cursor. One button per view is the primary.',
    rules: [3, 4],
    knobs: ['--axi-btn-pad', '--axi-btn-size'],
    aliases: ['button'],
    notes: `A default button rests flat and draws its 3px block for the first time
on hover, which is why the lift reads as a lift. \`--primary\` is the one
button that rests with a block already under it, so its hover deepens that
block to 6px instead - translating alone would move element and block
together and leave the lower-right edge exactly where it was, which reads as
the button growing. \`--ghost\` and \`--dashed\` drop the fill to sit inside a
surface that has already chosen one; dashed is the language's "add
something" affordance.

There are three sizes because one was a fiction. A button that only comes at
20px sides is the right size for a page's main action and the wrong size for
every dense place an app has - a filter beside 11px type, a toolbar, a row of
controls in a card header - and a consumer who needs one of those spells its
own padding and font-size in utilities, at which point the button is only
borrowing the border. \`--sm\` and \`--xs\` step both numbers together, the way
\`.axi-table--dense\` does, so "the small one" is a thing you can say rather
than a pair of values you have to pick.

\`--icon\` is different in kind: not a size the language was missing but one it
had wrong. An icon-only button has no label to pad around, so the sides meant
for one produced a wide rectangle around a single glyph - which the icon page's
own "Alone in a button" example showed, uncommented, for as long as it has
existed.
\`--stack\` puts the icon over the label instead of beside it, and it is not a
style choice - it is the only thing that makes a bar of equal actions fit a
phone. Measured on the consumer that needed it: four icon+label actions side by
side want 387px of the 337px available at 393px wide, and every label is one
unbreakable word, so min-content equals max-content and \`flex-shrink\` has
nothing to give. The last action runs off the screen. Stacked, the same four
come to ~291px.

It also sets \`min-width: 0\` on the button and on its label, because that
failure has a second half: a flex item's default min-width is its content, so
without it a button refuses to shrink below its own label even when the row is
told to divide the space, and the label's ellipsis is unreachable.`,
    examples: [
      {
        title: 'A bar of equal actions on a phone',
        note: 'Stacked, so four unbreakable labels fit a 393px screen',
        html: `<div class="axi-toolbar axi-toolbar--float axi-toolbar--nowrap" style="--axi-toolbar-pad: 8px; width: 337px">
  <button class="axi-btn axi-btn--xs axi-btn--stack" style="flex: 1">
    <svg class="axi-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
    <span>Back</span>
  </button>
  <button class="axi-btn axi-btn--xs axi-btn--stack" style="flex: 1">
    <svg class="axi-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 5h18M3 12h18M3 19h18"/></svg>
    <span>Contents</span>
  </button>
  <button class="axi-btn axi-btn--xs axi-btn--stack" style="flex: 1">
    <svg class="axi-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
    <span>Search</span>
  </button>
  <button class="axi-btn axi-btn--xs axi-btn--stack" style="flex: 1">
    <svg class="axi-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
    <span>Top</span>
  </button>
</div>`,
      },
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
        note: 'On the primary the badge inverts, because its own fill is the fill it is sitting on',
        html: `<button class="axi-btn axi-btn--dashed" type="button">Filters <span class="axi-badge-count">3</span></button>
<button class="axi-btn axi-btn--primary" type="button">Add <span class="axi-badge-count">3</span></button>`,
      },
      {
        title: 'The three sizes, and the icon-only one',
        note: 'The padding and the type step together; --icon drops the sides a label was paying for',
        html: `<button class="axi-btn" type="button">Default</button>
<button class="axi-btn axi-btn--sm" type="button">Small</button>
<button class="axi-btn axi-btn--xs" type="button">Extra small</button>
<button class="axi-btn axi-btn--icon" type="button" aria-label="Close">
  <svg class="axi-icon" aria-hidden="true"><use href="#axi-x"/></svg>
</button>`,
      },
      {
        title: 'A button that has been told what it means',
        note: 'The ink survives the cursor - the hover brighten is a fallback, not an override',
        html: `<button class="axi-btn axi-btn--sm axi-ink-danger axi-edge-danger" type="button">
  <svg class="axi-icon" aria-hidden="true"><use href="#axi-trash"/></svg>
  Delete
</button>`,
      },
    ],
  },
  {
    id: 'btn-split',
    name: 'Split button',
    layer: 'primitives',
    classes: [
      '.axi-btn-split',
      '.axi-btn-split__toggle',
    ],
    summary: 'A primary action and a disclosure half joined on one shared edge. It lifts as a single control and brightens only the half under the cursor.',
    rules: [4, 6],
    knobs: [],
    aliases: ['disclosure', 'dropdown', 'caret'],
    notes: `A split button is the one control in the language where a corner is
sometimes square and sometimes the surface's, so it is the one control where a
consumer writing it by hand will write a literal. The one that prompted this
component was rounded at 10px on all three surfaces - right on glass, wrong on
flat, and visibly wrong on the default surface, where every ordinary
\`.axi-btn\` beside it was square. Joining two buttons is not difficult; it is
just not something to get right once per app.

The requirement is that it feel like one button on every surface, and the two
rules that carry it are both about refusing to treat the halves separately.
The seam is a single shared edge: the second half is pulled back by
\`--axi-border-control\` so its border lands exactly on its sibling's, making
one stroke at the language's own weight and colour. A margin instead - even a
1px one - puts two borders and a sliver of background between the halves,
which on the default surface is 7px of edge and reads unmistakably as two
buttons touching.

On a filled tone that stroke is drawn in \`--axi-accent-ink\` rather than
\`--axi-ink-line\`. Every other edge in the language is the ink line, which is
opaque near-black on the main surface but a light translucent edge on flat and
glass - right for catching light against a dark surface, and unable to resolve
into an edge at all across two bright accent fields. The accent ink is what
the label is already drawn in and is near-black on all three surfaces, so the
divider reads everywhere and the main surface is unchanged, where the two
tokens are the same colour.

Hover belongs to the control. The generic button hover would translate
whichever half the cursor found and tear the seam open two pixels wide, so the
translate moves to the wrapper and both halves take the hover block together.
Colour is the one thing that stays per-half - the brighten still lands only
under the cursor, which is the entire reason the control has two targets.

Neither half casts a shadow across the seam. On the surfaces that spell relief
as a soft drop, a control's blur reaches outward on all four sides - glass's
travels about 8px sideways - and a half of a joined control has a sibling
there rather than the page. Left alone, the disclosure half's bleed lands on
top of its neighbour as a dark band just inside the seam, which is the second
way this control reads as two buttons. Each half therefore clips its own
shadow flush with the edge it shares and drops normally on the other three.
The clip lifts while a half is focused, because the focus ring is an outline
drawn outside the box and a clip flush with that edge would cut it in half.

The halves are ordinary \`.axi-btn\`s, so every tone and ink works unchanged:
a consumer whose action turns destructive swaps \`--primary\` for
\`.axi-ink-danger\` on both and the seam follows. The wrapper is
\`position: relative\` so the menu the disclosure half opens can anchor to the
control rather than to the page.`,
    examples: [
      {
        title: 'A primary action and its variants',
        note: 'The halves share one edge, so the control lifts as a unit',
        html: `<div class="axi-btn-split">
  <button class="axi-btn axi-btn--primary">Go live</button>
  <button class="axi-btn axi-btn--primary axi-btn-split__toggle" aria-label="More stream actions" aria-haspopup="menu" aria-expanded="false">
    <svg class="axi-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="m18 15-6-6-6 6"/></svg>
  </button>
</div>`,
      },
      {
        title: 'The same control once the action turns destructive',
        note: 'An ink on both halves; the shared edge follows it',
        html: `<div class="axi-btn-split">
  <button class="axi-btn axi-ink-danger">End stream</button>
  <button class="axi-btn axi-ink-danger axi-btn-split__toggle" aria-label="More stream actions" aria-haspopup="menu" aria-expanded="false">
    <span class="axi-diamond axi-diamond--danger"></span>
    <svg class="axi-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="m18 15-6-6-6 6"/></svg>
  </button>
</div>`,
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
      '.axi-chip--action',
    ],
    summary: 'A one-word label on a thing. Filled asserts a value about it; the single outlined variant, in the cool ink, is commentary about it instead.',
    rules: [5, 6],
    knobs: [],
    notes: `The unmodified chip is a neutral fact - a platform, a count, a
language. The status modifiers assert, at full ink strength. \`--meta\` is the
only outlined variant and the only one drawn in \`--axi-meta\`, the cool ink
rule 6 keeps clear of every status meaning: that is what lets a reader tell a
maintainer's note from a measurement before reading either word.

\`--action\` is the one modifier that changes no colour. A chip turns up holding
a value the reader chose and can take back - the filters standing above a table
- and that is still a chip, because "DAMAGE" is data and "Clear all" is an
action. So it gains the hand and the block, and nothing else. A hover brighten
would weigh the same one class as the fill modifiers and win on source order,
putting a neutral back over a saturated ground; and there is nothing for a
brighten to add to a filled chip. The lift is the feedback.

A dismiss glyph inside a filled chip takes no colour of its own. Written with a
neutral from the ramp it measures 1.39:1 against the accent beside a label at
12.24:1 - not quieter, gone. \`currentColor\` is already the fill's contrast pair;
the trap is that saying nothing looks like an omission.`,
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
      {
        title: 'The filters standing above a table',
        note: 'Each chip is a value the reader picked; the button beside them is the one thing here whose label is an action',
        html: `<div class="axi-row" style="--axi-row-gap: 7px">
  <button class="axi-btn axi-btn--xs">Clear all</button>
  <button class="axi-chip axi-chip--accent axi-chip--action">Damage <span>&times;</span></button>
  <button class="axi-chip axi-chip--accent axi-chip--action">Boon uptime <span>&times;</span></button>
  <button class="axi-chip axi-chip--action">Unfilled, also a press <span>&times;</span></button>
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
    classes: ['.axi-pill', '.axi-pill--sm', '.axi-pill--xs'],
    summary: 'A filter toggle. Pressed, it fills with the colour of the thing it filters to, so the control reads as that thing rather than as a generic "selected".',
    rules: [4],
    knobs: ['--axi-pill-fill', '--axi-pill-pad', '--axi-pill-size'],
    notes: `A pill says which of several filters you chose; a switch says what
state one thing is in. State lives in \`aria-pressed\`, not in a modifier
class, so the accessibility tree and the appearance cannot disagree.
\`--axi-pill-fill\` is read through a fallback and never declared on the
component, which is what lets a consumer set it on the pill or on any
ancestor. A pressed pill already rests on a block, so hovering it deepens
that block rather than sliding it - the pressed-and-hovered case is spelled
out in the stylesheet because without it source order decided the answer.

It stands on the button's scale, with the button's two named steps and the same
numbers in them. The only thing a pill has that a button does not is a state, so
two of them carrying the same label have no business being different shapes -
and they were, the pill's sides measuring less than half the button's. Anything
holding a row of both wants them interchangeable.`,
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
      {
        title: 'The two steps, beside the button they share a scale with',
        note: 'A pill and a button at the same step are the same shape; only the state differs',
        html: `<div class="axi-row" style="--axi-row-gap: 8px">
  <button class="axi-btn">Button</button>
  <button class="axi-pill" aria-pressed="true" type="button">Pill</button>
</div>
<div class="axi-row" style="--axi-row-gap: 8px">
  <button class="axi-btn axi-btn--sm">Button sm</button>
  <button class="axi-pill axi-pill--sm" aria-pressed="true" type="button">Pill sm</button>
</div>
<div class="axi-row" style="--axi-row-gap: 8px">
  <button class="axi-btn axi-btn--xs">Button xs</button>
  <button class="axi-pill axi-pill--xs" aria-pressed="true" type="button">Pill xs</button>
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
    id: 'code',
    name: 'Code',
    layer: 'primitives',
    classes: ['.axi-code'],
    summary: 'A literal the reader types or recognises character for character: a slash command, a file extension, a config key.',
    rules: [3, 5],
    knobs: [],
    notes: `This style was always in the language, but only as \`.axi-prose
code\` - reachable only by adopting a whole typography layer for a document. A
consumer naming one command inside a sentence of interface copy cannot adopt
that layer without restyling the sentence, so it draws its own box instead. One
real consumer had three spellings across six spans, and the sixth had given up
and drawn no box at all.

\`.axi-code\` and \`.axi-prose code\` are one rule with two selectors, not
two rules that agree. They are the same object, and the last time this language
spelled one object twice the copies drifted; a test holds them in one rule.

Its size is in \`em\`, so a literal in body copy and a literal in a 10px
caption each track the text around them. A fixed size would make one of them
read as a different voice.

It sits on \`--axi-well-fill\` where \`.axi-kbd\` sits on \`--axi-surface\`,
and the reason is the same one written down there: a key is raised off what it
is printed on, and a quoted literal is sunk into it.`,
    examples: [
      {
        title: 'A command named inside interface copy',
        html: `<p class="axi-stack" style="max-width: 46ch">
  In Discord, run <code class="axi-code">/bridge pair</code> to link this channel.
</p>`,
      },
    ],
  },
  {
    id: 'link',
    name: 'Link',
    layer: 'primitives',
    classes: ['.axi-link'],
    summary: 'A word in interface copy that takes you somewhere else. The same object as a link in prose, and drawn by the same rule.',
    rules: [6],
    knobs: [],
    notes: `The trap \`.axi-code\` was pulled out of, one component later.
\`.axi-prose a\` was the only word for a link in this language, and it is
reachable only by adopting a whole typography layer - so a consumer with a
"learn more" beside a setting, or a docs URL in a modal footer, writes its own.
One real consumer had fifteen, hand-spelled, and a third of those were
\`<button>\`s calling a desktop bridge rather than anchors at all.

\`.axi-link\` and \`.axi-prose a\` are one rule with two selectors, for the
reason written at \`.axi-code\`: they are the same object, and the last time
this language spelled one object twice the copies drifted. A test holds them in
one rule.

The underline is stated rather than left to the user agent. An \`<a href>\`
draws one and a \`<button>\` does not, so inheriting it is precisely how the two
spellings would come apart - the declaration does nothing on the anchor and is
the whole thing on the button. The background, border and padding resets are
there for the same reason, and they are why a button can wear this class at all.

The face and size inherit; the weight does not. A link is 600 wherever it lands,
and \`font: inherit\` would be shorter and would quietly drop it.

Its hover is written \`:where(:hover)\` so it weighs one class and an ink
utility still lands on top. A link in a caption that says
\`axi-link axi-ink-dim\` has to stay dim under the cursor; the plain
\`:hover\` form is what once made the danger button read white under one.`,
    examples: [
      {
        title: 'A link in interface copy, and a quieter one beside an ink',
        html: `<div class="axi-stack" style="max-width: 52ch">
  <p>Reports publish to GitHub Pages. <button class="axi-link" type="button">See how it works</button></p>
  <p class="axi-ink-dim">Or <button class="axi-link axi-ink-dim" type="button">skip for now</button></p>
</div>`,
      },
    ],
  },
  {
    id: 'action',
    name: 'Quiet action',
    layer: 'primitives',
    classes: ['.axi-action', '.axi-action--glyph'],
    summary:
      'A control that is only its label. Not a button, which draws a box; not a link, which goes somewhere. It does something to the view you are already looking at.',
    rules: [3, 5, 6],
    knobs: ['--axi-action-hit'],
    notes: `The third chromeless control this language has needed and the first
one it names. \`.axi-link\` covers the word that takes you elsewhere and
\`.axi-btn--ghost\` covers the button that keeps its edge and drops its fill;
between them sat the small text action - "clear", "reset", "show all", "out /
in" - which draws nothing at all and had no word.

It was found by counting. One consumer had ninety of them and a class for none,
so each spelled out its own resting colour and its own hover colour: **fifteen
different hover colours across ninety sites**, every one a literal from a
utility palette rather than a token. That is ninety controls that left the theme
at the moment the cursor arrived.

Three of the ninety did worse than leave the theme. A control resting on the
warning ink hovered to a neutral grey; one resting on the danger ink hovered to
white. The verdict disappearing exactly when the reader reaches for it - the
same failure rule 6's addendum describes on \`.axi-btn\`, arriving by a
different road. There it was a component out-ranking its own modifier; here it
was an author naming a colour that had no business being named.

So the hover is \`:where(:hover)\`, and it carries a second signal that names
no colour. The brighten is a fallback the ink layer beats by design, which means
an inked action would otherwise get no hover feedback at all; an underline works
on amber, on red and on plain alike, and it is the mark this language already
uses for "actionable".

\`font: inherit\`, not the label font: these land at 10px in a chart legend,
11px in a section header and 14px in a modal, and a control that is only its
label has no business resizing the text around it. The weight inherits too,
which is where this parts company with \`.axi-link\` - a link is 600 wherever
it lands because it must be findable inside a paragraph, while an action already
sits where the reader is looking.

\`--glyph\` is for the action whose label is a single character: a clear-field
cross, a stepper arrow, a star. A glyph gives the pointer almost nothing to land
on, so this is the one thing the plain action does not need - a hit target, sized
by \`--axi-action-hit\`. The box stays invisible; only its size is declared.
It also takes the underline back, because there is no text under a glyph to
underline and the rule would only draw a stray mark beside it.`,
    examples: [
      {
        title: 'Quiet actions in a section header, and one that keeps its verdict',
        html: `<div class="axi-panel axi-stack">
  <div style="display:flex;align-items:center;gap:14px">
    <span style="font:var(--axi-t-label);letter-spacing:var(--axi-ls-label)">Boon uptime</span>
    <button class="axi-action" type="button" style="font-size:10px;text-transform:uppercase;letter-spacing:.16em">Show all</button>
    <button class="axi-action" type="button" style="font-size:10px;text-transform:uppercase;letter-spacing:.16em">Reset</button>
    <button class="axi-action axi-ink-danger" type="button" style="font-size:10px;text-transform:uppercase;letter-spacing:.16em">Clear fights</button>
  </div>
  <p class="axi-ink-dim" style="font-size:12px;margin:0">The third stays red under the cursor: the hover weighs one class, so the ink lands on top of it.</p>
</div>`,
      },
      {
        title: 'A glyph action: a field you can clear',
        html: `<div class="axi-panel" style="max-width:320px">
  <div style="position:relative">
    <input class="axi-input" value="Kroof" style="width:100%;padding-right:32px" aria-label="Filter players">
    <button class="axi-action axi-action--glyph" type="button" aria-label="Clear filter"
            style="position:absolute;right:4px;top:50%;transform:translateY(-50%)">&times;</button>
  </div>
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
\`--axi-well-fill\`: a key stands out of what it is printed on, and the bars and
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
