const btn_add = document.getElementById('btn_add')
const form_main = document.getElementById('form_main')
const input_search = document.getElementById('input_search')
const form_search = document.getElementById('form_search')
const table_main = document.getElementById('table_main')
const form_main_cancel = document.getElementById('form_main_cancel')
const e_pager = document.getElementById('pager')
const guest_select = document.getElementById('guest_id')
const host_select = document.getElementById('host_id')
const accommodation_select = document.getElementById('accommodation_id')

const limit = 10
let rows, total, pager, list_args = { limit }

let state = {
  table_listening: false,
  guests: [],
  hosts: [],
  accommodations: []
}

boot()

async function boot() {
  await loadSelectOptions();
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

async function loadSelectOptions() {
  try {
    // Load guests
    const guestRes = await admin.list('guest', { limit: 1000 });
    if (guestRes.ok) {
      state.guests = guestRes.data;
      guest_select.innerHTML = '<option value="">Select guest...</option>' +
        state.guests.map(g => `<option value="${g.id}">${g.full_name}</option>`).join('');
    }

    // Load hosts
    const hostRes = await admin.list('host', { limit: 1000 });
    if (hostRes.ok) {
      state.hosts = hostRes.data;
      host_select.innerHTML = '<option value="">Select host...</option>' +
        state.hosts.map(h => `<option value="${h.id}">${h.full_name}</option>`).join('');
    }

    // Load accommodations
    const accommodationRes = await admin.list('accommodation', { limit: 1000 });
    if (accommodationRes.ok) {
      state.accommodations = accommodationRes.data;
      accommodation_select.innerHTML = '<option value="">Select accommodation...</option>' +
        state.accommodations.map(a => `<option value="${a.id}">${a.address} (${a.postcode})</option>`).join('');
    }
  } catch (error) {
    console.error('Failed to load options:', error);
  }
}

async function list_and_render() {
  try {
    const r = await admin.list('placement', {
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
    console.error('Failed to load placements:', error);
    yo_error('Failed to load placements');
  }
}

// function render_table(list) {
//   const e_tbody = table_main.tBodies[0]
//   e_tbody.innerHTML = ''

//   if (!list || list.length === 0) {
//     e_tbody.innerHTML = `<tr><td colspan="8" class="text-center">No placements found</td></tr>`
//     return
//   }

//   for (let it of list) {
//     const tr = document.createElement('tr')
//     tr.dataset.id = it.id

//     tr.innerHTML = `
//       <td><a class="link-id" href="placement-detail.html?id=${it.id}" title="Open placement detail">${it.id}</a></td>
//       <td><a href="guest-detail.html?id=${it.guest_id}">${it.guest_name || '-'}</a></td>
//       <td><a href="host-detail.html?id=${it.host_id}">${it.host_name || '-'}</a></td>
//       <td><a href="accommodation-detail.html?id=${it.accommodation_id}">${it.accommodation_address || '-'} ${it.accommodation_postcode || ''}</a></td>
//     <td>${it.start_date ? Details.formatYMD(it.start_date) : '-'}</td>
//     <td>${it.end_date ? Details.formatYMD(it.end_date) : '-'}</td>
//     <td>
//       <span class="badge ${it.status === 'active' ? 'badge-success'
//         : it.status === 'upcoming' ? 'badge-info'
//           : 'badge-secondary'
//       }">${it.status || '-'}</span>
//     </td>
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
//           if (!confirm('Are you sure you want to delete this placement?')) return

//           const r = await api('placement/delete', { id })
//           if (r.ok) {
//             await list_and_render()
//             yo_success('Placement deleted successfully')
//           } else {
//             if (r.error.includes('foreign key constraint')) {
//               yo_error('Cannot delete the placement due to linked records.');
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
    e_tbody.innerHTML = `<tr><td colspan="8" class="text-center">No placements found</td></tr>`
    return
  }

  admin.list2table({
    table: table_main,
    rows: list,
    columns: [
      { type: 'link', href: 'placement-detail.html?id={id}', text: '{id}' },
      { type: 'link', href: 'guest-detail.html?id={guest_id}', text: '{guest_name}' },
      { type: 'link', href: 'host-detail.html?id={host_id}', text: '{host_name}' },
      { type: 'link', href: 'accommodation-detail.html?id={accommodation_id}', text: '{accommodation_address} {accommodation_postcode}' },
      { field: 'start_date', type: 'date' },
      { field: 'end_date', type: 'date' },
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
          const row = admin.findIn(rows, id);
          admin.value2form(row, form_main);
        }

        if (e.target.classList.contains('op_delete')) {
          if (!confirm('Are you sure you want to delete this placement?')) return
          const r = await api('placement/delete', { id })
          if (r.ok) {
            await list_and_render()
            yo_success('Placement deleted successfully')
          } else {
            if (r.error.includes('foreign key constraint')) {
              yo_error('Cannot delete the placement due to linked records.');
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
  if (guest_select) guest_select.value = ''
  if (host_select) host_select.value = ''
  if (accommodation_select) accommodation_select.value = ''
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
    if (!row.guest_id || !row.host_id || !row.accommodation_id || !row.start_date) {
      yo_error('Please fill all required fields')
      return
    }

    if (row.end_date && row.end_date < row.start_date) {
      yo_error('End date cannot be earlier than start date')
      return
    }

    try {
      const r = await api(`placement/${action}`, row)
      if (r.ok) {
        await list_and_render()
        reset_form(form_main)
        hide_form(form_main)
        yo_success(`Placement ${action === 'create' ? 'created' : 'updated'} successfully`)
      } else {
        yo_error(r.error || `Failed to ${action} placement`)
      }
    } catch (error) {
      yo_error(`Failed to ${action} placement: ${error.message}`)
    }
  })

  form_search.addEventListener('submit', async e => {
    e.preventDefault()
    const value = input_search.value.trim()
    list_args.keyword = value
    await list_and_render()
  })
}
