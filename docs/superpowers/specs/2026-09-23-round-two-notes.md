# Round-two notes

What the coverage gate and the writing of 31 new manifest entries exposed. One
line per item; none of it is in scope for the docs site itself, and it is
recorded here so round two does not have to re-derive it.

## Components that had no natural home

- **`.axi-scrim`** — not a component anyone reaches for on its own; it is half of
  the drawer. It has its own entry because it has its own class, and the entry
  is thin by necessity.
- **`.axi-eyebrow`** — documented under Prose, but every real use is a label on
  a *data* panel. It is typography, so Prose is the least wrong layer; a
  "typography" layer would fit it, `.axi-brand__name` and the display scale
  better than Prose does.
- **`.axi-badge-count`** — the only filled shape in the language with no outline
  of its own. Defensible (it always sits inside something outlined) but it is a
  standing exception to rule 3's shape, not just its weights.
- **`.axi-sr-only`** — the case the no-exclusion-list rule exists for. Real
  entry under `utilities`, as planned; nothing further needed.

## Components with no rule to cite

`rules: []` on an entry is a signal, not an omission. These five are the ones
where the gap is about the *language* rather than about the entry:

- **`.axi-input` / `.axi-search`** — a field is outlined at the control weight
  and carries no block, which is neither of rule 3's two cases: it is a well cut
  into a surface, not a raised thing. Nothing in RULES.md says so. Either rule 3
  gains a sentence about inset controls or the language gains a rule.
- **`.axi-badge-count`** — see above; an unoutlined fill has no clause.
- **`.axi-tabs`** — a filled, blocked current tab is the pressed-pill idea, which
  rule 4 mentions only in passing and rule 5 does not cover at all (a current
  tab is not a status about a thing).
- **`.axi-quote`** — colour marking a block rather than filling a shape. Rule 5
  explains why a *card strip* may not do this; nothing states the attribution
  exception the quote relies on.
- **Layout (`.axi-page`, `.axi-grid`, `.axi-row`, `.axi-stack`)** — correctly
  rule-free. No clause is wanted here; noting it so it is not re-litigated.

## Rule 11 has no component

Rule 11 governs "an indicator of work" and the language ships no spinner, no
progress strip and no pulse. It is the only one of the eleven clauses that no
entry cites. Either round two ships the indicator the rule was written for, or
the rule is documenting a component that does not exist.

## Three places RULES.md and src/ disagree

Found while checking clauses before citing them. All three are documentation
bugs, not CSS bugs — nothing in `src/` was touched.

1. **Rule 5, card weight.** "Under rule 3 the cap is drawn at the panel weight;
   the card itself keeps its plain ink outline at the control weight." `.axi-card`
   is `--axi-border-panel` with `--axi-offset-panel`. The card is panel weight.
2. **Rule 8's counterpart** says an actionable list row is a card at the control
   step, "not panel", for the nesting reason. Same contradiction as (1): there is
   only one `.axi-card` and it is panel weight. Either the card gains a
   control-weight modifier or both clauses need correcting.
3. **Rule 3, hairline scope.** "used only inside `.axi-prose` … never an outline
   on a raised thing." `.axi-tooltip` borders with `--axi-border-hairline`. The
   tooltip is arguably not "raised" (it has no block), but "only inside
   `.axi-prose`" is false as written.

`.axi-card`'s entry cites rules 5 and 4 rather than the plan's `[3, 4]`
partly because of (1): rule 3's clause, followed from the card, currently
misdescribes the card.

## Gaps noticed while writing examples

- **No form field beyond a bare input.** No label, help text or error state
  component, and no `--danger` modifier on `.axi-input` — a field that failed
  validation has nothing to say so with. No textarea, no number/stepper.
- **No checkbox or radio.** `.axi-menu__pop` styles native checkboxes by
  descendant selector with `accent-color`, so a checkbox outside a menu popover
  is unstyled OS chrome. This is the most visible hole in the primitives.
- **No modal dialog.** `.axi-drawer` is the only overlay surface; a centred
  confirm dialog has to be hand-built from `.axi-panel` and `.axi-scrim`.
- **No in-page tablist.** `.axi-tabs` is masthead navigation and assumes
  `margin-left: auto` into a `.axi-mast__in`; a tabbed panel body needs a
  different component.
- **The tooltip is half a component.** The class draws the box; measuring the
  trigger and setting `left`/`top` is consumer script, with `gallery.js` as the
  only reference. Its demo has to override `position` to be visible at all.
- **No table sort affordance**, no empty state, no pagination — the three things
  a real list view needs next to `.axi-table`.
- **No heatmap, deliberately** (rule 9). Recorded so it is not filed as a gap.

## One id collision the plan did not anticipate

`.axi-search` was slated for the id `search`, which is in `RESERVED_IDS` (the
generator writes a static `/search/` route). Shipped as `search-input`, name
"Search input". Worth knowing that the reserved list already bites at 38
entries: `components`, `rules`, `theming` and `gallery` are all plausible
future component names.
