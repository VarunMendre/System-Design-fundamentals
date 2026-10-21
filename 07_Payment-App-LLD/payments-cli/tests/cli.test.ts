import { describe, it, expect, beforeEach } from "vitest";
import { CommandParser } from "../src/cli/CommandParser";
import { buildApp } from "./helper";

describe("CommandParser", () => {
  let cli: CommandParser;

  beforeEach(() => {
    cli = buildApp().cli;
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

  it("creates a wallet transaction in PENDING state", () => {
    cli.execute("RegisterUser 9876543210 secret1");
    cli.execute("RegisterUser 9876543211 secret2");
    expect(cli.execute("CreateTransaction PAYTM 1 2 500")).toBe(
      "Transaction created. id=1 type=WALLET_TO_WALLET amount=₹500.00 status=PENDING",
    );
  });

  it("creates a bank transaction and validates the amount format", () => {
    cli.execute("RegisterUser 9876543210 secret1");
    expect(
      cli.execute("CreateTransaction BANK 1 123456789012 HDFC0001234 250.50"),
    ).toContain("amount=₹250.50");
    expect(
      cli.execute("CreateTransaction BANK 1 123456789012 HDFC0001234 abc"),
    ).toBe("Error: Invalid amount: abc");
  });
});
