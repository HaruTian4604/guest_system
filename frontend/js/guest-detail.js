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

// 简单版页面逻辑
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
    placements: {
      listSeg: 'placement/list-by-guest',
      params: (guestId) => ({ guest_id: guestId }),
      columns: [
        { render: (p) => `<td>${p.host_name || '-'}</td>` },
        { render: (p) => `<td>${(p.accommodation_address || '-') + ' ' + (p.accommodation_postcode || '')}</td>` },
        { render: (p) => `<td>${Details.formatDDMMYYYY(p.start_date)}</td>` },
        { render: (p) => `<td>${p.end_date ? Details.formatDDMMYYYY(p.end_date) : 'Ongoing'}</td>` },
        { render: (p) => `<td><span class="badge ${p.end_date ? 'badge-secondary' : 'badge-success'}">${p.end_date ? 'Completed' : 'Active'}</span></td>` },
      ]
    }
  },
  syncHeights: () => Details.syncCardHeights('guest-info-card', 'notes-card')
});

document.addEventListener('DOMContentLoaded', () => page.boot());
