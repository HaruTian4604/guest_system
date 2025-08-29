// js/common-scripts.js
// 目标：把所有「全站通用脚本」集中在一起按顺序加载；
//      每个页面可以通过 window.pageScripts 追加“本页专用脚本”。

(function () {
  // 1) 全站通用脚本（按依赖顺序排好）
  //    你可以根据实际使用调整/增减顺序
  const COMMON = [
    'plugin/yo/yo.js',
    'plugin/pager/pager.js',

    'js/common/layout.js',
    'js/common/main.js',
    'js/common/userswitch.js',
  ];

  // 2) 每页可追加的专用脚本（在页面里通过 window.pageScripts 设置）
  const PAGE = Array.isArray(window.pageScripts) ? window.pageScripts : [];

  // 3) 合并后的加载队列
  const queue = [...COMMON, ...PAGE];

  // 动态按顺序加载脚本
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      // 已经加载过就跳过（避免重复插入）
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const s = document.createElement('script');
      s.src = src;
      // 如果你有相对路径问题，可以加上 <base> 或这里统一前缀
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Failed to load: ${src}`));
      document.body.appendChild(s);
    });
  }

  (async () => {
    for (const src of queue) {
      await loadScript(src);
    }
    // 可选：加载完毕的回调（每页可定义 window.onCommonScriptsLoaded）
    if (typeof window.onCommonScriptsLoaded === 'function') {
      try { window.onCommonScriptsLoaded(); } catch (e) {}
    }
  })();
})();
