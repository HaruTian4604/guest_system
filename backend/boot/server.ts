import { app_config } from '../config/app';
import { Invalid_argument } from '../error/invalid_argument';
import { parse_request, parse_route } from '../net/request';

const http = require('http');

export async function create_server() {

  const server = http.createServer(async (request, response) => {
    parse_request(request);
    let body;
    try {
      body = await parse_route(request, response);
    } catch (e) {
      body = { ok: false };
      if (e instanceof Invalid_argument) {
        body.message = e.message;
        response.statusCode = 400;
      } else {
        body.message = 'Internal error';
        response.statusCode = 500;
      }

      response.setHeader('content-type', 'application/json');
      body = JSON.stringify(body);
    }

    response.setHeader('access-control-allow-origin', '*');
    response.end(body);
  });
  return server;
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
