// js/layout.js
(function () {
  // 允许每页通过 window.pageConfig 传参
  const {
    title = document.title || 'Refugee System',
    active = '', // 'dashboard' | 'guest' | 'accommodation' | 'host' | 'placement'
    brand = 'Refugee System',
    // 需要的话还可以加更多参数，比如右上角用户区、Breadcrumb 等
  } = window.pageConfig || {};

  // 渲染 topbar
  const topbar = document.querySelector('#topbar');
  if (topbar) {
    topbar.innerHTML = `
      <nav class="navbar navbar-light bg-light">
        <a class="navbar-brand">${brand}</a>
        <div id="user-switch-slot" class="ms-auto"></div>
      </nav>
    `;
  }

  // 渲染 sidebar
  const sidebar = document.querySelector('#sidebar');
  if (sidebar) {
    const items = [
      { id: 'dashboard', href: 'index.html', text: 'Dashboard' },
      { id: 'guest', href: 'guest.html', text: 'Guest' },
      { id: 'accommodation', href: 'accommodation.html', text: 'Accommodation' },
      { id: 'host', href: 'host.html', text: 'Host' },
      { id: 'placement', href: 'placement.html', text: 'Placement' },
    ];
    sidebar.innerHTML = items.map(it => `
      <a href="${it.href}" class="${it.id === active ? 'active' : ''}">${it.text}</a>
    `).join('');
  }



  if (!sidebar.querySelector('#log_btn')) {
    const logBtn = document.createElement('a');
    logBtn.id = 'log_btn';
    logBtn.innerHTML = 'Operation Log';
    logBtn.href = 'log.html';
    logBtn.className = 'btn btn-outline-primary btn-block btn-sm';
    sidebar.appendChild(logBtn);
  }

  // 可选：设置页面主标题 <h1>（如果你愿意统一由参数控制）
  const h1 = document.querySelector('.content h1');
  if (h1 && title) h1.textContent = title;
})();
