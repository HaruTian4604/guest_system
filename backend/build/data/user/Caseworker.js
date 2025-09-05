"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Caseworker = void 0;
// backend/data/user/Caseworker.ts
const User_1 = require("./User");
class Caseworker extends User_1.User {
    constructor(id, name, token) {
        super(id, name, token, 2, 'caseworker');
    }
    canPerform(action) {
        return !action.includes('delete');
    }
}
exports.Caseworker = Caseworker;
//# sourceMappingURL=Caseworker.js.map