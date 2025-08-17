//backend/net/route.ts
import { guest_create, guest_delete, guest_list, guest_pick, guest_update, guest_stats } from './controller/guest';
import { requireRole } from './request';
import { findUserByToken } from '../data/user/UserRepository';
export const route = {
  '/': 'Home',
  '/api/guest/create': guest_create,
  '/api/guest/delete': requireRole('admin')(guest_delete),
  '/api/guest/update': guest_update,
  '/api/guest/list': guest_list,
  '/api/guest/pick': guest_pick,
  '/api/guest-stats': guest_stats,
  // '/api/user/find': (req, res) => {findUserByToken(req.$token);},
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
  // '/api/user/list': (req, res) => {
  //   return listAllUsers();
  // },
};
