// backend/data/user/UserRepository.ts
import userList from '../userList.json';
import { Admin } from './Admin';
import { Caseworker } from './Caseworker';
import { User } from './User';

const users: Map<number, User> = new Map();

Object.entries(userList).forEach(([key, data]) => {
  const id = parseInt(key);
  const { name, token, roleIndex } = data;

  switch(roleIndex) {
    case 1:
      users.set(id, new Admin(id, name, token));
      break;
    case 2:
      users.set(id, new Caseworker(id, name, token));
      break;
    default:
      throw new Error(`Unknown role index: ${roleIndex}`);
  }
});

export function findUserByToken(token: string): User | null {
  for (const user of users.values()) {
    if (user.token == token) {
      return user;
    }
  }
  return null;
}

export function getAllUsers(): User[] {
  return Array.from(users.values());
}

export function getCurrentUser(token: string) {
  const user = findUserByToken(token);
  if (!user) return null;

  return {
    token: user.token,
    name: user.name,
    roleIndex: user.roleIndex,
    roleName: user.roleName
  };
}

export function listAllUsers() {
  return Array.from(users.values()).map(u => ({
    token: u.token,
    name: u.name,
    roleIndex: u.roleIndex,
    roleName: u.roleName
  }));
}
