/*
  Loaf Around: a small bread-baking clicker for /game.
  Click the bread to bake loaves, spend them on help that bakes on its own,
  and come back later to whatever the bakery made while you were gone.
  Everything saves to localStorage; every access is wrapped, so a blocked
  or full storage just means progress lasts until the tab closes.
*/

const KEY = 'gb-loaf-around-v1'
const GROWTH = 1.16 // each extra of the same helper costs 16% more
const AWAY_CAP = 7 * 24 * 3600 // count at most a week of time away
const MILE_BONUS = 0.05 // each milestone adds 5% to everything helpers bake

const HELPERS = [
  { id: 'jar', name: 'Starter jar', desc: 'Bubbly sourdough starter. Feed it and it feeds you.', cost: 12, lps: 0.2 },
  { id: 'oven', name: 'Extra oven', desc: 'One more deck to bake on.', cost: 90, lps: 1.2 },
  { id: 'apprentice', name: 'Apprentice', desc: 'Eager, floury, learning to shape.', cost: 900, lps: 7 },
  { id: 'stall', name: 'Market stall', desc: 'Saturday mornings. Sold out by ten.', cost: 9500, lps: 40 },
  { id: 'bakery', name: 'Corner bakery', desc: 'A storefront with a bell on the door.', cost: 110000, lps: 220 },
  { id: 'mill', name: 'Stone mill', desc: 'Fresh flour, ground down the street.', cost: 1.2e6, lps: 1300 },
  { id: 'field', name: 'Wheat field', desc: 'Grow the grain yourself. Very patient.', cost: 1.5e7, lps: 7000 },
]

// One-time techniques. `show` decides when one appears in the shop.
const TECH = [
  { id: 'flour', name: 'Better flour', desc: 'Every press bakes twice as much.', cost: 80, show: (s) => s.total >= 30, click: 2 },
  { id: 'feed', name: 'Rye feed', desc: 'Starter jars bake twice as fast.', cost: 400, show: (s) => own(s, 'jar') >= 5, helper: ['jar', 2] },
  { id: 'fold', name: 'Stretch and fold', desc: 'Presses bake twice as much again.', cost: 600, show: (s) => s.total >= 250, click: 2 },
  { id: 'peel', name: 'Long wooden peel', desc: 'Ovens bake twice as fast.', cost: 3000, show: (s) => own(s, 'oven') >= 5, helper: ['oven', 2] },
  { id: 'steam', name: 'Steam in the oven', desc: 'Presses bake three times as much.', cost: 6000, show: (s) => s.total >= 2000, click: 3 },
  { id: 'radio', name: 'Kitchen radio', desc: 'Apprentices work twice as fast.', cost: 25000, show: (s) => own(s, 'apprentice') >= 5, helper: ['apprentice', 2] },
  { id: 'lame', name: 'Sharp lame', desc: 'Each press also adds 4% of your loaves per second.', cost: 50000, show: (s) => s.total >= 15000, share: 0.04 },
  { id: 'awning', name: 'Striped awning', desc: 'Market stalls sell twice as much.', cost: 250000, show: (s) => own(s, 'stall') >= 5, helper: ['stall', 2] },
  { id: 'banneton', name: 'Cane banneton', desc: 'Presses bake four times as much.', cost: 400000, show: (s) => s.total >= 100000, click: 4 },
  { id: 'bell', name: 'Brass door bell', desc: 'Corner bakeries bake twice as much.', cost: 3e6, show: (s) => own(s, 'bakery') >= 5, helper: ['bakery', 2] },
]

const MILES = [
  { id: 'm1', at: 100, name: 'First batch' },
  { id: 'm2', at: 1000, name: 'Farmers market regular' },
  { id: 'm3', at: 10000, name: 'Neighborhood favorite' },
  { id: 'm4', at: 100000, name: 'Line out the door' },
  { id: 'm5', at: 1e6, name: 'Bread famous' },
  { id: 'm6', at: 1e7, name: 'Carb dynasty' },
  { id: 'm7', at: 1e8, name: 'Breadwinner' },
  { id: 'c1', clicks: 500, name: 'Strong wrists' },
  { id: 'c2', clicks: 5000, name: 'Forearms of steel' },
]

// The bread you press changes as the bakery grows.
const BREADS = [
  { id: 'loaf', at: 0, name: 'Country loaf' },
  { id: 'babka', at: 10000, name: 'Babka' },
  { id: 'baguette', at: 1e6, name: 'Baguette' },
]

function own(s, id) {
  return s.owned[id] || 0
}

function fresh() {
  return { loaves: 0, total: 0, clicks: 0, owned: {}, tech: [], miles: [], t: Date.now() }
}

const num = (v) => (typeof v === 'number' && isFinite(v) && v >= 0 ? v : 0)

