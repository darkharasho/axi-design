// Gallery behaviour only - the design language ships no JavaScript.
// Every interactive component in the system (the menu disclosure, the drawer)
// is CSS plus a `hidden` attribute and an aria state; this file is the minimum
// needed to toggle those so the gallery can show both states, and it doubles
// as the reference for what a consumer has to wire up themselves. Because it
// is a reference, the accessibility wiring is here in full rather than left as
// an exercise: a disclosure that only Escape-less mouse users can close, or a
// drawer the screen reader announces as a sidebar, is the kind of gap that
// propagates into every app that copies this file.

const accent = document.getElementById('accent')
accent.addEventListener('change', () => {
  document.documentElement.style.setProperty('--axi-accent', accent.value)
})

/* ---------- menu disclosure ---------- */
// The trigger carries aria-expanded and aria-controls; the popover is toggled
// with `hidden`. A popover that swallows the page until you click the trigger
// again is a trap, so both Escape and a click outside close it - and Escape
// returns focus to the trigger, since that is where the user was.
const trigger = document.getElementById('menu-trigger')
const pop = document.getElementById('menu-pop')
const setMenu = (open) => {
  trigger.setAttribute('aria-expanded', String(open))
  pop.hidden = !open
}
trigger.addEventListener('click', () => {
  setMenu(trigger.getAttribute('aria-expanded') !== 'true')
})
document.addEventListener('click', (e) => {
  if (pop.hidden) return
  if (pop.contains(e.target) || trigger.contains(e.target)) return
  setMenu(false)
})

/* ---------- drawer ---------- */
// role="dialog" + aria-modal are in the markup; the trapping is here. `inert`
// on everything behind the drawer does almost all of it for free - it removes
// the background from the tab order and from the accessibility tree in one
// attribute, which is both less code and more correct than a hand-rolled
// focus-cycling trap. The wrap-around below only exists because the drawer
// itself still has a first and last focusable.
const drawer = document.getElementById('drawer')
const scrim = document.getElementById('scrim')
const opener = document.getElementById('open-drawer')
const background = [document.querySelector('.axi-mast'), document.querySelector('main')]
const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'

const setDrawer = (open) => {
  drawer.hidden = !open
  scrim.hidden = !open
  for (const el of background) el.inert = open
  if (open) document.getElementById('close-drawer').focus()
  // Focus must come back to the control that opened it, or the user lands at
  // the top of the document and has to find their place again.
  else opener.focus()
}

opener.addEventListener('click', () => setDrawer(true))
document.getElementById('close-drawer').addEventListener('click', () => setDrawer(false))
scrim.addEventListener('click', () => setDrawer(false))

drawer.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab') return
  const items = [...drawer.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null)
  if (!items.length) return
  const first = items[0]
  const last = items[items.length - 1]
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
})

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return
  if (!drawer.hidden) setDrawer(false)
  else if (!pop.hidden) {
    setMenu(false)
    trigger.focus()
  }
})

// The switches flip. Their whole state lives in aria-checked, so there is
// nothing else to keep in sync - and a switch you cannot work is a switch you
// cannot check against the accent switcher.
document.querySelectorAll('.axi-switch').forEach((sw) => {
  sw.addEventListener('click', () => {
    sw.setAttribute('aria-checked', sw.getAttribute('aria-checked') === 'true' ? 'false' : 'true')
  })
})
