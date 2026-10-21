import { describe, it, expect, vi } from "vitest";
import { ScryptPasswordHasher } from "../src/utils/PasswordHasher";
import { buildApp } from "./helper";

describe("ScryptPasswordHasher", () => {
  const h = new ScryptPasswordHasher();

  it("verifies the right password and rejects a wrong one", () => {
    const stored = h.hash("secret1");
    expect(h.verify("secret1", stored)).toBe(true);
    expect(h.verify("wrong", stored)).toBe(false);
  });

  it("salts: the same password hashes differently each time", () => {
    expect(h.hash("secret1")).not.toBe(h.hash("secret1"));
  });
});

describe("CommandParser error handling", () => {
  it("hides unexpected (non-AppError) failures behind a generic message", () => {
    const app = buildApp();
    vi.spyOn(app.userSvc, "register").mockImplementation(() => {
      throw new Error("boom");
    });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(app.cli.execute("RegisterUser 9876543210 secret1")).toBe(
      "Error: something went wrong",
    );
    expect(spy).toHaveBeenCalled(); // the real error is still logged for the developer
  });
});
