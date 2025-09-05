"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.route = void 0;
//backend/net/route.ts
const guest_1 = require("./controller/guest");
const host_1 = require("./controller/host");
const accommodation_1 = require("./controller/accommodation");
const placement_1 = require("./controller/placement");
const log_1 = require("./controller/log");
const request_1 = require("./request");
const UserRepository_1 = require("../data/user/UserRepository");
exports.route = {
    '/': 'Home',
    '/api/user/find': (req, res) => {
        const token = req.$query.token;
        if (!token) {
            return { ok: false, error: 'You need login' };
        }
        return {
            ok: true,
            user: (0, UserRepository_1.findUserByToken)(token),
        };
    },
    '/api/log/list': log_1.log_list,
    '/api/guest/create': guest_1.guest_create,
    '/api/guest/delete': (0, request_1.requireRole)('admin')(guest_1.guest_delete),
    '/api/guest/update': guest_1.guest_update,
    '/api/guest/list': guest_1.guest_list,
    '/api/guest/pick': guest_1.guest_pick,
    '/api/guest-dashboard': guest_1.guest_dashboard,
    '/api/host/create': host_1.host_create,
    '/api/host/delete': (0, request_1.requireRole)('admin')(host_1.host_delete),
    '/api/host/update': host_1.host_update,
    '/api/host/list': host_1.host_list,
    '/api/host/pick': host_1.host_pick,
    // '/api/host-stats': host_stats,
    '/api/host/list-by-accommodations': host_1.host_list_by_accommodation,
    '/api/host-dashboard': host_1.host_dashboard,
    '/api/accommodation/create': accommodation_1.accommodation_create,
    '/api/accommodation/delete': (0, request_1.requireRole)('admin')(accommodation_1.accommodation_delete),
    '/api/accommodation/update': accommodation_1.accommodation_update,
    '/api/accommodation/list': accommodation_1.accommodation_list,
    '/api/accommodation/pick': accommodation_1.accommodation_pick,
    // '/api/accommodation-stats': accommodation_stats,
    // '/api/accommodation/list-by-host': accommodation_list_by_host,
    '/api/accommodation-dashboard': accommodation_1.accommodation_dashboard,
    '/api/placement/create': placement_1.placement_create,
    '/api/placement/delete': (0, request_1.requireRole)('admin')(placement_1.placement_delete),
    '/api/placement/update': placement_1.placement_update,
    '/api/placement/list': placement_1.placement_list,
    '/api/placement/pick': placement_1.placement_pick,
    // '/api/placement/check-conflicts': placement_check_conflicts,
    '/api/placement/list-by-accommodation': placement_1.placement_list_by_accommodation,
    '/api/placement/list-by-guest': placement_1.placement_list_by_guest,
    '/api/placement-dashboard': placement_1.placement_dashboard,
};
//# sourceMappingURL=route.js.map