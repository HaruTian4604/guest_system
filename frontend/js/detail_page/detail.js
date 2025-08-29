// detail.js

window.Details = {
    getIdFromUrl(key = 'id') {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(key);
    },

    formatDDMMYYYY(dateStr) {
        if (!dateStr) return '-';
        try {
            const [day, month, year] = dateStr.split('-');
            const d = new Date(Number(year), Number(month) - 1, Number(day));
            return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch {
            return dateStr;
        }
    },

    calculateAge(dob) {
        if (!dob) return null;
        try {
            const [day, month, year] = dob.split('-').map(Number);
            const birth = new Date(year, month - 1, day);
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
            return age;
        } catch {
            return null;
        }
    },

    showErrorMessage(message) {
        document.getElementById('loading')?.classList.add('d-none');
        const el = document.getElementById('error-message');
        if (el) { el.textContent = message; el.classList.remove('d-none'); }
    },

    toggleNoteEditingUI(isEditing) {
        const noteView = document.getElementById('note-view');
        const noteEdit = document.getElementById('note-edit');
        const editBtn = document.getElementById('note-edit-btn');
        if (!noteView || !noteEdit || !editBtn) return;

        if (isEditing) {
            noteView.classList.add('d-none');
            noteEdit.classList.remove('d-none');
            editBtn.textContent = 'Save';
            editBtn.classList.remove('btn-outline-primary');
            editBtn.classList.add('btn-primary');
        } else {
            noteView.classList.remove('d-none');
            noteEdit.classList.add('d-none');
            editBtn.textContent = 'Edit';
            editBtn.classList.remove('btn-primary');
            editBtn.classList.add('btn-outline-primary');
        }
    },

    syncCardHeights(srcId, dstId) {
        const s = document.getElementById(srcId);
        const d = document.getElementById(dstId);
        if (!s || !d) return;
        d.style.setProperty('height', s.offsetHeight + 'px', 'important');
    }
};

(function () {
    function ensureEl(id) { return document.getElementById(id); }

    class DetailPage {
        constructor(opt) { this.opt = opt || {}; this.data = null; }

        // 在detail.js中的DetailPage类添加以下方法
        async loadRelatedData(id, cfg) {
            if (!cfg || !cfg.listSeg) return;

            const pr = await api(cfg.listSeg, cfg.params(id));
            if (!pr?.ok) {
                if (cfg.noDataElementId) {
                    ensureEl(cfg.noDataElementId)?.classList.remove('d-none');
                }
                return;
            }

            const list = pr.data || [];
            if (!list.length) {
                if (cfg.noDataElementId) {
                    ensureEl(cfg.noDataElementId)?.classList.remove('d-none');
                }
                return;
            }

            const tbody = ensureEl(cfg.tbodyId);
            if (!tbody) return;

            tbody.innerHTML = '';
            for (const item of list) {
                const tds = (cfg.columns || []).map(col => {
                    let content = '';
                    if (typeof col.render === 'function') {
                        content = col.render(item);
                    } else if (col.field) {
                        content = `<td>${item[col.field] || '-'}</td>`;
                    } else {
                        content = '<td>-</td>';
                    }
                    return content;
                }).join('');

                const tr = document.createElement('tr');
                if (cfg.rowClickSeg) {
                    tr.style.cursor = 'pointer';
                    tr.addEventListener('click', () => {
                        window.location.href = `${cfg.rowClickSeg}?id=${item[cfg.rowClickIdField]}`;
                    });
                }

                tr.innerHTML = tds;
                tbody.appendChild(tr);
            }

            if (cfg.tableElementId) {
                ensureEl(cfg.tableElementId)?.classList.remove('d-none');
            }
        }

        // 修改boot方法以使用新的loadRelatedData
        async boot() {
            // const id = Details.getIdFromUrl(this.opt.idKey || 'id');
            // if (!id || isNaN(parseInt(id))) return Details.showErrorMessage('Invalid ID');

            // const r = await api(this.opt.pickSeg, { id });
            // if (!r?.ok) return Details.showErrorMessage(r?.error || 'Load failed');
            console.log('DetailPage boot started');
            const id = Details.getIdFromUrl(this.opt.idKey || 'id');
            console.log('ID from URL:', id);

            if (!id || isNaN(parseInt(id))) {
                console.error('Invalid ID');
                return Details.showErrorMessage('Invalid ID');
            }

            console.log('Fetching data from:', this.opt.pickSeg);
            // const r = await api(this.opt.pickSeg, { id });
            let r;
            if (this.opt.pickSeg) {
                r = await api(this.opt.pickSeg, { id });
            } else if (this.opt.fetchers?.detail && typeof this.opt.fetchers.detail === 'function') {
                r = await this.opt.fetchers.detail(id);
            } else {
                console.error('No detail endpoint provided (pickSeg or fetchers.detail).');
                return Details.showErrorMessage('Load failed: no detail endpoint.');
            }
            console.log('API response:', r);

            if (!r?.ok) {
                console.error('API error:', r?.error);
                return Details.showErrorMessage(r?.error || 'Load failed');
            }

            ensureEl('loading')?.classList.add('d-none');
            ensureEl(`${this.opt.model}-details`)?.classList.remove('d-none');

            this.data = r.data;

            if (typeof this.opt.afterLoad === 'function') this.opt.afterLoad(r.data);
            if (this.opt.sections?.notes) this.initNotes(id, this.opt.sections.notes);

            // 加载所有相关数据部分
            if (this.opt.sections?.relatedData) {
                for (const section of this.opt.sections.relatedData) {
                    await this.loadRelatedData(id, section);
                }
            }

            window.addEventListener('resize', () => this.opt.syncHeights?.());
        }

        initNotes(id, cfg) {
            const editBtn = ensureEl('note-edit-btn');
            const cancelBtn = ensureEl('note-cancel-btn');
            const ta = ensureEl('note-textarea');
            const view = ensureEl('note-content');
            let editing = false;

            if (view) {
                const val = this.data[cfg.field] || '';
                view.textContent = val || 'No notes available.';
                if (ta) ta.value = val;
            }

            editBtn?.addEventListener('click', async () => {
                if (!editing) {
                    Details.toggleNoteEditingUI(true); editing = true;
                } else {
                    const note = ta?.value || '';
                    const r = await api(cfg.saveSeg, { id, [cfg.field]: note });
                    if (r?.ok) {
                        yo_success('Note saved successfully', '');
                        if (view) view.textContent = note || 'No notes available.';
                        Details.toggleNoteEditingUI(false); editing = false;
                    } else {
                        yo_error('Error: ', r?.error || 'Unknown');
                    }
                }
            });

            cancelBtn?.addEventListener('click', () => {
                const current = view?.textContent || '';
                if (ta) ta.value = current === 'No notes available.' ? '' : current;
                Details.toggleNoteEditingUI(false); editing = false;
            });
        }

        async loadPlacements(id, cfg) {
            const pr = await api(cfg.listSeg, cfg.params(id));
            if (!pr?.ok) { ensureEl('no-placements')?.classList.remove('d-none'); return; }

            const list = pr.data || [];
            if (!list.length) { ensureEl('no-placements')?.classList.remove('d-none'); return; }

            const tbody = ensureEl('placements-body');
            tbody.innerHTML = '';
            for (const p of list) {
                const tds = (cfg.columns || []).map(col => col.render(p)).join('');
                const tr = document.createElement('tr');
                tr.innerHTML = tds;
                tbody.appendChild(tr);
            }
            ensureEl('placements-table')?.classList.remove('d-none');
        }
    }

    // 暴露到全局工具命名空间
    window.Details.DetailPage = DetailPage;
})();
