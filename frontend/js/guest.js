const btn_add = document.getElementById('btn_add')
const form_main = document.getElementById('form_main')
const input_search = document.getElementById('input_search')
const form_search = document.getElementById('form_search')
const table_main = document.getElementById('table_main')
const form_main_cancel = document.getElementById('form_main_cancel')
const e_pager = document.getElementById('pager')
const status_select = document.getElementById('status')

const limit = 5
let rows, total, pager, list_args = { limit }

let state = {
  table_listening: false,
}

boot()

async function boot() {
  listen()
  await list_and_render()
  pager = await render_pager(e_pager, {
    total,
    limit,
    on_change(page) {
      list_args.page = page
      list_and_render()
    },
  })
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
    console.error('Error loading guests:', error);
    yo_error('Failed to load guests');
  }
}

function render_table(list) {
  const e_tbody = table_main.tBodies[0]
  e_tbody.innerHTML = ''

  if (!list || list.length === 0) {
    e_tbody.innerHTML = `<tr><td colspan="6" class="text-center">No guests found</td></tr>`
    return
  }

  for (let it of list) {
    const tr = document.createElement('tr')
    tr.dataset.id = it.id
    const dob = it.date_of_birth || ''
    const age = calculateAge(dob)

    tr.innerHTML = `
      <td>${it.id}</td>
      <td>${it.full_name || '-'}</td>
      <td>${dob || '-'}</td>
      <td>${age || '-'}</td>
      <td><span class="badge ${it.status === 'placed' ? 'badge-success' : 'badge-warning'}">${it.status}</span></td>
      <td>
        <div class="op btn-group">
          <button type="button" class="op_update btn btn-secondary btn-sm">Update</button>
          <button type="button" class="op_archive btn btn-outline-secondary btn-sm">Archive</button>
        </div>
      </td>
    `
    e_tbody.appendChild(tr)
  }

  if (!state.table_listening) {
    state.table_listening = true
    e_tbody.addEventListener('click', async e => {
      const op = e.target.closest('.op')
      const tr = e.target.closest('tr')
      if (!tr) return

      const id = tr.dataset.id

      if (op) {
        if (e.target.classList.contains('op_update')) {
          show_form(form_main)
          const row = admin.find(id)
          admin.value2form(row)
        }

 if (e.target.classList.contains('op_archive')) {
        if (!confirm('Are you sure you want to archive this guest?')) return;

        try {
            const r = await api('guest/archive', { id });
            if (r.ok) {
                await list_and_render();
                yo_success('Guest archived successfully');
            } else {
                yo_error(r.error || 'Failed to archive guest');
            }
        } catch (error) {
            yo_error(`Delete failed: ${error.message}`);
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
  if (status_select) status_select.value = ''
}

function calculateAge(dob) {
  if (!dob) return null

  try {
    // Parse DD-MM-YYYY format
    const [day, month, year] = dob.split('-').map(Number)
    const birthDate = new Date(year, month - 1, day)
    const today = new Date()

    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  } catch (e) {
    console.error('Error calculating age:', e)
    return null
  }
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
    if (!row.full_name || !row.date_of_birth || !row.status) {
      yo_error('Please fill all required fields')
      return
    }

    // Validate date format (DD-MM-YYYY)
    if (!validateDob(row.date_of_birth)) {
      yo_error('Please enter a valid date in DD-MM-YYYY format')
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

  e_pager.addEventListener('click', e => {
    const btn = e.target.closest('.page-item')
    if (!btn) return

    const page = btn.dataset.page

    if (page) {
      pager.go(page)
    } else {
      if (btn.classList.contains('previous')) {
        pager.prev()
      }

      if (btn.classList.contains('next')) {
        pager.next()
      }
    }

    highlight_current_page(pager)
  })

  form_search.addEventListener('submit', async e => {
    e.preventDefault()
    const value = input_search.value.trim()
    list_args.keyword = value
    await list_and_render()
  })
}

function validateDob(dob) {
  // Validate DD-MM-YYYY format
  const regex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/
  return regex.test(dob)
}
