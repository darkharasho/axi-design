export default [
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
