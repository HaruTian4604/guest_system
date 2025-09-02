const btn_add = document.getElementById('btn_add')
const form_main = document.getElementById('form_main')
const input_search = document.getElementById('input_search')
const form_search = document.getElementById('form_search')
const table_main = document.getElementById('table_main')
const form_main_cancel = document.getElementById('form_main_cancel')
const e_pager = document.getElementById('pager')
const status_select = document.getElementById('status')

const limit = 10
let rows, total, pager, list_args = { limit }

let state = {
  table_listening: false,
}

boot()

async function boot() {
  listen();
  await list_and_render();
  pager = await render_pager(e_pager, {
    total,
    limit,
    on_change(page) {
      list_args.page = page
      list_and_render()
    },
  });
  attach_pager_events(e_pager, pager);
}

async function list_and_render() {
  try {
    const r = await admin.list('guest', {
      ...list_args,
      page: list_args.page || 1,
      limit: list_args.limit || limit
    });
    //  console.log('API responds:', r); // debug log
    if (r && r.data) {
      rows = r.data;
      total = r.total;
      await render_table(rows);
    }
  } catch (error) {
    console.error('Failed to load guests:', error);
    yo_error('Failed to load guests');
  }
}

// function render_table(list) {
//   const e_tbody = table_main.tBodies[0]
//   e_tbody.innerHTML = ''

//   if (!list || list.length === 0) {
//     e_tbody.innerHTML = `<tr><td colspan="6" class="text-center">No guests found</td></tr>`
//     return
//   }

//   for (let it of list) {
//     const tr = document.createElement('tr')
//     tr.dataset.id = it.id
//     const dob = it.date_of_birth || ''
//     const age = Details.calculateAge(dob);

//     tr.innerHTML = `
//       <td>${it.id}</td>
//       <td><a href="guest-detail.html?id=${it.id}">${it.full_name || '-'}</a></td>
//       <td>${dob || '-'}</td>
//       <td>${age || '-'}</td>
//       <td><span class="badge ${it.status === 'placed' ? 'badge-success' : 'badge-warning'}">${it.status}</span></td>
//       <td>
//         <div class="op btn-group">
//           <button type="button" class="op_update btn btn-secondary btn-sm">Update</button>
//           <button type="button" class="op_delete btn btn-danger btn-sm">Delete</button>
//         </div>
//       </td>
//     `
//     e_tbody.appendChild(tr)
//   }

//   if (!state.table_listening) {
//     state.table_listening = true
//     e_tbody.addEventListener('click', async e => {
//       const op = e.target.closest('.op')
//       const tr = e.target.closest('tr')
//       if (!tr) return

//       const id = tr.dataset.id

//       if (op) {
//         if (e.target.classList.contains('op_update')) {
//           show_form(form_main)
//           const row = admin.find(id)
//           admin.value2form(row)
//         }

//         if (e.target.classList.contains('op_delete')) {
//           if (!confirm('Are you sure you want to delete this guest?')) return

//           const r = await api('guest/delete', { id })
//           if (r.ok) {
//             await list_and_render()
//             yo_success('Guest deleted successfully')
//           } else {
//             // yo_error(r.error)
//             if (r.error.includes('foreign key constraint')) {
//               const regex = /foreign key constraint fails \(`([\w]+)`\.`([\w]+)`, CONSTRAINT `([\w]+)`/;
//               const match = r.error.match(regex);

