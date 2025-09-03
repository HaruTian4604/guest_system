// backend/data/model/placement.ts
import type { RowDataPacket } from 'mysql2/promise';
import { Base } from './base';
import { get_connection } from '../../boot/database';
import { Invalid_argument } from '../../error/invalid_argument';

export class Placement extends Base {
  static tableName = 'placements';
  static viewName = 'view_placements';

  // 关键字搜索支持（走视图列名即可）
  static searchable = ['guest_name', 'host_name', 'accommodation_address', 'accommodation_postcode'];

  // 写入列（不含 status；状态由视图计算）
  static fillable = ['guest_id', 'host_id', 'accommodation_id', 'start_date', 'end_date', 'archived'/*, 'note'*/];

  // 读取列（供列表/详情使用）
  static columns: string | string[] =
    'id, guest_id, guest_name, host_id, host_name, accommodation_id, accommodation_address, accommodation_postcode, start_date, end_date, archived, status';

  // 最小校验：字段存在时才校验；start/end 为 YYYY-MM-DD；end >= start
  static validate(row: any) {
    const ymd = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));
    if ('guest_id' in row && !(+row.guest_id > 0)) throw new Invalid_argument('guest_id is required');
    if ('host_id' in row && !(+row.host_id > 0)) throw new Invalid_argument('host_id is required');
    if ('accommodation_id' in row && !(+row.accommodation_id > 0)) throw new Invalid_argument('accommodation_id is required');

    if ('start_date' in row) {
      if (!ymd(row.start_date)) throw new Invalid_argument('start_date must be YYYY-MM-DD');
    }
    if ('end_date' in row && row.end_date !== null && row.end_date !== '') {
      if (!ymd(row.end_date)) throw new Invalid_argument('end_date must be YYYY-MM-DD');
    }

    // 若两者都给了：end >= start
    if (row.start_date && row.end_date) {
      if (row.end_date < row.start_date) {
        throw new Invalid_argument('end_date cannot be earlier than start_date');
      }
    }
  }

  // 可选：按 accommodation 拉取（供 accommodation-detail 用）
  static async listByAccommodation(accommodation_id: number) {
    const conn = await get_connection();
    try {
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT ${this._selectColumns()}
           FROM ${this._readFrom()}
          WHERE archived = 0 AND accommodation_id = ?
          ORDER BY start_date DESC, id DESC`, [accommodation_id]
      );
      return rows;
    } finally {
      conn.end();
    }
  }

  // 在 export class Placement 内新增：
  static async listByGuest(guest_id: number) {
    const conn = await get_connection();
    try {
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT ${this._selectColumns()}
         FROM ${this._readFrom()}
        WHERE archived = 0 AND guest_id = ?
        ORDER BY start_date DESC, id DESC`,
        [guest_id]
      );
      return rows;
    } finally {
      conn.end();
    }
  }

  static async assertNoOverlap(row: any, selfId?: number) {
    const conn = await get_connection();
    try {
      const start = row.start_date;
      const end = row.end_date ?? null;
      const guestId = row.guest_id;
      const accId = row.accommodation_id;

      // 仅在关键字段存在时做检查
      if (!start || !guestId || !accId) return;

      const endExpr = end ?? '9999-12-31';

      // 同 guest 的重叠
      const [g] = await conn.query<RowDataPacket[]>(
        `SELECT 1 FROM placements p
          WHERE p.archived=0
            AND p.guest_id=?
            ${selfId ? 'AND p.id<>?' : ''}
            AND NOT (
              COALESCE(?, '9999-12-31') < p.start_date OR
              COALESCE(p.end_date, '9999-12-31') < ?
            )
          LIMIT 1`,
        selfId ? [guestId, selfId, end, start] : [guestId, end, start]
      );
      if (g.length) throw new Invalid_argument('Overlapping placement for this guest');

      // 同 accommodation 的重叠
      const [a] = await conn.query<RowDataPacket[]>(
        `SELECT 1 FROM placements p
          WHERE p.archived=0
            AND p.accommodation_id=?
            ${selfId ? 'AND p.id<>?' : ''}
            AND NOT (
              COALESCE(?, '9999-12-31') < p.start_date OR
              COALESCE(p.end_date, '9999-12-31') < ?
            )
          LIMIT 1`,
        selfId ? [accId, selfId, end, start] : [accId, end, start]
      );
      if (a.length) throw new Invalid_argument('Overlapping placement for this accommodation');

    } finally {
      conn.end();
    }
  }

  // ==== 覆盖 create/update，注入预检查 ====
  static async create(row: any) {
    this.validate(row);
    await this.assertNoOverlap(row);
    return await super.create(row);
  }

  static async update(row: any) {
    this.validate(row);
    const selfId = Number(row.id || 0) || undefined;
    await this.assertNoOverlap(row, selfId);
    return await super.update(row);
  }

  static async getEndingsNext12Months(): Promise<Array<{ month: string; count: number }>> {
    // 生成 [当前月1号, ... 未来第11个月1号] 共 12 个
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end   = new Date(start.getFullYear(), start.getMonth() + 12, 1);

    const ymKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    // 先做一个“月份骨架”
    const months: Array<{ month: string; count: number }> = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      months.push({ month: ymKey(d), count: 0 });
    }

    const conn = await get_connection();
    try {
      // 数据库内按 YYYY-MM 聚合
      const [rows] = await conn.query<RowDataPacket[]>(
        `
          SELECT DATE_FORMAT(end_date, '%Y-%m') AS ym, COUNT(*) AS cnt
          FROM placements
          WHERE end_date IS NOT NULL
            AND end_date >= ?
            AND end_date <  ?
          GROUP BY ym
          ORDER BY ym
        `,
        [ start, end ]
      );

      // 把 DB 结果写回到骨架中
      const map = new Map<string, number>();
      for (const r of rows) {
        map.set(String((r as any).ym), Number((r as any).cnt || 0));
      }
      for (const m of months) {
        if (map.has(m.month)) m.count = map.get(m.month)!;
      }

      return months;
    } finally {
      conn.end();
    }
  }
}

