// import { Invalid_argument } from '../../error/invalid_argument';
// import { Base } from './base';
// import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
// import { get_connection } from '../../boot/database';
// export class Guest extends Base {
//   static tableName = 'guests';
//   static searchable: string[] = ['full_name', 'status'];
//   static fillable: string[] = ['full_name', 'date_of_birth', 'status', 'note'];
//   static statuses: string[] = ['placed', 'unplaced'];

//   static validate(row: any) {

//     if (row.full_name) {
//       if (row.full_name.length < 2) {
//         throw new Invalid_argument('Full name must be at least 2 characters long');
//       }
//       if (!/^[a-zA-Z\s\-']+$/.test(row.full_name)) {
//         throw new Invalid_argument('Full name contains invalid characters');
//       }
//     }

//     if (row.date_of_birth) {
//       // if (!/^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[012])-(19|20)\d\d$/.test(row.date_of_birth)) {
//       //   throw new Invalid_argument('Date of birth must be in DD-MM-YYYY format');
//       // }
//       if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date_of_birth)) {
//         throw new Invalid_argument('Date of birth must be in YYYY-MM-DD format');
//       }
//     }

//     // if (row.status && !this.statuses.includes(row.status)) {
//     //   throw new Invalid_argument(`Status must be one of: ${this.statuses.join(', ')}`);
//     // }
//   }

//   static async getStats(): Promise<{ total: number, placed_count: number, unplaced_count: number }> {
//     const conn = await get_connection();
//     try {
//       const [rows] = await conn.query<RowDataPacket[]>(`
//       SELECT
//         COUNT(*) AS total,
//         SUM(status = 'placed') AS placed_count,
//         SUM(status = 'unplaced') AS unplaced_count
//       FROM ${this.tableName}
//        WHERE archived = 0 OR archived IS NULL
//     `);
//       return {
//         total: rows[0].total,
//         placed_count: rows[0].placed_count || 0,
//         unplaced_count: rows[0].unplaced_count || 0
//       };
//     } finally {
//       conn.end();
//     }
//   }
// }
// backend/data/model/guest.ts
import type { RowDataPacket, Connection } from 'mysql2/promise';
import { Base } from './base';
import { get_connection } from '../../boot/database';
import { Invalid_argument } from '../../error/invalid_argument';

export class Guest extends Base {
  static tableName = 'guests';
  // 新增：读取走视图（前面 Base 已支持）
  static viewName  = 'view_guests';

  // 搜索字段（关键词查询会用到）
  static searchable = ['full_name'];

  // 允许写入/更新的字段（不包含 status）
  static fillable   = ['full_name', 'date_of_birth', 'note', 'archived'];

  // 读取字段（返回给前端）；包含视图中的 status
  static columns: string | string[] =
    'id, full_name, date_of_birth, note, archived, status';

  /**
   * 字段校验（最小化）：
   * - full_name 允许在 update 中缺省，但出现时需非空
   * - date_of_birth 必须是 YYYY-MM-DD（MySQL DATE）
   * - 忽略 status（未列在 fillable）
   */
  static validate(row: any) {
    if ('full_name' in row) {
      const name = String(row.full_name || '').trim();
      if (!name) throw new Invalid_argument('full_name is required');
    }
    if ('date_of_birth' in row) {
      const dob = String(row.date_of_birth || '');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
        throw new Invalid_argument('date_of_birth must be YYYY-MM-DD');
      }
    }
  }

  /**
   * Dashboard 统计
   */
static async getStats(): Promise<{ placed: number; unplaced: number; total: number }> {
  const conn = await get_connection();
  try {
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT
         SUM(CASE WHEN status = 'placed' COLLATE utf8mb4_0900_ai_ci THEN 1 ELSE 0 END) AS placed,
         SUM(CASE WHEN status = 'unplaced' COLLATE utf8mb4_0900_ai_ci THEN 1 ELSE 0 END) AS unplaced,
         COUNT(*) AS total
       FROM view_guests
       WHERE archived = 0`
    );
    const r = rows[0] || {} as any;
    return {
      placed:   Number(r.placed || 0),
      unplaced: Number(r.unplaced || 0),
      total:    Number(r.total || 0),
    };
  } finally {
    conn.end();
  }
}

}