function load() {
  let raw = null
  try {
    raw = localStorage.getItem(KEY)
  } catch (e) {
    /* storage blocked */
  }
  if (!raw) return null
  try {
    const d = JSON.parse(raw)
    const s = fresh()
    s.loaves = num(d.loaves)
    s.total = Math.max(num(d.total), s.loaves)
    s.clicks = Math.floor(num(d.clicks))
    for (const h of HELPERS) s.owned[h.id] = Math.floor(num(d.owned && d.owned[h.id]))
    s.tech = Array.isArray(d.tech) ? d.tech.filter((id) => TECH.some((t) => t.id === id)) : []
    s.miles = Array.isArray(d.miles) ? d.miles.filter((id) => MILES.some((m) => m.id === id)) : []
    s.t = num(d.t) || Date.now()
    return s
  } catch (e) {
    return null
  }
}

function save() {
  state.t = Date.now()
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch (e) {
    /* storage blocked or full: progress lasts until the tab closes */
  }
}

function forget() {
  try {
    localStorage.removeItem(KEY)
  } catch (e) {
    /* nothing to forget */
  }
}

/* ---------- the numbers ---------- */

const has = (id) => state.tech.includes(id)

function helperRate(h) {
  let r = h.lps
  for (const t of TECH) if (t.helper && t.helper[0] === h.id && has(t.id)) r *= t.helper[1]
  return r * (1 + MILE_BONUS * state.miles.length)
}

function lps() {
  let total = 0
  for (const h of HELPERS) total += own(state, h.id) * helperRate(h)
  return total
}

function perClick() {
  let v = 1
  let share = 0
  for (const t of TECH) {
    if (!has(t.id)) continue
    if (t.click) v *= t.click
    if (t.share) share += t.share
  }
  return v + share * lps()
}

const costOf = (h) => Math.ceil(h.cost * Math.pow(GROWTH, own(state, h.id)))

const UNITS = ['million', 'billion', 'trillion', 'quadrillion', 'quintillion', 'sextillion']
function fmt(n, decimals = 0) {
  if (n < 1e6) {
    if (decimals && n < 100 && n % 1) return n.toFixed(decimals).replace(/\.0$/, '')
    return Math.floor(n).toLocaleString('en-US')
  }
  const e = Math.min(Math.floor(Math.log10(n) / 3), UNITS.length + 1)
  return (n / Math.pow(1000, e)).toFixed(2).replace(/\.?0+$/, '') + ' ' + UNITS[e - 2]
}
const plural = (n, one, many) => (Math.floor(n) === 1 && n < 2 ? one : many)

function duration(sec) {
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  if (d) return `${d}d ${h}h`
  if (h) return `${h}h ${m}m`
  if (m) return `${m} min`
  return `${Math.floor(sec)} sec`
}

/* ---------- the page ---------- */

const $ = (id) => document.getElementById(id)
const el = {
  count: $('gm-count'),
  unit: $('gm-unit'),
  rate: $('gm-rate'),
  bread: $('gm-bread'),
  stage: $('gm-stage'),
  breadName: $('gm-bread-name'),
  perClick: $('gm-per-click'),
  helpers: $('gm-helpers'),
  tech: $('gm-tech'),
  techNone: $('gm-tech-none'),
  miles: $('gm-miles'),
  stats: $('gm-stats'),
  away: $('gm-away'),
  say: $('gm-say'),
  sayCount: $('gm-say-count'),
  reset: $('gm-reset'),
  confirm: $('gm-confirm'),
  yes: $('gm-yes'),
  no: $('gm-no'),
}
const arts = Object.fromEntries(BREADS.map((b) => [b.id, $('gm-art-' + b.id)]))
const motion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: no-preference)') : { matches: true }

let state = load() || fresh()

function say(msg) {
  // clear first so the same message twice is still read out
  el.say.textContent = ''
  setTimeout(() => (el.say.textContent = msg), 30)
}

// helper rows are built once and updated in place
const rows = HELPERS.map((h) => {
  const li = document.createElement('li')
  const b = document.createElement('button')
  b.type = 'button'
  b.className = 'gm-buy'
  b.innerHTML =
    '<span class="gm-buy-text"><span class="gm-buy-name"></span><span class="gm-buy-desc"></span></span>' +
    '<span class="gm-buy-side"><span class="gm-buy-cost"></span><span class="gm-buy-own"></span></span>'
  b.querySelector('.gm-buy-name').textContent = h.name
  b.querySelector('.gm-buy-desc').textContent = h.desc
  b.addEventListener('click', () => buyHelper(h))
  li.appendChild(b)
  el.helpers.appendChild(li)
  return {
    h,
    li,
    b,
    cost: b.querySelector('.gm-buy-cost'),
    own: b.querySelector('.gm-buy-own'),
    desc: b.querySelector('.gm-buy-desc'),
  }
})

