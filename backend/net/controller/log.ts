import { Log } from '../../data/model/log';

export const log_list = async (req, res) => {
  try {
    const q = req.$query;

    const page = parseInt(q.page) || 1;
    const limit = parseInt(q.limit) || 15;
    const desc = q.desc !== 'false'; // 默认降序
    const keyword = q.keyword;

    const rows = await Log.list(page, limit, 'operation_time', desc, keyword);
    const total = await Log.count(keyword);

    return { ok: true, data: rows, total };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};
