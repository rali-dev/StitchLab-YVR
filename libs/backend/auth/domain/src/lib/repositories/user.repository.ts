import { UserEntity } from '../entities/user.entity.js';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

/** Persistenz-Port der Auth-Domäne - formuliert ohne Prisma-Begriffe. */
export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;

  /** Der Anmeldeweg: E-Mail ist der Benutzername. */
  findByEmail(email: string): Promise<UserEntity | null>;

  save(user: UserEntity): Promise<UserEntity>;
}
