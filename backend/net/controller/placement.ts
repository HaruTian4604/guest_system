// backend/net/controller/placement.ts
import { Placement } from '../../data/model/placement';

export const placement_create = async (req, res) => {
  try {
    const r = await Placement.create(req.$query);
    return { ok: true, data: r };
  } catch (e) { return { ok: false, error: e.message }; }
};

export const placement_update = async (req, res) => {
  try {
    const r = await Placement.update(req.$query);
    return { ok: true, data: r };
  } catch (e) { return { ok: false, error: e.message }; }
};

export const placement_delete = async (req, res) => {
  try {
    const id = Number(req.$query.id || 0);
    if (!id) return { ok: false, error: 'invalid id' };
    await Placement.delete(id);
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
};

export const placement_list = async (req, res) => {
  try {
    const q = req.$query || {};
    const page = Math.max(1, parseInt(String(q.page || '1'), 10));
    const limit = Math.max(1, Math.min(100, parseInt(String(q.limit || '10'), 10)));
    const order = String(q.order_by || 'start_date');
    const desc = String(q.desc || 'true') === 'true';
    const keyword = (q.keyword || '').trim();
    const [rows, total] = await Promise.all([
      Placement.list(page, limit, order, desc, keyword),
      Placement.count(keyword),
    ]);
    return { ok: true, data: rows, total, page, limit };
  } catch (e) { return { ok: false, error: e.message }; }
};

export const placement_pick = async (req, res) => {
  try {
    const id = Number(req.$query.id || 0);
    if (!id) return { ok: false, error: 'invalid id' };
    const r = await Placement.pick(id);
    if (!r) return { ok: false, error: 'not found' };
    return { ok: true, data: r };
  } catch (e) { return { ok: false, error: e.message }; }
};

export const placement_list_by_accommodation = async (req, res) => {
  try {
    const accommodation_id = Number(req.$query.accommodation_id || 0);
    if (!accommodation_id) return { ok: false, error: 'invalid accommodation_id' };
    const rows = await Placement.listByAccommodation(accommodation_id);
    return { ok: true, data: rows };
  } catch (e) { return { ok: false, error: e.message }; }
};

export const placement_list_by_guest = async (req, res) => {
  try {
    const guest_id = Number(req.$query.guest_id || 0);
    if (!guest_id) return { ok: false, error: 'invalid guest_id' };
    const rows = await Placement.listByGuest(guest_id);
    return { ok: true, data: rows };
  } catch (e) {
    return { ok: false, error: e.message };
  }
};

export async function placement_dashboard(req: Request, res: Response) {
  try {
    const items = await Placement.getEndingsNext12Months();
    return { ok: true, items: items };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};
