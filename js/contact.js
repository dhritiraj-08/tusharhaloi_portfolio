/* contact.js — call to action, socials, call-sheet form, end credits */
(function () {
  'use strict';
  const FC = window.FC, { $, $$, S, reduce, hasGSAP, esc } = FC;

  FC.initContact = function () {
    const C = S.contact; if (!C) return;
    const h = $('#contact-h');
    FC.revealHeading(h, FC.heading(h, [].concat(C.headline)), 'top 88%');
    const hire = $('#contact-hire');
    if (hire && C.hire) FC.revealHeading(hire, FC.heading(hire, [C.hire]), 'top 92%');

    // orb + mailto
    const mail = 'mailto:' + C.email;
    // the round button opens Instagram (url comes from content.js → contact.socials)
    const ig = (C.socials || []).find((x) => x.key === 'instagram');
    const orb = $('#orb');
    if (ig) {
      orb.href = ig.url; orb.target = '_blank'; orb.rel = 'noopener noreferrer';
      orb.setAttribute('aria-label', 'Say hello on Instagram ' + ig.handle + ' (opens in a new tab)');
    } else { orb.href = mail; }

    // socials
    const list = [{ label: 'Email', handle: C.email, url: mail, ext: false }]
      .concat(C.socials.map((s) => ({ label: s.label, handle: s.handle, url: s.url, ext: true })))
      .concat(C.whatsapp ? [{ label: 'WhatsApp', handle: '+' + C.whatsapp, url: 'https://wa.me/' + C.whatsapp, ext: true }] : []);
    $('#socials').innerHTML = list.map((s, i) => `<li><a href="${esc(s.url)}" ${s.ext ? 'target="_blank" rel="noopener"' : ''} data-cursor="OPEN" aria-label="${esc(s.label)}: ${esc(s.handle)}"><span><i>${String(i + 1).padStart(2, '0')}</i>${esc(s.label)}</span><small>${esc(s.handle)} ↗</small></a></li>`).join('');

    // form
    const sel = $('#cs-type');
    sel.innerHTML = C.projectTypes.map((t) => `<option>${esc(t)}</option>`).join('');
    $('#cs-no').textContent = String(Math.floor(Math.random() * 9000) + 1000);
    const form = $('#callsheet'), status = $('#cs-status');
    const stage = $('#cs-stage'), env = $('#cs-env'), done = $('#cs-done'), btn = $('.cs-send', form), btnT = $('.cs-send-t', form), plane = $('.cs-plane', form);
    const fields = () => $$('.cs-head ~ label, .cs-actions', form);
    let busy = false;

    const post = (payload) => fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then((r) => r.json().catch(() => ({})).then((j) => ({ ok: r.ok && j.ok, msg: j.error })))
      .catch(() => ({ ok: false }));

    // the envelope: paper slides in, flap closes — loops its "sealing" until the server answers
    function seal() {
      gsap.set(stage, { opacity: 1 }); stage.classList.add('on');
      gsap.set('.cs-trail', { opacity: 0, scaleX: 0 });
      gsap.set(env, { x: 0, y: 0, rotation: 0, scale: 0.55, opacity: 0, transformOrigin: '50% 60%' });
      gsap.set('.env-flap', { scaleY: -1, svgOrigin: '100 22' });
      gsap.set('.env-paper, .env-line', { y: -64 });
      return gsap.timeline()
        .to(env, { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(1.6)' })
        .to('.env-paper, .env-line', { y: 0, duration: 0.5, ease: 'power3.inOut' }, '-=.05')
        .to('.env-flap', { scaleY: 1, duration: 0.5, ease: 'power2.inOut' })
        .to(env, { y: -6, duration: 0.35, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    }
    function flyAway() {
      return new Promise((res) => {
        gsap.killTweensOf(env);
        const tl = gsap.timeline({ onComplete: res });
        tl.to(env, { y: 8, scale: 0.94, duration: 0.18, ease: 'power2.in' })
          .to('.cs-trail', { opacity: 0.9, scaleX: 1, duration: 0.2, stagger: 0.04 }, '<')
          .to(env, { x: innerWidth * 0.55, y: -innerHeight * 0.55, rotation: 14, scale: 0.35, duration: 0.85, ease: 'power3.in' })
          .to('.cs-trail', { x: innerWidth * 0.5, y: -innerHeight * 0.5, opacity: 0, duration: 0.7, ease: 'power3.in' }, '<')
          .set(stage, { opacity: 0 });
      });
    }
    function showDone(name, email) {
      $('#cs-done-msg').textContent = `Thanks ${name.split(' ')[0]}! I've got your message — a confirmation is on its way to ${email}, and I'll get back to you very soon.`;
      done.hidden = false; done.classList.remove('show');
      form.classList.add('is-done');
      if (hasGSAP && !reduce) {
        gsap.fromTo(done, { opacity: 0 }, { opacity: 1, duration: 0.4 });
        gsap.from('.cs-done h4, .cs-done p, .cs-done .btn', { y: 26, opacity: 0, stagger: 0.12, duration: 0.7, delay: 0.55, ease: 'power3.out' });
        setTimeout(() => done.classList.add('show'), 150);
        $$('.cs-check circle', done).forEach((c) => { c.style.transition = 'stroke-dashoffset .7s ease'; });
        $$('.cs-check path', done).forEach((c) => { c.style.transition = 'stroke-dashoffset .5s ease .55s'; });
      } else done.classList.add('show');
    }
    function reset() {
      form.reset(); form.classList.remove('is-done', 'is-sending', 'is-busy'); done.hidden = true; done.classList.remove('show');
      status.textContent = ''; status.classList.remove('is-err');
      if (hasGSAP) { gsap.set(fields(), { clearProps: 'all' }); gsap.set(stage, { opacity: 0 }); }
      stage.classList.remove('on');
      $('#cs-no').textContent = String(Math.floor(Math.random() * 9000) + 1000);
    }
    $('#cs-again').addEventListener('click', reset);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (busy) return;
      const f = new FormData(form);
      let ok = true;
      ['name', 'email', 'msg'].forEach((k) => {
        const el = form.elements[k]; const bad = !String(f.get(k) || '').trim() || (k === 'email' && !/^\S+@\S+\.\S+$/.test(f.get(k)));
        el.classList.toggle('is-bad', bad); if (bad) ok = false;
      });
      status.classList.remove('is-err');
      if (!ok) { status.textContent = '⚠ Please fill in name, a valid email and your brief.'; status.classList.add('is-err'); return; }

      busy = true; form.classList.add('is-busy', 'is-sending');
      status.textContent = '';
      btnT.textContent = 'Sending…';
      const payload = { name: String(f.get('name')).trim(), email: String(f.get('email')).trim(), type: f.get('type'), msg: String(f.get('msg')).trim(), website: f.get('website') || '' };
      const animated = hasGSAP && !reduce;
      let sealTL = null, t0 = performance.now();
      if (animated) {
        gsap.to(plane, { x: 46, y: -22, opacity: 0, rotation: -18, duration: 0.5, ease: 'power2.in' });
        gsap.to(fields(), { opacity: 0, y: -8, duration: 0.35, stagger: 0.04, ease: 'power2.in' });
        sealTL = seal();
      }
      const r = await post(payload);
      if (animated) { const wait = 1700 - (performance.now() - t0); if (wait > 0) await new Promise((rs) => setTimeout(rs, wait)); }   // let the seal finish
      busy = false; btnT.textContent = 'Send call sheet';
      if (animated) gsap.set(plane, { clearProps: 'all' });

      if (r.ok) {
        if (animated) { sealTL.kill(); await flyAway(); }
        showDone(payload.name, payload.email);
      } else {
        // couldn't send: put the form back and offer the mail-app fallback
        form.classList.remove('is-busy', 'is-sending');
        if (animated) { sealTL.kill(); gsap.killTweensOf(env); gsap.to(stage, { opacity: 0, duration: 0.3 }); gsap.to(fields(), { opacity: 1, y: 0, duration: 0.4, stagger: 0.04, clearProps: 'all' }); }
        const subject = `${payload.type} enquiry — ${payload.name}`;
        const body = `Hi ${S.person.first},\n\n${payload.msg}\n\n— ${payload.name}\n${payload.email}\nProject type: ${payload.type}`;
        status.classList.add('is-err');
        status.textContent = (r.msg || 'Couldn’t send that just now.') + ' You can ';
        const a = document.createElement('a');
        a.href = `mailto:${C.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        a.textContent = 'send it from your mail app instead';
        status.appendChild(a); status.appendChild(document.createTextNode('.'));
      }
    });
    $$('input,textarea', form).forEach((el) => el.addEventListener('input', () => el.classList.remove('is-bad')));
    $('#copy-mail').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(C.email); status.textContent = 'Copied ' + C.email + ' ✓'; }
      catch (e) { const t = document.createElement('textarea'); t.value = C.email; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); status.textContent = 'Copied ' + C.email + ' ✓'; }
    });

    // credits
    $('#credits').innerHTML = C.credits.map(([a, b]) => `<div><small>${esc(a)}</small><b>${esc(b)}</b></div>`).join('');

    // rewind
    $('#rewind').addEventListener('click', () => {
      document.body.classList.add('is-rewinding');
      FC.navigating = true;
      FC.scrollTo(0, { duration: 2.6, easing: (t) => t * t * (3 - 2 * t), onComplete: () => { FC.navigating = false; document.body.classList.remove('is-rewinding'); } });
      if (!FC.lenis) setTimeout(() => document.body.classList.remove('is-rewinding'), 1500);
    });
  };
})();
