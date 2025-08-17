// backend/data/user/Caseworker.ts
import { User } from './User';

export class Caseworker extends User {
  constructor(id: number, name: string, token: string) {
    super(id, name, token, 2, 'caseworker');
  }

  // 案例工作者没有删除权限
  canPerform(action: string): boolean {
    return !action.includes('delete');
  }
}
