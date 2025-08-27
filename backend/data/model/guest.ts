import { Invalid_argument } from '../../error/invalid_argument';
import { Base } from './base';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { get_connection } from '../../boot/database';
export class Guest extends Base {
  static tableName = 'guests';
  static searchable: string[] = ['full_name','status'];
static fillable: string[] = ['full_name', 'date_of_birth', 'status', 'note'];
  static statuses: string[] = ['placed', 'unplaced'];

  static validate(row: any) {

    if (row.full_name) {
      if (row.full_name.length < 2) {
        throw new Invalid_argument('Full name must be at least 2 characters long');
      }
      if (!/^[a-zA-Z\s\-']+$/.test(row.full_name)) {
        throw new Invalid_argument('Full name contains invalid characters');
      }
    }

    if (row.date_of_birth) {
      if (!/^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[012])-(19|20)\d\d$/.test(row.date_of_birth)) {
        throw new Invalid_argument('Date of birth must be in DD-MM-YYYY format');
      }
    }

    if (row.status && !this.statuses.includes(row.status)) {
      throw new Invalid_argument(`Status must be one of: ${this.statuses.join(', ')}`);
    }
  }

  static async getStats(): Promise<{ total: number, placed_count: number, unplaced_count: number }> {
  const conn = await get_connection();
  try {
    const [rows] = await conn.query<RowDataPacket[]>(`
      SELECT
        COUNT(*) AS total,
        SUM(status = 'placed') AS placed_count,
        SUM(status = 'unplaced') AS unplaced_count
      FROM ${this.tableName}
       WHERE archived = 0 OR archived IS NULL
    `);
    return {
      total: rows[0].total,
      placed_count: rows[0].placed_count || 0,
      unplaced_count: rows[0].unplaced_count || 0
    };
  } finally {
    conn.end();
  }
}
}
