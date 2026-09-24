export default [
  {
    id: 'prose',
    name: 'Prose',
    layer: 'prose',
    classes: ['.axi-prose'],
    summary: 'One class on a container, styling the plain HTML inside it. A content pipeline can emit markdown with no classes at all and land inside the language.',
    rules: [3, 7],
    knobs: [],
    notes: `Long-form reading wants a different restraint from the rest of the
language: the offset blocks that make a card feel physical would make a
paragraph feel shouted. So nothing in here is blocked except the code block
and the table, which are genuinely objects dropped into the text rather than
part of its flow.

This is the one place rule 3's third weight lives. \`--axi-border-hairline\`
draws inline code, the table rules and the list bullet, because either form
step reads as too heavy for a line of running text - it is a prose rule
weight and never an outline on a raised thing. The bullet is rule 7's
diamond, drawn as a pseudo-element positioned against the list's own
indentation rather than a background image, so it moves with the text.

A link inside prose announces itself in the accent, which is the opposite of
the global default: a reader scanning an article is looking for links, and
inheriting the body ink would hide them.`,
    examples: [
      {
        title: 'Rendered markdown, unclassed',
        note: 'Every element inside is plain HTML - no class but the container',
        html: `<div class="axi-prose">
  <h1>Installing the suite</h1>
  <p>The fastest way to get every app is <a href="#">AxiOM</a>, which installs and updates the rest for you.</p>
  <h2>Requirements</h2>
  <p>The desktop apps run on <strong>Windows and Linux</strong>. Combat analysis additionally needs <code>arcdps</code> installed and loading correctly.</p>
  <ul>
    <li>A Guild Wars 2 installation</li>
    <li>An API key with the <code>account</code> and <code>guilds</code> scopes</li>
  </ul>
  <h3>Verifying the install</h3>
  <pre><code>axilog --version
axilog parse ./logs/20260920-wvw.zevtc --summary</code></pre>
  <blockquote><p>If the parser reports zero agents, arcdps wrote the log but the fight never started.</p></blockquote>
  <table>
    <thead><tr><th>App</th><th>Windows</th><th>Linux</th></tr></thead>
    <tbody>
      <tr><td>AxiOM</td><td>Yes</td><td>Yes</td></tr>
      <tr><td>AxiStream</td><td>Yes</td><td>NVENC only</td></tr>
    </tbody>
  </table>
  <hr>
  <h4>Next steps</h4>
  <p>Continue to <a href="#">your first fight report</a>.</p>
</div>`,
      },
      {
        title: 'Prose at the reading measure',
        note: 'Wrapped in a narrow page inside a panel, which is how a doc page is built',
        html: `<div class="axi-panel">
  <div class="axi-prose axi-page axi-page--narrow" style="--axi-page-pad: 0">
    <h3>First run, in order</h3>
    <ol>
      <li>Sign in with your API key.</li>
      <li>Point AxiBridge at your arcdps log directory.</li>
      <li>Paste a Discord webhook and send a test report.</li>
    </ol>
  </div>
</div>`,
      },
    ],
  },
  {
    id: 'quote',
    name: 'Pull-quote',
    layer: 'prose',
    classes: ['.axi-quote'],
    summary: 'A cited quotation, marked by an accent rule down its left edge - the only place in the language where colour marks a block rather than filling a shape.',
    rules: [],
    knobs: [],
    notes: `The exception is deliberate and narrow: the edge is attribution, not
status. It says these are someone else's words, which is why it may run the
full height of the block - the thing rule 5 refuses for a card strip,
precisely because a card strip is a verdict on a value and has to cap the
value it judges. A quote is not judging anything.

It is a \`<blockquote>\` with the class on it and no class inside; a nested
\`<cite>\` becomes the accented attribution line. Inside \`.axi-prose\`, an
unclassed \`<blockquote>\` already gets this treatment, so the class is for
quotes outside a prose block - a card, a drawer head, a panel.`,
    examples: [
      {
        title: 'A quote with its source',
        html: `<blockquote class="axi-quote">
  <p>Third-party programs are used at your own risk — ArenaNet tolerates addons rather than endorsing them.</p>
  <cite>GW2 Addon Risk Guide</cite>
</blockquote>`,
      },
    ],
  },
  {
    id: 'eyebrow',
    name: 'Eyebrow',
    layer: 'prose',
    classes: ['.axi-eyebrow'],
    summary: 'The small uppercase line that says what a panel\'s contents are. Set in the faint ink so it labels the content without competing with it.',
    rules: [],
    knobs: [],
    notes: `It is the language's answer to a panel heading: a \`<h2>\` inside a
panel of numbers is the wrong size and the wrong weight, and it lands in the
document outline as though the panel were a section. An eyebrow is typography
only - wide tracking, micro size, faint ink - and carries its own bottom
margin, so a panel's first element does not need one.

Put it on whatever element the document structure actually calls for: a
\`<p>\` where the panel is not a section, a real heading where it is.`,
    examples: [
      {
        title: 'Labelling a panel',
        html: `<div class="axi-panel" style="--axi-panel-pad: 18px">
  <p class="axi-eyebrow">Top damage — 47 fights</p>
  <p style="margin: 0; font: var(--axi-t-small); color: var(--axi-text-dim)">The label carries the scale, in words, so the chart under it does not need an axis for it.</p>
</div>`,
      },
    ],
  },
]
