// accommodation.js - Accommodation Management Logic

const btn_add = document.getElementById('btn_add')
const form_main = document.getElementById('form_main')
const input_search = document.getElementById('input_search')
const form_search = document.getElementById('form_search')
const table_main = document.getElementById('table_main')
const form_main_cancel = document.getElementById('form_main_cancel')
const e_pager = document.getElementById('pager')
const hostSelect = document.getElementById('host_id')
// const statusSelect = document.getElementById('status')

const limit = 10
let rows, total, pager, list_args = { limit }

let state = {
  table_listening: false,
}

boot()

async function boot() {
  listen();
  await loadHostOptions();
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

async function loadHostOptions() {
  try {
    // Load all hosts
    const hosts = await admin.list('host', { limit: 1000 });
    if (hosts.ok && hosts.data) {
      hostSelect.innerHTML = '<option value="">Select host...</option>';
      hosts.data.forEach(host => {
        const option = document.createElement('option');
        option.value = host.id;
        option.textContent = host.full_name;
        hostSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Failed to load hosts:', error);
  }
}

async function list_and_render() {
  try {
    const r = await admin.list('accommodation', {
      ...list_args,
      page: list_args.page || 1,
      limit: list_args.limit || limit
    });

    if (r && r.data) {
      rows = r.data;
      total = r.total;
      await render_table(rows);
    }
  } catch (error) {
    console.error('Failed to load accommodations:', error);
    yo_error('Failed to load accommodations');
  }
}

// function render_table(list) {
//   const e_tbody = table_main.tBodies[0]
//   e_tbody.innerHTML = ''

//   if (!list || list.length === 0) {
//     e_tbody.innerHTML = `<tr><td colspan="6" class="text-center">No accommodations found</td></tr>`
//     return
//   }

//   for (let it of list) {
//     const tr = document.createElement('tr')
//     tr.dataset.id = it.id

//     tr.innerHTML = `
//       <td>${it.id}</td>
//       <td><a href="accommodation-detail.html?id=${it.id}">${it.address || '-'}</a></td>
//       <td>${it.postcode || '-'}</td>
//       <td><a href="host-detail.html?id=${it.host_id}">${it.host_name || '-'}</a></td>
//       <td><span class="badge ${it.status === 'available' ? 'badge-success' : 'badge-warning'}">${it.status}</span></td>
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
//           await loadHostOptions(); // Reload options
//         }

//         if (e.target.classList.contains('op_delete')) {
//           if (!confirm('Are you sure you want to delete this accommodation?')) return

//           const r = await api('accommodation/delete', { id })
//           if (r.ok) {
//             await list_and_render()
//             yo_success('Accommodation deleted successfully')
//           } else {
//             if (r.error.includes('foreign key constraint')) {
//               const regex = /foreign key constraint fails \(`([\w]+)`\.`([\w]+)`, CONSTRAINT `([\w]+)`/;
//               const match = r.error.match(regex);

//               if (match && match[2] && match[1]) {
//                 const table = match[2]; // e.g., `placements`
//                 yo_error(`Cannot delete the accommodation. Because it is linked to a [${table}] record. Please handle that then try again.`);
//               } else {
//                 yo_error('Cannot delete the accommodation due to foreign key constraint.');
//               }
//             } else {
//               yo_error(`Error: ${r.error}`);
//             }
//           }
//         }
//       }
//     })
//   }
// }
function render_table(list) {
  const e_tbody = table_main.tBodies[0]
  e_tbody.innerHTML = ''

  if (!list || list.length === 0) {
    e_tbody.innerHTML = `<tr><td colspan="6" class="text-center">No accommodations found</td></tr>`
    return
  }

  admin.list2table({
    table: table_main,
    rows: list,
    columns: [
      { field: 'id' },
      { type: 'link', href: 'accommodation-detail.html?id={id}', text: '{address}' },
      { field: 'postcode' },
      { type: 'link', href: 'host-detail.html?id={host_id}', text: '{host_name}' },
      { field: 'status', type: 'status' },
      {
        render: () => `
          <div class="op btn-group">
            <button type="button" class="op_update btn btn-secondary btn-sm">Update</button>
            <button type="button" class="op_delete btn btn-danger btn-sm">Delete</button>
          </div>`
      },
    ],
  });

  if (!state.table_listening) {
    state.table_listening = true
    e_tbody.addEventListener('click', async e => {
      if (e.target.closest('a')) return; // 放行链接
      const op = e.target.closest('.op')
      const tr = e.target.closest('tr')
      if (!tr) return
      const id = tr.dataset.id

      if (op) {
        if (e.target.classList.contains('op_update')) {
          show_form(form_main)
          const row = admin.findIn(rows, id)   // ← 这里改了
          admin.value2form(row)
          await loadHostOptions();
        }

        if (e.target.classList.contains('op_delete')) {
          if (!confirm('Are you sure you want to delete this accommodation?')) return
          const r = await api('accommodation/delete', { id })
          if (r.ok) {
            await list_and_render()
            yo_success('Accommodation deleted successfully')
          } else {
            if (r.error.includes('foreign key constraint')) {
              const regex = /foreign key constraint fails \(`([\w]+)`\.`([\w]+)`, CONSTRAINT `([\w]+)`/;
              const match = r.error.match(regex);
              if (match && match[2] && match[1]) {
                const table = match[2];
                yo_error(`Cannot delete the accommodation. Because it is linked to a [${table}] record. Please handle that then try again.`);
              } else {
                yo_error('Cannot delete the accommodation due to foreign key constraint.');
              }
            } else {
              yo_error(`Error: ${r.error}`);
            }
          }
        }
      }
    })
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
  // if (statusSelect) statusSelect.value = ''
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
    // if (!row.address || !row.postcode || !row.host_id || !row.status) {
    if (!row.address || !row.postcode || !row.host_id) {
      yo_error('Please fill all required fields')
      return
    }

    // Validate postcode format (basic UK validation)
    if (!validatePostcode(row.postcode)) {
      yo_error('Please enter a valid UK postcode')
      return
    }

    try {
      const r = await api(`accommodation/${action}`, row)
      if (r.ok) {
        await list_and_render()
        reset_form(form_main)
        hide_form(form_main)
        yo_success(`Accommodation ${action === 'create' ? 'created' : 'updated'} successfully`)
      }
    } catch (error) {
      yo_error(`Failed to ${action} accommodation: ${error.message}`)
    }
  })

  form_search.addEventListener('submit', async e => {
    e.preventDefault()
    const value = input_search.value.trim()
    list_args.keyword = value
    await list_and_render()
  })
}

function validatePostcode(postcode) {
  // Basic UK postcode validation
  const regex = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i
  return regex.test(postcode)
}