// import { Invalid_argument } from '../../error/invalid_argument';
// import { Base } from './base';
// import { Connection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
// import { get_connection } from '../../boot/database';

// export class Placement extends Base {
//   static tableName = 'placements';
//   static searchable: string[] = ['guest_id', 'host_id', 'accommodation_id'];
//   static fillable: string[] = ['guest_id', 'host_id', 'accommodation_id', 'start_date', 'end_date'];
//   static columns = [
//     'p.*',
//     'g.full_name as guest_name',
//     'g.date_of_birth as guest_dob',
//     'a.address as accommodation_address',
//     'a.postcode as accommodation_postcode',
//     'h.full_name as host_name'
//   ];

//   static validate(row: any) {
//     if (row.guest_id && !/^\d+$/.test(row.guest_id)) {
//       throw new Invalid_argument('Guest ID must be a number');
//     }

//     if (row.host_id && !/^\d+$/.test(row.host_id)) {
//       throw new Invalid_argument('Host ID must be a number');
//     }

//     if (row.accommodation_id && !/^\d+$/.test(row.accommodation_id)) {
//       throw new Invalid_argument('Accommodation ID must be a number');
//     }

//     if (row.start_date) {
//       if (!/^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[012])-(19|20)\d\d$/.test(row.start_date)) {
//         throw new Invalid_argument('Start date must be in DD-MM-YYYY format');
//       }
//     }

//     if (row.end_date) {
//       if (!/^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[012])-(19|20)\d\d$/.test(row.end_date)) {
//         throw new Invalid_argument('End date must be in DD-MM-YYYY format');
//       }

//       // 确保结束日期不早于开始日期
//       if (row.start_date) {
//         const [startDay, startMonth, startYear] = row.start_date.split('-').map(Number);
//         const [endDay, endMonth, endYear] = row.end_date.split('-').map(Number);

