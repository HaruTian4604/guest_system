import { app_config } from '../config/app';
import { Invalid_argument } from '../error/invalid_argument';
import { parse_request, parse_route } from '../net/request';

const http = require('http');

export async function create_server() {
  const server = http.createServer(async (request, response) => {
    // ---- CORS 统一处理（含预检）----
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Auth-Token')
    if (request.method === 'OPTIONS') {
      response.statusCode = 204
      response.end()
      return
    }
    // --------------------------------

    parse_request(request)
    try {
      let body = await parse_route(request, response)
      if (typeof body !== 'string') {
        response.setHeader('content-type', 'application/json')
        body = JSON.stringify(body)
      }
      response.end(body)
    } catch (e) {
      const out: any = { ok: false }
      if (e instanceof Invalid_argument) {
        out.message = e.message
        response.statusCode = 400
      } else {
        out.message = 'Internal error'
        response.statusCode = 500
      }
      response.setHeader('content-type', 'application/json')
      response.end(JSON.stringify(out))
    }
  })
  return server
}


/**
 * start Server
 */
export async function boot() {
  const server = await create_server();

  const { host, port } = app_config;
  server.listen(port, host);
  console.log(`Server is alive at: http://${host}:${port}`);
}
