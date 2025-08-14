import { decode } from 'querystring';
import { route } from './route';

export const users = {
  1: { name: 'iamadmin', password: '123', token: '31415926', role: 'admin' },
  2: { name: 'iamuser', password: '123', token: '5358979', role: 'user' },
};

function find_user_by_token(token) {
  for (let id in users) {
    const user = users[id];
    if (user.token === token) {
      return user;
    }
  }
  return null; // 明确返回 null 如果没找到
}

// 权限检查中间件
export function requireRole(role: string) {
  return (handler: Function) => {
    return async (req, res) => {
      // 如果没有用户登录
      if (!req.$user) {
        res.statusCode = 401;
        return { ok: false, error: 'Authentication required' };
      }

      // 如果用户角色不符合要求
      if (req.$user.role !== role) {
        res.statusCode = 403;
        return {
          ok: false,
          error: `Access denied. Requires ${role} role.`
        };
      }

      // 权限通过，执行原始处理函数
      return await handler(req, res);
    };
  };
}

/**
 * parse request
 */
export function parse_request(request) {
  const url = request.url; // http://localhost:8080/add?a=1&b=2
  const parts = url.split('?'); // ['/add', 'a=1&b=2']
  const path = parts[0]; // '/add'
  const query: string = parts[1]; // 'a=1&b=2'
  const q: any = decode(query); // 'a=1&b=2' --> {a: 1, b: 2}
  request.$query = q;
  request.$path = path;
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

  response.setHeader('access-control-allow-origin','*');

  return body;
}

/**
 * 获取当前用户信息
 */
export function get_current_user(token: string) {
  const user = find_user_by_token(token);
  // console.log(user);
  if (!user) {
    return { ok: false, error: 'Invalid user token' };
  }
  return { ok: true, user };
}

/**
 * 获取所有用户信息 (简化版)
 */
export function list_users() {
  return Object.values(users).map(u => ({
    token: u.token,
    name: u.name,
    role: u.role
  }));
}
