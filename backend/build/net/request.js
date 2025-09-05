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
exports.getCurrentUser = getCurrentUser;
exports.parse_request = parse_request;
exports.parse_route = parse_route;
exports.requireRole = requireRole;
const querystring_1 = require("querystring");
const route_1 = require("./route");
const UserRepository_1 = require("../data/user/UserRepository");
const node_async_hooks_1 = require("node:async_hooks");
const RequestContext = new node_async_hooks_1.AsyncLocalStorage();
function getCurrentUser() {
    var _a;
    return (_a = RequestContext.getStore()) === null || _a === void 0 ? void 0 : _a.user;
}
function parse_request(request) {
    var _a;
    const url = request.url; // http://localhost:8080/add?a=1&b=2
    const parts = url.split('?'); // ['/add', 'a=1&b=2']
    const path = parts[0]; // '/add'
    const query = parts[1] || ''; // 'a=1&b=2'
    const q = (0, querystring_1.decode)(query); // 'a=1&b=2' --> {a: 1, b: 2}
    request.$query = q;
    request.$path = path;
    const headerToken = (_a = request.headers) === null || _a === void 0 ? void 0 : _a['x-auth-token'];
    const token = (typeof headerToken === 'string' && headerToken.trim()) || (typeof q.token === 'string' && q.token.trim());
    if (token) {
        request.$token = token;
        try {
            const user = (0, UserRepository_1.findUserByToken)(token);
            if (user) {
                request.$user = user;
            }
            else {
                request.$user = undefined;
            }
        }
        catch (e) {
            request.$user = undefined;
        }
    }
    else {
        request.$token = undefined;
        request.$user = undefined;
    }
}
/**
 * parse route
 */
function parse_route(request, response) {
    return __awaiter(this, void 0, void 0, function* () {
        let def = route_1.route[request.$path];
        let body;
        if (def === undefined) {
            response.statusCode = 404;
            body = 'Not found';
        }
        else {
            switch (typeof def) {
                case 'string':
                    body = def;
                    break;
                case 'function':
                    body = yield RequestContext.run({ user: request.$user }, () => __awaiter(this, void 0, void 0, function* () {
                        return yield def(request, response);
                    }));
                    break;
            }
        }
        switch (typeof body) {
            case 'object':
                body = JSON.stringify(body);
                response.setHeader('content-type', 'application/json');
                break;
        }
        response.setHeader('access-control-allow-origin', '*');
        return body;
    });
}
// 权限检查中间件
function requireRole(requiredRole) {
    return (handler) => {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            if (!req.$user.token) {
                res.statusCode = 401;
                return { ok: false, error: 'Authentication required' };
            }
            if (req.$user.roleName !== requiredRole) {
                res.statusCode = 403;
                return {
                    ok: false,
                    error: `Access denied. Requires ${requiredRole} role.`
                };
            }
            return yield handler(req, res);
        });
    };
}
//# sourceMappingURL=request.js.map