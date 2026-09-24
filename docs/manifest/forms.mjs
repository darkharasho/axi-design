export default [
  {
    id: 'check',
    name: 'Checkbox and radio',
    layer: 'forms',
    classes: ['.axi-check', '.axi-radio'],
    summary: 'Real checkbox and radio inputs with the browser control painted out. They submit, tab and toggle with no script, because they are the control rather than a picture of one.',
    rules: [5, 7],
    knobs: ['--axi-check-size', '--axi-check-fill'],
    aliases: ['checkbox', 'toggle'],
    notes: `Both are square. \`--axi-radius\` is \`0\`, so a round radio would be
the only rounded shape in the language - they are told apart by their mark
instead, and the radio's is the family diamond. Set \`--axi-radius-sm\` and both
round together, along with every other control.

They share \`--axi-check-size\` and \`--axi-check-fill\` deliberately: a form
holding both should not need two properties set to the same value to keep its
controls even.

There is no focus style in \`forms.css\`. The page-wide \`:focus-visible\` ring in
\`base.css\` covers these, and \`appearance: none\` does not remove it.`,
    examples: [
      {
        title: 'A set of checkboxes',
        html: `<label class="axi-row"><input type="checkbox" class="axi-check" checked> Parsed</label>
<label class="axi-row"><input type="checkbox" class="axi-check"> Uploaded</label>
<label class="axi-row"><input type="checkbox" class="axi-check" disabled> Archived</label>`,
      },
      {
        title: 'A radio group',
        note: 'The mark is the diamond, which is what tells a radio from a checkbox at this radius',
        html: `<label class="axi-row"><input type="radio" name="cadence" class="axi-radio" checked> Daily</label>
<label class="axi-row"><input type="radio" name="cadence" class="axi-radio"> Weekly</label>`,
      },
      {
        title: 'A checkbox for something destructive',
        note: 'The fill is read through a fallback, so it can be set on the control or any ancestor',
        html: `<label class="axi-row"><input type="checkbox" class="axi-check" checked style="--axi-check-fill: var(--axi-danger)"> Delete the source file too</label>`,
      },
    ],
  },
]
