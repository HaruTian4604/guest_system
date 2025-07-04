import { Guest } from '../../data/model/guest';

export const guest_create = async (req, res) => {
  const r = await Guest.create(req.$query);
  return { ok: true, data: r };
};

export const guest_delete = async (req, res) => {
  const id = req.$query.id;
  await Guest.delete(id);
  return { ok: true };
};

export const guest_update = async (req, res) => {
  const r = await Guest.update(req.$query);
  return { ok: true, data: r };
};

export const guest_list = async (req, res) => {
  const q = req.$query;
  const r = await Guest.list(q.page, q.limit, q.order_by, q.desc, q.keyword);
  return { ok: true, data: r, total: await Guest.count() };
};

export const guest_pick = async (req, res) => {
  const q = req.$query;
  const r = await Guest.pick(q.id);
  return { ok: true, data: r };
};
