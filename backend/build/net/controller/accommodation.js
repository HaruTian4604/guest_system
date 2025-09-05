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
exports.accommodation_delete = exports.accommodation_update = exports.accommodation_create = exports.accommodation_pick = exports.accommodation_list = void 0;
exports.accommodation_dashboard = accommodation_dashboard;
// backend/net/controller/accommodation.ts
const accommodation_1 = require("../../data/model/accommodation");
const accommodation_list = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const q = req.$query || {};
        const page = Math.max(1, parseInt(String(q.page || '1'), 10));
        const limit = Math.max(1, Math.min(100, parseInt(String(q.limit || '15'), 10)));
        const order = String(q.order_by || 'id');
        const desc = String(q.desc || 'true') === 'true';
        const keyword = (q.keyword || '').trim();
        const [rows, total] = yield Promise.all([
            accommodation_1.Accommodation.list(page, limit, order, desc, keyword),
            accommodation_1.Accommodation.count(keyword),
        ]);
        return { ok: true, data: rows, total, page, limit };
    }
    catch (e) {
        return { ok: false, error: e.message };
    }
});
exports.accommodation_list = accommodation_list;
const accommodation_pick = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = Number(req.$query.id || 0);
        if (!id)
            return { ok: false, error: 'invalid id' };
        const r = yield accommodation_1.Accommodation.pick(id);
        if (!r)
            return { ok: false, error: 'not found' };
        return { ok: true, data: r };
    }
    catch (e) {
        return { ok: false, error: e.message };
    }
});
exports.accommodation_pick = accommodation_pick;
const accommodation_create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const r = yield accommodation_1.Accommodation.create(req.$query);
        return { ok: true, data: r };
    }
    catch (e) {
        return { ok: false, error: e.message };
    }
});
exports.accommodation_create = accommodation_create;
const accommodation_update = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const r = yield accommodation_1.Accommodation.update(req.$query);
        return { ok: true, data: r };
    }
    catch (e) {
        return { ok: false, error: e.message };
    }
});
exports.accommodation_update = accommodation_update;
const accommodation_delete = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = Number(req.$query.id || 0);
        if (!id)
            return { ok: false, error: 'invalid id' };
        yield accommodation_1.Accommodation.delete(id);
        return { ok: true };
    }
    catch (e) {
        return { ok: false, error: e.message };
    }
});
exports.accommodation_delete = accommodation_delete;
function accommodation_dashboard(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const stats = yield accommodation_1.Accommodation.getStats();
            return { ok: true, total: stats.total, available_count: stats.available, unavailable_count: stats.unavailable };
        }
        catch (error) {
            return { ok: false, error: error.message };
        }
    });
}
;
//# sourceMappingURL=accommodation.js.map