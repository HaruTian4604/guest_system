// backend/data/user/Admin.ts
import { User } from './User';

export class Admin extends User {
  constructor(id: number, name: string, token: string) {
    super(id, name, token, 1, 'admin');
  }

  // 管理员拥有所有权限
  canPerform(action: string): boolean {
    return true;
  }
}
