// frontend/js/userswitch.js
(function () {
  // function toastError(msg, err) {
  //   if (typeof window.yo_error === 'function') window.yo_error(msg);
  //   else console.error(msg, err || '');
  // }
  // function toastSuccess(msg) {
  //   if (typeof window.yo_success === 'function') window.yo_success(msg);
  //   else console.log(msg);
  // }

  // 当前用户状态，初始化时只有 token
  const TWO_DEMO_USERS = [
    { name: 'iamadmin', token: '1415926' },
    { name: 'iamcaseworker', token: '5358979' },
  ];

  let currentUser = { token: '5358979' };

  // 创建用户切换界面
  function createDemoUserSwitch(users) {
    const container = document.querySelector('#user-switch-slot') || document.querySelector('#topbar .navbar');

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

      // 检查当前用户是否匹配
      if (user.token === currentUser.token) {
        radio.checked = true;
      }

      // 只传递 token 到 switchUser 函数
      radio.addEventListener('change', () => switchUser(user.token));

      const label = document.createElement('label');
      label.className = 'btn btn-outline-primary';
      label.htmlFor = radioId;
      label.textContent = user.name;
      label.dataset.token = user.token;       // <-- 你要的“btn 携带 token”
      label.title = `user name: ${user.name}\nRole: ${user.roleName}\nToken: ${user.token}`; //鼠标悬停可见
      group.appendChild(radio);
      group.appendChild(label);
    })

    container.appendChild(group);
    return container;
  }

  // 切换用户（只接受 token 参数）
  async function switchUser(token) {
    try {
      // 通过 API 获取完整的用户信息
      const response = await api('user/find', { token });
      // console.log("switchUser response: ", response);
      // console.log("switchUser token: ", token);
      if (response && response.ok && response.user) {
        // 更新当前用户信息（包括 roleName）
        currentUser = {
          token: response.user.token,
          name: response.user.name,
          roleName: response.user.roleName,
        };

        // 保存到本地存储
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        yo_success(`Hello ${response.user.name}`);
      } else {
        yo_error('Failed to switch user: ' + (response?.error || 'Unknown error'));
      }
    } catch (error) {
      yo_error('Cannot switch user:', error);
    }
  }

  // 初始化用户切换组件
  async function initUserSwitch() {
    try {
      // 1. 尝试从本地存储加载用户（如果有）
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        currentUser = JSON.parse(storedUser);
        // console.log("currentUser: ", currentUser);
      }

      // 2. 获取用户列表
      // const resp = await api('user/list');
      // const users = Array.isArray(resp) ? resp : (resp.data || []);

      // 3. 如果当前用户信息不完整，通过 API 获取完整信息
      if (currentUser.token && (!currentUser.roleName || !currentUser.name || !currentUser.roleName == '' || !currentUser.name == '')) {
        const userInfo = await api('user/find', { token: currentUser.token });
        if (userInfo.ok) {
          currentUser = {
            token: userInfo.user.token,
            name: userInfo.user.name,
            roleName: userInfo.user.roleName,
          };
          localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
      }

      // 4. 创建并添加用户切换界面
      // const navbar = document.getElementById('topbar');
      // if (navbar) {
      //   navbar.appendChild(createDemoUserSwitch(TWO_DEMO_USERS));
      // }
      // 4. 先创建并挂载按钮组（即使接口失败也能看到 UI）
      const slot = document.querySelector('#user-switch-slot') || document.querySelector('#topbar .navbar');
      if (slot && !slot.querySelector('.btn-group[role="group"]')) {
        createDemoUserSwitch(TWO_DEMO_USERS); // 函数内部已 append 到 slot
      }
    } catch (error) {
      yo_error('Cannot initialize user switch:', error);
    }
  }

  // 获取当前用户 token（供其他模块使用）
  function getCurrentUserToken() {
    return currentUser.token;
  }

  // 暴露接口
  window.userAuth = {
    getCurrentUserToken,
    withAuth: (options = {}) => {
      options.headers = options.headers || {};
      options.headers['X-Auth-Token'] = getCurrentUserToken();
      return options;
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUserSwitch);
  } else {
    // 如果脚本是后加载的（动态插入），DOMContentLoaded 可能已经触发了，这里直接初始化
    initUserSwitch();
  }

})();
