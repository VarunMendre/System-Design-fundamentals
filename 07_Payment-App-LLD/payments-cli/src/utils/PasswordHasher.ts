import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export interface PasswordHasher {
  hash(plain: string): string;
  verify(plain: string, stored: string): boolean;
}

export class ScryptPasswordHasher implements PasswordHasher {
  hash(plain: string): string {
    const salt = randomBytes(16).toString("hex");
    const key = scryptSync(plain, salt, 32).toString("hex");
    return `${salt}:${key}`;
  }

  verify(plain: string, stored: string): boolean {
    const [salt, key] = stored.split(":");
    const attempt = scryptSync(plain, salt, 32);

    return timingSafeEqual(attempt, Buffer.from(key, "hex"));
  }
}
