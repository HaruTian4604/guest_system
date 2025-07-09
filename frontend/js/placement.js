const btn_add = document.getElementById('btn_add');
const form_main = document.getElementById('form_main');
const table_main = document.getElementById('table_main');
const form_main_cancel = document.getElementById('form_main_cancel');
const e_pager = document.getElementById('pager');
const form_search = document.getElementById('form_search');
const input_search = document.getElementById('input_search');
const guest_select = document.getElementById('guest_id');
const host_select = document.getElementById('host_id');
const accommodation_select = document.getElementById('accommodation_id');
const status_select = document.getElementById('status');

const limit = 8;
let rows, total, pager, list_args = { limit };

let state = {
  table_listening: false,
  guests_loaded: false,
  hosts_loaded: false,
  accommodations_loaded: false
};

boot();

async function boot() {
  listen();
  await load_guests();
  await load_hosts();
  await load_accommodations();
  await list_and_render();
  pager = await render_pager(e_pager, {
    total,
    limit,
    on_change(page) {
      list_args.page = page;
      list_and_render();
    },
  });
}

async function load_guests() {
  if (state.guests_loaded) return;

  try {
    const r = await api('guest/list', { limit: 1000 });
    if (r.ok && r.data && r.data.length) {
      guest_select.innerHTML = '<option value="">Select a guest...</option>';
      r.data.forEach(guest => {
        const option = document.createElement('option');
        option.value = guest.id;
        option.textContent = guest.full_name;
        guest_select.appendChild(option);
      });
      state.guests_loaded = true;
    }
  } catch (error) {
    console.error('Failed to load guests:', error);
    yo_error('Failed to load guests list');
  }
}

async function load_hosts() {
  if (state.hosts_loaded) return;

  try {
    const r = await api('host/list', { limit: 1000 });
    if (r.ok && r.data && r.data.length) {
      host_select.innerHTML = '<option value="">Select a host...</option>';
      r.data.forEach(host => {
        const option = document.createElement('option');
        option.value = host.id;
        option.textContent = host.full_name;
        host_select.appendChild(option);
      });
      state.hosts_loaded = true;
    }
  } catch (error) {
    console.error('Failed to load hosts:', error);
    yo_error('Failed to load hosts list');
  }
}

async function load_accommodations() {
  if (state.accommodations_loaded) return;

  try {
    const r = await api('accommodation/list', { limit: 1000 });
    if (r.ok && r.data && r.data.length) {
      accommodation_select.innerHTML = '<option value="">Select an accommodation...</option>';
      r.data.forEach(acc => {
        const option = document.createElement('option');
        option.value = acc.id;
        option.textContent = `${acc.address} (${acc.postcode})`;
        accommodation_select.appendChild(option);
      });
      state.accommodations_loaded = true;
    }
  } catch (error) {
    console.error('Failed to load accommodations:', error);
    yo_error('Failed to load accommodations list');
  }
}

async function list_and_render() {
  try {
    const r = await admin.list('placement', list_args);
    if (r && r.data) {
      rows = r.data;
      total = r.total;
      await render_table(rows);
    }
  } catch (error) {
    console.error('Error loading placements:', error);
    yo_error('Failed to load placements');
  }
}

function render_table(list) {
  const e_tbody = table_main.tBodies[0];
  e_tbody.innerHTML = '';

  if (!list || list.length === 0) {
    e_tbody.innerHTML = `<tr><td colspan="8" class="text-center">No placements found</td></tr>`;
    return;
  }

  for (let it of list) {
    const tr = document.createElement('tr');
    tr.dataset.id = it.id;

    // Determine status badge class
    let statusClass, statusText;
    if (it.status === 'active') {
      statusClass = 'badge-active';
      statusText = 'Active';
    } else {
      statusClass = 'badge-completed';
      statusText = 'Completed';
    }

    tr.innerHTML = `
      <td>${it.id}</td>
      <td>${it.guest_full_name || '-'}</td>
      <td>${it.host_full_name || '-'}</td>
      <td>${it.accommodation_address || '-'}</td>
      <td>${it.start_date || '-'}</td>
      <td>${it.end_date || '-'}</td>
      <td><span class="badge ${statusClass}">${statusText}</span></td>
      <td>
        <div class="op btn-group">
          <button type="button" class="op_update btn btn-secondary btn-sm">Update</button>
          <button type="button" class="op_delete btn btn-danger btn-sm">Delete</button>
        </div>
      </td>
    `;
    e_tbody.appendChild(tr);
  }

  if (!state.table_listening) {
    state.table_listening = true;
    e_tbody.addEventListener('click', async e => {
      const op = e.target.closest('.op');
      const tr = e.target.closest('tr');
      if (!tr) return;

      const id = tr.dataset.id;

      if (op) {
        if (e.target.classList.contains('op_update')) {
          show_form(form_main);
          const row = admin.find(id);
          admin.value2form(row);

          // Set dropdown values
          if (row.guest_id) guest_select.value = row.guest_id;
          if (row.host_id) host_select.value = row.host_id;
          if (row.accommodation_id) accommodation_select.value = row.accommodation_id;
          if (row.status) status_select.value = row.status;
        }

        if (e.target.classList.contains('op_delete')) {
          if (!confirm('Are you sure you want to delete this placement?')) return;

          const r = await api('placement/delete', { id });
          if (r.ok) {
            await list_and_render();
            yo_success('Placement deleted successfully');
          }
        }
      }
    });
  }
}

function show_form(form) {
  form.hidden = false;
}

function hide_form(form) {
  form.hidden = true;
}

function reset_form(form) {
  form.reset();
  guest_select.value = '';
  host_select.value = '';
  accommodation_select.value = '';
  status_select.value = '';
}

function listen() {
  btn_add.addEventListener('click', e => {
    show_form(form_main);
    reset_form(form_main);
  });

  form_main_cancel.addEventListener('click', e => {
    hide_form(form_main);
  });

  form_main.addEventListener('submit', async e => {
    e.preventDefault();
    const row = admin.form2value(form_main);
    let action = row.id ? 'update' : 'create';

    // Validate required fields
    if (!row.guest_id || !row.host_id || !row.accommodation_id || !row.start_date || !row.status) {
      yo_error('Please fill all required fields');
      return;
    }

    // Validate date format (DD-MM-YYYY)
    if (!validateDate(row.start_date) || (row.end_date && !validateDate(row.end_date))) {
      yo_error('Please enter valid dates in DD-MM-YYYY format');
      return;
    }

    try {
      const r = await api(`placement/${action}`, row);
      if (r.ok) {
        await list_and_render();
        reset_form(form_main);
        hide_form(form_main);
        yo_success(`Placement ${action === 'create' ? 'created' : 'updated'} successfully`);
      }
    } catch (error) {
      yo_error(`Failed to ${action} placement: ${error.message}`);
    }
  });

  e_pager.addEventListener('click', e => {
    const btn = e.target.closest('.page-item');
    if (!btn) return;

    const page = btn.dataset.page;

    if (page) {
      pager.go(page);
    } else {
      if (btn.classList.contains('previous')) {
        pager.prev();
      }

      if (btn.classList.contains('next')) {
        pager.next();
      }
    }

    highlight_current_page(pager);
  });

  form_search.addEventListener('submit', async e => {
    e.preventDefault();
    const value = input_search.value.trim();
    list_args.keyword = value;
    await list_and_render();
  });
}

function validateDate(date) {
  // Validate DD-MM-YYYY format
  const regex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
  return regex.test(date);
}
