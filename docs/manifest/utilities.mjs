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
]
