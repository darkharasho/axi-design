export default [
  {
    id: 'ink',
    name: 'Inks and edges',
    layer: 'utilities',
    classes: [
      '.axi-ink-ok', '.axi-ink-warn', '.axi-ink-danger', '.axi-ink-meta', '.axi-ink-accent',
      '.axi-ink-plain', '.axi-ink-dim', '.axi-ink-faint',
      '.axi-edge-ok', '.axi-edge-warn', '.axi-edge-danger', '.axi-edge-meta', '.axi-edge-accent',
      '.axi-edge-rule', '.axi-edge-line',
    ],
    summary: 'The five meanings and the three neutral steps, as single-purpose classes. For a mark that carries a status or a comment where there is no component to carry it - a number in a sentence, a word in a legend.',
    rules: [5, 6],
    knobs: [],
    notes: `An ink sets colour and an edge sets border-colour. Neither asserts
anything else - no size, no weight, no spacing, no surface, and an edge does not
assert that there is a border to colour.

They are not a shortcut past the chip or the status cap. When the verdict belongs
to a whole object, rule 5 wants a shape the eye finds, not a recoloured word
inside it. Reach for an ink when there is no object, only a mark.

There is no fill family on purpose. Rule 2 rules out colour at partial opacity
over the ground, and an opaque status fill behind arbitrary text is a chip, which
the language already ships.

These live in \`src/utilities.css\`, last in the cascade, so one class
overrules the component it sits inside without \`!important\`. The cost is
borne by components rather than by consumers: a base rule written
\`.axi-table td\` weighs a class and a type and would defeat the ink, so
element parts of a rule holding a consumer's content are wrapped in
\`:where()\`.`,
    examples: [
      {
        title: 'A status on a mark, and a comment beside it',
        html: `<p class="axi-prose">Uptime <strong class="axi-ink-ok">99.2%</strong> against a
<span class="axi-ink-warn">94%</span> floor <span class="axi-ink-meta">(rolling 30 days)</span>.</p>`,
      },
      {
        title: 'Inking a cell the table would otherwise dim',
        html: `<table class="axi-table">
  <thead><tr><th scope="col">Player</th><th scope="col">Downs</th><th scope="col">Deaths</th></tr></thead>
  <tbody>
    <tr><th scope="row">Vela</th><td class="axi-ink-plain">3</td><td class="axi-ink-danger">2</td></tr>
    <tr><th scope="row">Ouro</th><td class="axi-ink-plain">1</td><td class="axi-ink-ok">0</td></tr>
  </tbody>
</table>`,
      },
      {
        title: 'The three neutral steps',
        html: `<p class="axi-ink-plain">The reading.</p>
<p class="axi-ink-dim">Its supporting detail.</p>
<p class="axi-ink-faint">The label above both.</p>`,
      },
    ],
  },
  {
    id: 'sr-only',
    name: 'Screen-reader only',
    layer: 'utilities',
    classes: ['.axi-sr-only'],
    summary: 'Hides an element visually while leaving it in the accessibility tree. Use it for a label whose meaning is already carried visually by an icon.',
    rules: [],
    knobs: [],
    notes: `Not a visual component and not themed. It exists because several
components - the accent switcher's \`<label>\`, a close button's name - need a
name a screen reader can read and a sighted reader does not need to see.`,
    examples: [
      {
        title: 'Naming an icon-only control',
        html: `<label class="axi-sr-only" for="accent-demo">Accent colour</label>
<select class="axi-select" id="accent-demo"><option>Axi Gold</option></select>`,
      },
    ],
  },
  {
    id: 'dead',
    name: 'The dead state',
    layer: 'utilities',
    classes: [],
    selectors: [':disabled', '[aria-disabled="true"]'],
    summary: 'Every interactive object fades and refuses the pointer when it carries `disabled` or `aria-disabled="true"`. No class to add: the state is declared once, for all twenty-four of them.',
    rules: [],
    knobs: [],
    notes: `Twenty-four objects in this language are interactive - twenty-three
declare \`cursor: pointer\`, and the twenty-fourth is \`.axi-input\`, worn by both
the field and the textarea. Until 1.41.0 two of them said anything when
disabled. The rest were, computed-style for computed-style, identical to their
working selves and still promised \`cursor: pointer\`.

It fades rather than recolours, on purpose. A disabled control has to stay
recognisable as the control it is: whatever fill, border and ink said "primary"
or "danger" a moment ago should still say it, only fainter. Opacity does that to
every layer at once without naming any of them, and it is the only form the
state can take that does not fight the ink layer - a colour swap would take a
verdict away from a disabled \`.axi-action.axi-ink-danger\` instead of dimming
it.

Pointer events are left alone. \`:disabled\` already blocks activation, and
\`aria-disabled\` means "focusable, but ignore the action" - so the control can
still be reached and its title still read, which is the one piece of help a dead
control has to offer.`,
    examples: [
      {
        title: 'The same three controls, alive and dead',
        html: `<div class="axi-row">
  <button class="axi-btn axi-btn--primary">Publish</button>
  <button class="axi-btn axi-btn--primary" disabled>Publish</button>
  <button class="axi-action axi-ink-danger">Discard</button>
  <button class="axi-action axi-ink-danger" disabled>Discard</button>
  <input class="axi-input" value="report.json">
  <input class="axi-input" value="report.json" disabled>
</div>`,
      },
      {
        title: 'A link that cannot be followed yet',
        note: 'An anchor takes no `disabled`, so it says so the only way it can',
        html: `<a class="axi-link" href="#">Open the report</a>
<a class="axi-link" href="#" aria-disabled="true">Open the report</a>`,
      },
    ],
  },
  {
    id: 'scroll-quiet',
    name: 'Quiet scroll',
    layer: 'utilities',
    classes: ['.axi-scroll-quiet'],
    summary: 'A scrollbar down the side of a narrow strip is a channel, not information. The class says it for a consumer’s own scroller; the strips the language ships say it in the same rule.',
    rules: [],
    knobs: [],
    notes: `\`.axi-palette__list\`, \`.axi-rail\`, \`.axi-rail__nav\` and
\`.axi-split__nav\` are in the rule beside the class. One rule, not four that
agree — two rules that agree today are two rules that disagree after the next
edit.

The language had made this decision once, inline on the palette's list, and the
argument written there was about a *category*: at twelve rows behind a fixed cap
the bar reports a fact the row count in the bar has already given. Said only
there, no other strip could reach it, and the first consumer to need it for its
own rails wrote the rule five more times in its own stylesheet — twice with a
\`*\` descendant arm, because the element that actually scrolls sits one level
inside a component it does not control. That sledgehammer is what a consumer
reaches for when the language gives it no name. See "A style only reachable
through a layer will be re-invented" in docs/RULES.md.

**The strip is the test, and it is not "does this scroll".** A rail is 208px
wide and a palette list sits in a small floating panel, so the bar costs a
measurable share of the width *and* draws a second vertical line beside the
object's own edge. A table's horizontal bar is the opposite case, and
\`.axi-table__scroll\` keeps it on purpose: there the bar is the only thing
telling you a column is off-screen. Nothing in the rule reaches a descendant —
\`*\` would take that bar away the moment someone put a table in a rail.

Both \`.axi-rail\` and \`.axi-rail__nav\`, because either can be the scroller.
The rail declares \`overflow-y: auto\` and is the scroller by default, but a rail
with something pinned below its list — a "back" action at the floor — scrolls
the nav instead and leaves the rail still. Same strip; the decision cannot depend
on which one the consumer picked.`,
    examples: [
      {
        title: 'A consumer’s own scrolling strip',
        note: 'The well’s edge already says where the list ends',
        html: `<div class="axi-well axi-scroll-quiet" style="width: 190px; height: 110px">
  <div class="axi-rail__nav axi-rail__nav--quiet">
    <button class="axi-rail__item" aria-current="true">Meteor Shower</button>
    <button class="axi-rail__item">Lava Font</button>
    <button class="axi-rail__item">Flame Burst</button>
    <button class="axi-rail__item">Glyph of Storms</button>
    <button class="axi-rail__item">Fire Grab</button>
  </div>
</div>`,
      },
    ],
  },
]
