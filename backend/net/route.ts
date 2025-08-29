//backend/net/route.ts
import { guest_create, guest_delete, guest_list, guest_pick, guest_update, guest_stats } from './controller/guest';
import { placement_create, placement_delete, placement_list, placement_pick, placement_update, placement_list_by_guest, placement_check_conflicts, placement_list_by_accommodation } from './controller/placement';
import { accommodation_create, accommodation_delete, accommodation_list, accommodation_pick, accommodation_update, accommodation_stats, accommodation_list_by_host } from './controller/accommodation';
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
  '/api/guest-stats': guest_stats,
  '/api/placement/list-by-guest': placement_list_by_guest,

  '/api/placement/create': placement_create,
  '/api/placement/delete': requireRole('admin')(placement_delete),
  '/api/placement/update': placement_update,
  '/api/placement/list': placement_list,
  '/api/placement/pick': placement_pick,
  '/api/placement/check-conflicts': placement_check_conflicts,
  '/api/placement/list-by-accommodation': placement_list_by_accommodation,

  // 在route.ts中添加以下路由
  '/api/accommodation/create': accommodation_create,
  '/api/accommodation/delete': requireRole('admin')(accommodation_delete),
  '/api/accommodation/update': accommodation_update,
  '/api/accommodation/list': accommodation_list,
  '/api/accommodation/pick': accommodation_pick,
  '/api/accommodation-stats': accommodation_stats,
  '/api/accommodation/list-by-host': accommodation_list_by_host,

};
