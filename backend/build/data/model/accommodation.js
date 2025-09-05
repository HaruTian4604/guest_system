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
exports.Accommodation = void 0;
const base_1 = require("./base");
const database_1 = require("../../boot/database");
const invalid_argument_1 = require("../../error/invalid_argument");
class Accommodation extends base_1.Base {
    static validate(row) {
        if ('address' in row) {
            const v = String(row.address || '').trim();
            if (!v)
                throw new invalid_argument_1.Invalid_argument('address is required');
        }
        if ('postcode' in row) {
            const v = String(row.postcode || '').trim();
            if (!v)
                throw new invalid_argument_1.Invalid_argument('postcode is required');
        }
        if ('host_id' in row) {
            const n = Number(row.host_id);
            if (!Number.isInteger(n) || n <= 0)
                throw new invalid_argument_1.Invalid_argument('host_id is required');
        }
    }
    static getStats() {
        return __awaiter(this, void 0, void 0, function* () {
            const conn = yield (0, database_1.get_connection)();
            try {
                const [rows] = yield conn.query(`SELECT
           SUM(CASE WHEN status = 'available'   COLLATE utf8mb4_0900_ai_ci THEN 1 ELSE 0 END) AS available,
           SUM(CASE WHEN status = 'unavailable' COLLATE utf8mb4_0900_ai_ci THEN 1 ELSE 0 END) AS unavailable,
           COUNT(*) AS total
         FROM view_accommodations
         WHERE archived = 0`);
                const r = (rows[0] || {});
                return {
                    available: Number(r.available || 0),
                    unavailable: Number(r.unavailable || 0),
                    total: Number(r.total || 0),
                };
            }
            finally {
                conn.end();
            }
        });
    }
}
exports.Accommodation = Accommodation;
Accommodation.tableName = 'accommodations';
Accommodation.viewName = 'view_accommodations';
Accommodation.searchable = ['address', 'postcode', 'host'];
Accommodation.fillable = ['address', 'postcode', 'host_id', 'archived', 'note'];
Accommodation.columns = 'id, address, postcode, host_id, archived, status, host_name';
//# sourceMappingURL=accommodation.js.map