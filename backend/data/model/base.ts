import { get_connection } from '../../boot/database';
import { Invalid_argument } from '../../error/invalid_argument';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
/**
 * Base class
 */
export class Base {
  static type: string;
  static searchable: string[];
  static fillable: string[];

  id: number; // Unique identifier

  /**
   * Get total count of records
   */
  static async count(): Promise<number> {
    const conn = await get_connection();
    try {
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT COUNT(*) as count FROM ${this.type}`
      );
      return rows[0].count as number;
    } finally {
      conn.end();
    }
  }

  /**
   * Create a new record
   * @param row
   */
  static async create(row: any): Promise<any> {
    this.validate(row);
    const obj = Object.fromEntries(
      Object.entries(row).filter(([key]) => this.fillable.includes(key))
    );

    const conn = await get_connection();
    try {
      const keys = Object.keys(obj);
      const values = Object.values(obj);

      const sql = `INSERT INTO ${this.type} (${keys.join(',')})
                   VALUES (${keys.map(() => '?').join(',')})`;

      const [result] = await conn.query<ResultSetHeader>(sql, values);
      return { ...obj, id: result.insertId };
    } finally {
      conn.end();
    }
  }

  /**
   * Delete a record
   * @param id
   */
  static async delete(id: number): Promise<void> {
    if (!id) { throw new Invalid_argument('ID parameter is required'); }

    const conn = await get_connection();
    try {
      await conn.query(`DELETE FROM ${this.type} WHERE id = ?`, [id]);
    } finally {
      conn.end();
    }
  }

  /**
   * Update a record
   * @param partial
   */
  static async update(partial: any): Promise<any> {
    if (!partial.id) { throw new Invalid_argument('ID parameter is required'); }

    this.validate(partial);

    const conn = await get_connection();
    try {
      const { id, ...updates } = partial;
      const updateStr = Object.keys(updates)
        .map(key => `${key} = ?`)
        .join(', ');

      const sql = `UPDATE ${this.type} SET ${updateStr} WHERE id = ?`;
      await conn.query(sql, [...Object.values(updates), id]);

      return this.pick(id);
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
    let sql = `SELECT * FROM ${this.type}`;
    const params: any[] = [];

    if (keyword) {
      const conditions = this.searchable.map(field => `${field} LIKE ?`);
      sql += ` WHERE ${conditions.join(' OR ')}`;
      params.push(...this.searchable.map(() => `%${keyword}%`));
    }

    sql += ` ORDER BY ${order_by} ${desc ? 'DESC' : 'ASC'}`;

    sql += ` LIMIT ${limit} OFFSET ${(page - 1) * limit}`;

    // console.log('Executing SQL:', sql); // debug log
    console.log('Parameters:', params);

    const [rows] = await conn.query<RowDataPacket[]>(sql, params);
    return rows;
  } finally {
    conn.end();
  }
}

  /**
   * Get a record by ID
   * @param id
   */
  static async pick(id: number): Promise<any> {
    const conn = await get_connection();
    try {
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT * FROM ${this.type} WHERE id = ?`,
        [id]
      );
      return rows[0] || null;
    } finally {
      conn.end();
    }
  }

  /**
   * Validate record data
   */
  static validate(row: any) {}
}
