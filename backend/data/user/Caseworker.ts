// backend/data/user/Caseworker.ts
import { User } from './User';

export class Caseworker extends User {
  constructor(id: number, name: string, token: string) {
    super(id, name, token, 2, 'caseworker');
  }

  canPerform(action: string): boolean {
    return !action.includes('delete');
  }
}
