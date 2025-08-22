(function () {
    const $ = (sel, ctx = document) => sel instanceof Element ? sel : ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
    // 只有当前页面是日志页面时才执行
    if (!window.location.pathname.includes('log.html')) return;

    const input_search = document.getElementById('input_search');
    const form_search = document.getElementById('form_search');
    const table_main = document.getElementById('table_main');
    const e_pager = document.getElementById('pager');

    const limit = 10;
    let rows, total, pager, list_args = { limit };

    let state = {
        table_listening: false,
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
            const r = await admin.list('log', {
                ...list_args,
                page: list_args.page || 1,
                limit: list_args.limit || limit
            });

            if (r && r.data) {
                rows = r.data;
                total = r.total;
                render_table(rows);
            }
        } catch (error) {
            console.error('Failed to load logs:', error);
            yo_error('Failed to load logs');
        }
    }

    function render_table(list) {
        const e_tbody = table_main.tBodies[0];
        e_tbody.innerHTML = '';

        if (!list || list.length === 0) {
            e_tbody.innerHTML = `<tr><td colspan="6" class="text-center">No logs found</td></tr>`;
            return;
        }

        for (let it of list) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${it.id}</td>
                <td>${it.uk_formatted_date || it.operation_time}</td>
                <td>${it.table_name} #${it.record_id}</td>
                <td>${it.operator_name}</td>
                <td><span class="badge badge-${it.operation_type.toLowerCase()}">${it.operation_type}</span></td>
                <td>
                    <button type="button" class="btn btn-sm btn-info op-details" data-id="${it.id}">Details</button>
                </td>
            `;
            e_tbody.appendChild(tr);
        }

        if (!state.table_listening) {
            state.table_listening = true;
            e_tbody.addEventListener('click', async e => {
                if (e.target.classList.contains('op-details')) {
                    const id = e.target.dataset.id;
                    const log = rows.find(l => l.id == id);
                    if (log) {
                        // 使用更友好的方式展示详情
                        show_log_details(log);
                    }
                }
            });
        }
    }

// log.js -> show_log_details(log)
function show_log_details(log) {
  const modal = document.createElement('div');
  modal.className = 'modal fade';
  modal.innerHTML = `
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Log Details #${log.id}</h5>
          <button type="button" class="close" data-dismiss="modal">&times;</button>
        </div>
        <div class="modal-body">
          <pre>${JSON.stringify(log.changes, null, 2)}</pre>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const bsModal = new bootstrap.Modal(modal);
  bsModal.show();

  // ⭐ 监听关闭事件并移除节点（同样不用 jQuery）
  modal.addEventListener('hidden.bs.modal', () => {
    document.body.removeChild(modal);
  });
}


    function listen() {
        form_search.addEventListener('submit', async e => {
            e.preventDefault();
            const value = input_search.value.trim();
            list_args.keyword = value;
            await list_and_render();
        });
    }
})();

// 侧边栏按钮添加函数
function addLogButtonToSidebar() {
    const sidebars = document.querySelectorAll('.sidebar');

    sidebars.forEach(sidebar => {
        if (!sidebar.querySelector('#log_btn')) {
            const logBtn = document.createElement('a');
            logBtn.id = 'log_btn';
            logBtn.innerHTML = 'Operation Log';
            logBtn.href = 'log.html';
            logBtn.className = 'btn btn-outline-primary btn-block btn-sm';
            sidebar.appendChild(logBtn);
        }
    });
}

// 在DOM加载完成后调用
document.addEventListener('DOMContentLoaded', addLogButtonToSidebar);