//         const startDate = new Date(startYear, startMonth - 1, startDay);
//         const endDate = new Date(endYear, endMonth - 1, endDay);

//         if (endDate < startDate) {
//           throw new Invalid_argument('End date cannot be earlier than start date');
//         }
//       }
//     }
//   }

//   // 检查日期冲突
//   static async checkConflicts(guestId: number, accommodationId: number, startDate: string, endDate: string, excludeId?: number): Promise<boolean> {
//     const conn = await get_connection();
//     try {
//       let query = `
//         SELECT COUNT(*) as count
//         FROM placements
//         WHERE (guest_id = ? OR accommodation_id = ?)
//         AND archived = 0
//         AND (
//           (start_date <= ? AND (end_date IS NULL OR end_date >= ?))
//           OR (start_date <= ? AND (end_date IS NULL OR end_date >= ?))
//           OR (start_date >= ? AND (end_date IS NULL OR end_date <= ?))
//         )
//       `;

//       const params: any[] = [guestId, accommodationId, startDate, startDate, endDate, endDate, startDate, endDate];

//       if (excludeId) {
//         query += ' AND id != ?';
//         params.push(excludeId);
//       }

//       const [rows] = await conn.query<RowDataPacket[]>(query, params);
//       return rows[0].count > 0;
//     } finally {
//       conn.end();
//     }
//   }

//   // 获取统计数据
//   static async getStats(): Promise<{ total: number, active_count: number, completed_count: number }> {
//     const conn = await get_connection();
//     try {
//       const [rows] = await conn.query<RowDataPacket[]>(`
//         SELECT
//           COUNT(*) AS total,
//           SUM(
//             (end_date IS NULL OR STR_TO_DATE(end_date, '%d-%m-%Y') >= CURDATE())
//             AND STR_TO_DATE(start_date, '%d-%m-%Y') <= CURDATE()
//           ) AS active_count,
//           SUM(
//             end_date IS NOT NULL AND STR_TO_DATE(end_date, '%d-%m-%Y') < CURDATE()
//           ) AS completed_count
//         FROM placements
//         WHERE archived = 0 OR archived IS NULL
//       `);

//       return {
//         total: rows[0].total,
//         active_count: rows[0].active_count || 0,
//         completed_count: rows[0].completed_count || 0
//       };
//     } finally {
//       conn.end();
//     }
//   }

//   // 重写list方法以支持关联查询
//   static async list(
//     page = 1,
//     limit = 15,
//     order_by = 'id',
//     desc = false,
//     keyword?: string
//   ): Promise<any[]> {
//     const conn = await get_connection();
//     try {
//       let sql = `
//         SELECT ${this.columns.join(', ')}
//         FROM placements p
//         LEFT JOIN guests g ON p.guest_id = g.id
//         LEFT JOIN accommodations a ON p.accommodation_id = a.id
//         LEFT JOIN hosts h ON p.host_id = h.id
//         WHERE p.archived = 0
//       `;

//       const params: any[] = [];

//       if (keyword) {
//         sql += ` AND (g.full_name LIKE ? OR a.address LIKE ? OR h.full_name LIKE ?)`;
//         const likeKeyword = `%${keyword}%`;
//         params.push(likeKeyword, likeKeyword, likeKeyword);
//       }

//       sql += ` ORDER BY p.${this._ensureOrderBy(order_by)} ${desc ? 'DESC' : 'ASC'}`;
//       const offset = (page - 1) * limit;
//       sql += ` LIMIT ? OFFSET ?`;
//       params.push(limit, offset);

//       const [rows] = await conn.query<RowDataPacket[]>(sql, params);

//       // 添加状态计算
//       return rows.map(row => ({
//         ...row,
//         status: this.calculateStatus(row.start_date, row.end_date)
//       }));
//     } finally {
//       conn.end();
//     }
//   }

//   // 重写pick方法以支持关联查询
//   static async pick(id: number, conn?: Connection): Promise<any> {
//     const useExternalConn = !!conn;
//     const c = conn || await get_connection();

