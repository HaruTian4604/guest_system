(() => {
  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function renderPlacementInfo(placement) {
    const $ = (id) => document.getElementById(id);
    if (!placement) return;

    $('placement-id').textContent = placement.id;
    $('placement-guest').innerHTML = placement.guest_name ?
      `<a href="guest-detail.html?id=${placement.guest_id}">${placement.guest_name}</a>` : '-';
    $('placement-host').innerHTML = placement.host_name ?
      `<a href="host-detail.html?id=${placement.host_id}">${placement.host_name}</a>` : '-';
    $('placement-accommodation').innerHTML = placement.accommodation_address ?
      `<a href="accommodation-detail.html?id=${placement.accommodation_id}">${placement.accommodation_address} ${placement.accommodation_postcode || ''}</a>` : '-';
    $('placement-start-date').textContent = placement.start_date ? Details.formatYMD(placement.start_date) : '-';
    $('placement-end-date').textContent = placement.end_date ? Details.formatYMD(placement.end_date) : '-';

    const badge = $('placement-status');
    const status = (placement.status || '-').toLowerCase();
    badge.textContent = status;
    badge.classList.remove('badge-success', 'badge-secondary', 'badge-info');
    badge.classList.add(
      status === 'active' ? 'badge-success' :
        status === 'completed' ? 'badge-secondary' :
          'badge-info' // upcoming
    );

    Details.syncCardHeights('placement-info-card', 'notes-card');
  }

  const page = new Details.DetailPage({
    model: 'placement',
    pickSeg: 'placement/pick',
    afterLoad: renderPlacementInfo,
    sections: {
      notes: { saveSeg: 'placement/update', field: 'note' }
    },
    syncHeights: () => Details.syncCardHeights('placement-info-card', 'notes-card'),
  });

  ready(() => page.boot());
})();
