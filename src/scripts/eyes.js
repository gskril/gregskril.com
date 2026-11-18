/* Erin's googly eyes: they watch your cursor (or glance at taps), look around and blink. */
;(() => {
  'use strict'
  const $ = (s) => document.querySelector(s)

  const eyes = $('#eyes'),
    pupils = $('#pupils'),
    word = $('#a-word') || eyes
  if (!eyes || !pupils) return
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
  let lastMove = 0,
    idleTimer = 0
  const look = (dx, dy) => {
    pupils.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`
  }
  const lookAt = (cx, cy) => {
    const r = eyes.getBoundingClientRect()
    const vx = cx - (r.left + r.width / 2),
      vy = cy - (r.top + r.height * 0.6)
    const l = Math.hypot(vx, vy) || 1,
      reach = Math.min(1, l / 240)
    look((vx / l) * 10 * reach, (vy / l) * 13 * reach + 2)
  }
  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return
      lastMove = performance.now()
      lookAt(e.clientX, e.clientY)
    },
    { passive: true }
  )
  /* on touch screens, glance at where you tap for a moment */
  window.addEventListener(
    'pointerdown',
    (e) => {
      if (e.pointerType !== 'touch') return
      lastMove = performance.now()
      lookAt(e.clientX, e.clientY)
    },
    { passive: true }
  )
  word.addEventListener('pointerenter', () => eyes.classList.add('surprised'))
  word.addEventListener('pointerleave', () => eyes.classList.remove('surprised'))
  /* when nobody is moving a cursor, look around now and then */
  const idle = () => {
    idleTimer = setTimeout(idle, 1800 + Math.random() * 2600)
    if (reduce.matches || performance.now() - lastMove < 3500) return
    const a = Math.random() * Math.PI * 2,
      k = Math.random() < 0.3 ? 0 : 0.5 + Math.random() * 0.5
    look(Math.cos(a) * 10 * k, Math.sin(a) * 12 * k + 2)
  }
  if (!fine.matches) idle()
  else look(0, 2)
  fine.addEventListener &&
    fine.addEventListener('change', () => {
      clearTimeout(idleTimer)
      if (!fine.matches) idle()
    })
  /* and blink */
  const blink = () => {
    setTimeout(blink, 2600 + Math.random() * 4200)
    if (reduce.matches || document.hidden) return
    eyes.classList.add('blink')
    setTimeout(() => eyes.classList.remove('blink'), 120)
  }
  setTimeout(blink, 2200)
})()
