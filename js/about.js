/* about.js — headline, bio, stats, portrait and the mock editing timeline */
(function () {
  'use strict';
  const FC = window.FC, { $, $$, S, reduce, hasGSAP, esc, tc } = FC;

  FC.initAbout = function () {
    const A = S.about; if (!A) return;

    // headline
    const h = $('#about-h');
    const words = FC.heading(h, A.headline);
    FC.revealHeading(h, words, 'top 88%');

    // bio — every word starts dim and "lights up" as you read
    const bio = $('#bio');
    bio.innerHTML = A.bio.map((p) => '<p>' + esc(p).split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' ') + '</p>').join('');
    if (hasGSAP && !reduce) {
      const ws = $$('.w', bio);
      gsap.to(ws, { opacity: 1, ease: 'none', stagger: 0.12, duration: 0.4, scrollTrigger: { trigger: bio, start: 'top 82%', end: 'bottom 58%', scrub: true } });
    }

    // portrait
    const img = $('#pt-img'), empty = $('#pt-empty');
    if (A.portrait) {
      img.src = A.portrait; img.alt = A.portraitAlt || ''; img.hidden = false; empty.hidden = true;
    }
    if (hasGSAP && !reduce) {
      gsap.fromTo('.pt-frame > img, .pt-empty img', { yPercent: -6, scale: 1.12 }, { yPercent: 6, scale: 1.12, ease: 'none', scrollTrigger: { trigger: '#portrait', start: 'top bottom', end: 'bottom top', scrub: true } });
    }

    // stats
    const stats = $('#stats');
    stats.innerHTML = A.stats.map((s) => `<li><b><span class="num" data-v="${s.value}">0</span><em>${esc(s.suffix || '')}</em></b><span>${esc(s.label)}</span></li>`).join('');
    $$('.num', stats).forEach((n) => {
      const v = +n.dataset.v;
      if (!hasGSAP || reduce) { n.textContent = v; return; }
      const o = { v: 0 };
      ScrollTrigger.create({ trigger: n, start: 'top 90%', once: true, onEnter: () => gsap.to(o, { v, duration: 1.8, ease: 'power3.out', onUpdate: () => (n.textContent = Math.round(o.v)) }) });
    });

    // kit
    $('#kit').innerHTML = A.kit.map(esc).join('<i>/</i>');

    // ---- the mock NLE timeline ----
    const T = A.timeline;
    $('#nle-title').textContent = T.title;
    $('#nle').setAttribute('role', 'group');
    const heads = $('#nle-heads'), lanes = $('#nle-lanes'), ruler = $('#nle-ruler'), ph = $('#nle-ph');
    heads.innerHTML = T.tracks.map((t) => `<div class="nle-head"><b>${esc(t.id)}</b><span>${esc(t.name)}</span></div>`).join('');
    ['00:00', '00:15', '00:30', '00:45', '01:00'].forEach((l, i) => { const s = document.createElement('span'); s.textContent = l; s.style.left = i * 25 + '%'; if (i === 4) { s.style.left = '100%'; s.style.transform = 'translateX(-44px)'; } ruler.appendChild(s); });
    const clipData = [];
    T.tracks.forEach((t) => {
      const lane = document.createElement('div'); lane.className = 'nle-lane';
      t.clips.forEach((c) => {
        const el = document.createElement('div');
        el.className = 'clip ' + (c.color || 'bone');
        el.tabIndex = 0; el.setAttribute('role', 'button'); el.dataset.cursor = 'LAUNCH';
        el.setAttribute('aria-label', `${c.label}${c.note ? ' — ' + c.note : ''}. Press to launch it.`);
        el.style.left = c.start + '%'; el.style.width = c.len + '%';
        el.textContent = c.label; el.title = c.note || c.label;
        lane.appendChild(el);
        el.addEventListener('click', () => boomerang(el, c));
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); boomerang(el, c); } });
        clipData.push({ el, s: c.start, e: c.start + c.len, label: c.label, track: t.id });
      });
      lanes.insertBefore(lane, ph);
    });

    /* ---- 3D boomerang: a clone of the bar flies at the viewer and swings back ---- */
    const RGB = { red: '226,51,31', amber: '240,178,58', violet: '176,76,255', bone: '239,233,220' };
    const layer = document.createElement('div');
    layer.className = 'fly-layer'; layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
    let flying = null;
    function boomerang(el, c) {
      if (!hasGSAP) return;
      if (flying) flying.progress(1);                         // finish the previous one instantly -> never stacks
      const rgb = RGB[c.color] || RGB.bone;
      if (reduce) {                                           // reduced motion: gentle fade pulse only
        flying = gsap.timeline({ onComplete: () => { flying = null; } })
          .to(el, { opacity: 0.25, duration: 0.25 }).to(el, { opacity: 1, duration: 0.35 });
        return;
      }
      const r = el.getBoundingClientRect();
      const ghost = el.cloneNode(true);
      ['tabindex', 'role', 'data-cursor', 'title', 'aria-label'].forEach((a) => ghost.removeAttribute(a));
      ghost.classList.add('fly');
      ghost.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;
      if (c.note) { const n = document.createElement('small'); n.textContent = c.note; ghost.appendChild(n); }
      layer.appendChild(ghost);
      el.style.visibility = 'hidden';
      // it flies toward the centre of the screen as it comes at you
      const dx = (innerWidth / 2 - (r.left + r.width / 2)) * 0.35, dy = (innerHeight / 2 - (r.top + r.height / 2)) * 0.35;
      const glow = `0 0 50px 10px rgba(${rgb},.8), 0 40px 90px rgba(${rgb},.55)`;
      const rest = `0 0 0 0 rgba(${rgb},0)`;
      gsap.set(ghost, { transformPerspective: 900, transformOrigin: '50% 50%', boxShadow: rest });
      flying = gsap.timeline({ onComplete: () => { ghost.remove(); el.style.visibility = ''; flying = null; } })
        .to(ghost, { x: dx, y: dy, z: 560, scale: 1.25, rotationX: -16, rotationY: 14, boxShadow: glow, duration: 0.45, ease: 'power3.out' })
        .to(ghost, { rotationY: 20, rotationX: -22, z: 600, duration: 0.25, ease: 'sine.inOut' })      // the hang
        .to(ghost, { x: 0, y: 0, z: 0, scale: 1, rotationX: 0, rotationY: 0, boxShadow: rest, duration: 0.5, ease: 'power2.inOut' });
    }

    const now = $('#nle-now'), ptc = $('#nle-tc');
    const update = (p) => {
      const x = p * 100;
      ph.style.transform = `translate3d(${(p * lanes.clientWidth).toFixed(1)}px,0,0)`;
      ptc.textContent = tc(p * 60, 24);
      const on = [];
      clipData.forEach((c) => {
        const a = x >= c.s && x <= c.e;
        if (a !== c.on) { c.on = a; c.el.classList.toggle('on', a); }
        if (a && (c.track === 'V1' || c.track === 'V2' || c.track === 'V3' || c.track === 'GFX')) on.push(c.label);
      });
      const txt = on.slice(0, 3).join(' + ') || '—';
      if (now.textContent !== txt) now.textContent = txt;
    };
    update(0.3);
    if (hasGSAP && !reduce) {
      gsap.from(clipData.map((c) => c.el), { scaleX: 0, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.05, scrollTrigger: { trigger: '#nle', start: 'top 82%', once: true } });
      ScrollTrigger.create({ trigger: '#nle', start: 'top 78%', end: 'bottom 30%', scrub: true, onUpdate: (self) => update(self.progress) });
      addEventListener('resize', () => update(0.3));
    }
  };
})();
