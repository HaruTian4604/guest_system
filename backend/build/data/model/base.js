"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Base = void 0;
const database_1 = require("../../boot/database");
const invalid_argument_1 = require("../../error/invalid_argument");
const request_1 = require("../../net/request");
class Base {
    static _orderable() {
        const extra = ['id', 'created_at', 'updated_at'];
        const s = new Set([...(this.fillable || []), ...extra]);
        return Array.from(s);
    }
    static _readFrom() {
        return this.viewName || this.tableName;
    }
    static _ensureOrderBy(order_by) {
        const allowed = this._orderable();
        return allowed.includes(order_by) ? order_by : 'id';
    }
    static _onlyFillable(data) {
        if (!data)
            return {};
        const out = {};
        for (const k of (this.fillable || [])) {
            if (k in data)
                out[k] = data[k];
        }
        return out;
    }
    static _selectColumns() {
        const cols = this.columns;
        return Array.isArray(cols) ? cols.join(', ') : cols;
    }
    static _currentOperator() {
        const user = (0, request_1.getCurrentUser)();
        if (user)
            return { operator_id: user.id, operator_name: user.name };
        return { operator_id: 0, operator_name: 'system' };
    }
    static _pickFillable(row) {
        if (!row)
            return row;
        const out = {};
        for (const k of (this.fillable || [])) {
            if (k in row)
                out[k] = row[k];
        }
        return out;
    }
    static _diff(before, after) {
        const changed = {};
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
    static _withTx(fn) {
        return __awaiter(this, void 0, void 0, function* () {
            const conn = yield (0, database_1.get_connection)();
            try {
                yield conn.query('START TRANSACTION');
                const r = yield fn(conn);
                yield conn.query('COMMIT');
                return r;
            }
            catch (e) {
                try {
                    yield conn.query('ROLLBACK');
                }
                catch (_a) { }
                throw e;
            }
            finally {
                conn.end();
            }
        });
    }
    static _log(op, record_id, before, after, conn) {
        return __awaiter(this, void 0, void 0, function* () {
            const { operator_id, operator_name } = this._currentOperator();
            const changes = op === 'CREATE' ? { after: this._pickFillable(after) } :
                op === 'DELETE' ? { before: this._pickFillable(before) } :
                    this._diff(before, after);
            if (conn) {
                yield conn.query(`INSERT INTO operation_log
        (operation_type, table_name, record_id, operator_id, operator_name, changes)
       VALUES (?, ?, ?, ?, ?, ?)`, [op, this.tableName, record_id, operator_id, operator_name, JSON.stringify(changes)]);
            }
            else {
                const c = yield (0, database_1.get_connection)();
                try {
                    yield c.query(`INSERT INTO operation_log
          (operation_type, table_name, record_id, operator_id, operator_name, changes)
         VALUES (?, ?, ?, ?, ?, ?)`, [op, this.tableName, record_id, operator_id, operator_name, JSON.stringify(changes)]);
                }
                finally {
                    c.end();
                }
            }
        });
    }
    static _buildKeywordWhere(keyword) {
        if (!keyword)
            return { where: '', params: [] };
        const fields = this.searchable || [];
        if (fields.length === 0)
            return { where: '', params: [] };
        const cond = fields.map(f => `${f} LIKE ?`).join(' OR ');
        const params = fields.map(() => `%${keyword}%`);
        return { where: ` WHERE ${cond}`, params };
    }
    static count(keyword) {
        return __awaiter(this, void 0, void 0, function* () {
            const conn = yield (0, database_1.get_connection)();
            try {
                const { where, params } = this._buildKeywordWhere(keyword);
                const [rows] = yield conn.query(`SELECT COUNT(*) as count FROM ${this._readFrom()}${where}`, params);
                return rows[0].count;
            }
            finally {
                conn.end();
            }
        });
    }
    /**
     * Create a new record
     * @param row
     */
    static create(row) {
        return __awaiter(this, void 0, void 0, function* () {
            this.validate(row);
            const obj = Object.fromEntries(Object.entries(row).filter(([key]) => this.fillable.includes(key)));
            return yield this._withTx((conn) => __awaiter(this, void 0, void 0, function* () {
                const keys = Object.keys(obj);
                const values = Object.values(obj);
                const sql = `INSERT INTO ${this.tableName} (${keys.join(',')})
                 VALUES (${keys.map(() => '?').join(',')})`;
                const [result] = yield conn.query(sql, values);
                const inserted = yield this.pick(result.insertId, conn);
                yield this._log('CREATE', result.insertId, null, inserted, conn);
                return inserted !== null && inserted !== void 0 ? inserted : Object.assign(Object.assign({}, obj), { id: result.insertId });
            }));
        });
    }
    /**
     * Delete a record
     * @param id
     */
    static delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!id) {
                throw new invalid_argument_1.Invalid_argument('ID parameter is required');
            }
            yield this._withTx((conn) => __awaiter(this, void 0, void 0, function* () {
                const before = yield this.pick(id, conn);
                yield conn.query(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
                yield this._log('DELETE', id, before, null, conn);
            }));
        });
    }
    /**
     * Update a record
     * @param partial
     */
    static update(partial) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!partial.id) {
                throw new invalid_argument_1.Invalid_argument('ID parameter is required');
            }
            this.validate(partial);
            return yield this._withTx((conn) => __awaiter(this, void 0, void 0, function* () {
                const before = yield this.pick(partial.id, conn);
                const { id } = partial, rest = __rest(partial, ["id"]);
                const updates = this._onlyFillable(rest);
                if (Object.keys(updates).length === 0) {
                    return before;
                }
                const updateStr = Object.keys(updates)
                    .map(key => `${key} = ?`)
                    .join(', ');
                const sql = `UPDATE ${this.tableName} SET ${updateStr} WHERE id = ?`;
                yield conn.query(sql, [...Object.values(updates), id]);
                const after = yield this.pick(id, conn);
                const diff = this._diff(before, after);
                if (Object.keys(diff.changed).length > 0) {
                    yield this._log('UPDATE', id, before, after, conn);
                }
                return after;
            }));
        });
    }
    static list() {
        return __awaiter(this, arguments, void 0, function* (page = 1, limit = 15, order_by = 'id', desc = false, keyword) {
            const conn = yield (0, database_1.get_connection)();
            try {
                let sql = `SELECT ${this._selectColumns()} FROM ${this._readFrom()}`;
                const { where, params } = this._buildKeywordWhere(keyword);
                sql += where;
                sql += ` ORDER BY ${this._ensureOrderBy(order_by)} ${desc ? 'DESC' : 'ASC'}`;
                const offset = (page - 1) * limit;
                sql += ` LIMIT ${limit} OFFSET ${offset}`;
                const [rows] = yield conn.query(sql, params);
                return rows;
            }
            finally {
                conn.end();
            }
        });
    }
    /**
     * Get a record by ID
     * @param id
     */
    static pick(id, conn) {
        return __awaiter(this, void 0, void 0, function* () {
            if (conn) {
                const [rows] = yield conn.query(`SELECT * FROM ${this._readFrom()} WHERE id = ?`, [id]);
                return rows[0] || null;
            }
            const c = yield (0, database_1.get_connection)();
            try {
                const [rows] = yield c.query(`SELECT * FROM ${this._readFrom()} WHERE id = ?`, [id]);
                return rows[0] || null;
            }
            finally {
                c.end();
            }
        });
    }
    /**
     * Validate record data
     */
    static validate(row) { }
    static _checkDateOverlap(table, field, id, startDate, endDate, excludeId) {
        return __awaiter(this, void 0, void 0, function* () {
            const conn = yield (0, database_1.get_connection)();
            try {
                const excludeClause = excludeId ? 'AND id != ?' : '';
                const params = excludeId ? [id, startDate, endDate, startDate, endDate, excludeId] :
                    [id, startDate, endDate, startDate, endDate];
                const [rows] = yield conn.query(`
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
            }
            finally {
                conn.end();
            }
        });
    }
    static _updateStatus(table, id, statusField, statusValue) {
        return __awaiter(this, void 0, void 0, function* () {
            const conn = yield (0, database_1.get_connection)();
            try {
                yield conn.query(`UPDATE ${table} SET ${statusField} = ? WHERE id = ?`, [statusValue, id]);
            }
            finally {
                conn.end();
            }
        });
    }
}
exports.Base = Base;
Base.columns = '*';
//# sourceMappingURL=base.js.map