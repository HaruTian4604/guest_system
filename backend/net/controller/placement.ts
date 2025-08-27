export const placement_list_by_guest = async (req, res) => {
    try {
        const guestId = req.$query.guest_id;
        // 这里需要实现从数据库获取guest的placement历史
        // 暂时返回空数组，实际实现需要查询数据库
        return { ok: true, data: [] };
    } catch (error) {
        return { ok: false, error: error.message };
    }
};