function setText(node, text) {
  if (node.textContent !== text) node.textContent = text
}
function setAttr(node, name, value) {
  if (node.getAttribute(name) !== value) node.setAttribute(name, value)
}

function buyHelper(h) {
  const c = costOf(h)
  if (state.loaves < c) {
    say(`${h.name} costs ${fmt(c)} loaves. You need ${fmt(c - state.loaves)} more.`)
    return
  }
  state.loaves -= c
  state.owned[h.id] = own(state, h.id) + 1
  say(`Bought a ${h.name.toLowerCase()}. You have ${state.owned[h.id]}.`)
  render()
  save()
}

function buyTech(t) {
  if (has(t.id)) return
  if (state.loaves < t.cost) {
    say(`${t.name} costs ${fmt(t.cost)} loaves. You need ${fmt(t.cost - state.loaves)} more.`)
    return
  }
  state.loaves -= t.cost
  state.tech.push(t.id)
  say(`Learned ${t.name.toLowerCase()}. ${t.desc}`)
  // the bought button disappears; keep keyboard focus in the shop
  const wasFocused = document.activeElement && document.activeElement.dataset.id === t.id
  techKey = null
  render()
  if (wasFocused) (el.tech.querySelector('button') || el.helpers.querySelector('button')).focus()
  save()
}

let techKey = null
function renderTech() {
  const avail = TECH.filter((t) => !has(t.id) && t.show(state))
  const key = avail.map((t) => t.id).join()
  if (key !== techKey) {
    const hadFocus = el.tech.contains(document.activeElement) ? document.activeElement.dataset.id : null
    techKey = key
    el.tech.textContent = ''
    for (const t of avail) {
      const li = document.createElement('li')
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'gm-tech-btn'
      b.dataset.id = t.id
      b.innerHTML = '<span class="gm-buy-name"></span><span class="gm-buy-desc"></span><span class="gm-buy-cost"></span>'
      b.children[0].textContent = t.name
      b.children[1].textContent = t.desc
      b.children[2].textContent = fmt(t.cost) + ' loaves'
      b.addEventListener('click', () => buyTech(t))
      li.appendChild(b)
      el.tech.appendChild(li)
      if (hadFocus === t.id) b.focus()
    }
    el.techNone.hidden = avail.length > 0
  }
  for (const b of el.tech.querySelectorAll('button')) {
    const t = TECH.find((x) => x.id === b.dataset.id)
    setAttr(b, 'aria-disabled', String(state.loaves < t.cost))
  }
}

function checkMiles() {
  for (const m of MILES) {
    if (state.miles.includes(m.id)) continue
    if ((m.at && state.total >= m.at) || (m.clicks && state.clicks >= m.clicks)) {
      state.miles.push(m.id)
      say(`Milestone: ${m.name}! Your helpers now bake ${Math.round(MILE_BONUS * 100)}% more.`)
      milesKey = null
    }
  }
}

let milesKey = null
function renderMiles() {
  const key = state.miles.join()
  if (key === milesKey) return
  milesKey = key
  el.miles.textContent = ''
  for (const m of MILES) {
    const li = document.createElement('li')
    const done = state.miles.includes(m.id)
    li.className = done ? 'done' : ''
    const goal = m.at ? `Bake ${fmt(m.at)} loaves` : `Press the bread ${fmt(m.clicks)} times`
    li.innerHTML = '<span class="gm-mile-mark" aria-hidden="true"></span><span class="gm-mile-name"></span><span class="gm-mile-goal"></span>'
    li.children[0].textContent = done ? '✓' : ''
    li.children[1].textContent = m.name
    li.children[2].textContent = goal + (done ? '' : ' (not yet)')
    el.miles.appendChild(li)
  }
}

let breadId = ''
function renderBread() {
  let b = BREADS[0]
  for (const x of BREADS) if (state.total >= x.at) b = x
  if (b.id === breadId) return
  const first = !breadId
  breadId = b.id
  for (const x of BREADS) arts[x.id].hidden = x.id !== b.id
  el.breadName.textContent = b.name
  if (!first) say(`Your bakery has grown. You're baking ${b.name.toLowerCase()} now.`)
}

