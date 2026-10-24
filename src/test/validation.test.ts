import { describe, expect, it } from "vitest";
import { signupSchema } from "@/lib/validation";
import { safeRedirect } from "@/lib/auth";

describe("signup rules", () => {
  it("rejects passwords shorter than 8 characters", () => {
    expect(signupSchema.safeParse({ fullName: "A", email: "a@b.co", password: "1234567" }).success).toBe(false);
  });
  it("ignores any role field sent with signup", () => {
    const r = signupSchema.parse({ fullName: "A", email: "a@b.co", password: "12345678", role: "admin" } as never);
    expect("role" in r).toBe(false);
  });
});

describe("post-login redirect", () => {
  it("blocks external destinations", () => {
    expect(safeRedirect("//evil.com")).toBe("/app");
    expect(safeRedirect("https://evil.com")).toBe("/app");
    expect(safeRedirect("/app/teams")).toBe("/app/teams");
  });
});
