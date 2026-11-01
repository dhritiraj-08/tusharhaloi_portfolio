/* reel.js — film-strip showreel (pinned horizontal scroll), filters and the cinematic player */
(function () {
  'use strict';
  const FC = window.FC, { $, $$, S, reduce, hasGSAP, fine, esc, pad, tc, clamp } = FC;

  let folders = [], frames = [];
  let current = -1, lastCard = null, lastFocus = null, idleT = null;
  let reelST = null, coverIO = null;
  const F = { open: false, i: -1, card: null, focus: null };

  const mmss = (t) => { t = Math.round(t || 0); return t ? `${Math.floor(t / 60)}:${pad(t % 60)}` : ''; };
  const ratio = (w, h) => clamp((w || 16) / (h || 9), 9 / 16, 16 / 9);

  /* turn window.WORK (generated from the Video folder) + content.js overrides into folders */
  function collect() {
    const OV = (S.reel && S.reel.overrides) || {};
    return (window.WORK || []).filter((f) => f.cover || f.videos.length).map((f, i) => {
      const fo = OV[f.key] || {};
      const fl = { key: f.key, i, label: fo.label || f.name.charAt(0).toUpperCase() + f.name.slice(1), blurb: fo.blurb || '', cover: f.cover };
      let vids = f.videos;
      if (!vids.length && f.cover) vids = [{ key: f.key + '/cover video', title: fl.label, poster: f.cover.poster, preview: f.cover.src, src: f.cover.src, w: f.cover.w, h: f.cover.h, duration: 0 }];
      fl.videos = vids.map((v, n) => {
        const o = OV[v.key] || {};
        return { ...v, ...o, title: o.title || v.title, folder: fl, n, orientation: v.w / v.h < 0.8 ? 'v' : 'h', embed: o.embed || null };
      });
      return fl;
    });
  }

  /* ---------------- build ---------------- */
  FC.initReel = function () {
    const R = S.reel; if (!R) return;
    folders = collect();
    const h = $('#reel-h');
    const words = FC.heading(h, R.heading);
    FC.revealHeading(h, words, 'top 90%');
    $('#reel-intro').textContent = R.intro || '';

    const track = $('#reel-track');
    folders.forEach((f, n) => {
      const c = f.cover || {};
      const el = document.createElement('article');
      el.className = 'frame';
      el.style.setProperty('--ar', ratio(c.w, c.h).toFixed(4));
      el.tabIndex = 0; el.setAttribute('role', 'button');
      const count = f.videos.length;
      el.setAttribute('aria-label', `Open the ${f.label} folder — ${count} ${count === 1 ? 'film' : 'films'}`);
      el.dataset.cursor = 'OPEN'; el.dataset.i = n;
      el.innerHTML = `
        <div class="screen">
          <img src="${esc(c.poster || '')}" alt="" loading="lazy" draggable="false">
          <video muted loop playsinline preload="none" data-src="${esc(c.src || '')}" aria-hidden="true" tabindex="-1"></video>
          <span class="fr-idx" aria-hidden="true">${pad(n + 1)}</span>
          <span class="fr-rec" aria-hidden="true"><span class="rec-dot"></span>OPEN</span>
          <div class="fr-cap"><h3>${esc(f.label)}</h3><p><b>${count} ${count === 1 ? 'film' : 'films'}</b><span>Open folder →</span></p></div>
        </div>`;
      track.appendChild(el);
      f.el = el;
      el.addEventListener('click', () => openFolder(n, el));
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFolder(n, el); } });
      const vid = $('video', el);
      vid.addEventListener('playing', () => el.classList.add('is-hot'));
      if (reduce && fine) {                       // reduced motion: cover only moves on hover
        el.addEventListener('pointerenter', () => cover(el, true));
        el.addEventListener('pointerleave', () => cover(el, false));
      }
    });
    // "more" card
    const yt = (S.contact.socials || []).find((s) => s.key === (R.moreCard && R.moreCard.linkKey));
    if (yt) {
      const a = document.createElement('a');
      a.className = 'frame more'; a.href = yt.url; a.target = '_blank'; a.rel = 'noopener'; a.dataset.cursor = 'OPEN'; a.style.width = 'calc(var(--rh) * 1.1)';
      a.innerHTML = `<div class="screen"><h3>${esc(R.moreCard.label)}</h3><p>${esc(R.moreCard.sub)}</p></div>`;
      track.appendChild(a);
    }
    frames = $$('.frame', track);

    // covers play while they are on screen
    if (!reduce && 'IntersectionObserver' in window) {
      coverIO = new IntersectionObserver((es) => es.forEach((e) => cover(e.target, e.isIntersecting)), { threshold: 0.3 });
      folders.forEach((f) => coverIO.observe(f.el));
    }

    $('#reel-count').textContent = `01 / ${pad(folders.length || 1)}`;
    setupScroll();
    initPlayer();
    initFolder();
  };

  function cover(el, on) {
    const vid = $('video', el); if (!vid) return;
    if (on) {
      if (!vid.getAttribute('src')) vid.src = vid.dataset.src;
      const p = vid.play(); if (p && p.catch) p.catch(() => {});
    } else { vid.pause(); }
  }

  /* ---------------- scroll behaviour ---------------- */
  function setupScroll() {
    const sec = $('#reel'), view = $('#reel-view'), track = $('#reel-track');
    const cnt = $('#reel-count'), prog = $('#reel-prog');
    const setProg = (p) => {
      prog.style.transform = `scaleX(${p.toFixed(4)})`;
      const n = folders.length || 1;
      cnt.textContent = `${pad(Math.min(n, Math.floor(p * n) + 1))} / ${pad(n)}`;
    };
    if (!hasGSAP) return;
    const mm = gsap.matchMedia();
    FC.reelMM = mm;
    mm.add('(min-width: 821px) and (prefers-reduced-motion: no-preference)', () => {
      view.style.overflowX = 'hidden';
      const dist = () => Math.max(0, track.scrollWidth - view.clientWidth);
      const tween = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: sec, start: 'top top', end: () => '+=' + Math.max(innerHeight * 1.2, dist() * 1.5), pin: true, scrub: 0.7,
          anticipatePin: 1, invalidateOnRefresh: true, onUpdate: (self) => setProg(self.progress)
        }
      });
      reelST = tween.scrollTrigger;
      $$('.frame:not(.more)', track).forEach((fr) => {
        gsap.fromTo($$('img,video', fr), { xPercent: -5 }, { xPercent: 5, ease: 'none', scrollTrigger: { trigger: fr, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
      });
      return () => { view.style.overflowX = ''; reelST = null; };
    });
    // mobile / reduced motion: native horizontal scroll
    mm.add('(max-width: 820px), (prefers-reduced-motion: reduce)', () => {
      const onS = () => setProg(view.scrollWidth - view.clientWidth > 0 ? view.scrollLeft / (view.scrollWidth - view.clientWidth) : 0);
      view.addEventListener('scroll', onS, { passive: true });
      return () => view.removeEventListener('scroll', onS);
    });
    setProg(0);
  }

  /* ---------------- folder (grid of clips) ---------------- */
  const D = {};
  function initFolder() {
    D.el = $('#folder'); D.grid = $('#fd-grid'); D.scroll = $('#fd-scroll');
    $('#fd-close').addEventListener('click', closeFolder);
    document.addEventListener('keydown', (e) => {
      if (!F.open || !P.el.hidden || performance.now() - (P.lastClose || 0) < 400) return;
      if (e.key === 'Escape') closeFolder();
      else if (e.key === 'Tab') {
        const f = $$('button, [tabindex="0"]', D.el).filter((x) => !x.disabled && x.offsetParent !== null);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  function openFolder(i, card) {
    const f = folders[i]; if (!f || F.open) return;
    F.open = true; F.i = i; F.card = card; F.focus = document.activeElement;
    $('#fd-kicker').textContent = `FOLDER ${pad(i + 1)} / ${pad(folders.length)} · ${f.videos.length} ${f.videos.length === 1 ? 'FILM' : 'FILMS'}`;
    $('#fd-title').textContent = f.label;
    const bl = $('#fd-blurb'); bl.textContent = f.blurb; bl.hidden = !f.blurb;
    D.grid.innerHTML = '';
    f.videos.forEach((v, n) => {
      const it = document.createElement('article');
      it.className = 'fd-item';
      it.style.setProperty('--ar', ratio(v.w, v.h).toFixed(4));
      it.tabIndex = 0; it.setAttribute('role', 'button'); it.dataset.cursor = 'PLAY';
      it.setAttribute('aria-label', `Play ${v.title}${v.duration ? ', ' + mmss(v.duration) : ''}`);
      it.innerHTML = `
        <img src="${esc(v.poster)}" alt="" loading="lazy" draggable="false">
        <video muted loop playsinline preload="none" data-src="${esc(v.preview)}" aria-hidden="true" tabindex="-1"></video>
        <span class="fd-n" aria-hidden="true">${pad(n + 1)}</span>
        <span class="fd-play" aria-hidden="true">▶</span>
        <div class="fd-cap"><h4>${esc(v.title)}</h4><p>${[mmss(v.duration), v.year].filter(Boolean).map(esc).join(' · ')}</p></div>`;
      D.grid.appendChild(it);
      v.card = it;
      it.addEventListener('click', () => openPlayer(f.videos, n, it));
      it.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPlayer(f.videos, n, it); } });
      const vid = $('video', it);
      const hotit = (on) => {
        if (on) { if (!vid.getAttribute('src')) vid.src = vid.dataset.src; it.classList.add('is-hot'); const p = vid.play(); if (p && p.catch) p.catch(() => {}); }
        else { it.classList.remove('is-hot'); vid.pause(); }
      };
      if (fine) { it.addEventListener('pointerenter', () => hotit(true)); it.addEventListener('pointerleave', () => hotit(false)); }
      it.addEventListener('focus', () => { if (it.matches(':focus-visible')) hotit(true); });
      it.addEventListener('blur', () => hotit(false));
    });
    D.scroll.scrollTop = 0;
    D.el.hidden = false; D.el.setAttribute('aria-hidden', 'false');
    FC.stopScroll();
    document.body.classList.add('viewer-open');
    frames.forEach((fr) => cover(fr, false));
    if (hasGSAP && !reduce) {
      const r = (card || document.body).getBoundingClientRect();
      const from = `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px)`;
      gsap.fromTo(D.el, { clipPath: from }, { clipPath: 'inset(0px 0px 0px 0px)', duration: 0.85, ease: 'power4.inOut' });
      gsap.from('.fd-top > *', { y: -16, opacity: 0, stagger: 0.08, duration: 0.6, delay: 0.5, ease: 'power3.out' });
      gsap.from('.fd-blurb, .fd-item', { y: 40, opacity: 0, stagger: 0.07, duration: 0.8, delay: 0.55, ease: 'power3.out', clearProps: 'transform,opacity' });
    }
    setTimeout(() => $('#fd-close').focus({ preventScroll: true }), 100);
  }

  function closeFolder() {
    if (!F.open) return;
    F.open = false;
    const fin = () => {
      D.el.hidden = true; D.el.setAttribute('aria-hidden', 'true');
      D.grid.innerHTML = '';
      document.body.classList.remove('viewer-open');
      FC.startScroll();
      if (hasGSAP) gsap.set(D.el, { clearProps: 'clipPath' });
      if (F.focus && F.focus.focus) F.focus.focus({ preventScroll: true });
      if (!reduce && 'IntersectionObserver' in window) folders.forEach((f) => { if (f.el) { const r = f.el.getBoundingClientRect(); cover(f.el, r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight); } });
    };
    if (hasGSAP && !reduce) {
      let to = 'inset(50% 0px 50% 0px)';
      const c = F.card && F.card.getBoundingClientRect();
      if (c && c.bottom > 0 && c.top < innerHeight && c.right > 0 && c.left < innerWidth) to = `inset(${c.top}px ${innerWidth - c.right}px ${innerHeight - c.bottom}px ${c.left}px)`;
      gsap.to(D.el, { clipPath: to, duration: 0.75, ease: 'power4.inOut', onComplete: fin });
    } else fin();
  }

  /* ---------------- player ---------------- */
  const P = {};
  function initPlayer() {
    P.el = $('#player'); P.stage = $('#pl-stage');
    P.title = $('#pl-title'); P.meta = $('#pl-meta'); P.note = $('#pl-note');
    P.play = $('#pl-play'); P.cur = $('#pl-cur'); P.dur = $('#pl-dur'); P.scrub = $('#pl-scrub');
    P.prog = $('#pl-prog'); P.buf = $('#pl-buf'); P.mute = $('#pl-mute'); P.full = $('#pl-full');
    $('#pl-close').addEventListener('click', closePlayer);
    $('#pl-prev').addEventListener('click', () => step(-1));
    $('#pl-next').addEventListener('click', () => step(1));
    P.play.addEventListener('click', toggle);
    P.mute.addEventListener('click', () => { if (P.v) { P.v.muted = !P.v.muted; syncMute(); } });
    P.full.addEventListener('click', () => { if (document.fullscreenElement) document.exitFullscreen(); else if (P.el.requestFullscreen) P.el.requestFullscreen().catch(() => {}); });
    // scrubbing
    let dragging = false;
    const seekAt = (e) => { if (!P.v || !P.v.duration) return; const r = P.scrub.getBoundingClientRect(); P.v.currentTime = clamp((e.clientX - r.left) / r.width, 0, 1) * P.v.duration; };
    P.scrub.addEventListener('pointerdown', (e) => { dragging = true; P.scrub.setPointerCapture(e.pointerId); seekAt(e); });
    P.scrub.addEventListener('pointermove', (e) => { if (dragging) seekAt(e); });
    P.scrub.addEventListener('pointerup', () => { dragging = false; });
    P.scrub.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { seek(5); e.stopPropagation(); } if (e.key === 'ArrowLeft') { seek(-5); e.stopPropagation(); } });
    // idle UI
    const wake = () => { P.el.classList.remove('ui-idle'); clearTimeout(idleT); idleT = setTimeout(() => { if (P.v && !P.v.paused) P.el.classList.add('ui-idle'); }, 2800); };
    P.el.addEventListener('pointermove', wake); P.el.addEventListener('pointerdown', wake);
    document.addEventListener('keydown', (e) => {
      if (P.el.hidden) return;
      wake();
      const k = e.key;
      if (k === 'Escape') { if (!document.fullscreenElement) closePlayer(); }
      else if (k === ' ' || k === 'k') { if (e.target.tagName !== 'BUTTON') { e.preventDefault(); toggle(); } }
      else if (k === 'ArrowRight') seek(5);
      else if (k === 'ArrowLeft') seek(-5);
      else if (k === 'n' || k === 'N') step(1);
      else if (k === 'p' || k === 'P') step(-1);
      else if (k === 'f' || k === 'F') P.full.click();
      else if (k === 'm' || k === 'M') P.mute.click();
      else if (k === 'Tab') {
        const f = $$('button, [tabindex="0"], iframe', P.el).filter((x) => !x.disabled && x.offsetParent !== null);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }
  const FPS = 24;
  const syncMute = () => { P.mute.textContent = !P.v || P.v.muted ? 'MUTED' : 'VOL'; };
  function toggle() { if (!P.v) return; if (P.v.paused) P.v.play(); else P.v.pause(); }
  function seek(d) { if (P.v) P.v.currentTime = clamp(P.v.currentTime + d, 0, P.v.duration || 1e9); }

  function embedURL(e) {
    if (!e) return '';
    if (e.url) return e.url;
    if (!e.id) return '';
    if (e.provider === 'youtube') return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(e.id)}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
    return '';
  }

  function load(v) {
    P.stage.innerHTML = ''; P.v = null; P.note.hidden = true;
    P.el.classList.remove('is-embed', 'ui-idle');
    P.stage.classList.toggle('is-v', v.orientation === 'v');
    P.title.textContent = v.title;
    P.meta.textContent = [v.folder.label, v.year, v.client, mmss(v.duration)].filter(Boolean).join(' · ');
    const url = embedURL(v.embed);
    if (url) {
      const f = document.createElement('iframe');
      f.src = url; f.title = v.title; f.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media'; f.allowFullscreen = true;
      P.stage.appendChild(f); P.el.classList.add('is-embed');
      if (location.protocol === 'file:') { P.note.textContent = 'EMBEDS NEED A WEB ADDRESS — THEY WORK ONCE THE SITE IS HOSTED (OR RUN A LOCAL SERVER)'; P.note.hidden = false; }
      return;
    }
    const vid = document.createElement('video');
    vid.playsInline = true; vid.preload = 'auto'; vid.setAttribute('aria-label', v.title);
    vid.poster = v.poster || '';
    vid.src = v.src || v.preview;
    P.stage.appendChild(vid); P.v = vid;
    vid.addEventListener('play', () => { P.play.textContent = '❚❚'; P.play.setAttribute('aria-label', 'Pause'); });
    vid.addEventListener('pause', () => { P.play.textContent = '▶'; P.play.setAttribute('aria-label', 'Play'); P.el.classList.remove('ui-idle'); });
    vid.addEventListener('timeupdate', () => {
      const d = vid.duration || 0;
      P.cur.textContent = tc(vid.currentTime, FPS); P.dur.textContent = tc(d, FPS);
      const p = d ? vid.currentTime / d : 0;
      P.prog.style.width = p * 100 + '%'; P.scrub.setAttribute('aria-valuenow', Math.round(p * 100));
      if (vid.buffered.length) P.buf.style.width = (vid.buffered.end(vid.buffered.length - 1) / (d || 1)) * 100 + '%';
    });
    vid.addEventListener('click', toggle);
    vid.addEventListener('ended', () => { if (!vid.loop) { P.play.textContent = '▶'; } });
    syncMute();
    const pr = vid.play(); if (pr && pr.catch) pr.catch(() => { vid.muted = true; syncMute(); vid.play().catch(() => {}); });
  }

  function openPlayer(list, idx, card) {
    if (idx < 0 || !list[idx]) return;
    P.list = list; current = idx; lastCard = card; lastFocus = document.activeElement;
    const v = list[idx];
    P.el.hidden = false; P.el.setAttribute('aria-hidden', 'false');
    FC.stopScroll();
    document.body.classList.add('player-open', 'viewer-open');
    load(v);
    if (hasGSAP && !reduce) {
      const r = (card || document.body).getBoundingClientRect();
      const from = `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px)`;
      gsap.fromTo(P.el, { clipPath: from }, { clipPath: 'inset(0px 0px 0px 0px)', duration: 0.95, ease: 'power4.inOut' });
      gsap.from('.pl-bar', { height: 0, duration: 0.9, delay: 0.5, ease: 'power3.out' });
      gsap.from(P.stage, { opacity: 0, duration: 0.7, delay: 0.55 });
      gsap.from('.pl-head > *, .pl-ctrl', { y: 20, opacity: 0, stagger: 0.1, duration: 0.7, delay: 0.7, ease: 'power3.out' });
    }
    setTimeout(() => $('#pl-close').focus(), 100);
    P.el.classList.remove('ui-idle');
  }

  function step(d) {
    const L = P.list || [];
    if (L.length < 2) return;
    current = (current + d + L.length) % L.length;
    const v = L[current]; lastCard = v.card;
    if (hasGSAP && !reduce) gsap.fromTo(P.stage, { opacity: 0, x: d * 60 }, { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out' });
    load(v);
  }

  function closePlayer() {
    if (P.el.hidden) return;
    P.lastClose = performance.now();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    const fin = () => {
      P.el.hidden = true; P.el.setAttribute('aria-hidden', 'true');
      if (P.v) { P.v.pause(); P.v.removeAttribute('src'); P.v.load(); }
      P.stage.innerHTML = ''; P.v = null;
      document.body.classList.remove('player-open');
      if (!F.open) { document.body.classList.remove('viewer-open'); FC.startScroll(); }
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
      if (hasGSAP) gsap.set(P.el, { clearProps: 'clipPath' });
    };
    if (hasGSAP && !reduce) {
      let to = 'inset(50% 0px 50% 0px)';
      const c = lastCard && lastCard.getBoundingClientRect();
      if (c && c.width && c.bottom > 0 && c.top < innerHeight && c.right > 0 && c.left < innerWidth) to = `inset(${c.top}px ${innerWidth - c.right}px ${innerHeight - c.bottom}px ${c.left}px)`;
      gsap.to(P.el, { clipPath: to, duration: 0.8, ease: 'power4.inOut', onComplete: fin });
    } else fin();
  }
})();
