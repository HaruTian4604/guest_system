import { RowDataPacket } from 'mysql2';
import { Host } from '../../data/model/host';
import { get_connection } from '../../boot/database';

export const host_create = async (req, res) => {
  try {
    const r = await Host.create(req.$query);
    return { ok: true, data: r };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};

export const host_delete = async (req, res) => {
  try {
    const id = req.$query.id;
    await Host.delete(id);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};

export const host_update = async (req, res) => {
  try {
    const r = await Host.update(req.$query);
    return { ok: true, data: r };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};

export const host_list = async (req, res) => {
  try {
    const q = req.$query;

    const page = parseInt(q.page) || 1;
    const limit = parseInt(q.limit) || 15;
    const desc = q.desc === 'true';
    const keyword = q.keyword;
    const r = await Host.list(
      page,
      limit,
      q.order_by || 'id',
      desc,
      keyword
    );

    const total = await Host.count(keyword);
    return { ok: true, data: r, total };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};

export const host_pick = async (req, res) => {
  try {
    const q = req.$query;
    const r = await Host.pick(q.id);
    return { ok: true, data: r };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};

export const host_dashboard = async (req, res) => {
  try {
    const stats = await Host.getStats();
    return { ok: true, ...stats };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};

export const host_list_by_accommodation = async (req, res) => {
  try {
    const hostId = req.$query.host_id;
    const conn = await get_connection();

    const [rows] = await conn.query<RowDataPacket[]>(`
      SELECT
        a.id,
        a.address,
        a.postcode,
        a.status,
        COUNT(p.id) AS active_placements
      FROM accommodations a
      LEFT JOIN placements p ON a.id = p.accommodation_id
        AND (p.end_date IS NULL OR p.end_date >= CURDATE())
      WHERE a.host_id = ? AND (a.archived = 0 OR a.archived IS NULL)
      GROUP BY a.id
      ORDER BY a.id DESC
    `, [hostId]);

    conn.end();
    return { ok: true, data: rows };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};
