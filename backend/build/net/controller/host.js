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
exports.host_list_by_accommodation = exports.host_dashboard = exports.host_pick = exports.host_list = exports.host_update = exports.host_delete = exports.host_create = void 0;
const host_1 = require("../../data/model/host");
const database_1 = require("../../boot/database");
const host_create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const r = yield host_1.Host.create(req.$query);
        return { ok: true, data: r };
    }
    catch (error) {
        return { ok: false, error: error.message };
    }
});
exports.host_create = host_create;
const host_delete = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.$query.id;
        yield host_1.Host.delete(id);
        return { ok: true };
    }
    catch (error) {
        return { ok: false, error: error.message };
    }
});
exports.host_delete = host_delete;
const host_update = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const r = yield host_1.Host.update(req.$query);
        return { ok: true, data: r };
    }
    catch (error) {
        return { ok: false, error: error.message };
    }
});
exports.host_update = host_update;
const host_list = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const q = req.$query;
        const page = parseInt(q.page) || 1;
        const limit = parseInt(q.limit) || 15;
        const desc = q.desc === 'true';
        const keyword = q.keyword;
        const r = yield host_1.Host.list(page, limit, q.order_by || 'id', desc, keyword);
        const total = yield host_1.Host.count(keyword);
        return { ok: true, data: r, total };
    }
    catch (error) {
        return { ok: false, error: error.message };
    }
});
exports.host_list = host_list;
const host_pick = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const q = req.$query;
        const r = yield host_1.Host.pick(q.id);
        return { ok: true, data: r };
    }
    catch (error) {
        return { ok: false, error: error.message };
    }
});
exports.host_pick = host_pick;
const host_dashboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const stats = yield host_1.Host.getStats();
        return Object.assign({ ok: true }, stats);
    }
    catch (error) {
        return { ok: false, error: error.message };
    }
});
exports.host_dashboard = host_dashboard;
const host_list_by_accommodation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const hostId = req.$query.host_id;
        const conn = yield (0, database_1.get_connection)();
        const [rows] = yield conn.query(`
      SELECT
        a.id,
        a.address,
        a.postcode,
        COUNT(p.id) AS active_placements
      FROM accommodations a
      LEFT JOIN placements p ON a.id = p.accommodation_id
        AND (p.end_date IS NULL OR p.end_date >= CURDATE())
      WHERE a.host_id = ? AND (a.archived = 0 OR a.archived IS NULL)
      GROUP BY a.id
      ORDER BY a.id DESC
    `, [hostId]);
        conn.end();
        return { ok: true, data: rows };
    }
    catch (error) {
        return { ok: false, error: error.message };
    }
});
exports.host_list_by_accommodation = host_list_by_accommodation;
//# sourceMappingURL=host.js.map