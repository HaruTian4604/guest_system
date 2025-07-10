const btn_add = document.getElementById('btn_add');
const form_main = document.getElementById('form_main');
const table_main = document.getElementById('table_main');
const form_main_cancel = document.getElementById('form_main_cancel');
const e_pager = document.getElementById('pager');
const form_search = document.getElementById('form_search');
const input_search = document.getElementById('input_search');
const status_select = document.getElementById('status');

// 搜索输入框
const guest_search = document.getElementById('guest_search');
const host_search = document.getElementById('host_search');
const accommodation_search = document.getElementById('accommodation_search');

// 搜索结果容器
const guest_results = document.getElementById('guest_results');
const host_results = document.getElementById('host_results');
const accommodation_results = document.getElementById('accommodation_results');

// ID隐藏字段
const guest_id = document.getElementById('guest_id');
const host_id = document.getElementById('host_id');
const accommodation_id = document.getElementById('accommodation_id');

const limit = 8;
let rows, total, pager, list_args = { limit };

let state = {
    table_listening: false,
    guests: [],
    hosts: [],
    accommodations: [],
    currentSearchType: null,
    selectedIndex: -1
};

// 搜索类型常量
const SEARCH_TYPE = {
    GUEST: 'guest',
    HOST: 'host',
    ACCOMMODATION: 'accommodation'
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

// 实时搜索函数
async function realtimeSearch(type, query) {
    if (!query || query.length < 2) {
        hideResults(type);
        return [];
    }

    try {
        showLoading(type);

        // 实际项目中这里应该调用API
        const r = await api(`${type}/search`, { keyword: query });

        // 模拟API延迟
        // await new Promise(resolve => setTimeout(resolve, 300));

        // 使用本地数据进行模拟
        const data = state[`${type}s`].filter(item => {
            if (type === SEARCH_TYPE.GUEST) {
                return item.full_name.toLowerCase().includes(query.toLowerCase());
            } else if (type === SEARCH_TYPE.HOST) {
                return item.full_name.toLowerCase().includes(query.toLowerCase());
            } else if (type === SEARCH_TYPE.ACCOMMODATION) {
                return (
                    item.address.toLowerCase().includes(query.toLowerCase())
                );
            }
            return false;
        });

        hideLoading(type);
        return data.slice(0, 10);
    } catch (error) {
        hideLoading(type);
        console.error(`Error searching ${type}:`, error);
        return [];
    }
}

// 显示搜索结果
function displayResults(type, results) {
    const container = getResultsContainer(type);
    if (!container) return;

    container.innerHTML = '';

    if (results.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'search-result-item';
        noResults.textContent = 'No results found';
        container.appendChild(noResults);
        container.classList.add('visible');
        return;
    }

    results.forEach((result, index) => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.dataset.id = result.id;
        item.dataset.index = index;

        if (type === SEARCH_TYPE.GUEST) {
            item.textContent = result.full_name;
            if (result.date_of_birth) {
                item.textContent += ` (${result.date_of_birth})`;
            }
        } else if (type === SEARCH_TYPE.HOST) {
            item.textContent = result.full_name;
        } else if (type === SEARCH_TYPE.ACCOMMODATION) {
            item.textContent = `${result.address} `;
        }

        item.addEventListener('click', () => {
            selectResult(type, result);
        });

        container.appendChild(item);
    });

    container.classList.add('visible');
    state.selectedIndex = -1;
}

// 选择结果
function selectResult(type, result) {
    const searchInput = getSearchInput(type);
    const idInput = getHiddenIdInput(type);

    if (type === SEARCH_TYPE.GUEST) {
        searchInput.value = result.full_name;
        if (result.date_of_birth) {
            searchInput.value += ` (${result.date_of_birth})`;
        }
    } else if (type === SEARCH_TYPE.HOST) {
        searchInput.value = result.full_name;
    } else if (type === SEARCH_TYPE.ACCOMMODATION) {
        searchInput.value = `${result.address}`;
    }

    idInput.value = result.id;
    hideResults(type);
}

// 键盘导航处理
function handleKeyNavigation(e, type) {
    const container = getResultsContainer(type);
    if (!container.classList.contains('visible')) return;

    const items = container.querySelectorAll('.search-result-item');
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        state.selectedIndex = Math.min(state.selectedIndex + 1, items.length - 1);
        updateSelection(items);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        state.selectedIndex = Math.max(state.selectedIndex - 1, -1);
        updateSelection(items);
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (state.selectedIndex >= 0 && state.selectedIndex < items.length) {
            items[state.selectedIndex].click();
        }
    } else if (e.key === 'Escape') {
        hideResults(type);
    }
}

// 更新选中项样式
function updateSelection(items) {
    items.forEach((item, index) => {
        if (index === state.selectedIndex) {
            item.classList.add('selected');
            item.scrollIntoView({ block: 'nearest' });
        } else {
            item.classList.remove('selected');
        }
    });
}

// 辅助函数
function getSearchInput(type) {
    if (type === SEARCH_TYPE.GUEST) return guest_search;
    if (type === SEARCH_TYPE.HOST) return host_search;
    if (type === SEARCH_TYPE.ACCOMMODATION) return accommodation_search;
    return null;
}

function getHiddenIdInput(type) {
    if (type === SEARCH_TYPE.GUEST) return guest_id;
    if (type === SEARCH_TYPE.HOST) return host_id;
    if (type === SEARCH_TYPE.ACCOMMODATION) return accommodation_id;
    return null;
}

