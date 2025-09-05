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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Log = void 0;
const base_1 = require("./base");
const database_1 = require("../../boot/database");
class Log extends base_1.Base {
    static list() {
        return __awaiter(this, arguments, void 0, function* (page = 1, limit = 15, order_by = 'operation_time', desc = true, keyword) {
            const conn = yield (0, database_1.get_connection)();
            try {
                let query = `SELECT * FROM ${this.table}`;
                const params = [];
                if (keyword) {
                    query += ` WHERE table_name LIKE ? OR operator_name LIKE ? OR operation_type LIKE ?`;
                    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
                }
                query += ` ORDER BY ${order_by} ${desc ? 'DESC' : 'ASC'}`;
                const offset = (page - 1) * limit;
                query += ` LIMIT ${limit} OFFSET ${offset}`;
                const [rows] = yield conn.query(query, params);
                return rows.map(row => (Object.assign(Object.assign({}, row), { changes: typeof row.changes === 'string' ? JSON.parse(row.changes) : row.changes })));
            }
            finally {
                conn.end();
            }
        });
    }
    static count(keyword) {
        return __awaiter(this, void 0, void 0, function* () {
            const conn = yield (0, database_1.get_connection)();
            try {
                let query = `SELECT COUNT(*) as count FROM ${this.table}`;
                const params = [];
                if (keyword) {
                    query += ` WHERE table_name LIKE ? OR operator_name LIKE ? OR operation_type LIKE ?`;
                    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
                }
                const [rows] = yield conn.query(query, params);
                return rows[0].count;
            }
            finally {
                conn.end();
            }
        });
    }
}
exports.Log = Log;
Log.table = 'operation_log';
Log.searchable = ['operation_type', 'operator_name', 'operation_type', 'changes'];
//# sourceMappingURL=log.js.map