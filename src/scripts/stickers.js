/*
  Two bread stickers ride along on the photo pile (photos.js moves them around like the
  prints). Click one to take a bite; once one is eaten, a different bread pops up in its place.
*/
import { crunch, preloadCrunch } from './crunch.js'
import { babka, baguette, loaf } from '../art'

const ART = { babka, baguette, loaf }

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')

/**
 * @param {HTMLElement} pile
 * @param {(st: object) => void} place  puts a sticker where its fx, fy and r say
 */
export function createStickers(pile, place) {
  const BREADS = ['baguette', 'babka', 'loaf']
  /* width as a share of the bigger sticker size, so each bread looks about the same size */
  const WIDTH = { baguette: 0.6, babka: 1, loaf: 0.95 }
  const BITES = { baguette: 5, babka: 5, loaf: 4 }
  let stickerBase = 100
  function setBread(st, name) {
    st.name = name
    st.bites = []
    st.el.className = `sticker sticker-${name}`
    st.el.dataset.art = name
    st.art.innerHTML = ART[name]
    st.el.style.width = `${(stickerBase * WIDTH[name]).toFixed(1)}px`
    paintBites(st)
    shape(name)
  }
  /* An alpha map of each bread's art, so a bite can find the bread's real edge. */
  const SHAPE_W = 160
  const shapes = {}
  function shape(name) {
    if (shapes[name] !== undefined) return shapes[name]
    shapes[name] = null
    try {
      const svg = ART[name].replace(/var\(--[\w-]+\)/g, '#000')
      const vb = (svg.match(/viewBox="([\d.\s-]+)"/) || [])[1]
      if (!vb) return null
      const [, , vw, vh] = vb.split(/\s+/).map(Number)
      const H = Math.round((SHAPE_W * vh) / vw)
      const img = new Image()
      img.onload = () => {
        try {
          const c = document.createElement('canvas')
          c.width = SHAPE_W
          c.height = H
          const g = c.getContext('2d', { willReadFrequently: true })
          g.drawImage(img, 0, 0, SHAPE_W, H)
          shapes[name] = { a: g.getImageData(0, 0, SHAPE_W, H).data, H }
        } catch (e) {
          /* no map: bites just land where you click */
        }
      }
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.includes('xmlns=') ? svg : svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"'))}`
    } catch (e) {
      /* same */
    }
    return null
  }
  /* is there still bread at (x, y)? both are shares of the sticker's width */
  function solid(st, m, x, y) {
    const px = Math.round(x * SHAPE_W),
      py = Math.round(y * SHAPE_W)
    if (px < 0 || py < 0 || px >= SHAPE_W || py >= m.H) return false
    if (m.a[(py * SHAPE_W + px) * 4 + 3] < 40) return false
    for (const b of st.bites) {
      for (const [ox, oy, k] of b.cuts)
        if (Math.hypot(x - (b.x + ox * b.r), y - (b.y + oy * b.r)) < b.r * k) return false
    }
    return true
  }

  const stickers = [
    ['baguette', 34],
    ['babka', -14],
  ].map(([name, r]) => {
    const s = document.createElement('span')
    s.setAttribute('aria-hidden', 'true')
    const art = document.createElement('span')
    art.className = 'sticker-art'
    s.appendChild(art)
    pile.appendChild(s)
    const st = {
      el: s,
      art,
      fx: 0,
      fy: 0,
      r,
      z: 60,
      moved: false,
      sticker: true,
      busy: false,
    }
    setBread(st, name)
    return st
  })

  /* A bite is a few overlapping circles cut out of the art with a CSS mask: one big one
     for the mouthful and two smaller ones either side for the tooth marks. */
  /* bites are stored as shares of the sticker's width, so they stay put when it resizes */
  function paintBites(st) {
    const W = st.el.offsetWidth
    const layers = []
    for (const b of st.bites) {
      for (const [ox, oy, k] of b.cuts) {
        const r = b.r * k * W
        const x = (b.x + ox * b.r) * W,
          y = (b.y + oy * b.r) * W
        layers.push(
          `radial-gradient(circle ${r.toFixed(1)}px at ${x.toFixed(1)}px ${y.toFixed(1)}px, transparent ${(r - 0.5).toFixed(1)}px, #000 ${r.toFixed(1)}px)`
        )
      }
    }
    const v = layers.join(', ')
    const st2 = st.art.style
    st2.maskImage = st2.webkitMaskImage = v
    st2.maskComposite = layers.length ? 'intersect' : ''
    st2.webkitMaskComposite = layers.length ? 'source-in' : ''
  }

  function crumbs(st, x, y) {
    if (reduce.matches) return
    const rect = pile.getBoundingClientRect()
    for (let i = 0; i < 6; i++) {
      const c = document.createElement('i')
      c.className = 'crumb'
      const size = 3 + Math.random() * 4
      Object.assign(c.style, {
        width: `${size}px`,
        height: `${size * (0.7 + Math.random() * 0.5)}px`,
        left: `${x - rect.left}px`,
        top: `${y - rect.top}px`,
      })
      pile.appendChild(c)
      const dx = (Math.random() - 0.5) * 90,
        up = 20 + Math.random() * 40,
        fall = 60 + Math.random() * 80
      c.animate(
        [
          { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
          {
            transform: `translate(${dx * 0.6}px, ${-up}px) rotate(${dx * 2}deg)`,
            opacity: 1,
            offset: 0.35,
          },
          { transform: `translate(${dx}px, ${fall}px) rotate(${dx * 4}deg)`, opacity: 0 },
        ],
        { duration: 650 + Math.random() * 300, easing: 'cubic-bezier(.3,.6,.5,1)' }
      ).onfinish = () => c.remove()
    }
  }

  function bite(st, e) {
    if (st.busy) return
    /* where the click landed, in the sticker's own (unrotated, unscaled) coordinates */
    const w = st.el.offsetWidth,
      h = st.el.offsetHeight
    const box = st.el.getBoundingClientRect()
    const cx = box.left + box.width / 2,
      cy = box.top + box.height / 2
    const a = (-(parseFloat(st.el.style.getPropertyValue('--r')) || st.r) * Math.PI) / 180
    const vx = e.clientX - cx,
      vy = e.clientY - cy
    const s = Number(getComputedStyle(st.el).getPropertyValue('--s')) || 1
    let lx = (vx * Math.cos(a) - vy * Math.sin(a)) / s,
      ly = (vx * Math.sin(a) + vy * Math.cos(a)) / s
    /* bites come in from the edge: find where the bread ends in the direction of the click,
       and take the bite there */
    const d = Math.hypot(lx, ly) || 1
    const ux = lx / d,
      uy = ly / d /* outward from the middle */
    const nx = -uy,
      ny = ux /* across the bite, for the tooth marks */
    const r = Math.min(w, h) * (0.3 + Math.random() * 0.06)
    let bx = (w / 2 + lx) / w,
      by = (h / 2 + ly) / w
    const m = shape(st.name)
    if (m) {
      const cx0 = 0.5,
        cy0 = h / 2 / w,
        far = Math.hypot(1, h / w)
      for (let t = far; t >= 0; t -= 0.01) {
        if (solid(st, m, cx0 + ux * t, cy0 + uy * t)) {
          bx = cx0 + ux * t
          by = cy0 + uy * t
          break
        }
      }
    }
    bx += ux * (r / w) * 0.4
    by += uy * (r / w) * 0.4
    st.bites.push({
      x: bx,
      y: by,
      r: r / w,
      /* [x offset, y offset (in bite radii), size]: the mouthful, plus little tooth marks
         scalloped along its inner edge */
      cuts: [
        [0, 0, 1],
        ...[-64, -32, 0, 32, 64].map((deg) => {
          const t = (deg * Math.PI) / 180,
            c = Math.cos(t),
            sn = Math.sin(t)
          /* point back into the bread (-u), swung by deg */
          const dx = -ux * c + nx * sn,
            dy = -uy * c + ny * sn
          return [dx * 0.93, dy * 0.93, 0.2 + Math.random() * 0.05]
        }),
      ],
    })
    paintBites(st)
    const last = st.bites.length >= BITES[st.name]
    crunch(last)
    crumbs(st, e.clientX, e.clientY)
    if (!reduce.matches)
      st.art.animate(
        [
          { transform: 'scale(1)' },
          { transform: 'scale(.93) rotate(-3deg)' },
          { transform: 'scale(1)' },
        ],
        { duration: 220, easing: 'ease-out' }
      )
    if (last) eaten(st)
  }

  /* the last bite: it's gone, and a different bread pops up in its place */
  function eaten(st) {
    st.busy = true
    const other = stickers.find((o) => o !== st)
    const choices = BREADS.filter((n) => n !== st.name && n !== other.name)
    const pool = choices.length ? choices : BREADS.filter((n) => n !== st.name)
    const next = pool[Math.floor(Math.random() * pool.length)]
    const swap = () => {
      setBread(st, next)
      st.r = (Math.random() - 0.5) * 50
      place(st)
      if (reduce.matches) {
        st.busy = false
        return
      }
      st.art.animate(
        [
          { transform: 'scale(0) rotate(-25deg)', opacity: 0 },
          { transform: 'scale(1.12) rotate(4deg)', opacity: 1, offset: 0.6 },
          { transform: 'scale(1) rotate(0deg)', opacity: 1 },
        ],
        { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' }
      ).onfinish = () => {
        st.busy = false
      }
    }
    if (reduce.matches) {
      st.art.style.visibility = 'hidden'
      setTimeout(() => {
        st.art.style.visibility = ''
        swap()
      }, 600)
      return
    }
    st.art.animate(
      [
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'scale(0) rotate(20deg)', opacity: 0 },
      ],
      { duration: 260, easing: 'ease-in', fill: 'forwards' }
    ).onfinish = (ev) => {
      st.art.style.opacity = '0'
      ev.target.cancel()
      setTimeout(() => {
        st.art.style.opacity = ''
        swap()
      }, 700)
    }
  }

  /** Size the stickers for a pile `w` wide and `h` tall, and (unless `keep`) put them back on its corners. */
  function fit(w, h, keep) {
    const small = Math.min(64, w * 0.09),
      big = Math.min(110, w * 0.2)
    stickerBase = big
    const spots = [
      [w - small * 0.9, -small * 0.9],
      [-big * 0.25, h - big * 0.55],
    ]
    stickers.forEach((st, k) => {
      const [x, y] = spots[k]
      st.el.style.width = `${big * WIDTH[st.name]}px`
      paintBites(st)
      if (!keep || !st.moved) {
        st.fx = x / w
        st.fy = y / h
        st.moved = false
      }
      place(st)
    })
  }

  return { stickers, fit, bite, preloadSound: preloadCrunch }
}
