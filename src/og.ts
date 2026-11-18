/**
 * Share images (Open Graph cards), rendered at build time with satori + resvg.
 * Each card is laid out at the real 1200×630 size, in the site's fonts and colors.
 * The designs were mocked up in HTML first; the coordinates here follow those mockups.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { Resvg } from '@resvg/resvg-js'
import satori from 'satori'
import sharp from 'sharp'

import ART from './art'
import { GREG, GREG_W, GREG_H } from './portrait.js'
import { WORKER_BASE } from './utils'

export const OG_W = 1200
export const OG_H = 630

const COBALT = '#0033E6'
const CREAM = '#FFF6EA'
const CREAM2 = '#FFEED8'

/* ---------------------------------------------------------------- vnode helper */

type Child = Node | string | false | null | undefined
type Node = { type: string; props: Record<string, unknown> }
type Style = Record<string, string | number>

function h(
  type: string,
  props: Record<string, unknown> & { style?: Style },
  ...children: Child[]
): Node {
  const kids = children.filter((c) => c !== false && c != null && c !== '')
  return { type, props: { ...props, children: kids.length === 1 ? kids[0] : kids } }
}
const div = (style: Style, ...children: Child[]) =>
  h('div', { style: { display: 'flex', ...style } }, ...children)
const text = (style: Style, s: string) => div(style, s)
const img = (src: string, style: Style) =>
  h('img', { src, width: style.width, height: style.height, style })

const svgUri = (svg: string) =>
  `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`

/* ---------------------------------------------------------------- line art */

// Erin's eyes from the GOOD bread logo (same as src/components/Eyes.astro). The ellipses hang below
// the 210×130 box (the site lets them overflow), so the art is drawn into a taller, padded box.
const EYES_PAD = 8
const EYES_H = 160
function eyes(size: number, left: number, top: number, rotate: number) {
  const p = EYES_PAD
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-p} ${-p} ${210 + 2 * p} ${EYES_H + 2 * p}" fill="none" stroke="${COBALT}" stroke-linecap="round">
    <path stroke-width="5" d="M21 17C24 17 27 15 30 14C35 11 40 8 45 4"/>
    <path stroke-width="5" d="M163 4C167 8 170 11 176 14C181 16 185 17 190 17"/>
    <ellipse stroke-width="6.2" fill="${CREAM}" cx="62" cy="92" rx="39" ry="62" transform="rotate(11 62 92)"/>
    <ellipse stroke-width="6.2" fill="${CREAM}" cx="146" cy="92" rx="39" ry="62" transform="rotate(11 146 92)"/>
    <g stroke-width="8" transform="translate(5 4)"><path d="M66 62L61 88"/><path d="M150 62L145 88"/></g>
  </svg>`
  const k = size / 210
  return img(svgUri(svg), {
    position: 'absolute',
    left: left - p * k,
    top: top - p * k,
    width: (210 + 2 * p) * k,
    height: (EYES_H + 2 * p) * k,
    transform: `rotate(${rotate}deg)`,
  })
}

// Erin's underline scribble. It's stretched to the given box, so the path is scaled point by point
// to keep the stroke an even 2.5px (resvg has no non-scaling-stroke).
const SCRIBBLE =
  'M306 7.43138C304.04 -6.6374 286.503 6.15162 282.118 10.3037C257.82 33.3098 215.878 24.3375 184.187 19.8783C148.845 14.9053 119.761 29.2492 85.322 29.9847C58.5313 30.5569 39.1608 14.8971 14.4755 11.474C8.11428 10.5918 6.37529 9.96159 0.999998 13.1761'
function scribble(w: number, h: number) {
  const sx = w / 307
  const sy = h / 40
  const pad = 4
  let i = 0
  const d = SCRIBBLE.replace(/-?\d+(?:\.\d+)?/g, (n) => {
    const v = Number(n)
    const out = i % 2 === 0 ? v * sx + pad : (v + 8) * sy + pad
    i++
    return out.toFixed(2)
  })
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w + 2 * pad}" height="${h + 2 * pad}"><path d="${d}" fill="none" stroke="${COBALT}" stroke-width="2.5" stroke-linecap="round"/></svg>`
  return { src: svgUri(svg), pad, w: w + 2 * pad, h: h + 2 * pad }
}
// A scribble drawn in normal flow (under a heading), like `.uline` in the mockups.
function uline(w: number) {
  const s = scribble(w, 28)
  return img(s.src, {
    width: s.w,
    height: s.h,
    margin: `${6 - s.pad}px 0 ${22 - s.pad}px ${-6 - s.pad}px`,
  })
}
// A scribble at an absolute position, like UNDER() in the mockups.
function under(w: number, left: number, top: number) {
  const hgt = Math.round(w * 0.09)
  const s = scribble(w, hgt)
  return img(s.src, {
    position: 'absolute',
    left: left - s.pad,
    top: top - s.pad,
    width: s.w,
    height: s.h,
  })
}