//               if (match && match[2] && match[1]) {
//                 const table = match[2]; // `placements`
//                 // const constraint = match[3]; // `placements_ibfk_1`
//                 yo_error(`Cannot delete the guest. Because it is linked to a [${table}] record. Please handle that then try again.`);
//               } else {
//                 yo_error('Cannot delete the guest due to foreign key constraint.');
//               }
//             } else if (r.error.includes('not found')) {
//               yo_error('The guest record does not exist.');
//             } else if (r.error.includes('incorrect integer value')) {
//               yo_error('Invalid guest ID. Please try again.');
//             } else if (r.error.includes('permission denied')) {
//               yo_error('You do not have permission to delete this guest.');
//             } else if (r.error.includes('deadlock')) {
//               yo_error('A conflict occurred while processing your request. Please try again later.');
//             } else {
//               yo_error(`Error: ${r.error}`); // Default error handling
//             }
//           }
//         }
//       }
//     })
//   }
// }
function render_table(list) {
  const e_tbody = table_main.tBodies[0];
  e_tbody.innerHTML = '';

  if (!list || list.length === 0) {
    e_tbody.innerHTML = `<tr><td colspan="6" class="text-center">No guests found</td></tr>`;
    return;
  }

  admin.list2table({
    table: table_main,
    rows: list,
    columns: [
      { field: 'id' },
      { type: 'link', href: 'guest-detail.html?id={id}', text: '{full_name}' },
      { field: 'date_of_birth', type: 'date' },
      {
        // 年龄列
        render: (it) => `<td>${Details.calculateAge(it.date_of_birth) ?? '-'}</td>`
      },
      { field: 'status', type: 'status' },
      {
        // 操作列
        render: () => `
          <div class="op btn-group">
            <button type="button" class="op_update btn btn-secondary btn-sm">Update</button>
            <button type="button" class="op_delete btn btn-danger btn-sm">Delete</button>
          </div>`
      },
    ],
  });

  // 事件绑定（一次）
  if (!state.table_listening) {
    state.table_listening = true;
    e_tbody.addEventListener('click', async (e) => {
      // 放行链接点击（跳转到详情）
      if (e.target.closest('a')) return;

      const tr = e.target.closest('tr');
      if (!tr) return;
      const id = tr.dataset.id;

      const op = e.target.closest('.op');
      if (!op) return;

      if (e.target.classList.contains('op_update')) {
        show_form(form_main);
        const row = admin.findIn(rows, id); // ✅ 不再依赖 admin.find
        admin.value2form(row);
      }

      if (e.target.classList.contains('op_delete')) {
        if (!confirm('Are you sure you want to delete this guest?')) return;
        const r = await api('guest/delete', { id });
        if (r.ok) {
          await list_and_render();
          yo_success('Guest deleted successfully');
        } else {
          yo_error(r.error || 'Delete failed');
        }
      }
    });
  }
}

function show_form(form) {
  form.hidden = false
}

function hide_form(form) {
  form.hidden = true
}

function reset_form(form) {
  form.reset()
}

function listen() {
  btn_add.addEventListener('click', e => {
    show_form(form_main)
    reset_form(form_main)
  })

  form_main_cancel.addEventListener('click', e => {
    hide_form(form_main)
  })

  form_main.addEventListener('submit', async e => {
    e.preventDefault()
    const row = admin.form2value(form_main)
    let action = row.id ? 'update' : 'create'

    // Validate required fields
    if (!row.full_name || !row.date_of_birth) {
      yo_error('Please fill all required fields')
      return
    }

    // 姓名校验：不得含数字，长度≤64
    if (!validateName(row.full_name)) {
      yo_error('Full name cannot contain digits and must be ≤ 64 characters')
      return
    }

    // 日期校验：格式正确 & 不晚于今天（或按你的需要改为不早于今天）
    if (!validateDob(row.date_of_birth)) {
      yo_error('Please enter a valid date (YYYY-MM-DD) that is not later than today')
      return
    }

    try {
      const r = await api(`guest/${action}`, row)
      if (r.ok) {
        await list_and_render()
        reset_form(form_main)
        hide_form(form_main)
        yo_success(`Guest ${action === 'create' ? 'created' : 'updated'} successfully`)
      }
    } catch (error) {
      yo_error(`Failed to ${action} guest: ${error.message}`)
    }


  })

  form_search.addEventListener('submit', async e => {
    e.preventDefault()
    const value = input_search.value.trim()
    list_args.keyword = value
    await list_and_render()
  })
}

// function validateDob(dob) {
//   // YYYY-MM-DD（MySQL DATE）
//   const m = dob.match(/^(\d{4})-(\d{2})-(\d{2})$/);
//   if (!m) return false;
//   const y = +m[1], mo = +m[2], d = +m[3];
//   const dt = new Date(y, mo - 1, d);
//   // 简单合法性检查（防 2025-02-31 这种）
//   return dt.getFullYear() === y && (dt.getMonth() + 1) === mo && dt.getDate() === d;
// }
function validateDob(dob) {
  // YYYY-MM-DD（MySQL DATE）
  if (typeof dob !== 'string') return false;
  const m = dob.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return false;

  const y = +m[1], mo = +m[2], d = +m[3];
  const dt = new Date(y, mo - 1, d);

  // 基本有效性（防 2025-02-31 这种）
  const valid = dt.getFullYear() === y && (dt.getMonth() + 1) === mo && dt.getDate() === d;
  if (!valid) return false;

  // 与“今天”比较（零点对齐，避免时区影响）
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dt.setHours(0, 0, 0, 0);

  // 通常生日不得晚于今天：dt <= today
  // 如果你真的想“不能早于今天”（即必须 >= 今天），把 <= 改成 >=
  return dt.getTime() <= today.getTime();
}

function validateName(name) {
  if (name == null) return false;
  const s = String(name).trim();
  if (!s || s.length > 64) return false;   // 长度 <= 64
  if (/\d/.test(s)) return false;          // 不允许任何数字
  // 如需更严格字符集，可用：/^[\p{L} .'-]{1,64}$/u
  return true;
}
