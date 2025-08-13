// js/userswitch.js
(function() {
  // 用户配置
  const USER_TOKENS = [
    { id: 'iamuser', label: 'User' },
    { id: 'iamadmin', label: 'Admin' }
  ];

  // 创建用户切换组件
  function createUserSwitch() {
    const container = document.createElement('div');
    container.className = 'ms-auto';
    container.id = 'user-switch-container';

    const group = document.createElement('div');
    group.className = 'btn-group';
    group.role = 'group';
    group.ariaLabel = 'User switch';

    USER_TOKENS.forEach(user => {
      // 创建单选按钮
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.className = 'btn-check';
      radio.name = 'user-switch';
      radio.id = user.id;
      radio.autocomplete = 'off';

      // 创建标签
      const label = document.createElement('label');
      label.className = 'btn btn-outline-primary';
      label.htmlFor = user.id;
      label.textContent = user.label;

      // 设置默认选中状态
      if (user.id === 'iamuser') {
        radio.checked = true;
        localStorage.setItem('currentUser', 'iamuser');
      }

      // 添加事件监听
      radio.addEventListener('change', () => handleUserSwitch(user.id));

      group.appendChild(radio);
      group.appendChild(label);
    });

    container.appendChild(group);
    return container;
  }

  // 处理用户切换
  function handleUserSwitch(token) {
    localStorage.setItem('currentUser', token);

    // 获取用户名用于显示
    const username = USER_TOKENS.find(u => u.id === token)?.label || token;

    // 显示成功消息
    if (typeof yo_success === 'function') {
      yo_success(`切换成功: ${username} 模式`);
    }
  }

  // 初始化
  function initUserSwitch() {
    const navbar = document.getElementById('topbar');
    if (!navbar) return;

    // 移除可能存在的旧容器
    const oldContainer = document.getElementById('user-switch-container');
    if (oldContainer) oldContainer.remove();

    // 添加用户切换组件
    navbar.appendChild(createUserSwitch());

    // 应用存储的用户状态
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const radio = document.getElementById(storedUser);
      if (radio) radio.checked = true;
    }
  }

  // 获取当前用户token
  function getCurrentUserToken() {
    return localStorage.getItem('currentUser') || 'iamuser';
  }

  // 检查是否是管理员
  function isAdmin() {
    return getCurrentUserToken() === 'iamadmin';
  }

  // 页面加载完成后初始化
  document.addEventListener('DOMContentLoaded', initUserSwitch);

  // 暴露公共接口
  window.userSwitch = {
    getCurrentUserToken,
    isAdmin
  };
})();
