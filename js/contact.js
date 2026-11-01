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
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const f = new FormData(form);
      let ok = true;
      ['name', 'email', 'msg'].forEach((k) => {
        const el = form.elements[k]; const bad = !String(f.get(k) || '').trim() || (k === 'email' && !/^\S+@\S+\.\S+$/.test(f.get(k)));
        el.classList.toggle('is-bad', bad); if (bad) ok = false;
      });
      if (!ok) { status.textContent = '⚠ Please fill in name, a valid email and your brief.'; return; }
      const subject = `${f.get('type')} enquiry — ${f.get('name')}`;
      const body = `Hi ${S.person.first},\n\n${f.get('msg')}\n\n— ${f.get('name')}\n${f.get('email')}\nProject type: ${f.get('type')}`;
      status.textContent = 'Opening your mail app… (nothing happened? use “Copy email”)';
      location.href = `mailto:${C.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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
