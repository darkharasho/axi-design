export default [
  {
    id: 'card',
    name: 'Card',
    layer: 'shells',
    classes: [
      '.axi-card',
      '.axi-card--strip',
      '.axi-card__head',
      '.axi-card__glyph',
      '.axi-card__title',
      '.axi-card__name',
      '.axi-card__kind',
      '.axi-card__meta',
      '.axi-card__go',
    ],
    summary: 'One thing you can open, drawn as a raised surface you press. Its optional top strip is the one place a card carries colour, and only when there is real data to put in it.',
    rules: [5, 4],
    knobs: ['--axi-card-strip'],
    notes: `The strip is opt-in because a coloured strip that means nothing is
decoration impersonating data, and it takes the first position the eye lands
on. Where it goes is part of rule 5: status colour **caps** the reading it is
a verdict on - a short bar across the head - rather than framing the box down
one edge, because a full-height stripe reads as the box's border and five
cards in a row become five coloured frames with the colour saying nothing
about any one of them. It is drawn with a pseudo-element from the card
itself, so a renderer never has to emit an extra element for it.

\`__meta\` is pushed to the bottom with \`margin-top: auto\`, so in an
equalised grid row every card's meta rule lands on the same line and the
rules read as continuous across the grid. The cost is empty space on cards
with less content, and it is worth it. \`__name\` truncates with an ellipsis
rather than wrapping, because a wrapping title changes the card's height and
takes the grid row with it.`,
    examples: [
      {
        title: 'A grid of cards, with and without a strip',
        note: 'The third card has nothing to encode, so it gets no strip',
        html: `<div class="axi-grid" style="--axi-grid-min: 280px">
  <a class="axi-card axi-card--strip" href="#" style="--axi-card-strip: var(--axi-ok)">
    <div class="axi-card__head">
      <span class="axi-card__glyph">OM</span>
      <span class="axi-card__title">
        <span class="axi-card__name">AxiOM</span>
        <span class="axi-card__kind">Launcher</span>
      </span>
    </div>
    <p>One launcher for every Axi app. Installs, updates and launches the whole suite.</p>
    <div class="axi-row" style="--axi-row-gap: 6px">
      <span class="axi-chip axi-chip--ok">Stable</span>
      <span class="axi-chip">Desktop</span>
    </div>
    <div class="axi-card__meta">Electron <span class="axi-card__go">Docs &rarr;</span></div>
  </a>
  <a class="axi-card axi-card--strip" href="#" style="--axi-card-strip: var(--axi-warn)">
    <div class="axi-card__head">
      <span class="axi-card__glyph">BR</span>
      <span class="axi-card__title">
        <span class="axi-card__name">AxiBridge</span>
        <span class="axi-card__kind">Log uploader</span>
      </span>
    </div>
    <p>Uploads arcdps logs, summarizes WvW fights, and posts readable reports to Discord.</p>
    <div class="axi-row" style="--axi-row-gap: 6px">
      <span class="axi-chip axi-chip--warn">Beta</span>
      <span class="axi-chip axi-chip--meta">arcdps</span>
    </div>
    <div class="axi-card__meta">Node <span class="axi-card__go">Docs &rarr;</span></div>
  </a>
  <a class="axi-card" href="#">
    <div class="axi-card__head">
      <span class="axi-card__glyph">LG</span>
      <span class="axi-card__title">
        <span class="axi-card__name">axilog</span>
        <span class="axi-card__kind">No strip</span>
      </span>
    </div>
    <p>A card with nothing to encode in a strip gets none. A coloured strip must mean something.</p>
    <div class="axi-card__meta">Rust <span class="axi-card__go">Docs &rarr;</span></div>
  </a>
</div>`,
      },
    ],
  },
  {
    id: 'window',
    name: 'Window',
    layer: 'shells',
    classes: ['.axi-window', '.axi-window__body'],
    summary: 'Chrome for a frameless desktop app, where the app is not a page inside a browser but the outermost thing on the screen.',
    rules: [3],
    knobs: [],
    notes: `A window is the most raised element there is, so under rule 3 it takes
the panel outline - and it is the one raised element in the language with no
block, because a block is an element's shadow on the surface behind it and
there is nothing behind a window this language is entitled to draw on.

\`__body\` is the scrolling region under the chrome; the window itself hides
overflow, so the titlebar stays put while content moves.`,
    examples: [
      {
        title: 'App chrome with a status row',
        html: `<div class="axi-window" style="height: 220px">
  <div class="axi-titlebar">
    <i class="axi-diamond axi-diamond--accent" aria-hidden="true"></i>
    AxiBridge — watching 4 folders
    <span class="axi-titlebar__btns">
      <button type="button" aria-label="Minimise">&minus;</button>
      <button type="button" aria-label="Maximise">&square;</button>
      <button type="button" aria-label="Close">&times;</button>
    </span>
  </div>
  <div class="axi-window__body" style="padding: 18px">
    <div class="axi-row">
      <span class="axi-chip axi-chip--ok">Watching</span>
      <span class="axi-chip">12 logs today</span>
      <span class="axi-chip axi-chip--meta">Auto-post on</span>
    </div>
  </div>
</div>`,
      },
    ],
  },
  {
    id: 'titlebar',
    name: 'Titlebar',
    layer: 'shells',
    classes: ['.axi-titlebar', '.axi-titlebar__btns'],
    summary: 'The drag strip across the top of a window, filled with the ink line so the app\'s content reads as sitting inside the outline rather than under a second toolbar.',
    rules: [4],
    knobs: [],
    notes: `Its buttons deliberately do not lift. A window button is chrome, not
content: it has nothing to lift off, and 44px of movement in the corner of
every screen is exactly the scattered motion rule 4 rations - so it answers
on the neutral ramp instead. Close is the one destructive control in the
chrome and the one place a status ink belongs in a titlebar, so it alone
answers in \`--axi-danger\`.

The strip is the drag handle (\`-webkit-app-region: drag\`) and \`__btns\`
opts back out of it, which is what makes the buttons clickable in Electron.`,
    examples: [
      {
        title: 'A titlebar inside its window',
        note: 'Hover the three buttons: the neutral ramp, then danger on close',
        html: `<div class="axi-window" style="height: 120px">
  <div class="axi-titlebar">
    <i class="axi-diamond axi-diamond--accent" aria-hidden="true"></i>
    AxiBridge — watching 4 folders
    <span class="axi-titlebar__btns">
      <button type="button" aria-label="Minimise">&minus;</button>
      <button type="button" aria-label="Maximise">&square;</button>
      <button type="button" aria-label="Close">&times;</button>
    </span>
  </div>
  <div class="axi-window__body" style="padding: 18px">
    <p style="margin: 0; font: var(--axi-t-small); color: var(--axi-text-dim)">The strip is the drag handle; the buttons opt back out of it.</p>
  </div>
</div>`,
      },
    ],
  },
  {
    id: 'drawer',
    name: 'Drawer',
    layer: 'shells',
    classes: ['.axi-drawer', '.axi-drawer__head', '.axi-drawer__body', '.axi-drawer__close'],
    summary: 'The detail surface: one thing, in depth, without losing the list behind it. Anchored to the right edge of the viewport and opened over a scrim.',
    rules: [3],
    knobs: ['--axi-drawer-width'],
    notes: `Rule 3's panel weight is what draws the edge - a single
\`border-left\`, not a box outline, and no block. A drawer is flush against
three sides of the viewport, so an outline on those sides would fall off the
screen and a block would fall behind it; the left border is the only edge
there is anything to separate.

Its head holds the title and never scrolls; \`__body\` is the scrolling
region. \`__close\` is a control, so it lifts like one - the only thing in the
drawer that does. Visibility is the \`hidden\` attribute rather than a
modifier class, so nothing can show the drawer while leaving it out of the
accessibility tree.`,
    examples: [
      {
        title: 'A detail drawer',
        note: 'Shown in flow here; in a real page it is fixed to the right edge and starts hidden',
        html: `<aside class="axi-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-demo-title" style="position: static; width: auto; height: 300px; --axi-drawer-width: 620px">
  <div class="axi-drawer__head">
    <button class="axi-drawer__close" type="button" aria-label="Close">&times;</button>
    <h2 id="drawer-demo-title">AxiBridge</h2>
    <p style="margin: 10px 0 0; font: var(--axi-t-small); color: var(--axi-text-dim)">One thing, in depth, without losing the list behind it.</p>
    <div class="axi-row" style="--axi-row-gap: 7px; margin-top: 13px">
      <span class="axi-chip axi-chip--warn">Beta</span>
      <span class="axi-chip">Node</span>
      <span class="axi-chip axi-chip--meta">arcdps</span>
    </div>
  </div>
  <div class="axi-drawer__body">
    <p class="axi-eyebrow">What it does</p>
    <div class="axi-prose">
      <p>Watches the arcdps log directory, uploads each new encounter, and posts a summary to a Discord webhook.</p>
      <ul><li>Automatic upload on file close</li><li>Per-squad routing</li><li>Retry with backoff</li></ul>
    </div>
  </div>
</aside>`,
      },
    ],
  },
  {
    id: 'scrim',
    name: 'Scrim',
    layer: 'shells',
    classes: ['.axi-scrim'],
    summary: 'The dimming layer between a drawer and the page under it. The one translucent surface in the language.',
    rules: [2],
    knobs: [],
    notes: `Rule 2 forbids colour at partial opacity over the ground, and the
scrim is where that boundary is worth understanding: \`--axi-scrim\` is the
ground itself at 72%, a neutral rather than an ink. Nothing is being made
quieter by fading a colour - the layer's whole job is to take contrast out of
what is behind it, which is what the ramp is for.

It is a \`<div>\` with \`border: 0\` and the \`hidden\` attribute rather than a
class, sitting one z-index below the drawer it belongs to. Clicking it closes
the drawer; that wiring is the consumer's.`,
    examples: [
      {
        title: 'The scrim over content',
        note: 'Shown in a positioned box rather than over the whole viewport',
        html: `<div style="position: relative; height: 140px; overflow: hidden">
  <div class="axi-panel">
    <p class="axi-eyebrow">Behind the scrim</p>
    <p style="margin: 0; font: var(--axi-t-small); color: var(--axi-text-dim)">Still readable, and clearly not the thing you are being asked to look at.</p>
  </div>
  <div class="axi-scrim" style="position: absolute"></div>
</div>`,
      },
    ],
  },
  {
    id: 'menu',
    name: 'Menu',
    layer: 'shells',
    classes: ['.axi-menu', '.axi-menu__pop'],
    summary: 'A disclosure hanging off a trigger: a panel-weight popover of checkboxes or links, not a permanent row of controls.',
    rules: [3],
    knobs: ['--axi-menu-width'],
    aliases: ['dropdown'],
    notes: `The popover is drawn at rule 3's panel weight on the raised surface,
because it floats above everything else on the page and the heavier step is
what says so. The trigger is an ordinary \`.axi-btn\` carrying
\`aria-expanded\` and \`aria-controls\`; this class only styles the panel it
opens, and the open/close wiring is the consumer's.

Its \`z-index: 41\` is one above \`.axi-mast\`, deliberately: both sit in the
root stacking context, so a toolbar scrolled under the sticky masthead would
otherwise open its menu behind it. Labels inside it need no class of their
own; a checkbox does, now that \`.axi-check\` exists as the styled path for
one - a bare \`<input type="checkbox">\` renders as unstyled OS chrome inside
the popover.`,
    examples: [
      {
        title: 'An open filter menu',
        note: 'Shown open; a real one starts with the hidden attribute set. The popover hangs below the trigger, so the room for it is reserved under the box, not inside it',
        html: `<div class="axi-menu" style="margin-bottom: 200px">
  <button class="axi-btn axi-btn--dashed" type="button" aria-expanded="true" aria-controls="menu-demo-pop">
    Filters <span class="axi-badge-count">3</span>
  </button>
  <div class="axi-menu__pop" id="menu-demo-pop" style="--axi-menu-width: 340px">
    <label><input type="checkbox" class="axi-check" checked> Injects into the client</label>
    <label><input type="checkbox" class="axi-check" checked> Simulates input</label>
    <label><input type="checkbox" class="axi-check" checked> Reads process memory</label>
    <label><input type="checkbox" class="axi-check"> Archived upstream</label>
    <label><input type="checkbox" class="axi-check"> No release artifacts</label>
  </div>
</div>`,
      },
    ],
  },
  {
    id: 'toolbar',
    name: 'Toolbar',
    layer: 'shells',
    classes: ['.axi-toolbar'],
    summary: 'The strip of controls above a list: search, sort, filters. A raised surface holding controls, wrapping rather than overflowing.',
    rules: [3],
    knobs: [],
    notes: `Rule 3's two steps nest here the way they do in a notice: the toolbar
takes the panel border and block, and every control inside it takes the
control step. That is the whole reason a toolbar is a component rather than a
\`.axi-row\` - it is a surface the controls sit on, and it has to be the
heavier of the two weights or the controls read as floating.

On a phone the panel step drops to the control step, because the offset
blocks eat horizontal room a narrow viewport does not have.`,
    examples: [
      {
        title: 'Search, sort and a filter menu',
        html: `<div class="axi-toolbar">
  <div class="axi-search" style="flex: 1 1 200px; max-width: 260px">
    <span class="axi-search__icon" aria-hidden="true">&#8981;</span>
    <label class="axi-sr-only" for="toolbar-demo-q">Search</label>
    <input class="axi-input" id="toolbar-demo-q" placeholder="Search…">
  </div>
  <label class="axi-sr-only" for="toolbar-demo-sort">Sort</label>
  <select class="axi-select" id="toolbar-demo-sort">
    <option>Sort: name</option>
    <option>Sort: newest</option>
  </select>
  <button class="axi-btn axi-btn--dashed" type="button" aria-expanded="false">Filters <span class="axi-badge-count">3</span></button>
</div>`,
      },
    ],
  },
  {
    id: 'mast',
    name: 'Masthead',
    layer: 'shells',
    classes: ['.axi-mast', '.axi-mast__in'],
    summary: 'The sticky bar across the top of a page, holding the brand, the tabs and whatever global control the app needs.',
    rules: [],
    knobs: [],
    notes: `It is not a raised element and takes no block: it is the top edge of
the page widened into a strip, with a single panel-weight \`border-bottom\`
and the ground as its background, so content scrolling under it disappears
behind an edge rather than sliding beneath a floating panel.

\`__in\` carries the page measure and gutter, which is why the masthead's
background can run the full width while its contents stay aligned with the
page below it. On a phone it loses its minimum height and the tabs become a
scrolling row.`,
    examples: [
      {
        title: 'Brand, tabs and an accent picker',
        html: `<header class="axi-mast" style="position: static">
  <div class="axi-mast__in">
    <a class="axi-brand" href="#">
      <span class="axi-sigil" aria-hidden="true">A</span>
      <span class="axi-brand__name">axi-design<small>Pattern gallery</small></span>
    </a>
    <nav class="axi-tabs">
      <a href="#" aria-current="page">Gallery</a>
      <a href="#">Components</a>
      <a href="#">Rules</a>
    </nav>
  </div>
</header>`,
      },
    ],
  },
  {
    id: 'brand',
    name: 'Brand',
    layer: 'shells',
    classes: ['.axi-brand', '.axi-brand__name'],
    summary: 'The sigil and the wordmark, as one link home. A nested <small> becomes the second line without a class of its own.',
    rules: [],
    knobs: [],
    notes: `Tight negative tracking on the name and uppercase micro type on the
\`<small>\` under it, so a two-line lockup reads as one mark rather than as a
heading with a subtitle. The whole thing is an \`<a>\` - the brand in a
masthead goes home, and making only the word clickable leaves a dead sigil
next to it.`,
    examples: [
      {
        title: 'The two-line lockup',
        html: `<a class="axi-brand" href="#">
  <span class="axi-sigil" aria-hidden="true">A</span>
  <span class="axi-brand__name">axi-design<small>Pattern gallery</small></span>
</a>`,
      },
    ],
  },
  {
    id: 'sigil',
    name: 'Sigil',
    layer: 'shells',
    classes: ['.axi-sigil'],
    summary: 'The brand mark: the family diamond scaled up with a glyph sitting upright on top of it.',
    rules: [7],
    knobs: [],
    notes: `Rule 7's motif at 34px. The diamond is a rotated pseudo-element
*behind* the text rather than a rotated box, which is what keeps the glyph
upright - rotating the element and counter-rotating the letter is the same
picture with twice the transforms and a letter that never quite lands.
\`isolation: isolate\` keeps the pseudo-element's negative z-index inside the
sigil instead of dropping it behind the masthead.

The glyph is content, so it is whatever letter the app owns; the sigil is
always \`aria-hidden\`, because the brand name beside it already says the
name.`,
    examples: [
      {
        title: 'The sigil on its own',
        html: `<span class="axi-sigil" aria-hidden="true">A</span>`,
      },
    ],
  },
  {
    id: 'tabs',
    name: 'Tabs',
    layer: 'shells',
    classes: ['.axi-tabs'],
    summary: 'Top-level navigation in a masthead. The current tab is filled and blocked; the rest are transparent until hovered.',
    rules: [],
    knobs: [],
    notes: `The current tab gets the same treatment as a pressed pill, because it
is the same idea: this one is on. It is marked with \`aria-current="page"\`
rather than a modifier class, so the appearance cannot disagree with what a
screen reader is told.

Each tab carries a control-weight border in \`transparent\` at rest, which
hover fills in from the rule ramp: the border is always there, so nothing
shifts by 3px when the cursor arrives. \`margin-left: auto\` pushes the set to
the end of the masthead.`,
    examples: [
      {
        title: 'A nav with one current tab',
        html: `<nav class="axi-tabs">
  <a href="#" aria-current="page">Gallery</a>
  <a href="#">Components</a>
  <a href="#">Rules</a>
  <a href="#">Theming</a>
</nav>`,
      },
    ],
  },
  {
    id: 'crumbs',
    name: 'Breadcrumbs',
    layer: 'shells',
    classes: ['.axi-crumbs', '.axi-crumbs__sep'],
    summary: 'The path to the page you are on. The separator is the family diamond, and the last crumb is marked with aria-current rather than filled.',
    rules: [7],
    knobs: [],
    aliases: ['breadcrumb', 'breadcrumbs'],
    notes: `The current crumb is not filled. Rule 5 reserves a fill for a state
a thing is in, and the last crumb is a position rather than a control that is
on - so it takes the full text ink and the label weight instead.`,
    examples: [
      {
        title: 'A three-level path',
        html: `<nav class="axi-crumbs" aria-label="Breadcrumb">
  <a href="#">Raids</a>
  <i class="axi-crumbs__sep" aria-hidden="true"></i>
  <a href="#">Wing 4</a>
  <i class="axi-crumbs__sep" aria-hidden="true"></i>
  <span aria-current="page">Deimos</span>
</nav>`,
      },
      {
        title: 'One level up',
        html: `<nav class="axi-crumbs" aria-label="Breadcrumb">
  <a href="#">Logs</a>
  <i class="axi-crumbs__sep" aria-hidden="true"></i>
  <span aria-current="page">2026-09-24</span>
</nav>`,
      },
    ],
  },
  {
    id: 'pages',
    name: 'Pagination',
    layer: 'shells',
    classes: ['.axi-pages', '.axi-pages__n', '.axi-pages__gap'],
    summary: 'A row of page links. The current page is filled and blocked, the same treatment the current tab gets, because it is the same idea: this one is on.',
    rules: [5],
    knobs: [],
    aliases: ['pagination', 'pager', 'paging'],
    notes: `\`.axi-pages__gap\` is the elided run between two page numbers. It is
the only thing in the row that is not a link, and it is never focusable.

Mark the current page with \`aria-current="page"\`, which is what draws the fill
- there is no \`--current\` modifier class to keep in sync with it.`,
    examples: [
      {
        title: 'A long run with an elision',
        html: `<nav class="axi-pages" aria-label="Pagination">
  <a class="axi-pages__n" href="#" aria-label="Previous">‹</a>
  <a class="axi-pages__n" href="#">1</a>
  <a class="axi-pages__n" href="#" aria-current="page">2</a>
  <a class="axi-pages__n" href="#">3</a>
  <span class="axi-pages__gap">…</span>
  <a class="axi-pages__n" href="#">9</a>
  <a class="axi-pages__n" href="#" aria-label="Next">›</a>
</nav>`,
      },
      {
        title: 'A short run',
        html: `<nav class="axi-pages" aria-label="Pagination">
  <a class="axi-pages__n" href="#" aria-current="page">1</a>
  <a class="axi-pages__n" href="#">2</a>
  <a class="axi-pages__n" href="#">3</a>
</nav>`,
      },
    ],
  },
  {
    id: 'modal',
    name: 'Modal',
    layer: 'shells',
    classes: ['.axi-modal', '.axi-modal__head', '.axi-modal__body', '.axi-modal__foot'],
    summary: 'A real <dialog>. Focus trapping, Esc-to-close, inertness and the top layer come from the browser rather than from a script this language does not ship.',
    rules: [3],
    knobs: ['--axi-modal-width'],
    aliases: ['dialog', 'popup', 'lightbox'],
    notes: `Open it with \`el.showModal()\`, not by setting the \`open\` attribute.
Only \`showModal()\` promotes the dialog to the top layer, makes the rest of the
page inert and draws the backdrop; the bare attribute renders it inline with
none of that, which is what the examples below do so they can sit in the page.

The examples' \`style="position: static; margin: 0"\` exists only so the demo
sits inline in the page - remove it when you open the dialog with
\`showModal()\`. The UA's \`dialog:modal\` rule sets \`position: fixed\` and the
base \`dialog\` rule sets \`margin: auto\` to centre it, and both are UA-origin
styles that lose to an inline author declaration; leave the inline style in
place and a dialog you open with \`showModal()\` still gets the top layer and
the backdrop, but is laid out in normal flow instead of centred over it -
typically pinned to the bottom-left of the document. \`.axi-drawer\` documents
the identical override for the same reason.

A \`<dialog>\` brings its own \`::backdrop\`, so the modal styles that rather than
reusing \`.axi-scrim\`. They look identical and are not the same element - the
alternative was giving up \`<dialog>\` and hand-rolling a focus trap.

The head and foot are divided from the body by rules rather than outlines:
they are parts of one raised thing.

Give the heading an \`id\` and point the dialog's \`aria-labelledby\` at it, or
the dialog announces with no name at all.`,
    examples: [
      {
        title: 'A confirmation',
        note: 'Shown inline with the open attribute so it sits in the page; a real one is opened with showModal() and draws a backdrop over everything. Remove position: static and margin: 0 when you do - they exist only to hold the demo in the page',
        html: `<dialog class="axi-modal" open aria-labelledby="modal-confirm-title" style="position: static; margin: 0">
  <div class="axi-modal__head">
    <span class="axi-diamond axi-diamond--danger"></span>
    <h2 id="modal-confirm-title">Delete this log?</h2>
  </div>
  <div class="axi-modal__body">This removes the parsed encounter and its shareable link. The file on disk is untouched.</div>
  <div class="axi-modal__foot">
    <button class="axi-btn axi-btn--ghost">Cancel</button>
    <button class="axi-btn axi-btn--primary">Delete</button>
  </div>
</dialog>`,
      },
      {
        title: 'A wider one, with a form in it',
        note: 'The width knob is clamped against the viewport, so a wide modal still fits a narrow window. Remove position: static and margin: 0 when opening it with showModal() - they exist only to hold the demo in the page',
        html: `<dialog class="axi-modal" open aria-labelledby="modal-upload-title" style="position: static; margin: 0; --axi-modal-width: 680px">
  <div class="axi-modal__head"><h2 id="modal-upload-title">Upload settings</h2></div>
  <div class="axi-modal__body">
    <label class="axi-row"><input type="checkbox" class="axi-check" checked> Parse on upload</label>
    <label class="axi-row"><input type="checkbox" class="axi-check"> Make the link public</label>
  </div>
  <div class="axi-modal__foot"><button class="axi-btn axi-btn--primary">Save</button></div>
</dialog>`,
      },
    ],
  },
  {
    id: 'accordion',
    name: 'Accordion',
    layer: 'shells',
    classes: ['.axi-accordion', '.axi-accordion__head', '.axi-accordion__body'],
    summary: 'A disclosure built on <details> and <summary>, so it opens and closes with no script and is announced as a disclosure.',
    rules: [3, 7],
    knobs: [],
    aliases: ['collapse', 'disclosure', 'expander'],
    notes: `The native marker is removed and replaced with the family diamond,
which turns from \`45deg\` to \`180deg\` on \`[open]\` - a 135° turn, not the
quarter the diamond's own 45° rest angle might suggest. A literal quarter
turn on a square lands back on the same silhouette and would erase the
open/closed cue, so the turn is bigger than "a quarter" on purpose. It is a
\`transform\`, so it sits inside rule 4's rationing of motion.

Stacked accordions are spaced by the block's own depth plus a gap, or each
one's block lands on the next one's outline.`,
    examples: [
      {
        title: 'A short FAQ',
        note: 'The first is open; open is a native attribute, not a class',
        html: `<details class="axi-accordion" open>
  <summary class="axi-accordion__head">What counts as an attempt?</summary>
  <div class="axi-accordion__body">Any pull with at least one damage event, whether or not the boss reached a phase change.</div>
</details>
<details class="axi-accordion">
  <summary class="axi-accordion__head">Why is my DPS different here?</summary>
  <div class="axi-accordion__body">Target damage only, measured over the active window rather than the whole pull.</div>
</details>`,
      },
      {
        title: 'One on its own',
        html: `<details class="axi-accordion">
  <summary class="axi-accordion__head">Advanced parser options</summary>
  <div class="axi-accordion__body">Everything here changes how a log is read, not how it is displayed.</div>
</details>`,
      },
    ],
  },
  {
    id: 'toast',
    name: 'Toast',
    layer: 'shells',
    classes: ['.axi-toasts', '.axi-toast', '.axi-toast__dot', '.axi-toast--ok', '.axi-toast--warn', '.axi-toast--danger'],
    summary: 'A stack of transient messages in the corner of the page. The CSS ships the region and the message; appearing and leaving on a timer are the consumer’s, because this language ships no script.',
    rules: [3, 5],
    knobs: [],
    aliases: ['snackbar', 'notification', 'flash'],
    notes: `Insert a \`.axi-toast\` into the region and remove it when it is done.
There is no timer here and no animation: that is the same contract \`.axi-menu\`
publishes for its open state, not a new kind of promise.

The region is \`pointer-events: none\` and each toast takes its events back;
the flex gaps between stacked toasts would otherwise eat clicks aimed at the
corner beneath them.

\`role="status" aria-live="polite"\` belongs on \`.axi-toasts\` itself, not on
each toast - that is the half of this contract the CSS cannot enforce. A live
region announces content inserted into it; a node with no live semantics
produces no announcement at all, and a toast is typically removed again
before a screen reader user could even navigate to find it. Skip the
attribute and every toast this markup ships is invisible to anyone not
looking at the screen.

A toast is control weight, not panel: four panels stacked over the page is a
wall.

The region lives at layer 60 - above the drawer, below the tooltip. See the
layer stack in the rules.`,
    examples: [
      {
        title: 'A stack of three',
        note: 'Shown in flow rather than fixed to the corner, so the demo can hold it',
        html: `<div class="axi-toasts" role="status" aria-live="polite" style="position: static">
  <div class="axi-toast"><i class="axi-toast__dot" aria-hidden="true"></i> Link copied to clipboard</div>
  <div class="axi-toast axi-toast--ok"><i class="axi-toast__dot" aria-hidden="true"></i> Upload finished — 3 logs parsed</div>
  <div class="axi-toast axi-toast--danger"><i class="axi-toast__dot" aria-hidden="true"></i> Could not reach the server</div>
</div>`,
      },
      {
        title: 'One with a name on it',
        html: `<div class="axi-toasts" role="status" aria-live="polite" style="position: static">
  <div class="axi-toast axi-toast--warn">
    <span class="axi-avatar" style="--axi-avatar-size: 24px">KJ</span>
    Kay left the squad
  </div>
</div>`,
      },
    ],
  },
]
