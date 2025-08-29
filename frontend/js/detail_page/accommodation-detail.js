(() => {
  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function renderAccommodationInfo(accommodation) {
    const $ = (id) => document.getElementById(id);
    if (!accommodation) return;

    $('accommodation-id').textContent = accommodation.id;
    $('accommodation-address').textContent = accommodation.address || '-';
    $('accommodation-postcode').textContent = accommodation.postcode || '-';

    const hostLink = accommodation.host_id
      ? `<a href="host-detail.html?id=${accommodation.host_id}">${accommodation.host_name || 'Unknown Host'}</a>`
      : '-';
    $('accommodation-host').innerHTML = hostLink;

    const badge = $('accommodation-status');
    const status = accommodation.status || '-';
    badge.textContent = status;
    badge.classList.remove('badge-success', 'badge-warning');
    badge.classList.add(status === 'available' ? 'badge-success' : 'badge-warning');

    Details.syncCardHeights('accommodation-info-card', 'notes-card');
  }

  const col = {
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
        const v = statusGetter(row) ?? '-';
        const klass = map[v] || 'badge-secondary';
        return `<td><span class="badge ${klass}">${v}</span></td>`;
      }
    }),
  };

const page = new Details.DetailPage({
  model: 'accommodation',
  pickSeg: 'accommodation/pick',  // ★ 后端实际存在的详情端点
  afterLoad: renderAccommodationInfo,

  sections: {
    notes: { saveSeg: 'accommodation/update', field: 'note' },
    relatedData: [
      {
        listSeg: 'placement/list-by-accommodation',
        params: (accommodationId) => ({ accommodation_id: accommodationId }),
        tbodyId: 'placements-body',
        tableElementId: 'placements-table',
        noDataElementId: 'no-placements',
        columns: [
          { render: (p) => `<td><a href="guest-detail.html?id=${p.guest_id}">${p.guest_name || '-'}</a></td>` },
          { render: (p) => `<td><a href="host-detail.html?id=${p.host_id}">${p.host_name || '-'}</a></td>` },
          { render: (p) => `<td>${Details.formatDDMMYYYY(p.start_date)}</td>` },
          { render: (p) => `<td>${p.end_date ? Details.formatDDMMYYYY(p.end_date) : 'Ongoing'}</td>` },
          {
            render: (p) => {
              const today = new Date();
              const [d,m,y] = p.end_date ? p.end_date.split('-').map(Number) : [];
              const endDate = p.end_date ? new Date(y, m - 1, d) : null;
              const ended = endDate && endDate < today;
              const klass = ended ? 'badge-secondary' : 'badge-success';
              const label = ended ? 'Completed' : 'Active';
              return `<td><span class="badge ${klass}">${label}</span></td>`;
            }
          },
        ]
      }
    ]
  },

  syncHeights: () => Details.syncCardHeights('accommodation-info-card', 'notes-card'),
});


  ready(() => page.boot());
})();
