"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Admin = void 0;
// backend/data/user/Admin.ts
const User_1 = require("./User");
class Admin extends User_1.User {
    constructor(id, name, token) {
        super(id, name, token, 1, 'admin');
    }
    canPerform(action) {
        return true;
    }
}
exports.Admin = Admin;
//# sourceMappingURL=Admin.js.map