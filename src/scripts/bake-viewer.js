/* The photos on a bake page: click one to open it, then arrows, swipe or Esc. */
import { trapFocus, releaseFocus } from './modal.js'

;(() => {
  'use strict'
  const $ = (s) => document.querySelector(s)
  const prints = [...document.querySelectorAll('.bk-print')]
  const box = $('#closer'),
    fig = $('#closer-print'),
    img = $('#closer-img')
  if (!prints.length || !box) return
  const photos = prints.map((b) => ({
    src: b.dataset.full,
    w: Number(b.dataset.w) || 1200,
    h: Number(b.dataset.h) || 1600,
    alt: b.querySelector('img')?.alt || '',
  }))
  const n = photos.length
  let k = -1
  let opener = null
  const closeBtn = $('#closer-close')
  // the slide between photos and the close fade run on timers; a new open or close cancels them
  const timers = new Set()
  const later = (fn, ms) => {
    const id = setTimeout(() => {
      timers.delete(id)
      fn()
    }, ms)
    timers.add(id)
  }
  const cancel = () => {
    timers.forEach(clearTimeout)
    timers.clear()
  }
  $('#closer-prev').hidden = $('#closer-next').hidden = n < 2

  const size = (p) => {
    const ar = p.w / p.h,
      vw = innerWidth,
      vh = innerHeight
    let W = Math.min(vw * (vw < 700 ? 0.92 : 0.8), 1100),
      H = W / ar
    if (H > vh * 0.86) {
      H = vh * 0.86
      W = H * ar
    }
    Object.assign(fig.style, {
      width: `${W}px`,
      height: `${H}px`,
      left: `${(vw - W) / 2}px`,
      top: `${(vh - H) / 2}px`,
    })
  }
  const show = (j) => {
    k = (j + n) % n
    const p = photos[k]
    size(p)
    img.src = p.src
    img.alt = p.alt
  }
  const open = (j) => {
    cancel()
    opener = prints[j]
    show(j)
    box.hidden = false
    fig.style.transition = 'none'
    fig.style.transform = 'scale(.94)'
    fig.style.opacity = '0'
    fig.getBoundingClientRect()
    fig.style.transition = 'transform .35s cubic-bezier(.2,.8,.2,1), opacity .25s ease'
    requestAnimationFrame(() => {
      box.classList.add('open')
      fig.style.transform = 'none'
      fig.style.opacity = '1'
    })
    trapFocus(box, closeBtn, opener)
  }
  const close = () => {
    if (box.hidden || !box.classList.contains('open')) return
    cancel()
    box.classList.remove('open')
    fig.style.transform = 'scale(.96)'
    fig.style.opacity = '0'
    releaseFocus(opener)
    later(() => {
      box.hidden = true
    }, 260)
  }
  const step = (dir) => {
    if (n < 2 || !box.classList.contains('open')) return
    cancel()
    fig.style.transition = 'transform .18s ease-in, opacity .18s ease-in'
    fig.style.transform = `translateX(${-dir * 50}px)`
    fig.style.opacity = '0'
    later(() => {
      show(k + dir)
      fig.style.transition = 'none'
      fig.style.transform = `translateX(${dir * 50}px)`
      fig.getBoundingClientRect()
      fig.style.transition =
        'transform .3s cubic-bezier(.2,.8,.2,1), opacity .22s ease-out'
      fig.style.transform = 'none'
      fig.style.opacity = '1'
    }, 170)
  }

  prints.forEach((b, j) => b.addEventListener('click', () => open(j)))
  $('#closer-prev').addEventListener('click', (e) => {
    e.stopPropagation()
    step(-1)
  })
  $('#closer-next').addEventListener('click', (e) => {
    e.stopPropagation()
    step(1)
  })
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    close()
  })
  let down = null
  box.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('button')) down = { x: e.clientX, y: e.clientY }
  })
  box.addEventListener('pointerup', (e) => {
    if (!down) return
    const dx = e.clientX - down.x,
      dy = e.clientY - down.y
    down = null
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) step(dx < 0 ? 1 : -1)
    else close()
  })
  addEventListener('keydown', (e) => {
    if (box.hidden || !box.classList.contains('open')) return
    if (e.key === 'Escape') close()
    else if (e.key === 'ArrowRight') step(1)
    else if (e.key === 'ArrowLeft') step(-1)
  })
  addEventListener('resize', () => {
    if (!box.hidden) size(photos[k])
  })
})()
