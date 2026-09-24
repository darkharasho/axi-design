// Gallery behaviour only - the design language ships no JavaScript.
// Every interactive component in the system (the menu disclosure, the drawer)
// is CSS plus a `hidden` attribute and an aria state; this file is the minimum
// needed to toggle those so the gallery can show both states, and it doubles
// as the reference for what a consumer has to wire up themselves. Because it
// is a reference, the accessibility wiring is here in full rather than left as
// an exercise: a disclosure that only Escape-less mouse users can close, or a
// drawer the screen reader announces as a sidebar, is the kind of gap that
// propagates into every app that copies this file.
//
// The accent switcher itself is not here - docs/site/accent.js owns it on
// every page now, this one included.

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

/* ---------- picker ---------- */
// .axi-picker is the dropdown whose list is ours rather than the OS's, and a
// <select> hands you all of this for free - so this block is the bill for
// drawing it yourself, and it is the whole bill. Roving focus over the
// options, arrows and Home/End to move it, Escape back to the trigger, the
// value written back into the trigger's label, and aria-selected as the one
// place the choice is stored. A picker missing any of these is worse than the
// native popup it replaced, however well it matches the palette.
const picker = document.querySelector('.axi-picker')
const pickTrigger = document.getElementById('month-trigger')
const pickPop = document.getElementById('month-pop')
const options = [...pickPop.querySelectorAll('.axi-picker__opt')]

const setPicker = (open) => {
  pickTrigger.setAttribute('aria-expanded', String(open))
  pickPop.hidden = !open
  // Opening lands on the current choice, not on the top of the list: the
  // first arrow press should step away from where you already are.
  if (open) (options.find((o) => o.getAttribute('aria-selected') === 'true') ?? options[0]).focus()
}

const choose = (opt) => {
  for (const o of options) o.setAttribute('aria-selected', String(o === opt))
  pickTrigger.textContent = opt.textContent.trim()
  setPicker(false)
  pickTrigger.focus()
}

pickTrigger.addEventListener('click', () => {
  setPicker(pickTrigger.getAttribute('aria-expanded') !== 'true')
})
for (const opt of options) opt.addEventListener('click', () => choose(opt))

pickPop.addEventListener('keydown', (e) => {
  const i = options.indexOf(document.activeElement)
  if (i < 0) return
  const to =
    e.key === 'ArrowDown' ? Math.min(i + 1, options.length - 1)
    : e.key === 'ArrowUp' ? Math.max(i - 1, 0)
    : e.key === 'Home' ? 0
    : e.key === 'End' ? options.length - 1
    : null
  if (to === null) return
  e.preventDefault()
  options[to].focus()
})

document.addEventListener('click', (e) => {
  if (pickPop.hidden || picker.contains(e.target)) return
  setPicker(false)
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
  else if (!pickPop.hidden) {
    setPicker(false)
    pickTrigger.focus()
  } else if (!pop.hidden) {
    setMenu(false)
    trigger.focus()
  }
})

/* ---------- tooltip ---------- */
// .axi-tooltip draws the box; this is the consumer's half of the contract.
// The element is created on demand and appended to <body> - never inside the
// trigger's component, because position: fixed re-anchors to any transformed
// ancestor and every hover lift in this language is a transform. It shows on
// focus as well as hover, and the trigger keeps its own accessible text: the
// tooltip is repetition for sighted mouse users, not the only copy.
let tip = null
const showTip = (el) => {
  const r = el.getBoundingClientRect()
  tip = document.createElement('div')
  tip.className = 'axi-tooltip'
  tip.textContent = el.dataset.axiTooltip
  document.body.append(tip)
  const t = tip.getBoundingClientRect()
  tip.style.left = `${Math.round(r.left + r.width / 2 - t.width / 2)}px`
  tip.style.top = `${Math.round(r.top - t.height - 6)}px`
}
const hideTip = () => {
  tip?.remove()
  tip = null
}
document.querySelectorAll('[data-axi-tooltip]').forEach((el) => {
  el.addEventListener('mouseenter', () => showTip(el))
  el.addEventListener('focus', () => showTip(el))
  el.addEventListener('mouseleave', hideTip)
  el.addEventListener('blur', hideTip)
})

// The switches flip. Their whole state lives in aria-checked, so there is
// nothing else to keep in sync - and a switch you cannot work is a switch you
// cannot check against the accent switcher.
document.querySelectorAll('.axi-switch').forEach((sw) => {
  sw.addEventListener('click', () => {
    sw.setAttribute('aria-checked', sw.getAttribute('aria-checked') === 'true' ? 'false' : 'true')
  })
})
