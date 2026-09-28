// Filtering the icon grid. Fifty entries, so a scan is the whole algorithm -
// and a dependency-free scan is one less thing between a keystroke and a
// result, the same reasoning search.js gives for the component index.
//
// Exported separately from the DOM binding below so it can be tested without a
// browser: the ranking is the part that can be wrong, and a test that needs a
// page to run is a test nobody runs.
export function iconMatches(query, index) {
  const q = query.trim().toLowerCase()
  // An empty box is not "no results" - it is "no filter". Clearing the field
  // has to bring the whole set back, or the grid is a dead end.
  if (!q) return index
  const scored = []
  for (const entry of index) {
    let score = 0
    if (entry.name.startsWith(q)) score = 3
    else if (entry.name.includes(q)) score = 2
    else if (entry.keywords.includes(q)) score = 1
    if (score) scored.push({ entry, score })
  }
  return scored
    .sort((a, b) => b.score - a.score || (a.entry.name < b.entry.name ? -1 : 1))
    .map((s) => s.entry)
}

// The binding. Tiles carry their own terms in data-keywords, so the index is
// read from the page rather than fetched - the grid is already there, and a
// second request for what is on screen would be the slower way to do it.
if (typeof document !== 'undefined') {
  const field = document.querySelector('[data-icon-filter]')
  const grid = document.querySelector('.docs-icons')
  if (field && grid) {
    const tiles = [...grid.querySelectorAll('.docs-icon')]
    const index = tiles.map((el) => ({
      name: el.dataset.name,
      keywords: el.dataset.keywords,
      el,
    }))
    const empty = document.querySelector('[data-icon-empty]')
    field.addEventListener('input', () => {
      const hits = new Set(iconMatches(field.value, index).map((e) => e.el))
      for (const el of tiles) el.hidden = !hits.has(el)
      if (empty) empty.hidden = hits.size > 0
    })
  }
}
