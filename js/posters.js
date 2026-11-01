/* posters.js — draggable parallax poster wall + zoomable lightbox */
(function () {
  'use strict';
  const FC = window.FC, { $, $$, S, reduce, hasGSAP, fine, esc, pad, clamp, lerp } = FC;

  FC.initPosters = function () {
    const P = S.posters; if (!P) return;
    const items = P.items;
    const h = $('#posters-h');
    FC.revealHeading(h, FC.heading(h, P.heading), 'top 90%');
    $('#posters-intro').textContent = P.intro || '';

    const wall = $('#wall'), canvas = $('#canvas'), posEl = $('#wall-pos');
    let W = 0, H = 0, CW = 0, CH = 0, minX = 0, maxX = 0, minY = 0, maxY = 0;
    let x = 0, y = 0, tx = 0, ty = 0, x0 = 0, y0 = 0, inView = false;
    const nodes = [];

    // deterministic pseudo-random so the layout is stable between visits
    const rnd = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

    function build() {
      canvas.innerHTML = ''; nodes.length = 0;
      W = wall.clientWidth; H = wall.clientHeight;
      const mob = innerWidth <= 820;
      const rows = mob ? 2 : 3;
      const total = items.length + 2;                      // two spare cells for big words
      const cols = Math.max(2, Math.ceil(total / rows));
      const cw = mob ? W * 0.72 : W * 0.33, ch = mob ? H * 0.5 : H * 0.5;
      CW = cols * cw; CH = rows * ch;
      canvas.style.width = CW + 'px'; canvas.style.height = CH + 'px';
      const order = [];
      for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) order.push({ c, r: c % 2 ? rows - 1 - r : r });
      // spread: interleave so neighbours aren't consecutive
      const cells = order.map((o, i) => order[(i * 4 + 1) % order.length] && order[(i * 4 + 1) % order.length]);
      const seen = new Set(), cellList = [];
      cells.forEach((o) => { const k = o.c + ':' + o.r; if (!seen.has(k)) { seen.add(k); cellList.push(o); } });
      order.forEach((o) => { const k = o.c + ':' + o.r; if (!seen.has(k)) { seen.add(k); cellList.push(o); } });

      const base = mob ? H * 0.5 : H * 0.62;
      items.forEach((it, i) => {
        const ar = it.w / it.h;
        let w = base * Math.sqrt(0.82 * ar), hh = w / ar;
        if (hh > ch * 1.2) { hh = ch * 1.2; w = hh * ar; }
        if (w > cw * 1.15) { w = cw * 1.15; hh = w / ar; }
        const cell = cellList[i];
        const jx = (rnd(i + 1) - 0.5) * (cw - w) * 0.5 + (rnd(i + 5) - 0.5) * cw * 0.2, jy = (rnd(i + 9) - 0.5) * ch * 0.18;
        const left = cell.c * cw + (cw - w) / 2 + jx, top = cell.r * ch + (ch - hh) / 2 + jy;
        const rot = (rnd(i + 17) - 0.5) * 8, d = 0.82 + rnd(i + 31) * 0.42;
        const el = document.createElement('div');
        el.className = 'pst'; el.tabIndex = 0; el.setAttribute('role', 'button'); el.dataset.cursor = 'VIEW';
        el.setAttribute('aria-label', `Open poster: ${it.title}, ${it.category} ${it.year}`);
        el.style.cssText = `width:${w}px;height:${hh}px;left:${left}px;top:${top}px;z-index:${Math.round(d * 10)}`;
        el.innerHTML = `<div class="pst-in"><img src="${esc(it.file)}" alt="${esc(it.alt || it.title)}" width="${it.w}" height="${it.h}" loading="lazy" draggable="false"><span class="pst-glare"></span></div><span class="pst-tag">${esc(it.title)} — ${esc(it.category)} · ${esc(it.year)}</span>`;
        canvas.appendChild(el);
        nodes.push({ el, inner: $('.pst-in', el), d, rot, cx: left + w / 2, cy: top + hh / 2, i });
        // sharper image once the wall is on screen (thumb → full)
        const im = $('img', el);
        im.addEventListener('load', () => {}, { once: true });
      });
      // decorative words in spare cells
      [S.person.first, 'DESIGN'].slice(0, 2).forEach((txt, k) => {
        const cell = cellList[items.length + k]; if (!cell) return;
        const d = document.createElement('div'); d.className = 'wall-word';
        d.textContent = txt; d.style.fontSize = Math.min(cw * 0.5, ch * 0.7) + 'px';
        d.style.left = cell.c * cw + cw * 0.06 + 'px'; d.style.top = cell.r * ch + ch * 0.2 + 'px';
        canvas.appendChild(d);
      });
      x0 = (W - CW) / 2; y0 = (H - CH) / 2;
      minX = Math.min(0, W - CW); maxX = 0; minY = Math.min(0, H - CH); maxY = 0;
      if (mob) { minY = maxY = y0; }
      x = tx = mob ? 0 : clamp(x0, minX, maxX); y = ty = clamp(y0, minY, maxY);
      draw(true);
      bindItems();
    }

    function draw(force) {
      canvas.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
      nodes.forEach((n) => {
        const px = (x - x0) * (n.d - 1) * 0.55, py = (y - y0) * (n.d - 1) * 0.55;
        n.el.style.transform = `translate3d(${px.toFixed(1)}px,${py.toFixed(1)}px,0) rotate(${n.rot}deg) scale(${(0.94 + (n.d - 0.82) * 0.22).toFixed(3)})`;
      });
      posEl.textContent = `X ${String(Math.round(-x + W / 2)).padStart(4, '0')} · Y ${String(Math.round(-y + H / 2)).padStart(4, '0')}`;
    }

    /* ---- drag ---- */
    let drag = null, moved = 0, vx = 0, vy = 0, lastT = 0;
    wall.addEventListener('pointerdown', (e) => {
      if (e.button > 0) return;
      drag = { px: e.clientX, py: e.clientY, sx: tx, sy: ty, t: performance.now(), id: e.pointerId, touch: e.pointerType === 'touch' };
      moved = 0; vx = vy = 0; lastT = performance.now();
    });
    wall.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.px, dy = e.clientY - drag.py;
      moved = Math.max(moved, Math.hypot(dx, dy));
      if (moved > 6 && !wall.hasPointerCapture(drag.id)) { try { wall.setPointerCapture(drag.id); } catch (er) {} wall.classList.add('is-drag'); }
      const nx = drag.sx + dx, ny = drag.sy + (innerWidth <= 820 ? 0 : dy);
      const now = performance.now(), dt = Math.max(1, now - lastT); lastT = now;
      vx = lerp(vx, (nx - tx) / dt, 0.4); vy = lerp(vy, (ny - ty) / dt, 0.4);
      tx = clamp(nx, minX - 40, maxX + 40); ty = clamp(ny, minY - 40, maxY + 40);
    });
    const end = () => {
      if (!drag) return;
      if (moved > 6) { tx = clamp(tx + vx * 260, minX, maxX); ty = clamp(ty + vy * 260, minY, maxY); }
      drag = null; wall.classList.remove('is-drag');
    };
    wall.addEventListener('pointerup', end); wall.addEventListener('pointercancel', end);

    function bindItems() {
      nodes.forEach((n) => {
        const el = n.el;
        el.addEventListener('click', () => { if (moved < 6) openLB(n.i, el); });
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLB(n.i, el); } });
        el.addEventListener('focus', () => { tx = clamp(W / 2 - n.cx, minX, maxX); ty = clamp(H / 2 - n.cy, minY, maxY); wall.scrollLeft = 0; });
        if (fine && !reduce) {
          el.addEventListener('pointermove', (e) => {
            if (drag && moved > 6) return;
            const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
            n.inner.style.transform = `rotateY(${((px - 0.5) * 18).toFixed(2)}deg) rotateX(${((0.5 - py) * 18).toFixed(2)}deg) translateZ(40px)`;
            n.inner.style.setProperty('--mx', px * 100 + '%'); n.inner.firstElementChild.nextElementSibling.style.setProperty('--mx', px * 100 + '%');
            const g = $('.pst-glare', el); g.style.setProperty('--mx', px * 100 + '%'); g.style.setProperty('--my', py * 100 + '%');
          });
          el.addEventListener('pointerleave', () => { n.inner.style.transform = ''; });
        }
      });
    }

    /* ---- loop (only while on screen) ---- */
    if ('IntersectionObserver' in window) new IntersectionObserver((es) => { inView = es[0].isIntersecting; }, { rootMargin: '100px' }).observe(wall); else inView = true;
    const tick = () => {
      if (!inView) return;
      const nx = lerp(x, tx, 0.11), ny = lerp(y, ty, 0.11);
      if (Math.abs(nx - x) > 0.05 || Math.abs(ny - y) > 0.05) { x = nx; y = ny; draw(); }
      // ease back from rubber-band overshoot
      if (!drag) { tx = clamp(tx, minX, maxX); ty = clamp(ty, minY, maxY); }
    };
    if (hasGSAP) gsap.ticker.add(tick); else (function l() { tick(); requestAnimationFrame(l); })();

    build();
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 200); });

    // entrance
    if (hasGSAP && !reduce) {
      gsap.from(nodes.map((n) => n.inner), { opacity: 0, scale: 0.55, y: 120, rotation: (i) => (i % 2 ? 8 : -8), duration: 1.2, ease: 'power4.out', stagger: 0.09, scrollTrigger: { trigger: wall, start: 'top 70%', once: true } });
    }

    /* ======================== LIGHTBOX ======================== */
    const lb = $('#lightbox'), stage = $('#lb-stage'), img = $('#lb-img');
    const thumbs = $('#lb-thumbs');
    let cur = 0, z = 1, px = 0, py = 0, lastFocus = null, fromEl = null;
    thumbs.innerHTML = items.map((it, i) => `<button type="button" data-i="${i}" aria-label="Show ${esc(it.title)}"><img src="${esc(it.thumb || it.file)}" alt="" loading="lazy"></button>`).join('');
    $$('button', thumbs).forEach((b) => b.addEventListener('click', () => show(+b.dataset.i, +b.dataset.i > cur ? 1 : -1)));
    $('#lb-t').textContent = pad(items.length);

    const apply = () => {
      img.style.transform = `translate(${px}px,${py}px) scale(${z})`;
      stage.classList.toggle('zoomed', z > 1);
      $('#lb-zoom').textContent = z > 1 ? 'ZOOM −' : 'ZOOM +';
    };
    const bounds = () => { const w = img.offsetWidth, h = img.offsetHeight; px = clamp(px, w - w * z, 0); py = clamp(py, h - h * z, 0); };
    function zoomAt(nz, cx, cy) {
      nz = clamp(nz, 1, 2.4);
      if (nz === 1) { px = py = 0; z = 1; apply(); return; }
      const r = img.getBoundingClientRect();
      const bx = (cx - r.left) / z, by = (cy - r.top) / z;      // point in un-zoomed image px
      const ox = r.left - px, oy = r.top - py;                    // un-zoomed origin on screen
      z = nz; px = cx - ox - bx * z + 0; py = cy - oy - by * z + 0;
      bounds(); apply();
    }
    function show(i, dir = 0) {
      cur = (i + items.length) % items.length;
      const it = items[cur];
      z = 1; px = py = 0; apply();
      img.alt = it.alt || it.title;
      const swap = () => {
        img.src = it.full || it.file;
        $('#lb-n').textContent = pad(cur + 1);
        $('#lb-title').textContent = it.title; $('#lb-meta').textContent = `${it.category} · ${it.year}`;
        $$('button', thumbs).forEach((b, k) => b.classList.toggle('on', k === cur));
        const nb = $('button.on', thumbs); if (nb && nb.scrollIntoView) nb.scrollIntoView({ inline: 'center', block: 'nearest' });
        [cur + 1, cur - 1].forEach((k) => { const o = new Image(); const n2 = items[(k + items.length) % items.length]; o.src = n2.full || n2.file; });
      };
      if (hasGSAP && !reduce && dir) {
        gsap.to(img, { opacity: 0, x: -dir * 60, duration: 0.2, ease: 'power2.in', onComplete: () => { swap(); gsap.fromTo(img, { opacity: 0, x: dir * 60 }, { opacity: 1, x: 0, duration: 0.45, ease: 'power3.out' }); } });
      } else swap();
    }
    function openLB(i, el) {
      lastFocus = document.activeElement; fromEl = el;
      lb.hidden = false; lb.setAttribute('aria-hidden', 'false');
      document.body.classList.add('viewer-open');
      FC.stopScroll();
      show(i, 0);
      if (hasGSAP && !reduce) {
        const r = el.getBoundingClientRect();
        gsap.fromTo(lb, { clipPath: `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px)` }, { clipPath: 'inset(0px 0px 0px 0px)', duration: 0.85, ease: 'power4.inOut' });
        gsap.from('.lb-top > *, .lb-cap, .lb-thumbs, .lb-arrow', { opacity: 0, y: 16, stagger: 0.05, duration: 0.6, delay: 0.5 });
      }
      setTimeout(() => $('#lb-close').focus(), 80);
    }
    function closeLB() {
      if (lb.hidden) return;
      const fin = () => { lb.hidden = true; lb.setAttribute('aria-hidden', 'true'); document.body.classList.remove('viewer-open'); FC.startScroll(); if (hasGSAP) gsap.set(lb, { clearProps: 'clipPath' }); if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true }); };
      if (hasGSAP && !reduce) {
        let to = 'inset(50% 0px 50% 0px)';
        if (fromEl) { const r = fromEl.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight) to = `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px)`; }
        gsap.to(lb, { clipPath: to, duration: 0.7, ease: 'power4.inOut', onComplete: fin });
      } else fin();
    }
    $('#lb-close').addEventListener('click', closeLB);
    $('#lb-prev').addEventListener('click', () => show(cur - 1, -1));
    $('#lb-next').addEventListener('click', () => show(cur + 1, 1));
    $('#lb-zoom').addEventListener('click', () => { const r = stage.getBoundingClientRect(); zoomAt(z > 1 ? 1 : 2.2, r.left + r.width / 2, r.top + r.height / 2); });
    stage.addEventListener('wheel', (e) => { e.preventDefault(); zoomAt(z * (e.deltaY < 0 ? 1.18 : 0.85), e.clientX, e.clientY); }, { passive: false });

    // click-to-zoom, drag-to-pan, swipe-to-navigate
    let gs = null, gmoved = 0;
    stage.addEventListener('pointerdown', (e) => { gs = { x: e.clientX, y: e.clientY, px, py, id: e.pointerId }; gmoved = 0; });
    stage.addEventListener('pointermove', (e) => {
      if (!gs) return;
      const dx = e.clientX - gs.x, dy = e.clientY - gs.y; gmoved = Math.max(gmoved, Math.hypot(dx, dy));
      if (z > 1 && gmoved > 3) { px = gs.px + dx; py = gs.py + dy; bounds(); apply(); }
      else if (z === 1 && fine) { /* hover tilt could go here */ }
    });
    const up = (e) => {
      if (!gs) return;
      const dx = e.clientX - gs.x;
      if (gmoved < 6 && e.target === img) zoomAt(z > 1 ? 1 : 2.2, e.clientX, e.clientY);
      else if (z === 1 && Math.abs(dx) > 60 && e.pointerType !== 'mouse') show(cur + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
      gs = null;
    };
    stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', () => { gs = null; });
    // hover-pan while zoomed with a mouse
    stage.addEventListener('mousemove', (e) => {
      if (z > 1 && !gs) {
        const w = img.offsetWidth, h = img.offsetHeight, r = img.getBoundingClientRect();
        const rx = clamp((e.clientX - stage.getBoundingClientRect().left) / stage.clientWidth, 0, 1), ry = clamp((e.clientY - stage.getBoundingClientRect().top) / stage.clientHeight, 0, 1);
        px = lerp(px, (w - w * z) * rx, 0.08); py = lerp(py, (h - h * z) * ry, 0.08); apply();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (lb.hidden) return;
      if (e.key === 'Escape') closeLB();
      else if (e.key === 'ArrowRight') show(cur + 1, 1);
      else if (e.key === 'ArrowLeft') show(cur - 1, -1);
      else if (e.key === 'z' || e.key === 'Z') $('#lb-zoom').click();
      else if (e.key === 'Tab') {
        const f = $$('button', lb).filter((b) => b.offsetParent !== null); const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  };
})();
