// Ranked: a name match beats a class match beats a summary match. The index is
// thirty-odd entries, so there is no call for anything cleverer than a scan -
// and a dependency-free scan is one less thing between a keystroke and a result.
export function matches(query, index) {
  const q = query.trim().toLowerCase().replace(/^\./, '')
  if (!q) return []
  const scored = []
  for (const entry of index) {
    const name = entry.name.toLowerCase()
    const cls = entry.classes.join(' ').toLowerCase()
    // An alias is a synonym a reader arrives with from another framework -
    // "alert" for the notice, "progress" for the meter. It scores below every
    // class match and above a summary match: a synonym is a better signal
    // than a word that happens to appear in a sentence, and a worse one than
    // the component's actual name.
    const alias = (entry.aliases ?? []).join(' ').toLowerCase()
    let score = 0
    if (name.startsWith(q)) score = 3
    else if (name.includes(q)) score = 2
    else if (cls.includes(q)) score = 1.5
    else if (alias.split(' ').includes(q)) score = 1.25
    else if (entry.summary.toLowerCase().includes(q)) score = 1
    if (score) scored.push({ entry, score })
  }
  return scored.sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name))
    .map((s) => s.entry)
}

if (typeof document !== 'undefined') {
  const input = document.getElementById('q')
  const results = document.getElementById('results')
  if (input && results) {
    const base = document.documentElement.dataset.base ?? '/'
    const loaded = fetch(`${base}search.json`).then((r) => r.json())
    input.addEventListener('input', async () => {
      const found = matches(input.value, await loaded).slice(0, 8)
      // e.layerName is the projected display name (search.js is a browser
      // module and cannot import LAYER_NAMES from shell.mjs, which reads
      // process.env) - every other surface on the site shows the display
      // name, never the raw layer id.
      results.innerHTML = found.map((e) =>
        `<a href="${base}components/${e.id}/"><strong>${e.name}</strong><small>${e.layerName}</small></a>`).join('')
      results.hidden = found.length === 0
    })
    input.addEventListener('blur', () => setTimeout(() => { results.hidden = true }, 150))
  }
}
