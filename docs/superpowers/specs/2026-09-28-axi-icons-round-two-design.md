# axi-icons round two: the glyphs the apps actually reach for

**Status:** draft, pending review
**Extends:** `2026-09-28-axi-icons-design.md` — rule 12, the seven translation
moves and the drawing contract are unchanged and are not restated here.

## Goal

Close the gap between what the set draws and what the axi suite imports, using
the apps' own `lucide-react` imports as the demand signal rather than taste.
Eleven new icons, taking the set from 47 to 58.

## The evidence

Every `lucide-react` import across the eight axi apps that depend on
`@axiapps/axi-design` or import lucide, normalised through lucide's deprecated
aliases (`AlertCircle` → `circle-alert`, `Loader2` → `loader-circle`,
`MoreHorizontal` → `ellipsis`, and twenty-odd more — without that
normalisation the set's coverage reads several points lower than it is).

**165 distinct icons in use. The 47 cover 37 of them — 22%.**

| app | distinct icons | covered | axi-design |
|---|---|---|---|
| axibridge | 114 | 31 (27%) | `^1.13.0` |
| axivale | 60 | 22 (37%) | `^1.10.0` |
| axiroster | 45 | 21 (47%) | `^1.10.0` |
| axistream | 29 | 15 (52%) | — |
| axipulse | 26 | 13 (50%) | `^1.8.0` |
| axiom | 18 | 11 (61%) | `^1.6.0` |
| axiam | 15 | 10 (67%) | `^1.8.0` |
| axiforge | 0 | — | `^1.10.0` |

Two findings from the scan matter more than the list itself.

**Nothing has adopted the set.** No app references `.axi-icon` or the sprite
anywhere. Every one still imports `lucide-react`. Until 1.14.0 that was not
their fault — the icons merged without a version bump, so the newest thing on
npm was a design language with no icons in it, and every app's range would
have resolved to a build without them. 1.14.0 fixes the availability half.
The adoption half is a migration, and it is the real work; see *Adoption*.

**axistream imports lucide but does not depend on axi-design.** It is in the
suite by name and not by dependency. Its 29 icons are counted above because
they are real demand, but it is a separate conversation from this one.

## What ships

The eleven icons wanted by three or more apps, minus the two that this
grammar will not draw honestly.

| icon | apps | the drawing |
|---|---|---|
| `loader-circle` | 6 | a square track with one corner open |
| `settings` | 6 | the gear — an eight-toothed square ring around a diamond hub |
| `shield` | 5 | square shoulders, 45° point at the bottom |
| `sparkles` | 4 | three four-armed twinkles, one large, two small |
| `activity` | 3 | the ECG polyline — already nothing but legal segments |
| `circle-help` | 3 | square frame, blocky hook, diamond dot |
| `crown` | 3 | zigzag over a base rule |
| `maximize-2` | 3 | two 45° arrows on the leading diagonal |
| `message-square` | 3 | square with a 45° tail off the lower left |
| `share-2` | 3 | three diamond nodes joined by two 45° connectors |
| `swords` | 3 | two crossed 45° blades |

Three of these carry real risk and the plan must treat them as such rather
than as eleven equal tasks:

- **`circle-help`.** The question mark's hook is a curve doing semantic work.
  Blocked at 90°/45° it becomes a shape with no name. If the hook does not
  read as a `?` at 24px, the icon does not ship and the apps keep
  `circle-alert` for "something needs your attention" and nothing for "what is
  this" — an honest absence.
- **`sparkles`.** The original spec's octagon-floor argument — a four-point
  star drawn at 45° cannot have concave vertices closer in than `R/√2`, so it
  reads as a lumpy diamond — applies here in full. The way out is to stop
  drawing the star as an outline and draw the twinkle as a **four-armed
  cross**: two strokes crossing at centre, arms tapering by being drawn at
  different lengths. The risk is that one twinkle alone reads as `plus`. The
  composition of three at different sizes is what disambiguates it, which is
  why `sparkle` (singular) is deliberately not in this tranche.
- **`settings`.** Eight teeth on a square ring is a lot of geometry inside the
  live area at 3px. If the interior closes up, the fallback is four teeth on
  the diagonals, which is a cruder gear but still unmistakably a gear.

`settings` does **not** replace `settings-2`. Lucide ships both names for two
different drawings — the gear and the sliders — and translation move 7 keeps
lucide's names. `settings-2` is the sliders and stays exactly as it is. That
it is currently used by no app is a fact about the apps, not about the glyph.

## What does not ship, and why

- **`star`** (3 apps). The original spec ruled this undrawable and the ruling
  stands: five points need 36° and 72°, and the four-point substitute hits the
  same `R/√2` floor described above. Three apps now want it, which changes the
  cost of the absence but not the geometry. The substitution is documented
  rather than drawn: where `star` means *featured* or *special*, the apps use
  `sparkles`; where it means *rating* or *favourite*, they use a filled
  `.axi-diamond`, which is already how rule 5 draws status. Both go in the
  icons page's substitution table.

- **`triangle-alert`** (3 apps). Not an absence — a **duplicate**. A 45°-only
  isoceles triangle is forced to 2:1 tall-to-wide, which is a spike rather
  than a warning sign. But this language already has a warning shape: the
  original spec's translation move 2 gives the diamond to `circle-alert` and
  its status siblings *precisely because the diamond frame reads as a warning
  sign*. `triangle-alert` and `circle-alert` are therefore the same icon here.
  It ships as an alias of `circle-alert`, not as a drawing.

- **`circle`** (2 apps, listed here because the reason is the same). The set
  has `square`. A circle is the one boundary this grammar has already decided
  not to draw.

### Ruling: an alias resolves in the sprite

`icons.json` already carries an `aliases` field, but today it is search
metadata — it makes the docs page find `triangle-alert`, and then
`<use href="…#axi-triangle-alert"/>` resolves to nothing and renders an empty
box. That is the worst of both: the name is discoverable and does not work.

So the build emits a `<symbol>` per alias, whose body is a single `<use>`
pointing at the canonical symbol. Twelve extra lines in `scripts/build.mjs`,
a few hundred bytes in the sprite, and the payoff is that an app porting off
lucide can rewrite `AlertTriangle` → `axi-triangle-alert` mechanically instead
of auditing every call site to discover which names silently became something
else. `dist/icons/<alias>.svg` is **not** emitted — a file per alias is real
weight for a case (`<img src>`, `mask-image`) where the consumer is writing
the path by hand anyway and can write the canonical one.

The test suite gains the matching assertion: every alias in the manifest has a
symbol, every alias symbol points at a canonical name that exists, and no
alias collides with an icon name.

## Adoption

Availability was the blocker and 1.14.0 removed it. Adoption is the next one,
and it is not this repo's code — it is seven apps' worth of import rewriting.
This spec does not plan that work, but it owes it two things:

1. **A substitution table on the `/icons` page**: for every lucide name an axi
   app currently imports that this set will not draw — `star`, `circle`,
   `flame`, `skull` and the rest of the curve-bound shapes — what to use
   instead, or an explicit "stay on lucide for this one". A migration that
   answers 22% of its own questions gets abandoned; one that answers all of
   them gets done.

2. **An honest statement that the hybrid is sanctioned.** 165 distinct icons
   against a set that will realistically reach 60–70 means the apps import
   from both for the foreseeable future. This is not a failure of the set. The
   package already ships lucide's licence file and the original spec was
   explicit that the vocabulary is borrowed and the drawings are not. Saying
   so on the page stops every app from re-deciding it alone.

## Out of scope

- **The 21 two-app icons and the 94-icon single-app tail.** The tail is 57% of
  distinct demand and 60% of it is axibridge alone. It is a later tranche, and
  the two-app list is the obvious next one — but the value of this tranche is
  that eleven drawings serve six apps, and that ratio collapses immediately
  after.
- **Animating `loader-circle`.** The drawing is static; the spin is the
  consumer's `animation`. Rule 4 rations motion and rule 11 would govern it,
  and neither question needs an answer to ship the glyph.
- **The ten drawn-but-unused glyphs** (`arrow-right`, `check-check`, `file`,
  `filter`, `menu`, `save`, `settings-2`, `skip-forward`, `unlock`,
  `volume-2`). No app imports them. They stay: the set is a vocabulary, not a
  usage report, and every one of them is a word an app will want the week
  after it is deleted.
- **axistream.** It imports lucide and does not depend on this package.
  Whether it joins the suite properly is a question for the suite.
