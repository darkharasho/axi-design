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
\`base.css\` collapses the animation to a single instant iteration but never
sets \`animation-fill-mode\`, so once that instant run finishes the element
reverts to its specified \`transform: rotate(45deg)\` - the motif at rest,
which looks exactly like where the loop begins.

A spinner alone only ever conveys "busy" to a sighted reader; it carries no
text and no state anyone else can query, so pair it with \`role="status"\` on
the region reporting the work, or with an \`.axi-sr-only\` label naming what is
happening - the same class this project already reaches for whenever
something needs to be read but not seen.`,
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
    aliases: ['indeterminate', 'loading'],
    notes: `\`--axi-meter-v\` is ignored in this mode. There is no value to
express, which is what indeterminate means - use a plain \`.axi-meter\` the moment
you know the proportion.

\`base.css\` never sets \`animation-fill-mode\` under \`prefers-reduced-motion\`,
only \`animation-duration\` and \`animation-iteration-count\` - so the
\`animation\` shorthand here, which resets fill-mode to \`none\`, means the fill
reverts to its specified style once the .01ms run finishes: \`transform: none\`
and the fill's own \`width: 25%\`, a left-anchored quarter-width bar. That is
already the right thing to show - visible, and unmistakably not finished -
so the override only states \`transform: none\` explicitly rather than
relying on the revert. It deliberately does not force the fill to full width:
a full bar reads as done, and this component is reporting work that is not
telling you how far along it is.`,
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
  {
    id: 'skeleton',
    name: 'Skeleton',
    layer: 'feedback',
    classes: ['.axi-skeleton', '.axi-skeleton--figure', '.axi-skeleton--chip', '.axi-skeleton--tile'],
    summary: 'A placeholder bar for text or a figure that is still loading. It sits inside the real element, so the finished content lands where the bar was.',
    rules: [1, 2, 11],
    knobs: ['--axi-skeleton-w'],
    aliases: ['placeholder', 'loading', 'shimmer', 'ghost'],
    notes: `Put the bar inside the element it stands in for - a \`.axi-stat__n\`,
a table cell, a row name - never beside it. Its height is a fraction of that
element's font, so when the data lands the text takes the same line box and
nothing below it moves. Keep the surrounding markup real as well: the real
table head, the real stat labels. A skeleton is the finished view with its
data missing, not a drawing of one.

Set the length with \`--axi-skeleton-w\`. Vary it from a fixed list rather than
at random, so a re-render draws the same skeleton instead of a twitching one.

The sweep is a flat band moved by \`transform\` (rule 11), not a feathered
gradient (rule 1). Under \`prefers-reduced-motion\` the band is not drawn and
the bar holds still. Mark the region that holds skeletons with
\`aria-busy="true"\` and a label naming what is loading; the bars themselves
say nothing to a screen reader.`,
    examples: [
      {
        title: 'Each variant',
        html: `<div class="axi-row"><span class="axi-skeleton" style="--axi-skeleton-w: 120px"></span><span class="axi-skeleton axi-skeleton--figure" style="--axi-skeleton-w: 56px"></span><span class="axi-skeleton axi-skeleton--chip"></span><span class="axi-skeleton axi-skeleton--tile"></span></div>`,
      },
      {
        title: 'Inside a stat',
        html: `<div class="axi-stat"><b class="axi-stat__n"><span class="axi-skeleton axi-skeleton--figure" style="--axi-skeleton-w: 56px"></span></b><span class="axi-stat__k">Members</span></div>`,
      },
    ],
  },
]
