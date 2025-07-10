import { Accommodation } from '../../data/model/accommodation';

export const accommodation_create = async (req, res) => {
  try {
    const r = await Accommodation.create(req.$query);
    return { ok: true, data: r };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};

export const accommodation_archive = async (req, res) => {
  try {
    const id = req.$query.id;
    await Accommodation.archive(id);
    return { ok: true };
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
    const r = await Accommodation.list(
      parseInt(q.page) || 1,
      parseInt(q.limit) || 15,
      q.order_by || 'id',
      q.desc === 'true',
      q.keyword
    );
    const total = await Accommodation.count();
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
