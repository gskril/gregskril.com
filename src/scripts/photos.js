/*
  The pile of prints. The photos live in src/photos.js; the prints themselves are already in
  the page (placed by the build with the same pile-layout.js), so this only brings them to
  life: the layout as the page resizes, and dragging. Clicking a print opens it in the shared
  lightbox (lightbox.js); the bread stickers that ride along are in stickers.js.
*/
import { createLightbox } from './lightbox.js'
import { createStickers } from './stickers.js'
import { PHOTOS, photoUrl } from '../photos.js'
import { pileLayout, columnsNow } from './pile-layout.js'

;(() => {
  'use strict'

  const pile = document.getElementById('a-pile')
  if (!pile) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

  /* ---------- the prints, from the page ---------- */
  const prints = [...pile.querySelectorAll('.print')].map((el) => {
    const i = Number(el.dataset.i)
    return {
      el,
      img: el.querySelector('img'),
      data: PHOTOS[i],
      i,
      fx: 0,
      fy: 0,
      r: 0,
      z: i + 1,
      moved: undefined,
    }
  })
  if (!prints.length) return

  /* the bread stickers (stickers.js) ride along, dragged like the prints */
  const breads = createStickers(pile, (st) => place(st))
  const stickers = breads.stickers

  /* ---------- a closer look, in the shared lightbox ---------- */
  const lightbox = createLightbox(
    prints.map((p) => ({
      el: p.el,
      src: photoUrl(p.data),
      w: p.data.w,
      h: p.data.h,
      alt: p.data.alt,
      caption: p.data.place,
      preview: () => p.img.currentSrc || p.img.src,
      angle: () => p.r,
    })),
    /* after browsing, the photo that flies back lands on top of the pile */
    { onReturn: (i) => raise(prints[i]) }
  )

  /* ---------- layout: a loose, overlapping grid ---------- */
  let cols = 0,
    cw = 0,
    ch = 0
  function layout() {
    const w = pile.clientWidth
    if (!w || dragging) return
    const c = columnsNow()
    const keep = c === cols && Math.abs(w - cw) < 1
    cols = c
    cw = w
    const L = pileLayout(PHOTOS, c)
    ch = Math.ceil(L.h * w + 24)
    pile.style.height = `${ch}px`
    prints.forEach((p) => {
      const q = L.items[p.i]
      const pw = q.pw * w
      p.el.style.setProperty('--w', `${pw.toFixed(1)}px`)
      p.img.sizes = `${Math.ceil(pw)}px`
      if (!keep || !p.moved) {
        p.fx = q.x
        p.fy = (q.y * w) / ch
        p.r = q.r
        p.moved = false
      }
      place(p)
    })
    /* first time through: swap the build's CSS placement for ours in one go, with no animation */
    if (!pile.classList.contains('live')) {
      pile.classList.add('live', 'instant')
      requestAnimationFrame(() =>
        requestAnimationFrame(() => pile.classList.remove('instant'))
      )
    }
    breads.fit(w, ch, keep)
  }
  function place(p, tilt = 0) {
    p.el.style.setProperty('--x', `${(p.fx * cw).toFixed(1)}px`)
    p.el.style.setProperty('--y', `${(p.fy * ch).toFixed(1)}px`)
    p.el.style.setProperty('--r', `${(p.r + tilt).toFixed(2)}deg`)
    p.el.style.zIndex = p.z
  }

  /* keep z-indexes small so the stickers stay on top */
  let zTop = prints.length
  function raise(p) {
    p.z = ++zTop
    if (zTop > 50) {
      prints
        .slice()
        .sort((a, b) => a.z - b.z)
        .forEach((q, k) => {
          q.z = k + 1
          q.el.style.zIndex = q.z
        })
      zTop = prints.length
    }
    p.el.style.zIndex = p.z
  }

  /* ---------- drag: positions are applied once a frame, and the tilt is smoothed ---------- */
  let dragging = null
  function draggable(p, onTap) {
    let sx = 0,
      sy = 0,
      ox = 0,
      oy = 0,
      id = null,
      moved = false
    let tx = 0,
      ty = 0,
      lastX = 0,
      lastT = 0,
      vx = 0,
      tilt = 0,
      raf = 0
    const frame = () => {
      raf = 0
      const pw = p.el.offsetWidth,
        ph = p.el.offsetHeight
      const x = clamp(tx, -pw * 0.3, cw - pw * 0.7),
        y = clamp(ty, -ph * 0.3, ch - ph * 0.7)
      p.fx = x / cw
      p.fy = y / ch
      /* lean a little in the direction of travel, like a print sliding on a table */
      tilt += (clamp(vx * 0.012, -7, 7) - tilt) * 0.18
      vx *= 0.86
      place(p, reduce.matches ? 0 : tilt)
      if (id !== null || Math.abs(tilt) > 0.05) raf = requestAnimationFrame(frame)
      else {
        tilt = 0
        place(p)
      }
    }
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame)
    }

    p.el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || lightbox?.isOpen()) return
      id = e.pointerId
      moved = false
      sx = lastX = e.clientX
      sy = e.clientY
      lastT = e.timeStamp
      ox = p.fx * cw
      oy = p.fy * ch
      tx = ox
      ty = oy
      vx = 0
      p.el.setPointerCapture(id)
    })
    p.el.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id) return
      const dx = e.clientX - sx,
        dy = e.clientY - sy
      if (!moved && Math.hypot(dx, dy) < 6) return
      if (!moved) {
        moved = true
        dragging = p
        p.moved = true
        if (!p.sticker) raise(p)
        p.el.classList.add('dragging')
      }
      const dt = Math.max(1, e.timeStamp - lastT)
      vx = vx * 0.6 + ((e.clientX - lastX) / dt) * 1000 * 0.4
      lastX = e.clientX
      lastT = e.timeStamp
      tx = ox + dx
      ty = oy + dy
      kick()
    })
    const end = (e) => {
      if (e.pointerId !== id) return
      id = null
      if (dragging === p) dragging = null
      p.el.classList.remove('dragging')
      if (moved) {
        p.r += (Math.random() - 0.5) * 3
        kick()
      }
    }
    p.el.addEventListener('pointerup', end)
    p.el.addEventListener('pointercancel', end)
    p.el.addEventListener('click', (e) => {
      /* prints are links to the full photo (for no-JS); a modified click still opens it in a new tab */
      if (!moved && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) return
      e.preventDefault()
      if (moved) {
        moved = false
        return
      }
      if (onTap) onTap(e)
    })
  }
  prints.forEach((p) =>
    draggable(p, () => {
      raise(p)
      lightbox?.open(p.i)
    })
  )
  stickers.forEach((st) => draggable(st, (e) => breads.bite(st, e)))
  /* fetch the crunch clips after everything else: once the pile is on screen and its
     pictures are in, so the first bite has sound but nothing important waits on it */
  if (stickers.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        const imgs = prints.map((p) => p.img)
        const settled = () =>
          imgs.every((img) => !img.hasAttribute('data-src') && img.complete)
        let tries = 0
        const wait = () =>
          settled() || ++tries > 20 ? breads.preloadSound() : setTimeout(wait, 500)
        wait()
      },
      { rootMargin: '200px' }
    )
    io.observe(pile)
  }

  window.Pile = { layout }
  layout()
})()
