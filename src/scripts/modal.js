/* Shared by both photo lightboxes: while one is open, the rest of the page is inert,
   Tab stays inside the lightbox, and focus goes back where it came from on close. */
let state = null

const focusables = (box) =>
  [...box.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])')].filter(
    (el) => !el.hidden && el.getClientRects().length > 0
  )

function onKey(e) {
  if (!state || e.key !== 'Tab') return
  const els = focusables(state.box)
  if (!els.length) {
    e.preventDefault()
    state.box.focus({ preventScroll: true })
    return
  }
  const first = els[0]
  const last = els[els.length - 1]
  const at = document.activeElement
  if (e.shiftKey && (at === first || !state.box.contains(at))) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && (at === last || !state.box.contains(at))) {
    e.preventDefault()
    first.focus()
  }
}

/** Make everything but `box` inert and move focus to `focusEl` (or the box). */
export function trapFocus(box, focusEl, returnTo = document.activeElement) {
  if (state) return
  const inerted = [...document.body.children].filter(
    (el) => el !== box && !el.contains(box) && !el.inert
  )
  inerted.forEach((el) => (el.inert = true))
  state = { box, inerted, returnTo }
  document.addEventListener('keydown', onKey, true)
  ;(focusEl || box).focus({ preventScroll: true })
}

/** Undo trapFocus. Focus returns to `returnTo` if given, else to whatever had it before. */
export function releaseFocus(returnTo) {
  if (!state) return
  const { inerted, returnTo: before } = state
  state = null
  inerted.forEach((el) => (el.inert = false))
  document.removeEventListener('keydown', onKey, true)
  const to = returnTo || before
  if (to && document.contains(to)) to.focus({ preventScroll: true })
}
