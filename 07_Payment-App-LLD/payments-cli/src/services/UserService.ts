import { STARTING_BALANCE } from "../config/constants";
import { User } from "../domain/User";
import { AppError } from "../errors/AppError";
import { UserRepository } from "../repositories/UserRepository";
import { PasswordHasher } from "../utils/PasswordHasher";

const PHONE_REG = /^\d{10}$/;
const EMAIL_REG = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class UserService {
  constructor(
    private users: UserRepository,
    private hasher: PasswordHasher,
  ) {}

  register(phone: string, password: string): User {
    if (!PHONE_REG.test(phone))
      throw new AppError("Phone must be exactly 10 digits");

    if (!password || password.length < 6)
      throw new AppError("Password must be at least 6 characters");

    if (this.users.findByPhone(phone))
      throw new AppError("Phone number already registered");

    const user = new User(phone, this.hasher.hash(password), STARTING_BALANCE);
    return this.users.save(user);
  }

  updateProfile(userId: number, name: string, email: string): User {
    const user = this.users.findById(userId);

      if (!user)
          throw new AppError(`User ${userId} not found`);
      
      if (!name || !name.trim())
          throw new AppError("Name cannot be empty");
      
      if (!EMAIL_REG.test(email))
          throw new AppError("Invalid email");
      
      user.name = name.trim();
      user.email = email;
      return this.users.save(user);
  }
}


