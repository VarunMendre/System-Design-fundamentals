import { User } from "../domain/User";
import { AppError } from "../errors/AppError";
import { UserRepository } from "./UserRepository";

export class InMemoryUserRepository implements UserRepository {
  private byId = new Map<number, User>();
  private byPhone = new Map<string, User>();
  private nextId = 1;

  save(user: User): User {
    if (user.id === 0) {
      if (this.byPhone.has(user.phone)) {
        throw new AppError("Phone number already registered");
      }

      user.id = this.nextId++;
      this.byPhone.set(user.phone, user);
    }

    this.byId.set(user.id, user);
    return user;
  }

  findById(id: number): User | undefined {
    return this.byId.get(id);
  }

  findByPhone(phone: string): User | undefined {
    return this.byPhone.get(phone);
  }
}
