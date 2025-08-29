// accommodation-detail.js
function renderAccommodationInfo(accommodation) {
  document.getElementById('accommodation-id').textContent = accommodation.id;
  document.getElementById('accommodation-address').textContent = accommodation.address || '-';
  document.getElementById('accommodation-postcode').textContent = accommodation.postcode || '-';

  const hostLink = accommodation.host_id ?
    `<a href="host-detail.html?id=${accommodation.host_id}">${accommodation.host_name || '-'}</a>` :
    '-';
  document.getElementById('accommodation-host').innerHTML = hostLink;

  const badge = document.getElementById('accommodation-status');
  badge.textContent = accommodation.status || '-';
  badge.classList.add(accommodation.status === 'available' ? 'badge-success' : 'badge-warning');

  Details.syncCardHeights('accommodation-info-card', 'notes-card');
}

const page = new Details.DetailPage({
  model: 'accommodation',
  pickSeg: 'accommodation/pick',
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
          {
            render: (p) => `<td><a href="guest-detail.html?id=${p.guest_id}">${p.guest_name || '-'}</a></td>`
          },
          {
            render: (p) => `<td><a href="host-detail.html?id=${p.host_id}">${p.host_name || '-'}</a></td>`
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
  syncHeights: () => Details.syncCardHeights('accommodation-info-card', 'notes-card')
});

document.addEventListener('DOMContentLoaded', () => page.boot());
