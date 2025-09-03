//backend/net/route.ts
import { guest_create, guest_delete, guest_list, guest_pick, guest_update, guest_dashboard } from './controller/guest';
import { host_create, host_delete, host_list, host_pick, host_update, host_list_by_accommodation, host_dashboard } from './controller/host';
import { accommodation_create, accommodation_delete, accommodation_list, accommodation_pick, accommodation_update, accommodation_dashboard } from './controller/accommodation';
import { placement_create, placement_delete, placement_list, placement_pick, placement_update, placement_list_by_accommodation, placement_list_by_guest, placement_dashboard } from './controller/placement';
import { log_list } from './controller/log';
import { requireRole } from './request';
import { findUserByToken } from '../data/user/UserRepository';
export const route = {
  '/': 'Home',
  '/api/user/find': (req, res) => {
    const token = req.$query.token;
    if (!token) {
      return { ok: false, error: 'You need login' };
    }
    return {
      ok: true,
      user: findUserByToken(token),
    };
  },
  '/api/log/list': log_list,

  '/api/guest/create': guest_create,
  '/api/guest/delete': requireRole('admin')(guest_delete),
  '/api/guest/update': guest_update,
  '/api/guest/list': guest_list,
  '/api/guest/pick': guest_pick,
  '/api/guest-dashboard': guest_dashboard,

  '/api/host/create': host_create,
  '/api/host/delete': requireRole('admin')(host_delete),
  '/api/host/update': host_update,
  '/api/host/list': host_list,
  '/api/host/pick': host_pick,
  // '/api/host-stats': host_stats,
  '/api/host/list-by-accommodations': host_list_by_accommodation,
  '/api/host-dashboard': host_dashboard,

  '/api/accommodation/create': accommodation_create,
  '/api/accommodation/delete': requireRole('admin')(accommodation_delete),
  '/api/accommodation/update': accommodation_update,
  '/api/accommodation/list': accommodation_list,
  '/api/accommodation/pick': accommodation_pick,
  // '/api/accommodation-stats': accommodation_stats,
  // '/api/accommodation/list-by-host': accommodation_list_by_host,
  '/api/accommodation-dashboard': accommodation_dashboard,

  '/api/placement/create': placement_create,
  '/api/placement/delete': requireRole('admin')(placement_delete),
  '/api/placement/update': placement_update,
  '/api/placement/list': placement_list,
  '/api/placement/pick': placement_pick,
  // '/api/placement/check-conflicts': placement_check_conflicts,
  '/api/placement/list-by-accommodation': placement_list_by_accommodation,
  '/api/placement/list-by-guest': placement_list_by_guest,
  '/api/placement-dashboard': placement_dashboard,
};
