import { decode } from 'querystring';
import { route } from './route';
import { findUserByToken } from '../data/user/UserRepository';

export function parse_request(request: any) {
  const url = request.url;// http://localhost:8080/add?a=1&b=2
  const parts = url.split('?'); // ['/add', 'a=1&b=2']
  const path = parts[0]; // '/add'
  const query: string = parts[1] || '';// 'a=1&b=2'
  const q: any = decode(query); // 'a=1&b=2' --> {a: 1, b: 2}

  request.$query = q;
  request.$path = path;

  // 添加认证头处理. 仅设置token，不查找用户
  // const authHeader = request.headers['x-auth-token'];
  // if (authHeader) {
  //   request.$token = authHeader;
  // }
  const headerToken = request.headers?.['x-auth-token'];
  const token = (typeof headerToken === 'string' && headerToken.trim()) || (typeof q.token === 'string' && q.token.trim());

  if (token) {
    request.$token = token;

    try {
      const user = findUserByToken(token);
      if (user) {
        // 找到用户就挂到 req.$user，供 requireRole 等中间件使用
        request.$user = user;
      } else {
        // token 无效时不要抛错，这里只是不挂 $user，让后续的权限中间件去返回 401/403
        request.$user = undefined;
      }
    } catch (e) {
      // 查库异常同样不在这里终止请求，交给后续逻辑处理
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
        body = await def(request, response);
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
      // 如果没有用户登录
      if (!req.$user.token) {
        res.statusCode = 401;
        return { ok: false, error: 'Authentication required' };
      }

      // 检查角色权限
      if (req.$user.roleName !== requiredRole) {
        res.statusCode = 403;
        return {
          ok: false,
          error: `Access denied. Requires ${requiredRole} role.`
        };
      }

      // 权限通过，执行原始处理函数
      return await handler(req, res);
    };
  };
}
