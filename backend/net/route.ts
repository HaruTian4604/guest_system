import { guest_create, guest_delete, guest_list, guest_pick, guest_update, guest_stats } from './controller/guest';

export const route = {
  '/': 'Home',
  '/api/guest/create': guest_create,
  '/api/guest/delete': guest_delete,
  '/api/guest/update': guest_update,
  '/api/guest/list': guest_list,
  '/api/guest/pick': guest_pick,
  '/api/guest-stats': guest_stats,
};
