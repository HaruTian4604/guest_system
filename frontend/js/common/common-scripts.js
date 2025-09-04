// frontend/js/common-scripts.js
(function () {
  const COMMON = [
    'plugin/yo/yo.js',
    'plugin/pager/pager.js',

    'js/common/layout.js',
    'js/common/main.js',
    'js/common/userswitch.js',
  ];

  const PAGE = Array.isArray(window.pageScripts) ? window.pageScripts : [];

  const queue = [...COMMON, ...PAGE];

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Failed to load: ${src}`));
      document.body.appendChild(s);
    });
  }

  (async () => {
    (async () => {
      try {
        for (const src of queue) await loadScript(src);
        if (typeof window.onCommonScriptsLoaded === 'function') window.onCommonScriptsLoaded();
      } catch (e) {
        console.error(e);
      }
    })();
    if (typeof window.onCommonScriptsLoaded === 'function') {
      try { window.onCommonScriptsLoaded(); } catch (e) { }
    }
  })();
})();
