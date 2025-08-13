import { guest_create, guest_delete, guest_list, guest_pick, guest_update, guest_stats } from './controller/guest';
import { users, requireRole, get_current_user, list_users } from './request';
export const route = {
  '/': 'Home',
  '/api/guest/create': guest_create,
  '/api/guest/delete': requireRole('admin')(guest_delete),
  '/api/guest/update': guest_update,
  '/api/guest/list': guest_list,
  '/api/guest/pick': guest_pick,
  '/api/guest-stats': guest_stats,
  '/api/user/current': (req, res) => get_current_user(req.$query.token || req.headers['x-auth-token']),
  '/api/user/list': (req, res) => list_users(),
};
