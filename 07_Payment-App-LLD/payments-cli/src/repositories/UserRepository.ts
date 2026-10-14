import { User } from "../domain/User";

export interface UserRepository {
  save(user: User): User;
  findById(id: number): User | undefined;
  findByPhone(phone: string): User | undefined;
}
