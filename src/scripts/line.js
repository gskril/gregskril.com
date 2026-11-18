/*
  One line.

  A single line runs the length of the page and is drawn as you scroll. On the way
  down it draws Erin's portrait of Greg, underlines things, circles a project, makes
  50 tally marks, wraps the photos and ties a bow around the links.

  Its scribbles are Erin's real strokes from goodbread.nyc, placed exactly. The long
  wandering runs between them borrow the shape of her hero line and dividers. The whole
  route is re-measured from the live layout on every resize, so it always fits the page.
*/
import { GREG, GREG_W } from '../portrait.js';

(() => {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);
  const page = $('#page');
  const svg = $('#line');
  const strokes = [];
  const tip = $('#tip');

  /* ---------- illustrations (inlined so the palettes can recolor them) ---------- */
  document.querySelectorAll('[data-art]').forEach((el) => {
    const art = window.GB_ART && window.GB_ART[el.dataset.art];
    if (art && !el.firstChild) el.innerHTML = art;
  });

  if (!svg || !page) return;

  /* ---------- Erin's strokes, straight from the Good Bread source ---------- */
  const RAW = {
    under2: 'M81.3929 4.85662C209.236 8.57393 337.38 1 465.321 1C496.044 1 526.647 2.14043 557.301 3.78533C569.123 4.41973 582.348 3.68178 594.016 5.82077C600.565 7.02126 580.645 6.78493 573.943 6.78493C535.427 6.78493 496.959 5.07087 458.46 5.07087C400.283 5.07087 342.639 8.75387 284.41 7.21344C231.199 5.80579 178.821 9.04271 125.731 10.6415C107.549 11.1891 89.4244 12.3356 71.2293 12.5699C63.4853 12.6695 40.4677 13.4245 48.1073 14.4982C81.114 19.1369 117.536 17.6974 150.759 18.7833C236.319 21.5797 321.777 22.2114 407.388 22.2114C481.095 22.2114 554.711 20.2831 628.445 20.2831C634.423 20.2831 655.259 19.2748 654.998 19.3189C626.668 24.0967 593.884 22.4043 565.304 23.0684C499.485 24.598 433.497 21.2407 367.751 23.4969C327.46 24.8796 287.432 27.8925 247.059 27.9963C205.261 28.1038 163.546 25.8301 121.793 24.5682C98.2648 23.8571 74.8678 23.107 51.4104 21.3544C38.2353 20.37 22.573 22.4702 9.86696 19.3189C7.80353 18.8072 -0.843286 18.3548 1.355 18.3548C9.55677 18.3548 41.2056 14.2142 44.8041 20.2831',
    under: 'M306 7.43138C304.04 -6.6374 286.503 6.15162 282.118 10.3037C257.82 33.3098 215.878 24.3375 184.187 19.8783C148.845 14.9053 119.761 29.2492 85.322 29.9847C58.5313 30.5569 39.1608 14.8971 14.4755 11.474C8.11428 10.5918 6.37529 9.96159 0.999998 13.1761',
    circle: 'M420.067 24.9491C359.244 15.3189 295.637 11.4902 234.231 15.9641C172.204 20.4832 113.549 40.2749 55.2626 60.5967C46.4234 63.6785 -22.3035 83.4055 9.24205 101.285C20.3588 107.585 32.5795 111.957 44.8897 115.383C86.8879 127.072 151.018 136.917 193.032 141.681C252.509 148.423 311.513 149.531 371.197 147.086C429.359 144.704 488.139 144.068 546.148 139.197C558.413 138.167 626.846 136.529 610.869 107.494C600.319 88.3209 582.386 79.2995 562.511 70.3852C487.681 36.8218 404.021 21.8318 323.497 9.75498C286.029 4.13574 245.9 -0.711186 207.715 1.86575C201 2.31892 201.088 2.67033 196.538 3.9111',
    hero: 'M-367 9.39998C-333.207 -0.447585 -290.743 -2.29972 -256.628 7.40599C-229.595 15.0971 -206.777 19.0548 -177.729 19.1886C-76.7695 19.6538 24.815 2.72465 125.63 13.8411C150.697 16.6053 175.31 21.5224 200.486 23.7204C225.184 25.8767 250.1 25.8731 274.905 25.6237C316.381 25.2068 357.553 22.6542 398.608 17.9197C444.73 12.6011 491.639 15.7221 538.048 15.9257C595.119 16.1762 652.251 19.0073 709.288 19.0073C742.165 19.0073 774.23 20.2141 807.202 21.5451C880.552 24.5062 953.466 20.0027 1026.74 21.2732C1063.76 21.915 1096.3 25.7627 1130.78 36.9532C1155.55 44.9929 1176.13 49.6646 1202.9 49.9141C1242.43 50.2824 1282.71 49.4212 1322.23 48.192C1366.64 46.811 1410.99 42.0288 1455.45 42.0288C1463.02 42.0288 1475.47 40.0471 1482 43.6602',
    div1: 'M1061.37 7.78781C947.082 11.5522 832.631 11.3895 718.296 12.6913C671.333 13.226 624.441 14.0509 577.534 16.6896C533.479 19.1679 489.473 23.8219 445.349 24.837C415.852 25.5155 386.282 23.8563 356.77 23.8563C263.614 23.8563 170.052 24.2007 76.9757 20.0843C50.8352 18.9282 24.4786 14.6061 0 4.8457',
    div2: 'M0 77.1685C67.5213 48.4987 138.687 30.944 211.644 22.9084C280.655 15.3074 349.533 15.6425 418.113 27.196C467.048 35.4397 514.639 55.7306 564.852 55.7306C608.623 55.7306 651.048 40.622 692.962 30.1529C729.22 21.0966 764.7 14.1574 802 11.3763C832.763 9.08256 863.945 8.26219 894.774 9.74994C924.022 11.1613 952.944 15.9723 982.078 18.6208C1073.14 26.8995 1165.04 30.4829 1256.41 33.997C1334.16 36.9873 1410.56 32.7665 1487.35 20.395C1504.12 17.6921 1520.55 15.1374 1537.47 13.7418C1548.68 12.817 1559.92 12.0103 1571.1 10.7849C1574.47 10.4154 1573.54 10.5871 1575.47 9.3064',
  };

  /* Erin's portrait of Greg lives in src/portrait.js */

  const num = /-?\d*\.?\d+(?:e-?\d+)?/gi;
  const parse = (d) => {
    const n = d.match(num).map(Number);
    const segs = [];
    let p = [n[0], n[1]];
    for (let i = 2; i + 5 < n.length; i += 6) {
      const s = [p, [n[i], n[i + 1]], [n[i + 2], n[i + 3]], [n[i + 4], n[i + 5]]];
      segs.push(s);
      p = s[3];
    }
    return segs;
  };
  const bez = (s, t) => {
    const u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
    return [a * s[0][0] + b * s[1][0] + c * s[2][0] + d * s[3][0], a * s[0][1] + b * s[1][1] + c * s[2][1] + d * s[3][1]];
  };
  const polyline = (segs, per = 24) => {
    const pts = [segs[0][0]];
    segs.forEach((s) => { for (let i = 1; i <= per; i++) pts.push(bez(s, i / per)); });
    return pts;
  };
  const ASSET = {};
  for (const k in RAW) {
    const segs = parse(RAW[k]);
    const pts = polyline(segs);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    pts.forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); });
    ASSET[k] = { segs, pts, x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  const GREG_SEGS = GREG.map(parse);

  /* vector helpers */
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const mul = (a, k) => [a[0] * k, a[1] * k];
  const len = (a) => Math.hypot(a[0], a[1]);
  const unit = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const rand = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  /* Place one of Erin's strokes inside a box (optionally flipped, tilted, reversed or trimmed). */
  function fit(name, box, o = {}) {
    const A = ASSET[name];
    let segs = A.segs.slice(o.from || 0, o.to === undefined ? undefined : o.to);
    const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
    const r = ((o.rot || 0) * Math.PI) / 180, cos = Math.cos(r), sin = Math.sin(r);
    const map = ([px, py]) => {
      let u = (px - A.x) / A.w, v = (py - A.y) / A.h;
      if (o.flipX) u = 1 - u;
      if (o.flipY) v = 1 - v;
      const x = box.x + u * box.w - cx, y = box.y + v * box.h - cy;
      return [cx + x * cos - y * sin, cy + x * sin + y * cos];
    };
    segs = segs.map((s) => s.map(map));
    if (o.reverse) segs = segs.reverse().map((s) => [s[3], s[2], s[1], s[0]]);
    return segs;
  }

  /* Waypoints from A to B that wander the way one of Erin's long lines does. */
  function along(name, A, B, o = {}) {
    const P = ASSET[name].pts;
    const n = o.n || 9, amp = o.amp === undefined ? 1 : o.amp;
    const a = P[0], b = P[P.length - 1];
    const chord = sub(b, a), cl = len(chord), cu = unit(chord), cn = [-cu[1], cu[0]];
    const d = sub(B, A), dl = len(d), du = unit(d), dn = [-du[1], du[0]];
    const out = [];
    for (let i = 1; i < n; i++) {
      let q = P[Math.round((i / n) * (P.length - 1))];
      if (o.reverse) q = P[Math.round((1 - i / n) * (P.length - 1))];
      const rel = sub(q, a);
      let t = (rel[0] * cu[0] + rel[1] * cu[1]) / cl;
      let s = (rel[0] * cn[0] + rel[1] * cn[1]) / cl;
      if (o.reverse) t = 1 - t;
      if (o.flip) s = -s;
      out.push(add(add(A, mul(du, t * dl)), mul(dn, clamp(s * dl * amp, -90, 90))));
    }
    return out;
  }

  /* The pen: joins exact strokes with smooth, loose runs through waypoints, and can lift. */
  class Pen {
    constructor() { this.segs = []; this.p = null; this.t = [0, 1]; }
    start(p, t) { this.p = p; this.t = unit(t); this.segs.push({ lift: p }); return this; }
    go(pts, endT) {
      const P = [this.p, ...pts], n = P.length - 1;
      if (n < 1) return this;
      const h = [];
      for (let i = 0; i < n; i++) h[i] = Math.max(len(sub(P[i + 1], P[i])), 0.01);
      const m = [this.t];
      for (let i = 1; i < n; i++) {
        const a = mul(sub(P[i], P[i - 1]), h[i] / h[i - 1]);
        const b = mul(sub(P[i + 1], P[i]), h[i - 1] / h[i]);
        m[i] = unit(add(a, b));
      }
      m[n] = endT ? unit(endT) : unit(sub(P[n], P[n - 1]));
      for (let i = 0; i < n; i++) {
        const k = h[i] / 3;
        this.segs.push([P[i], add(P[i], mul(m[i], k)), sub(P[i + 1], mul(m[i + 1], k)), P[i + 1]]);
      }
      this.p = P[n]; this.t = m[n];
      return this;
    }
    /* run into an exact stroke and draw it */
    stroke(segs, via = []) {
      const s0 = segs[0];
      let t0 = sub(s0[1], s0[0]);
      if (len(t0) < 0.01) t0 = sub(s0[2], s0[0]);
      this.go([...via, s0[0]], t0);
      this.mark(segs);
      return this;
    }
    /* change the pen's weight (1 = the normal line) */
    weight(w) { this.segs.push({ w }); return this; }
    /* lift the pen and draw a stroke somewhere else */
    lift(segs) {
      this.segs.push({ lift: segs[0][0] });
      this.mark(segs);
      return this;
    }
    mark(segs) {
      this.segs.push(...segs);
      const e = segs[segs.length - 1];
      this.p = e[3];
      let t1 = sub(e[3], e[2]);
      if (len(t1) < 0.01) t1 = sub(e[3], e[1]);
      this.t = unit(t1);
    }
  }

  /* ---------- measuring the page ---------- */
  let ox = 0, oy = 0;
  const rect = (el) => {
    if (typeof el === 'string') el = $(el);
    const r = el.getBoundingClientRect();
    const x = r.left - ox, y = r.top - oy;
    return { x, y, w: r.width, h: r.height, r: x + r.width, b: y + r.height, cx: x + r.width / 2, cy: y + r.height / 2 };
  };
  const baseline = (el) => {
    if (typeof el === 'string') el = $(el);
    const s = document.createElement('span');
    s.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
    el.appendChild(s);
    const y = s.getBoundingClientRect().bottom - oy;
    s.remove();
    return y;
  };

  /* ---------- the drawings the pen makes ---------- */

  /* Greg's portrait, fitted into the #a-portrait box */
  function portrait() {
    const box = rect('#a-portrait'), k = box.w / GREG_W;
    return GREG_SEGS.map((segs) => segs.map((s) => s.map(([x, y]) => [box.x + x * k, box.y + y * k])));
  }

  /* 50 tally marks in groups of five, laid out to fit #a-tally */
  const TALLY = { groups: 10, gw: 40, gap: 22, mh: 34, row: 22 };
  function tallyLayout() {
    const el = $('#a-tally');
    const w = el.clientWidth;
    const fits = clamp(Math.floor((w + TALLY.gap) / (TALLY.gw + TALLY.gap)), 1, TALLY.groups);
    const rows = Math.ceil(TALLY.groups / fits);
    const per = Math.ceil(TALLY.groups / rows); // balanced rows: 5 + 5 rather than 8 + 2
    const h = rows * TALLY.mh + (rows - 1) * TALLY.row + 12;
    if (el.style.height !== `${h}px`) el.style.height = `${h}px`;
    return { per, rows };
  }
  function tally() {
    const { per } = tallyLayout();
    const box = rect('#a-tally');
    const R = rand(60);
    const { gw, gap, mh, row } = TALLY;
    const groups = [];
    for (let g = 0; g < TALLY.groups; g++) {
      const r = Math.floor(g / per), c = g % per;
      const inRow = Math.min(per, TALLY.groups - r * per);
      const x0 = box.x + (box.w - (inRow * gw + (inRow - 1) * gap)) / 2 + c * (gw + gap);
      const y0 = box.y + 6 + r * (mh + row) + (R() - 0.5) * 4;
      const marks = [];
      for (let i = 0; i < 4; i++) {
        const x = x0 + 4 + i * 9.5 + (R() - 0.5) * 2.5;
        const top = [x + (R() - 0.3) * 2.5, y0 + (R() - 0.5) * 5];
        const bot = [x + (R() - 0.5) * 3.5, y0 + mh + (R() - 0.5) * 5];
        const bow = (R() - 0.5) * 3;
        marks.push([[top, [top[0] + bow, top[1] + mh * 0.33], [bot[0] + bow, bot[1] - mh * 0.33], bot]]);
      }
      const a = [x0 - 3 + R() * 3, y0 + mh * (0.72 + R() * 0.1)], b = [x0 + gw + 2 + R() * 4, y0 + mh * (0.22 + R() * 0.1)];
      const sag = 3 + R() * 3;
      marks.push([[a, [a[0] + (b[0] - a[0]) * 0.33, a[1] + (b[1] - a[1]) * 0.33 + sag], [a[0] + (b[0] - a[0]) * 0.66, a[1] + (b[1] - a[1]) * 0.66 + sag], b]]);
      groups.push(marks);
    }
    return groups;
  }

  /* Scribble under "Hi, I'm Greg." */
  function underGreg(pen, W, mobile) {
    const el = $('#a-lead');
    const word = rect(el);
    const fs = parseFloat(getComputedStyle(el).fontSize);
    const wb = baseline(el);
    /* one clean pass of Erin's UnderlineScribble, right to left */
    const box = { x: word.x - fs * 0.04, y: wb + fs * 0.27, w: Math.min(word.w + fs * 0.12, W - 12 - (word.x - fs * 0.04)), h: fs * 0.15 };
    const u = fit('under', box);
    if (mobile) {
      pen.start([W - 26, -30], [-0.15, 1]);
      pen.stroke(u, [[W - 14, wb * 0.5], [Math.min(W - 10, box.x + box.w + 8), wb - fs * 0.05]]);
    } else {
      pen.start([word.r + fs * 0.1, -40], [0.2, 1]);
      pen.stroke(u, [[word.r + fs * 0.24, wb * 0.45], [box.x + box.w + fs * 0.06, wb - fs * 0.04]]);
    }
    return { word, fs, wb, box };
  }

  /* Draw the portrait: the pen runs into the hair, then lifts between the other strokes */
  function drawPortrait(pen, via) {
    const parts = portrait();
    const s0 = parts[0][0];
    const from = pen.segs.length;
    pen.go([...via(s0[0]), s0[0]], sub(s0[1], s0[0]));
    /* the pen presses harder as it gets to the hair, so there's no sudden change in weight */
    ramp(pen, from, 1, heavy, (f) => clamp((f - 0.35) / 0.65, 0, 1));
    pen.weight(Math.round(heavy * 20) / 20);
    pen.mark(parts[0]);
    /* the front of the neck ends in a little upward flick; drop it so the line can carry
       straight on down out of the neck instead of doubling back */
    const last = parts.length - 1;
    parts[last] = parts[last].slice(0, -1);
    for (let i = 1; i < parts.length; i++) pen.lift(parts[i]);
  }
  /* leaving the neck, the pen eases back to its normal weight */
  function leavePortrait(pen, pts) {
    const from = pen.segs.length;
    pen.go(pts);
    ramp(pen, from, heavy, 1, (f) => clamp(f / 0.5, 0, 1));
    pen.weight(1);
  }

  /* split a bezier at t */
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  function split(s, t) {
    const a = lerp(s[0], s[1], t), b = lerp(s[1], s[2], t), c = lerp(s[2], s[3], t);
    const d = lerp(a, b, t), e = lerp(b, c, t), m = lerp(d, e, t);
    return [[s[0], a, d, m], [m, e, c, s[3]]];
  }
  const segLen = (s) => (len(sub(s[1], s[0])) + len(sub(s[2], s[1])) + len(sub(s[3], s[2])) + len(sub(s[3], s[0]))) / 2;
  /* re-weight the strokes from `from` to the end, going from w0 to w1 along their length */
  function ramp(pen, from, w0, w1, shape) {
    const src = pen.segs.splice(from);
    const pieces = [];
    src.forEach((s) => {
      if (!Array.isArray(s)) { pieces.push(s); return; }
      let rest = s;
      for (let k = 6; k > 1; k--) { const [l, r] = split(rest, 1 / k); pieces.push(l); rest = r; }
      pieces.push(rest);
    });
    const total = pieces.reduce((t, s) => t + (Array.isArray(s) ? segLen(s) : 0), 0) || 1;
    let run = 0, lastW = null;
    pieces.forEach((s) => {
      if (!Array.isArray(s)) { pen.segs.push(s); return; }
      const l = segLen(s), f = (run + l / 2) / total;
      run += l;
      const t = shape(f), e = t * t * (3 - 2 * t);
      const w = Math.round((w0 + (w1 - w0) * e) * 20) / 20;
      if (w !== lastW) { pen.segs.push({ w }); lastW = w; }
      pen.segs.push(s);
    });
  }

  /* Draw the tallies: the pen runs into the first mark, lifts between the rest */
  function drawTally(pen, via) {
    const groups = tally();
    const first = groups[0][0];
    pen.stroke(first, via(first[0][0]));
    groups.forEach((marks, g) => marks.forEach((m, i) => { if (g || i) pen.lift(m); }));
  }

  /* Wrap the contact links and tie a bow underneath */
  function bow(pen, W, via) {
    const K = rect('#a-links');
    const w = Math.min(K.w * 1.42, W - 14), h = K.h * (w < K.w * 1.3 ? 3.4 : 3);
    /* sit the loop a little low: the drawn circle bulges up (more so on phones), so this centers the buttons in it */
    const box = { x: K.cx - w / 2, y: K.cy - h * (W < 820 ? 0.38 : 0.45), w, h };
    const wrap = fit('circle', box, { flipX: true, flipY: true, to: 10, rot: 1.5 });
    pen.stroke(wrap, via(wrap[0][0], box));
    const k = pen.p, s = clamp(K.w / 400, 0.6, 1.1);
    const at = (pts) => pts.map(([x, y]) => [k[0] + x * s, k[1] + y * s]);
    pen.go(at([[54, -4], [108, 4], [134, 30], [108, 50], [52, 32], [-2, 3]]));            // right loop
    pen.go(at([[-58, 0], [-112, 12], [-130, 40], [-98, 54], [-46, 30], [3, 4]]));         // left loop
    pen.go(at([[18, 36], [22, 72], [42, 102], [76, 112], [98, 100]]));                     // the loose end
  }

  /* ---------- the route, desktop ---------- */
  function routeDesktop(pen, W) {
    const m = clamp(W * 0.045, 28, 84), pad = Math.max(0, (W - 1520) / 2);
    const xl = pad + m, xr = W - pad - m;
    const { word, fs, wb } = underGreg(pen, W, false);

    /* from the end of the underline, across to the portrait, and draw Greg */
    const P = rect('#a-portrait');
    drawPortrait(pen, (nose) => [
      [word.x - fs * 0.3, wb + fs * 0.1],
      [Math.max(nose[0] + 30, (P.r + word.x) / 2), (wb + nose[1]) / 2],
      [nose[0] + P.w * 0.12, nose[1] - P.h * 0.07],
    ]);
    pen.intro = pen.segs.length; // on arrival the line gets this far by itself

    /* out of the neck, down and across the page, shaped like divider-2 */
    const hello = rect('#hello'), art = rect('#a-art'), copy = rect('.bread-copy');
    const breadTop = Math.min(art.y, copy.y);
    const g1 = Math.max(pen.p[1] + 60, hello.b + (breadTop - hello.b) * 0.4);
    const A1 = [xl + 40, g1 + 30], B1 = [xr - 76, g1 - 16];
    leavePortrait(pen, [[pen.p[0] + 4, pen.p[1] + 40], [Math.max(xl, pen.p[0] - P.w * 0.35), (pen.p[1] + g1) / 2 + 20]]);
    pen.go([[xl - 6, g1 - 4], A1, ...along('div2', A1, B1, { amp: 0.8 }), B1]);

    /* down the right side and under "write it all down" with UnderlineScribble */
    const phr = rect('#a-phrase'), pb = baseline('#a-phrase');
    const under = fit('under', { x: phr.x - 8, y: pb + 6, w: phr.w + 34, h: Math.max(13, phr.w * 0.075) }, { from: 1 });
    const rx = Math.min(xr + 6, copy.r + 110);
    pen.stroke(under, [[rx, g1 + 52], [rx + 8, (g1 + pb) / 2], [rx - 20, pb - 60], [phr.r + 58, pb - 14]]);

    /* down the gutter between the drawing and the words, then back across like divider-1 */
    const breadB = Math.max(art.b, copy.b);
    const gx = (art.r + copy.x) / 2;
    const title = rect('#things-title');
    const g2 = breadB + (title.y - breadB) * 0.45;
    const A2 = [gx - 30, g2 - 6], B2 = [xl + 56, g2 + 24];
    pen.go([[gx + 6, pb + 60], [gx - 8, (pb + breadB) / 2 + 30], [gx + 10, breadB - 10], A2, ...along('div1', A2, B2, { amp: 1.4, n: 7 }), B2]);

    /* circle "Good Bread" with CircleScribble */
    const name = rect('#a-circle'), rows = rect('#a-rows');
    const cw = name.w * 1.62 + 30, chh = name.h * 2.9;
    const circle = fit('circle', { x: name.cx - cw / 2 + 6, y: name.cy - chh / 2 + 1, w: cw, h: chh }, { rot: -1.5 });
    const lx = Math.max(xl - 14, 18);
    const cs = circle[0][0];
    pen.stroke(circle, [[lx + 4, g2 + 80], [lx + 12, (g2 + name.y) / 2 + 30], [cs[0] - 150, name.y - chh * 0.5 - 6], [cs[0] - 40, cs[1] - 6]]);
    const ce = pen.p;
    pen.go([[ce[0] - 50, ce[1] - 14], [Math.max(14, name.x - cw * 0.35), name.y - 8]]);

    /* down the left of the list and into the tally marks: 60 of them */
    const T = rect('#a-tally');
    drawTally(pen, (first) => [
      [Math.max(16, rows.x - 50), name.b + 30],
      [Math.max(14, rows.x - 54), rows.cy + 20],
      [Math.max(18, rows.x - 30), rows.b + 24],
      [first[0] - 34, T.y - 18],
    ]);

    /* out of the last tally, down the right and around the pile of prints */
    const pile = rect('#a-pile'), head = rect('.photos-head'), note = rect('.tally-note');
    const bw = Math.min(pile.w * 1.14, W - 24), bh = pile.h * 1.22;
    const b1 = { x: pile.cx - bw / 2, y: pile.cy - bh / 2, w: bw, h: bh };
    const wrap1 = fit('circle', b1, { rot: -2.5 });
    const rx2 = Math.min(xr + 10, W - 16);
    pen.stroke(wrap1, [[pen.p[0] + 60, pen.p[1] - 10], [rx2, note.y], [rx2 - 6, (note.b + head.y) / 2], [rx2 + 4, head.cy], [rx2 - 40, b1.y - 4]]);
    const b2 = { x: b1.x + bw * 0.035, y: b1.y + bh * 0.045, w: bw * 0.955, h: bh * 0.94 };
    pen.stroke(fit('circle', b2, { from: 2, to: 7, rot: 2.5 }));

    /* down to the links, around them, and a bow */
    const hi = rect('#hi-title'), me = $('#a-me') ? rect('#a-me') : hi;
    const g4 = pile.b + (me.y - pile.b) * 0.5;
    bow(pen, W, (s, box) => {
      const A4 = [Math.min(xr - 40, pen.p[0] + 20), g4 - 4], B4 = [Math.max(xl + 60, box.x - 150), g4 + 24];
      return [
        [Math.min(W - 30, pen.p[0] + 100), Math.max(pen.p[1] + 26, pile.b - 30)],
        [Math.min(W - 24, pen.p[0] + 110), (pen.p[1] + g4) / 2 + 10],
        A4, ...along('div1', A4, B4, { amp: 1.3, n: 6 }), B4,
        [B4[0] - 40, g4 + 84],
        [box.x - 36, box.y - 26],
        [box.x - 8, box.y + box.h * 0.62],
      ];
    });
  }

  /* ---------- the route, phones: a meander that crosses between sections ---------- */
  function routeMobile(pen, W) {
    const e = 10;
    const X = (s, d = 0) => (s > 0 ? W - e - d : e + d);
    const { wb, fs } = underGreg(pen, W, true);

    /* the pen leaves the underline on the left; come down the left edge and draw the portrait */
    const text = rect('.hello-text'), P = rect('#a-portrait');
    drawPortrait(pen, (nose) => [
      [X(-1, 2), wb + fs * 0.5],
      [X(-1, -2), (text.y + text.b) / 2],
      [X(-1, 4), text.b + 16],
      [P.cx - P.w * 0.1, P.y - 34],
      [Math.min(W - 12, P.r + 30), P.y + P.h * 0.04],
      [Math.min(W - 14, nose[0] + P.w * 0.2), nose[1] - P.h * 0.02],
    ]);
    pen.intro = pen.segs.length;

    /* crossings between sections, alternating sides */
    let side = 1, prevY = pen.p[1];
    const cross = (gy, i) => {
      const A = [X(side, 22), gy - 12], B = [X(-side, 22), gy + 12];
      const run = Math.max(40, gy - prevY);
      pen.go([
        [X(side, i % 2 ? 3 : -2), prevY + Math.min(70, run * 0.3)],
        [X(side, i % 2 ? -3 : 4), prevY + run * 0.62],
        [X(side, 2), gy - 50],
        A, ...along(side > 0 ? 'div1' : 'div2', A, B, { amp: 1.2, n: 5 }), B,
      ]);
      side = -side; prevY = gy + 12;
    };
    const bcopy = rect('.bread-copy'), art = rect('#a-art'), things = rect('#things-title'), rows = rect('#a-rows');
    /* leave the neck, drift right, then cross under the portrait */
    leavePortrait(pen, [[pen.p[0] + 6, pen.p[1] + 30], [X(1, 30), pen.p[1] + 70]]);
    prevY = pen.p[1];
    cross((P.b + bcopy.y) / 2 + 20, 0);
    cross((art.b + things.y) / 2, 1);

    /* down beside the list, then the tally marks */
    const T = rect('#a-tally');
    drawTally(pen, (first) => [
      [X(side, 2), rows.y + 20],
      [X(side, -2), rows.cy],
      [X(side, 3), rows.b + 10],
      [first[0] - 16, T.y - 14],
    ]);

    /* under the pile of prints (they sit on top of the line), down to the links */
    const pile = rect('#a-pile'), head = rect('.photos-head'), note = rect('.tally-note'), hi = rect('#hi-title');
    side = 1; prevY = pen.p[1];
    pen.go([[pen.p[0] + 30, pen.p[1] - 6], [X(1, 4), note.y + 4]]);
    prevY = pen.p[1];
    cross((note.b + head.y) / 2, 0);
    pen.go([[X(side, 3), head.b + 20], [X(side, -2), pile.y + pile.h * 0.3], [X(side, 4), pile.y + pile.h * 0.7], [X(side, 2), pile.b + 10]]);
    prevY = pen.p[1];
    const me = $('#a-me') ? rect('#a-me') : hi;
    cross((pile.b + me.y) / 2, 1);

    bow(pen, W, (s, box) => [
      [X(side, 2), prevY + 60],
      [X(side, -2), hi.b + 30],
      [side > 0 ? Math.min(W - 6, box.x + box.w + 2) : Math.max(6, box.x - 2), box.y + box.h * 0.45],
    ]);
  }

  /* The line may run close to the sides of the screen, but never off them. A bezier stays
     inside its control points, so pulling every point in from the edges is enough. */
  function keepOnScreen(pen, W) {
    const m = 4, lo = m, hi = W - m;
    const fix = (q) => { if (q[0] < lo) q[0] = lo; else if (q[0] > hi) q[0] = hi; };
    for (const s of pen.segs) {
      if (Array.isArray(s)) s.forEach(fix);
      else if (s.lift) fix(s.lift);
    }
  }

  /* ---------- build ---------- */
  const mobileMQ = window.matchMedia('(max-width: 819px)');
  const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  let table = null; // arc-length table: x, y, s (length so far), m (lowest point reached so far)
  let total = 0, introLen = 0, heavy = 1.6;

  function build() {
    if (window.Pile) window.Pile.layout();
    tallyLayout();
    const o = page.getBoundingClientRect();
    ox = o.left; oy = o.top;
    const W = page.clientWidth, H = page.scrollHeight;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);

    const P = rect('#a-portrait');
    heavy = clamp(P.w * 0.0105, 2.4, 3.6) / (mobileMQ.matches ? 1.75 : 2);
    const pen = new Pen();
    try {
      (mobileMQ.matches ? routeMobile : routeDesktop)(pen, W);
      keepOnScreen(pen, W);
    } catch (err) {
      console.error(err);
      return false;
    }
    const f = (v) => Math.round(v * 10) / 10;
    /* every unbroken stroke gets its own <path> (browsers restart dashes at each subpath) */
    const runs = [];
    let weight = 1, run = null;
    const X = [], Y = [], S = [], M = [];
    const mainW = mobileMQ.matches ? 1.75 : 2;
    introLen = 0;
    const startRun = (p) => { run = { w: weight * mainW, d: `M${f(p[0])} ${f(p[1])}`, a: S.length ? S[S.length - 1] : 0, b: 0, at: p }; runs.push(run); };
    pen.segs.forEach((s, n) => {
      if (n === pen.intro) introLen = S[S.length - 1];
      if (s.w !== undefined) { if (s.w !== weight) { weight = s.w; run = null; } return; }
      if (s.lift) {
        /* the pen lifts: the line jumps, and no length is added */
        const [x, y] = s.lift;
        X.push(x); Y.push(y); S.push(S.length ? S[S.length - 1] : 0); M.push(Math.max(M.length ? M[M.length - 1] : y, y));
        run = null;
        return;
      }
      if (!run || Math.abs(run.at[0] - s[0][0]) > 0.05 || Math.abs(run.at[1] - s[0][1]) > 0.05) startRun(s[0]);
      run.d += `C${f(s[1][0])} ${f(s[1][1])} ${f(s[2][0])} ${f(s[2][1])} ${f(s[3][0])} ${f(s[3][1])}`;
      run.at = s[3];
      const rough = len(sub(s[1], s[0])) + len(sub(s[2], s[1])) + len(sub(s[3], s[2]));
      const steps = clamp(Math.ceil(rough / 5), 3, 200);
      for (let i = 1; i <= steps; i++) {
        const p = bez(s, i / steps), j = X.length;
        X.push(p[0]); Y.push(p[1]);
        S.push(S[j - 1] + Math.hypot(p[0] - X[j - 1], p[1] - Y[j - 1]));
        M.push(Math.max(M[j - 1], p[1]));
      }
      run.b = S[S.length - 1];
    });
    if (pen.intro === undefined || pen.intro >= pen.segs.length) introLen = 0;
    total = S[S.length - 1];
    table = { X, Y, S, M };

    /* reuse <path> elements between rebuilds */
    while (strokes.length < runs.length) {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      el.setAttribute('fill', 'none');
      svg.appendChild(el);
      strokes.push({ el });
    }
    while (strokes.length > runs.length) strokes.pop().el.remove();
    runs.forEach((r, i) => {
      const st = strokes[i];
      Object.assign(st, { a: r.a, b: r.b, len: Math.max(0.1, r.b - r.a), shown: -1 });
      st.el.setAttribute('class', 'stroke');
      st.el.style.strokeWidth = `${r.w.toFixed(2)}px`;
      st.el.setAttribute('d', r.d);
      st.el.setAttribute('pathLength', st.len.toFixed(2));
    });
    return true;
  }

  /* how much line there should be when the pen is level with page-y */
  function lengthAt(y) {
    const { M, S } = table;
    if (y >= M[M.length - 1]) return total;
    let lo = 0, hi = M.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (M[mid] <= y) lo = mid; else hi = mid - 1; }
    return S[lo];
  }
  function pointAt(s) {
    const { X, Y, S } = table;
    let lo = 0, hi = S.length - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (S[mid] < s) lo = mid + 1; else hi = mid; }
    /* skip over pen lifts (zero-length jumps) */
    while (lo + 1 < S.length && S[lo + 1] === S[lo] && S[lo] <= s) lo++;
    const i = Math.max(1, lo), k = (s - S[i - 1]) / ((S[i] - S[i - 1]) || 1);
    return [X[i - 1] + (X[i] - X[i - 1]) * k, Y[i - 1] + (Y[i] - Y[i - 1]) * k, X[i] - X[i - 1], Y[i] - Y[i - 1]];
  }

  /* ---------- drawing ---------- */
  let drawn = 0, target = 0, raf = 0, last = 0, frozen = false;

  /* how far the line should be drawn for a given scroll position */
  function goal(sy) {
    const vh = window.innerHeight;
    const y = sy - (page.getBoundingClientRect().top + window.scrollY);
    const max = Math.max(1, document.documentElement.scrollHeight - vh);
    const nearEnd = clamp((sy - (max - vh * 0.7)) / (vh * 0.7), 0, 1);
    const k = 0.72 + 0.5 * nearEnd * nearEnd * (3 - 2 * nearEnd);
    return Math.max(lengthAt(y + vh * k), introLen);
  }

  function paint() {
    for (const st of strokes) {
      const local = clamp(drawn - st.a, 0, st.len);
      const v = local <= 0.01 ? 0 : local >= st.len - 0.01 ? st.len : local;
      if (v === st.shown) continue;
      st.shown = v;
      st.el.style.visibility = v ? '' : 'hidden';
      st.el.style.strokeDasharray = v >= st.len ? 'none' : `${v.toFixed(2)} ${(st.len + 1).toFixed(2)}`;
    }
    const [x, y, dx, dy] = pointAt(clamp(drawn, 0, total));
    const lean = clamp(dx / (Math.hypot(dx, dy) || 1), -1, 1) * 14;
    tip.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${lean.toFixed(1)}deg)`;
    tip.classList.toggle('on', drawn > 40 && drawn < total - 2);
  }

  /* The line follows a smoothed copy of the scroll position, and the pen has momentum:
     it speeds up and slows down instead of starting and stopping, so a notchy scroll wheel
     still gives one continuous stroke. */
  let sy = window.scrollY, vel = 0;
  function tick(now) {
    raf = 0;
    if (!table || frozen) return;
    if (reduceMQ.matches) { drawn = target = total; paint(); return; }
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    sy += (window.scrollY - sy) * (1 - Math.exp(-dt / 0.14));
    if (Math.abs(window.scrollY - sy) < 0.5) sy = window.scrollY;
    target = goal(sy);
    const gap = target - drawn;
    /* the pen takes its time over the portrait on the way in, and tops out further down */
    const top = drawn < introLen ? 1300 : 3200;
    const want = gap >= 0 ? Math.min(top, gap / 0.2 + 30) : Math.max(-6000, gap / 0.12 - 30);
    vel += (want - vel) * (1 - Math.exp(-dt / 0.09));
    let next = drawn + vel * dt;
    if ((gap >= 0 && next > target) || (gap < 0 && next < target)) { next = target; vel = 0; }
    drawn = next;
    paint();
    if (Math.abs(target - drawn) > 0.4 || sy !== window.scrollY) raf = requestAnimationFrame(tick);
    else { drawn = target; vel = 0; paint(); }
  }
  function chase() {
    if (!table || frozen) return;
    /* with reduced motion the whole line is simply there; nothing animates */
    if (reduceMQ.matches) { if (drawn !== total) { drawn = target = total; paint(); } return; }
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
  }

  /* re-measure and redraw; while resizing, the line keeps the same share of itself drawn */
  function settle() {
    const share = total ? drawn / total : 0;
    if (!build()) return;
    if (reduceMQ.matches || frozen) { drawn = target = total; paint(); return; }
    drawn = share * total;
    sy = window.scrollY; target = goal(sy);
    paint();
    chase();
  }

  /* rebuild at most once a frame while the window is being resized */
  let pending = 0, started = false;
  const rebuild = () => {
    if (!started || pending) return;
    pending = requestAnimationFrame(() => { pending = 0; settle(); });
  };

  function startUp() {
    /* if the route can't be built, leave the page as is: GoodBread.astro shows the finished portrait */
    if (!build()) return;
    /* the line is on; the page's fallback drawing stays hidden */
    document.documentElement.setAttribute('data-line', '');
    started = true;
    if (reduceMQ.matches) { drawn = target = total; paint(); return; }
    /* on a fresh load at the top, the line draws itself in; otherwise it's already there */
    sy = window.scrollY;
    drawn = sy < 40 ? 0 : goal(sy);
    paint();
    chase();
  }

  window.addEventListener('scroll', chase, { passive: true });
  window.addEventListener('resize', rebuild);
  if ('ResizeObserver' in window) new ResizeObserver(rebuild).observe(page);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(rebuild);
  window.addEventListener('load', rebuild);
  reduceMQ.addEventListener && reduceMQ.addEventListener('change', rebuild);
  mobileMQ.addEventListener && mobileMQ.addEventListener('change', rebuild);
  startUp();

  /* for screenshots and the curious: show the whole line at once */
  window.__lineShowAll = () => { frozen = false; build(); frozen = true; drawn = target = total; paint(); };
})();
