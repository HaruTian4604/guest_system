// detail.js — cleaned & structured (non‑breaking refactor)
// Public API surface preserved: window.Details, Details.DetailPage, Details.ready, Details.col,
// Renderers, PAGE_DEFS, and all DOM ids/endpoint names are unchanged.

window.Details = {
  /**
   * Read a query parameter (default key 'id') from current URL.
   * @param {string} key
   * @returns {string|null}
   */
  getIdFromUrl(key = 'id') {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(key);
  },

  /**
   * Normalize a date input to YYYY-MM-DD.
   * Accepts ISO string, 'YYYY-MM-DD', 'DD-MM-YYYY', or Date.
   * @param {string|Date} dateInput
   * @returns {string}
   */
  formatYMD(dateInput) {
    if (!dateInput) return '-';

    if (typeof dateInput === 'string') {
      if (/^\d{4}-\d{2}-\d{2}T/.test(dateInput)) return dateInput.slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) return dateInput;
      const ddmmyyyy = dateInput.match(/^(\d{2})-(\d{2})-(\d{4})$/);
      if (ddmmyyyy) return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;
    }

    if (dateInput instanceof Date) {
      const year = dateInput.getFullYear();
      const month = String(dateInput.getMonth() + 1).padStart(2, '0');
      const day = String(dateInput.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    return String(dateInput);
  },

  /**
   * Calculate age in years from a date of birth.
   * @param {string|Date} dob
   * @returns {number|null}
   */
  calculateAge(dob) {
    if (!dob) return null;
    try {
      let year, month, day;

      if (typeof dob === 'string') {
        if (/^\d{4}-\d{2}-\d{2}T/.test(dob)) [year, month, day] = dob.slice(0, 10).split('-').map(Number);
        else if (/^\d{4}-\d{2}-\d{2}$/.test(dob)) [year, month, day] = dob.split('-').map(Number);
        else if (/^\d{2}-\d{2}-\d{4}$/.test(dob)) {
          const parts = dob.split('-').map(Number);
          [day, month, year] = parts;
        } else {
          return null;
        }
      } else if (dob instanceof Date) {
        year = dob.getFullYear();
        month = dob.getMonth() + 1;
        day = dob.getDate();
      } else {
        return null;
      }

      const birthDate = new Date(year, month - 1, day);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
      return age;
    } catch {
      return null;
    }
  },

  /** Show an error banner and hide the loading spinner. */
  showErrorMessage(message) {
    document.getElementById('loading')?.classList.add('d-none');
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.remove('d-none');
    }
  },

  /** Toggle Notes UI between read and edit modes. */
  toggleNoteEditingUI(isEditing) {
    const noteView = document.getElementById('note-view');
    const noteEdit = document.getElementById('note-edit');
    const editButton = document.getElementById('note-edit-btn');
    if (!noteView || !noteEdit || !editButton) return;

    if (isEditing) {
      noteView.classList.add('d-none');
      noteEdit.classList.remove('d-none');
      editButton.textContent = 'Save';
      editButton.classList.remove('btn-outline-primary');
      editButton.classList.add('btn-primary');
    } else {
      noteView.classList.remove('d-none');
      noteEdit.classList.add('d-none');
      editButton.textContent = 'Edit';
      editButton.classList.remove('btn-primary');
      editButton.classList.add('btn-outline-primary');
    }
  },

  /** Match the heights of two cards by id. */
  syncCardHeights(sourceElementId, targetElementId) {
    const sourceEl = document.getElementById(sourceElementId);
    const targetEl = document.getElementById(targetElementId);
    if (!sourceEl || !targetEl) return;
    targetEl.style.setProperty('height', sourceEl.offsetHeight + 'px', 'important');
  }
};