//     try {
//       const [rows] = await c.query<RowDataPacket[]>(`
//         SELECT ${this.columns.join(', ')}
//         FROM placements p
//         LEFT JOIN guests g ON p.guest_id = g.id
//         LEFT JOIN accommodations a ON p.accommodation_id = a.id
//         LEFT JOIN hosts h ON p.host_id = h.id
//         WHERE p.id = ? AND (p.archived = 0 OR p.archived IS NULL)
//       `, [id]);

//       if (rows.length === 0) return null;

//       const row = rows[0];
//       return {
//         ...row,
//         status: this.calculateStatus(row.start_date, row.end_date)
//       };
//     } finally {
//       if (!useExternalConn) c.end();
//     }
//   }

//   // 计算状态
//   static calculateStatus(startDate: string, endDate: string): string {
//     if (!startDate) return 'unknown';

//     const today = new Date();
//     const [startDay, startMonth, startYear] = startDate.split('-').map(Number);
//     const start = new Date(startYear, startMonth - 1, startDay);

//     if (endDate) {
//       const [endDay, endMonth, endYear] = endDate.split('-').map(Number);
//       const end = new Date(endYear, endMonth - 1, endDay);
//       return end < today ? 'completed' : 'active';
//     }

//     return start <= today ? 'active' : 'scheduled';
//   }

//   // 重写create方法以包含状态更新逻辑
//   static async create(row: any): Promise<any> {
//     this.validate(row);

//     // 检查冲突
//     const hasConflict = await this.checkConflicts(
//       row.guest_id,
//       row.accommodation_id,
//       row.start_date,
//       row.end_date
//     );

//     if (hasConflict) {
//       throw new Invalid_argument('Date conflict detected with existing placement');
//     }

//     return await this._withTx(async (conn) => {
//       // 创建placement
//       const result = await super.create.call(this, row, conn);

//       // 更新guest状态
//       await this._updateGuestStatus(row.guest_id, conn);

//       // 更新accommodation状态
//       await this._updateAccommodationStatus(row.accommodation_id, conn);

//       return result;
//     });
//   }

//   // 重写update方法以包含状态更新逻辑
//   static async update(partial: any): Promise<any> {
//     if (!partial.id) {
//       throw new Invalid_argument('ID parameter is required');
//     }
//     this.validate(partial);

//     // 检查冲突（排除当前记录）
//     if (partial.start_date || partial.end_date || partial.guest_id || partial.accommodation_id) {
//       const existing = await this.pick(partial.id);
//       const guestId = partial.guest_id || existing.guest_id;
//       const accommodationId = partial.accommodation_id || existing.accommodation_id;
//       const startDate = partial.start_date || existing.start_date;
//       const endDate = partial.end_date || existing.end_date;

//       const hasConflict = await this.checkConflicts(
//         guestId,
//         accommodationId,
//         startDate,
//         endDate,
//         partial.id
//       );

//       if (hasConflict) {
//         throw new Invalid_argument('Date conflict detected with existing placement');
//       }
//     }

//     return await this._withTx(async (conn) => {
//       const before = await this.pick(partial.id, conn);
//       const result = await super.update.call(this, partial, conn);

//       // 如果guest_id变化，更新两个guest的状态
//       if (partial.guest_id && before.guest_id !== partial.guest_id) {
//         await this._updateGuestStatus(before.guest_id, conn);
//         await this._updateGuestStatus(partial.guest_id, conn);
//       } else if (partial.guest_id || partial.start_date || partial.end_date) {
//         await this._updateGuestStatus(partial.guest_id || before.guest_id, conn);
//       }

//       // 如果accommodation_id变化，更新两个accommodation的状态
//       if (partial.accommodation_id && before.accommodation_id !== partial.accommodation_id) {
//         await this._updateAccommodationStatus(before.accommodation_id, conn);
//         await this._updateAccommodationStatus(partial.accommodation_id, conn);
//       } else if (partial.accommodation_id || partial.start_date || partial.end_date) {
//         await this._updateAccommodationStatus(partial.accommodation_id || before.accommodation_id, conn);
//       }

