import { Invalid_argument } from '../../error/invalid_argument';
import { Base } from './base';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { get_connection } from '../../boot/database';

export class Host extends Base {
  static tableName = 'hosts';
  static searchable: string[] = ['full_name'];
  static fillable: string[] = [ 'note','full_name'];
  static columns: string[] = ['id', 'full_name', 'note'];

  static validate(row: any) {
    if (row.full_name) {
      if (row.full_name.length < 2) {
        throw new Invalid_argument('Full name must be at least 2 characters long');
      }
      if (!/^[a-zA-Z\s\-']+$/.test(row.full_name)) {
        throw new Invalid_argument('Full name contains invalid characters');
      }
    }
  }

  static async getStats(): Promise<{ total: number, active_count: number }> {
    const conn = await get_connection();
    try {
      const [rows] = await conn.query<RowDataPacket[]>(`
        SELECT
          COUNT(*) AS total,
          COUNT(DISTINCT h.id) AS active_count
        FROM ${this.tableName} h
        LEFT JOIN accommodations a ON h.id = a.host_id
        LEFT JOIN placements p ON a.id = p.accommodation_id
          AND (p.end_date IS NULL OR p.end_date >= CURDATE())
        WHERE (h.archived = 0 OR h.archived IS NULL)
      `);
      return {
        total: rows[0].total,
        active_count: rows[0].active_count || 0
      };
    } finally {
      conn.end();
    }
  }

}
