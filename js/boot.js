/* boot.js — starts everything in the right order */
(function () {
  'use strict';
  function start() {
    const FC = window.FC;
    if (!FC || !window.SITE) { document.body.classList.remove('is-loading'); console.error('content.js or core.js failed to load.'); return; }
    // build every section first (DOM order matters for pinning), then run the loader
    FC.initCore();
    FC.initAbout && FC.initAbout();
    FC.initReel && FC.initReel();
    FC.initPosters && FC.initPosters();
    FC.initContact && FC.initContact();
    FC.postInit();
    window.scrollTo(0, 0);
    FC.loader().then(() => {
      FC.startScroll();
      FC.heroIntro();
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  }
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
