export default [
  {
    id: 'spinner',
    name: 'Spinner',
    layer: 'feedback',
    classes: ['.axi-spinner'],
    summary: 'The family diamond, turning. It animates transform only, so it keeps moving when the main thread is blocked by the work it is reporting on.',
    rules: [7, 11],
    knobs: ['--axi-spinner-size'],
    aliases: ['loader', 'loading', 'busy', 'progress'],
    notes: `Rule 11 is why this is a rotation and not a growing bar. A spinner
animated by layout or paint freezes with the work it reports on, and a frozen
spinner tells the reader the app has crashed at the exact moment it is working
hardest.

The loop runs \`45deg\` to \`405deg\` - one full turn that starts and ends on the
motif. That also makes it correct under \`prefers-reduced-motion\` for free:
\`base.css\` collapses the animation to a single instant iteration, parking it at
405deg, which looks exactly like the 45deg it started at.`,
    examples: [
      {
        title: 'Beside a label',
        html: `<div class="axi-row"><span class="axi-spinner"></span> Parsing…</div>`,
      },
      {
        title: 'Larger, on its own',
        html: `<span class="axi-spinner" style="--axi-spinner-size: 34px"></span>`,
      },
    ],
  },
  {
    id: 'meter-busy',
    name: 'Indeterminate meter',
    layer: 'feedback',
    classes: ['.axi-meter--busy'],
    summary: 'The meter that does not know how far along it is. The fill keeps a fixed width and travels, because rule 11 forbids animating width.',
    rules: [9, 11],
    knobs: [],
    aliases: ['progress', 'progressbar', 'indeterminate', 'loading'],
    notes: `\`--axi-meter-v\` is ignored in this mode. There is no value to
express, which is what indeterminate means - use a plain \`.axi-meter\` the moment
you know the proportion.

Under \`prefers-reduced-motion\` the fill parks full and still. Without that it
would park where the animation ends, which is clean off the right-hand end of
the track: a reader who turns motion off would be shown an empty bar.`,
    examples: [
      {
        title: 'Working, with no idea how far',
        html: `<div class="axi-meter axi-meter--busy"><div class="axi-meter__fill"></div></div>`,
      },
      {
        title: 'Beside the determinate meter it becomes',
        note: 'The same component; the busy one simply has no value yet',
        html: `<div class="axi-stack">
  <div class="axi-meter axi-meter--busy"><div class="axi-meter__fill"></div></div>
  <div class="axi-meter"><div class="axi-meter__fill" style="--axi-meter-v: 62%"></div></div>
</div>`,
      },
    ],
  },
]
