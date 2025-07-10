import { Placement } from '../../data/model/placement';

export const placement_create = async (req, res) => {
    try {
        const r = await Placement.create(req.$query);
        return { ok: true, data: r };
    } catch (error) {
        return { ok: false, error: error.message };
    }
};

export const placement_archive = async (req, res) => {
  try {
    const id = req.$query.id;
    await Placement.archive(id);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};

export const placement_delete = async (req, res) => {
    try {
        const id = req.$query.id;
        await Placement.delete(id);
        return { ok: true };
    } catch (error) {
        return { ok: false, error: error.message };
    }
};

export const placement_update = async (req, res) => {
    try {
        const r = await Placement.update(req.$query);
        return { ok: true, data: r };
    } catch (error) {
        return { ok: false, error: error.message };
    }
};

export const placement_list = async (req, res) => {
    try {
        const q = req.$query;

        const r = await Placement.list(
          parseInt(q.page) || 1,
          parseInt(q.limit) || 15,
          q.order_by || 'id',
          q.desc === 'true',
          q.keyword
        );

        // const page = parseInt(q.page) || 1;
        // const limit = parseInt(q.limit) || 15;
        // const desc = q.desc === 'true';

        // const r = await Placement.list(
        //     page,
        //     limit,
        //     q.order_by || 'id',
        //     desc,
        //     q.keyword
        // );
        const total = await Placement.count();
        return { ok: true, data: r, total };
    } catch (error) {
        return { ok: false, error: error.message };
    }
};

export const placement_pick = async (req, res) => {
    try {
        const q = req.$query;
        const r = await Placement.pick(q.id);
        return { ok: true, data: r };
    } catch (error) {
        return { ok: false, error: error.message };
    }
};
