/*
  Crunch sounds for biting the bread stickers, made with Web Audio (no files to load).
  Each bite is a few short bursts of filtered noise; the last bite adds a little gulp.
  Anything that goes wrong (no Web Audio, autoplay rules, etc.) just means no sound.
*/
let ctx = null
let noise = null

function audio() {
  if (ctx) return ctx
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  ctx = new AC()
  // one second of white noise, reused by every grain
  noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
  const d = noise.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  return ctx
}

function grain(c, at, { freq, q = 1.2, len, gain }) {
  const src = c.createBufferSource()
  src.buffer = noise
  const bp = c.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = freq
  bp.Q.value = q
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(gain, at + 0.004)
  g.gain.exponentialRampToValueAtTime(0.0001, at + len)
  src.connect(bp).connect(g).connect(c.destination)
  src.start(at, Math.random() * 0.8, len + 0.02)
}

function gulp(c, at) {
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = 'sine'
  o.frequency.setValueAtTime(320, at)
  o.frequency.exponentialRampToValueAtTime(110, at + 0.14)
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(0.18, at + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.16)
  o.connect(g).connect(c.destination)
  o.start(at)
  o.stop(at + 0.2)
}

/** Play one bite. `last` adds a longer crunch and a gulp. */
export function crunch(last = false) {
  try {
    const c = audio()
    if (!c) return
    if (c.state === 'suspended') c.resume().catch(() => {})
    const t = c.currentTime + 0.01
    const n = last ? 7 : 3 + Math.floor(Math.random() * 3)
    let at = t
    for (let i = 0; i < n; i++) {
      // a crisp crack, then a duller crumble underneath it
      grain(c, at, { freq: 2200 + Math.random() * 2600, q: 0.9, len: 0.025 + Math.random() * 0.035, gain: 0.35 + Math.random() * 0.25 })
      grain(c, at + 0.004, { freq: 600 + Math.random() * 500, q: 0.7, len: 0.05 + Math.random() * 0.04, gain: 0.18 })
      at += 0.025 + Math.random() * 0.045
    }
    if (last) gulp(c, at + 0.12)
  } catch (e) {
    /* no sound, no problem */
  }
}
