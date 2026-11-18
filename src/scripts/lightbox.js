/*
  The photo lightbox, shared by the homepage pile and the bake pages (markup in
  src/components/Lightbox.astro).

  A photo lifts off the page, grows to fit the screen, and flies back to its spot on close.
  Arrow keys, the buttons, swipes and sideways trackpad swipes go through the others; Esc, a
  tap, a vertical swipe or a scroll closes it. While it's open the rest of the page is inert,
  Tab stays inside, and focus goes back to the photo afterwards.
*/

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
const CAPTION_SPACE = 64 // room under the photo for its caption, when it has one

/**
 * @typedef {object} LightboxItem
 * @property {HTMLElement} el  the thumbnail it opens from and flies back to
 * @property {string} src  the full size photo
 * @property {number} w  the photo's width (only the ratio matters)
 * @property {number} h  the photo's height
 * @property {string} alt
 * @property {string} [caption]
 * @property {() => string} [preview]  a smaller copy that's already loaded, shown while `src` loads
 * @property {() => number} [angle]  the thumbnail's tilt, in degrees
 */

/**
 * @param {LightboxItem[]} items
 * @param {{ onReturn?: (i: number) => void }} [hooks]
 *   onReturn: the photo now on screen is about to fly back to its thumbnail
 * @returns {{ open: (i: number) => void, isOpen: () => boolean } | null}
 */
