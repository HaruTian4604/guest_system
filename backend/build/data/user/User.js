"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
// backend/data/user/User.ts
class User {
    constructor(id, name, token, roleIndex, roleName) {
        this.id = id;
        this.name = name;
        this.token = token;
        this.roleIndex = roleIndex;
        this.roleName = roleName;
    }
    getUserInfo() {
        return {
            id: this.id,
            name: this.name,
            token: this.token,
            roleIndex: this.roleIndex,
            roleName: this.roleName
        };
    }
}
exports.User = User;
//# sourceMappingURL=User.js.map