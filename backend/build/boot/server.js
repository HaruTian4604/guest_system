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
exports.create_server = create_server;
exports.boot = boot;
const app_1 = require("../config/app");
const invalid_argument_1 = require("../error/invalid_argument");
const request_1 = require("../net/request");
const http = require('http');
function create_server() {
    return __awaiter(this, void 0, void 0, function* () {
        const server = http.createServer((request, response) => __awaiter(this, void 0, void 0, function* () {
            response.setHeader('Access-Control-Allow-Origin', '*');
            response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
            response.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Auth-Token');
            if (request.method === 'OPTIONS') {
                response.statusCode = 204;
                response.end();
                return;
            }
            (0, request_1.parse_request)(request);
            try {
                let body = yield (0, request_1.parse_route)(request, response);
                if (typeof body !== 'string') {
                    response.setHeader('content-type', 'application/json');
                    body = JSON.stringify(body);
                }
                response.end(body);
            }
            catch (e) {
                const out = { ok: false };
                if (e instanceof invalid_argument_1.Invalid_argument) {
                    out.message = e.message;
                    response.statusCode = 400;
                }
                else {
                    out.message = 'Internal error';
                    response.statusCode = 500;
                }
                response.setHeader('content-type', 'application/json');
                response.end(JSON.stringify(out));
            }
        }));
        return server;
    });
}
/**
 * start Server
 */
function boot() {
    return __awaiter(this, void 0, void 0, function* () {
        const server = yield create_server();
        const { host, port } = app_1.app_config;
        server.listen(port, host);
        console.log(`Server is alive at: http://${host}:${port}`);
    });
}
//# sourceMappingURL=server.js.map