// backend/data/model/placement.ts
import type { RowDataPacket } from 'mysql2/promise';
import { Base } from './base';
import { get_connection } from '../../boot/database';
import { Invalid_argument } from '../../error/invalid_argument';

export class Placement extends Base {
  static tableName = 'placements';
  static viewName = 'view_placements';

  static searchable = ['guest_name', 'host_name', 'accommodation_address', 'accommodation_postcode'];

  static fillable = ['guest_id', 'host_id', 'accommodation_id', 'start_date', 'end_date', 'archived'/*, 'note'*/];

  static columns: string | string[] =
    'id, guest_id, guest_name, host_id, host_name, accommodation_id, accommodation_address, accommodation_postcode, start_date, end_date, archived, status';

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

    if (row.start_date && row.end_date) {
      if (row.end_date < row.start_date) {
        throw new Invalid_argument('end_date cannot be earlier than start_date');
      }
    }
  }

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

      if (!start || !guestId || !accId) return;

      const endExpr = end ?? '9999-12-31';

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
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end   = new Date(start.getFullYear(), start.getMonth() + 12, 1);

    const ymKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    const months: Array<{ month: string; count: number }> = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      months.push({ month: ymKey(d), count: 0 });
    }

    const conn = await get_connection();
    try {
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