//       return result;
//     });
//   }

//   // 重写delete方法以包含状态更新逻辑
//   static async delete(id: number): Promise<void> {
//     if (!id) {
//       throw new Invalid_argument('ID parameter is required');
//     }

//     await this._withTx(async (conn) => {
//       const placement = await this.pick(id, conn);

//       // 删除placement
//       await super.delete.call(this, id, conn);

//       // 更新guest状态
//       await this._updateGuestStatus(placement.guest_id, conn);

//       // 更新accommodation状态
//       await this._updateAccommodationStatus(placement.accommodation_id, conn);
//     });
//   }

//   // 辅助方法：更新guest状态
//   private static async _updateGuestStatus(guestId: number, conn: Connection): Promise<void> {
//     const [rows] = await conn.query<RowDataPacket[]>(`
//       SELECT COUNT(*) as active_placements
//       FROM placements
//       WHERE guest_id = ?
//       AND archived = 0
//       AND (end_date IS NULL OR STR_TO_DATE(end_date, '%d-%m-%Y') >= CURDATE())
//     `, [guestId]);

//     const status = rows[0].active_placements > 0 ? 'placed' : 'unplaced';

//     await conn.query(`
//       UPDATE guests
//       SET status = ?
//       WHERE id = ? AND (archived = 0 OR archived IS NULL)
//     `, [status, guestId]);
//   }

//   // 辅助方法：更新accommodation状态
//   private static async _updateAccommodationStatus(accommodationId: number, conn: Connection): Promise<void> {
//     const [rows] = await conn.query<RowDataPacket[]>(`
//       SELECT COUNT(*) as active_placements
//       FROM placements
//       WHERE accommodation_id = ?
//       AND archived = 0
//       AND (end_date IS NULL OR STR_TO_DATE(end_date, '%d-%m-%Y') >= CURDATE())
//     `, [accommodationId]);

//     const status = rows[0].active_placements > 0 ? 'unavailable' : 'available';

//     await conn.query(`
//       UPDATE accommodations
//       SET status = ?
//       WHERE id = ? AND (archived = 0 OR archived IS NULL)
//     `, [status, accommodationId]);
//   }

//   // 获取关联guest的placements
//   static async listByGuest(guestId: number): Promise<any[]> {
//     const conn = await get_connection();
//     try {
//       const [rows] = await conn.query<RowDataPacket[]>(`
//         SELECT ${this.columns.join(', ')}
//         FROM placements p
//         LEFT JOIN guests g ON p.guest_id = g.id
//         LEFT JOIN accommodations a ON p.accommodation_id = a.id
//         LEFT JOIN hosts h ON p.host_id = h.id
//         WHERE p.guest_id = ? AND (p.archived = 0 OR p.archived IS NULL)
//         ORDER BY p.start_date DESC
//       `, [guestId]);

//       return rows.map(row => ({
//         ...row,
//         status: this.calculateStatus(row.start_date, row.end_date)
//       }));
//     } finally {
//       conn.end();
//     }
//   }

//   // 获取关联accommodation的placements
//   static async listByAccommodation(accommodationId: number): Promise<any[]> {
//     const conn = await get_connection();
//     try {
//       const [rows] = await conn.query<RowDataPacket[]>(`
//         SELECT ${this.columns.join(', ')}
//         FROM placements p
//         LEFT JOIN guests g ON p.guest_id = g.id
//         LEFT JOIN accommodations a ON p.accommodation_id = a.id
//         LEFT JOIN hosts h ON p.host_id = h.id
//         WHERE p.accommodation_id = ? AND (p.archived = 0 OR p.archived IS NULL)
//         ORDER BY p.start_date DESC
//       `, [accommodationId]);

//       return rows.map(row => ({
//         ...row,
//         status: this.calculateStatus(row.start_date, row.end_date)
//       }));
//     } finally {
//       conn.end();
//     }
//   }
// }
