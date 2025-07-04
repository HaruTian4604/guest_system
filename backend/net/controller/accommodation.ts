import { Accommodation } from '../../data/model/accommodation';

export const accommodation_create = async (req, res) => {
  const r = await Accommodation.create(req.$query);
  return { ok: true, data: r };
};

export const accommodation_delete = async (req, res) => {
  const id = req.$query.id;
  await Accommodation.delete(id);
  return { ok: true };
};

export const accommodation_update = async (req, res) => {
  const r = await Accommodation.update(req.$query);
  return { ok: true, data: r };
};

export const accommodation_list = async (req, res) => {
  const q = req.$query;
  const r = await Accommodation.list(q.page, q.limit, q.order_by, q.desc, q.keyword);
  return { ok: true, data: r, total: await Accommodation.count() };
};

export const accommodation_pick = async (req, res) => {
  const q = req.$query;
  const r = await Accommodation.pick(q.id);
  return { ok: true, data: r };
};
