// backend/net/controller/accommodation.ts
import { Accommodation } from '../../data/model/accommodation';

export const accommodation_list = async (req, res) => {
  try {
    const q = req.$query || {};
    const page   = Math.max(1, parseInt(String(q.page || '1'), 10));
    const limit  = Math.max(1, Math.min(100, parseInt(String(q.limit || '15'), 10)));
    const order  = String(q.order_by || 'id');
    const desc   = String(q.desc || 'true') === 'true';
    const keyword = (q.keyword || '').trim();
    const [rows, total] = await Promise.all([
      Accommodation.list(page, limit, order, desc, keyword),
      Accommodation.count(keyword),
    ]);
    return { ok: true, data: rows, total, page, limit };
  } catch (e) { return { ok: false, error: e.message }; }
};

export const accommodation_pick = async (req, res) => {
  try {
    const id = Number(req.$query.id || 0);
    if (!id) return { ok: false, error: 'invalid id' };
    const r = await Accommodation.pick(id);
    if (!r) return { ok: false, error: 'not found' };
    return { ok: true, data: r };
  } catch (e) { return { ok: false, error: e.message }; }
};

export const accommodation_create = async (req, res) => {
  try {
    const r = await Accommodation.create(req.$query);
    return { ok: true, data: r };
  } catch (e) { return { ok: false, error: e.message }; }
};
export const accommodation_update = async (req, res) => {
  try {
    const r = await Accommodation.update(req.$query);
    return { ok: true, data: r };
  } catch (e) { return { ok: false, error: e.message }; }
};
export const accommodation_delete = async (req, res) => {
  try {
    const id = Number(req.$query.id || 0);
    if (!id) return { ok: false, error: 'invalid id' };
    await Accommodation.delete(id);
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
};

export async function  accommodation_dashboard(req: Request, res: Response) {
  try {
    const stats = await Accommodation.getStats();
    return{ ok: true, total: stats.total, available_count: stats.available, unavailable_count: stats.unavailable };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};
