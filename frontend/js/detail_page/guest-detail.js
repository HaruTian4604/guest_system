// guest-detail.js
function renderGuestInfo(guest) {
  document.getElementById('guest-id').textContent = guest.id;
  document.getElementById('guest-fullname').textContent = guest.full_name || '-';
  document.getElementById('guest-dob').textContent = guest.date_of_birth ? Details.formatDDMMYYYY(guest.date_of_birth) : '-';
  document.getElementById('guest-age').textContent = Details.calculateAge(guest.date_of_birth) || '-';

  const badge = document.getElementById('guest-status');
  badge.textContent = guest.status || '-';
  badge.classList.add(guest.status === 'placed' ? 'badge-success' : 'badge-warning');

  Details.syncCardHeights('guest-info-card', 'notes-card');
}

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
          {
            render: (p) => `<td><a href="host-detail.html?id=${p.host_id}">${p.host_name || '-'}</a></td>`
          },
          {
            render: (p) => `<td><a href="accommodation-detail.html?id=${p.accommodation_id}">${(p.accommodation_address || '-') + ' ' + (p.accommodation_postcode || '')}</a></td>`
          },
          { render: (p) => `<td>${Details.formatDDMMYYYY(p.start_date)}</td>` },
          { render: (p) => `<td>${p.end_date ? Details.formatDDMMYYYY(p.end_date) : 'Ongoing'}</td>` },
          {
            render: (p) => {
              const today = new Date();
              const [endDay, endMonth, endYear] = p.end_date ? p.end_date.split('-').map(Number) : [null, null, null];
              const endDate = p.end_date ? new Date(endYear, endMonth - 1, endDay) : null;

              let status = 'Active';
              let badgeClass = 'badge-success';

              if (endDate && endDate < today) {
                status = 'Completed';
                badgeClass = 'badge-secondary';
              }

              return `<td><span class="badge ${badgeClass}">${status}</span></td>`;
            }
          },
        ]
      }
    ]
  },
  syncHeights: () => Details.syncCardHeights('guest-info-card', 'notes-card')
});

document.addEventListener('DOMContentLoaded', () => page.boot());