export function createLightbox(items, { onReturn } = {}) {
  const box = document.getElementById('closer')
  if (!box || !items.length) return null
  const fig = document.getElementById('closer-print')
  const img = document.getElementById('closer-img')
  const caption = document.getElementById('closer-caption')
  const prevBtn = document.getElementById('closer-prev')
  const nextBtn = document.getElementById('closer-next')
  const closeBtn = document.getElementById('closer-close')
  const n = items.length
  prevBtn.hidden = nextBtn.hidden = n < 2

  let current = -1 // the photo on screen, or -1 when closed
  let lifted = null // the thumbnail that's hidden while its photo is out
  let closing = false
  let sliding = false

  // the slide between photos runs on timers; closing cancels them so nothing is left hidden
  const timers = new Set()
  const later = (fn, ms) => {
    const id = setTimeout(() => {
      timers.delete(id)
      fn()
    }, ms)
    timers.add(id)
  }
  const cancelTimers = () => {
    timers.forEach(clearTimeout)
    timers.clear()
  }

  const wrap = (i) => (i + n) % n
  const setLifted = (el) => {
    lifted?.classList.remove('lifted')
    lifted = el
    lifted?.classList.add('lifted')
  }

  /* ---------- where the photo goes ---------- */

  /** The biggest box with the photo's shape that fits the screen, centered. */
  function fit(item) {
    const ratio = item.w / item.h
    const vw = window.innerWidth
    const vh = window.innerHeight
    const below = caption ? CAPTION_SPACE : 0
    let w = Math.min(vw * (vw < 700 ? 0.92 : 0.8), 1100)
    let h = w / ratio
    const maxH = vh * (caption ? 0.82 : 0.86) - below
    if (h > maxH) {
      h = maxH
      w = h * ratio
    }
    return { w, h, x: (vw - w) / 2, y: (vh - h - below) / 2 + (caption ? 8 : 0) }
  }

  /** The transform that puts the open photo exactly over its thumbnail. */
  function overThumbnail(item, box) {
    const r = item.el.getBoundingClientRect()
    const scale = item.el.offsetWidth / box.w
    const dx = r.left + r.width / 2 - (box.x + box.w / 2)
    const dy = r.top + r.height / 2 - (box.y + box.h / 2)
    return `translate(${dx}px, ${dy}px) rotate(${item.angle?.() || 0}deg) scale(${scale})`
  }

  /** Put photo `i` in the lightbox (without animating) and return its box. */
  function show(i) {
    current = i
    const item = items[i]
    const t = fit(item)
    Object.assign(fig.style, {
      width: `${t.w}px`,
      height: `${t.h}px`,
      left: `${t.x}px`,
      top: `${t.y}px`,
    })
    img.alt = item.alt
    if (caption) caption.textContent = item.caption || ''
    img.src = item.preview?.() || item.src
    if (img.src !== item.src) {
      const full = new Image()
      full.onload = () => {
        if (current === i) img.src = full.src
      }
      full.src = item.src
    }
    // warm up the neighbours so going to them is instant
    for (const j of [wrap(i + 1), wrap(i - 1)]) new Image().src = items[j].src
    return t
  }

  /* ---------- open, flip through, close ---------- */

  function open(i) {
    if (current >= 0) return
    closing = false
    const t = show(i)
    fig.style.transition = 'none'
    fig.style.transform = overThumbnail(items[i], t)
    box.hidden = false
    setLifted(items[i].el)
    fig.getBoundingClientRect() // start from the thumbnail
    fig.style.transition = ''
    requestAnimationFrame(() => {
      box.classList.add('open')
      fig.style.transform = 'none'
    })
    trapFocus(closeBtn)
  }

  /** Slide the photo out, swap in the next (dir 1) or previous (dir -1), and slide it in. */
  function step(dir) {
    if (current < 0 || closing || sliding || n < 2) return
    const next = wrap(current + dir)
    if (reduce.matches) {
      show(next)
      return
    }
    sliding = true
    fig.style.transition = 'transform .22s ease-in, opacity .22s ease-in'
    fig.style.transform = `translateX(${-dir * 70}px) rotate(${-dir * 2}deg)`
    fig.style.opacity = '0'
    later(() => {
      show(next)
      fig.style.transition = 'none'
      fig.style.transform = `translateX(${dir * 70}px) rotate(${dir * 2}deg)`
      fig.getBoundingClientRect()
      fig.style.transition =
        'transform .32s cubic-bezier(.2,.8,.2,1), opacity .25s ease-out'
      fig.style.transform = 'none'
      fig.style.opacity = '1'
      later(() => {
        sliding = false
        fig.style.transition = ''
      }, 330)
    }, 200)
  }

  function close() {
    if (current < 0 || closing) return
    closing = true
    cancelTimers()
    sliding = false
    const item = items[current]
    // after browsing, it's the photo now on screen that flies back, to its own thumbnail
    if (lifted !== item.el) {
      setLifted(item.el)
      onReturn?.(current)
    }
    box.classList.remove('open')
    fig.style.transition = ''
    fig.style.opacity = '1'
    fig.style.transform = overThumbnail(item, fit(item))
    let finished = false
    const done = (e) => {
      if (finished || (e && (e.target !== fig || e.propertyName !== 'transform'))) return
      finished = true
      fig.removeEventListener('transitionend', done)
      box.hidden = true
      setLifted(null)
      current = -1
      closing = false
      releaseFocus(item.el)
    }
    fig.addEventListener('transitionend', done)
    setTimeout(done, 600)
  }

  /* ---------- input ---------- */

  prevBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    step(-1)
  })
  nextBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    step(1)
  })
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    close()
  })

  window.addEventListener('keydown', (e) => {
    if (current < 0) return
    if (e.key === 'Escape') close()
    else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      step(e.key === 'ArrowRight' ? 1 : -1)
    }
  })

  // a tap closes; a sideways swipe goes to the next one, a vertical one closes
  let down = null
  box.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('button')) down = { x: e.clientX, y: e.clientY }
  })
  box.addEventListener('pointerup', (e) => {
    if (!down) return
    const dx = e.clientX - down.x
    const dy = e.clientY - down.y
    down = null
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) step(dx < 0 ? 1 : -1)
    else if (Math.hypot(dx, dy) < 12 || Math.abs(dy) > 80) close()
  })
  box.addEventListener('pointercancel', () => {
    down = null
  })

  // trackpads: a sideways swipe goes to the next one, scrolling closes
  let wheelLock = 0
  box.addEventListener(
    'wheel',
    (e) => {
      if (current < 0) return
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault()
        if (Math.abs(e.deltaX) > 12 && e.timeStamp > wheelLock) {
          wheelLock = e.timeStamp + 500
          step(e.deltaX > 0 ? 1 : -1)
        }
      } else if (Math.abs(e.deltaY) > 8) close()
    },
    { passive: false }
  )

  // phones: never let a swipe on the photo scroll the page underneath
  box.addEventListener(
    'touchmove',
    (e) => {
      if (current >= 0) e.preventDefault()
    },
    { passive: false }
  )

  // mobile browsers fire resize when the address bar slides, so only a real width change
  // (which moves the thumbnails) closes it; otherwise the photo just refits
  let lastWidth = window.innerWidth
  window.addEventListener('resize', () => {
    const widthChanged = window.innerWidth !== lastWidth
    lastWidth = window.innerWidth
    if (current < 0 || closing) return
    if (widthChanged) close()
    else if (!sliding) show(current)
  })

  /* ---------- focus: the page behind is inert while it's open ---------- */

  let inerted = []
  const focusables = () =>
    [...box.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])')].filter(
      (el) => !el.hidden && el.getClientRects().length > 0
    )
  function keepTabInside(e) {
    if (e.key !== 'Tab') return
    const els = focusables()
    const first = els[0]
    const last = els[els.length - 1]
    const at = document.activeElement
    if (!els.length) {
      e.preventDefault()
      box.focus({ preventScroll: true })
    } else if (e.shiftKey && (at === first || !box.contains(at))) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && (at === last || !box.contains(at))) {
      e.preventDefault()
      first.focus()
    }
  }
  function trapFocus(focusEl) {
    inerted = [...document.body.children].filter(
      (el) => el !== box && !el.contains(box) && !el.inert
    )
    inerted.forEach((el) => (el.inert = true))
    document.addEventListener('keydown', keepTabInside, true)
    focusEl.focus({ preventScroll: true })
  }
  function releaseFocus(returnTo) {
    inerted.forEach((el) => (el.inert = false))
    inerted = []
    document.removeEventListener('keydown', keepTabInside, true)
    if (document.contains(returnTo)) returnTo.focus({ preventScroll: true })
  }

  return { open, isOpen: () => current >= 0 }
}
