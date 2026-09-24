import primitives from './primitives.mjs'
import forms from './forms.mjs'
import layout from './layout.mjs'
import shells from './shells.mjs'
import data from './data.mjs'
import feedback from './feedback.mjs'
import prose from './prose.mjs'
import utilities from './utilities.mjs'

// Sidebar order. Not the order of src/ - that file split is by cascade
// order, not by category, and the two genuinely differ (.axi-panel is defined
// in primitives.css and documented under Layout).
export const LAYERS = ['primitives', 'forms', 'layout', 'shells', 'data', 'feedback', 'prose', 'utilities']

// Static routes the generator writes. A component id may not take one.
export const RESERVED_IDS = [
  'index', 'start', 'rules', 'theming', 'components', 'gallery', 'search', 'llms',
]

const BY_LAYER = { primitives, forms, layout, shells, data, feedback, prose, utilities }

export function entries() {
  return LAYERS.flatMap((layer) => BY_LAYER[layer] ?? [])
}

export function byLayer() {
  return LAYERS.map((layer) => ({ layer, items: BY_LAYER[layer] ?? [] })).filter((g) => g.items.length)
}

export function findEntry(id) {
  return entries().find((e) => e.id === id)
}
