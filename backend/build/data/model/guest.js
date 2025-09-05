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
exports.Guest = void 0;
const base_1 = require("./base");
const database_1 = require("../../boot/database");
const invalid_argument_1 = require("../../error/invalid_argument");
class Guest extends base_1.Base {
    static validate(row) {
        if ('full_name' in row) {
            const name = String(row.full_name || '').trim();
            if (!name)
                throw new invalid_argument_1.Invalid_argument('full_name is required');
        }
        if ('date_of_birth' in row) {
            const dob = String(row.date_of_birth || '');
            if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
                throw new invalid_argument_1.Invalid_argument('date_of_birth must be YYYY-MM-DD');
            }
        }
    }
    /**
     * Dashboard 统计
     */
    static getStats() {
        return __awaiter(this, void 0, void 0, function* () {
            const conn = yield (0, database_1.get_connection)();
            try {
                const [rows] = yield conn.query(`SELECT
         SUM(CASE WHEN status = 'placed' COLLATE utf8mb4_0900_ai_ci THEN 1 ELSE 0 END) AS placed,
         SUM(CASE WHEN status = 'unplaced' COLLATE utf8mb4_0900_ai_ci THEN 1 ELSE 0 END) AS unplaced,
         COUNT(*) AS total
       FROM view_guests
       WHERE archived = 0`);
                const r = rows[0] || {};
                return {
                    placed: Number(r.placed || 0),
                    unplaced: Number(r.unplaced || 0),
                    total: Number(r.total || 0),
                };
            }
            finally {
                conn.end();
            }
        });
    }
}
exports.Guest = Guest;
Guest.tableName = 'guests';
Guest.viewName = 'view_guests';
Guest.searchable = ['full_name'];
Guest.fillable = ['full_name', 'date_of_birth', 'note', 'archived'];
Guest.columns = 'id, full_name, date_of_birth, note, archived,status';
//# sourceMappingURL=guest.js.map