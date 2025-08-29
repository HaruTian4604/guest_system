import { Placement } from '../../data/model/placement';

export const placement_list_by_guest = async (req, res) => {
    try {
        const guestId = req.$query.placement_id;
        // 这里需要实现从数据库获取guest的placement历史
        // 暂时返回空数组，实际实现需要查询数据库
        return { ok: true, data: [] };
    } catch (error) {
        return { ok: false, error: error.message };
    }
};

export const placement_check_conflicts = async (req, res) => {
  try {
    const result = await Placement.checkConflicts(req.$query);
    return { ok: true, ...result };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};

export const placement_create = async (req, res) => {
  try {
    const r = await Placement.create(req.$query);
    return { ok: true, data: r };
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

    const page = parseInt(q.page) || 1;
    const limit = parseInt(q.limit) || 15;
    const desc = q.desc === 'true';
    const keyword = q.keyword;
    const r = await Placement.list(
      page,
      limit,
      q.order_by || 'id',
      desc,
      q.keyword
    );

    // const total = await Placement.count();
    const total = await Placement.count(keyword);
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


// placement.ts - 添加对应的控制器方法
export const placement_list_by_accommodation = async (req, res) => {
  try {
    const accommodationId = parseInt(req.$query.accommodation_id);
    const r = await Placement.listByAccommodation(accommodationId);
    return { ok: true, data: r };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};
