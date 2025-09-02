import { get_connection } from '../../boot/database';
import { Invalid_argument } from '../../error/invalid_argument';
import type { Connection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getCurrentUser } from '../../net/request';

/**
 * Base class
 */

type OpType =
  'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'ARCHIVE';
export class Base {
  // static type: string;
  static tableName: string;
  static searchable: string[];
  static fillable: string[];
  static columns: string | string[] = '*';
  static viewName?: string; // 新增：若设置则读取走视图

  id: number; // Unique identifier
  // base.ts
  protected static _orderable(): string[] {
    // 允许排序的列 = fillable + 常见主键/时间列
    const extra = ['id', 'created_at', 'updated_at'];
    const s = new Set([...(this.fillable || []), ...extra]);
    return Array.from(s);
  }

  protected static _readFrom(): string {
    // 读操作统一走 viewName（若声明），否则走 tableName
    return (this as any).viewName || this.tableName;
  }

  protected static _ensureOrderBy(order_by: string): string {
    const allowed = this._orderable();
    return allowed.includes(order_by) ? order_by : 'id';
  }

  protected static _onlyFillable(data: any) {
    if (!data) return {};
    const out: any = {};
    for (const k of (this.fillable || [])) {
      if (k in data) out[k] = data[k];
    }
    return out;
  }
  protected static _selectColumns(): string {
    const cols = (this.columns as any);
    return Array.isArray(cols) ? cols.join(', ') : cols;
  }
  protected static _currentOperator() {
    // return { operator_id: 0, operator_name: 'system' };
    const user = getCurrentUser();
    if (user) return { operator_id: user.id, operator_name: user.name };
    return { operator_id: 0, operator_name: 'system' };
  }

  protected static _pickFillable(row: any) {
    if (!row) return row;
    const out: any = {};
    for (const k of (this.fillable || [])) {
      if (k in row) out[k] = row[k];
    }
    return out;
  }

  protected static _diff(before: any, after: any) {
    const changed: Record<string, { from: any; to: any }> = {};
    const keys = (this.fillable || []);
    for (const k of keys) {
      const bv = before ? before[k] : undefined;
      const av = after ? after[k] : undefined;
      if (bv !== av) {
        changed[k] = { from: bv, to: av };
      }
    }
    return { changed };
  }

  protected static async _withTx<T>(fn: (conn: Connection) => Promise<T>): Promise<T> {
    const conn = await get_connection();
    try {
      await conn.query('START TRANSACTION');
      const r = await fn(conn);
      await conn.query('COMMIT');
      return r;
    } catch (e) {
      try { await conn.query('ROLLBACK'); } catch { }
      throw e;
    } finally {
      conn.end();
    }
  }

  // 原 _log 改为支持复用 conn
  protected static async _log(op: OpType, record_id: number, before: any, after: any, conn?: Connection) {
    const { operator_id, operator_name } = this._currentOperator();
    const changes =
      op === 'CREATE' ? { after: this._pickFillable(after) } :
        op === 'DELETE' ? { before: this._pickFillable(before) } :
          this._diff(before, after);

    // 优先用传入的事务连接；否则自己开关一次性连接（兼容非事务场景）
    if (conn) {
      await conn.query(
        `INSERT INTO operation_log
        (operation_type, table_name, record_id, operator_id, operator_name, changes)
       VALUES (?, ?, ?, ?, ?, ?)`,
        [op, this.tableName, record_id, operator_id, operator_name, JSON.stringify(changes)]
      );
    } else {
      const c = await get_connection();
      try {
        await c.query(
          `INSERT INTO operation_log
          (operation_type, table_name, record_id, operator_id, operator_name, changes)
         VALUES (?, ?, ?, ?, ?, ?)`,
          [op, this.tableName, record_id, operator_id, operator_name, JSON.stringify(changes)]
        );
      } finally {
        c.end();
      }
    }
  }

  protected static _buildKeywordWhere(keyword?: string) {
    if (!keyword) return { where: '', params: [] as any[] };
    const fields = this.searchable || [];
    if (fields.length === 0) return { where: '', params: [] };
    const cond = fields.map(f => `${f} LIKE ?`).join(' OR ');
    const params = fields.map(() => `%${keyword}%`);
    return { where: ` WHERE ${cond}`, params };
  }

