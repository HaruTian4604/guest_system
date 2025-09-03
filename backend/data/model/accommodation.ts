// backend/data/model/accommodation.ts
import type { RowDataPacket } from 'mysql2/promise';
import { Base } from './base';
import { get_connection } from '../../boot/database';
import { Invalid_argument } from '../../error/invalid_argument';

export class Accommodation extends Base {
  static tableName = 'accommodations';
  static viewName  = 'view_accommodations';

  // 关键词搜索字段
  static searchable = ['address', 'postcode','host'];

  // 可写字段（注意：不包含 status）
  // 若你的表里确实有 note 字段，可把 'note' 加进来
  static fillable   = ['address', 'postcode', 'host_id', 'archived'/*, 'note'*/];

  // 读取字段（前端表格/详情需要 host_name 与 status）
  static columns: string | string[] =
    'id, address, postcode, host_id, archived, status, host_name';

  static validate(row: any) {
    if ('address' in row) {
      const v = String(row.address || '').trim();
      if (!v) throw new Invalid_argument('address is required');
    }
    if ('postcode' in row) {
      const v = String(row.postcode || '').trim();
      if (!v) throw new Invalid_argument('postcode is required');
    }
    if ('host_id' in row) {
      const n = Number(row.host_id);
      if (!Number.isInteger(n) || n <= 0) throw new Invalid_argument('host_id is required');
    }
  }

 static async getStats(): Promise<{ available: number; unavailable: number; total: number }> {
    const conn = await get_connection();
    try {
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT
           SUM(CASE WHEN status = 'available'   COLLATE utf8mb4_0900_ai_ci THEN 1 ELSE 0 END) AS available,
           SUM(CASE WHEN status = 'unavailable' COLLATE utf8mb4_0900_ai_ci THEN 1 ELSE 0 END) AS unavailable,
           COUNT(*) AS total
         FROM view_accommodations
         WHERE archived = 0`
      );
      const r = (rows[0] || {}) as any;
      return {
        available: Number(r.available || 0),
        unavailable: Number(r.unavailable || 0),
        total: Number(r.total || 0),
      };
    } finally {
      conn.end();
    }
  }
}
