// function renderGuestInfo(guest) {
//   document.getElementById('guest-id').textContent = guest.id;
//   document.getElementById('guest-fullname').textContent = guest.full_name || '-';
//   document.getElementById('guest-dob').textContent = guest.date_of_birth ? Details.formatDDMMYYYY(guest.date_of_birth) : '-';
//   document.getElementById('guest-age').textContent = Details.calculateAge(guest.date_of_birth) || '-';

//   const badge = document.getElementById('guest-status');
//   badge.textContent = guest.status || '-';
//   badge.classList.add(guest.status === 'placed' ? 'badge-success' : 'badge-warning');

//   Details.syncCardHeights('guest-info-card', 'notes-card');
// }

// // 确保页面加载后初始化
// document.addEventListener('DOMContentLoaded', function() {
//   const page = new Details.DetailPage({
//     model: 'guest',
//     pickSeg: 'guest/pick',
//     afterLoad: renderGuestInfo,
//     sections: {
//       notes: { saveSeg: 'guest/update', field: 'note' },
//       relatedData: [
//         {
//           listSeg: 'placement/list-by-guest',
//           params: (guestId) => ({ guest_id: guestId }),
//           tbodyId: 'placements-body',
//           tableElementId: 'placements-table',
//           noDataElementId: 'no-placements',
//           columns: [
//             {
//               render: (p) => `<td><a href="host-detail.html?id=${p.host_id}">${p.host_name || '-'}</a></td>`
//             },
//             {
//               render: (p) => `<td><a href="accommodation-detail.html?id=${p.accommodation_id}">${(p.accommodation_address || '-') + ' ' + (p.accommodation_postcode || '')}</a></td>`
//             },
//             { render: (p) => `<td>${Details.formatDDMMYYYY(p.start_date)}</td>` },
//             { render: (p) => `<td>${p.end_date ? Details.formatDDMMYYYY(p.end_date) : 'Ongoing'}</td>` },
//             {
//               render: (p) => {
//                 const today = new Date();
//                 const [endDay, endMonth, endYear] = p.end_date ? p.end_date.split('-').map(Number) : [null, null, null];
//                 const endDate = p.end_date ? new Date(endYear, endMonth - 1, endDay) : null;

//                 let status = 'Active';
//                 let badgeClass = 'badge-success';

//                 if (endDate && endDate < today) {
//                   status = 'Completed';
//                   badgeClass = 'badge-secondary';
//                 }

//                 return `<td><span class="badge ${badgeClass}">${status}</span></td>`;
//               }
//             },
//           ]
//         }
//       ]
//     },
//     syncHeights: () => Details.syncCardHeights('guest-info-card', 'notes-card')
//   });

//   // 调用 boot 方法
// function ready(fn) {
//   if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', fn);
//   } else {
//     fn();
//   }
// }
// ready(() => page.boot());
// });
// guest-detail.js (统一后的版本)
(() => {
  // 简单的 DOM 就绪兜底：动态插入脚本也能触发
  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  // 渲染 Guest 信息
  function renderGuestInfo(guest) {
    const $ = (id) => document.getElementById(id);
    if (!guest) return;

    $('guest-id').textContent = guest.id;
    $('guest-fullname').textContent = guest.full_name || '-';
    // $('guest-dob').textContent = guest.date_of_birth ? Details.formatDDMMYYYY(guest.date_of_birth) : '-';
    $('guest-dob').textContent = guest.date_of_birth ? Details.formatYMD(guest.date_of_birth) : '-';
    $('guest-age').textContent = Details.calculateAge(guest.date_of_birth) || '-';

    const badge = $('guest-status');
    const status = guest.status || '-';
    badge.textContent = status;
    badge.classList.remove('badge-success', 'badge-warning');
    badge.classList.add(status === 'placed' ? 'badge-success' : 'badge-warning');

    Details.syncCardHeights('guest-info-card', 'notes-card');
  }

  // 表格字段小工具
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
    pickSeg: 'guest/pick',  // ★ 后端实际存在的详情端点
    afterLoad: renderGuestInfo,

    // notes 与 相关表，都走 sections.*
    sections: {
      notes: { saveSeg: 'guest/update', field: 'note' },
      relatedData: [
        {
          listSeg: 'placement/list-by-guest',
          params: (guestId) => ({ guest_id: guestId }),
          tbodyId: 'placements-body',
          tableElementId: 'placements-table',
          noDataElementId: 'no-placements',
          // columns: [
          //   { render: (p) => `<td><a href="host-detail.html?id=${p.host_id}">${p.host_name || '-'}</a></td>` },
          //   { render: (p) => `<td><a href="accommodation-detail.html?id=${p.accommodation_id}">${(p.accommodation_address || '-') + ' ' + (p.accommodation_postcode || '')}</a></td>` },
          //   { render: (p) => `<td>${Details.formatDDMMYYYY(p.start_date)}</td>` },
          //   { render: (p) => `<td>${p.end_date ? Details.formatDDMMYYYY(p.end_date) : 'Ongoing'}</td>` },
          //   {
          //     render: (p) => {
          //       const today = new Date();
          //       const [d,m,y] = p.end_date ? p.end_date.split('-').map(Number) : [];
          //       const endDate = p.end_date ? new Date(y, m - 1, d) : null;
          //       const ended = endDate && endDate < today;
          //       const klass = ended ? 'badge-secondary' : 'badge-success';
          //       const label = ended ? 'Completed' : 'Active';
          //       return `<td><span class="badge ${klass}">${label}</span></td>`;
          //     }
          //   },
          // ]
          columns: [
            { render: (p) => `<td><a href="host-detail.html?id=${p.host_id}">${p.host_name || '-'}</a></td>` },
            { render: (p) => `<td><a href="accommodation-detail.html?id=${p.accommodation_id}">${(p.accommodation_address || '-') + ' ' + (p.accommodation_postcode || '')}</a></td>` },

            { render: (p) => `<td>${Details.formatYMD(p.start_date)}</td>` },
            { render: (p) => `<td>${p.end_date ? Details.formatYMD(p.end_date) : '-'}</td>` },

            // 状态直接用视图给的 'active|upcoming|completed'
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
