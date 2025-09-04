// frontend/js/common/userswitch.js
(function () {
  const TWO_DEMO_USERS = [
    { name: 'iamadmin', token: '1415926' },
    { name: 'iamcaseworker', token: '5358979' },
  ];

  let currentUser = { token: '5358979' };

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

      if (user.token === currentUser.token) {
        radio.checked = true;
      }

      radio.addEventListener('change', () => switchUser(user.token));

      const label = document.createElement('label');
      label.className = 'btn btn-outline-primary';
      label.htmlFor = radioId;
      label.textContent = user.name;
      label.dataset.token = user.token;
      label.title = `user name: ${user.name}\nRole: ${user.roleName}\nToken: ${user.token}`;
      group.appendChild(radio);
      group.appendChild(label);
    })

    container.appendChild(group);
    return container;
  }

  async function switchUser(token) {
    try {
      const response = await api('user/find', { token });
      // console.log("switchUser response: ", response);
      // console.log("switchUser token: ", token);
      if (response && response.ok && response.user) {
        currentUser = {
          token: response.user.token,
          name: response.user.name,
          roleName: response.user.roleName,
        };

        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        yo_success(`Hello ${response.user.name}`);
      } else {
        yo_error('Failed to switch user: ' + (response?.error || 'Unknown error'));
      }
    } catch (error) {
      yo_error('Cannot switch user:', error);
    }
  }

  async function initUserSwitch() {
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        currentUser = JSON.parse(storedUser);
      }

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

      const slot = document.querySelector('#user-switch-slot') || document.querySelector('#topbar .navbar');
      if (slot && !slot.querySelector('.btn-group[role="group"]')) {
        createDemoUserSwitch(TWO_DEMO_USERS);
      }
    } catch (error) {
      yo_error('Cannot initialize user switch:', error);
    }
  }

  function getCurrentUserToken() {
    return currentUser.token;
  }

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
    initUserSwitch();
  }

})();
