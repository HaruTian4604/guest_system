// js/userswitch.js
(function () {
    // 当前用户状态
    let currentUser = {
        token: '5358979',
        // role: 'user'
    };

function createUserSwitch(users) {
  const container = document.createElement('div');
  container.className = 'ms-auto';
  container.id = 'user-switch-container';

  const group = document.createElement('div');
  group.className = 'btn-group';
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', 'User switch');

  users.forEach(user => {
    const radioId = `user-radio-${user.token}`;

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.className = 'btn-check';
    radio.name = 'user-switch';
    radio.id = radioId;
    radio.autocomplete = 'off';
    radio.value = user.token;
    radio.checked = user.token === currentUser.token;
    radio.addEventListener('change', () => switchUser(user.token));

    const label = document.createElement('label');
    label.className = 'btn btn-outline-primary';
    label.htmlFor = radioId;
    label.textContent = user.name;

    group.appendChild(radio);
    group.appendChild(label);
  });

  container.appendChild(group);
  return container;
}
    // 切换用户
async function switchUser(token) {
  try {
    // const resp = await api(`user/current?token=${token}`);
    // const data = resp?.json ? await resp.json() : resp; // 兼容两种返回
    const data = await api('user/current', { token });
    const { ok, user } = data;

    if (ok) {
      currentUser = user;
      localStorage.setItem('currentUser', JSON.stringify(user));
      yo_success(`Hello ${user.name}`);
    }
  } catch (error) {
    yo_error('Cannot switch user:', error);
  }
}

// 初始化
async function initUserSwitch() {
  try {
    // 1) 读本地并容错解析
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        currentUser = JSON.parse(storedUser);
      } catch (e) {
        // 兼容旧历史：把 'iamuser' / 'iamadmin' 迁移为对象，并回写
        if (storedUser === 'iamuser') {
          currentUser = { token: '5358979', name: 'iamuser', role: 'user' };
        } else if (storedUser === 'iamadmin') {
          currentUser = { token: '31415926', name: 'iamadmin', role: 'admin' };
        } else {
          // 最保守：只知道是个 token
          currentUser = { token: storedUser };
        }
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
      }
    }

    // 2) 拉取列表（兼容两种 api 返回）
    const resp = await api('user/list',{});
    const users = Array.isArray(resp) ? resp : await resp.json?.();

    const navbar = document.getElementById('topbar');
    if (navbar) navbar.appendChild(createUserSwitch(users));
  } catch (error) {
   yo_error('Cannot initialise user:', error);
  }
}

    // 获取当前用户token (供其他模块使用)
    function getCurrentUserToken() {
        return currentUser.token;
    }

    // 检查是否是管理员
    function isAdmin() {
        return currentUser.role === 'admin';
    }

    // 暴露接口
    window.userAuth = {
        getCurrentUserToken,
        isAdmin,
        // 供请求时添加认证头
        withAuth: async (options = {}) => {
            options.headers = options.headers || {};
            options.headers['X-Auth-Token'] = getCurrentUserToken();
            return options;
        }
    };

    // 初始化
    document.addEventListener('DOMContentLoaded', initUserSwitch);
})();
