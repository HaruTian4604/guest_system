import { Base } from './base';
import { Invalid_argument } from '../../error/invalid_argument';
import { get_connection } from '../../boot/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
export class Accommodation extends Base {
  static table = 'accommodations';
  static searchable = ['address', 'postcode', 'status'];
  static fillable = ['address', 'postcode', 'host_id', 'status'];
  static statuses = ['available', 'unavailable'];

  static validate(row: any) {
    if (row.status && !this.statuses.includes(row.status)) {
      throw new Invalid_argument('Invalid status type');
    }

    if (row.postcode && !/^[A-Za-z0-9\- ]+$/.test(row.postcode)) {
      throw new Invalid_argument('Invalid postcode format');
    }

    if (row.host_id && isNaN(Number(row.host_id))) {
      throw new Invalid_argument('Host ID must be a number');
    }
  }

  static async create(row: any): Promise<any> {
    this.validate(row);
    const conn = await get_connection();
    try {
      const [result] = await conn.query(
        `INSERT INTO ${this.table} (address, postcode, host_id, status)
         VALUES (?, ?, ?, ?)`,
        [row.address, row.postcode, row.host_id, row.status]
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
         SET address = ?, postcode = ?, host_id = ?, status = ?
         WHERE id = ?`,
        [partial.address, partial.postcode, partial.host_id, partial.status, partial.id]
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
        const conditions = this.searchable.map(field => `a.${field} LIKE ?`);
        query += ` WHERE ${conditions.join(' OR ')}`;
        params.push(...this.searchable.map(() => `%${keyword}%`));
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
