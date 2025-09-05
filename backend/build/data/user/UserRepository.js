"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserByToken = findUserByToken;
exports.getAllUsers = getAllUsers;
exports.getCurrentUser = getCurrentUser;
exports.listAllUsers = listAllUsers;
// backend/data/user/UserRepository.ts
const userList_json_1 = __importDefault(require("../userList.json"));
const Admin_1 = require("./Admin");
const Caseworker_1 = require("./Caseworker");
const users = new Map();
Object.entries(userList_json_1.default).forEach(([key, data]) => {
    const id = parseInt(key);
    const { name, token, roleIndex } = data;
    switch (roleIndex) {
        case 1:
            users.set(id, new Admin_1.Admin(id, name, token));
            break;
        case 2:
            users.set(id, new Caseworker_1.Caseworker(id, name, token));
            break;
        default:
            throw new Error(`Unknown role index: ${roleIndex}`);
    }
});
function findUserByToken(token) {
    for (const user of users.values()) {
        if (user.token == token) {
            return user;
        }
    }
    return null;
}
function getAllUsers() {
    return Array.from(users.values());
}
function getCurrentUser(token) {
    const user = findUserByToken(token);
    if (!user)
        return null;
    return {
        token: user.token,
        name: user.name,
        roleIndex: user.roleIndex,
        roleName: user.roleName
    };
}
function listAllUsers() {
    return Array.from(users.values()).map(u => ({
        token: u.token,
        name: u.name,
        roleIndex: u.roleIndex,
        roleName: u.roleName
    }));
}
//# sourceMappingURL=UserRepository.js.map