//frontend/js/common/main.js
async function list(model, args) {
  return api(model + '/list', args)
}
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
      return r;
    }

    return r;
  } catch (err) {
    yo_error(`Network error: ${err.message}`);
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

function value2form(row, form) {
  if (!form) throw new Error('value2form: form element required');
  const fields = form.querySelectorAll('[name]');

  for (const el of fields) {
    const key = el.name;
    if (!(key in row)) continue;

    let val = row[key];
    if (val == null) {
      if (el.type === 'checkbox') el.checked = false;
      else el.value = '';
      continue;
    }

    const asStr = (v) => v == null ? '' : String(v);

    if (el.tagName === 'SELECT') {
      el.value = asStr(val);
      continue;
    }

    if (el.type === 'date') {
      let s = asStr(val);
      if (/^\d{4}-\d{2}-\d{2}T/.test(s)) s = s.slice(0, 10);   // ISO -> YYYY-MM-DD
      else if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        const d = new Date(s);
        if (!isNaN(d)) {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          s = `${y}-${m}-${dd}`;
        }
      }
      el.value = s;
      continue;
    }

    if (el.type === 'checkbox') {
      el.checked = (val === true || val === 1 || val === '1' || val === 'true');
      continue;
    }

    el.value = asStr(val);
  }
}

function list2table({ table, rows, columns }) {
  const tbody = table.tBodies[0] || table.createTBody();
  tbody.innerHTML = '';

  const fmtYMD = (v) => {
    if (!v) return '-';
    if (window.Details && typeof Details.formatYMD === 'function') return Details.formatYMD(v);
    const s = String(v);
    if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const d = new Date(s);
    if (isNaN(d)) return s;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  const badgeHtml = (status) => {
    if (!status) return '-';
    const v = String(status).toLowerCase();
    let klass = 'badge-secondary';
    if (v === 'active' || v === 'available' || v === 'placed') klass = 'badge-success';
    else if (v === 'upcoming') klass = 'badge-info';
    else if (v === 'unplaced' || v === 'unavailable') klass = 'badge-warning';
    return `<span class="badge ${klass}">${v}</span>`;
  };

  const tpl = (template, row) =>
    String(template).replace(/\{(\w+)\}/g, (_, k) => row[k] ?? '');

  for (const it of rows || []) {
    const tr = document.createElement('tr');

    for (const col of columns) {
      const td = document.createElement('td');

      if (typeof col.render === 'function') {
        td.innerHTML = col.render(it);
        tr.appendChild(td);
        continue;
      }

      const type = col.type || 'text';

      if (type === 'link') {
        const href = tpl(col.href || '#', it);
        const text = tpl(col.text || `{${col.field || 'id'}}`, it);
        td.innerHTML = `<a class="link-id" href="${href}" title="${text}">${text}</a>`;
        tr.appendChild(td);
        continue;
      }

      let val = col.field ? it[col.field] : '';

      if (val == null || val === '') {
        td.textContent = '-';
        tr.appendChild(td);
        continue;
      }

      if (type === 'date') {
        td.textContent = fmtYMD(val);
      } else if (type === 'status') {
        td.innerHTML = badgeHtml(val);
      } else {
        td.textContent = String(val);
      }

      tr.appendChild(td);
    }

    tr.dataset.id = it.id;
    tbody.appendChild(tr);
  }
}

function findIn(list, id) {
  return (list || []).find(it => String(it.id) === String(id));
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

document.addEventListener('click', (e) => {
  const a = e.target && e.target.closest && e.target.closest('a.link-id');
  if (a) return;
}, true);

window.attach_pager_events = attach_pager_events;

window.api = api

window.admin = {
  list,
  find,
  findIn,
  form2value,
  value2form,
  list2table,
  to_querystring,
  toggle_form,
}
