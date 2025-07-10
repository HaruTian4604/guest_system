const btn_add = document.getElementById('btn_add')
const form_main = document.getElementById('form_main')
const table_main = document.getElementById('table_main')
const form_main_cancel = document.getElementById('form_main_cancel')
const e_pager = document.getElementById('pager')
const form_search = document.getElementById('form_search')
const input_search = document.getElementById('input_search')
const host_select = document.getElementById('host_id')
const status_select = document.getElementById('status')

const limit = 5
let rows, total, pager, list_args = { limit }

let state = {
  table_listening: false,
  hosts_loaded: false
}

boot()

async function boot() {
  listen()
  await load_hosts()
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

async function load_hosts() {
  if (state.hosts_loaded) return

  try {
    const r = await api('host/list', { limit: 100 })
    if (r.ok && r.data && r.data.length) {
      host_select.innerHTML = '<option value="">Select a host...</option>'
      r.data.forEach(host => {
        const option = document.createElement('option')
        option.value = host.id
        option.textContent = host.full_name
        host_select.appendChild(option)
      })
      state.hosts_loaded = true
    }
  } catch (error) {
    console.error('Failed to load hosts:', error)
    yo_error('Failed to load hosts list')
  }
}

async function list_and_render() {
  try {
    const r = await admin.list('accommodation', list_args)
    if (r && r.data) {
      rows = r.data
      total = r.total
      await render_table(rows)
    }
  } catch (error) {
    console.error('Error loading accommodations:', error)
    yo_error('Failed to load accommodations')
  }
}

function render_table(list) {
  const e_tbody = table_main.tBodies[0]
  e_tbody.innerHTML = ''

  if (!list || list.length === 0) {
    e_tbody.innerHTML = `<tr><td colspan="6" class="text-center">No accommodations found</td></tr>`
    return
  }

  for (let it of list) {
    const tr = document.createElement('tr')
    tr.dataset.id = it.id
    tr.innerHTML = `
      <td>${it.id}</td>
      <td>${it.address || '-'}</td>
      <td>${it.postcode || '-'}</td>
      <td>${it.host_full_name || 'Unknown'}</td>
      <td><span class="badge ${it.status === 'available' ? 'badge-success' : 'badge-secondary'}">${it.status}</span></td>
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
          if (!confirm('Are you sure you want to archive this accommodation?')) return

          const r = await api('accommodation/archive', { id })
          if (r.ok) {
            await list_and_render()
            yo_success('Accommodation archived successfully')
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
    if (!row.address || !row.postcode || !row.host_id || !row.status) {
      yo_error('Please fill all required fields')
      return
    }

    // Validate UK postcode format
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

function validatePostcode(postcode) {
  // Simple UK postcode validation
  const regex = /^[A-Za-z]{1,2}\d{1,2}[A-Za-z]?\s?\d[A-Za-z]{2}$/i
  return regex.test(postcode)
}
