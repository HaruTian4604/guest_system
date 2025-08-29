import { Base } from './base';
import { Invalid_argument } from '../../error/invalid_argument';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { get_connection } from '../../boot/database';

export class Accommodation extends Base {
  static tableName = 'accommodations';
  static searchable: string[] = ['address', 'postcode', 'status'];
  static fillable: string[] = ['address', 'postcode', 'host_id', 'status'];
  static statuses: string[] = ['available', 'unavailable'];

  static validate(row: any) {
    if (!row.address) {
      throw new Invalid_argument('Address is required');
    }

    if (!row.postcode) {
      throw new Invalid_argument('Postcode is required');
    }

    if (!row.host_id) {
      throw new Invalid_argument('Host ID is required');
    }

    if (row.status && !this.statuses.includes(row.status)) {
      throw new Invalid_argument(`Status must be one of: ${this.statuses.join(', ')}`);
    }

    // UK postcode validation (basic)
    if (row.postcode && !/^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i.test(row.postcode)) {
      throw new Invalid_argument('Please enter a valid UK postcode');
    }
  }

  static async getStats(): Promise<{ total: number, available_count: number, unavailable_count: number }> {
    const conn = await get_connection();
    try {
      const [rows] = await conn.query<RowDataPacket[]>(`
        SELECT
          COUNT(*) AS total,
          SUM(status = 'available') AS available_count,
          SUM(status = 'unavailable') AS unavailable_count
        FROM ${this.tableName}
        WHERE archived = 0 OR archived IS NULL
      `);
      return {
        total: rows[0].total,
        available_count: rows[0].available_count || 0,
        unavailable_count: rows[0].unavailable_count || 0
      };
    } finally {
      conn.end();
    }
  }

  // 获取特定host的所有accommodation
  static async listByHost(hostId: number): Promise<any[]> {
    const conn = await get_connection();
    try {
      const [rows] = await conn.query<RowDataPacket[]>(`
        SELECT a.*, h.full_name as host_name
        FROM ${this.tableName} a
        LEFT JOIN hosts h ON a.host_id = h.id
        WHERE a.host_id = ?
        ORDER BY a.address
      `, [hostId]);

      return rows;
    } finally {
      conn.end();
    }
  }
}
