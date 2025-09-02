import { Base } from './base';
import { RowDataPacket } from 'mysql2/promise';
import { get_connection } from '../../boot/database';

export class Log extends Base {
  static table = 'operation_log';
  static searchable = ['operation_type', 'operator_name', 'operation_type', 'changes'];

  static async list(
    page = 1,
    limit = 15,
    order_by = 'operation_time',
    desc = true,
    keyword?: string
  ): Promise<any[]> {
    const conn = await get_connection();
    try {
      let query = `SELECT * FROM ${this.table}`;
      const params: any[] = [];

      if (keyword) {
        query += ` WHERE table_name LIKE ? OR operator_name LIKE ? OR operation_type LIKE ?`;
        params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
      }

      query += ` ORDER BY ${order_by} ${desc ? 'DESC' : 'ASC'}`;

      const offset = (page - 1) * limit;
      query += ` LIMIT ${limit} OFFSET ${offset}`;

      const [rows] = await conn.query<RowDataPacket[]>(query, params);

      // 解析JSON字段
      return rows.map(row => ({
        ...row,
        changes: typeof row.changes === 'string' ? JSON.parse(row.changes) : row.changes
      }));
    } finally {
      conn.end();
    }
  }

  static async count(keyword?: string): Promise<number> {
    const conn = await get_connection();
    try {
      let query = `SELECT COUNT(*) as count FROM ${this.table}`;
      const params: any[] = [];

      if (keyword) {
        query += ` WHERE table_name LIKE ? OR operator_name LIKE ? OR operation_type LIKE ?`;
        params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
      }

      const [rows] = await conn.query<RowDataPacket[]>(query, params);
      return rows[0].count as number;
    } finally {
      conn.end();
    }
  }
}
