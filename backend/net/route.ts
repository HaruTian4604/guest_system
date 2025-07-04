import { accommodation_create, accommodation_delete, accommodation_list, accommodation_pick, accommodation_update } from './controller/accommodation';
import { guest_create, guest_delete, guest_list, guest_pick, guest_update } from './controller/guest';

export const route = {
  '/': 'Home',
  '/api/accommodation/create': accommodation_create,
  '/api/accommodation/delete': accommodation_delete,
  '/api/accommodation/update': accommodation_update,
  '/api/accommodation/list': accommodation_list,
  '/api/accommodation/pick': accommodation_pick,
  '/api/guest/create': guest_create,
  '/api/guest/delete': guest_delete,
  '/api/guest/update': guest_update,
  '/api/guest/list': guest_list,
  '/api/guest/pick': guest_pick,
  };
