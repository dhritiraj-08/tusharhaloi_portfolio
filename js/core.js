/* ==========================================================================
   core.js — utilities, smooth scroll, HUD, nav, timeline, cuts, cursor,
   grain, marquee, loader and hero.  (Everything is plain vanilla JS.)
   ========================================================================== */
(function () {
  'use strict';
  const S = window.SITE || {};
  const FC = (window.FC = { S });
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const isMobile = () => innerWidth <= 820;
  const pad = (n, l = 2) => String(Math.floor(n)).padStart(l, '0');
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const tc = (sec, fps = 24) => {
    sec = Math.max(0, sec || 0);
    const f = Math.floor((sec % 1) * fps);
    return `${pad(sec / 3600)}:${pad((sec / 60) % 60)}:${pad(sec % 60)}:${pad(f)}`;
  };
  const get = (p) => p.split('.').reduce((o, k) => (o == null ? o : o[k]), S);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // "I *cut* it" -> I <em>cut</em> it
  const rich = (s) => esc(s).replace(/\*([^*]+)\*/g, '<em>$1</em>');
  Object.assign(FC, { $, $$, reduce, fine, isMobile, pad, clamp, lerp, tc, get, esc, rich });

  const hasGSAP = !!(window.gsap && window.ScrollTrigger);
  FC.hasGSAP = hasGSAP;
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  /* ---------- heading builder: lines -> words in masks ---------- */
  FC.heading = function (el, lines) {
    if (!el) return [];
    if (typeof lines === 'string') lines = [lines];
    el.setAttribute('aria-label', lines.join(' ').replace(/\*/g, ''));
    el.innerHTML = lines.map((line) => {
      const words = rich(line).split(/(<em>.*?<\/em>|\s+)/).filter((w) => w && !/^\s+$/.test(w));
      return '<span class="ln" aria-hidden="true">' + words.map((w) => `<span class="split-w"><span>${w}</span></span>`).join(' ') + '</span>';
    }).join('');
    return $$('.split-w>span', el);
  };
  FC.revealHeading = function (el, words, start = 'top 85%') {
    if (!hasGSAP || reduce || !words.length) return;
    gsap.set(words, { yPercent: 118 });
    ScrollTrigger.create({
      trigger: el, start, once: true,
      onEnter: () => gsap.to(words, { yPercent: 0, duration: 1.15, ease: 'power4.out', stagger: 0.07 })
    });
  };

  /* ---------- text binding: data-c="person.name" ---------- */
  function bind() {
    $$('[data-c]').forEach((el) => {
      const v = get(el.dataset.c);
      if (v != null) el.textContent = v;
    });
    document.title = (S.meta && S.meta.title) || document.title;
    const d = $('meta[name=description]'); if (d && S.meta) d.content = S.meta.description;
    $('#yr').textContent = (S.meta && S.meta.year) || new Date().getFullYear();
    const sl = (S.hero && S.hero.slate) || {};
    $('#sl-roll').textContent = sl.roll || 'A001';
    $('#sl-scene').textContent = sl.scene || '01';
    $('#sl-take').textContent = sl.take || '01';
    $('#sl-cam').textContent = sl.camera || 'A-CAM';
    $('#sl-date').textContent = new Date().toLocaleDateString('en-GB').replace(/\//g, '.');
  }

  /* ---------- smooth scroll (Lenis) ---------- */
  let lenis = null;
  FC.vel = 0;
  function initScroll() {
    if (window.Lenis && !reduce) {
      lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
      FC.lenis = lenis;
      if (hasGSAP) {
        lenis.on('scroll', (e) => { FC.vel = e.velocity || 0; ScrollTrigger.update(); });
        gsap.ticker.add((t) => lenis.raf(t * 1000));
        gsap.ticker.lagSmoothing(0);
      }
      lenis.stop();
    }
    document.documentElement.style.scrollBehavior = 'auto';
  }
  FC.stopScroll = () => { lenis ? lenis.stop() : (document.body.style.overflow = 'hidden'); };
  FC.startScroll = () => { lenis ? lenis.start() : (document.body.style.overflow = ''); };
  FC.scrollY = () => window.scrollY;
  FC.scrollTo = (y, opts = {}) => {
    if (lenis) lenis.scrollTo(y, { duration: 1.7, easing: (t) => 1 - Math.pow(1 - t, 4), ...opts });
    else window.scrollTo({ top: typeof y === 'number' ? y : y.getBoundingClientRect().top + scrollY, behavior: reduce ? 'auto' : 'smooth' });
  };
  // top of a section even when it's been pinned (we measure its pin-spacer)
  FC.secTop = (el) => {
    const p = el.parentElement && el.parentElement.classList.contains('pin-spacer') ? el.parentElement : el;
    return p.getBoundingClientRect().top + FC.scrollY();
  };

  /* ---------- film cuts (section transitions) ---------- */
  const cutEl = $('#cut'), wipeEl = $('#wipe');
  let lastCut = 0;
  FC.cut = function (kind) {
    if (reduce || !hasGSAP) return;
    const now = performance.now();
    if (now - lastCut < 550) return;
    lastCut = now;
    const tag = $('.cut-tag', cutEl);
    gsap.killTweensOf([cutEl, wipeEl, tag]);
    if (kind === 'smash') {
      gsap.set(cutEl, { backgroundColor: '#000' });
      gsap.timeline().set(cutEl, { opacity: 1 }).set(tag, { opacity: 1 }).to(cutEl, { opacity: 0, duration: 0.2, delay: 0.09, ease: 'none' }).set(tag, { opacity: 0 }, '<');
    } else if (kind === 'dip') {
      gsap.set(cutEl, { backgroundColor: '#000' });
      gsap.timeline().to(cutEl, { opacity: 1, duration: 0.22, ease: 'power2.in' }).to(cutEl, { opacity: 0, duration: 0.55, ease: 'power2.out' }, '+=0.05');
    } else if (kind === 'flash') {
      gsap.set(cutEl, { backgroundColor: '#EFE9DC', opacity: 0.95 });
      gsap.to(cutEl, { opacity: 0, duration: 0.7, ease: 'power3.out' });
    } else if (kind === 'wipe') {
      gsap.timeline().set(wipeEl, { xPercent: 0, x: '-101%' })
        .to(wipeEl, { x: '0%', duration: 0.32, ease: 'power3.in' })
        .to(wipeEl, { x: '101%', duration: 0.42, ease: 'power3.out' });
    }
  };
  const CUTS = { hero: 'smash', about: 'smash', reel: 'dip', posters: 'wipe', contact: 'flash' };

  /* ---------- HUD / nav / timeline ---------- */
  const SECS = ['hero', 'about', 'reel', 'posters', 'contact'];
  const secEls = {};
  let tops = [], docMax = 1, active = '', firstActive = true;
  const tlSegs = $('#tl-segs'), tlHead = $('#tl-head'), tlFill = $('#tl-fill'), tlTc = $('#tl-tc');
  const menuInd = $('.menu-ind');
  const menuLinks = $$('.menu a');

  function buildTimeline() {
    tlSegs.innerHTML = '';
    SECS.forEach((id, i) => {
      const el = secEls[id];
      const b = document.createElement('button');
      b.className = 'tl-seg'; b.type = 'button'; b.dataset.id = id;
      const nm = (el.dataset.name || id).toUpperCase();
      b.innerHTML = `<b>${pad(i + 1)}</b>${esc(nm)}`;
      b.setAttribute('aria-label', 'Go to ' + nm.toLowerCase());
      b.addEventListener('click', () => goTo('#' + id));
      tlSegs.appendChild(b);
    });
  }
  function measure() {
    docMax = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    tops = SECS.map((id) => FC.secTop(secEls[id]));
    const segs = $$('.tl-seg', tlSegs);
    segs.forEach((b, i) => {
      const a = clamp(tops[i] / docMax, 0, 1);
      const z = i < SECS.length - 1 ? clamp(tops[i + 1] / docMax, 0, 1) : 1;
      b.style.width = Math.max(0.06, z - a) * 100 + '%';
    });
    if (!firstActive) placeIndicator();
  }
  FC.measure = measure;

  function scramble(el, to) {
    if (!hasGSAP || reduce) { el.textContent = to; return; }
    const o = { p: 0 };
    gsap.to(o, { p: 1, duration: 0.5, ease: 'none', onUpdate() {
      const n = Math.floor(o.p * to.length);
      el.textContent = to.slice(0, n) + Array.from(to.slice(n)).map((c) => (/[0-9]/.test(c) ? Math.floor(Math.random() * 10) : c)).join('');
    }, onComplete() { el.textContent = to; } });
  }
  function placeIndicator() {
    const on = menuLinks.find((a) => a.dataset.nav === active);
    if (!on) { menuInd.style.opacity = 0; return; }
    menuInd.style.opacity = 1;
    menuInd.style.width = on.offsetWidth + 'px';
    menuInd.style.transform = `translateX(${on.offsetLeft - 5}px)`;
  }
  function setActive(id) {
    if (id === active) return;
    const prev = active; active = id;
    $$('.tl-seg', tlSegs).forEach((b) => b.classList.toggle('is-on', b.dataset.id === id));
    menuLinks.forEach((a) => a.classList.toggle('is-on', a.dataset.nav === id));
    document.body.classList.toggle('at-hero', id === 'hero');
    const el = secEls[id];
    $('#hud-sc').textContent = el.dataset.sc;
    $('#hud-name').textContent = el.dataset.name;
    const c = (S.cam && S.cam[id]) || null;
    if (c) { scramble($('#r-iso'), c.iso); scramble($('#r-sh'), c.shutter); scramble($('#r-f'), c.f); scramble($('#r-k'), c.k); }
    placeIndicator();
    if (!firstActive && !FC.navigating && prev) FC.cut(CUTS[id] || 'dip');
    firstActive = false;
  }
  function onScroll() {
    const y = FC.scrollY();
    const p = clamp(y / docMax, 0, 1);
    const w = tlSegs.clientWidth;
    tlHead.style.transform = `translate3d(${(p * w).toFixed(1)}px,0,0)`;
    tlHead.classList.toggle('flip', p > 0.86);
    tlFill.style.transform = `scaleX(${p.toFixed(4)})`;
    tlTc.textContent = tc(p * 180);
    let cur = SECS[0];
    for (let i = 0; i < SECS.length; i++) if (tops[i] <= y + innerHeight * 0.45) cur = SECS[i];
    setActive(cur);
  }

  function goTo(hash) {
    const id = hash.replace('#', '');
    const mnav = $('#mnav');
    if (mnav.classList.contains('is-open')) toggleMenu(false);
    let target = 0;
    if (id && id !== 'hero') {
      const el = $('#' + id); if (!el) return;
      target = FC.secTop(el);
      if (id === 'about') target -= 0;
    }
    FC.navigating = true;
    FC.cut('wipe');
    FC.scrollTo(target, { onComplete: () => { FC.navigating = false; } });
    if (!lenis) setTimeout(() => { FC.navigating = false; }, 1200);
  }
  FC.goTo = goTo;

  function toggleMenu(open) {
    const m = $('#mnav'), b = $('.burger');
    const isOpen = open == null ? !m.classList.contains('is-open') : open;
    m.classList.toggle('is-open', isOpen);
    b.setAttribute('aria-expanded', String(isOpen));
    b.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    m.setAttribute('aria-hidden', String(!isOpen));
    if (hasGSAP && !reduce) {
      if (isOpen) { m.style.visibility = 'visible'; gsap.to(m, { clipPath: 'inset(0 0 0% 0)', duration: 0.7, ease: 'power4.inOut' }); gsap.fromTo('#mnav a,#mnav p', { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.07, duration: 0.8, ease: 'power3.out', delay: 0.25 }); }
      else gsap.to(m, { clipPath: 'inset(0 0 100% 0)', duration: 0.6, ease: 'power4.inOut', onComplete: () => { m.style.visibility = 'hidden'; } });
    } else { m.style.visibility = isOpen ? 'visible' : 'hidden'; m.style.clipPath = isOpen ? 'none' : 'inset(0 0 100% 0)'; }
    isOpen ? FC.stopScroll() : FC.startScroll();
  }

  function initNav() {
    SECS.forEach((id) => (secEls[id] = $('#' + id)));
    buildTimeline();
    $$('a[href^="#"]').forEach((a) => {
      const h = a.getAttribute('href');
      if (h.length < 2 || a.classList.contains('skip')) return;
      a.addEventListener('click', (e) => { e.preventDefault(); goTo(h); });
    });
    $('.burger').addEventListener('click', () => toggleMenu());
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#mnav').classList.contains('is-open')) toggleMenu(false); });
    if (lenis) lenis.on('scroll', onScroll); else addEventListener('scroll', onScroll, { passive: true });
    if (hasGSAP) ScrollTrigger.addEventListener('refresh', () => { measure(); onScroll(); });
    addEventListener('resize', () => { measure(); onScroll(); placeIndicator(); });
    measure(); onScroll();
    // skip link
    $('.skip').addEventListener('click', (e) => { e.preventDefault(); goTo('#about'); });
    // REC timecode (real time since load) + clocks
    const t0 = performance.now(), rec = $('#rec-tc'); let lastF = -1;
    const tick = () => {
      const f = Math.floor((performance.now() - t0) / (1000 / 24));
      if (f !== lastF) { lastF = f; rec.textContent = tc(f / 24); }
      requestAnimationFrame(tick);
    };
    if (!reduce) tick(); else rec.textContent = '00:00:00:00';
    const clock = () => {
      const tz = (S.person && S.person.timezone) || undefined;
      let t; try { t = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz }); } catch (e) { t = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); }
      $('#clock').textContent = t + ' LOCAL'; $('#clock2').textContent = t + ' local time';
    };
    clock(); setInterval(clock, 20000);
  }

  /* ---------- cursor ---------- */
  function initCursor() {
    if (!fine) return;
    const cur = $('#cursor'), lab = $('.c-lab', cur), dot = $('.c-dot', cur), ring = $('.c-ring', cur);
    document.body.classList.add('cursor-on');
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
    cur.classList.add('is-hidden');
    addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; cur.classList.remove('is-hidden'); }, { passive: true });
    document.addEventListener('pointerleave', () => cur.classList.add('is-hidden'));
    addEventListener('pointerdown', () => cur.classList.add('is-down'));
    addEventListener('pointerup', () => cur.classList.remove('is-down'));
    const state = (t) => {
      const c = t.closest && t.closest('[data-cursor]');
      if (c && c.dataset.cursor) { lab.textContent = c.dataset.cursor; cur.classList.add('has-label'); cur.classList.remove('is-link'); return; }
      cur.classList.remove('has-label');
      cur.classList.toggle('is-link', !!(t.closest && t.closest('a,button,select,input,textarea,[role=button],[role=slider]')));
    };
    document.addEventListener('pointerover', (e) => state(e.target));
    FC.cursorLabel = (txt) => { if (txt) { lab.textContent = txt; cur.classList.add('has-label'); } else cur.classList.remove('has-label'); };
    const loop = () => {
      rx = lerp(rx, x, 0.2); ry = lerp(ry, y, 0.2);
      dot.style.transform = `translate3d(${x}px,${y}px,0)`;
      ring.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      requestAnimationFrame(loop);
    };
    // the ring & dot are absolutely offset inside #cursor, so move them individually
    dot.style.position = ring.style.position = 'absolute';
    loop();
  }

  /* ---------- magnetic buttons ---------- */
  function initMagnetic() {
    if (!fine || !hasGSAP || reduce) return;
    $$('.mag').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1,.5)' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1,.5)' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.35);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.35);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  /* ---------- film grain ---------- */
  function initGrain() {
    const c = $('#grain'), ctx = c.getContext('2d');
    const w = (c.width = isMobile() ? 240 : 480), h = (c.height = isMobile() ? 420 : 270);
    const img = ctx.createImageData(w, h), d = img.data;
    const draw = () => {
      for (let i = 0; i < d.length; i += 4) { const v = (Math.random() * 255) | 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
      ctx.putImageData(img, 0, 0);
    };
    draw();
    if (reduce) return;
    let last = 0;
    const loop = (t) => { if (t - last > 85 && !document.hidden) { last = t; draw(); } requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }

  /* ---------- marquees ---------- */
  function initMarquee() {
    const words = (S.hero && S.hero.marquee) || ['Cinematic'];
    const cls = ['', 'f', '', 'r'];
    const one = words.map((w, i) => `<span class="${cls[i % cls.length]}">${esc(w)}</span><em>✦</em>`).join('');
    const items = [];
    $$('.marquee').forEach((m, i) => {
      const tr = $('.mq-track', m);
      tr.innerHTML = one;
      let guard = 0;
      while (tr.scrollWidth < innerWidth * 2.2 && guard++ < 12) tr.innerHTML += one;
      tr.innerHTML += tr.innerHTML; // two equal halves for a seamless loop
      items.push({ tr, dir: i % 2 ? 1 : -1, x: 0, half: 0 });
    });
    const measureM = () => items.forEach((it) => { it.half = it.tr.scrollWidth / 2; });
    measureM(); addEventListener('resize', measureM);
    if (reduce || !hasGSAP) return;
    gsap.ticker.add(() => {
      const v = clamp(FC.vel, -60, 60);
      items.forEach((it) => {
        it.x += it.dir * (0.9 + Math.abs(v) * 0.5) * (v < -0.5 ? -1 : 1);
        if (it.x <= -it.half) it.x += it.half;
        if (it.x > 0) it.x -= it.half;
        it.tr.style.transform = `translate3d(${it.x}px,0,0)`;
      });
    });
  }

  /* ---------- loader ---------- */
  FC.loader = function () {
    return new Promise((resolve) => {
      const L = $('#loader');
      const video = $('#hero-video');
      if (S.hero && S.hero.reel) {
        [[S.hero.reel, 'video/mp4'], [S.hero.reelWebm, 'video/webm']].forEach(([src, type]) => {
          if (!src) return;
          const so = document.createElement('source'); so.src = src; so.type = type; video.appendChild(so);
        });
        video.load();
      }
      if (reduce || !hasGSAP) { video.removeAttribute('autoplay'); L.classList.add('is-done'); document.body.classList.remove('is-loading'); resolve(); return; }

      video.play && video.play().catch(() => {});

      const tcEl = $('#ld-tc'), pctEl = $('#ld-pct'), fill = $('#ld-fill'), status = $('#ld-status');
      const arm = $('.slate-arm'), board = $('.slate-board'), flash = $('.ld-flash');
      const bars = $$('.bars i');
      gsap.set(bars, { height: '11vh' });
      const prog = { p: 0 };
      const upd = () => {
        tcEl.textContent = tc(prog.p * 3, 24);
        pctEl.textContent = pad(prog.p * 100, 3) + '%';
        fill.style.width = prog.p * 100 + '%';
      };
      // one quick take: ~1.5 s from first frame to the site
      const tl = gsap.timeline();
      FC.loaderTL = tl;
      tl.from('.slate', { y: 22, opacity: 0, duration: 0.25, ease: 'power3.out' }, 0)
        .to(prog, { p: 1, duration: 0.7, ease: 'power1.inOut', onUpdate: upd }, 0.05)
        .call(() => { status.textContent = 'ROLLING…'; }, null, 0.4)
        // clap!
        .to(arm, { rotation: 0, duration: 0.1, ease: 'power4.in' }, 0.72)
        .call(() => { status.textContent = 'ACTION'; }, null, 0.82)
        .set(flash, { opacity: 0.9 }, 0.82)
        .to(flash, { opacity: 0, duration: 0.25, ease: 'power2.out' }, 0.82)
        .fromTo(board, { x: -6 }, { x: 0, duration: 0.3, ease: 'elastic.out(1.4,.25)' }, 0.82)
        .to('.ld-center', { opacity: 0, scale: 1.05, duration: 0.18, ease: 'power2.in' }, 0.95)
        // shutter opens
        .addLabel('open', 1.0)
        .to('.ld-top', { yPercent: -101, duration: 0.55, ease: 'power4.inOut' }, 'open')
        .to('.ld-bot', { yPercent: 101, duration: 0.55, ease: 'power4.inOut' }, 'open')
        .to(bars, { height: 0, duration: 0.6, ease: 'power4.inOut' }, 'open+=.1')
        .call(() => { document.body.classList.remove('is-loading'); resolve(); }, null, 'open+=.12')
        .call(() => { L.classList.add('is-done'); }, null, 'open+=.6');
      const skip = () => { tl.timeScale(5); };
      L.addEventListener('pointerdown', skip, { once: true });
      addEventListener('keydown', skip, { once: true });
    });
  };

  /* ---------- hero ---------- */
  function initHero() {
    const hero = $('#hero');
    // The hero title IS the tagline ("Video Editor")
    const title = $('.hero-name', hero);
    const tag = (S.person && S.person.tagline) || '';
    const parts = tag.split(/\s+&\s+/);
    const lines = parts.length > 1 ? [parts[0], '& ' + parts.slice(1).join(' & ')] : [tag];
    title.setAttribute('aria-label', tag);
    title.innerHTML = lines.map((l) => '<span class="hn-line" aria-hidden="true"><span class="hn-in">' +
      l.split(' ').map((w) => '<span class="wd">' + Array.from(w).map((c) => `<span class="ch">${esc(c)}</span>`).join('') + '</span>').join(' ') + '</span></span>').join('');
    const chars = $$('.ch', title);
    FC.heroChars = chars;
    if (!hasGSAP) return;
    if (!reduce) {
      gsap.set(chars, { yPercent: 115 });
      gsap.set(['.hero-kicker', '.hero-meta', '.scroll-cue'], { opacity: 0, y: 14 });
    }

    // scroll parallax / fall-away
    if (!reduce) {
      const st = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
      gsap.to('.hero-media', { yPercent: 14, scale: 1.12, ease: 'none', scrollTrigger: st });
      gsap.to('.hero-center', { yPercent: -18, opacity: 0.15, ease: 'none', scrollTrigger: st });
      gsap.to('.hero-bottom', { opacity: 0, ease: 'none', scrollTrigger: { ...st, end: '35% top' } });
    }
    // mouse parallax + AF reticle
    if (fine && !reduce) {
      const qx = gsap.quickTo('.hero-media', 'x', { duration: 1.2, ease: 'power3' });
      const qy = gsap.quickTo('.hero-media', 'y', { duration: 1.2, ease: 'power3' });
      const lx = gsap.quickTo(title, 'x', { duration: 1.0, ease: 'power3' });
      const ly = gsap.quickTo(title, 'y', { duration: 1.0, ease: 'power3' });
      const ret = $('#reticle'), rtxt = $('span', ret);
      let tx = innerWidth / 2, ty = innerHeight * 0.4, rx = tx, ry = ty, lastMove = 0, inside = false;
      hero.addEventListener('pointermove', (e) => {
        const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
        qx(nx * -22); qy(ny * -14); lx(nx * 16); ly(ny * 10);
        tx = e.clientX; ty = e.clientY; lastMove = performance.now(); inside = true;
      });
      hero.addEventListener('pointerleave', () => { inside = false; });
      let locked = false;
      gsap.ticker.add(() => {
        rx = lerp(rx, tx, 0.14); ry = lerp(ry, ty, 0.14);
        const l = performance.now() - lastMove > 450 && inside;
        if (l !== locked) { locked = l; ret.classList.toggle('locked', l); rtxt.textContent = l ? 'LOCKED' : 'AF-C'; }
        const s = locked ? 0.82 : 1;
        ret.style.transform = `translate3d(${rx}px,${ry}px,0) scale(${s})`;
        ret.style.opacity = inside && FC.scrollY() < innerHeight * 0.8 && !document.body.classList.contains('is-loading') ? 1 : 0;
      });
    }
  }
  FC.heroIntro = function () {
    const v = $('#hero-video');
    if (!reduce && v) {
      const go = () => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };
      go();
      if ('IntersectionObserver' in window) new IntersectionObserver((es) => { es[0].isIntersecting ? go() : v.pause(); }, { threshold: 0.05 }).observe(v);
    }
    if (!hasGSAP) return;
    if (reduce) { gsap.set($$('.hud, .top, #tl'), { opacity: 1 }); return; }
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.to(FC.heroChars, { yPercent: 0, duration: 1.3, stagger: 0.03 }, 0.1)
      .to(['.hero-kicker', '.hero-meta', '.scroll-cue'], { opacity: 1, y: 0, duration: 1, stagger: 0.12 }, 0.5)
      .to($$('.hud, .top, #tl'), { opacity: 1, duration: 1, ease: 'power2.out' }, 0.4);
  };

  /* ---------- letterbox-open on scroll ---------- */
  FC.letterbox = function () {
    if (!hasGSAP || reduce) return;
    $$('.lb').forEach((el) => {
      gsap.fromTo(el, { clipPath: 'inset(80px 0px 80px 0px)' }, { clipPath: 'inset(0px 0px 0px 0px)', ease: 'none', scrollTrigger: { trigger: el, start: 'top 98%', end: 'top 45%', scrub: true } });
    });
  };

  /* ---------- core init (called from boot.js) ---------- */
  FC.initCore = function () {
    bind();
    initScroll();
    initGrain();
    initCursor();
    initNav();
    initMarquee();
    initHero();
    FC.letterbox();
  };
  FC.postInit = function () {
    initMagnetic();
    if (hasGSAP) {
      ScrollTrigger.refresh();
      const re = () => ScrollTrigger.refresh();
      addEventListener('load', re);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(re);
    }
    measure(); onScroll();
  };
})();
