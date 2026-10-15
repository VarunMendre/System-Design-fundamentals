import { describe, it, expect, beforeEach } from "vitest";
import { CommandParser } from "../src/cli/CommandParser";
import { UserService } from "../src/services/UserService";
import { InMemoryUserRepository } from "../src/repositories/InMemoryUserRepository";
import { ScryptPasswordHasher } from "../src/utils/PasswordHasher";

describe("CommandParser", () => {
  let cli: CommandParser;

  beforeEach(() => {
    const svc = new UserService(
      new InMemoryUserRepository(),
      new ScryptPasswordHasher(),
    );
    cli = new CommandParser(svc);
  });

  it("registers a user", () => {
    expect(cli.execute("RegisterUser 9876543210 secret1")).toBe(
      "User registered. id=1",
    );
  });

  it("is case-insensitive and ignores extra spaces", () => {
    expect(cli.execute("  registeruser   9876543210   secret1 ")).toContain(
      "id=1",
    );
  });

  it("reports business errors instead of crashing", () => {
    cli.execute("RegisterUser 9876543210 secret1");
    expect(cli.execute("RegisterUser 9876543210 secret1")).toBe(
      "Error: Phone number already registered",
    );
  });

  it("shows usage on wrong argument count", () => {
    expect(cli.execute("RegisterUser 9876543210")).toContain("Usage");
  });

  it("updates a profile, allowing spaces in the name", () => {
    cli.execute("RegisterUser 9876543210 secret1");
    expect(cli.execute("UpdateUser 1 Asha Rao asha@example.com")).toBe(
      "Profile updated. id=1 name=Asha Rao email=asha@example.com",
    );
  });

  it("rejects a non-numeric user id", () => {
    expect(cli.execute("UpdateUser abc Asha a@b.com")).toBe(
      "Error: Invalid user_id: abc",
    );
  });

  it("handles unknown and empty commands", () => {
    expect(cli.execute("Foo bar")).toBe("Unknown command: Foo");
    expect(cli.execute("   ")).toBe("");
  });
});