function getResultsContainer(type) {
    if (type === SEARCH_TYPE.GUEST) return guest_results;
    if (type === SEARCH_TYPE.HOST) return host_results;
    if (type === SEARCH_TYPE.ACCOMMODATION) return accommodation_results;
    return null;
}

function showLoading(type) {
    const input = getSearchInput(type);
    if (input) input.classList.add('loading');
}

function hideLoading(type) {
    const input = getSearchInput(type);
    if (input) input.classList.remove('loading');
}

function hideResults(type) {
    const container = getResultsContainer(type);
    if (container) container.classList.remove('visible');
    state.selectedIndex = -1;
}

async function list_and_render() {
    try {
        const r = await admin.list('placement', list_args);
        if (r && r.data) {
            rows = r.data;
            total = r.total;

            // 缓存数据用于搜索
            state.guests = await api('guest/list', { limit: 1000 }).then(res => res.data || []);
            state.hosts = await api('host/list', { limit: 1000 }).then(res => res.data || []);
            state.accommodations = await api('accommodation/list', { limit: 1000 }).then(res => res.data || []);

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
        // let statusClass, statusText;
        // if (it.status === 'active') {
        //   statusClass = 'badge-active';
        //   statusText = 'Active';
        // } else {
        //   statusClass = 'badge-completed';
        //   statusText = 'Completed';
        // }

        tr.innerHTML = `
      <td>${it.id}</td>
      <td>${it.guest_full_name || '-'}</td>
      <td>${it.host_full_name || '-'}</td>
      <td>${it.accommodation_address || '-'}</td>
      <td><span class="badge ${it.status === 'Active' ? 'badge-success' : 'badge-warning'}">${it.status}</span></td>
      <td>${it.start_date || '-'}</td>
      <td>${it.end_date || '-'}</td>
      <td>
        <div class="op btn-group">
          <button type="button" class="op_update btn btn-secondary btn-sm">Update</button>
          <button type="button" class="op_archive btn btn-outline-secondary btn-sm">Archive</button>
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
                    const row = await admin.find(id);

                    console.log('Updating placement with row:', row);//debug log

                    // 特殊字段处理
                    guest_search.value = row.guest_full_name || '';
                    host_search.value = row.host_full_name || '';

                    // 组合地址和邮编
                    accommodation_search.value = row.accommodation_address
                        ? `${row.accommodation_address}${row.accommodation_postcode ? ` (${row.accommodation_postcode})` : ''}`
                        : '';

                    // 确保状态正确设置（转换为小写）
                    if (row.status && status_select) {
                        // 确保值匹配选项值
                        const statusValue = row.status.toLowerCase();
                        if (statusValue === 'active' || statusValue === 'completed') {
                            status_select.value = statusValue;
                        } else {
                            console.warn('Invalid status value:', row.status);
                        }
                    }

                    // 回填基础表单字段
                    admin.value2form(row);
                }

                if (e.target.classList.contains('op_archive')) {
                    if (!confirm('Are you sure you want to archive this placement?')) return;

                    const r = await api('placement/archive', { id });
                    if (r.ok) {
                        await list_and_render();
                        yo_success('Placement archived successfully');
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
    guest_search.value = '';
    host_search.value = '';
    accommodation_search.value = '';
    guest_id.value = '';
    host_id.value = '';
    accommodation_id.value = '';
    if (status_select) status_select.value = '';
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
        // const row = {
        //   id: document.querySelector('#form_main input[name="id"]').value,
        //   guest_id: guest_id.value,
        //   host_id: host_id.value,
        //   accommodation_id: accommodation_id.value,
        //   start_date: document.getElementById('start_date').value,
        //   end_date: document.getElementById('end_date').value,
        //   status: document.getElementById('status').value
        // };
        const row = admin.form2value(form_main)
        let action = row.id ? 'update' : 'create'


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

    guest_search.addEventListener('input', async (e) => {
        const query = e.target.value.trim();
        const results = await realtimeSearch(SEARCH_TYPE.GUEST, query);
        displayResults(SEARCH_TYPE.GUEST, results);
    });

    host_search.addEventListener('input', async (e) => {
        const query = e.target.value.trim();
        const results = await realtimeSearch(SEARCH_TYPE.HOST, query);
        displayResults(SEARCH_TYPE.HOST, results);
    });

    accommodation_search.addEventListener('input', async (e) => {
        const query = e.target.value.trim();
        const results = await realtimeSearch(SEARCH_TYPE.ACCOMMODATION, query);
        displayResults(SEARCH_TYPE.ACCOMMODATION, results);
    });

    // 键盘导航支持
    guest_search.addEventListener('keydown', (e) => {
        handleKeyNavigation(e, SEARCH_TYPE.GUEST);
    });

    host_search.addEventListener('keydown', (e) => {
        handleKeyNavigation(e, SEARCH_TYPE.HOST);
    });

    accommodation_search.addEventListener('keydown', (e) => {
        handleKeyNavigation(e, SEARCH_TYPE.ACCOMMODATION);
    });

    // 点击页面其他位置关闭搜索结果
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            hideResults(SEARCH_TYPE.GUEST);
            hideResults(SEARCH_TYPE.HOST);
            hideResults(SEARCH_TYPE.ACCOMMODATION);
        }
    });
}

function validateDate(date) {
    // Validate DD-MM-YYYY format
    const regex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
    return regex.test(date);
}
