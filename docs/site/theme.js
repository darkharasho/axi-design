// The theme is applied as a data attribute on the root, which is exactly what
// dist/themes/<id>.css already selects on - so the switcher exercises the
// published mechanism rather than a preview only this site can do. There is no
// docs-only styling here at all: what a reader sees after switching is what
// their app gets from one import and one attribute.
const KEY = 'axi-theme'

// Unlike the accent, an unrecognised or absent value is not a failure to
// recover from: the main theme IS the language, and no attribute is its
// correct spelling. A retired theme therefore falls back to it silently, and
// so does a first visit. '' is a legal answer, never a missing one.
export function chooseTheme(saved, validIds) {
  return validIds.includes(saved) ? saved : ''
}

// One place that knows how the attribute is spelled, because "" has to remove
// it rather than set it to nothing: `[data-axi-theme=""]` matches no theme
// rule, but leaving the attribute on with an empty value would make the page
// claim a theme it is not wearing to anything else reading the DOM.
export function applyTheme(root, id) {
  if (id) root.setAttribute('data-axi-theme', id)
  else root.removeAttribute('data-axi-theme')
}

if (typeof document !== 'undefined') {
  const select = document.getElementById('theme')
  if (select) {
    const valid = [...select.options].map((o) => o.value).filter(Boolean)
    const chosen = chooseTheme(localStorage.getItem(KEY), valid)
    applyTheme(document.documentElement, chosen)
    select.value = chosen
    select.addEventListener('change', () => {
      applyTheme(document.documentElement, select.value)
      localStorage.setItem(KEY, select.value)
    })
  }
}
