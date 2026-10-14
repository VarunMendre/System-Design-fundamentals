import { describe, it, expect, beforeEach } from "vitest";
import { UserService } from "../src/services/UserService";
import { InMemoryUserRepository } from "../src/repositories/InMemoryUserRepository";
import { ScryptPasswordHasher } from "../src/utils/PasswordHasher";
import { STARTING_BALANCE } from "../src/config/constants";

describe("UserService", () => {
  let svc: UserService;

  beforeEach(() => {
    svc = new UserService(
      new InMemoryUserRepository(),
      new ScryptPasswordHasher(),
    );
  });

  it("registers a user with hashed password and starting balance", () => {
    const u = svc.register("9876543210", "secret1");
    expect(u.id).toBe(1);
    expect(u.balance).toBe(STARTING_BALANCE);
    expect(u.passwordHash).not.toContain("secret1");
  });

  it("assigns increasing ids", () => {
    expect(svc.register("9876543210", "secret1").id).toBe(1);
    expect(svc.register("9876543211", "secret1").id).toBe(2);
  });

  it("rejects duplicate phone", () => {
    svc.register("9876543210", "secret1");
    expect(() => svc.register("9876543210", "other12")).toThrow(
      "already registered",
    );
  });

  it("rejects bad phone and short password", () => {
    expect(() => svc.register("123", "secret1")).toThrow("10 digits");
    expect(() => svc.register("9876543210", "123")).toThrow("at least 6");
  });

  it("updates name and email but never the phone", () => {
    const u = svc.register("9876543210", "secret1");
    const updated = svc.updateProfile(u.id, " Asha ", "asha@example.com");
    expect(updated.name).toBe("Asha");
    expect(updated.email).toBe("asha@example.com");
    expect(updated.phone).toBe("9876543210");
  });

  it("rejects update for unknown user or invalid input", () => {
    const u = svc.register("9876543210", "secret1");
    expect(() => svc.updateProfile(99, "A", "a@b.com")).toThrow("not found");
    expect(() => svc.updateProfile(u.id, "", "a@b.com")).toThrow("Name");
    expect(() => svc.updateProfile(u.id, "A", "nope")).toThrow("email");
  });
});
