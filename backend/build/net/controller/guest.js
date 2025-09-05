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
exports.guest_dashboard = exports.guest_pick = exports.guest_list = exports.guest_delete = exports.guest_update = exports.guest_create = void 0;
// backend/net/controller/guest.ts
const guest_1 = require("../../data/model/guest");
const guest_create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const r = yield guest_1.Guest.create(req.$query);
        return { ok: true, data: r };
    }
    catch (error) {
        return { ok: false, error: error.message };
    }
});
exports.guest_create = guest_create;
const guest_update = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const r = yield guest_1.Guest.update(req.$query);
        return { ok: true, data: r };
    }
    catch (error) {
        return { ok: false, error: error.message };
    }
});
exports.guest_update = guest_update;
const guest_delete = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = Number(req.$query.id || 0);
        if (!id)
            return { ok: false, error: 'invalid id' };
        yield guest_1.Guest.delete(id);
        return { ok: true };
    }
    catch (error) {
        return { ok: false, error: error.message };
    }
});
exports.guest_delete = guest_delete;
const guest_list = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const q = req.$query || {};
        const page = Math.max(1, parseInt(String(q.page || '1'), 10));
        const limit = Math.max(1, Math.min(100, parseInt(String(q.limit || '15'), 10)));
        const order = String(q.order_by || 'id');
        const desc = String(q.desc || 'true') === 'true';
        const keyword = (q.keyword || '').trim();
        const [rows, total] = yield Promise.all([
            guest_1.Guest.list(page, limit, order, desc, keyword),
            guest_1.Guest.count(keyword),
        ]);
        return { ok: true, data: rows, total, page, limit };
    }
    catch (error) {
        return { ok: false, error: error.message };
    }
});
exports.guest_list = guest_list;
const guest_pick = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = Number(req.$query.id || 0);
        if (!id)
            return { ok: false, error: 'invalid id' };
        const r = yield guest_1.Guest.pick(id);
        if (!r)
            return { ok: false, error: 'not found' };
        return { ok: true, data: r };
    }
    catch (error) {
        return { ok: false, error: error.message };
    }
});
exports.guest_pick = guest_pick;
const guest_dashboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const stats = yield guest_1.Guest.getStats(); // { placed, unplaced, total }
        return {
            ok: true,
            total: stats.total,
            placed_count: stats.placed,
            unplaced_count: stats.unplaced,
        };
    }
    catch (error) {
        return { ok: false, error: error.message };
    }
});
exports.guest_dashboard = guest_dashboard;
//# sourceMappingURL=guest.js.map