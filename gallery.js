// Gallery behaviour only - the design language ships no JavaScript.
// Every interactive component in the system (the menu disclosure, the drawer)
// is CSS plus a `hidden` attribute and an aria state; this file is the minimum
// needed to toggle those so the gallery can show both states, and it doubles
// as the reference for what a consumer has to wire up themselves.

const accent = document.getElementById('accent')
accent.addEventListener('change', () => {
  document.documentElement.style.setProperty('--axi-accent', accent.value)
})

const trigger = document.getElementById('menu-trigger')
const pop = document.getElementById('menu-pop')
trigger.addEventListener('click', () => {
  const open = trigger.getAttribute('aria-expanded') === 'true'
  trigger.setAttribute('aria-expanded', String(!open))
  pop.hidden = open
})

const drawer = document.getElementById('drawer')
const scrim = document.getElementById('scrim')
const setDrawer = (open) => {
  drawer.hidden = !open
  scrim.hidden = !open
  if (open) document.getElementById('close-drawer').focus()
}
document.getElementById('open-drawer').addEventListener('click', () => setDrawer(true))
document.getElementById('close-drawer').addEventListener('click', () => setDrawer(false))
scrim.addEventListener('click', () => setDrawer(false))
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !drawer.hidden) setDrawer(false)
})
