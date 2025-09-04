// backend/data/user/User.ts
export abstract class User {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly token: string,
    public readonly roleIndex: number,
    public readonly roleName: string
  ) {}

  abstract canPerform(action: string): boolean;

  getUserInfo() {
    return {
      id: this.id,
      name: this.name,
      token: this.token,
      roleIndex: this.roleIndex,
      roleName: this.roleName
    };
  }
}