(function () {
  // Internal helper: get element by id (nullable)
  function getElementOrNull(id) { return document.getElementById(id); }

  class DetailPage {
    /**
     * @param {object} options Configuration describing the current detail page.
     */
    constructor(options) {
      this.options = options || {};
      this.data = null;
    }

    /** Load a related data list and render a table body. */
    async loadRelatedData(entityId, relatedConfig) {
      if (!relatedConfig || !relatedConfig.listSeg) return;

      const listResponse = await api(relatedConfig.listSeg, relatedConfig.params(entityId));
      if (!listResponse?.ok) {
        if (relatedConfig.noDataElementId) getElementOrNull(relatedConfig.noDataElementId)?.classList.remove('d-none');
        return;
      }

      const items = listResponse.data || [];
      if (!items.length) {
        if (relatedConfig.noDataElementId) getElementOrNull(relatedConfig.noDataElementId)?.classList.remove('d-none');
        return;
      }

      const tableBody = getElementOrNull(relatedConfig.tbodyId);
      if (!tableBody) return;

      tableBody.innerHTML = '';
      for (const rowItem of items) {
        const cellsHtml = (relatedConfig.columns || []).map((columnDef) => {
          if (typeof columnDef.render === 'function') return columnDef.render(rowItem);
          if (columnDef.field) return `<td>${rowItem[columnDef.field] || '-'}</td>`;
          return '<td>-</td>';
        }).join('');

        const row = document.createElement('tr');
        if (relatedConfig.rowClickSeg) {
          row.style.cursor = 'pointer';
          row.addEventListener('click', () => {
            window.location.href = `${relatedConfig.rowClickSeg}?id=${rowItem[relatedConfig.rowClickIdField]}`;
          });
        }
        row.innerHTML = cellsHtml;
        tableBody.appendChild(row);
      }

      if (relatedConfig.tableElementId) getElementOrNull(relatedConfig.tableElementId)?.classList.remove('d-none');
    }

    /** Orchestrate page boot: fetch detail, render, notes, related data, and sync heights. */
    async boot() {
      console.log('DetailPage boot started');
      const idKey = this.options.idKey || 'id';
      const entityId = Details.getIdFromUrl(idKey);
      console.log('ID from URL:', entityId);

      if (!entityId || Number.isNaN(parseInt(entityId))) {
        console.error('Invalid ID');
        return Details.showErrorMessage('Invalid ID');
      }

      console.log('Fetching data from:', this.options.pickSeg);
      let response;
      if (this.options.pickSeg) {
        response = await api(this.options.pickSeg, { id: entityId });
      } else if (this.options.fetchers?.detail && typeof this.options.fetchers.detail === 'function') {
        response = await this.options.fetchers.detail(entityId);
      } else {
        console.error('No detail endpoint provided (pickSeg or fetchers.detail).');
        return Details.showErrorMessage('Load failed: no detail endpoint.');
      }
      console.log('API response:', response);

      if (!response?.ok) {
        console.error('API error:', response?.error);
        return Details.showErrorMessage(response?.error || 'Load failed');
      }

      getElementOrNull('loading')?.classList.add('d-none');
      getElementOrNull(`${this.options.model}-details`)?.classList.remove('d-none');

      this.data = response.data;

      if (typeof this.options.afterLoad === 'function') this.options.afterLoad(response.data);
      if (this.options.sections?.notes) this.initNotes(entityId, this.options.sections.notes);

      if (this.options.sections?.relatedData) {
        for (const section of this.options.sections.relatedData) {
          // eslint-disable-next-line no-await-in-loop
          await this.loadRelatedData(entityId, section);
        }
      }

      window.addEventListener('resize', () => this.options.syncHeights?.());
    }

    /** Initialize note editor/viewer behavior. */
    initNotes(entityId, notesConfig) {
      const editButton = getElementOrNull('note-edit-btn');
      const cancelButton = getElementOrNull('note-cancel-btn');
      const noteTextarea = getElementOrNull('note-textarea');
      const noteContent = getElementOrNull('note-content');
      let isEditing = false;

      if (noteContent) {
        const currentValue = this.data[notesConfig.field] || '';
        noteContent.textContent = currentValue || 'No notes available.';
        if (noteTextarea) noteTextarea.value = currentValue;
      }

      editButton?.addEventListener('click', async () => {
        if (!isEditing) {
          Details.toggleNoteEditingUI(true);
          isEditing = true;
          return;
        }

        const newNote = noteTextarea?.value || '';
        const saveResponse = await api(notesConfig.saveSeg, { id: entityId, [notesConfig.field]: newNote });
        if (saveResponse?.ok) {
          yo_success('Note saved successfully', '');
          if (noteContent) noteContent.textContent = newNote || 'No notes available.';
          Details.toggleNoteEditingUI(false);
          isEditing = false;
        } else {
          yo_error('Error: ', saveResponse?.error || 'Unknown');
        }
      });

      cancelButton?.addEventListener('click', () => {
        const current = noteContent?.textContent || '';
        if (noteTextarea) noteTextarea.value = current === 'No notes available.' ? '' : current;
        Details.toggleNoteEditingUI(false);
        isEditing = false;
      });
    }

    /** Legacy helper retained (not used by PAGE_DEFS, but kept for compatibility). */
    async loadPlacements(entityId, config) {
      const placementsResponse = await api(config.listSeg, config.params(entityId));
      if (!placementsResponse?.ok) { getElementOrNull('no-placements')?.classList.remove('d-none'); return; }

      const placements = placementsResponse.data || [];
      if (!placements.length) { getElementOrNull('no-placements')?.classList.remove('d-none'); return; }

      const tbody = getElementOrNull('placements-body');
      if (!tbody) return;

      tbody.innerHTML = '';
      for (const placement of placements) {
        const cells = (config.columns || []).map((col) => col.render(placement)).join('');
        const tr = document.createElement('tr');
        tr.innerHTML = cells;
        tbody.appendChild(tr);
      }
      getElementOrNull('placements-table')?.classList.remove('d-none');
    }
  }

  // Expose class on public namespace (kept intact)
  window.Details.DetailPage = DetailPage;
})();

