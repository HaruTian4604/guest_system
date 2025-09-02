(() => {
  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function renderHostInfo(host) {
    const $ = (id) => document.getElementById(id);
    if (!host) return;

    $('host-id').textContent = host.id;
    $('host-fullname').textContent = host.full_name || '-';

    Details.syncCardHeights('host-info-card', 'notes-card');
  }

  const page = new Details.DetailPage({
    model: 'host',
    pickSeg: 'host/pick',
    afterLoad: renderHostInfo,

    sections: {
      notes: { saveSeg: 'host/update', field: 'note' },
      relatedData: [
        {
          listSeg: 'host/list-by-accommodations',
          params: (hostId) => ({ host_id: hostId }),
          tbodyId: 'accommodations-body',
          tableElementId: 'accommodations-table',
          noDataElementId: 'no-accommodations',
          columns: [
            {
              render: (a) => `<td><a href="accommodation-detail.html?id=${a.id}">${a.address || '-'}</a></td>`
            },
            { render: (a) => `<td>${a.postcode || '-'}</td>` },
            {
              render: (a) => {
                const klass = a.status === 'available' ? 'badge-success' : 'badge-secondary';
                return `<td><span class="badge ${klass}">${a.status}</span></td>`;
              }
            },
            { render: (a) => `<td>${a.active_placements || 0}</td>` }
          ]
        }
      ]
    },

    syncHeights: () => Details.syncCardHeights('host-info-card', 'notes-card'),
  });

  ready(() => page.boot());
})();
