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
exports.Host = void 0;
const invalid_argument_1 = require("../../error/invalid_argument");
const base_1 = require("./base");
const database_1 = require("../../boot/database");
class Host extends base_1.Base {
    static validate(row) {
        if (row.full_name) {
            if (row.full_name.length < 2) {
                throw new invalid_argument_1.Invalid_argument('Full name must be at least 2 characters long');
            }
            if (!/^[a-zA-Z\s\-']+$/.test(row.full_name)) {
                throw new invalid_argument_1.Invalid_argument('Full name contains invalid characters');
            }
        }
    }
    static getStats() {
        return __awaiter(this, void 0, void 0, function* () {
            const conn = yield (0, database_1.get_connection)();
            try {
                const [rows] = yield conn.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(DISTINCT h.id) AS active_count
        FROM ${this.tableName} h
        LEFT JOIN accommodations a ON h.id = a.host_id
        LEFT JOIN placements p ON a.id = p.accommodation_id
          AND (p.end_date IS NULL OR p.end_date >= CURDATE())
        WHERE (h.archived = 0 OR h.archived IS NULL)
      `);
                return {
                    total: rows[0].total,
                    active_count: rows[0].active_count || 0
                };
            }
            finally {
                conn.end();
            }
        });
    }
}
exports.Host = Host;
Host.tableName = 'hosts';
Host.searchable = ['full_name'];
Host.fillable = ['note', 'full_name'];
Host.columns = ['id', 'full_name', 'note'];
//# sourceMappingURL=host.js.map