// === Small utilities exposed on window.Details (kept as-is) ===
Details.ready = function (fn) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
  else fn();
};

// Column helpers for table rendering
Details.col = {
  text: (getter) => ({ render: (row) => `<td>${getter(row) ?? '-'}</td>` }),
  link: (getter, hrefGetter) => ({
    render: (row) => {
      const text = getter(row) ?? '-';
      const href = hrefGetter(row);
      return `<td>${href ? `<a href="${href}">${text}</a>` : text}</td>`;
    }
  }),
  badge: (statusGetter, map) => ({
    render: (row) => {
      const value = (statusGetter(row) ?? '-').toString().toLowerCase();
      const klass = map[value] || 'badge-secondary';
      return `<td><span class="badge ${klass}">${value}</span></td>`;
    }
  }),
};

// Page-specific renderers (DOM ids unchanged)
const Renderers = {
  guest(guest) {
    const $ = (id) => document.getElementById(id);
    if (!guest) return;
    $('guest-id').textContent = guest.id;
    $('guest-fullname').textContent = guest.full_name || '-';
    $('guest-dob').textContent = guest.date_of_birth ? Details.formatYMD(guest.date_of_birth) : '-';
    $('guest-age').textContent = Details.calculateAge(guest.date_of_birth) || '-';
    const statusBadge = $('guest-status');
    const status = guest.status || '-';
    statusBadge.textContent = status;
    statusBadge.classList.remove('badge-success', 'badge-warning');
    statusBadge.classList.add(status === 'placed' ? 'badge-success' : 'badge-warning');
    Details.syncCardHeights('guest-info-card', 'notes-card');
  },

  host(host) {
    const $ = (id) => document.getElementById(id);
    if (!host) return;
    $('host-id').textContent = host.id;
    $('host-fullname').textContent = host.full_name || '-';
    Details.syncCardHeights('host-info-card', 'notes-card');
  },

  accommodation(accommodation) {
    const $ = (id) => document.getElementById(id);
    if (!accommodation) return;
    $('accommodation-id').textContent = accommodation.id;
    $('accommodation-address').textContent = accommodation.address || '-';
    $('accommodation-postcode').textContent = accommodation.postcode || '-';
    $('accommodation-host').innerHTML = accommodation.host_id
      ? `<a href="host-detail.html?id=${accommodation.host_id}">${accommodation.host_name || 'Unknown Host'}</a>`
      : '-';
    const statusBadge = $('accommodation-status');
    const status = accommodation.status || '-';
    statusBadge.textContent = status;
    statusBadge.classList.remove('badge-success', 'badge-warning');
    statusBadge.classList.add(status === 'available' ? 'badge-success' : 'badge-warning');
    Details.syncCardHeights('accommodation-info-card', 'notes-card');
  },

  placement(placement) {
    const $ = (id) => document.getElementById(id);
    if (!placement) return;
    $('placement-id').textContent = placement.id;
    $('placement-guest').innerHTML = placement.guest_name
      ? `<a href="guest-detail.html?id=${placement.guest_id}">${placement.guest_name}</a>`
      : '-';
    $('placement-host').innerHTML = placement.host_name
      ? `<a href="host-detail.html?id=${placement.host_id}">${placement.host_name}</a>`
      : '-';
    $('placement-accommodation').innerHTML = placement.accommodation_address
      ? `<a href="accommodation-detail.html?id=${placement.accommodation_id}">${placement.accommodation_address} ${placement.accommodation_postcode || ''}</a>`
      : '-';
    $('placement-start-date').textContent = placement.start_date ? Details.formatYMD(placement.start_date) : '-';
    $('placement-end-date').textContent = placement.end_date ? Details.formatYMD(placement.end_date) : '-';
    const statusBadge = $('placement-status');
    const status = (placement.status || '-').toLowerCase();
    statusBadge.textContent = status;
    statusBadge.classList.remove('badge-success', 'badge-secondary', 'badge-info');
    statusBadge.classList.add(status === 'active' ? 'badge-success' : status === 'completed' ? 'badge-secondary' : 'badge-info');
    Details.syncCardHeights('placement-info-card', 'notes-card');
  },
};

