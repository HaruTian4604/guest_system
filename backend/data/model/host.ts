import { Base } from './base';
import { Invalid_argument } from '../../error/invalid_argument';
import { get_connection } from '../../boot/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

export class Host extends Base {
  static table = 'hosts';
  static searchable: string[] = ['full_name'];
  static fillable: string[] = ['full_name'];

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

  static async create(row: any): Promise<any> {
    this.validate(row);
    const conn = await get_connection();
    try {
      const [result] = await conn.query(
        `INSERT INTO ${this.table} (full_name)
         VALUES (?)`,
        [row.full_name]
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

  static async archive(id: number): Promise<void> {
    if (!id) throw new Invalid_argument('ID is required');
    const conn = await get_connection();
    try {
      await conn.query(`UPDATE ${this.table} SET archived = TRUE WHERE id = ?`, [id]);
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
         SET full_name = ?
         WHERE id = ?`,
        [partial.full_name, partial.id]
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
      let query = `SELECT * FROM ${this.table} WHERE archived = FALSE`;
      const params: any[] = [];

      if (keyword) {
        query += ` WHERE full_name LIKE ?`;
        params.push(`%${keyword}%`);
      }

      query += ` ORDER BY ${order_by} ${desc ? 'DESC' : 'ASC'}`;

      const offset = (page - 1) * limit;
      query += ` LIMIT ${limit} OFFSET ${offset}`;

      //   console.log('Host List Query:', query); // debug log

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
        `SELECT * FROM ${this.table} WHERE id = ?`,
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
