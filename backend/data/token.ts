import { createHmac } from 'crypto';
import { get_all, set_all } from './user';

export async function create_token(username) {
  const token = generate_token(username);
  const all = await get_all();
  all.users[username].tokens.push(token);
  await set_all(all);
  return token;
}

/**
 * 生成令牌
 */
export function generate_token(username) {
  const hash = sha256(username + Math.random());
  return hash;
}

/**
 * 使用sha256将传入的字符哈希混淆
 * @param str
 */
function sha256(str) {
  return createHmac('sha256', 'yo').update(str).digest('hex');
}
