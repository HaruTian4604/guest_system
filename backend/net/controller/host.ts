import { Host } from '../../data/model/host';

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
    const r = await Host.list(
      parseInt(q.page) || 1,
      parseInt(q.limit) || 15,
      q.order_by || 'id',
      q.desc === 'true',
      q.keyword
    );
    const total = await Host.count();
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