// Greg's line portrait, cropped to the head (same paths as the hero).
const PORTRAIT = `<path d="M327.989 129.666C324.087 146.65 322.046 163.944 331.463 179.638C345.846 203.61 370.727 219.958 387.202 242.77C398.304 258.141 409.158 275.572 409.158 295.33C409.158 319.092 395.679 337.145 369.904 333.179C349.647 330.063 337.84 320.881 320.005 311.963"/><path d="M393.183 330.589C393.183 363.813 407.82 396.578 407.82 429.944C407.82 484.51 351.845 532.846 298.708 532.846C273.82 532.846 246.863 527.175 222.862 520.575C215.363 518.513 205.871 516.184 198.91 512.887C186.504 507.01 173.973 501.519 161.653 495.293C153.709 491.278 144.641 487.875 142.728 478.734C139.059 461.205 133.675 441.223 126.021 425.065C116.23 404.395 112.898 381.409 107.097 359.568C97.2121 322.356 91.1289 283.744 91.1289 245.281C91.1289 219.491 97.4699 189.05 121.438 174.905C137.03 165.703 152.991 162.929 170.967 162.929"/><path d="M172.308 242.771C174.758 235.693 177.677 222.764 182.953 217.489C188.873 211.569 194.661 212.167 201.582 212.167"/><path d="M240.162 194.864C247.53 190.047 269.625 172.813 278.751 178.897"/><path d="M300.035 398.449C301.265 404.601 315.417 409.095 320.66 409.095C325.338 409.095 339.31 407.764 334.632 407.764"/><path d="M169.636 150.954C170.053 147.201 172.834 144.177 172.001 140.014C170.982 134.918 165.835 130.418 162.687 126.707C155.097 117.762 146.371 109.638 140.658 99.2814C128.72 77.6438 151.842 58.1745 170.745 50.7131C182.99 45.8796 197.928 36.5197 211.477 36.5197C215.955 36.5197 211.847 55.5616 215.765 50.861C227.31 37.006 232.595 15.753 249.76 15.753C269.847 15.753 302.415 34.678 290.428 56.255C282.751 70.0746 264.908 49.5676 263.26 45.2427C259.891 36.3988 288.884 10.8428 294.42 11.2528C306.049 12.1142 312.824 38.5611 321.328 45.2427C333.796 55.0386 335.429 80.8188 324.581 91.6672C315.48 100.768 301.758 96.2706 290.428 94.4763C275.407 92.0974 258.417 89.9822 244.817 82.4266C238.911 79.1459 233.984 77.7363 230.106 83.8312C223.246 94.6104 218.376 107.844 204.232 110.37C186.26 113.579 167.335 113.697 149.085 113.697C137.259 113.697 126.173 111.035 114.414 111.035C112.365 111.035 110.567 110.212 111.014 111.775C111.534 113.593 111.009 116.192 110.792 117.984C110.016 124.391 110.802 131.392 109.461 137.648C108.199 143.541 100.406 142.681 95.8594 143.045C88.7929 143.61 81.8037 145.901 74.8649 147.258C62.0423 149.767 49.3083 150.954 36.2765 150.954C34.4079 150.954 27.1032 149.894 26.0749 151.694C25.0009 153.573 28.8036 159.03 29.919 160.269C39.4696 170.881 38.4238 205.616 21.2698 209.428C13.724 211.105 10.1714 202.672 14.6906 196.861C20.6519 189.197 38.7341 203.755 43.8906 208.098C53.5691 216.248 50.6178 238.254 50.6178 250.161C50.6178 264.039 48.0527 274.955 41.8947 287.271C35.9691 299.122 27.3705 317.394 40.4162 328.225C57.1874 342.148 69.9388 344.148 83.2281 364.593C88.5438 372.771 91.2708 379.012 93.4199 385.22C99.5754 403.003 109.538 425.175 110.053 443.695C110.316 453.172 113.766 465.479 110.053 474.299C108.709 477.491 100.664 493.546 97.1161 481.13"/>`
function head(height: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 438 545" fill="none" stroke="${COBALT}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round">${PORTRAIT}</svg>`
  return img(svgUri(svg), { width: Math.round((height * 438) / 545), height })
}

