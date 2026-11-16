/*
  The pile of prints.

  To add photos (up to ~20), drop the files in public/img/photos/ (a full size and a
  "-sm" thumbnail, like the existing ones) and add a line to PHOTOS. `place` is optional.
*/
import { trapFocus, releaseFocus } from './modal.js';
import { crunch } from './crunch.js';

(() => {
  'use strict';

  const PHOTOS = [
    { file: 'photo-01', w: 1200, h: 1600, place: 'New York', alt: 'A big yellow tree in a park in autumn' },
    { file: 'photo-03', w: 1600, h: 1070, place: 'Agra, India', alt: 'The Taj Mahal at dusk with the moon up' },
    { file: 'photo-02', w: 1069, h: 1600, place: 'Guatapé, Colombia', alt: 'A french bulldog sitting in front of a striped door' },
    { file: 'photo-05', w: 1600, h: 1070, place: 'Ranthambore, India', alt: 'A deer on a dirt road in the woods' },
    { file: 'photo-04', w: 1070, h: 1600, place: 'Agra, India', alt: 'A minaret at dusk' },
    { file: 'photo-06', w: 1600, h: 1070, place: 'Sleepy Hollow, New York', alt: 'A country lane with one tree and a fence' },
    { file: 'photo-07', w: 1200, h: 1600, place: 'Arashiyama, Japan', alt: 'Looking straight up in a bamboo forest' },
  ];
  const DIR = '/img/photos/';

  const pile = document.getElementById('a-pile');
  if (!pile) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* small seeded random, so the pile looks the same on every visit */
  const rand = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  /* ---------- build the prints ---------- */
  const prints = PHOTOS.map((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'print';
    b.style.setProperty('--ar', `${p.w} / ${p.h}`);
    b.setAttribute('aria-label', `Open photo: ${p.alt}${p.place ? `, ${p.place}` : ''}`);
    const img = document.createElement('img');
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.draggable = false;
    img.width = p.w; img.height = p.h;
    img.src = `${DIR}${p.file}-sm.webp`;
    img.srcset = `${DIR}${p.file}-sm.webp 480w, ${DIR}${p.file}.webp 1600w`;
    b.appendChild(img);
    pile.appendChild(b);
    return { el: b, img, data: p, i, fx: 0, fy: 0, r: 0, z: i + 1, moved: undefined };
  });

  /* two bread stickers ride along on the pile. Drag them around, or click to take a bite;
     once one is eaten, another bread shows up in its place. */
  const BREADS = ['baguette', 'babka', 'loaf'];
  /* width as a share of the bigger sticker size, so each bread looks about the same size */
  const WIDTH = { baguette: 0.6, babka: 1, loaf: 0.95 };
  const BITES = { baguette: 5, babka: 5, loaf: 4 };
  let stickerBase = 100;
  function setBread(st, name) {
    st.name = name;
    st.bites = [];
    st.el.className = `sticker sticker-${name}`;
    st.el.dataset.art = name;
    st.art.innerHTML = (window.GB_ART && window.GB_ART[name]) || '';
    st.el.style.width = `${(stickerBase * WIDTH[name]).toFixed(1)}px`;
    paintBites(st);
    shape(name);
  }
  /* An alpha map of each bread's art, so a bite can find the bread's real edge. */
  const SHAPE_W = 160;
  const shapes = {};
  function shape(name) {
    if (shapes[name] !== undefined) return shapes[name];
    shapes[name] = null;
    try {
      const svg = ((window.GB_ART && window.GB_ART[name]) || '').replace(/var\(--[\w-]+\)/g, '#000');
      const vb = (svg.match(/viewBox="([\d.\s-]+)"/) || [])[1];
      if (!vb) return null;
      const [, , vw, vh] = vb.split(/\s+/).map(Number);
      const H = Math.round((SHAPE_W * vh) / vw);
      const img = new Image();
      img.onload = () => {
        try {
          const c = document.createElement('canvas');
          c.width = SHAPE_W; c.height = H;
          const g = c.getContext('2d', { willReadFrequently: true });
          g.drawImage(img, 0, 0, SHAPE_W, H);
          shapes[name] = { a: g.getImageData(0, 0, SHAPE_W, H).data, H };
        } catch (e) { /* no map: bites just land where you click */ }
      };
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.includes('xmlns=') ? svg : svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"'))}`;
    } catch (e) { /* same */ }
    return null;
  }
  /* is there still bread at (x, y)? both are shares of the sticker's width */
  function solid(st, m, x, y) {
    const px = Math.round(x * SHAPE_W), py = Math.round(y * SHAPE_W);
    if (px < 0 || py < 0 || px >= SHAPE_W || py >= m.H) return false;
    if (m.a[(py * SHAPE_W + px) * 4 + 3] < 40) return false;
    for (const b of st.bites) {
      for (const [ox, oy, k] of b.cuts) if (Math.hypot(x - (b.x + ox * b.r), y - (b.y + oy * b.r)) < b.r * k) return false;
    }
    return true;
  }

  const stickers = [['baguette', 34], ['babka', -14]].map(([name, r]) => {
    const s = document.createElement('span');
    s.setAttribute('aria-hidden', 'true');
    const art = document.createElement('span');
    art.className = 'sticker-art';
    s.appendChild(art);
    pile.appendChild(s);
    const st = { el: s, art, fx: 0, fy: 0, r, z: 60, moved: false, sticker: true, busy: false };
    setBread(st, name);
    return st;
  });

  /* A bite is a few overlapping circles cut out of the art with a CSS mask: one big one
     for the mouthful and two smaller ones either side for the tooth marks. */
  /* bites are stored as shares of the sticker's width, so they stay put when it resizes */
  function paintBites(st) {
    const W = st.el.offsetWidth;
    const layers = [];
    for (const b of st.bites) {
      for (const [ox, oy, k] of b.cuts) {
        const r = b.r * k * W;
        const x = (b.x + ox * b.r) * W, y = (b.y + oy * b.r) * W;
        layers.push(`radial-gradient(circle ${r.toFixed(1)}px at ${x.toFixed(1)}px ${y.toFixed(1)}px, transparent ${(r - 0.5).toFixed(1)}px, #000 ${r.toFixed(1)}px)`);
      }
    }
    const v = layers.join(', ');
    const st2 = st.art.style;
    st2.maskImage = st2.webkitMaskImage = v;
    st2.maskComposite = layers.length ? 'intersect' : '';
    st2.webkitMaskComposite = layers.length ? 'source-in' : '';
  }

  function crumbs(st, x, y) {
    if (reduce.matches) return;
    const rect = pile.getBoundingClientRect();
    for (let i = 0; i < 6; i++) {
      const c = document.createElement('i');
      c.className = 'crumb';
      const size = 3 + Math.random() * 4;
      Object.assign(c.style, { width: `${size}px`, height: `${size * (0.7 + Math.random() * 0.5)}px`, left: `${x - rect.left}px`, top: `${y - rect.top}px` });
      pile.appendChild(c);
      const dx = (Math.random() - 0.5) * 90, up = 20 + Math.random() * 40, fall = 60 + Math.random() * 80;
      c.animate([
        { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${dx * 0.6}px, ${-up}px) rotate(${dx * 2}deg)`, opacity: 1, offset: 0.35 },
        { transform: `translate(${dx}px, ${fall}px) rotate(${dx * 4}deg)`, opacity: 0 },
      ], { duration: 650 + Math.random() * 300, easing: 'cubic-bezier(.3,.6,.5,1)' }).onfinish = () => c.remove();
    }
  }

  function bite(st, e) {
    if (st.busy) return;
    /* where the click landed, in the sticker's own (unrotated, unscaled) coordinates */
    const w = st.el.offsetWidth, h = st.el.offsetHeight;
    const box = st.el.getBoundingClientRect();
    const cx = box.left + box.width / 2, cy = box.top + box.height / 2;
    const a = (-(parseFloat(st.el.style.getPropertyValue('--r')) || st.r) * Math.PI) / 180;
    const vx = e.clientX - cx, vy = e.clientY - cy;
    const s = Number(getComputedStyle(st.el).getPropertyValue('--s')) || 1;
    let lx = (vx * Math.cos(a) - vy * Math.sin(a)) / s, ly = (vx * Math.sin(a) + vy * Math.cos(a)) / s;
    /* bites come in from the edge: find where the bread ends in the direction of the click,
       and take the bite there */
    const d = Math.hypot(lx, ly) || 1;
    const ux = lx / d, uy = ly / d; /* outward from the middle */
    const nx = -uy, ny = ux; /* across the bite, for the tooth marks */
    const r = Math.min(w, h) * (0.3 + Math.random() * 0.06);
    let bx = (w / 2 + lx) / w, by = (h / 2 + ly) / w;
    const m = shape(st.name);
    if (m) {
      const cx0 = 0.5, cy0 = h / 2 / w, far = Math.hypot(1, h / w);
      for (let t = far; t >= 0; t -= 0.01) {
        if (solid(st, m, cx0 + ux * t, cy0 + uy * t)) { bx = cx0 + ux * t; by = cy0 + uy * t; break; }
      }
    }
    bx += ux * (r / w) * 0.4; by += uy * (r / w) * 0.4;
    st.bites.push({
      x: bx, y: by, r: r / w,
      /* [x offset, y offset (in bite radii), size]: the mouthful, plus little tooth marks
         scalloped along its inner edge */
      cuts: [[0, 0, 1], ...[-64, -32, 0, 32, 64].map((deg) => {
        const t = (deg * Math.PI) / 180, c = Math.cos(t), sn = Math.sin(t);
        /* point back into the bread (-u), swung by deg */
        const dx = -ux * c + nx * sn, dy = -uy * c + ny * sn;
        return [dx * 0.93, dy * 0.93, 0.2 + Math.random() * 0.05];
      })],
    });
    paintBites(st);
    const last = st.bites.length >= BITES[st.name];
    crunch(last);
    crumbs(st, e.clientX, e.clientY);
    if (!reduce.matches) st.art.animate([{ transform: 'scale(1)' }, { transform: 'scale(.93) rotate(-3deg)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'ease-out' });
    if (last) eaten(st);
  }

  /* the last bite: it's gone, and a different bread pops up in its place */
  function eaten(st) {
    st.busy = true;
    const other = stickers.find((o) => o !== st);
    const choices = BREADS.filter((n) => n !== st.name && n !== other.name);
    const pool = choices.length ? choices : BREADS.filter((n) => n !== st.name);
    const next = pool[Math.floor(Math.random() * pool.length)];
    const swap = () => {
      setBread(st, next);
      st.r = (Math.random() - 0.5) * 50;
      place(st);
      if (reduce.matches) { st.busy = false; return; }
      st.art.animate([
        { transform: 'scale(0) rotate(-25deg)', opacity: 0 },
        { transform: 'scale(1.12) rotate(4deg)', opacity: 1, offset: 0.6 },
        { transform: 'scale(1) rotate(0deg)', opacity: 1 },
      ], { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => { st.busy = false; };
    };
    if (reduce.matches) { st.art.style.visibility = 'hidden'; setTimeout(() => { st.art.style.visibility = ''; swap(); }, 600); return; }
    st.art.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(0) rotate(20deg)', opacity: 0 }], { duration: 260, easing: 'ease-in', fill: 'forwards' })
      .onfinish = (ev) => { st.art.style.opacity = '0'; ev.target.cancel(); setTimeout(() => { st.art.style.opacity = ''; swap(); }, 700); };
  }

  /* ---------- layout: a loose, overlapping grid ---------- */
  let cols = 0, cw = 0, ch = 0;
  function layout() {
    const w = pile.clientWidth;
    if (!w || dragging) return;
    const n = prints.length;
    const c = w < 520 ? 2 : w < 860 ? 3 : 4;
    const keep = c === cols && Math.abs(w - cw) < 1;
    cols = c; cw = w;
    const cell = w / c;
    const R = rand(7 + n);
    const pos = [];
    let y = 0, maxB = 0;
    for (let row = 0; row * c < n; row++) {
      const items = prints.slice(row * c, row * c + c);
      const shift = (c - items.length) * cell / 2 + (row % 2 ? cell * 0.08 : -cell * 0.04);
      let rowH = 0;
      items.forEach((p, k) => {
        const land = p.data.w >= p.data.h;
        const pw = cell * (land ? 0.98 : 0.76) * (0.94 + R() * 0.1);
        const ph = pw * (p.data.h / p.data.w);
        let x = shift + k * cell + (cell - pw) / 2 + (R() - 0.5) * cell * 0.22;
        x = clamp(x, -w * 0.015, w - pw + w * 0.015);
        const yy = y + (R() - 0.5) * cell * 0.12 + (land ? cell * 0.1 : 0);
        pos[p.i] = { x, y: yy, pw, ph, r: (R() - 0.5) * 13 };
        rowH = Math.max(rowH, ph);
        maxB = Math.max(maxB, yy + ph);
      });
      y += rowH * 0.8;
    }
    ch = Math.ceil(maxB + 24);
    pile.style.height = `${ch}px`;
    prints.forEach((p) => {
      const q = pos[p.i];
      p.el.style.setProperty('--w', `${q.pw.toFixed(1)}px`);
      p.img.sizes = `${Math.ceil(q.pw)}px`;
      if (!keep || !p.moved) { p.fx = q.x / w; p.fy = q.y / ch; p.r = q.r; p.moved = false; }
      place(p);
    });
    /* stickers start on the corners of the pile */
    const a = Math.min(64, w * 0.09), b = Math.min(110, w * 0.2);
    stickerBase = b;
    const spots = [[a, w - a * 0.9, -a * 0.9], [b, -b * 0.25, ch - b * 0.55]];
    stickers.forEach((st, k) => {
      const [, x, y] = spots[k];
      const sw = b * WIDTH[st.name];
      st.el.style.width = `${sw}px`;
      paintBites(st);
      if (!keep || !st.moved) { st.fx = x / w; st.fy = y / ch; st.moved = false; }
      place(st);
    });
  }
  function place(p, tilt = 0) {
    p.el.style.setProperty('--x', `${(p.fx * cw).toFixed(1)}px`);
    p.el.style.setProperty('--y', `${(p.fy * ch).toFixed(1)}px`);
    p.el.style.setProperty('--r', `${(p.r + tilt).toFixed(2)}deg`);
    p.el.style.zIndex = p.z;
  }

  /* keep z-indexes small so the stickers stay on top */
  let zTop = prints.length;
  function raise(p) {
    p.z = ++zTop;
    if (zTop > 50) {
      prints.slice().sort((a, b) => a.z - b.z).forEach((q, k) => { q.z = k + 1; q.el.style.zIndex = q.z; });
      zTop = prints.length;
    }
    p.el.style.zIndex = p.z;
  }

  /* ---------- drag: positions are applied once a frame, and the tilt is smoothed ---------- */
  let dragging = null;
  function draggable(p, onTap) {
    let sx = 0, sy = 0, ox = 0, oy = 0, id = null, moved = false;
    let tx = 0, ty = 0, lastX = 0, lastT = 0, vx = 0, tilt = 0, raf = 0;
    const frame = () => {
      raf = 0;
      const pw = p.el.offsetWidth, ph = p.el.offsetHeight;
      const x = clamp(tx, -pw * 0.3, cw - pw * 0.7), y = clamp(ty, -ph * 0.3, ch - ph * 0.7);
      p.fx = x / cw; p.fy = y / ch;
      /* lean a little in the direction of travel, like a print sliding on a table */
      tilt += (clamp(vx * 0.012, -7, 7) - tilt) * 0.18;
      vx *= 0.86;
      place(p, reduce.matches ? 0 : tilt);
      if (id !== null || Math.abs(tilt) > 0.05) raf = requestAnimationFrame(frame);
      else { tilt = 0; place(p); }
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

    p.el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || current) return;
      id = e.pointerId; moved = false;
      sx = lastX = e.clientX; sy = e.clientY; lastT = e.timeStamp;
      ox = p.fx * cw; oy = p.fy * ch;
      tx = ox; ty = oy; vx = 0;
      p.el.setPointerCapture(id);
    });
    p.el.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!moved && Math.hypot(dx, dy) < 6) return;
      if (!moved) { moved = true; dragging = p; p.moved = true; if (!p.sticker) raise(p); p.el.classList.add('dragging'); }
      const dt = Math.max(1, e.timeStamp - lastT);
      vx = vx * 0.6 + ((e.clientX - lastX) / dt) * 1000 * 0.4;
      lastX = e.clientX; lastT = e.timeStamp;
      tx = ox + dx; ty = oy + dy;
      kick();
    });
    const end = (e) => {
      if (e.pointerId !== id) return;
      id = null;
      if (dragging === p) dragging = null;
      p.el.classList.remove('dragging');
      if (moved) { p.r += (Math.random() - 0.5) * 3; kick(); }
    };
    p.el.addEventListener('pointerup', end);
    p.el.addEventListener('pointercancel', end);
    p.el.addEventListener('click', (e) => {
      if (moved) { e.preventDefault(); moved = false; return; }
      if (onTap) onTap(e);
    });
  }
  prints.forEach((p) => draggable(p, () => { raise(p); open(p); }));
  stickers.forEach((st) => draggable(st, (e) => bite(st, e)));

  /* ---------- a closer look: the print lifts off the pile and centers ---------- */
  const box = document.getElementById('closer');
  const fig = document.getElementById('closer-print');
  const big = document.getElementById('closer-img');
  const placeEl = document.getElementById('closer-place');
  const prevBtn = document.getElementById('closer-prev');
  const nextBtn = document.getElementById('closer-next');
  const closeBtn = document.getElementById('closer-close');
  let current = null, closing = false, sliding = false;
  /* the slide between photos runs on timers; closing cancels them so no print is left hidden */
  const timers = new Set();
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); };

  function target(p) {
    const ar = p.data.w / p.data.h;
    const vw = window.innerWidth, vh = window.innerHeight;
    const capH = 64, side = vw < 700 ? 0.92 : 0.8;
    let w = Math.min(vw * side, 1100), h = w / ar;
    if (h > vh * 0.82 - capH) { h = vh * 0.82 - capH; w = h * ar; }
    return { w, h, x: (vw - w) / 2, y: (vh - h - capH) / 2 + 8 };
  }
  function fromTransform(p, t) {
    const r = p.el.getBoundingClientRect();
    const k = p.el.offsetWidth / t.w;
    const dx = r.left + r.width / 2 - (t.x + t.w / 2);
    const dy = r.top + r.height / 2 - (t.y + t.h / 2);
    return `translate(${dx}px, ${dy}px) rotate(${p.r}deg) scale(${k})`;
  }
  function fill(p) {
    const t = target(p);
    Object.assign(fig.style, { width: `${t.w}px`, height: `${t.h}px`, left: `${t.x}px`, top: `${t.y}px` });
    big.src = p.img.currentSrc || p.img.src;
    big.alt = p.data.alt;
    placeEl.textContent = p.data.place || '';
    const full = new Image();
    full.onload = () => { if (current === p) big.src = full.src; };
    full.src = `${DIR}${p.data.file}.webp`;
    /* warm up the neighbours so swiping is instant */
    [prints[(p.i + 1) % prints.length], prints[(p.i - 1 + prints.length) % prints.length]].forEach((q) => { new Image().src = `${DIR}${q.data.file}.webp`; });
    return t;
  }
  function open(p) {
    if (current) return;
    current = p; closing = false;
    const t = fill(p);
    fig.style.transformOrigin = '50% 50%';
    fig.style.transition = 'none';
    fig.style.opacity = '1';
    fig.style.transform = fromTransform(p, t);
    box.hidden = false;
    p.el.classList.add('away');
    fig.getBoundingClientRect();
    fig.style.transition = '';
    requestAnimationFrame(() => { box.classList.add('open'); fig.style.transform = 'none'; });
    trapFocus(box, closeBtn, p.el);
  }
  /* go to the next or previous photo: slide out, swap, slide in */
  function step(dir) {
    if (!current || closing || sliding) return;
    const old = current, p = prints[(old.i + dir + prints.length) % prints.length];
    if (reduce.matches) {
      old.el.classList.remove('away'); current = p; p.el.classList.add('away'); fill(p); return;
    }
    sliding = true;
    fig.style.transition = 'transform .22s ease-in, opacity .22s ease-in';
    fig.style.transform = `translateX(${-dir * 70}px) rotate(${-dir * 2}deg)`;
    fig.style.opacity = '0';
    later(() => {
      old.el.classList.remove('away');
      current = p; p.el.classList.add('away'); raise(p);
      fill(p);
      fig.style.transition = 'none';
      fig.style.transform = `translateX(${dir * 70}px) rotate(${dir * 2}deg)`;
      fig.getBoundingClientRect();
      fig.style.transition = 'transform .32s cubic-bezier(.2,.8,.2,1), opacity .25s ease-out';
      fig.style.transform = 'none';
      fig.style.opacity = '1';
      later(() => { sliding = false; fig.style.transition = ''; }, 330);
    }, 200);
  }
  function close() {
    if (!current || closing) return;
    closing = true;
    timers.forEach(clearTimeout); timers.clear(); sliding = false;
    const p = current;
    box.classList.remove('open');
    fig.style.transition = '';
    fig.style.opacity = '1';
    fig.style.transform = fromTransform(p, target(p));
    let fired = false;
    const done = () => {
      if (fired) return;
      fired = true;
      fig.removeEventListener('transitionend', done);
      box.hidden = true;
      prints.forEach((q) => q.el.classList.remove('away'));
      current = null; closing = false; sliding = false;
      releaseFocus(p.el);
    };
    fig.addEventListener('transitionend', done);
    setTimeout(done, 600);
  }

  /* tap to close; swipe left or right for the next one */
  let down = null;
  box.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    down = { x: e.clientX, y: e.clientY, t: e.timeStamp };
  });
  box.addEventListener('pointerup', (e) => {
    if (!down) return;
    const dx = e.clientX - down.x, dy = e.clientY - down.y;
    down = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) step(dx < 0 ? 1 : -1);
    else if (Math.hypot(dx, dy) < 12) close();
    else if (Math.abs(dy) > 80) close();
  });
  box.addEventListener('pointercancel', () => { down = null; });
  prevBtn.addEventListener('click', (e) => { e.stopPropagation(); step(-1); });
  nextBtn.addEventListener('click', (e) => { e.stopPropagation(); step(1); });
  closeBtn.addEventListener('click', (e) => { e.stopPropagation(); close(); });
  window.addEventListener('keydown', (e) => {
    if (!current) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  });
  /* trackpads: a sideways swipe flips photos, scrolling closes */
  let wheelLock = 0;
  window.addEventListener('wheel', (e) => {
    if (!current) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault();
      if (Math.abs(e.deltaX) > 12 && e.timeStamp > wheelLock) { wheelLock = e.timeStamp + 500; step(e.deltaX > 0 ? 1 : -1); }
    } else if (Math.abs(e.deltaY) > 8) close();
  }, { passive: false });
  window.addEventListener('resize', () => { if (current) close(); });

  window.Pile = { layout };
  layout();
})();
