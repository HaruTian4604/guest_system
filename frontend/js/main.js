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
// async function api(seg, args) {
//   const res = await fetch(`http://localhost:8080/api/${seg}?${to_querystring(args)}`)
//   const r = await res.json()
//   if (!r.ok) { yo_error(`Something is wrong: ${r.message}`,r.message) }
//   console.log(res)
//   return r
// }
async function api(seg, args = {}) {
  try {
    const qs = to_querystring(args);
    const url = `http://localhost:8080/api/${seg}${qs ? `?${qs}` : ''}`;

    const res = await fetch(url);
    // 防御：有些接口可能没有 JSON（虽少见）
    let r = {};
    try { r = await res.json(); } catch (_) { /* ignore */ }

    // 只有当服务端明确给了 ok:false 才提示错误
    if (r && typeof r.ok === 'boolean' && !r.ok) {
      yo_error(`Something is wrong: ${r.message || 'Unknown error'}`, r.message);
    }
    return r;
  } catch (err) {
    yo_error(`Network error: ${err.message}`);
    throw err;
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

/**
 * 数据转表单 <form> <-- {...}
 */
function value2form(row, form = form_main) {
  for (let key in row) {
    const value = row[key]
    const input = form.querySelector(`[name="${key}"]`)
    input.value = value
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

window.api = api

window.admin = {
  list,
  find,
  form2value,
  value2form,
  to_querystring,
  toggle_form,
}