function loaf(width: number, style: Style = {}) {
  const svg = ART.loaf
    .replaceAll('var(--ink)', COBALT)
    .replace(/var\(--paper[\w-]*\)/g, CREAM)
  const vb = svg
    .match(/viewBox="([\d.\s-]+)"/)![1]
    .split(/\s+/)
    .map(Number)
  const withNs = svg.includes('xmlns=')
    ? svg
    : svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
  return img(svgUri(withNs), {
    width,
    height: Math.round((width * vb[3]) / vb[2]),
    ...style,
  })
}

/* ---------------------------------------------------------------- photos */

const SHADOW = '0 2px 4px rgba(0,0,0,.1), 0 18px 34px -14px rgba(0,0,0,.4)'

const photoCache = new Map<string, Promise<Buffer>>()
async function fetchPhoto(url: string) {
  if (!photoCache.has(url)) {
    photoCache.set(
      url,
      (async () => {
        let err: unknown
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const res = await fetch(url)
            if (!res.ok) throw new Error(`${res.status} fetching ${url}`)
            return Buffer.from(await res.arrayBuffer())
          } catch (e) {
            err = e
          }
        }
        throw err
      })()
    )
  }
  return photoCache.get(url)!
}

/** A bake photo from the worker, cropped to the box at 2× and inlined as a JPEG. */
export async function bakePhoto(url: string, w: number, h: number) {
  const buf = await fetchPhoto(`${WORKER_BASE}${url}`)
  const jpg = await sharp(buf)
    .rotate()
    .resize(w * 2, h * 2, { fit: 'cover' })
    .jpeg({ quality: 82 })
    .toBuffer()
  return `data:image/jpeg;base64,${jpg.toString('base64')}`
}

// A tilted photo print with the cobalt border, like the photos on the site.
function print(
  src: string,
  box: {
    left: number
    top: number
    w: number
    h: number
    rotate: number
    round?: boolean
  }
) {
  const radius = box.round ? box.w / 2 : 12
  return div(
    {
      position: 'absolute',
      left: box.left,
      top: box.top,
      width: box.w,
      height: box.h,
      border: `3px solid ${COBALT}`,
      borderRadius: radius,
      overflow: 'hidden',
      background: CREAM2,
      boxShadow: SHADOW,
      transform: `rotate(${box.rotate}deg)`,
    },
    img(src, { width: box.w - 6, height: box.h - 6, objectFit: 'cover' })
  )
}

/* ---------------------------------------------------------------- type */

const H1: Style = {
  fontFamily: 'Pangram',
  fontWeight: 800,
  letterSpacing: '-0.012em',
  lineHeight: 1.02,
}
const KICKER: Style = {
  fontFamily: 'Pangram',
  fontWeight: 600,
  fontSize: 22,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'rgba(0,51,230,.7)',
}

function card(...children: Child[]) {
  return div(
    {
      position: 'relative',
      width: OG_W,
      height: OG_H,
      background: CREAM,
      color: COBALT,
      fontFamily: 'Compact',
      overflow: 'hidden',
    },
    ...children
  )
}

/* ---------------------------------------------------------------- cards */

// Erin's whole line drawing of Greg, as on the homepage. resvg has no non-scaling-stroke, so the
// stroke is set in drawing units to come out at `stroke` px.
function greg(height: number, stroke: number, style: Style = {}) {
  const width = Math.round((height * GREG_W) / GREG_H)
  const sw = (stroke * GREG_H) / height
  const pad = sw
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${GREG_W + 2 * pad} ${GREG_H + 2 * pad}" fill="none" stroke="${COBALT}" stroke-width="${sw.toFixed(2)}" stroke-linecap="round" stroke-linejoin="round">${GREG.map((d) => `<path d="${d}"/>`).join('')}</svg>`
  const k = height / GREG_H
  return img(svgUri(svg), { width: width + 2 * pad * k, height: height + 2 * pad * k, ...style })
}

export async function homeCard() {
  return card(
    greg(500, 3.5, { position: 'absolute', left: 125, top: 65 }),
    div(
      {
        position: 'absolute',
        left: 540,
        top: 0,
        height: OG_H,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
      },
      text({ ...H1, fontSize: 96 }, "Hi, I'm Greg."),
      uline(540),
      div(
        { flexDirection: 'column', fontSize: 34, lineHeight: 1.3 },
        text({}, 'I bake bread and build software'),
        text({}, 'in New York.')
      )
    )
  )
}

export async function bakeLogCard(photoUrls: string[]) {
  const boxes = [
    { left: 650, top: 70, w: 240, h: 305, rotate: -7 },
    { left: 880, top: 50, w: 240, h: 305, rotate: 5 },
    { left: 760, top: 250, w: 260, h: 325, rotate: -1.5 },
  ]
  // Oldest of the three at the back, newest on top.
  const urls = photoUrls.slice(0, 3).reverse()
  const prints = await Promise.all(
    urls.map(async (u, i) => print(await bakePhoto(u, boxes[i].w, boxes[i].h), boxes[i]))
  )
  return card(
    text({ ...KICKER, position: 'absolute', left: 90, top: 220 }, 'Greg Skriloff'),
    text({ ...H1, position: 'absolute', left: 86, top: 260, fontSize: 120 }, 'Bake log'),
    under(500, 80, 400),
    ...prints
  )
}

