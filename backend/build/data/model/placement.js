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
exports.Placement = void 0;
const base_1 = require("./base");
const database_1 = require("../../boot/database");
const invalid_argument_1 = require("../../error/invalid_argument");
class Placement extends base_1.Base {
    static validate(row) {
        const ymd = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));
        if ('guest_id' in row && !(+row.guest_id > 0))
            throw new invalid_argument_1.Invalid_argument('guest_id is required');
        if ('host_id' in row && !(+row.host_id > 0))
            throw new invalid_argument_1.Invalid_argument('host_id is required');
        if ('accommodation_id' in row && !(+row.accommodation_id > 0))
            throw new invalid_argument_1.Invalid_argument('accommodation_id is required');
        if ('start_date' in row) {
            if (!ymd(row.start_date))
                throw new invalid_argument_1.Invalid_argument('start_date must be YYYY-MM-DD');
        }
        if ('end_date' in row && row.end_date !== null && row.end_date !== '') {
            if (!ymd(row.end_date))
                throw new invalid_argument_1.Invalid_argument('end_date must be YYYY-MM-DD');
        }
        if (row.start_date && row.end_date) {
            if (row.end_date < row.start_date) {
                throw new invalid_argument_1.Invalid_argument('end_date cannot be earlier than start_date');
            }
        }
    }
    static listByAccommodation(accommodation_id) {
        return __awaiter(this, void 0, void 0, function* () {
            const conn = yield (0, database_1.get_connection)();
            try {
                const [rows] = yield conn.query(`SELECT ${this._selectColumns()}
           FROM ${this._readFrom()}
          WHERE archived = 0 AND accommodation_id = ?
          ORDER BY start_date DESC, id DESC`, [accommodation_id]);
                return rows;
            }
            finally {
                conn.end();
            }
        });
    }
    static listByGuest(guest_id) {
        return __awaiter(this, void 0, void 0, function* () {
            const conn = yield (0, database_1.get_connection)();
            try {
                const [rows] = yield conn.query(`SELECT ${this._selectColumns()}
         FROM ${this._readFrom()}
        WHERE archived = 0 AND guest_id = ?
        ORDER BY start_date DESC, id DESC`, [guest_id]);
                return rows;
            }
            finally {
                conn.end();
            }
        });
    }
    static assertNoOverlap(row, selfId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const conn = yield (0, database_1.get_connection)();
            try {
                const start = row.start_date;
                const end = (_a = row.end_date) !== null && _a !== void 0 ? _a : null;
                const guestId = row.guest_id;
                const accId = row.accommodation_id;
                if (!start || !guestId || !accId)
                    return;
                const endExpr = end !== null && end !== void 0 ? end : '9999-12-31';
                const [g] = yield conn.query(`SELECT 1 FROM placements p
          WHERE p.archived=0
            AND p.guest_id=?
            ${selfId ? 'AND p.id<>?' : ''}
            AND NOT (
              COALESCE(?, '9999-12-31') < p.start_date OR
              COALESCE(p.end_date, '9999-12-31') < ?
            )
          LIMIT 1`, selfId ? [guestId, selfId, end, start] : [guestId, end, start]);
                if (g.length)
                    throw new invalid_argument_1.Invalid_argument('Overlapping placement for this guest');
                const [a] = yield conn.query(`SELECT 1 FROM placements p
          WHERE p.archived=0
            AND p.accommodation_id=?
            ${selfId ? 'AND p.id<>?' : ''}
            AND NOT (
              COALESCE(?, '9999-12-31') < p.start_date OR
              COALESCE(p.end_date, '9999-12-31') < ?
            )
          LIMIT 1`, selfId ? [accId, selfId, end, start] : [accId, end, start]);
                if (a.length)
                    throw new invalid_argument_1.Invalid_argument('Overlapping placement for this accommodation');
            }
            finally {
                conn.end();
            }
        });
    }
    static create(row) {
        const _super = Object.create(null, {
            create: { get: () => super.create }
        });
        return __awaiter(this, void 0, void 0, function* () {
            this.validate(row);
            yield this.assertNoOverlap(row);
            return yield _super.create.call(this, row);
        });
    }
    static update(row) {
        const _super = Object.create(null, {
            update: { get: () => super.update }
        });
        return __awaiter(this, void 0, void 0, function* () {
            this.validate(row);
            const selfId = Number(row.id || 0) || undefined;
            yield this.assertNoOverlap(row, selfId);
            return yield _super.update.call(this, row);
        });
    }
    static getEndingsNext12Months() {
        return __awaiter(this, void 0, void 0, function* () {
            const today = new Date();
            const start = new Date(today.getFullYear(), today.getMonth(), 1);
            const end = new Date(start.getFullYear(), start.getMonth() + 12, 1);
            const ymKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const months = [];
            for (let i = 0; i < 12; i++) {
                const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
                months.push({ month: ymKey(d), count: 0 });
            }
            const conn = yield (0, database_1.get_connection)();
            try {
                const [rows] = yield conn.query(`
          SELECT DATE_FORMAT(end_date, '%Y-%m') AS ym, COUNT(*) AS cnt
          FROM placements
          WHERE end_date IS NOT NULL
            AND end_date >= ?
            AND end_date <  ?
          GROUP BY ym
          ORDER BY ym
        `, [start, end]);
                const map = new Map();
                for (const r of rows) {
                    map.set(String(r.ym), Number(r.cnt || 0));
                }
                for (const m of months) {
                    if (map.has(m.month))
                        m.count = map.get(m.month);
                }
                return months;
            }
            finally {
                conn.end();
            }
        });
    }
}
exports.Placement = Placement;
Placement.tableName = 'placements';
Placement.viewName = 'view_placements';
Placement.searchable = ['guest_name', 'host_name', 'accommodation_address', 'accommodation_postcode'];
Placement.fillable = ['guest_id', 'host_id', 'accommodation_id', 'start_date', 'end_date', 'archived', 'note'];
Placement.columns = 'id, guest_id, guest_name, host_id, host_name, accommodation_id, accommodation_address, accommodation_postcode, start_date, end_date, archived, status';
//# sourceMappingURL=placement.js.map