import { Base } from './base';
import { Invalid_argument } from '../../error/invalid_argument';
import { get_connection } from '../../boot/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

export class Placement extends Base {
  static table = 'placements';
  static searchable = ['start_date', 'end_date'];
  static fillable = ['guest_id', 'host_id', 'accommodation_id', 'start_date', 'end_date'];

  static validate(row: any) {
    if (!row.guest_id || isNaN(Number(row.guest_id))) {
      throw new Invalid_argument('Guest ID is required and must be a number');
    }

    if (!row.host_id || isNaN(Number(row.host_id))) {
      throw new Invalid_argument('Host ID is required and must be a number');
    }

    if (!row.accommodation_id || isNaN(Number(row.accommodation_id))) {
      throw new Invalid_argument('Accommodation ID is required and must be a number');
    }

    if (!row.start_date || !/^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[012])-(19|20)\d\d$/.test(row.start_date)) {
      throw new Invalid_argument('Start date must be in DD-MM-YYYY format');
    }

    if (row.end_date && !/^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[012])-(19|20)\d\d$/.test(row.end_date)) {
      throw new Invalid_argument('End date must be in DD-MM-YYYY format or empty');
    }
  }

  static async create(row: any): Promise<any> {
    this.validate(row);
    const conn = await get_connection();
    try {
      const [result] = await conn.query(
        `INSERT INTO ${this.table}
        (guest_id, host_id, accommodation_id, start_date, end_date)
        VALUES (?, ?, ?, ?, ?)`,
        [
          row.guest_id,
          row.host_id,
          row.accommodation_id,
          row.start_date,
          row.end_date || null
        ]
      ) as ResultSetHeader[];

      return { ...row, id: result.insertId };
    } finally {
      conn.end();
    }
  }

  static async delete(id: number): Promise<void> {
    if (!id) throw new Invalid_argument('ID is required');
    const conn = await get_connection();
    try {
      await conn.query(`DELETE FROM ${this.table} WHERE id = ?`, [id]);
    } finally {
      conn.end();
    }
  }

  static async update(partial: any): Promise<any> {
    if (!partial.id) throw new Invalid_argument('ID is required');
    this.validate(partial);

    const conn = await get_connection();
    try {
      await conn.query(
        `UPDATE ${this.table}
         SET guest_id = ?, host_id = ?, accommodation_id = ?,
             start_date = ?, end_date = ?
         WHERE id = ?`,
        [
          partial.guest_id,
          partial.host_id,
          partial.accommodation_id,
          partial.start_date,
          partial.end_date || null,
          partial.id
        ]
      );
      return this.pick(partial.id);
    } finally {
      conn.end();
    }
  }

  static async list(
    page = 1,
    limit = 15,
    order_by = 'id',
    desc = false,
    keyword?: string
  ): Promise<any[]> {
    const conn = await get_connection();
    try {
      let query = `
        SELECT
          p.*,
          g.full_name AS guest_full_name,
          h.full_name AS host_full_name,
          a.address AS accommodation_address
        FROM ${this.table} AS p
        LEFT JOIN guests AS g ON p.guest_id = g.id
        LEFT JOIN hosts AS h ON p.host_id = h.id
        LEFT JOIN accommodations AS a ON p.accommodation_id = a.id
      `;

      const params: any[] = [];

      if (keyword) {
        query += ` WHERE
          g.full_name LIKE ? OR
          h.full_name LIKE ? OR
          a.address LIKE ? OR
          p.start_date LIKE ? OR
          p.end_date LIKE ?`;

        const keywordParam = `%${keyword}%`;
        params.push(
          keywordParam,
          keywordParam,
          keywordParam,
          keywordParam,
          keywordParam
        );
      }

      query += ` ORDER BY ${order_by} ${desc ? 'DESC' : 'ASC'}`;

      const offset = (page - 1) * limit;
      query += ` LIMIT ${limit} OFFSET ${offset}`;

      const [rows] = await conn.query<RowDataPacket[]>(query, params);
      return rows;
    } finally {
      conn.end();
    }
  }

  static async pick(id: number): Promise<any> {
    const conn = await get_connection();
    try {
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT
          p.*,
          g.full_name AS guest_full_name,
          h.full_name AS host_full_name,
          a.address AS accommodation_address
        FROM ${this.table} AS p
        LEFT JOIN guests AS g ON p.guest_id = g.id
        LEFT JOIN hosts AS h ON p.host_id = h.id
        LEFT JOIN accommodations AS a ON p.accommodation_id = a.id
        WHERE p.id = ?`,
        [id]
      );
      return rows[0] || null;
    } finally {
      conn.end();
    }
  }

  static async count(): Promise<number> {
    const conn = await get_connection();
    try {
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT COUNT(*) as count FROM ${this.table}`
      );
      return rows[0].count as number;
    } finally {
      conn.end();
    }
  }
}
