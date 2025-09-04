(() => {
  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function renderGuestInfo(guest) {
    const $ = (id) => document.getElementById(id);
    if (!guest) return;

    $('guest-id').textContent = guest.id;
    $('guest-fullname').textContent = guest.full_name || '-';
    $('guest-dob').textContent = guest.date_of_birth ? Details.formatYMD(guest.date_of_birth) : '-';
    $('guest-age').textContent = Details.calculateAge(guest.date_of_birth) || '-';

    const badge = $('guest-status');
    const status = guest.status || '-';
    badge.textContent = status;
    badge.classList.remove('badge-success', 'badge-warning');
    badge.classList.add(status === 'placed' ? 'badge-success' : 'badge-warning');

    Details.syncCardHeights('guest-info-card', 'notes-card');
  }

  const col = {
    text: (getter) => ({
      render: (row) => `<td>${getter(row) ?? '-'}</td>`
    }),
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
    model: 'guest',
    pickSeg: 'guest/pick',
    afterLoad: renderGuestInfo,
    sections: {
      notes: { saveSeg: 'guest/update', field: 'note' },
      relatedData: [
        {
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

            {
              render: (p) => {
                const s = (p.status || '').toLowerCase();
                const klass =
                  s === 'active' ? 'badge-success' :
                    s === 'upcoming' ? 'badge-info' :
                      'badge-secondary';
                return `<td><span class="badge ${klass}">${s || '-'}</span></td>`;
              }
            },
          ]

        }
      ]
    },

    syncHeights: () => Details.syncCardHeights('guest-info-card', 'notes-card'),
  });


  ready(() => page.boot());
})();
