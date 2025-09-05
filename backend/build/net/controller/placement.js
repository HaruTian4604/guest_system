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
exports.placement_list_by_guest = exports.placement_list_by_accommodation = exports.placement_pick = exports.placement_list = exports.placement_delete = exports.placement_update = exports.placement_create = void 0;
exports.placement_dashboard = placement_dashboard;
// backend/net/controller/placement.ts
const placement_1 = require("../../data/model/placement");
const placement_create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const r = yield placement_1.Placement.create(req.$query);
        return { ok: true, data: r };
    }
    catch (e) {
        return { ok: false, error: e.message };
    }
});
exports.placement_create = placement_create;
const placement_update = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const r = yield placement_1.Placement.update(req.$query);
        return { ok: true, data: r };
    }
    catch (e) {
        return { ok: false, error: e.message };
    }
});
exports.placement_update = placement_update;
const placement_delete = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = Number(req.$query.id || 0);
        if (!id)
            return { ok: false, error: 'invalid id' };
        yield placement_1.Placement.delete(id);
        return { ok: true };
    }
    catch (e) {
        return { ok: false, error: e.message };
    }
});
exports.placement_delete = placement_delete;
const placement_list = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const q = req.$query || {};
        const page = Math.max(1, parseInt(String(q.page || '1'), 10));
        const limit = Math.max(1, Math.min(100, parseInt(String(q.limit || '10'), 10)));
        const order = String(q.order_by || 'start_date');
        const desc = String(q.desc || 'true') === 'true';
        const keyword = (q.keyword || '').trim();
        const [rows, total] = yield Promise.all([
            placement_1.Placement.list(page, limit, order, desc, keyword),
            placement_1.Placement.count(keyword),
        ]);
        return { ok: true, data: rows, total, page, limit };
    }
    catch (e) {
        return { ok: false, error: e.message };
    }
});
exports.placement_list = placement_list;
const placement_pick = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = Number(req.$query.id || 0);
        if (!id)
            return { ok: false, error: 'invalid id' };
        const r = yield placement_1.Placement.pick(id);
        if (!r)
            return { ok: false, error: 'not found' };
        return { ok: true, data: r };
    }
    catch (e) {
        return { ok: false, error: e.message };
    }
});
exports.placement_pick = placement_pick;
const placement_list_by_accommodation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accommodation_id = Number(req.$query.accommodation_id || 0);
        if (!accommodation_id)
            return { ok: false, error: 'invalid accommodation_id' };
        const rows = yield placement_1.Placement.listByAccommodation(accommodation_id);
        return { ok: true, data: rows };
    }
    catch (e) {
        return { ok: false, error: e.message };
    }
});
exports.placement_list_by_accommodation = placement_list_by_accommodation;
const placement_list_by_guest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const guest_id = Number(req.$query.guest_id || 0);
        if (!guest_id)
            return { ok: false, error: 'invalid guest_id' };
        const rows = yield placement_1.Placement.listByGuest(guest_id);
        return { ok: true, data: rows };
    }
    catch (e) {
        return { ok: false, error: e.message };
    }
});
exports.placement_list_by_guest = placement_list_by_guest;
function placement_dashboard(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const items = yield placement_1.Placement.getEndingsNext12Months();
            return { ok: true, items: items };
        }
        catch (error) {
            return { ok: false, error: error.message };
        }
    });
}
;
//# sourceMappingURL=placement.js.map