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
exports.log_list = void 0;
const log_1 = require("../../data/model/log");
const log_list = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const q = req.$query;
        const page = parseInt(q.page) || 1;
        const limit = parseInt(q.limit) || 15;
        const desc = q.desc !== 'false';
        const keyword = q.keyword;
        const rows = yield log_1.Log.list(page, limit, 'operation_time', desc, keyword);
        const total = yield log_1.Log.count(keyword);
        return { ok: true, data: rows, total };
    }
    catch (error) {
        return { ok: false, error: error.message };
    }
});
exports.log_list = log_list;
//# sourceMappingURL=log.js.map