import { Accommodation } from '../../data/model/accommodation';

export const accommodation_create = async (req, res) => {
  try {
    const r = await Accommodation.create(req.$query);
    return { ok: true, data: r };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};

export const accommodation_delete = async (req, res) => {
  try {
    const id = req.$query.id;
    await Accommodation.delete(id);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};

export const accommodation_update = async (req, res) => {
  try {
    const r = await Accommodation.update(req.$query);
    return { ok: true, data: r };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};

export const accommodation_list = async (req, res) => {
  try {
    const q = req.$query;

    const page = parseInt(q.page) || 1;
    const limit = parseInt(q.limit) || 15;
    const desc = q.desc === 'true';
    const keyword = q.keyword;
    const r = await Accommodation.list(
      page,
      limit,
      q.order_by || 'id',
      desc,
      q.keyword
    );

    const total = await Accommodation.count(keyword);
    return { ok: true, data: r, total };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};

export const accommodation_pick = async (req, res) => {
  try {
    const q = req.$query;
    const r = await Accommodation.pick(q.id);
    return { ok: true, data: r };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};

export const accommodation_stats = async (req, res) => {
  try {
    const stats = await Accommodation.getStats();
    return { ok: true, ...stats };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};

export const accommodation_list_by_host = async (req, res) => {
  try {
    const hostId = parseInt(req.$query.host_id);
    const r = await Accommodation.listByHost(hostId);
    return { ok: true, data: r };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};
