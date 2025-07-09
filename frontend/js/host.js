const btn_add = document.getElementById('btn_add');
const form_main = document.getElementById('form_main');
const table_main = document.getElementById('table_main');
const form_main_cancel = document.getElementById('form_main_cancel');
const e_pager = document.getElementById('pager');
const form_search = document.getElementById('form_search');
const input_search = document.getElementById('input_search');

const limit = 8;
let rows, total, pager, list_args = { limit };

let state = {
  table_listening: false
};

boot();

async function boot() {
  listen();
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

async function list_and_render() {
  try {
    const r = await admin.list('host', list_args);
    if (r && r.data) {
      rows = r.data;
      total = r.total;
      await render_table(rows);
    }
  } catch (error) {
    console.error('Error loading hosts:', error);
    yo_error('Failed to load hosts');
  }
}

function render_table(list) {
  const e_tbody = table_main.tBodies[0];
  e_tbody.innerHTML = '';

  if (!list || list.length === 0) {
    e_tbody.innerHTML = `<tr><td colspan="3" class="text-center">No hosts found</td></tr>`;
    return;
  }

  for (let it of list) {
    const tr = document.createElement('tr');
    tr.dataset.id = it.id;
    tr.innerHTML = `
      <td>${it.id}</td>
      <td>${it.full_name || '-'}</td>
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
        }

        if (e.target.classList.contains('op_delete')) {
          if (!confirm('Are you sure you want to delete this host?')) return;

          const r = await api('host/delete', { id });
          if (r.ok) {
            await list_and_render();
            yo_success('Host deleted successfully');
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
    if (!row.full_name) {
      yo_error('Please enter the host name');
      return;
    }

    // Validate name format
    if (row.full_name.length < 2) {
      yo_error('Name must be at least 2 characters');
      return;
    }

    try {
      const r = await api(`host/${action}`, row);
      if (r.ok) {
        await list_and_render();
        reset_form(form_main);
        hide_form(form_main);
        yo_success(`Host ${action === 'create' ? 'created' : 'updated'} successfully`);
      }
    } catch (error) {
      yo_error(`Failed to ${action} host: ${error.message}`);
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

function validateName(name) {
  return name.length >= 2;
}