function render() {
  checkMiles()
  const rate = lps()
  setText(el.count, fmt(state.loaves))
  setText(el.unit, plural(state.loaves, 'loaf', 'loaves'))
  setText(el.rate, `${fmt(rate, 1)} per second`)
  setText(el.perClick, `Each press bakes ${fmt(perClick(), 1)} ${plural(perClick(), 'loaf', 'loaves')}.`)
  for (const r of rows) {
    const c = costOf(r.h)
    const n = own(state, r.h.id)
    setText(r.cost, fmt(c))
    setText(r.own, String(n))
    setText(r.desc, r.h.desc + ` Bakes ${fmt(helperRate(r.h), 1)} a second.`)
    setAttr(r.b, 'aria-disabled', String(state.loaves < c))
    setAttr(r.b, 'aria-label', `${r.h.name}, costs ${fmt(c)} loaves, you own ${n}. ${r.h.desc} Bakes ${fmt(helperRate(r.h), 1)} loaves a second each.`)
    // a helper shows up once you're close to affording the one before it
    const i = HELPERS.indexOf(r.h)
    r.li.hidden = !(i < 2 || n > 0 || own(state, HELPERS[i - 1].id) > 0 || state.total >= r.h.cost * 0.5)
  }
  renderTech()
  renderMiles()
  renderBread()
  setText(
    el.stats,
    `${fmt(state.total)} baked in all · ${fmt(state.clicks)} ${plural(state.clicks, 'press', 'presses')} · ${state.tech.length} of ${TECH.length} techniques`
  )
}

/* ---------- pressing the bread ---------- */

let sayTimer = 0
let floats = 0

function bake(e) {
  const v = perClick()
  state.loaves += v
  state.total += v
  state.clicks += 1
  render()

  // screen readers hear the total once the pressing pauses
  clearTimeout(sayTimer)
  sayTimer = setTimeout(() => (el.sayCount.textContent = `${fmt(state.loaves)} ${plural(state.loaves, 'loaf', 'loaves')}`), 700)

  if (!motion.matches || !el.bread.animate) return
  el.bread.animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(.93, .89)' }, { transform: 'scale(1.03, 1.02)' }, { transform: 'scale(1)' }],
    { duration: 220, easing: 'ease-out' }
  )
  if (floats > 24) return
  const box = el.stage.getBoundingClientRect()
  // keyboard presses (detail 0) float from the middle of the bread
  let x = e && e.detail && e.clientX ? e.clientX - box.left : box.width / 2 + (Math.random() - 0.5) * 60
  let y = e && e.detail && e.clientY ? e.clientY - box.top : box.height * 0.4
  x = Math.max(32, Math.min(box.width - 32, x))
  const f = document.createElement('span')
  f.className = 'gm-float'
  f.setAttribute('aria-hidden', 'true')
  f.textContent = '+' + fmt(v, 1)
  f.style.left = x + 'px'
  f.style.top = y + 'px'
  el.stage.appendChild(f)
  floats++
  const drift = (Math.random() - 0.5) * 24
  const a = f.animate(
    [
      { transform: 'translate(-50%, -50%) scale(.8)', opacity: 0 },
      { transform: 'translate(-50%, -110%) scale(1)', opacity: 1, offset: 0.15 },
      { transform: `translate(calc(-50% + ${drift}px), -380%) scale(1)`, opacity: 0 },
    ],
    { duration: 900, easing: 'cubic-bezier(.2,.7,.3,1)' }
  )
  const done = () => {
    if (!f.isConnected) return
    f.remove()
    floats--
  }
  a.onfinish = done
  setTimeout(done, 1200)
}

el.bread.addEventListener('click', bake)
// holding Enter would repeat forever; one press, one bake
el.bread.addEventListener('keydown', (e) => {
  if (e.repeat && (e.key === 'Enter' || e.key === ' ')) e.preventDefault()
})

/* ---------- starting over ---------- */

function showConfirm(on) {
  el.reset.hidden = on
  el.confirm.hidden = !on
  ;(on ? el.no : el.reset).focus()
}
el.reset.addEventListener('click', () => showConfirm(true))
el.no.addEventListener('click', () => showConfirm(false))
el.yes.addEventListener('click', () => {
  state = fresh()
  forget()
  techKey = milesKey = null
  breadId = ''
  el.away.hidden = true
  render()
  showConfirm(false)
  el.bread.focus()
  say('Fresh start. The oven is warm.')
})

/* ---------- time passing ---------- */

// what the bakery made while the page was closed
;(function away() {
  const sec = Math.min(Math.max((Date.now() - state.t) / 1000, 0), AWAY_CAP)
  const gain = lps() * sec
  if (gain < 1) return
  state.loaves += gain
  state.total += gain
  // a quick reload isn't worth a message
  if (sec < 60) return
  el.away.textContent = `While you were away (${duration(sec)}), your bakery baked ${fmt(gain)} ${plural(gain, 'loaf', 'loaves')}.`
  el.away.hidden = false
})()

let last = Date.now()
function tick() {
  const now = Date.now()
  const dt = Math.min(Math.max((now - last) / 1000, 0), AWAY_CAP)
  last = now
  const gain = lps() * dt
  state.loaves += gain
  state.total += gain
  render()
}

render()
save()
setInterval(tick, 100)
setInterval(save, 5000)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') save()
  else tick()
})
window.addEventListener('pagehide', save)

document.documentElement.classList.add('gm-ready')
