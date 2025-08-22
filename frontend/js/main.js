/**
 * list out data
 */
async function list(model, args) {
  return api(model + '/list', args)
}
// 安全的 query 序列化
function to_querystring(obj = {}) {
  return Object.entries(obj)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}
/**
 * use api interface
 * @param seg
 * @param args
 * @returns {Promise<void>}
 */
async function api(seg, args = {}) {
  try {
    const token = window.userAuth?.getCurrentUserToken();
    // console.log("api/token: ",token)
    const headers = {
      'X-Auth-Token': token || ''
    };
    // console.log("headers: ",headers)

    const qs = to_querystring(args);
    const url = `http://localhost:8080/api/${seg}${qs ? `?${qs}` : ''}`;

    const res = await fetch(url, { headers });
    let r = {};
    try {
      r = await res.json();
    } catch (_) { /* ignore */ }
    // console.log(r);
    if (r && typeof r.ok === 'boolean' && !r.ok) {
      if (!r.ok) {
        yo_error(`API error: ${r.error || 'Unknown error'}`, '');
      }
      return r; // 确保在成功和已知错误时都返回响应
    }

    return r;
  } catch (err) {
    yo_error(`Network error: ${err.message}`);
    // throw err;
    return { ok: false, error: err.message };
  }
}
/**
 * 通过id找到一条数据
 * @param id
 * @returns {*}
 */
function find(id) {
  return rows.find(it => it.id == id)
}

/**
 * 表单转数据 <form> --> {...}
 */
function form2value(form) {
  const inputs = form.querySelectorAll('[name]')
  const row = {}

  for (let it of inputs) {
    const key = it.name
    const value = it.value
    row[key] = value
  }

  return row
}

function value2form(row, form = form_main) {
  const requiredInput = ['id','full_name', 'date_of_birth', 'status'];

  for (let key of requiredInput) {
    if (row.hasOwnProperty(key)) {
      const input = form.querySelector(`[name="${key}"]`)
      if (input) {
        input.value = row[key]
      }
    }
  }
}
/**
 * {a: 1, b: 2} --> "a=1&b=2"
 */
function to_querystring(obj) {
  let r = ''

  for (let key in obj) {
    r += `${key}=${obj[key]}&`
  }

  return r.substring(0, r.length - 1)
}

/**
 * 表单开关
 */
function toggle_form(form) {
  form.hidden = !form.hidden
}

/**
 * 显示表单
 */
function show_form(form) {
  form.hidden = false
}

/**
 * 隐藏表单
 */
function hide_form(form) {
  form.hidden = true
}

/**
 * 重置表单
 */
function reset_form(form) {
  form.reset()
}

/**
 * 渲染页码
 */
function render_pager(el, opt) {
  const pager = new Pager(opt)
  let partial = ''

  for (let i = 1; i <= pager.max; i++) {
    partial += `<li data-page="${i}" class="page-item"><button class="page-link">${i}</button></li>`
  }

  const html = `<ul class="pagination">
      <li class="page-item previous"><button class="page-link" href="#">Previous</button></li>
      ${partial}
      <li class="page-item next"><button class="page-link" href="#">Next</button></li>
    </ul>`

  el.innerHTML = html
  highlight_current_page(pager)
  return pager
}

/**
 * 高亮当前页码
 */
function highlight_current_page(pager) {
  const current = pager.current
  const btns = document.querySelectorAll(`[data-page]`)
  for (let it of btns) {
    if (it.dataset.page == current) {
      it.classList.add('active')
    } else {
      it.classList.remove('active')
    }
  }
}

function attach_pager_events(containerEl, pager) {
  containerEl.addEventListener('click', e => {
    const btn = e.target.closest('.page-item');
    if (!btn) return;

    const page = btn.dataset.page;

    if (page) {
      pager.go(page);
    } else {
      if (btn.classList.contains('previous')) pager.prev();
      if (btn.classList.contains('next')) pager.next();
    }

    highlight_current_page(pager);
  });
}

window.attach_pager_events = attach_pager_events; // 导出给页面用

window.api = api

window.admin = {
  list,
  find,
  form2value,
  value2form,
  to_querystring,
  toggle_form,
}
