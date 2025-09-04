import { decode } from 'querystring';
import { route } from './route';
import { findUserByToken } from '../data/user/UserRepository';

import { AsyncLocalStorage } from 'node:async_hooks';
const RequestContext = new AsyncLocalStorage<{ user?: any }>();

export function getCurrentUser() {
  return RequestContext.getStore()?.user;
}

export function parse_request(request: any) {
  const url = request.url;// http://localhost:8080/add?a=1&b=2
  const parts = url.split('?'); // ['/add', 'a=1&b=2']
  const path = parts[0]; // '/add'
  const query: string = parts[1] || '';// 'a=1&b=2'
  const q: any = decode(query); // 'a=1&b=2' --> {a: 1, b: 2}

  request.$query = q;
  request.$path = path;

  const headerToken = request.headers?.['x-auth-token'];
  const token = (typeof headerToken === 'string' && headerToken.trim()) || (typeof q.token === 'string' && q.token.trim());

  if (token) {
    request.$token = token;

    try {
      const user = findUserByToken(token);
      if (user) {
        request.$user = user;
      } else {
        request.$user = undefined;
      }
    } catch (e) {
      request.$user = undefined;
    }
  } else {
    request.$token = undefined;
    request.$user = undefined;
  }

}

/**
 * parse route
 */
export async function parse_route(request, response) {
  let def: string | Function = route[request.$path];
  let body: string;

  if (def === undefined) {
    response.statusCode = 404;
    body = 'Not found';
  } else {
    switch (typeof def) {
      case 'string':
        body = def;
        break;
      case 'function':
        body = await RequestContext.run({ user: request.$user }, async () => {
          return await def(request, response);
        });
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
}

// 权限检查中间件
export function requireRole(requiredRole: string) {
  return (handler: Function) => {
    return async (req: any, res: any) => {
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

      return await handler(req, res);
    };
  };
}