  // static async count(keyword?: string): Promise<number> {
  //   const conn = await get_connection();
  //   try {
  //     let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
  //     const { where, params } = this._buildKeywordWhere(keyword);
  //     sql += where;
  //     const [rows] = await conn.query<RowDataPacket[]>(sql, params);
  //     return rows[0].count as number;
  //   } finally {
  //     conn.end();
  //   }
  // }
    static async count(keyword?: string): Promise<number> {
    const conn = await get_connection();
    try {
      const { where, params } = this._buildKeywordWhere(keyword);
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT COUNT(*) as count FROM ${this._readFrom()}${where}`,
        params
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

    return await this._withTx(async (conn) => {
      const keys = Object.keys(obj);
      const values = Object.values(obj);

      const sql = `INSERT INTO ${this.tableName} (${keys.join(',')})
                 VALUES (${keys.map(() => '?').join(',')})`;

      const [result] = await conn.query<ResultSetHeader>(sql, values);

      const inserted = await this.pick(result.insertId, conn);
      await this._log('CREATE', result.insertId, null, inserted, conn);

      return inserted ?? { ...obj, id: result.insertId };
    });
  }


  /**
   * Delete a record
   * @param id
   */
  static async delete(id: number): Promise<void> {
    if (!id) { throw new Invalid_argument('ID parameter is required'); }

    await this._withTx(async (conn) => {
      const before = await this.pick(id, conn);
      await conn.query(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
      await this._log('DELETE', id, before, null, conn);
    });
  }

  /**
   * Update a record
   * @param partial
   */
  static async update(partial: any): Promise<any> {
    if (!partial.id) { throw new Invalid_argument('ID parameter is required'); }
    this.validate(partial);

    return await this._withTx(async (conn) => {
      const before = await this.pick(partial.id, conn);

      const { id, ...rest } = partial;
      const updates = this._onlyFillable(rest);

      // ⭐ 没有任何可更新字段，直接返回当前行（不写空 UPDATE）
      if (Object.keys(updates).length === 0) {
        return before;
      }
      const updateStr = Object.keys(updates)
        .map(key => `${key} = ?`)
        .join(', ');

      const sql = `UPDATE ${this.tableName} SET ${updateStr} WHERE id = ?`;
      await conn.query(sql, [...Object.values(updates), id]);

      const after = await this.pick(id, conn);

      const diff = this._diff(before, after);
      if (Object.keys(diff.changed).length > 0) {
        await this._log('UPDATE', id, before, after, conn);
      }

      return after;
    });
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
      // let sql = `SELECT ${this._selectColumns()} FROM ${this.tableName}`;
      let sql = `SELECT ${this._selectColumns()} FROM ${this._readFrom()}`;

      const { where, params } = this._buildKeywordWhere(keyword);
      sql += where;
      sql += ` ORDER BY ${this._ensureOrderBy(order_by)} ${desc ? 'DESC' : 'ASC'}`;
      const offset = (page - 1) * limit;
      sql += ` LIMIT ${limit} OFFSET ${offset}`;
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
  static async pick(id: number, conn?: Connection): Promise<any> {
    if (conn) {
      const [rows] = await conn.query<RowDataPacket[]>(
        // `SELECT * FROM ${this.tableName} WHERE id = ?`,
        `SELECT * FROM ${this._readFrom()} WHERE id = ?`,
        [id]
      );
      return rows[0] || null;
    }

    const c = await get_connection();
    try {
      const [rows] = await c.query<RowDataPacket[]>(
        // `SELECT * FROM ${this.tableName} WHERE id = ?`,
        `SELECT * FROM ${this._readFrom()} WHERE id = ?`,
        [id]
      );
      return rows[0] || null;
    } finally {
      c.end();
    }
  }


  /**
   * Validate record data
   */
  static validate(row: any) { }

  // 在base.ts中添加以下方法

  protected static async _checkDateOverlap(
    table: string,
    field: string,
    id: number,
    startDate: string,
    endDate: string,
    excludeId?: number
  ): Promise<boolean> {
    const conn = await get_connection();
    try {
      const excludeClause = excludeId ? 'AND id != ?' : '';
      const params = excludeId ? [id, startDate, endDate, startDate, endDate, excludeId] :
        [id, startDate, endDate, startDate, endDate];

      const [rows] = await conn.query<RowDataPacket[]>(`
      SELECT COUNT(*) as count
      FROM ${table}
      WHERE ${field} = ?
      AND (
        (start_date <= ? AND (end_date IS NULL OR end_date >= ?)) OR
        (start_date <= ? AND (end_date IS NULL OR end_date >= ?))
      )
      ${excludeClause}
    `, params);

      return rows[0].count > 0;
    } finally {
      conn.end();
    }
  }

  // 添加状态更新方法
  protected static async _updateStatus(
    table: string,
    id: number,
    statusField: string,
    statusValue: string
  ): Promise<void> {
    const conn = await get_connection();
    try {
      await conn.query(
        `UPDATE ${table} SET ${statusField} = ? WHERE id = ?`,
        [statusValue, id]
      );
    } finally {
      conn.end();
    }
  }

}
