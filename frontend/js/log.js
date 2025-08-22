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
        attach_pager_events(e_pager, pager);
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
                <td>
                    <span class="badge ${getBadgeClass(it.operation_type)}">${it.operation_type}</span>
                </td>
                <td>
                    <button type="button" class="btn btn-sm btn-outline-info op-details" data-id="${it.id}">Details</button>
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

    function getBadgeClass(type) {
        switch (type) {
            case 'CREATE':
                return 'bg-success';    // 绿色
            case 'UPDATE':
                return 'bg-warning text-dark'; // 黄色
            case 'DELETE':
                return 'bg-danger';     // 红色
            case 'STATUS_CHANGE':
                return 'bg-info';       // 蓝色
            case 'ARCHIVE':
                return 'bg-secondary';  // 灰色
            default:
                return 'bg-light text-dark'; // 默认
        }
    }
    function show_log_details(log) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');

        modal.innerHTML = `
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Log Details #${log.id}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <pre>${JSON.stringify(log.changes, null, 2)}</pre>
        </div>
      </div>
    </div>
  `;

        document.body.appendChild(modal);

        // 记录关闭后要恢复的“之前聚焦的元素”
        const previouslyFocused =
            document.activeElement instanceof HTMLElement ? document.activeElement : null;

        const bsModal = new bootstrap.Modal(modal, {
            backdrop: true,
            focus: true,   // 保持默认的可访问性行为
            keyboard: true
        });

        // 打开后，把焦点给关闭按钮（也可以省略）
        modal.addEventListener('shown.bs.modal', () => {
            const closeBtn = modal.querySelector('.btn-close');
            if (closeBtn instanceof HTMLElement) closeBtn.focus();
        });

        // 🔑 关键：开始隐藏时，先把焦点移出模态框，避免“aria-hidden 的祖先仍包含焦点”的告警
        modal.addEventListener('hide.bs.modal', () => {
            const ae = document.activeElement;
            if (ae instanceof HTMLElement && modal.contains(ae)) {
                ae.blur();                 // 先移除子孙元素上的焦点
                // 如需明确把焦点放到页面安全位置，可以选一个已存在的可聚焦元素：
                // previouslyFocused?.focus();
                // 或者放到导航/主容器上（若它们有 tabindex="-1"）
            }
        });

        // 完全隐藏后：销毁实例并移除节点；最后把焦点还给原先的元素（如果有）
        modal.addEventListener('hidden.bs.modal', () => {
            bsModal.dispose();
            document.body.removeChild(modal);
            if (previouslyFocused) {
                // 恢复到触发前的焦点位置，提升可访问性体验
                try { previouslyFocused.focus(); } catch { }
            }
        });

        bsModal.show();
    }


    // function show_log_details(log) {
    //     const modal = document.createElement('div');
    //     modal.className = 'modal fade';
    //     modal.setAttribute('tabindex', '-1');
    //     modal.setAttribute('role', 'dialog');
    //     modal.setAttribute('aria-modal', 'true');

    //     modal.innerHTML = `
    //         <div class="modal-dialog modal-lg">
    //         <div class="modal-content">
    //             <div class="modal-header">
    //             <h5 class="modal-title">Log Details #${log.id}</h5>
    //             <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    //             </div>
    //             <div class="modal-body">
    //             <pre>${JSON.stringify(log.changes, null, 2)}</pre>
    //             </div>
    //         </div>
    //         </div>
    //     `;

    //     document.body.appendChild(modal);

    //     const bsModal = new bootstrap.Modal(modal, {
    //         // 这些用默认即可；写出来更直观
    //         backdrop: true,
    //         focus: true,
    //         keyboard: true
    //     });

    //     bsModal.show();

    //     modal.addEventListener('hidden.bs.modal', () => {
    //         bsModal.dispose();
    //         document.body.removeChild(modal);
    //     });
    // }

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
