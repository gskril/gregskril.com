/*
  Crunch sounds for biting the bread stickers. Four short recordings in /sfx;
  each bite plays a random one (never the same twice in a row) at a slightly
  different pitch so it doesn't sound canned.
  Anything that goes wrong (no Web Audio, autoplay rules, a failed fetch) just means no sound.
*/
const FILES = [1, 2, 3, 4].map((n) => `/sfx/crunch-${n}.mp3`)

let ctx = null
let bytes = null // Promise<ArrayBuffer[]>, fetched before anyone clicks
let clips = null // Promise<{ buf, start }[]>, decoded on the first bite
let lastPick = -1

function fetchAll() {
  // one file failing to load just leaves it out of the rotation
  bytes ??= Promise.all(
    FILES.map((f) =>
      fetch(f)
        .then((r) => (r.ok ? r.arrayBuffer() : null))
        .catch(() => null)
    )
  )
  return bytes
}

// some clips open with a little silence; skip it so the crunch lands on the click
function firstSound(buf) {
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++)
    if (Math.abs(d[i]) > 0.05) return Math.max(0, i / buf.sampleRate - 0.005)
  return 0
}

function decodeAll(c) {
  clips ??= fetchAll().then((list) =>
    Promise.all(
      list.map((ab) =>
        ab
          ? c.decodeAudioData(ab.slice(0)).then(
              (buf) => ({ buf, start: firstSound(buf) }),
              () => null
            )
          : null
      )
    ).then((all) => all.filter(Boolean))
  )
  return clips
}

function audio() {
  if (ctx) return ctx
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  ctx = new AC()
  return ctx
}

/** Get the files ready ahead of time, without making any sound. */
export function preloadCrunch() {
  try {
    fetchAll().catch(() => {})
  } catch (e) {
    /* no sound, no problem */
  }
}

/** Play one bite. `last` makes the final bite a touch louder and lower. */
export function crunch(last = false) {
  try {
    const c = audio()
    if (!c) return
    if (c.state === 'suspended') c.resume().catch(() => {})
    const asked = performance.now()
    decodeAll(c)
      .then((list) => {
        // the very first bite may wait on decoding; if that takes too long, skip it
        if (!list.length || performance.now() - asked > 250) return
        let i = Math.floor(Math.random() * list.length)
        if (list.length > 1 && i === lastPick) i = (i + 1) % list.length
        lastPick = i
        const { buf, start } = list[i]
        const src = c.createBufferSource()
        src.buffer = buf
        src.playbackRate.value = (last ? 0.88 : 0.94) + Math.random() * 0.12
        const g = c.createGain()
        g.gain.value = last ? 0.9 : 0.7
        src.connect(g).connect(c.destination)
        src.start(0, start)
      })
      .catch(() => {})
  } catch (e) {
    /* no sound, no problem */
  }
}
