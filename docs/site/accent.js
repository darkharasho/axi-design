// The accent is applied as a data attribute, which is exactly what
// dist/accents.css already selects on. The docs site therefore themes itself
// through the same published mechanism a consumer uses, rather than through a
// bespoke inline style only this site knows about.
const KEY = 'axi-accent'

// A persisted id can outlive the accent list: accents.json is versioned data
// and a returning visitor's localStorage is not. An unrecognised id must fall
// back to the first official accent rather than leave --axi-accent unset,
// because an unset accent is not a degraded page, it is an unthemed one.
export function chooseAccent(saved, validIds, fallbackId) {
  return validIds.includes(saved) ? saved : fallbackId
}

if (typeof document !== 'undefined') {
  const select = document.getElementById('accent')
  if (select) {
    const valid = [...select.options].map((o) => o.value)
    const chosen = chooseAccent(localStorage.getItem(KEY), valid, valid[0])
    document.documentElement.setAttribute('data-axi-accent', chosen)
    select.value = chosen
    select.addEventListener('change', () => {
      document.documentElement.setAttribute('data-axi-accent', select.value)
      localStorage.setItem(KEY, select.value)
    })
  }
}
