import { accommodation_create, accommodation_delete, accommodation_list, accommodation_pick, accommodation_update } from './controller/accommodation';
import { guest_create, guest_delete, guest_list, guest_pick, guest_update } from './controller/guest';
import { host_create, host_delete, host_list, host_pick, host_update } from './controller/host';
import { placement_create, placement_delete, placement_list, placement_pick, placement_update } from './controller/placement';

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

  '/api/host/create': host_create,
  '/api/host/delete': host_delete,
  '/api/host/update': host_update,
  '/api/host/list': host_list,
  '/api/host/pick': host_pick,

  '/api/placement/create': placement_create,
  '/api/placement/delete': placement_delete,
  '/api/placement/update': placement_update,
  '/api/placement/list': placement_list,
  '/api/placement/pick': placement_pick
};