// Per-page configuration (endpoints, notes, related lists, and height sync)
const PAGE_DEFS = {
  guest: {
    model: 'guest',
    pickSeg: 'guest/pick',
    afterLoad: Renderers.guest,
    sections: {
      notes: { saveSeg: 'guest/update', field: 'note' },
      relatedData: [{
        listSeg: 'placement/list-by-guest',
        params: (guestId) => ({ guest_id: guestId }),
        tbodyId: 'placements-body',
        tableElementId: 'placements-table',
        noDataElementId: 'no-placements',
        columns: [
          { render: (p) => `<td><a href="host-detail.html?id=${p.host_id}">${p.host_name || '-'}</a></td>` },
          { render: (p) => `<td><a href="accommodation-detail.html?id=${p.accommodation_id}">${(p.accommodation_address || '-') + ' ' + (p.accommodation_postcode || '')}</a></td>` },
          { render: (p) => `<td>${Details.formatYMD(p.start_date)}</td>` },
          { render: (p) => `<td>${p.end_date ? Details.formatYMD(p.end_date) : '-'}</td>` },
          { render: (p) => {
              const status = (p.status || '').toLowerCase();
              const klass = status === 'active' ? 'badge-success' : status === 'upcoming' ? 'badge-info' : 'badge-secondary';
              return `<td><span class="badge ${klass}">${status || '-'}</span></td>`;
            }
          },
        ]
      }]
    },
    syncHeights: () => Details.syncCardHeights('guest-info-card', 'notes-card'),
  },

  host: {
    model: 'host',
    pickSeg: 'host/pick',
    afterLoad: Renderers.host,
    sections: {
      notes: { saveSeg: 'host/update', field: 'note' },
      relatedData: [{
        listSeg: 'host/list-by-accommodations',
        params: (hostId) => ({ host_id: hostId }),
        tbodyId: 'accommodations-body',
        tableElementId: 'accommodations-table',
        noDataElementId: 'no-accommodations',
        columns: [
          { render: (a) => `<td><a href="accommodation-detail.html?id=${a.id}">${a.address || '-'}</a></td>` },
          { render: (a) => `<td>${a.postcode || '-'}</td>` },
          { render: (a) => {
              const klass = a.status === 'available' ? 'badge-success' : 'badge-secondary';
              return `<td><span class="badge ${klass}">${a.status}</span></td>`;
            }
          },
          { render: (a) => `<td>${a.active_placements || 0}</td>` },
        ]
      }]
    },
    syncHeights: () => Details.syncCardHeights('host-info-card', 'notes-card'),
  },

  accommodation: {
    model: 'accommodation',
    pickSeg: 'accommodation/pick',
    afterLoad: Renderers.accommodation,
    sections: {
      notes: { saveSeg: 'accommodation/update', field: 'note' },
      relatedData: [{
        listSeg: 'placement/list-by-accommodation',
        params: (id) => ({ accommodation_id: id }),
        tbodyId: 'placements-body',
        tableElementId: 'placements-table',
        noDataElementId: 'no-placements',
        columns: [
          { render: (p) => `<td><a href="guest-detail.html?id=${p.guest_id}">${p.guest_name || '-'}</a></td>` },
          { render: (p) => `<td><a href="host-detail.html?id=${p.host_id}">${p.host_name || '-'}</a></td>` },
          { render: (p) => `<td>${Details.formatYMD(p.start_date)}</td>` },
          { render: (p) => `<td>${p.end_date ? Details.formatYMD(p.end_date) : '-'}</td>` },
          { render: (p) => {
              const status = (p.status || '').toLowerCase();
              const klass = status === 'active' ? 'badge-success' : status === 'completed' ? 'badge-secondary' : 'badge-info';
              return `<td><span class="badge ${klass}">${status || '-'}</span></td>`;
            }
          },
        ]
      }]
    },
    syncHeights: () => Details.syncCardHeights('accommodation-info-card', 'notes-card'),
  },

  placement: {
    model: 'placement',
    pickSeg: 'placement/pick',
    afterLoad: Renderers.placement,
    sections: {
      notes: { saveSeg: 'placement/update', field: 'note' },
    },
    syncHeights: () => Details.syncCardHeights('placement-info-card', 'notes-card'),
  },
};

// Auto-detect which detail page we are on and boot it.
Details.ready(() => {
  const candidateModels = ['guest', 'host', 'accommodation', 'placement'];
  const detectedModel = candidateModels.find((m) => document.getElementById(`${m}-details`))
    || document.querySelector('[data-model]')?.getAttribute('data-model');

  if (!detectedModel || !PAGE_DEFS[detectedModel]) {
    console.error('Unknown detail page model.');
    return Details.showErrorMessage('Unknown page');
  }

  const page = new Details.DetailPage(PAGE_DEFS[detectedModel]);
  page.boot();
});
