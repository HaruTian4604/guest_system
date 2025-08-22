import { Guest } from '../../data/model/guest';

export const guest_create = async (req, res) => {
  try {
    const r = await Guest.create(req.$query);
    return { ok: true, data: r };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};

export const guest_delete = async (req, res) => {
  try {
    const id = req.$query.id;
    await Guest.delete(id);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};

export const guest_update = async (req, res) => {
  try {
    const r = await Guest.update(req.$query);
    return { ok: true, data: r };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};

export const guest_list = async (req, res) => {
  try {
    const q = req.$query;

    const page = parseInt(q.page) || 1;
    const limit = parseInt(q.limit) || 15;
    const desc = q.desc === 'true';
    const keyword = q.keyword;
    const r = await Guest.list(
      page,
      limit,
      q.order_by || 'id',
      desc,
      q.keyword
    );

    // const total = await Guest.count();
    const total = await Guest.count(keyword);
    return { ok: true, data: r, total };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};

export const guest_pick = async (req, res) => {
  try {
    const q = req.$query;
    const r = await Guest.pick(q.id);
    return { ok: true, data: r };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};

export const guest_stats = async (req, res) => {
  try {
    const stats = await Guest.getStats();
    return { ok: true, ...stats };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};