type BakeCardData = {
  title: string
  date: string
  photoUrl?: string
  notes?: string | null
}

export async function bakeCard({ title, date, photoUrl, notes }: BakeCardData) {
  const size = title.length > 26 ? 64 : title.length > 14 ? 76 : 84
  const mark = div(
    { alignItems: 'center', gap: 12, fontFamily: 'Pangram', fontSize: 24 },
    loaf(46),
    "Greg's bake log"
  )
  const column = (...kids: Child[]) =>
    div(
      {
        position: 'absolute',
        left: 580,
        top: 0,
        width: 560,
        height: OG_H,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
      },
      text({ ...KICKER, marginBottom: 14 }, date),
      text({ ...H1, fontSize: size }, title),
      uline(Math.min(470, 140 + title.length * 34)),
      ...kids,
      mark
    )

  let photo: string | null = null
  if (photoUrl) {
    try {
      photo = await bakePhoto(photoUrl, 410, 510)
    } catch (e) {
      console.warn(`[og] falling back to the loaf for "${title}":`, e)
    }
  }

  if (photo) {
    return card(
      print(photo, { left: 70, top: 60, w: 410, h: 510, rotate: -2.5 }),
      column()
    )
  }

  const note = notes?.trim().replace(/\s+/g, ' ')
  const short =
    note && note.length > 90
      ? `${note
          .slice(0, 88)
          .replace(/\s+\S*$/, '')
          .replace(/[,.;:]$/, '')}...`
      : note
  return card(
    div(
      {
        position: 'absolute',
        left: 110,
        top: 150,
        width: 360,
        transform: 'rotate(-8deg)',
      },
      loaf(360)
    ),
    column(
      short &&
        text(
          {
            fontSize: 30,
            lineHeight: 1.4,
            color: 'rgba(0,51,230,.85)',
            marginBottom: 30,
          },
          `“${short}”`
        )
    )
  )
}

export async function blogCard() {
  return card(
    eyes(230, 860, 185, -4),
    text({ ...KICKER, position: 'absolute', left: 90, top: 185 }, 'Greg Skriloff'),
    text({ ...H1, position: 'absolute', left: 86, top: 225, fontSize: 140 }, 'Blog'),
    under(330, 80, 380),
    text(
      { position: 'absolute', left: 90, top: 440, fontSize: 36 },
      'A few things I wrote.'
    )
  )
}

export async function articleCard({ title, date }: { title: string; date: string }) {
  return card(
    div(
      {
        position: 'absolute',
        left: 86,
        top: 60,
        width: 920,
        height: 390,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
      },
      text({ ...KICKER, marginLeft: 4, marginBottom: 12 }, date),
      text({ ...H1, fontSize: title.length > 70 ? 64 : 76 }, title),
      uline(300)
    ),
    div(
      { position: 'absolute', left: 90, top: 470, alignItems: 'center', gap: 22 },
      div(
        {
          width: 96,
          height: 96,
          borderRadius: 48,
          background: CREAM2,
          border: `3px solid ${COBALT}`,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        head(84)
      ),
      text({ fontFamily: 'Pangram', fontWeight: 800, fontSize: 30 }, 'Greg Skriloff')
    ),
    eyes(120, OG_W - 70 - 120, OG_H - 40 - 120 * (130 / 210), 6)
  )
}

/* ---------------------------------------------------------------- render */

let fonts: Promise<
  { name: string; data: Buffer; weight: 400 | 600 | 800; style: 'normal' }[]
> | null = null
function loadFonts() {
  fonts ??= Promise.all(
    (
      [
        ['Pangram', 'pangram-regular.otf', 400],
        ['Pangram', 'pangram-semibold.otf', 600],
        ['Pangram', 'pangram-extrabold.otf', 800],
        ['Compact', 'pangram-compact-regular.otf', 400],
      ] as const
    ).map(async ([name, file, weight]) => ({
      name,
      weight,
      style: 'normal' as const,
      data: await fs.readFile(path.join(process.cwd(), 'src/fonts', file)),
    }))
  )
  return fonts
}

export async function renderPng(node: Node) {
  const svg = await satori(node as never, {
    width: OG_W,
    height: OG_H,
    fonts: await loadFonts(),
  })
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: OG_W } }).render().asPng()
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } })
}
