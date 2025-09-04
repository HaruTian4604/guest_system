// backend/data/model/guest.ts
import type { RowDataPacket, Connection } from 'mysql2/promise';
import { Base } from './base';
import { get_connection } from '../../boot/database';
import { Invalid_argument } from '../../error/invalid_argument';

export class Guest extends Base {
  static tableName = 'guests';
  static viewName = 'view_guests';

  static searchable = ['full_name'];

  static fillable = ['full_name', 'date_of_birth', 'note', 'archived'];

  static columns: string | string[] =
    'id, full_name, date_of_birth, note, archived,status';

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
        placed: Number(r.placed || 0),
        unplaced: Number(r.unplaced || 0),
        total: Number(r.total || 0),
      };
    } finally {
      conn.end();
    }
  }

}
